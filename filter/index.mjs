import {Cluster as Cluster} from 'puppeteer-cluster';
import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import * as fs from 'fs';
//import * as puppeteer from 'puppeteer';
import * as readline from 'readline';
import { parseArgs } from 'node:util';


const {values} = parseArgs({
  options: {
    'concurrency': {
      type: 'string',
      short: 'c',
    },
    'starting-host': {
      type: 'string',
      short: 's',
    },
    'maxw-wait': {
      type: 'string',
      short: 'w',
    },
  }
});

const startingHost = values['starting-host'] ?? (() => {
  try {
    const text = fs.readFileSync('../data/filter-last.txt', 'utf-8');
    return parseInt(text) + 1;
  } catch (e) {
    return 0; 
  }
})();
const concurrency = parseInt(values['concurrency'] ?? 1);
const maxWait = parseInt(values['max-wait'] ?? 12000);



const log = x => console.log(x);

log([startingHost, concurrency, maxWait]);

function parseHost(l) {
  const fields = l.split('\t');
  return {
    id: parseInt(fields[0]),
    domain: fields[4].split('.').reverse().join('.'),
    hc: fields[1],
    pr: fields[3],
  };
}


async function* getHosts() {
  //TODO skip already crawled
  const file = readline.createInterface({
    input: fs.createReadStream('../data/cc-hosts.txt'),
    terminal: false
  });
  //for await (const l of file) break; //skipping first line
  file[Symbol.asyncIterator]().next();
  for await (const l of file) {
    const host = parseHost(l);
    if (host.id >= startingHost) {
      await fs.promises.writeFile('../data/filter-last.txt', JSON.stringify(host.id));
      yield host;
    }
  }
}
const hosts = getHosts();






async function isLegit(page, url, blocker) {
  await blocker.enableBlockingInPage(page);
  let bl = new Promise((resolve) => {
    blocker.once('request-blocked', (request) => {
      resolve([url, false]);
    });
  });
  let pl = new Promise(async (resolve) => {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded'});
      if (response.status() !== 200) resolve([url, `status - ${response.status()}`]);
    } catch (e) {
      resolve([url, "timed out"]);
    }
    resolve([url, true]);
  });
  let tl = new Promise(async (resolve) => {
    setTimeout(() => {
      //console.log('hard time out');
      resolve([url, 'hard time out']);
    }, 10000)
  })
  return await Promise.race([pl, bl, tl]);
}


async function visit(page, url) {
  log('trying to visit ' + url);
  const pl = new Promise(async resolve => {
    try {
      resolve(await page.goto(url, {waitUntil: 'domcontentloaded'}));
    } catch (e) {
      resolve('error');
    }
  });
  const res = await Promise.race([pl, new Promise(r => setTimeout(() => r('timeout'), 5000))]);
  return res === 'timeout' ? res : res.status();
}





const genBlocker = async () => (
    PuppeteerBlocker.fromLists(
    fetch, 
    fullLists,
    {
      enableCompression: true,
    },
    {
      path: 'engine.bin',
      read: fs.promises.readFile,
      write: fs.promises.writeFile,
    },
  )
);

let lastCompletedTime = 0;

const tasks = Array(concurrency);

const blockers = await Promise.all(Array.from(Array(concurrency), genBlocker));
log('blockers initialized');


async function genCluster() {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    //concurrency: Cluster.CONCURRENCY_BROWSER,
    maxConcurrency: concurrency,
  });
  await cluster.task(async ({worker, page, data: host}) => { // "data: host" wut?
    if (tasks[worker.id]) log('wtf?');
    tasks[worker.id] = host;
    const url = 'https://' + host.domain;
    const res = await isLegit(page, url, blockers[worker.id]);
    //const res = await visit(page, url);
    console.log(`[worker ${worker.id}]:`, host.id, res);
    if (res[1] === true) { 
      await fs.promises.appendFile('../data/hosts.txt', `${host.id} ${host.domain}, ${host.hc}, ${host.pr}\n`); //why can't use async stuff?
      //^^ format it more sanely TODO
    }
    tasks[worker.id] = null;
    lastCompletedTime = Date.now();
    const next = await hosts.next();
    if (!next.done) cluster.queue(next.value);
  });
  return cluster;
}

let cluster;

async function initFoo() {
  cluster = await genCluster();
  lastCompletedTime = Date.now();
  for (let i=0; i<concurrency; i++) {
    cluster.queue((await hosts.next()).value);	
  }
}
await initFoo();


const timeloop = async () => setTimeout(async () => {
  const dt = Date.now() - lastCompletedTime;
  console.log(dt)
  if (dt > maxWait) {
    console.log('something\'s wrong, mate!');
    console.log('unfinished tasks: ', tasks);
    process.exit(-1);
    /*
    await cluster.close();
    initFoo();
    */
  }
  timeloop();
}, 1000);
timeloop();


