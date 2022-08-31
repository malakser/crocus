import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import fetch from 'node-fetch';
import * as puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
const google = require('googlethis');



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


async function isLegit(b, url) {
	//promise before loading page
  let bl = new Promise((resolve) => {
		b.blocker.once('request-blocked', (request: Request) => {
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
		
	await b.blocker.disableBlockingInPage(page);
	await pl;
	await page.close();

	return a;
}


const delay = (val, ms) => new Promise(resolve => setTimeout(() => resolve(val), ms));

//TODO update for normal cli app
function getOpts() {
	var ret:any = {};
	var i = 0;
	for (; i < process.argv.length; i++) {
		if (process.argv[i].endsWith('.ts')) {
			break;
		}
	}
	var args = process.argv.slice(i + 1);
	ret['q'] = args[args.length - 1];
	for (var j = 0; j < args.length - 1; j+= 2) {
		//TODO handle invalid formatting
		let opt_name = args[j*2].slice(1);
		let opt_val = args[j*2+1];
		ret[opt_name] = opt_val;
	}
	return ret;
}


(async () => {
	console.log("doin' stuff");

	const opts = getOpts();
	const q = opts.q;
	const lang = opts.l ? opts.l : 'en';
	console.log('query: '+q);
	console.log('lang: '+lang);


	const b = await bbb();

	try {
		var blacklist = new Set((await fs.readFile('blacklist.txt'))
														.toString().split('\n'));
	} catch (e) {
		var blacklist:Set<string> = new Set();
	}


	var legit_count = 0;
	for (var page_num = 0; ; page_num++) {
		console.log("loading page " + page_num);
		const search_opts = {
			page: page_num, 
			safe: false,
			additional_params: { 
				hl: lang
			}
		}
		const retries = 2;
		for (let i = 0; i < retries+1; i++) {
			if (i > 0) console.log("retrying");
			var res = (await google.search(q, search_opts)).results;
			if (res.length != 0) {
				break;
			}
		}
		if (res.length == 0) {
			console.log("page "+page_num+": no results");
			break;
		}
		const links = res.map(x => x.url);
		for (let r of res) {
			let l = r.url;
			let host = (new URL(l)).hostname;
			if (blacklist.has(host)) {
				console.log(host + ' is blacklisted');
				continue;
			}
			let f = await isLegit(b, l); 
			if (f[1] === false) {
				console.log('blacklisting ' + host);
				blacklist.add(host);
				await fs.appendFile('blacklist.txt', host + '\n');
			} else if (f[1] === true) {
				legit_count++;
				console.log(f[0]);
			}
		}
	}

	b.browser.close();
})();
