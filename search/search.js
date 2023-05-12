const express = require('express');

const search = async q => {
  const url = `http://127.0.0.1:7280/api/v1/foo/search?query=${q}&snippet_fields=body`;
	const response = await fetch(url);
	const json = await response.json();
  return json;
}

const app = express()
app.use(express.static('static'));

app.listen(8000, () => {
	console.log('listening');
})

app.get('/search', async (req, res) => {
  const q = req.query.q;
  const sres = await search(q);
    //console.log(Object.keys(sres.hits[0]));
  if (Object.keys(sres).includes('message')) {
    console.log(sres.message);
    res.json(sres.message);
  } else {
    const foo = sres.hits.map((r, i) => ({
      url: r.url,
      title: r.title ? r.title : 'Untitled',
      desc: sres.snippets[i].body,
    }));
    res.json(foo);
  }
})
