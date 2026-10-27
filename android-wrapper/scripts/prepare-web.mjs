import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), '..');
const webDir = resolve(process.cwd(), 'web');
await mkdir(webDir, { recursive: true });

const sourceHtml = resolve(root, 'glossa_1788841467771_1790083871425.html');
const targetHtml = resolve(webDir, 'index.html');
let html = await readFile(sourceHtml, 'utf8');

const bridgeTag = '<script type="module" src="./native-bridge.js"></script>';
if (!html.includes(bridgeTag)) {
  html = html.replace('</body>', `  ${bridgeTag}\n</body>`);
}
await writeFile(targetHtml, html, 'utf8');
await copyFile(resolve(process.cwd(), 'native-bridge.js'), resolve(webDir, 'native-bridge.js'));
console.log('Prepared Glóssa web assets for Capacitor.');
