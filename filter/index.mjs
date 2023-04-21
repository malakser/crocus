import { fullLists, PuppeteerBlocker, Request } from '@cliqz/adblocker-puppeteer';
import { promises as fs } from 'fs';
import * as puppeteer from 'puppeteer';

//can I do without the outer async?
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
  defaultViewport: null,
  headless: false,
});


