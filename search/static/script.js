function genResHTML(res) {
	const {title, desc, url} = res;
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



var q;
var page;
var results;

function init() {
	q = document.getElementById('q');
	results = document.getElementById('results');
	//status_el = document.getElementById('status');
	q.addEventListener('keypress', event => {
		if (event.key == 'Enter') search();
	});
}

async function search() {
	page = 0;
	document.getElementById('results').innerHTML = '';
  var url = new URL(`http://${location.host}/search`);
  var params = {q:q.value, page:page};
  url.search = (new URLSearchParams(params)).toString();
  resp = await (await fetch(url)).json(); //that await?
  console.log(resp);
  results.innerHTML = resp.map(genResHTML).join('\n');
}

/*
function moar() {
	moar_button.style.visibility = 'hidden';
	page++;
	var com = {query: q.value, page: page};
	ws.send(JSON.stringify(com));
}
*/
