import {Cluster as Cluster} from 'puppeteer-cluster';
import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import * as fs from 'fs';
//import * as puppeteer from 'puppeteer';
import * as readline from 'readline';

const log = x => console.log(x);


/*
const browser = await puppeteer.launch({
  defaultViewport: null,
  headless: false,
});
*/


async function isLegit(page, url, blocker) {
  await blocker.enableBlockingInPage(page);
  //promise before loading page
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
  let a = await Promise.race([pl, bl, tl]);

  //await blocker.disableBlockingInPage(page);
  //Why cant't r be async?	

  //await page.close();
  //await pl;
  //TODO are those two necessary?
  return a;

}

function getDomain(l) {
  const fields = l.split('\t');
  return {
    domain: fields[4].split('.').reverse().join('.'),
    hc: fields[1],
    pr: fields[3],
  };
}

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


const gen = getHosts();

let i = 0;

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

await cluster.task(async ({worker, page, data: d}) => {
  //const res = await isLegit(page, 'https://' + d.domain, blockers[worker.id]);
  const res = await visit(page, 'https://' + d.domain);
  i++;
  console.log(startingPage + i, res);
  if (res[1] === true) { 
    // await fs.promises.appendFile('../data/hosts.txt', `${d.domain}, ${d.hc}, ${d.pr}\n`); //why can't use async stuff?
  }
  const next = await gen.next();
  if (!next.done) cluster.queue(next.value);
});



for (let j=0; j<cc; j++) {
  cluster.queue((await gen.next()).value);	
}


/*
async function crawlSites() {
  const blocker = await PuppeteerBlocker.fromLists(
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
  );
  for await (const d of gen) {
    try {
      const res = await isLegit('https://' + d.domain, blocker);
      i++;
      console.log(i, res);
      if (res[1] === true) { 
        await fs.promises.appendFile('../data/hosts.txt', `${d.domain}, ${d.hc}, ${d.pr}\n`); //why can't use async stuff
      }
    } catch (e) {
      console.error(e);
    }
  }
}

crawlSites(await browser.newPage());
crawlSites(await browser.newPage());
crawlSites(await browser.newPage());
crawlSites(await browser.newPage());
crawlSites();
crawlSites();
crawlSites();
await crawlSites();


browser.close()
*/

