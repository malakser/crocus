import {Cluster as Cluster} from 'puppeteer-cluster';

const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: 2,
});

await cluster.task(async ({worker, page, data: url }) => {
  const response = await page.goto(url);
  console.log(worker.id, response.status());
  // Store screenshot, do something else
});

cluster.queue('http://www.google.com/');
cluster.queue('http://www.wikipedia.org/');
cluster.queue('http://www.google.com/');
cluster.queue('http://www.wikipedia.org/');
cluster.queue('http://www.google.com/');
cluster.queue('http://www.wikipedia.org/');
// many more pages

await cluster.idle();
await cluster.close();
