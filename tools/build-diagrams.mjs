// Extracts every ```mermaid block from a Markdown file and renders each to a
// PNG via @mermaid-js/mermaid-cli (mmdc).
//
// Usage:
//   node build-diagrams.mjs [path/to/source.md] [outputDir]
// Defaults:
//   source = ../docs/REPORT.md
//   output = ../docs/diagrams

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const argv = process.argv.slice(2)
const SRC = resolve(REPO_ROOT, argv[0] || 'docs/REPORT.md')
const OUT_DIR = resolve(REPO_ROOT, argv[1] || 'docs/diagrams')

// Mermaid puppeteer config — tells mmdc to use Edge instead of bundled Chromium
const PUPPETEER_CFG = resolve(__dirname, 'puppeteer-config.json')

async function main() {
  const md = await readFile(SRC, 'utf8')
  await mkdir(OUT_DIR, { recursive: true })

  const blocks = extractMermaidBlocks(md)
  if (blocks.length === 0) {
    console.log('No mermaid blocks found.')
    return
  }
  console.log(`Found ${blocks.length} mermaid block(s) in ${SRC}`)

  const tmpDir = resolve(__dirname, '_mmd_tmp')
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  let ok = 0
  const failures = []
  for (let i = 0; i < blocks.length; i++) {
    const { source, label } = blocks[i]
    const slug = `${String(i + 1).padStart(2, '0')}-${label || 'diagram'}`
    const mmd = resolve(tmpDir, `${slug}.mmd`)
    const png = resolve(OUT_DIR, `${slug}.png`)
    await writeFile(mmd, source, 'utf8')
    console.log(`Rendering ${slug}.png…`)
    try {
      await runMmdc(mmd, png)
      ok += 1
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}`)
      failures.push(slug)
    }
  }

  console.log(`\n${ok}/${blocks.length} PNG(s) written to ${OUT_DIR}`)
  if (failures.length) {
    console.log(`Failed: ${failures.join(', ')}`)
    process.exitCode = 1
  }
}

function extractMermaidBlocks(md) {
  const blocks = []
  const lines = md.split('\n')
  let inBlock = false
  let buffer = []
  let lastHeading = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const heading = /^#{2,4}\s+(.*)/.exec(line)
    if (heading && !inBlock) lastHeading = heading[1]
    if (line.trim() === '```mermaid') {
      inBlock = true
      buffer = []
      continue
    }
    if (inBlock && line.trim() === '```') {
      inBlock = false
      blocks.push({
        source: buffer.join('\n'),
        label: slugify(lastHeading),
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

const MMDC_JS = resolve(__dirname, 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js')

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
    const child = spawn(process.execPath, args, { stdio: 'inherit', cwd: __dirname })
    child.on('exit', (code) => (code === 0 ? res() : rej(new Error(`mmdc exited ${code} for ${basename(input)}`))))
    child.on('error', rej)
  })
}

await main()
