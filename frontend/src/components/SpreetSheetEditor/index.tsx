import React, { useState, useEffect, useCallback } from 'react'
import { Button } from 'antd'
import { DataGrid, renderTextEditor, type Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { generateRandomKey, downloadFile, getFileName } from '@/utils/utils'
import { tableToXLSX, isCellEmpty } from '@/utils/xlsx'
import dayjs from 'dayjs'

export type TableData = any[][]
export type RowData = Record<string, any>

interface ExcelEditorProps {
  editable?: boolean
  fileName?: string
  initialDataSource: TableData
  onCancel: () => void
  onSave: (data: TableData, file: File) => Promise<void>
}

const getExcelColumnName = (colIndex: number): string => {
  let temp,
    letter = ''
  while (colIndex >= 0) {
    temp = colIndex % 26
    letter = String.fromCharCode(temp + 65) + letter
    colIndex = Math.floor(colIndex / 26) - 1
  }
  return letter
}

function rowKeyGetter(row: any) {
  return row.__row_index__
}

function rowClassName(row: any) {
  return row.__isHeader ? 'excel-header-row' : undefined
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({
  editable = true,
  fileName,
  initialDataSource,
  onSave,
  onCancel,
}) => {
  const MIN_ROWS = 80
  const MIN_COLS = 10
  const [isLoading, setIsLoading] = useState(false)
  const [rows, setRows] = useState<RowData[]>([])
  const [columns, setColumns] = useState<Column<RowData>[]>([])

  useEffect(() => {
    // initialDataSource is now any[][]
    // Row 0 is header.
    const headerRow = initialDataSource && initialDataSource.length > 0 ? initialDataSource[0] : []

    // We treat 2D array as grid.
    // internal representation: we can still use RowData with keys __col_0__, __col_1__
    const totalCols = Math.max(headerRow.length, MIN_COLS)

    const newColumns: Column<RowData>[] = [
      {
        key: '__row_index__',
        name: '',
        width: 30,
        frozen: true,
        resizable: false,
        renderCell: ({ rowIdx }) => {
          return <div>{rowIdx + 1}</div> // header is row 1
        },
      },
    ]

    for (let i = 0; i < totalCols; i++) {
      newColumns.push({
        key: `__col_${i}__`,
        name: getExcelColumnName(i),
        editable: editable,
        resizable: true,
        width: 100,
        renderEditCell: renderTextEditor,
      })
    }
    setColumns(newColumns)

    let dataRows: RowData[] = []

    // Iterate all rows including header
    initialDataSource.forEach((sourceRow, idx) => {
        const newRow: RowData = { __row_index__: idx }
        // sourceRow is array
        if (Array.isArray(sourceRow)) {
            sourceRow.forEach((val, colIndex) => {
                newRow[`__col_${colIndex}__`] = val
            })
        }
        dataRows.push(newRow)
    })

    if (dataRows.length < MIN_ROWS) {
      const needed = MIN_ROWS - dataRows.length
      const length = dataRows.length
      for (let i = 0; i < needed; i++) {
        dataRows.push({ __row_index__: length + i })
      }
    }

    setRows(dataRows)
  }, [initialDataSource])

  const handleRowsChange = useCallback(
    (newRows: RowData[], _: any) => {
      if (isLoading) return
      setRows(newRows)
    },
    [isLoading]
  )

  const handleAddMoreRows = () => {
    setRows((prevRows) => {
      const currentLength = prevRows.length
      const newRows = []
      for (let i = 0; i < 1; i++) {
        newRows.push({ __row_index__: currentLength + i })
      }
      return [...prevRows, ...newRows]
    })
  }

  const handleAddMoreColumn = () => {
    setColumns((prevCols) => {
      const dataColIndex = prevCols.length - 1
      const newInternalKey = `__col_${generateRandomKey()}__`

      const newCol: Column<RowData> = {
        key: newInternalKey,
        name: getExcelColumnName(dataColIndex),
        editable: true,
        resizable: true,
        width: 100,
        renderEditCell: renderTextEditor,
      }
      return [...prevCols, newCol]
    })
  }

  const getCleanData = (): TableData => {
    if (rows.length === 0) return []

    // We export all columns that are not internal
    // Filter columns
    const header = rows[0]
    const dataCols = columns.filter(c => c.key !== '__row_index__' && !isCellEmpty(header[c.key]))
    const tableData: any[][] = []

    // Iterate rows
    for (let i = 0; i < rows.length; i++) {
        const rowData: any[] = []
        const row = rows[i]

        let hasData = false
        dataCols.forEach(col => {
            const val = row[col.key]
            rowData.push(val ?? null)
            if (!isCellEmpty(val)) {
                hasData = true
            }
        })

        // If whole row is empty, skip?
        // We should skip empty rows at the end, but keep intermediate empty rows?
        // Current logic filters empty rows.
        if (hasData) {
            tableData.push(rowData)
        }
    }

    // Handle totally empty case
    if (tableData.length === 0) return []

    // Trim trailing empty cells in each row?
    // Usually table data should be rectangular or at least valid header length.
    // Let's ensure all rows have same length as header (first row) if needed, or just let CSV handle it.
    // tableToCSV handles rectangular or ragged.

    return tableData
  }

  const handleSave = async () => {
    setIsLoading(true)
    const data = getCleanData() || []
    const filename = getFileName(fileName)
    const xlsx = new File([tableToXLSX(data)], `${filename || 'data'}.xlsx`)
    try {
      await onSave(data, xlsx)
    } catch(err) {
      // do nothing
    }
    setIsLoading(false)
  }

  const handleExportXLSX = () => {
    const cleanData = getCleanData()
    const xlsxBlob = tableToXLSX(cleanData)
    downloadFile(`${dayjs().format('YYYYMMDDHHmmss')}.xlsx`, xlsxBlob)
  }

  if (!columns.length) return <div>Loading...</div>

  return (
    <div className="relative flex h-full w-full flex-col overflow-auto">
      <div className="mb-4 flex flex-0 items-center justify-end border-b border-gray-300 pb-4">
        <h2 className="text-lg font-bold">
          {editable ? '编辑数据' : '查看数据'}
        </h2>
        <div className="flex-1"></div>
        <Button onClick={onCancel}>关闭</Button>
        <Button
          loading={isLoading}
          type="primary"
          onClick={handleSave}
          className="ml-2"
        >
          确定
        </Button>
      </div>
      <div className="w-full flex-1 overflow-auto">
        <div className="h-[calc(100%-49px)] w-full">
          <DataGrid
            columns={columns}
            rows={rows}
            onRowsChange={handleRowsChange}
            className="rdg-light"
            style={{ height: '100%' }}
            rowHeight={25}
            headerRowHeight={25}
            rowKeyGetter={rowKeyGetter}
            rowClass={rowClassName}
            defaultColumnOptions={{
              resizable: true,
              sortable: false,
              draggable: false,
            }}
          />
        </div>
        <div className="sticky right-0 bottom-0 left-0 z-10 flex items-center justify-end border border-t-0 border-gray-300 bg-gray-100 p-2">
          <Button onClick={handleAddMoreRows}>+ 添加 1 行</Button>
          <Button onClick={handleAddMoreColumn} className="ml-2">
            + 添加 1 列
          </Button>
          <div className="flex-1"></div>
          <Button onClick={handleExportXLSX}>导出 XLSX 文件</Button>
          {/* <Button type="primary" className="ml-2" onClick={handleSave} loading={isLoading}>
            保存数据
          </Button> */}
        </div>
      </div>
    </div>
  )
}

export default ExcelEditor
