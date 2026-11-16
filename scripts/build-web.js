// Copia la app (un solo HTML) a www/index.html, que es lo que Capacitor empaqueta.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readdirSync(root).find(name => /^glossa.*\.html$/i.test(name));
if (!source) {
  console.error('No se encontró el HTML de la app (glossa*.html) en la raíz del repositorio.');
  process.exit(1);
}

const outDir = path.join(root, 'www');
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(path.join(root, source), path.join(outDir, 'index.html'));
console.log(`Copiado ${source} -> www/index.html`);
