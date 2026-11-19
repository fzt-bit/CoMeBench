/* =====================================================================
   CoMeBench — page behaviour
   No dependencies. Everything degrades gracefully without JS.
   ===================================================================== */

(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const navLinks = document.getElementById('navLinks');
  const navToggle = document.getElementById('navToggle');
  const progress = document.getElementById('navProgress');

  /* ------------------------------------------------ sticky nav shadow */
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-stuck', y > 8);

    if (progress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progress.style.transform = 'scaleX(' + ratio + ')';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------------- mobile menu */
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

  /* --------------------------------------------------- scroll spy */
  const sections = [...document.querySelectorAll('section[id]')];
  const linkFor = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach((a) => {
    linkFor[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window && sections.length) {
    const visible = new Map();

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      let bestId = null;
      let bestRatio = 0;
      visible.forEach((ratio, id) => {
        if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
      });

      // near the top of the page nothing should look "current"
      const y = window.scrollY || document.documentElement.scrollTop;
      if (y < 260) bestId = null;

      Object.entries(linkFor).forEach(([id, a]) => {
        a.classList.toggle('is-active', id === bestId);
      });
    }, {
      rootMargin: '-45% 0px -45% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    sections.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------ copy buttons */
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = document.getElementById(btn.dataset.copyTarget);
      if (!target) return;
      const text = target.innerText;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // fallback for non-secure contexts (file://, plain http)
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
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

  /* --------------------------------- placeholder links: no jumping */
  document.querySelectorAll('[data-tbd]').forEach((el) => {
    if (el.tagName === 'A' && el.getAttribute('href') === '#') {
      el.addEventListener('click', (e) => e.preventDefault());
      el.title = 'Placeholder — replace this link (' + el.dataset.tbd + ')';
    }
  });

})();
