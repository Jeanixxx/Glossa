import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), '..');
const sourceHtml = resolve(root, 'glossa_1788841467771_1790083871425.html');
const targetHtml = resolve(process.cwd(), 'index.html');
let html = await readFile(sourceHtml, 'utf8');

const bridgeTag = '<script type="module" src="./native-bridge.js"></script>';
if (!html.includes(bridgeTag)) {
  html = html.replace('</body>', `  ${bridgeTag}\n</body>`);
}
await writeFile(targetHtml, html, 'utf8');
await copyFile(resolve(process.cwd(), 'native-bridge.js'), resolve(process.cwd(), 'native-bridge.js'));
console.log('Prepared Glóssa web assets for Capacitor.');
