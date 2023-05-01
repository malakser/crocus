import * as readline from 'readline';
import * as fs from 'fs';

const startingHost = 1135

function parseHost(l) {
  const fields = l.split('\t');
  return {
    id: parseInt(fields[0]),
    domain: fields[4].split('.').reverse().join('.'),
    hc: fields[1],
    pr: fields[3],
  };
}

async function* getHosts() {
  //TODO skip already crawled
  const file = readline.createInterface({
    input: fs.createReadStream('../data/cc-main.txt'),
    terminal: false
  });
  for await (const l of file) break; //skipping first line
  for await (const l of file) {
    yield l;
    /*
    const host = parseHost(l);
    if (host.id >= startingHost) {
      await fs.promises.writeFile('../data/filter-last.txt', JSON.stringify(host.id));
      yield host;
    }
    */
  }
}
const hosts = getHosts();
for await (const h of hosts) {
  console.log(h);
}
