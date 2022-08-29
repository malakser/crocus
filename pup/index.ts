import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import fetch from 'node-fetch';
import * as puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

/*
function getUrlToLoad(): string {
  let url = 'https://teletrup.github.io/';
  if (process.argv[process.argv.length - 1].endsWith('.ts') === false) {
    url = process.argv[process.argv.length - 1];
  }

  return url;
}
*/

async function bbb() {
  const blocker = await PuppeteerBlocker.fromLists(
    fetch,
    fullLists,
    {
      enableCompression: true,
    },
    {
      path: 'engine.bin',
      read: fs.readFile,
      write: fs.writeFile,
    },
  );

  const browser = await puppeteer.launch({
    // @ts-ignore
    defaultViewport: null,
    headless: true,
  });

	return {blocker: blocker, browser: browser};
}

async function dropPage(b, page) {
}

async function isLegit(b, url) {

	//promise before 
  let bl = new Promise((resolve) => {
		b.blocker.once('request-blocked', (request: Request) => {
    	//console.log('flocked', request.url);
			console.dir(request);
			resolve([url, false]);
  	});
	});


  const page = await b.browser.newPage();
  await b.blocker.enableBlockingInPage(page);
  let pl = new Promise(async (resolve) => {
		await page.goto(url, { waitUntil: 'domcontentloaded' });
		resolve([url, true]);
	});
	let a = await Promise.race([pl, bl]);
	//TODO explain
	//bl message

	//nonblocking?
		//nah
	//(async () => {
		await b.blocker.disableBlockingInPage(page);
		await pl;
		//console.log("page loaded");
		await page.close();
		//console.log("page closed");
	//})();
	return a;
}

(async () => {
	console.log("doin' stuff");
	const b = await bbb();
	let onet = "https://www.onet.pl";
	let trup = "https://teletrup.github.io";
	console.log(await Promise.all([isLegit(b, trup), isLegit(b, onet)]));
	await b.browser.close();
})();
