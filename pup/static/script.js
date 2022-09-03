function init() {
}

const ws = new WebSocket("ws://"+location.host.replace(/:\d+|$/, ':3003'));

ws.addEventListener('open', event => {
	ws.send('Hello!');
});

function search() {
	alert(1);
}
