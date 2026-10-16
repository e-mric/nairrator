import { createServer } from 'node:http';
// This local HTTP server controls the protocol header; requests cannot override it.
process.env.PROTOCOL_HEADER = 'x-nairrator-protocol';
const { handler } = await import('../build/handler.js');
const port = Number(process.env.PORT || 4173);
createServer((request, response) => {
  request.headers['x-nairrator-protocol'] = 'http';
  handler(request, response);
}).listen(port, '127.0.0.1', () => console.log(`Nairrator is running at http://127.0.0.1:${port}`));
