function init() {
}

const ws = new WebSocket("ws://"+location.host.replace(/:\d+|$/, ':3003'));

/*
ws.addEventListener('open', event => {
	ws.send('Hello!');
});
*/


ws.addEventListener('close', event => {
	document.body.innerHTML = "<b class='error'>socket closed</b>"
});

ws.addEventListener('error', event => {
	document.body.innerHTML = "<b class='error'>socket error</b>"
});

ws.addEventListener('message', event => {
	var results = document.getElementById('results');
	results.innerHTML = results.innerHTML + event.data;
});


page = 0;

function search() {
	page = 0;
	document.getElementById('results').innerHTML = '';
	var com = {query: document.getElementById('q').value, page: page}
	ws.send(JSON.stringify(com));
}

function moar() {
	document.getElementById('moar').remove();
	page++;
	var com = {query: document.getElementById('q').value, page: page}
	ws.send(JSON.stringify(com));
}
