import { describe, it, expect } from 'vitest'
import { formatCurrency, parseBrNumber, compareYearMonth, addMonths } from '@/lib/format'
import { monthsBetween } from '@/lib/calculations'

describe('formatCurrency', () => {
  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00')
  })

  it('formata mil reais', () => {
    expect(formatCurrency(1_000)).toBe('R$\u00a01.000,00')
  })

  it('formata valor com centavos', () => {
    expect(formatCurrency(1_234.56)).toBe('R$\u00a01.234,56')
  })

  it('formata valor grande', () => {
    expect(formatCurrency(101_100_000)).toContain('101.100.000')
  })
})

describe('parseBrNumber', () => {
  it('parse de valor com ponto e vírgula', () => {
    expect(parseBrNumber('1.000,00')).toBe(1_000)
  })

  it('parse de valor grande', () => {
    expect(parseBrNumber('101.100.000,00')).toBe(101_100_000)
  })

  it('parse de string vazia → 0', () => {
    expect(parseBrNumber('')).toBe(0)
  })

  it('parse de valor sem formatação', () => {
    expect(parseBrNumber('1500')).toBe(1_500)
  })

  it('parse de valor com vírgula sem ponto', () => {
    expect(parseBrNumber('1500,50')).toBe(1_500.50)
  })
})

describe('compareYearMonth', () => {
  it('mesmo → 0', () => {
    expect(compareYearMonth({ year: 2024, month: 6 }, { year: 2024, month: 6 })).toBe(0)
  })

  it('anterior → negativo', () => {
    expect(compareYearMonth({ year: 2024, month: 1 }, { year: 2024, month: 6 })).toBeLessThan(0)
  })

  it('posterior → positivo', () => {
    expect(compareYearMonth({ year: 2025, month: 1 }, { year: 2024, month: 12 })).toBeGreaterThan(0)
  })
})

describe('addMonths', () => {
  it('adiciona 1 mês simples', () => {
    expect(addMonths({ year: 2024, month: 3 }, 1)).toEqual({ year: 2024, month: 4 })
  })

  it('passa de dezembro para janeiro do ano seguinte', () => {
    expect(addMonths({ year: 2024, month: 12 }, 1)).toEqual({ year: 2025, month: 1 })
  })

  it('adiciona 12 meses = avança 1 ano', () => {
    expect(addMonths({ year: 2024, month: 6 }, 12)).toEqual({ year: 2025, month: 6 })
  })
})
