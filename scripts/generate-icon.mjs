// Generates resources/icon.png (1024×1024) and resources/icon.ico (multi-size)
// from resources/icon.svg. Run with `npm run icon`.
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const svgPath = resolve(root, 'resources/icon.svg')
const pngPath = resolve(root, 'resources/icon.png')
const icoPath = resolve(root, 'resources/icon.ico')

const svg = readFileSync(svgPath)

// 1) Main 1024×1024 PNG — used by BrowserWindow at runtime and by electron-builder.
await sharp(svg).resize(1024, 1024).png().toFile(pngPath)
console.log('wrote', pngPath)

// 2) Multi-resolution ICO for Windows (taskbar / shortcut / installer).
//    .ico needs to contain several sizes so the OS picks the right one per surface.
const sizes = [16, 24, 32, 48, 64, 128, 256]
const pngBuffers = await Promise.all(
  sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer())
)
const icoBuffer = await pngToIco(pngBuffers)
writeFileSync(icoPath, icoBuffer)
console.log('wrote', icoPath, '(sizes:', sizes.join(', ') + ')')
