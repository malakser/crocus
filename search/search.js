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
  const sres = await search(req.query.q);
  const foo = sres.hits.map((r, i) => ({
    url: r.url,
    title: r.title,
    desc: sres.snippets[0].body,
  }));
  res.json(foo);
})
