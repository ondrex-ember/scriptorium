// ═══ serve.js — jednoduchý statický server pro lokální test dist/ ═══
// Bez závislostí, čistý Node http modul. Spustit z kořene scriptorium/:
//   node serve.js
// Pak otevřít http://localhost:8000

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT = path.join(__dirname, 'dist');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
};

if (!fs.existsSync(ROOT)) {
    console.error(`❌ Složka dist/ neexistuje (${ROOT}).`);
    console.error(`   Spusť nejdřív: node build.js`);
    process.exit(1);
}

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    let filePath = path.join(ROOT, urlPath);

    // Bezpečnost: nedovolit uniknout z dist/ přes ../
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // SPA fallback — neznámá cesta vrátí index.html
            filePath = path.join(ROOT, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache', // vždy čerstvé při lokálním testu
            });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`✅ Server běží: http://localhost:${PORT}`);
    console.log(`   Servíruje: ${ROOT}`);
    console.log(`   Ukončit: Ctrl+C`);
});
