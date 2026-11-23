/* =====================================================================
   CoMeBench — page renderer

   The page is built from content.json at load time, so editors can change
   text, add/remove/reorder modules without touching any HTML.

   Module types: overview · cards · tasks · table · code
   Adding a new type = add a function to RENDERERS below.
   ===================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------ utils */
  const esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // tiny inline markdown: **bold**, *italic*, `code`
  const md = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>')
      .replace(/`([^`]+?)`/g, '<code>$1</code>');

  const navHref = (url) => (url && String(url).trim() ? String(url).trim() : '#');

  const el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  /* ------------------------------------------------------------ icons */
  const ICONS = {
    paper: '<path d="M6 2h9l5 5v15H6V2Z"/>',
    code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
    dataset:
      '<path d="M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Z"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
    grid: '<path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/>',
    list: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    github: ''
  };

  const featureIcon = (name, i) => {
    const body = ICONS[name] || ICONS.grid;
    return `<div class="feature-icon" style="--i:${i}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>
    </div>`;
  };

  /* ------------------------------------------------------------- head */
  function renderNav(data) {
    const links = data.sections
      .filter((s) => s.nav && s.nav.trim())
      .map((s) => `<a href="#${esc(s.id)}">${esc(s.nav)}</a>`)
      .join('');

    const gh = data.site.links && data.site.links.github;

    return `
      <div class="nav-inner">
        <a class="nav-brand" href="#top" aria-label="${esc(data.site.title)} home">
          <img src="assets/logo.svg" alt="${esc(data.site.title)}" height="24">
        </a>
        <nav class="nav-links" id="navLinks" aria-label="Section navigation">${links}</nav>
        <div class="nav-actions">
          <a class="btn btn-ghost btn-sm" href="${navHref(gh)}"${
            gh ? '' : ' data-placeholder="1"'
          }>GitHub ↗</a>
          <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navLinks" aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="nav-progress" id="navProgress"></div>`;
  }

  /* ------------------------------------------------------------- hero */
  function renderHero(data) {
    const s = data.site;
    const h = data.hero || {};
    const hasVideo = !!(h.video && String(h.video).trim());

    const authors = (s.authors || [])
      .map((a) => `<span>${esc(a.name)}${a.sup ? `<sup>${esc(a.sup)}</sup>` : ''}</span>`)
      .join(', ');

    const affils = (s.affiliations || [])
      .map((a, i) => `<sup>${i + 1}</sup> ${esc(a)}`)
      .join(' &nbsp;·&nbsp; ');

    const L = s.links || {};
    const cta = [
      ['Paper', 'paper', L.paper, 'btn-primary'],
      ['Code', 'code', L.code, ''],
      ['Dataset', 'dataset', L.dataset, ''],
      ['Leaderboard', 'chart', L.leaderboard || '#leaderboard', '']
    ]
      .map(
        ([label, icon, url, cls]) => `
        <a class="btn ${cls}" href="${navHref(url)}">
          <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[icon]}</svg>
          ${label}
        </a>`
      )
      .join('');

    const stats = (h.stats || [])
      .map((st) => `<li><b>${esc(st.value)}</b><span>${esc(st.label)}</span></li>`)
      .join('');

    // background: looping video when configured, otherwise the gradient blobs
    const posterStyle =
      hasVideo && h.poster ? ` style="background-image:url('${esc(h.poster)}')"` : '';

    const bg = hasVideo
      ? `<div class="hero-bg" aria-hidden="true"${posterStyle}>
           <video class="hero-video-el" autoplay muted loop playsinline preload="metadata"${
             h.poster ? ` poster="${esc(h.poster)}"` : ''
           }>
             <source src="${esc(h.video)}" type="video/mp4">
           </video>
         </div>
         <div class="hero-scrim" aria-hidden="true"></div>`
      : `<div class="hero-bg" aria-hidden="true">
           <div class="blob blob-1"></div>
           <div class="blob blob-2"></div>
           <div class="blob blob-3"></div>
           <div class="grid-lines"></div>
         </div>`;

    const logo = hasVideo ? 'assets/logo-light.svg' : 'assets/logo.svg';

    return `
      <section class="hero${hasVideo ? ' hero-video' : ''}">
        ${bg}
        <div class="container hero-inner">
          ${s.venue ? `<div class="venue-pill"><span class="dot"></span><span>${esc(s.venue)}</span></div>` : ''}
          <h1 class="hero-logo"><img src="${logo}" alt="${esc(s.title)}"></h1>
          ${s.tagline ? `<p class="hero-sub">${md(s.tagline)}</p>` : ''}
          ${authors ? `<p class="hero-authors">${authors}</p>` : ''}
          ${affils ? `<p class="hero-affil">${affils}</p>` : ''}
          ${s.affilNotes ? `<p class="hero-affil">${md(s.affilNotes)}</p>` : ''}
          <div class="hero-cta">${cta}</div>
          ${stats ? `<ul class="hero-stats">${stats}</ul>` : ''}
        </div>
      </section>`;
  }

  /* --------------------------------------------------------- sections */
  const RENDERERS = {
    /* 概述：左文字 + 右侧信息卡 */
    overview(sec) {
      const paragraphs = (sec.paragraphs || []).map((p) => `<p>${md(p)}</p>`).join('');
      const rows = ((sec.aside && sec.aside.rows) || [])
        .map((r) => `<div><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`)
        .join('');
      const aside = sec.aside
        ? `<aside class="card card-aside">
             <h3>${esc(sec.aside.title || 'At a glance')}</h3>
             <dl class="kv">${rows}</dl>
             ${
               sec.aside.buttonLabel
                 ? `<a class="btn btn-primary btn-block" href="${navHref(sec.aside.buttonUrl)}">${esc(
                     sec.aside.buttonLabel
                   )}</a>`
                 : ''
             }
           </aside>`
        : '';

      return `<div class="overview-grid">
          <div class="prose">${paragraphs}</div>
          ${aside}
        </div>`;
    },

    /* 卡片网格 */
    cards(sec) {
      const cards = (sec.items || [])
        .map(
          (it, i) => `<article class="card card-feature">
            ${featureIcon(it.icon, (i % 3) + 1)}
            <h3>${md(it.title)}</h3>
            <p>${md(it.text)}</p>
          </article>`
        )
        .join('');
      return `<div class="cards-3">${cards}</div>`;
    },

    /* 任务卡片网格 */
    tasks(sec) {
      const items = (sec.items || [])
        .map((it, i) => {
          const color = it.tagColor && it.tagColor !== 'a' ? ` tag-${it.tagColor}` : '';
          return `<article class="task">
            <div class="task-top">
              <span class="tag${color}">${esc(it.tag)}</span>
              <span class="task-no">${String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3>${md(it.title)}</h3>
            <p>${md(it.text)}</p>
          </article>`;
        })
        .join('');

      const more = sec.moreLabel
        ? `<article class="task task-more">
             <div>${esc(sec.moreLabel)}</div>
             <a href="${navHref(sec.moreUrl)}" class="link-arrow">${esc(
               sec.moreText || 'See the full list →'
             )}</a>
           </article>`
        : '';

      return `<div class="task-grid">${items}${more}</div>`;
    },

    /* 榜单表格 */
    table(sec) {
      const cols = (sec.columns || [])
        .map((c) => `<th class="num">${esc(c)}</th>`)
        .join('');

      let rank = 0;
      const rows = (sec.rows || [])
        .map((r) => {
          const ghost = r.ghost || r.isOurs === false && /human/i.test(r.model || '');
          const rankCell = ghost ? '–' : r.isOurs ? `<span class="medal">1</span>` : ++rank + 1;
          if (!ghost && !r.isOurs) { /* rank already incremented */ }
          const cls = ghost ? ' class="row-human"' : r.isOurs ? ' class="row-best"' : '';
          const cells = (r.cells || [])
            .map((c) => `<td class="num">${esc(c)}</td>`)
            .join('');
          const badge = r.badge
            ? ` <span class="badge${ghost ? ' badge-ghost' : ''}">${esc(r.badge)}</span>`
            : '';
          const avg = r.isOurs ? `<b>${esc(r.average)}</b>` : esc(r.average);
          return `<tr${cls}>
            <td class="col-rank">${rankCell}</td>
            <td class="model">${esc(r.model)}${badge}</td>
            ${cells}
            <td class="num col-avg">${avg}</td>
          </tr>`;
        })
        .join('');

      return `<div class="table-wrap">
          <table class="leaderboard">
            <thead><tr>
              <th class="col-rank">#</th><th>Model</th>${cols}
              <th class="num col-avg">Average ↑</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${sec.note ? `<p class="table-note">${md(sec.note)}</p>` : ''}`;
    },

    /* 代码块（可选右侧步骤列表） */
    code(sec, data) {
      const body = sec.codeFrom === 'citation' ? data.site.citation : sec.code;
      const targetId = 'code-' + (sec.id || 'x');
      const steps = (sec.steps || [])
        .map(
          (st, i) => `<li>
            <span class="step-no">${i + 1}</span>
            <div><h4>${esc(st.title)}</h4><p>${md(st.text)}</p></div>
          </li>`
        )
        .join('');

      const block = `<div class="code-block">
          <div class="code-head">
            <span class="code-dots"><i></i><i></i><i></i></span>
            <span class="code-title">${esc(sec.filename || 'terminal')}</span>
            <button class="copy-btn" data-copy-target="${targetId}">Copy</button>
          </div>
          <pre id="${targetId}"><code>${esc(body || '')}</code></pre>
        </div>`;

      return steps
        ? `<div class="start-grid">${block}<ol class="steps">${steps}</ol></div>`
        : block;
    }
  };

  /* ----------------------------------------------------------- footer */
  function renderFooter(data) {
    const s = data.site;
    const L = s.links || {};
    const link = (label, url) => `<a href="${navHref(url)}">${label}</a>`;
    return `
      <div class="container footer-inner">
        <div class="footer-brand">
          <img src="assets/logo.svg" alt="${esc(s.title)}" height="20">
          <p>${md(s.tagline || '')}</p>
        </div>
        <div class="footer-links">
          ${link('Paper', L.paper)}${link('Code', L.code)}${link('Dataset', L.dataset)}${link(
            'Citation',
            '#cite'
          )}
        </div>
        <p class="footer-note">© ${new Date().getFullYear()} ${esc(
          (s.affiliations && s.affiliations[0]) || s.title
        )}. Page layout inspired by common academic project pages.</p>
      </div>`;
  }

  /* --------------------------------------------------------- assembly */
  function renderSection(sec, data) {
    const fn = RENDERERS[sec.type];
    if (!fn) {
      console.warn('[render] unknown module type:', sec.type);
      return '';
    }
    const inner = fn(sec, data);
    const classes = ['section', sec.alternate ? 'section-alt' : ''].filter(Boolean).join(' ');
    const container = sec.narrow ? 'container container-narrow' : 'container';

    return `<section class="${classes}" id="${esc(sec.id)}">
        <div class="${container}">
          <div class="section-head">
            ${sec.eyebrow ? `<span class="eyebrow">${esc(sec.eyebrow)}</span>` : ''}
            ${sec.heading ? `<h2>${esc(sec.heading)}</h2>` : ''}
            ${sec.description ? `<p class="section-desc">${md(sec.description)}</p>` : ''}
          </div>
          ${inner}
        </div>
      </section>`;
  }

  /* ------------------------------------------------------- behaviours */
  function initBehaviours() {
    const nav = document.getElementById('nav');
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.getElementById('navToggle');
    const progress = document.getElementById('navProgress');

    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (nav) nav.classList.toggle('is-stuck', y > 8);
      if (progress) {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(open));
      });
      navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          navLinks.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // scroll spy
    const sections = [...document.querySelectorAll('section[id]')];
    const linkFor = {};
    document.querySelectorAll('.nav-links a[href^="#"]').forEach((a) => {
      linkFor[a.getAttribute('href').slice(1)] = a;
    });

    if ('IntersectionObserver' in window && sections.length) {
      const visible = new Map();
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            visible.set(en.target.id, en.isIntersecting ? en.intersectionRatio : 0);
          });
          let bestId = null;
          let best = 0;
          visible.forEach((r, id) => {
            if (r > best) { best = r; bestId = id; }
          });
          if ((window.scrollY || 0) < 260) bestId = null;
          Object.entries(linkFor).forEach(([id, a]) => a.classList.toggle('is-active', id === bestId));
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
      );
      sections.forEach((s) => io.observe(s));
    }

    // copy buttons
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const target = document.getElementById(btn.dataset.copyTarget);
        if (!target) return;
        const text = target.innerText;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;left:-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        const original = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('is-copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('is-copied');
        }, 1600);
      });
    });

    // placeholder links do nothing instead of jumping to the top
    document.querySelectorAll('[data-placeholder]').forEach((a) => {
      a.addEventListener('click', (e) => e.preventDefault());
    });
    document.querySelectorAll('a[href="#"]').forEach((a) => {
      a.addEventListener('click', (e) => e.preventDefault());
      a.title = 'Placeholder — add the real URL in content.json';
    });
  }

  /* ------------------------------------------------------------- boot */
  async function boot() {
    const app = document.getElementById('app');
    let data;
    try {
      const res = await fetch('content.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
    } catch (err) {
      app.innerHTML = `<div class="container" style="padding:120px 24px;max-width:720px">
        <h2 style="margin-bottom:12px">Cannot load content.json</h2>
        <p style="color:#6b7484;line-height:1.7">
          The page is built from <code>content.json</code>, and browsers block that file
          when the page is opened directly from disk (<code>file://</code>).
        </p>
        <p style="color:#6b7484;line-height:1.7">
          Start a local server instead — double-click
          <strong>开始本地预览.bat</strong>, or run
          <code>python -m http.server 5500</code> in this folder.
        </p>
        <p style="color:#98a1b0;font-size:13px">${esc(err.message)}</p>
      </div>`;
      return;
    }

    document.title = data.site.title + ' — ' + (data.site.tagline || '').replace(/\*\*/g, '');

    document.getElementById('nav').innerHTML = renderNav(data);
    document.getElementById('footer').innerHTML = renderFooter(data);

    app.innerHTML =
      renderHero(data) + (data.sections || []).map((s) => renderSection(s, data)).join('');

    initBehaviours();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
