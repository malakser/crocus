const fs = require('fs');
const elasticlunr = require('elasticlunr');
const tdqm = require('ntqdm');
const express = require('express');


let a = JSON.parse(fs.readFileSync('../data/pages.json')).map((x, i) => ({id: i, ...x})).slice(0, 5);

const index = elasticlunr(function () {
  this.addField('url');
  this.addField('title');
  this.addField('body');
  this.addField('hc');
  this.addField('pr');
});

a.map(x => console.log(x.title));


for (const x of tdqm(a)) {
	index.addDoc(x);
}

console.log('index built');


const app = express();

app.listen(8000, () => {
	console.log('listening');
})


function genSnippet(query, body) {
  const f = x => elasticlunr.stemmer(x.toLowerCase()); //trimmer?
  const g = x => x.join(' ');
  const  qw = query.split(' ').map(f);
  const bw = body.split(/\s+/);
  for (i in bw) {
    for (w of qw) {
      if (f(bw[i]) === w) {
        return `${g(bw.slice(i - 5, i)).slice(-100, -1)}<b>${bw[i]}</b>${g(bw.slice(i + 1, i + 5)).slice(0, 100)}`;
      }
    }
  }
}

app.get('/api', (req, res, next) => {
  console.log(req.query.q);
	const result = index.search(req.query.q);
  res.json(result.map(r => {
    d = a[r.ref];
    return {
      url: d.url,
      title: d.title,
      snippet: genSnippet(req.query.q, d.body),
    };
  }));
});


