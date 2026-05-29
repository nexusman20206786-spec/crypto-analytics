const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT = process.env.PORT || 3000;
const BNB_BASE  = 'https://api.binance.com/api/v3';

function proxy(cgPath, res) {
  const target = BNB_BASE + cgPath;
  console.log('→ Binance:', target);
  const req = https.get(target, {
    headers: { 'User-Agent': 'CryptoApp/1.0', 'Accept': 'application/json', 'Accept-Encoding': 'identity' }
  }, (r) => {
    const chunks = [];
    r.on('data', d => chunks.push(d));
    r.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      console.log(`← ${r.statusCode}, ${body.length} bytes`);
      res.writeHead(r.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
    });
  });
  req.on('error', e => {
    res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: e.message }));
  });
  req.setTimeout(20000, () => { req.destroy(); });
}

http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  const p = parsed.pathname;

  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); res.end(); return; }

  if (p.startsWith('/bnb/')) {
    proxy(req.url.replace('/bnb', ''), res);
    return;
  }

  if (p === '/' || p === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
}).listen(PORT, () => {
  console.log('\n✅  Crypto Analytics → http://localhost:' + PORT + '\n');
});
