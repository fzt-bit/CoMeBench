/* =====================================================================
   CoMeBench — visual edit mode

   Activated only when the URL contains ?edit=1, so the published page
   stays completely inert for visitors.

       http://127.0.0.1:5500/?edit=1
       file:///D:/CoMeBench-site/index.html?edit=1

   What it does
     - makes every text block on the page directly editable
     - blocks link navigation so clicks don't navigate away
     - "Save" writes the modified page back out as clean HTML
       (uses the File System Access API to overwrite index.html in place
        when served over http://; otherwise falls back to a download)
   ===================================================================== */

(function () {
  'use strict';

  if (!/[?&]edit=1/.test(location.search)) return;

  /* ---------------------------------------------------- what is text? */
  const BLOCK_TAGS = new Set([
    'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'LI', 'TD', 'TH', 'DT', 'DD', 'BLOCKQUOTE', 'FIGCAPTION', 'A'
  ]);

  const SKIP_PARENTS = new Set(['PRE', 'CODE', 'NAV', 'SCRIPT', 'STYLE']);

  function isEditable(el) {
    if (!BLOCK_TAGS.has(el.tagName)) return false;
    if (el.closest('pre, code, nav, script, style')) return false;
    if (el.closest('[data-editor-ui]')) return false;
    // skip containers whose text already lives in nested blocks
    for (const tag of BLOCK_TAGS) {
      if (el.querySelector(tag.toLowerCase())) return false;
    }
    return true;
  }

  const editable = [...document.querySelectorAll(
    'p, h1, h2, h3, h4, h5, h6, li, td, th, dt, dd, blockquote, figcaption, a'
  )].filter(isEditable);

  /* ------------------------------------------------------------ style */
  const style = document.createElement('style');
  style.setAttribute('data-editor-ui', '');
  style.textContent = `
    html.edit-mode [contenteditable="true"]:hover {
      outline: 1px dashed rgba(69,101,232,.55);
      outline-offset: 2px;
      border-radius: 3px;
    }
    html.edit-mode [contenteditable="true"]:focus {
      outline: 2px solid #4565E8;
      outline-offset: 2px;
      background: rgba(69,101,232,.055);
      border-radius: 3px;
    }
    html.edit-mode .tbd { cursor: text; }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('edit-mode');

  editable.forEach((el) => {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
  });

  /* --------------------------------------------- block link navigation */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ---------------------------------------------------------- toolbar */
  const bar = document.createElement('div');
  bar.setAttribute('data-editor-ui', '');
  bar.innerHTML = `
    <span class="ve-status" data-ve-status></span>
    <button class="ve-btn ve-btn-primary" data-ve-save>保存修改</button>
    <button class="ve-btn" data-ve-discard>放弃并刷新</button>
    <button class="ve-btn" data-ve-exit>退出编辑</button>
  `;
  document.body.appendChild(bar);

  const barStyle = document.createElement('style');
  barStyle.setAttribute('data-editor-ui', '');
  barStyle.textContent = `
    [data-editor-ui] > .ve-btn { font: inherit; }
    body > [data-editor-ui] {
      position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%);
      z-index: 9999; display: flex; align-items: center; gap: 8px;
      padding: 9px 10px 9px 16px; border-radius: 999px;
      background: rgba(20,23,28,.94); backdrop-filter: blur(10px);
      box-shadow: 0 12px 40px rgba(0,0,0,.35);
      color: #cfd6e2; font: 13px/1.4 "Segoe UI", system-ui, sans-serif;
      white-space: nowrap;
    }
    .ve-status { margin-right: 6px; color: #9aa6b8; }
    .ve-status b { color: #f2bb4a; font-weight: 600; }
    .ve-btn {
      border: 1px solid #333b47; background: #232a34; color: #d7dde6;
      padding: 7px 14px; border-radius: 999px; cursor: pointer; font-size: 13px;
    }
    .ve-btn:hover { background: #2c3440; color: #fff; }
    .ve-btn-primary {
      border-color: transparent; color: #fff;
      background: linear-gradient(100deg,#8077E4,#4565E8 30%,#237ACC 60%,#078FAF 80%,#009788);
    }
    .ve-btn-primary:hover { filter: brightness(1.08); }
  `;
  document.head.appendChild(barStyle);

  const statusEl = bar.querySelector('[data-ve-status]');

  function refreshStatus() {
    const left = document.querySelectorAll('.tbd').length;
    statusEl.innerHTML = left
      ? `编辑模式 · 还有 <b>${left}</b> 处占位`
      : '编辑模式 · 占位已全部填完';
  }
  refreshStatus();

  /* ------------------------------------------- turn the page into HTML */
  function serialize() {
    const clone = document.documentElement.cloneNode(true);

    // strip editor UI (but keep the editor.js tag itself, so the saved
    // file can be opened with ?edit=1 again)
    clone.querySelectorAll('[data-editor-ui]').forEach((n) => n.remove());

    // strip edit attributes
    clone.querySelectorAll('[contenteditable]').forEach((n) => {
      n.removeAttribute('contenteditable');
      n.removeAttribute('spellcheck');
    });
    clone.classList.remove('edit-mode');

    // strip runtime state left behind by script.js
    clone.querySelectorAll('.is-stuck').forEach((n) => n.classList.remove('is-stuck'));
    clone.querySelectorAll('.is-active').forEach((n) => n.classList.remove('is-active'));
    clone.querySelectorAll('.is-open').forEach((n) => n.classList.remove('is-open'));
    clone.querySelectorAll('.is-copied').forEach((n) => n.classList.remove('is-copied'));

    const progress = clone.querySelector('#navProgress');
    if (progress) progress.removeAttribute('style');

    // tidy: drop empty class="" / style="" attributes
    clone.querySelectorAll('[class=""]').forEach((n) => n.removeAttribute('class'));

    return '<!DOCTYPE html>\n' + clone.outerHTML + '\n';
  }

  function toast(msg) {
    const old = document.querySelector('[data-ve-toast]');
    if (old) old.remove();
    const t = document.createElement('div');
    t.setAttribute('data-editor-ui', '');
    t.setAttribute('data-ve-toast', '');
    t.textContent = msg;
    t.style.cssText = `
      position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%);
      z-index: 10000; padding: 10px 18px; border-radius: 10px;
      background: #0f172a; color: #e2e8f0; font: 13px/1.4 "Segoe UI", system-ui, sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,.3);
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  async function save() {
    const html = serialize();

    // best path: overwrite the real file in place (needs http:// origin)
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'index.html',
          types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }]
        });
        const w = await handle.createWritable();
        await w.write(html);
        await w.close();
        toast('已保存，刷新页面可查看结果');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        // otherwise fall through to download
      }
    }

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('已下载 index.html，用它替换文件夹里的同名文件');
  }

  bar.querySelector('[data-ve-save]').addEventListener('click', save);

  bar.querySelector('[data-ve-discard]').addEventListener('click', () => {
    if (confirm('放弃本次所有修改并重新加载？')) location.reload();
  });

  bar.querySelector('[data-ve-exit]').addEventListener('click', () => {
    location.href = location.pathname;
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') {
      document.activeElement && document.activeElement.blur();
    }
  });

  console.log('[editor] 可视化编辑已开启，共 ' + editable.length + ' 个可编辑文本块');
})();
