const fs = require('fs');
const elasticlunr = require('elasticlunr');
const tdqm = require('ntqdm');

let a = JSON.parse(fs.readFileSync('../data/pages.json')).map((x, i) => ({id: i, ...x}));

const index = elasticlunr(function () {
  this.addField('url');
  this.addField('title');
  this.addField('body');
  this.addField('hc');
  this.addField('pr');
});



for (const x of tdqm(a)) {
	index.addDoc(x);
}

console.log('index built');
console.log(index.toJSON());

//fs.writeFileSync('../data/index.json', JSON.stringify(index.toJSON()));

console.log(index.search('wikipedia'));
