export function isSpreadsheetFile(file: File) {
  return /\.(csv|xlsx|xls)$/i.test(file.name);
}

export function isExcelFile(file: File) {
  return /\.(xlsx|xls)$/i.test(file.name);
}
