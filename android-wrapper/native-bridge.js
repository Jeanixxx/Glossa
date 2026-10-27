import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const isNativeAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

function pageText() {
  const content = document.querySelector('#page-content');
  const text = content?.innerText?.trim();
  return text || document.body.innerText.trim().slice(0, 5000);
}

function announce(message) {
  const toast = document.querySelector('#toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  }
}

async function haptic() {
  if (!isNativeAndroid()) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
}

async function shareCurrentPage() {
  const text = pageText();
  if (!text) return announce('No hay texto para compartir.');
  try {
    await haptic();
    await Share.share({
      title: 'Glóssa — lectura',
      text: text.slice(0, 8000),
      dialogTitle: 'Compartir lectura'
    });
  } catch {
    if (navigator.share) {
      try { await navigator.share({ title: 'Glóssa — lectura', text: text.slice(0, 8000) }); }
      catch {}
    } else {
      announce('No se pudo abrir el menú para compartir.');
    }
  }
}

function toggleReadAloud(button) {
  if (!('speechSynthesis' in window)) {
    announce('La lectura en voz alta no está disponible en este dispositivo.');
    return;
  }
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    button.textContent = '🔊 Leer en voz alta';
    announce('Lectura detenida.');
    return;
  }
  const text = pageText();
  if (!text) return announce('No hay texto para leer.');
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 12000));
  utterance.lang = document.documentElement.lang || 'es-MX';
  utterance.rate = 0.95;
  utterance.onend = () => { button.textContent = '🔊 Leer en voz alta'; };
  utterance.onerror = () => { button.textContent = '🔊 Leer en voz alta'; };
  button.textContent = '⏹ Detener lectura';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function addNativeActions() {
  if (document.querySelector('#glossa-native-actions')) return;
  const bar = document.createElement('div');
  bar.id = 'glossa-native-actions';
  bar.setAttribute('aria-label', 'Acciones rápidas de Android');
  bar.innerHTML = `
    <button type="button" id="glossa-read-aloud" aria-label="Leer texto en voz alta">🔊 Leer</button>
    <button type="button" id="glossa-share" aria-label="Compartir texto actual">↗ Compartir</button>
  `;
  const style = document.createElement('style');
  style.textContent = `
    #glossa-native-actions{display:flex;gap:8px;justify-content:center;align-items:center;position:sticky;bottom:calc(10px + env(safe-area-inset-bottom));z-index:9999;margin:12px auto;padding:8px;width:max-content;max-width:calc(100% - 24px);border:1px solid var(--border-soft,rgba(60,90,120,.16));border-radius:999px;background:var(--card-solid,rgba(255,255,255,.92));box-shadow:0 6px 24px rgba(20,35,55,.16);backdrop-filter:blur(16px)}
    #glossa-native-actions button{font:600 14px/1.2 system-ui,sans-serif;border:0;border-radius:999px;padding:11px 14px;background:var(--accent,#3d6b8c);color:white;min-height:42px;touch-action:manipulation}
    #glossa-native-actions button:focus-visible{outline:3px solid var(--scaffold,#c4784a);outline-offset:2px}
    body{padding-bottom:env(safe-area-inset-bottom)}
  `;
  document.head.appendChild(style);
  const main = document.querySelector('main') || document.body;
  main.appendChild(bar);
  bar.querySelector('#glossa-read-aloud').addEventListener('click', async (event) => {
    await haptic();
    toggleReadAloud(event.currentTarget);
  });
  bar.querySelector('#glossa-share').addEventListener('click', shareCurrentPage);
  document.addEventListener('click', (event) => {
    if (event.target.closest('button, a, [role="button"]')) haptic();
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addNativeActions, { once: true });
} else {
  addNativeActions();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && 'speechSynthesis' in window) window.speechSynthesis.pause();
});
