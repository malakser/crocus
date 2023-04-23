import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import * as readline from 'readline';



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

const browser = await puppeteer.launch({
  defaultViewport: null,
  headless: false,
});

async function isLegit(url) {
	//promise before loading page
  let bl = new Promise((resolve) => {
		blocker.once('request-blocked', (request) => {
			resolve([url, false]);
  	});
	});

  const page = await browser.newPage();
  await blocker.enableBlockingInPage(page);
  let pl = new Promise(async (resolve) => {
		try {
			await page.goto(url, { waitUntil: 'domcontentloaded', timeout:3000 });
		} catch (e) {
			resolve([url, "timed out"]);
		}
		resolve([url, true]);
	});
	let a = await Promise.race([pl, bl, new Promise(r => setTimeout(r([url, 'hf']), 1000))]);
	//Why cant't r be async?	
	await blocker.disableBlockingInPage(page);
	await pl;
	await page.close();

	return a;
}

function getDomain(l) {
  return l.split('\t')[4].split('.').reverse().join('.');
}

const file = readline.createInterface({
    input: fs.createReadStream('../data/cc-hosts.txt'),
    output: process.stdout,
    terminal: false
});

let i = 0;
for await (const l of file) {
  break;
}

for await (const l of file) {
  if (i == 5) break;
  console.log(l);
  console.log(await isLegit('https://' + getDomain(l)));
  i++;
}

browser.close()

