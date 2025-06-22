const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const PORT = process.env.PORT || 8080;
const DID_API_KEY = process.env.DID_API_KEY;

if (!DID_API_KEY) {
  console.error("DID_API_KEY is not set!");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("D-ID WebSocket Proxy is running.\n");
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (client, req) => {
  const urlParams = new URLSearchParams(req.url.replace('/?', ''));
  const streamId = urlParams.get('stream_id');

  if (!streamId) {
    client.close();
    return;
  }

  console.log(`New client connected for stream: ${streamId}`);

  const didSocket = new WebSocket(`wss://api.d-id.com/streams/${streamId}/ws`, {
    headers: {
      'Authorization': `Basic ${Buffer.from(DID_API_KEY + ':').toString('base64')}`
    }
  });

  client.on('message', (message) => {
    didSocket.send(message);
  });

  didSocket.on('message', (message) => {
    client.send(message);
  });

  didSocket.on('error', (err) => {
    console.error('D-ID WebSocket error:', err);
    client.close();
  });

  client.on('close', () => {
    didSocket.close();
  });
});

server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
