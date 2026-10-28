import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const exampleFilePath = fileURLToPath(
  new URL('../../data/example-message.txt', import.meta.url),
)

export async function readExampleFile() {
  return readFile(exampleFilePath, 'utf8')
}
