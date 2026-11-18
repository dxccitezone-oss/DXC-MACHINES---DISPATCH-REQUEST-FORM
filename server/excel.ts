import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import type { GatePass } from '../src/types/gatepass.ts';
import { round2 } from '../src/utils/calculations.ts';

export const EXCEL_FILENAME = 'TJD_NON_STOCK_GATEPASS_REGISTER.xlsx';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const EXCEL_PATH = path.join(DATA_DIR, EXCEL_FILENAME);

const SHEET_REGISTER = 'GATEPASS REGISTER';
const SHEET_ITEMS = 'GATEPASS ITEM DETAILS';
const SHEET_DISPATCH = 'DISPATCH REGISTER';
const SHEET_ACK = 'ACKNOWLEDGEMENT REGISTER';

const REGISTER_COLUMNS = [
  { header: 'S.No', key: 'sNo', width: 8 },
  { header: 'Gate Pass No', key: 'gpNo', width: 26 },
  { header: 'Entry Date', key: 'entryDate', width: 22 },
  { header: 'From', key: 'fromAddress', width: 38 },
  { header: 'Sent To', key: 'sentTo', width: 38 },
  { header: 'GST No', key: 'gstNo', width: 18 },
  { header: 'Department', key: 'department', width: 28 },
  { header: 'Precious Material', key: 'preciousMaterial', width: 17 },
  { header: 'Returnable', key: 'returnable', width: 13 },
  { header: 'Expected Date', key: 'expectedDate', width: 15 },
  { header: 'Approximate Value', key: 'appValue', width: 18 },
  { header: 'Despatch Thru', key: 'despatchThru', width: 28 },
  { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
  { header: 'Grand Total', key: 'grandTotal', width: 16 },
  { header: 'Remarks', key: 'remarks', width: 34 },
  { header: 'Status', key: 'status', width: 16 },
  { header: 'Created By', key: 'createdBy', width: 20 },
];

const ITEM_COLUMNS = [
  { header: 'Gate Pass No', key: 'gpNo', width: 26 },
  { header: 'S.No', key: 'sNo', width: 8 },
  { header: 'Stock No', key: 'stockNo', width: 18 },
  { header: 'Description', key: 'description', width: 40 },
  { header: 'UOM', key: 'uom', width: 10 },
  { header: 'HSN Code', key: 'hsnCode', width: 14 },
  { header: 'Quantity', key: 'quantity', width: 12 },
  { header: 'Price / Unit', key: 'pricePerUnit', width: 15 },
  { header: 'Total', key: 'total', width: 16 },
];

const DISPATCH_COLUMNS = [
  { header: 'Gate Pass No', key: 'gpNo', width: 26 },
  { header: 'Dispatch Date', key: 'dispatchDate', width: 22 },
  { header: 'Despatch Thru', key: 'despatchThru', width: 30 },
  { header: 'Vehicle / Courier Ref', key: 'vehicleOrCourierRef', width: 24 },
  { header: 'Dispatched By', key: 'dispatchedBy', width: 22 },
  { header: 'Dispatch Status', key: 'dispatchStatus', width: 18 },
];

const ACK_COLUMNS = [
  { header: 'Gate Pass No', key: 'gpNo', width: 26 },
  { header: 'Acknowledgement Date', key: 'ackDate', width: 24 },
  { header: 'Received By', key: 'receivedBy', width: 28 },
  { header: 'Acknowledged By', key: 'acknowledgedBy', width: 24 },
  { header: 'Remarks', key: 'remarks', width: 34 },
  { header: 'Acknowledgement Status', key: 'ackStatus', width: 22 },
];

function formatDateTimeForExcel(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, columnCount: number) {
  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  for (let c = 1; c <= columnCount; c += 1) {
    const cell = headerRow.getCell(c);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2B3352' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E243B' } },
      bottom: { style: 'thin', color: { argb: 'FF1E243B' } },
      left: { style: 'thin', color: { argb: 'FF3E476B' } },
      right: { style: 'thin', color: { argb: 'FF3E476B' } },
    };
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function ensureSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: Array<{ header: string; key: string; width: number }>
): ExcelJS.Worksheet {
  let sheet = wb.getWorksheet(name);
  if (!sheet) {
    sheet = wb.addWorksheet(name);
    sheet.columns = columns;
    styleHeaderRow(sheet, columns.length);
  } else {
    // Ensure column widths and keys are set when reading existing file
    columns.forEach((col, idx) => {
      const wsCol = sheet!.getColumn(idx + 1);
      if (!wsCol.width) wsCol.width = col.width;
    });
    if (sheet.rowCount === 0) {
      sheet.addRow(columns.map((c) => c.header));
      styleHeaderRow(sheet, columns.length);
    }
  }
  return sheet;
}

function buildRegisterRowArray(gp: GatePass, sNo: number): Array<string | number> {
  return [
    sNo,
    gp.gpNo,
    formatDateTimeForExcel(gp.createdAt),
    (gp.fromAddress || '').replace(/\r?\n/g, ', '),
    gp.sentTo.replace(/\r?\n/g, ', '),
    gp.gstNo || '',
    gp.departmentName || '',
    gp.preciousMaterial ? 'Yes' : 'No',
    gp.returnable ? 'Yes' : 'No',
    gp.expectedDate || '',
    round2(gp.appValue),
    gp.despatchThru || '',
    round2(gp.totalQuantity),
    round2(gp.grandTotal),
    gp.remarks || '',
    gp.status,
    gp.createdByName || '',
  ];
}

function buildItemRowArray(gpNo: string, item: GatePass['items'][number]): Array<string | number> {
  return [
    gpNo,
    item.sNo,
    item.stockNo || 'NON-STOCK',
    item.description,
    item.uom,
    item.hsnCode || '',
    round2(item.quantity),
    round2(item.pricePerUnit),
    round2(item.total),
  ];
}

function applyDataRowStyle(row: ExcelJS.Row, numericCols: number[]) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF111827' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: numericCols.includes(colNumber) ? 'right' : 'left',
      wrapText: false,
    };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE2E6F2' } },
      right: { style: 'thin', color: { argb: 'FFECEEF6' } },
    };
    if (numericCols.includes(colNumber) && typeof cell.value === 'number') {
      cell.numFmt = '#,##0.00';
    }
  });
}

async function writeWorkbookAtomically(wb: ExcelJS.Workbook): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${EXCEL_PATH}.tmp.xlsx`;
  await wb.xlsx.writeFile(tmpPath);
  fs.renameSync(tmpPath, EXCEL_PATH);
}

function createPopulatedWorkbook(gatePasses: GatePass[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'TJD Non-Stock Gate Pass Portal';
  wb.created = new Date();
  wb.modified = new Date();

  const regSheet = ensureSheet(wb, SHEET_REGISTER, REGISTER_COLUMNS);
  const itemSheet = ensureSheet(wb, SHEET_ITEMS, ITEM_COLUMNS);
  const dispSheet = ensureSheet(wb, SHEET_DISPATCH, DISPATCH_COLUMNS);
  const ackSheet = ensureSheet(wb, SHEET_ACK, ACK_COLUMNS);

  const chronological = [...gatePasses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  chronological.forEach((gp, idx) => {
    const regRow = regSheet.addRow(buildRegisterRowArray(gp, idx + 1));
    applyDataRowStyle(regRow, [11, 14]);

    gp.items.forEach((item) => {
      const itRow = itemSheet.addRow(buildItemRowArray(gp.gpNo, item));
      applyDataRowStyle(itRow, [8, 9]);
    });

    if (gp.dispatchDetails) {
      const dRow = dispSheet.addRow([
        gp.gpNo,
        formatDateTimeForExcel(gp.dispatchDetails.dispatchedAt),
        gp.dispatchDetails.despatchThru || gp.despatchThru,
        gp.dispatchDetails.vehicleOrCourierRef || '-',
        gp.dispatchDetails.dispatchedByName,
        'DISPATCHED',
      ]);
      applyDataRowStyle(dRow, []);
    }

    if (gp.acknowledgementDetails) {
      const aRow = ackSheet.addRow([
        gp.gpNo,
        formatDateTimeForExcel(gp.acknowledgementDetails.acknowledgedAt),
        gp.acknowledgementDetails.receivedBy,
        gp.acknowledgementDetails.acknowledgedByName,
        gp.acknowledgementDetails.remarks || '',
        'ACKNOWLEDGED',
      ]);
      applyDataRowStyle(aRow, []);
    }
  });

  return wb;
}

export async function ensureExcelFileExists(allGatePasses: GatePass[]): Promise<string> {
  if (!fs.existsSync(EXCEL_PATH)) {
    const wb = createPopulatedWorkbook(allGatePasses);
    await writeWorkbookAtomically(wb);
  }
  return EXCEL_PATH;
}

export async function syncGatePassToExcel(
  gp: GatePass,
  allGatePasses: GatePass[],
  previousGpNo?: string
): Promise<void> {
  if (!fs.existsSync(EXCEL_PATH)) {
    const wb = createPopulatedWorkbook(allGatePasses);
    await writeWorkbookAtomically(wb);
    return;
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  wb.modified = new Date();

  const regSheet = ensureSheet(wb, SHEET_REGISTER, REGISTER_COLUMNS);
  const itemSheet = ensureSheet(wb, SHEET_ITEMS, ITEM_COLUMNS);
  const dispSheet = ensureSheet(wb, SHEET_DISPATCH, DISPATCH_COLUMNS);
  const ackSheet = ensureSheet(wb, SHEET_ACK, ACK_COLUMNS);

  const headersMatch = (
    sheet: ExcelJS.Worksheet,
    expected: Array<{ header: string }>
  ) =>
    expected.every(
      (col, idx) =>
        String(sheet.getRow(1).getCell(idx + 1).value ?? '').trim() === col.header
    ) &&
    String(sheet.getRow(1).getCell(expected.length + 1).value ?? '').trim() === '';

  if (
    !headersMatch(regSheet, REGISTER_COLUMNS) ||
    !headersMatch(itemSheet, ITEM_COLUMNS) ||
    !headersMatch(dispSheet, DISPATCH_COLUMNS) ||
    !headersMatch(ackSheet, ACK_COLUMNS)
  ) {
    const rebuilt = createPopulatedWorkbook(allGatePasses);
    await writeWorkbookAtomically(rebuilt);
    return;
  }

  const matchTarget = (val: string) =>
    val === gp.gpNo || (previousGpNo ? val === previousGpNo : false);

  // 1. Update or Append in GATEPASS REGISTER (preserving all existing records)
  let existingRegRowNum: number | null = null;
  for (let r = 2; r <= regSheet.rowCount; r += 1) {
    const cellVal = String(regSheet.getRow(r).getCell(2).value ?? '').trim();
    if (matchTarget(cellVal)) {
      existingRegRowNum = r;
      break;
    }
  }

  if (existingRegRowNum !== null) {
    const existingSNo = Number(regSheet.getRow(existingRegRowNum).getCell(1).value) || existingRegRowNum - 1;
    const updatedValues = buildRegisterRowArray(gp, existingSNo);
    const targetRow = regSheet.getRow(existingRegRowNum);
    updatedValues.forEach((val, idx) => {
      targetRow.getCell(idx + 1).value = val;
    });
    applyDataRowStyle(targetRow, [11, 14]);
    targetRow.commit();
  } else {
    const nextSNo = Math.max(1, regSheet.rowCount);
    const newRow = regSheet.addRow(buildRegisterRowArray(gp, nextSNo));
    applyDataRowStyle(newRow, [11, 14]);
  }

  // 2. Update or Append in GATEPASS ITEM DETAILS (preserve all other Gate Passes' items)
  const rowsToRemove: number[] = [];
  for (let r = 2; r <= itemSheet.rowCount; r += 1) {
    const cellVal = String(itemSheet.getRow(r).getCell(1).value ?? '').trim();
    if (matchTarget(cellVal)) {
      rowsToRemove.push(r);
    }
  }
  // Remove bottom-up if updating an existing Gate Pass's items
  for (let i = rowsToRemove.length - 1; i >= 0; i -= 1) {
    itemSheet.spliceRows(rowsToRemove[i], 1);
  }
  gp.items.forEach((item) => {
    const itRow = itemSheet.addRow(buildItemRowArray(gp.gpNo, item));
    applyDataRowStyle(itRow, [8, 9]);
  });

  // 3. Append in DISPATCH REGISTER if dispatched and not yet recorded
  if (gp.dispatchDetails) {
    let dispExists = false;
    for (let r = 2; r <= dispSheet.rowCount; r += 1) {
      const cellVal = String(dispSheet.getRow(r).getCell(1).value ?? '').trim();
      if (cellVal === gp.gpNo) {
        dispExists = true;
        break;
      }
    }
    if (!dispExists) {
      const dRow = dispSheet.addRow([
        gp.gpNo,
        formatDateTimeForExcel(gp.dispatchDetails.dispatchedAt),
        gp.dispatchDetails.despatchThru || gp.despatchThru,
        gp.dispatchDetails.vehicleOrCourierRef || '-',
        gp.dispatchDetails.dispatchedByName,
        'DISPATCHED',
      ]);
      applyDataRowStyle(dRow, []);
    }
  }

  // 4. Append in ACKNOWLEDGEMENT REGISTER if acknowledged and not yet recorded
  if (gp.acknowledgementDetails) {
    let ackExists = false;
    for (let r = 2; r <= ackSheet.rowCount; r += 1) {
      const cellVal = String(ackSheet.getRow(r).getCell(1).value ?? '').trim();
      if (cellVal === gp.gpNo) {
        ackExists = true;
        break;
      }
    }
    if (!ackExists) {
      const aRow = ackSheet.addRow([
        gp.gpNo,
        formatDateTimeForExcel(gp.acknowledgementDetails.acknowledgedAt),
        gp.acknowledgementDetails.receivedBy,
        gp.acknowledgementDetails.acknowledgedByName,
        gp.acknowledgementDetails.remarks || '',
        'ACKNOWLEDGED',
      ]);
      applyDataRowStyle(aRow, []);
    }
  }

  await writeWorkbookAtomically(wb);
}

export function getExcelMetadata(allGatePasses: GatePass[]) {
  const exists = fs.existsSync(EXCEL_PATH);
  const stats = exists ? fs.statSync(EXCEL_PATH) : null;
  return {
    fileName: EXCEL_FILENAME,
    exists,
    sizeBytes: stats ? stats.size : 0,
    updatedAt: stats ? stats.mtime.toISOString() : null,
    totalGatePasses: allGatePasses.length,
  };
}
