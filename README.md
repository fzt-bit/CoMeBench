# CoMeBench — project page

A self-contained static site for the CoMeBench dataset. No build step, no
dependencies, no CDN — open `index.html` and it works, online or offline.

```
D:\CoMeBench-site\
├─ index.html          ← all the content lives here
├─ styles.css          ← visual design, palette from the logo
├─ script.js           ← nav, scroll-spy, copy buttons (~120 lines)
└─ assets\
   ├─ logo.svg         ← your gradient wordmark
   └─ favicon.svg      ← generated "C" tile in the same gradient
```

## Preview locally

Double-click `index.html`. For a proper local server (recommended — some
browsers restrict `file://`):

```powershell
cd D:\CoMeBench-site
python -m http.server 8000
# then open http://localhost:8000
```

Or open the folder in VS Code and hit **Go Live** (Live Server extension).

## What is still placeholder

Every placeholder is wrapped in `<span class="tbd">…</span>`, which renders as
the lavender highlight you see on the page. Find them all with:

```powershell
Select-String -Path .\index.html -Pattern 'class="tbd"'
```

Replace the span with real text, **and keep the surrounding tags** — e.g.

```html
<!-- before -->
<span class="tbd">12</span>
<!-- after  -->
12
```

When every `.tbd` is gone, the page is clean. The `.tbd` rule in `styles.css`
can then be deleted.

Links worth checking: the four `data-tbd` anchors (`Paper`, `Code`, `Dataset`,
`GitHub` in the nav) still point at `#`. Give them real URLs and remove the
`data-tbd` attribute.

## Deploy to GitHub Pages

1. Create a repo, e.g. `CoMeBench`, and push these four items:

   ```powershell
   cd D:\CoMeBench-site
   git init
   git add index.html styles.css script.js assets
   git commit -m "CoMeBench project page"
   git branch -M main
   git remote add origin https://github.com/<org>/CoMeBench.git
   git push -u origin main
   ```

2. Repo → **Settings** → **Pages** → Source: `Deploy from a branch`,
   Branch: `main`, Folder: `/ (root)` → **Save**.

3. Live at `https://<org>.github.io/CoMeBench/` in about a minute.

If the repo is named `<org>.github.io` instead, it serves at the root domain.
Once you know the final URL, put it in the `<meta property="og:image">` tag so
link previews work.

## Design notes

- Palette is sampled from `assets/logo.svg`:
  `#8077E4 → #4565E8 → #237ACC → #078FAF → #009788`. Change the five
  `--brand-*` variables in `:root` to re-theme the whole page.
- The logo is used at three sizes: 24 px in the nav, 560 px in the hero, 20 px
  in the footer. Since it is a wide wordmark (aspect ≈ 5.14 : 1), it replaces
  the `<h1>` text — screen readers still get "CoMeBench" from the `alt`.
- No web fonts are loaded, so there is no layout shift and no network
  dependency. The stack falls back through Segoe UI / PingFang / YaHei.
- Responsive breakpoints: 900 px (nav collapses, two-column layouts stack) and
  640 px (stat grid becomes 2×2, tighter padding).
- `prefers-reduced-motion` is respected.
