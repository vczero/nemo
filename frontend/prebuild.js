import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('start generate good.html')
const goodHtml = path.resolve(__dirname, 'good.html')
const outputPath = path.resolve(__dirname, 'dist', 'free-tools')
fs.mkdirSync(outputPath, { recursive: true })
const goodHtmlContent = fs.readFileSync(goodHtml, 'utf-8')
fs.writeFileSync(path.resolve(outputPath, 'good.html'), goodHtmlContent)

console.log('start generate 3rd tools')
const inputPath3rd = path.resolve(__dirname, '3rd-tools')
const outputPath3rd = path.resolve(__dirname, 'dist', '3rd-tools')
fs.cpSync(inputPath3rd, outputPath3rd, {
  recursive: true,
  filter: (src) => !src.endsWith('.DS_Store')
})

const dist = path.resolve(__dirname, 'dist')
const indexHtml = path.resolve(dist, 'index.html')
const indexHtmlContent = fs.readFileSync(indexHtml, 'utf-8')

fs.writeFileSync(path.resolve(dist, 'ywllab.html'), indexHtmlContent)
