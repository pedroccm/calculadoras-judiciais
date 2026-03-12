import type { YearMonth } from './types'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, decimals = 4): string {
  return value.toFixed(decimals).replace('.', ',') + '%'
}

export function formatFactor(value: number): string {
  return value.toFixed(6).replace('.', ',')
}

export function formatYearMonth(ym: YearMonth): string {
  return `${String(ym.month).padStart(2, '0')}/${ym.year}`
}

export function parseMonthInput(val: string): YearMonth | null {
  // Expects "YYYY-MM"
  if (!val) return null
  const [y, m] = val.split('-').map(Number)
  if (!y || !m) return null
  return { year: y, month: m }
}

export function toMonthInput(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month).padStart(2, '0')}`
}

export function currentYearMonth(): YearMonth {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function currentMonthInput(): string {
  return toMonthInput(currentYearMonth())
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  const total = (ym.year * 12 + ym.month - 1) + n
  return { year: Math.floor(total / 12), month: (total % 12) + 1 }
}

export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return (a.year * 12 + a.month) - (b.year * 12 + b.month)
}

export function parseBrNumber(str: string): number {
  // Aceita "100.000,00" ou "100000.00" ou "100000,00"
  const cleaned = str.replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}
