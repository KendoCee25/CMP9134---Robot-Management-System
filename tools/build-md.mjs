// Generic Markdown → HTML → PDF renderer (academic stylesheet, Mermaid-aware).
//
// Usage:
//   node build-md.mjs <source.md> [<output.pdf>]
// Defaults the output to the same path as the source with `.pdf` extension.

import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, basename, extname } from 'node:path'
import { Marked } from 'marked'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')

const argv = process.argv.slice(2)
if (argv.length === 0) {
  console.error('Usage: node build-md.mjs <source.md> [<output.pdf>]')
  process.exit(2)
}

const SRC = resolve(REPO_ROOT, argv[0])
const OUT_PDF = resolve(REPO_ROOT, argv[1] || SRC.replace(/\.md$/i, '.pdf'))
const OUT_HTML = OUT_PDF.replace(/\.pdf$/i, '.html')
const SRC_DIR = dirname(SRC)

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]

async function main() {
  let raw = await readFile(SRC, 'utf8')
  if (raw.startsWith('---')) {
    const end = raw.indexOf('\n---', 3)
    if (end !== -1) raw = raw.slice(end + 4)
  }

  const marked = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      code(token) {
        if (token.lang === 'mermaid') {
          return `<div class="mermaid">${escapeHtml(token.text)}</div>`
        }
        const lang = token.lang ? ` class="language-${token.lang}"` : ''
        return `<pre><code${lang}>${escapeHtml(token.text)}</code></pre>`
      },
      // Rewrite relative image URLs to file:// so headless Edge can resolve them.
      image(token) {
        let href = token.href
        if (!/^[a-z]+:\/\//i.test(href) && !href.startsWith('data:')) {
          const abs = resolve(SRC_DIR, href).replace(/\\/g, '/')
          href = pathToFileURL(abs).toString()
        }
        const alt = escapeHtml(token.text || '')
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
        return `<img src="${href}" alt="${alt}"${title} />`
      },
    },
  })
  const body = await marked.parse(raw)

  const title = basename(SRC, extname(SRC))
  const html = htmlScaffold(body, title)
  await writeFile(OUT_HTML, html, 'utf8')
  console.log(`Wrote ${OUT_HTML}`)

  const edge = await findEdge()
  if (!edge) {
    console.error(`Edge not found — HTML is ready at ${OUT_HTML}. Open it in any browser and Print → Save as PDF.`)
    process.exit(2)
  }

  await printToPdf(edge, OUT_HTML, OUT_PDF)
  console.log(`Wrote ${OUT_PDF}`)
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function htmlScaffold(body, title) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  html { font-size: 11pt; }
  body {
    font-family: "Georgia", "Times New Roman", serif;
    color: #1a1a1a;
    line-height: 1.5;
    max-width: 170mm;
    margin: 0 auto;
    padding: 0 4mm;
  }
  h1, h2, h3, h4 {
    font-family: "Calibri", "Segoe UI", Arial, sans-serif;
    color: #0b3d91;
    page-break-after: avoid;
    margin-top: 1.6em;
    margin-bottom: 0.3em;
  }
  h1 { font-size: 22pt; border-bottom: 2px solid #0b3d91; padding-bottom: 4pt; }
  h2 { font-size: 16pt; border-bottom: 1px solid #d0d7de; padding-bottom: 3pt; margin-top: 2em; }
  h3 { font-size: 13pt; color: #1a4fbf; }
  h4 { font-size: 12pt; color: #1a4fbf; }
  p, li { text-align: justify; }
  blockquote {
    border-left: 3px solid #0b3d91;
    margin: 1em 0;
    padding: 0.4em 1em;
    background: #f4f7fc;
    color: #333;
    font-size: 0.95em;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: 0.92em;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #c0c6cf;
    padding: 5pt 8pt;
    vertical-align: top;
    text-align: left;
  }
  th { background: #eaf1fb; color: #0b3d91; }
  code {
    font-family: "Consolas", "Courier New", monospace;
    font-size: 0.92em;
    background: #f1f3f5;
    padding: 1pt 3pt;
    border-radius: 3px;
  }
  pre {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    padding: 8pt 12pt;
    font-size: 0.85em;
    overflow-x: auto;
    page-break-inside: avoid;
    white-space: pre-wrap;
    word-break: break-word;
  }
  pre code { background: transparent; padding: 0; }
  .mermaid { page-break-inside: avoid; text-align: center; margin: 1.2em 0; }
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1.2em auto;
    page-break-inside: avoid;
  }
  hr { border: none; border-top: 1px solid #d0d7de; margin: 2em 0; }
</style>
</head>
<body>
${body}
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
  await mermaid.run({ querySelector: '.mermaid' });
  window.__mermaidDone = true;
</script>
</body>
</html>`
}

async function findEdge() {
  for (const p of EDGE_CANDIDATES) {
    try { await readFile(p); return p } catch { /* try next */ }
  }
  return null
}

function printToPdf(edge, htmlPath, pdfPath) {
  return new Promise((resolveP, rejectP) => {
    const url = pathToFileURL(htmlPath).toString()
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--allow-file-access-from-files',
      `--print-to-pdf=${pdfPath}`,
      '--print-to-pdf-no-header',
      '--virtual-time-budget=8000',
      url,
    ]
    const child = spawn(edge, args, { stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolveP() : rejectP(new Error(`Edge exited ${code}`))))
    child.on('error', rejectP)
  })
}

await main()
