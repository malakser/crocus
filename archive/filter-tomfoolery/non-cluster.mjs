import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import * as readline from 'readline';




const browser = await puppeteer.launch({
  defaultViewport: null,
  headless: false,
});


async function isLegit(url, blocker) {
  const page = await browser.newPage();
  try {
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
    await page.close();

    return a;

  } catch(e) {
    console.log(e);
    await page.close();
    return [url, 'weird error'];
  }
}

function getDomain(l) {
  const fields = l.split('\t');
  return {
    domain: fields[4].split('.').reverse().join('.'),
    hc: fields[1],
    pr: fields[3],
  };
}

async function* getHosts() {
  //TODO skip already crawled
  const file = readline.createInterface({
      input: fs.createReadStream('../data/cc-hosts.txt'),
      output: process.stdout,
      terminal: false
  });
  let i = 0;
  for await (const l of file) {
    if (i == 1130) break;
    i++;
  }
  for await (const l of file) {
    yield getDomain(l);
  }
}


const gen = getHosts();
let i = 0;

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

/*
crawlSites(await browser.newPage());
crawlSites(await browser.newPage());
crawlSites(await browser.newPage());
crawlSites(await browser.newPage());
*/
crawlSites();
crawlSites();
crawlSites();
await crawlSites();

browser.close()

