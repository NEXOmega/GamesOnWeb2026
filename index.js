const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Le dossier 'public' est maintenant la racine de notre serveur web
  const publicDir = path.join(__dirname, 'public');

  // Si l'URL est '/', on sert 'index.html'. Sinon on prend l'URL demandée.
  const requestedFile = req.url === '/' ? 'index.html' : req.url;
  const filePath = path.join(publicDir, requestedFile);

  // Petit check de sécurité pour éviter de sortir du dossier public
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>', 'utf-8');
    return;
  }

  // Le reste du code est similaire : trouver le type MIME et servir le fichier
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: '+err.code+' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data, 'utf-8');
    }
  });
});

server.listen(3000);
console.log("Server running on port 3000, serving files from the 'public' directory.");