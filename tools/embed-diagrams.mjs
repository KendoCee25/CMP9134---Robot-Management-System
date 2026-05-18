// Renders every ```mermaid block in the given Markdown file(s) to a PNG and
// rewrites the file in place, replacing each block with a `![alt](path/png)`
// image reference.
//
// Usage:
//   node embed-diagrams.mjs docs/REPORT.md docs/UML_DIAGRAMS.md …
//
// Output PNGs land in `docs/diagrams/<basename-without-ext>/NN-slug.png`.

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename, relative } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const PUPPETEER_CFG = resolve(__dirname, 'puppeteer-config.json')
const MMDC_JS = resolve(__dirname, 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js')

const inputs = process.argv.slice(2)
if (inputs.length === 0) {
  console.error('Usage: node embed-diagrams.mjs <file.md> [<file.md> …]')
  process.exit(2)
}

for (const arg of inputs) {
  const file = resolve(REPO_ROOT, arg)
  await processFile(file)
}

async function processFile(file) {
  const md = await readFile(file, 'utf8')
  const blocks = extractMermaidBlocks(md)
  if (blocks.length === 0) {
    console.log(`${relative(REPO_ROOT, file)}: no mermaid blocks; skipping`)
    return
  }
  const baseName = basename(file, '.md').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const outDir = resolve(REPO_ROOT, 'docs', 'diagrams', baseName)
  await mkdir(outDir, { recursive: true })

  console.log(`${relative(REPO_ROOT, file)}: ${blocks.length} mermaid block(s)`)

  const tmpDir = resolve(__dirname, '_mmd_tmp')
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  // Render in order. Build replacement map: source-text → image-markdown.
  const replacements = new Map()
  for (let i = 0; i < blocks.length; i++) {
    const { source, label, fence } = blocks[i]
    const slug = `${String(i + 1).padStart(2, '0')}-${label || 'diagram'}`
    const mmd = resolve(tmpDir, `${slug}.mmd`)
    const png = resolve(outDir, `${slug}.png`)
    await writeFile(mmd, source, 'utf8')
    try {
      await runMmdc(mmd, png)
      const rel = relative(dirname(file), png).replace(/\\/g, '/')
      const alt = label ? label.replace(/-/g, ' ') : `Figure ${i + 1}`
      const img = `![${alt}](${rel})`
      replacements.set(fence, img)
      console.log(`  ✓ ${slug}.png`)
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}`)
    }
  }

  // Apply replacements to the file content. We replace the *exact* fenced
  // block text, including the opening ```mermaid and closing ```, so other
  // fenced code blocks (```js, ```bash, etc.) are untouched.
  let next = md
  for (const [fence, img] of replacements) {
    next = next.replace(fence, img)
  }
  if (next !== md) {
    await writeFile(file, next, 'utf8')
    console.log(`  wrote ${relative(REPO_ROOT, file)}`)
  }
}

function extractMermaidBlocks(md) {
  const blocks = []
  const lines = md.split('\n')
  let inBlock = false
  let blockStart = -1
  let buffer = []
  let lastHeading = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const heading = /^#{2,4}\s+(.*)/.exec(line)
    if (heading && !inBlock) lastHeading = heading[1]
    if (line.trim() === '```mermaid') {
      inBlock = true
      blockStart = i
      buffer = []
      continue
    }
    if (inBlock && line.trim() === '```') {
      inBlock = false
      const fence = lines.slice(blockStart, i + 1).join('\n')
      blocks.push({
        source: buffer.join('\n'),
        label: slugify(lastHeading),
        fence,
      })
      buffer = []
      continue
    }
    if (inBlock) buffer.push(line)
  }
  return blocks
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function runMmdc(input, output) {
  return new Promise((res, rej) => {
    const args = [
      MMDC_JS,
      '-i', input,
      '-o', output,
      '-b', 'white',
      '-t', 'neutral',
      '--scale', '2',
      '-p', PUPPETEER_CFG,
    ]
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'], cwd: __dirname })
    let err = ''
    child.stderr.on('data', (d) => (err += d.toString()))
    child.on('exit', (code) => (code === 0 ? res() : rej(new Error(`mmdc exited ${code}: ${err.split('\n').slice(0, 3).join(' ')}`))))
    child.on('error', rej)
  })
}
