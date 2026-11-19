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

## 可视化编辑（不写代码改内容）

双击 **`开始可视化编辑.bat`**，它会启动本地服务并自动用浏览器打开编辑模式。

或者在任意浏览器地址后面加 `?edit=1`：

```
http://127.0.0.1:5500/?edit=1
file:///D:/CoMeBench-site/index.html?edit=1
```

进入编辑模式后：

- 页面上**所有文字都可直接点击修改**，像改 Word 一样
- 鼠标悬停会出现虚线框，表示这块能改
- 底部工具栏显示**还剩多少处占位符**
- 改完点 **「保存修改」**（或按 `Ctrl+S`），会直接覆盖 `index.html`
- 想反悔点 **「放弃并刷新」**

保存后的文件是干净的 HTML：编辑器的工具栏、`contenteditable` 属性、运行时残留的 CSS 类都会被自动剥掉，同时保留所有 HTML 注释和 `class="tbd"` 占位标记，所以可以反复编辑。

发布出去的页面对访客完全无影响——`editor.js` 只有在网址带 `?edit=1` 时才会启动。

> 通过 `http://` 打开时可以直接覆盖原文件；直接双击 `index.html`（`file://`）打开时会退化为"下载一个新文件"，需要你手动替换。

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
