export { deepMerge } from './deepMerge'
export {
  classifyColumns,
  isDataMappingCompatible,
  generateEmptyDataMapping,
  inferDataMapping,
  suggestStackBy,
  pivotLongToWide,
  getCachedPivot,
  clearPivotCache,
} from './inference'
export { formatValue, dataURLToFile, formatAxisLabel } from './format'
export {
  hexToRgba,
  parseColorToRgb,
  rgbToHsl,
  hslToHex,
  makeColorFn,
  generateLighterColors,
} from './color'
