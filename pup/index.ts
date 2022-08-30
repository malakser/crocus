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
			//console.dir(request);
			resolve([url, false]);
  	});
	});


  const page = await b.browser.newPage();
  await b.blocker.enableBlockingInPage(page);
  let pl = new Promise(async (resolve) => {
		try {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout:5000 });
		} catch (e) {
			resolve([url, "timed out"]);
		}
		resolve([url, true]);
	});
	let a = await Promise.race([pl, bl]);
		

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

const delay = (val, ms) => new Promise(resolve => setTimeout(() => resolve(val), ms));
const next = async page => {
	try {
		await page.click('input[value="Next"]');
	} catch (e) {
		return false;
	}
	try {await page.waitForNavigation({waitUntil: 'domcontentloaded'});} catch (e) {}
}

(async () => {
  if (process.argv[process.argv.length - 1].endsWith('.ts') === false) {
    var q = process.argv[process.argv.length - 1];
  } else {
		console.log("please enter your query as a command line argument");
		return;
	}

	console.log("doin' stuff");
	const b = await bbb();

	const res_page = await b.browser.newPage();
	try {
		await res_page.goto("https://html.duckduckgo.com/html", {waitUntil: 'domcontentloaded'});
	} catch (e) {}
	await res_page.focus('input[name="q"]');
	await res_page.keyboard.type(q+'\n');
	await res_page.waitForNavigation({waitUntil: 'domcontentloaded'});
	console.log("result page loaded");

	/*
	let onet = "https://www.onet.pl";
	let trup = "https://teletrup.github.io";
	console.log(await Promise.all([isLegit(b, trup), isLegit(b, onet)]));
	*/

	//const filtered = links.filter(l => (async l => await isLegit(b, l))(l));

	var legit_count = 0;
	while (true) {
		var links = await res_page.evaluate(() => {
			const nlist = document.querySelectorAll('a[class=result__a]');
			return Array.from(nlist).map(x => x.getAttribute("href"));
		});
		for (var l of links) {
			var f = await isLegit(b, l); 
			if (f[0] === false) {
				
			} else if (f[1] === true) {
				legit_count++;
				console.log(f[0]);
			}
		}
		console.log("loading next page");
		if ((await next(res_page)) === false) break;
	}

	await b.browser.close();
})();
