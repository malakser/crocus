const express = require('express');


const q = 'application';
const url = `http://127.0.0.1:7280/api/v1/foo/search?query=${q}&snippet_fields=body`;

(async () => {
	const response = await fetch(url);
	const json = await response.json();
	console.log(json)
})();
/*
app.listen(8000, () => {
	console.log('listening');
})
*/


