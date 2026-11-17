const fs = require('fs');
const pack = require('./pack');
const r = (f) => fs.readFileSync(__dirname + '/' + f, 'utf8');
const levels = JSON.stringify(pack()).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>bug/drill: Amazon repo-debugging practice</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
<style>${r('style.css')}</style>
</head>
<body>
<div id="app"></div>
<div id="playbook-src" hidden>${r('playbook.html')}</div>
<script>${r('runtime.js')}</script>
<script>window.LEVELS = ${levels};</script>
<script>${r('ui.js')}</script>
</body>
</html>`;
fs.mkdirSync(__dirname + '/dist', { recursive: true });
fs.writeFileSync(__dirname + '/dist/index.html', html);
console.log('built', (html.length / 1024).toFixed(1) + ' KB');
