const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 8080;

function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name in ifaces) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }
      }
    }
  }
  for (const name in ifaces) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LAN_IP = getLocalIp();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  if (pathname === '/plugins.min.json' || pathname === '/plugins.json') {
    const manifest = [
      {
        id: 'cote-reader',
        name: 'COTE Reader',
        site: 'https://cote-reader.me',
        lang: 'English',
        version: '1.0.0',
        url: `http://${LAN_IP}:${PORT}/plugins/cote-reader.js`,
        iconUrl: `http://${LAN_IP}:${PORT}/icon.png`
      }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(manifest, null, pathname.endsWith('.min.json') ? 0 : 2));
    return;
  }

  let filePath = path.join(__dirname, 'dist', pathname);
  if (pathname === '/') {
    filePath = path.join(__dirname, 'dist', 'plugins.json');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.webp': 'image/webp'
    };
    res.writeHead(200, { 'Content-Type': map[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://${LAN_IP}:${PORT}`);
  console.log(`Manifest: http://${LAN_IP}:${PORT}/plugins.min.json`);
});
