import type { GatePassItem, TransactionType } from '../types/gatepass.ts';

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function detectTransactionType(
  gstNo: string,
  stCode: string,
  homeStateCode: string
): TransactionType {
  const cleanHome = (homeStateCode || '27').trim();
  const cleanSt = (stCode || '').trim();
  const cleanGst = (gstNo || '').trim().toUpperCase();

  const effectiveState =
    cleanSt.length >= 2
      ? cleanSt.slice(0, 2)
      : cleanGst.length >= 2 && /^\d{2}/.test(cleanGst)
        ? cleanGst.slice(0, 2)
        : '';

  if (!effectiveState) {
    return 'INTRA_STATE';
  }
  return effectiveState === cleanHome ? 'INTRA_STATE' : 'INTER_STATE';
}

export function calculateItemRow(
  item: GatePassItem,
  _transactionType: TransactionType
): GatePassItem {
  const qty = Math.max(0, Number(item.quantity) || 0);
  const price = Math.max(0, Number(item.pricePerUnit) || 0);
  const total = round2(qty * price);

  return {
    ...item,
    quantity: qty,
    pricePerUnit: price,
    taxPercent: 0,
    igstValue: 0,
    cgstValue: 0,
    sgstValue: 0,
    taxValue: 0,
    total,
  };
}

export function calculateGatePassTotals(items: GatePassItem[]) {
  return items.reduce(
    (acc, item) => {
      acc.totalQuantity = round2(acc.totalQuantity + (Number(item.quantity) || 0));
      acc.totalIgst = round2(acc.totalIgst + (Number(item.igstValue) || 0));
      acc.totalCgst = round2(acc.totalCgst + (Number(item.cgstValue) || 0));
      acc.totalSgst = round2(acc.totalSgst + (Number(item.sgstValue) || 0));
      acc.totalTaxValue = round2(acc.totalTaxValue + (Number(item.taxValue) || 0));
      acc.grandTotal = round2(acc.grandTotal + (Number(item.total) || 0));
      return acc;
    },
    {
      totalQuantity: 0,
      totalIgst: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalTaxValue: 0,
      grandTotal: 0,
    }
  );
}

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeShort(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function numberToIndianWords(amount: number): string {
  const safe = round2(Math.max(0, amount || 0));
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  if (rupees === 0 && paise === 0) {
    return 'Rupees Zero Only';
  }

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`.trim();
  };

  const threeDigits = (n: number): string => {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const parts: string[] = [];
    if (h > 0) parts.push(`${ones[h]} Hundred`);
    if (rem > 0) parts.push(twoDigits(rem));
    return parts.join(' ');
  };

  const parts: string[] = [];
  let n = rupees;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  if (crore > 0) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n > 0) parts.push(threeDigits(n));

  let result = `Rupees ${parts.join(' ').trim() || 'Zero'}`;
  if (paise > 0) {
    result += ` and ${twoDigits(paise)} Paise`;
  }
  return `${result} Only`;
}
