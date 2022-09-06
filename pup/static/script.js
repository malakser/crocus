function init() {
}

const ws = new WebSocket("ws://"+location.host.replace(/:\d+|$/, ':3003'));

/*
ws.addEventListener('open', event => {
	ws.send('Hello!');
});
*/

var q;
var page;
var moar_button;
var results;

function init() {
	q = document.getElementById('q');
	results = document.getElementById('results');
	moar_button = document.getElementById('moar_button');
	q.addEventListener('keypress', event => {
		if (event.key == 'Enter') search();
	});

	ws.addEventListener('close', event => {
		document.body.innerHTML = "<b class='error'>socket closed</b>"
	});

	ws.addEventListener('error', event => {
		document.body.innerHTML = "<b class='error'>socket error</b>"
	});

	ws.addEventListener('message', event => {
		const com = JSON.parse(event.data);
		if (com.action == 'page_load') {
			results.innerHTML = results.innerHTML + 'loading page ' + com.data;
		} else if (com.action == 'page_end') {
			results.innerHTML = results.innerHTML + 'end of page ' + com.data;
			moar_button.style.visibility = 'visible';

		} else {
			results.innerHTML = results.innerHTML + com.data;
		}
	});
}






function search() {
	page = 0;
	document.getElementById('results').innerHTML = '';
	var com = {query: q.value, page: page}
	ws.send(JSON.stringify(com));
}

function moar() {
	moar_button.style.visibility = 'hidden';
	page++;
	var com = {query: q.value, page: page};
	ws.send(JSON.stringify(com));
}
