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

const $ = x => document.querySelector(x);
const print = (x, y) => $(x).innerHTML = y;
const append = (x, y) => $(x).innerHTML += y;

var peer = new Peer();
peer.on('open', function(id) {
  console.log('My peer ID is: ' + id);
});

var conn;
setTimeout(() => {
  print('#status', 'connecting')
  conn = peer.connect('puroburaren');
  conn.on('open', function() {
    // Receive messages
    conn.on('data', function(data) {
      console.log('Received', data);
      if (data === 'connected') {
        $('#q').disabled = false;
        $('#q').focus();
        print('#status', 'connected')
      } else {
        print('#results', data.map(genResHTML).join(''));
      }
    });
    
    // Send messages
    //conn.send('Hello');
  });		
}, 1000);

function search() {
  const q = $('#q').value;
  conn.send(q);
}
