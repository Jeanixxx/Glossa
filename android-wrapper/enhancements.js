/* Glóssa enhancements: integrated notebook, reading streak, improved search and offline awareness. */
(function () {
  'use strict';
  if (window.__glossaEnhancementsLoaded) return;
  window.__glossaEnhancementsLoaded = true;

  var STORAGE_KEY = 'glossa_v1';
  var originalSaveState = window.saveState;
  var originalRenderBooks = window.renderBooks;
  var originalRenderCurrentPage = window.renderCurrentPage;
  var originalShowMain = window.showMain;

  state.notebook = Array.isArray(state.notebook) ? state.notebook : [];
  state.readingDays = Array.isArray(state.readingDays) ? state.readingDays : [];
  state.currentStreak = Number(state.currentStreak) || 0;
  state.bestStreak = Number(state.bestStreak) || 0;

  function loadEnhancementData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (Array.isArray(saved.notebook)) state.notebook = saved.notebook;
      if (Array.isArray(saved.readingDays)) state.readingDays = saved.readingDays;
      if (Number.isFinite(saved.bestStreak)) state.bestStreak = saved.bestStreak;
    } catch (error) {
      console.warn('No se pudieron recuperar las notas y rachas:', error);
    }
  }
  function persistEnhancementData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var saved = raw ? JSON.parse(raw) : {};
      saved.notebook = state.notebook;
      saved.readingDays = state.readingDays;
      saved.currentStreak = state.currentStreak;
      saved.bestStreak = state.bestStreak;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (error) {
      console.warn('No se pudieron guardar las notas y rachas:', error);
      if (typeof window.showToast === 'function') window.showToast('El almacenamiento está lleno. Exporta o elimina notas antiguas.');
    }
  }
  loadEnhancementData();

  function dayKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function recalculateStreak() {
    var days = Array.from(new Set(state.readingDays.filter(function (day) { return /^\d{4}-\d{2}-\d{2}$/.test(day); }))).sort();
    state.readingDays = days.slice(-400);
    var today = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    var cursor = days.indexOf(dayKey(today)) >= 0 ? today : (days.indexOf(dayKey(yesterday)) >= 0 ? yesterday : null);
    var streak = 0;
    while (cursor && days.indexOf(dayKey(cursor)) >= 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    state.currentStreak = streak;
    var run = 0, best = 0, previous = null;
    days.forEach(function (day) {
      var current = new Date(day + 'T12:00:00');
      run = previous && Math.round((current - previous) / 86400000) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      previous = current;
    });
    state.bestStreak = Math.max(state.bestStreak || 0, best, streak);
  }
  function markReadingActivity() {
    var key = dayKey(new Date());
    if (state.readingDays.indexOf(key) < 0) state.readingDays.push(key);
    recalculateStreak();
    persistEnhancementData();
  }
  function esc(value) {
    if (typeof window.esc === 'function') return window.esc(String(value == null ? '' : value));
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function allKnownBooks() {
    try { return typeof window.allBooks === 'function' ? window.allBooks() : []; } catch (_) { return []; }
  }

  var style = document.createElement('style');
  style.textContent = [
    '.glossa-search{margin:0 0 1rem;padding:1rem;border:1px solid var(--border);border-radius:20px;background:linear-gradient(135deg,var(--card-solid),var(--highlight));box-shadow:var(--shadow)}',
    '.glossa-search h3{font-family:Literata,serif;font-size:1.05rem;margin:0 0 .25rem}.glossa-search p{font-size:.78rem;color:var(--muted);margin:0 0 .7rem}',
    '.glossa-search-row{display:flex;gap:.5rem;align-items:center;padding:.25rem .4rem .25rem .8rem;border:1px solid var(--border-soft);border-radius:14px;background:var(--bg)}',
    '.glossa-search-row input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--text);font:inherit;padding:.65rem 0}',
    '.glossa-search-row button{border:0;border-radius:10px;background:var(--accent);color:white;padding:.6rem .7rem;font-weight:700}',
    '.glossa-search-meta{display:flex;justify-content:space-between;gap:.5rem;margin-top:.55rem;color:var(--muted);font-size:.75rem}.glossa-search-meta button{border:0;background:transparent;color:var(--accent);font-weight:600}',
    '.glossa-offline{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;padding:.65rem .8rem;border:1px solid var(--border);border-radius:13px;background:var(--card);font-size:.78rem;color:var(--muted)}',
    '.glossa-offline i{width:9px;height:9px;border-radius:50%;background:#38a169;flex:none}.glossa-offline.offline i{background:#d97706}',
    '.glossa-streak{position:relative;overflow:hidden;padding:1.05rem;border-radius:20px;color:#fff;background:linear-gradient(125deg,#3d6b8c,#6c79a8 62%,#c4784a);margin-bottom:1rem;box-shadow:0 12px 28px rgba(61,107,140,.2)}',
    '.glossa-streak small{opacity:.9;text-transform:uppercase;letter-spacing:.04em}.glossa-streak strong{display:block;font-family:Literata,serif;font-size:2.25rem;line-height:1.2;margin:.25rem 0}.glossa-week{display:flex;gap:.35rem;margin-top:.75rem}.glossa-week span{flex:1;text-align:center;font-size:.65rem;opacity:.85}.glossa-week b{display:flex;align-items:center;justify-content:center;margin:.25rem auto 0;width:26px;height:26px;border:1px solid #ffffff80;border-radius:50%}.glossa-week .done b{background:#fff;color:#3d6b8c}',
    '#screen-notebook header{padding:1rem 1.2rem .7rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);background:var(--card-solid);position:sticky;top:0;z-index:10}',
    '.glossa-note-compose,.glossa-note{padding:1rem;margin-bottom:.85rem;border:1px solid var(--border);border-radius:16px;background:var(--card);box-shadow:var(--shadow)}',
    '.glossa-note-compose label{display:block;margin:.5rem 0 .25rem;color:var(--muted);font-size:.78rem;font-weight:600}.glossa-note-compose input,.glossa-note-compose textarea,.glossa-note-compose select{box-sizing:border-box;width:100%;border:1px solid var(--border-soft);border-radius:11px;padding:.7rem;background:var(--bg);color:var(--text);font:inherit;font-size:.9rem}.glossa-note-compose textarea{min-height:105px;resize:vertical}',
    '.glossa-note h3{font-family:Literata,serif;font-size:1rem;margin:0 0 .4rem}.glossa-note p{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.9rem;line-height:1.55;margin:.35rem 0 .7rem}.glossa-note-meta{font-size:.72rem;color:var(--muted)}.glossa-note-actions{display:flex;justify-content:flex-end;gap:.4rem;margin-top:.6rem}.glossa-note-actions button{padding:.45rem .65rem;border:1px solid var(--border-soft);border-radius:9px;background:var(--highlight);color:var(--text)}',
    '.glossa-empty{text-align:center;padding:1.7rem 1rem;border:1px dashed var(--border-soft);border-radius:16px;color:var(--muted)}.glossa-nav-item{flex:1;min-width:0;padding:.3rem .05rem;font-size:.59rem}.glossa-nav-item span{font-size:1.05rem}',
    '@media(max-width:390px){.glossa-search{padding:.8rem}.glossa-nav-item{font-size:.54rem}.glossa-nav-item span{font-size:1rem}}'
  ].join('');
  document.head.appendChild(style);

  function buildSearchAndOfflineUI() {
    var grid = document.getElementById('book-grid');
    if (!grid || document.getElementById('glossa-search-panel')) return;
    var panel = document.createElement('section');
    panel.className = 'glossa-search';
    panel.id = 'glossa-search-panel';
    panel.innerHTML = '<h3>¿Qué te gustaría leer hoy?</h3><p>Busca por título, tema, fuente o idioma.</p><div class="glossa-search-row"><span aria-hidden="true">⌕</span><input id="glossa-library-query" type="search" autocomplete="off" aria-label="Buscar lecturas" placeholder="Ciencia, historia, francés…"><button type="button" id="glossa-explore-search">Explorar</button></div><div class="glossa-search-meta"><span id="glossa-search-count">Tu biblioteca</span><button type="button" id="glossa-search-clear">Limpiar</button></div>';
    grid.parentNode.insertBefore(panel, grid);
    var offline = document.createElement('div');
    offline.className = 'glossa-offline';
    offline.id = 'glossa-offline-status';
    offline.innerHTML = '<i></i><span></span>';
    panel.parentNode.insertBefore(offline, panel);
    var input = document.getElementById('glossa-library-query');
    input.addEventListener('input', function () {
      filterRenderedBooks(input.value);
      if (originalRenderBooks) originalRenderBooks();
      filterRenderedBooks(input.value);
    });
    document.getElementById('glossa-search-clear').addEventListener('click', function () {
      input.value = '';
      if (originalRenderBooks) originalRenderBooks();
      filterRenderedBooks('');
      input.focus();
    });
    document.getElementById('glossa-explore-search').addEventListener('click', function () {
      var externalInput = document.getElementById('open-query');
      if (externalInput) externalInput.value = input.value.trim();
      var panel = document.getElementById('open-library-panel');
      if (panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
      if (input.value.trim() && typeof window.searchOpenLibrary === 'function') window.searchOpenLibrary();
      else if (externalInput) externalInput.focus();
    });
    updateOfflineStatus();
  }
  function filterRenderedBooks(query) {
    var grid = document.getElementById('book-grid');
    if (!grid) return;
    var q = String(query || '').trim().toLocaleLowerCase();
    var cards = Array.from(grid.querySelectorAll('.book-card'));
    var visible = 0;
    cards.forEach(function (card) {
      var matches = !q || card.textContent.toLocaleLowerCase().indexOf(q) >= 0;
      card.style.display = matches ? '' : 'none';
      if (matches) visible++;
    });
    var count = document.getElementById('glossa-search-count');
    if (count) count.textContent = q ? visible + ' resultado' + (visible === 1 ? '' : 's') + ' en lecturas recomendadas' : cards.length + ' lecturas recomendadas';
    var empty = document.getElementById('glossa-search-empty');
    if (q && cards.length && !visible) {
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'glossa-empty';
        empty.id = 'glossa-search-empty';
        empty.textContent = 'No hay coincidencias en esta selección. Pulsa “Explorar” para buscar en bibliotecas públicas.';
        grid.appendChild(empty);
      }
      empty.style.display = '';
    } else if (empty) empty.style.display = 'none';
  }
  function updateOfflineStatus() {
    var box = document.getElementById('glossa-offline-status');
    if (!box) return;
    var online = navigator.onLine !== false;
    var pages = Object.keys(state._pageTranslations || {}).length;
    box.classList.toggle('offline', !online);
    box.querySelector('span').textContent = online
      ? 'En línea · las notas y el progreso se guardan en este dispositivo; ' + pages + ' páginas preparadas'
      : 'Sin conexión · notas y progreso disponibles; ' + pages + ' páginas preparadas';
  }
  window.addEventListener('online', updateOfflineStatus);
  window.addEventListener('offline', updateOfflineStatus);

  function streakMarkup() {
    recalculateStreak();
    var week = [];
    for (var offset = 6; offset >= 0; offset--) {
      var date = new Date();
      date.setDate(date.getDate() - offset);
      var key = dayKey(date);
      week.push('<span class="' + (state.readingDays.indexOf(key) >= 0 ? 'done' : '') + '">' +
        esc(date.toLocaleDateString('es-MX', {weekday:'short'}).slice(0,2)) + '<b>' +
        (state.readingDays.indexOf(key) >= 0 ? '✓' : '·') + '</b></span>');
    }
    return '<div class="glossa-streak"><small>Tu constancia de lectura</small><strong>🔥 ' + state.currentStreak + ' día' + (state.currentStreak === 1 ? '' : 's') +
      '</strong><div>' + (state.currentStreak ? '¡Vas construyendo un gran hábito!' : 'Lee un poco hoy para iniciar tu racha.') +
      ' · Récord: ' + state.bestStreak + ' días</div><div class="glossa-week">' + week.join('') + '</div></div>';
  }
  function refreshStreakSurfaces() {
    var summary = document.getElementById('user-summary');
    if (summary) {
      var existing = summary.querySelector('.glossa-streak');
      if (existing) existing.remove();
      summary.insertAdjacentHTML('afterbegin', streakMarkup());
    }
    var stats = document.getElementById('stats-content');
    if (stats) {
      var existingStats = stats.querySelector('.glossa-streak');
      if (existingStats) existingStats.remove();
      stats.insertAdjacentHTML('afterbegin', streakMarkup());
    }
  }

  function renderNotebook() {
    var list = document.getElementById('glossa-notes-list');
    var select = document.getElementById('glossa-note-book');
    var books = allKnownBooks();
    if (select) {
      var previous = select.value;
      select.innerHTML = '<option value="">Nota general (sin lectura)</option>' + books.map(function (book) {
        return '<option value="' + esc(book.id) + '">' + esc(book.title) + '</option>';
      }).join('');
      if (books.some(function (book) { return String(book.id) === previous; })) select.value = previous;
      else if (state.currentBook) select.value = String(state.currentBook.id);
    }
    var count = document.getElementById('glossa-notes-count');
    if (count) count.textContent = state.notebook.length + ' nota' + (state.notebook.length === 1 ? '' : 's');
    if (!list) return;
    var notes = state.notebook.slice().sort(function (a,b) { return b.updatedAt - a.updatedAt; });
    if (!notes.length) {
      list.innerHTML = '<div class="glossa-empty"><div style="font-size:2rem">📝</div><strong>Tu cuaderno empieza aquí</strong><p>Guarda citas, ideas y descubrimientos mientras lees.</p></div>';
      return;
    }
    list.innerHTML = notes.map(function (note) {
      var book = note.bookId && typeof window.findBook === 'function' ? window.findBook(note.bookId) : null;
      return '<article class="glossa-note"><h3>' + esc(note.title || 'Nota de lectura') + '</h3><p>' + esc(note.text) +
        '</p><div class="glossa-note-meta">' + esc(book ? book.title : (note.bookTitle || 'Nota personal')) + ' · ' +
        new Date(note.updatedAt).toLocaleDateString('es-MX') + '</div><div class="glossa-note-actions"><button type="button" data-edit-note="' + esc(note.id) + '">Editar</button><button type="button" data-delete-note="' + esc(note.id) + '">Eliminar</button></div></article>';
    }).join('');
    list.querySelectorAll('[data-edit-note]').forEach(function (button) {
      button.addEventListener('click', function () { editNotebookNote(button.getAttribute('data-edit-note')); });
    });
    list.querySelectorAll('[data-delete-note]').forEach(function (button) {
      button.addEventListener('click', function () { deleteNotebookNote(button.getAttribute('data-delete-note')); });
    });
  }
  function saveNotebookNote() {
    var title = document.getElementById('glossa-note-title').value.trim();
    var text = document.getElementById('glossa-note-text').value.trim();
    if (!text) { window.showToast && window.showToast('Escribe una idea o fragmento antes de guardar'); return; }
    var bookId = document.getElementById('glossa-note-book').value;
    var book = bookId ? allKnownBooks().find(function (item) { return String(item.id) === bookId; }) : null;
    var editingId = document.getElementById('glossa-note-form').getAttribute('data-editing');
    var now = Date.now();
    if (editingId) {
      var existing = state.notebook.find(function (note) { return note.id === editingId; });
      if (existing) {
        existing.title = title || 'Nota de lectura'; existing.text = text;
        existing.bookId = book ? book.id : null; existing.bookTitle = book ? book.title : '';
        existing.updatedAt = now;
      }
      document.getElementById('glossa-note-form').removeAttribute('data-editing');
    } else {
      state.notebook.unshift({id:'note-' + now + '-' + Math.random().toString(36).slice(2,7),title:title || 'Nota de lectura',text:text,bookId:book ? book.id : null,bookTitle:book ? book.title : '',createdAt:now,updatedAt:now});
    }
    document.getElementById('glossa-note-title').value = '';
    document.getElementById('glossa-note-text').value = '';
    persistEnhancementData(); renderNotebook();
    if (window.showToast) window.showToast('Guardado en tu cuaderno');
  }
  function editNotebookNote(id) {
    var note = state.notebook.find(function (item) { return item.id === id; });
    if (!note) return;
    document.getElementById('glossa-note-title').value = note.title || '';
    document.getElementById('glossa-note-text').value = note.text || '';
    document.getElementById('glossa-note-book').value = note.bookId == null ? '' : String(note.bookId);
    document.getElementById('glossa-note-form').setAttribute('data-editing', id);
    document.getElementById('glossa-note-save').textContent = 'Guardar cambios';
    document.getElementById('glossa-note-title').focus();
    document.getElementById('glossa-note-form').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function deleteNotebookNote(id) {
    if (!window.confirm('¿Eliminar esta nota de tu cuaderno?')) return;
    state.notebook = state.notebook.filter(function (note) { return note.id !== id; });
    persistEnhancementData(); renderNotebook();
    if (window.showToast) window.showToast('Nota eliminada');
  }
  function newNotebookNote() {
    document.getElementById('glossa-note-form').removeAttribute('data-editing');
    document.getElementById('glossa-note-title').value = '';
    document.getElementById('glossa-note-text').value = '';
    document.getElementById('glossa-note-save').textContent = 'Guardar en mi cuaderno';
    document.getElementById('glossa-note-title').focus();
  }
  function captureReaderNote() {
    var selected = String(window.getSelection ? window.getSelection() : '').trim();
    var text = selected || String((state.rawPages || [])[state.currentPage] || '').trim().slice(0,500);
    window.showMain('notebook');
    document.getElementById('glossa-note-title').value = state.currentBook ? 'Nota: ' + state.currentBook.title : 'Nota de lectura';
    document.getElementById('glossa-note-text').value = text;
    if (state.currentBook) document.getElementById('glossa-note-book').value = String(state.currentBook.id);
    if (window.showToast) window.showToast(selected ? 'Fragmento preparado: añade tu reflexión y guarda' : 'Texto preparado: edita la nota y guárdala');
  }
  function buildNotebookScreen() {
    if (document.getElementById('screen-notebook')) return;
    var screen = document.createElement('div');
    screen.className = 'screen';
    screen.id = 'screen-notebook';
    screen.innerHTML = '<header><div><div class="library-title">Cuaderno de lectura</div><div style="font-size:.76rem;color:var(--muted)">Tus ideas, citas y notas en un solo lugar</div></div><button class="icon-btn" id="glossa-new-note" title="Nueva nota">＋</button></header>' +
      '<div class="library-content"><form class="glossa-note-compose" id="glossa-note-form"><div class="section-label" style="margin-top:0">Captura una idea</div>' +
      '<label for="glossa-note-title">Título</label><input id="glossa-note-title" maxlength="100" placeholder="Una idea que no quieres olvidar">' +
      '<label for="glossa-note-text">Nota o fragmento</label><textarea id="glossa-note-text" maxlength="5000" placeholder="Escribe una reflexión, pega una cita o guarda lo que aprendiste…"></textarea>' +
      '<label for="glossa-note-book">Relacionar con una lectura</label><select id="glossa-note-book"><option value="">Nota general (sin lectura)</option></select>' +
      '<button class="btn-primary" id="glossa-note-save" type="submit" style="margin-top:.8rem">Guardar en mi cuaderno</button></form>' +
      '<div class="section-label">Mis notas <span id="glossa-notes-count"></span></div><div id="glossa-notes-list"></div></div>';
    var statsScreen = document.getElementById('screen-stats');
    if (statsScreen && statsScreen.parentNode) statsScreen.parentNode.insertBefore(screen, statsScreen.nextSibling);
    document.getElementById('glossa-note-form').addEventListener('submit', function (event) { event.preventDefault(); saveNotebookNote(); });
    document.getElementById('glossa-new-note').addEventListener('click', newNotebookNote);
  }
  function addNotebookNavigation() {
    document.querySelectorAll('.bottom-nav').forEach(function (nav) {
      if (nav.querySelector('[data-glossa-notebook-nav]')) return;
      var item = document.createElement('div');
      item.className = 'nav-item glossa-nav-item';
      item.setAttribute('data-glossa-notebook-nav', 'true');
      item.innerHTML = '<span>📝</span>Cuaderno';
      item.setAttribute('role','button');
      item.tabIndex = 0;
      item.addEventListener('click', function () { window.showMain('notebook'); });
      item.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); window.showMain('notebook'); } });
      nav.appendChild(item);
    });
  }

  if (typeof originalSaveState === 'function') {
    window.saveState = function () { originalSaveState.apply(this, arguments); persistEnhancementData(); };
  }
  if (typeof originalRenderBooks === 'function') {
    window.renderBooks = function () {
      originalRenderBooks.apply(this, arguments);
      var input = document.getElementById('glossa-library-query');
      if (input) filterRenderedBooks(input.value);
      updateOfflineStatus();
    };
  }
  if (typeof originalRenderCurrentPage === 'function') {
    window.renderCurrentPage = function () {
      var result = originalRenderCurrentPage.apply(this, arguments);
      markReadingActivity();
      return result;
    };
  }
  if (typeof originalShowMain === 'function') {
    window.showMain = function (name) {
      var result = originalShowMain.apply(this, arguments);
      if (name === 'notebook') renderNotebook();
      if (name === 'library' || name === 'stats') refreshStreakSurfaces();
      if (name === 'library') updateOfflineStatus();
      document.querySelectorAll('.bottom-nav .nav-item').forEach(function (item) {
        item.classList.toggle('active', item.getAttribute('data-glossa-notebook-nav') === 'true' && name === 'notebook');
      });
      return result;
    };
  }

  function initEnhancements() {
    buildNotebookScreen();
    addNotebookNavigation();
    buildSearchAndOfflineUI();
    renderNotebook();
    refreshStreakSurfaces();
    updateOfflineStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initEnhancements, {once:true});
  else initEnhancements();

  window.renderNotebook = renderNotebook;
  window.saveNotebookNote = saveNotebookNote;
  window.newNotebookNote = newNotebookNote;
  window.captureReaderNote = captureReaderNote;
  window.recalculateReadingStreak = recalculateStreak;
})();