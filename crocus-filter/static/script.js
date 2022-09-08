function genResHTML(res) {
	const {title, description: desc, url} = res;
	return `
	<div class='res'>
		<a class='title' href=${url}>
			${title}
		</a>
			<div class=res_url>${url}</div>
			<div class='desc'>
				${desc}
			</div>
	</div>`;
};

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
	status_el = document.getElementById('status');
	q.addEventListener('keypress', event => {
		if (event.key == 'Enter') search();
	});
	
	ws.addEventListener('open', e => {
		status_el.innerHTML = 'connected';
	});

	ws.addEventListener('close', event => {
		status_el.innerHTML = '<b class="error">closed</b>';
	});

	ws.addEventListener('error', event => {
		status_el.innerHTML = '<b class="error">closed</b>';
	});

	ws.addEventListener('message', event => {
		const com = JSON.parse(event.data);
		if (com.action == 'page_load') {
			status_el.innerHTML = 'loading page ' + com.data; 			
		} else if (com.action == 'page_end') {
			status_el.innerHTML = 'end of page ' + com.data; 			
			moar_button.style.visibility = 'visible';

		} else {
			results.innerHTML = results.innerHTML + genResHTML(com.data);
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
