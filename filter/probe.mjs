import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';



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


async function isLegit(page, url) {
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
	let a = await Promise.race([pl, bl, new Promise(async (r) => setTimeout(() => r([url, 'hard time out']), 5000))]);
	await blocker.disableBlockingInPage(page);
	//Why cant't r be async?	

	//await page.close();
	//await pl;
  //TODO are those two necessary?

	return a;
}

//const url = 'https://en.wikipedia.org';
//const url = 'https://en.archive.org';
//const url = 'https://github.com';
//const url = 'https://skype.com';
const url = 'https://newsmax.com';

const page = await browser.newPage();
console.log(await isLegit(page, url))
await browser.close()
