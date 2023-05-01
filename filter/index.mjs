import {Cluster as Cluster} from 'puppeteer-cluster';
import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import * as fs from 'fs';
//import * as puppeteer from 'puppeteer';
import * as readline from 'readline';
import { parseArgs } from 'node:util';

/*
const {
  cc,
  startingPage,
} = parseArgs({

});
*/

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

const cc = 3;
const tasks = Array(cc);
let i = 0;

const blockers = await Promise.all(Array.from(Array(cc), genBlocker));
log('blockers initialized');

async function genCluster() {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    //concurrency: Cluster.CONCURRENCY_BROWSER,
    maxConcurrency: cc,
  });
  await cluster.task(async ({worker, page, data: host}) => { // "data: host" wut?
    if (tasks[worker.id]) log('wtf?');
    tasks[worker.id] = host;
    const url = 'https://' + host.domain;
    const res = await isLegit(page, url, blockers[worker.id]);
    //const res = await visit(page, url);
    console.log(`[worker ${worker.id}]: `, startingPage + i, res);
    if (res[1] === true) { 
      await fs.promises.appendFile('../data/hosts.txt', `${host.domain}, ${host.hc}, ${host.pr}\n`); //why can't use async stuff?
    }
    tasks[worker.id] = null;
    lastCompletedTime = Date.now();
    i++;
    const next = await hosts.next();
    if (!next.done) cluster.queue(next.value);
  });
  return cluster;
}

let cluster;

async function initFoo() {
  cluster = await genCluster();
  lastCompletedTime = Date.now();
  for (let j=0; j<cc; j++) {
    cluster.queue((await hosts.next()).value);	
  }
}
await initFoo();

const timeloop = async () => setTimeout(async () => {
  const dt = Date.now() - lastCompletedTime;
  console.log(dt)
  if (dt > 11000) {
    console.log('something\'s wrong, mate!');
    console.log('unfinished tasks: ', tasks);
    fs.writeFile('../data/filter-last.txt', i);
    await cluster.close();
    initFoo();
  }
  timeloop();
}, 1000);
timeloop();



