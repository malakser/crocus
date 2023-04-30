import {Cluster as Cluster} from 'puppeteer-cluster';
import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import * as fs from 'fs';
//import * as puppeteer from 'puppeteer';
import * as readline from 'readline';


const log = x => console.log(x);



const startingPage = 1130;

async function* getHosts() {
  //TODO skip already crawled
  const file = readline.createInterface({
      input: fs.createReadStream('../data/cc-hosts.txt'),
      output: process.stdout,
      terminal: false
  });
  let i = 0;
  for await (const l of file) {
    if (i == startingPage) break;
    i++;
  }
  for await (const l of file) {
    yield getDomain(l);
  }
}
const hosts = getHosts();



//why worker gets frozen on page 1136?
//why when there are 2 pages, it doesn't freeze, but doesn't crawl the page either?
//why is one worker available before it finishes crawling?
//print all exceptions?

const cc = 1;

const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  //concurrency: Cluster.CONCURRENCY_BROWSER,
  maxConcurrency: cc,
});


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


const blockers = await Promise.all(Array.from(Array(cc), genBlocker));
log('blockers initialized');




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


function getDomain(l) {
  const fields = l.split('\t');
  return {
    domain: fields[4].split('.').reverse().join('.'),
    hc: fields[1],
    pr: fields[3],
  };
}


let i = 0;
await cluster.task(async ({worker, page, data: host}) => { // "data: host" wut?
  //const res = await isLegit(page, 'https://' + host.domain, blockers[worker.id]);
  const url = 'https://' + host.domain;
  const res = await visit(page, url);
  i++;
  console.log(`[worker ${worker.id}]: `, startingPage + i, res, url);
  if (res[1] === true) { 
    // await fs.promises.appendFile('../data/hosts.txt', `${host.domain}, ${host.hc}, ${host.pr}\n`); //why can't use async stuff?
  }
  const next = await hosts.next();
  if (!next.done) cluster.queue(next.value);
});




for (let j=0; j<cc; j++) {
  cluster.queue((await hosts.next()).value);	
}

