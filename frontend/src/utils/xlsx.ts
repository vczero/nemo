import * as XLSX from 'xlsx'

export const isCellEmpty = (cell: unknown): boolean => {
  return cell === undefined || cell === null || String(cell).trim() === ''
}

// for debug
;(window as any).__XLSX__ = XLSX

export const cleanTableData = (data: any[][]): any[][] => {
  const header = data[0].filter((cell) => !isCellEmpty(cell))
  const headerIndex: number[] = data[0].reduce((acc, cell, index) => {
    if (!isCellEmpty(cell)) {
      acc.push(index)
    }
    return acc
  }, [])
  const tableData: any[][] = [header]

  // Iterate rows
  for (let i = 1; i < data.length; i++) {
    const rowData: any[] = []
    const row = data[i]

    let hasData = false
    headerIndex.forEach((index) => {
      const val = row[index]
      rowData.push(val ?? null)
      if (!isCellEmpty(val)) {
        hasData = true
      }
    })

    if (hasData) {
      tableData.push(rowData)
    }
  }

  return tableData
}

export const parseToJSON = async <T extends Record<string, any>[]>(
  data: any,
  type?: 'binary' | 'buffer' | 'array'
): Promise<T> => {
  const workbook: XLSX.WorkBook = XLSX.read(data)

  // if there are multiple sheets, we only take the first one
  if (workbook.SheetNames.length === 0) {
    throw new Error('文件中未找到任何工作表')
  }
  const firstSheetName = workbook.SheetNames[0]
  const worksheet: XLSX.WorkSheet = workbook.Sheets[firstSheetName]

  if (worksheet['!merges'] && worksheet['!merges'].length > 0) {
    throw new Error('工作表中包含合并单元格，请拆分后上传。')
  }

  // get the original 2D array (header: 1 returns any[][])
  const rawData = XLSX.utils.sheet_to_json<T>(worksheet)

  return rawData as T
}

/**
 * Parse Excel/CSV file to 2D Array
 * @param data - The data to parse (buffer, binary string, etc.)
 * @param type - The type of data
 * @param format - The format of the data: table or json, default is table
 * @returns {Promise<any[][]>} - Parsed 2D array
 */
export const parseToTable = async (
  data: any,
  type?: 'binary' | 'buffer' | 'array'
): Promise<any[][]> => {
  // Auto-detect ArrayBuffer as 'buffer' type when type is not specified
  const detectedType = type ?? (data instanceof ArrayBuffer ? 'buffer' : undefined)
  const workbook: XLSX.WorkBook = XLSX.read(data, { type: detectedType, dense: true })

  // if there are multiple sheets, we only take the first one
  if (workbook.SheetNames.length === 0) {
    throw new Error('文件中未找到任何工作表')
  }
  const firstSheetName = workbook.SheetNames[0]
  const worksheet: XLSX.WorkSheet = workbook.Sheets[firstSheetName]

  if (worksheet['!merges'] && worksheet['!merges'].length > 0) {
    throw new Error('工作表中包含合并单元格，请拆分后上传。')
  }

  // get the original 2D array (header: 1 returns any[][])
  const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
  })

  if (rawData.length === 0) {
    throw new Error('工作表为空。')
  }

  // Filter out empty rows at the end or completely empty rows
  const cleanedData = cleanTableData(rawData)

  if (cleanedData.length === 0) {
    throw new Error('文件中没有有效数据。')
  }

  // Normalize rows length to match header
  const maxCols = cleanedData[0].length
  for (let i = 1; i < cleanedData.length; i++) {
    while (cleanedData[i].length < maxCols) {
      cleanedData[i].push(null)
    }
  }
  return cleanedData
}

/**
 * parser excel array buffer to Table Data
 * @param {ArrayBuffer} buffer - the array buffer to parse
 * @returns {Promise<any[][]>} - the parsed Table Data
 */
export const parseBufferToTable = async (
  buffer: ArrayBuffer
): Promise<any[][]> => {
  return parseToTable(buffer)
}

/**
 * Parse a excel file to 2D Table Array
 * @param {File} file - the file to parse
 * @returns {Promise<any[][]>} - the parsed 2D array
 */
export const parseFileToTable = (file: File): Promise<any[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result
        if (!data) {
          throw new Error('文件读取失败或内容为空')
        }
        parseToTable(data).then(resolve).catch(reject)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取发生错误'))
    reader.readAsArrayBuffer(file)
  })
}

// ============================================================
// Table validation
// ============================================================

export type TableFieldRule =
  | { type: 'required' }
  | { type: 'unique' }
  | { type: 'maxByteSize'; max: number }

export interface TableFieldSchema {
  /** Column name to match (case-insensitive) */
  name: string
  /** Display label for error messages. Falls back to `name`. */
  label?: string
  /** Validation rules applied to every data cell in this column */
  rules?: TableFieldRule[]
}

export interface TableValidationResult {
  valid: boolean
  error?: string
  /** Resolved column index for each field (by field name) */
  columnIndexes?: Record<string, number>
}

/**
 * Validate a parsed 2D table against a field schema.
 *
 * @param table  - 2D array where row 0 is the header
 * @param fields - Expected column definitions with optional rules.
 *                 If omitted, only checks that the table has ≥ 2 rows.
 * @param options.maxRows - The maximum number of rows allowed in the table.
 */
export const validateTable = (
  table: any[][],
  fields?: TableFieldSchema[],
  options?: { maxRows?: number }
): TableValidationResult => {
  if (options?.maxRows && table.length > options.maxRows + 1) {
    return { valid: false, error: `文件行数超过 ${options.maxRows} 行限制。` }
  }

  if (fields && fields.length > 0 && table.length < 2) {
    return { valid: false, error: '文件至少需要包含标题行和一行数据。' }
  }

  if (!fields || fields.length === 0) {
    return { valid: true }
  }

  const header = (table[0] as string[]).map((h) =>
    String(h).toLowerCase().trim()
  )

  if (header.length !== fields.length) {
    return {
      valid: false,
      error: `文件必须包含 ${fields.length} 列，当前有 ${header.length} 列。`,
    }
  }

  // Resolve column indexes
  const columnIndexes: Record<string, number> = {}
  for (const field of fields) {
    const idx = header.indexOf(field.name.toLowerCase().trim())
    if (idx === -1) {
      const label = field.label ?? field.name
      return { valid: false, error: `文件必须包含名为 "${label}" 的列。` }
    }
    columnIndexes[field.name] = idx
  }

  // Validate each field's rules
  for (const field of fields) {
    if (!field.rules || field.rules.length === 0) continue
    const colIdx = columnIndexes[field.name]
    const label = field.label ?? field.name

    for (const rule of field.rules) {
      if (rule.type === 'required') {
        for (let i = 1; i < table.length; i++) {
          const val = String(table[i][colIdx] ?? '').trim()
          if (!val) {
            return { valid: false, error: `第 ${i + 1} 行的 "${label}" 为空。` }
          }
        }
      }

      if (rule.type === 'unique') {
        const seen = new Set<string>()
        for (let i = 1; i < table.length; i++) {
          const val = String(table[i][colIdx] ?? '').trim()
          if (seen.has(val)) {
            return {
              valid: false,
              error: `"${label}" 值 "${val}" 重复（第 ${i + 1} 行）。`,
            }
          }
          seen.add(val)
        }
      }

      if (rule.type === 'maxByteSize') {
        for (let i = 1; i < table.length; i++) {
          const cellValue = String(table[i][colIdx] ?? '')
          const byteSize = new Blob([cellValue]).size
          if (byteSize > rule.max) {
            const limitMB = (rule.max / 1024 / 1024).toFixed(0)
            const actualMB = (byteSize / 1024 / 1024).toFixed(2)
            return {
              valid: false,
              error: `第 ${i + 1} 行 "${label}" 超过 ${limitMB}MB 限制（当前 ${actualMB}MB）。`,
            }
          }
        }
      }
    }
  }

  return { valid: true, columnIndexes }
}

/**
 * Shorthand: validate a task input file with [id, text] columns.
 * - id: required + unique
 * - text: maxByteSize 5MB
 */
export const validateTaskFile = (
  table: any[][],
  fileRules: { maxRows?: number } = {
    maxRows: 50000,
  }
): TableValidationResult => {
  return validateTable(
    table,
    [
      {
        name: 'id',
        label: 'id',
        rules: [
          { type: 'required' },
          { type: 'unique' },
          { type: 'maxByteSize', max: 10 * 1024 },
        ],
      },
      {
        name: 'text',
        label: 'text',
        rules: [{ type: 'maxByteSize', max: 5 * 1024 * 1024 }],
      },
    ],
    fileRules
  )
}

export const tableToXLSX = (data: any[][]): Blob => {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(data, { dense: true })
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  const xlsx = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
    compression: true,
  })
  const blob = new Blob([xlsx], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  return blob
}
