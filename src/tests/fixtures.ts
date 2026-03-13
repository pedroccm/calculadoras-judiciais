import type { MonthlyIndex, SalarioMinimo } from '@/lib/types'

/**
 * Índices fictícios e controlados para testes.
 * Usar valores simples facilita verificar o resultado manualmente.
 *
 * IPCA-E de 1% ao mês = fator mensal 1.01
 * Em 3 meses: 1.01³ = 1.030301
 * Em 12 meses: 1.01¹² ≈ 1.126825
 */
export const ipcaeMock: MonthlyIndex[] = [
  // 2024 — jan a dez: 1% ao mês (fácil de calcular manualmente)
  { year: 2024, month: 1,  value: 1 },
  { year: 2024, month: 2,  value: 1 },
  { year: 2024, month: 3,  value: 1 },
  { year: 2024, month: 4,  value: 1 },
  { year: 2024, month: 5,  value: 1 },
  { year: 2024, month: 6,  value: 1 },
  { year: 2024, month: 7,  value: 1 },
  { year: 2024, month: 8,  value: 1 },
  { year: 2024, month: 9,  value: 1 },
  { year: 2024, month: 10, value: 1 },
  { year: 2024, month: 11, value: 1 },
  { year: 2024, month: 12, value: 1 },
  // 2025
  { year: 2025, month: 1,  value: 1 },
  { year: 2025, month: 2,  value: 1 },
  { year: 2025, month: 3,  value: 1 },
]

export const inpcMock: MonthlyIndex[] = ipcaeMock.map(i => ({ ...i }))

/**
 * SELIC mock: 1,5%/mês em set/2024+ (período SELIC real)
 * Taxa real = SELIC(1.5%) − IPCA-E(1%) = 0.5% a.m.
 */
export const selicMock: MonthlyIndex[] = [
  // Período histórico — não relevante para juros reais, mas incluso para completude
  { year: 2024, month: 1,  value: 0.97 },
  { year: 2024, month: 2,  value: 0.80 },
  { year: 2024, month: 3,  value: 1.05 },
  { year: 2024, month: 4,  value: 1.06 },
  { year: 2024, month: 5,  value: 1.04 },
  { year: 2024, month: 6,  value: 1.07 },
  { year: 2024, month: 7,  value: 1.07 },
  { year: 2024, month: 8,  value: 1.02 },
  // Set/2024+ → SELIC real = 1.5% - 1% IPCA-E = 0.5%/mês
  { year: 2024, month: 9,  value: 1.5 },
  { year: 2024, month: 10, value: 1.5 },
  { year: 2024, month: 11, value: 1.5 },
  { year: 2024, month: 12, value: 1.5 },
  { year: 2025, month: 1,  value: 1.5 },
  { year: 2025, month: 2,  value: 1.5 },
  { year: 2025, month: 3,  value: 1.5 },
]

export const salarioMinimoMock: SalarioMinimo[] = [
  { year: 2024, month: 1, value: 1412 },
  { year: 2025, month: 1, value: 1518 },
]
