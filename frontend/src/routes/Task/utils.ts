import { tableToXLSX } from '@/utils/xlsx'
import { downloadFile } from '@/utils/utils'

export const createAndDownloadTemplateFile = (
  fileName: string,
  fileContent?: any[]
) => {
  const table = Array.isArray(fileContent)
    ? fileContent
    : [['id', 'text'], [1, '这里输入第一块文本'], [2, '这里输入第二块文本']]
  const blob = tableToXLSX(table)
  downloadFile(fileName, blob)
}

/**
 * Convert multi-line text input into a one-column XLSX `File` shaped as
 * `[id, text]` — the standard input format for ML task uploads.
 */
export const textContentToXLSX = (
  textContent: string,
  fileName: string = 'input.xlsx'
): File => {
  const lines = textContent.trim().split('\n')
  const table: [number | string, string][] = [
    ['id', 'text'],
    ...lines.reduce((acc: [number, string][], line: string) => {
      const content = line.trim()
      if (content.length > 0) {
        acc.push([acc.length + 1, content])
      }
      return acc
    }, []),
  ]

  const blob = tableToXLSX(table)
  return new File([blob], fileName, { type: blob.type })
}
