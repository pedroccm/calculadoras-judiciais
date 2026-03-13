import { describe, it, expect } from 'vitest'
import {
  calcCorrectionFactor,
  monthsBetween,
  calcCumprimentoSimples,
  calcCumprimentoMulta,
  calcPensao,
  calcPagamentosParciais,
  calcSuperendividamento,
  calcDividaContrato,
} from '@/lib/calculations'
import { ipcaeMock, inpcMock, selicMock, salarioMinimoMock } from './fixtures'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Arredonda para N casas decimais (evita floating point noise nos asserts) */
const round = (n: number, dec = 2) => Math.round(n * 10 ** dec) / 10 ** dec

// ─── monthsBetween ────────────────────────────────────────────────────────────

describe('monthsBetween', () => {
  it('mesmo mês → 0', () => {
    expect(monthsBetween({ year: 2024, month: 1 }, { year: 2024, month: 1 })).toBe(0)
  })

  it('1 mês de diferença', () => {
    expect(monthsBetween({ year: 2024, month: 1 }, { year: 2024, month: 2 })).toBe(1)
  })

  it('12 meses (jan a jan do ano seguinte)', () => {
    expect(monthsBetween({ year: 2024, month: 1 }, { year: 2025, month: 1 })).toBe(12)
  })

  it('3 meses passando virada de ano', () => {
    expect(monthsBetween({ year: 2024, month: 11 }, { year: 2025, month: 2 })).toBe(3)
  })
})

// ─── calcCorrectionFactor ─────────────────────────────────────────────────────

describe('calcCorrectionFactor (IPCA-E mock 1%/mês)', () => {
  it('0 meses → fator 1.0 (sem correção)', () => {
    const { factor } = calcCorrectionFactor(ipcaeMock, { year: 2024, month: 1 }, { year: 2024, month: 1 })
    expect(factor).toBe(1)
  })

  it('1 mês com IPCA-E 1% → fator 1.01', () => {
    const { factor } = calcCorrectionFactor(ipcaeMock, { year: 2024, month: 1 }, { year: 2024, month: 2 })
    expect(round(factor, 4)).toBe(1.01)
  })

  it('3 meses com IPCA-E 1%/mês → fator 1.01³ ≈ 1.0303', () => {
    const { factor } = calcCorrectionFactor(ipcaeMock, { year: 2024, month: 1 }, { year: 2024, month: 4 })
    expect(round(factor, 4)).toBe(round(1.01 ** 3, 4))
  })

  it('12 meses com IPCA-E 1%/mês → fator 1.01¹²', () => {
    const { factor } = calcCorrectionFactor(ipcaeMock, { year: 2024, month: 1 }, { year: 2025, month: 1 })
    expect(round(factor, 6)).toBe(round(1.01 ** 12, 6))
  })

  it('detalha corretamente os meses aplicados', () => {
    const { detalhes } = calcCorrectionFactor(ipcaeMock, { year: 2024, month: 1 }, { year: 2024, month: 3 })
    expect(detalhes).toHaveLength(2)
    expect(detalhes[0].mesAno).toBe('01/2024')
    expect(detalhes[0].ipcae).toBe(1)
    expect(round(detalhes[1].fatorAcumulado, 4)).toBe(round(1.01 ** 2, 4))
  })
})

// ─── calcCumprimentoSimples ───────────────────────────────────────────────────

describe('calcCumprimentoSimples', () => {
  it('principal R$10.000, 3 meses em jan–mar/2024 (período 12% a.a.)', () => {
    const r = calcCumprimentoSimples(
      10_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 4 },
      ipcaeMock,
      selicMock
    )

    // Correção: 10000 × 1.01³ = 10303.01
    expect(round(r.principalCorrigido)).toBe(round(10_000 * 1.01 ** 3))

    // Juros: período jan–mar/2024 = 3 meses a 1%/mês = 3% total
    expect(round(r.taxaJurosTotal, 4)).toBe(3)
    expect(round(r.jurosMora)).toBe(round(r.principalCorrigido * 0.03))

    expect(r.meses).toBe(3)
    expect(r.principalOriginal).toBe(10_000)
  })

  it('0 meses → valor original sem alteração', () => {
    const r = calcCumprimentoSimples(
      5_000,
      { year: 2024, month: 6 },
      { year: 2024, month: 6 },
      ipcaeMock,
      selicMock
    )
    expect(r.totalAtualizado).toBe(5_000)
    expect(r.fatorCorrecao).toBe(1)
  })

  it('período SELIC real (set/2024): taxa = SELIC(1.5%) − IPCA-E(1%) = 0.5%/mês', () => {
    const r = calcCumprimentoSimples(
      10_000,
      { year: 2024, month: 9 },  // set/2024
      { year: 2024, month: 12 }, // 3 meses no período SELIC real
      ipcaeMock,
      selicMock
    )
    // 3 meses × 0.5%/mês = 1.5% total
    expect(round(r.taxaJurosTotal, 4)).toBe(1.5)
    expect(r.detalhesJuros[0].tipo).toBe('SELIC real')
  })
})

// ─── calcCumprimentoMulta ─────────────────────────────────────────────────────

describe('calcCumprimentoMulta', () => {
  it('acrescenta exatamente 10% multa + 10% honorários sobre o débito atualizado', () => {
    const r = calcCumprimentoMulta(
      10_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 4 },
      ipcaeMock,
      selicMock,
      10,
      10
    )

    expect(round(r.multa10)).toBe(round(r.totalAtualizado * 0.1))
    expect(round(r.honorarios10)).toBe(round(r.totalAtualizado * 0.1))
    expect(round(r.totalComMulta)).toBe(round(r.totalAtualizado * 1.2))
  })

  it('percentuais customizados (2% multa + 5% honorários)', () => {
    const r = calcCumprimentoMulta(
      10_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 2 },
      ipcaeMock,
      selicMock,
      2,
      5
    )
    expect(round(r.multa10)).toBe(round(r.totalAtualizado * 0.02))
    expect(round(r.honorarios10)).toBe(round(r.totalAtualizado * 0.05))
    expect(round(r.totalComMulta)).toBe(round(r.totalAtualizado * 1.07))
  })

  it('totalComMulta deve ser sempre >= totalAtualizado', () => {
    const r = calcCumprimentoMulta(50_000, { year: 2024, month: 1 }, { year: 2025, month: 1 }, ipcaeMock, selicMock)
    expect(r.totalComMulta).toBeGreaterThan(r.totalAtualizado)
  })
})

// ─── calcPensao ───────────────────────────────────────────────────────────────

describe('calcPensao', () => {
  it('valor fixo sem nenhum pagamento → saldo = total devido', () => {
    const from = { year: 2024, month: 1 }
    const to   = { year: 2024, month: 3 }
    const r = calcPensao(from, to, 'valor_fixo', 1_000, 0, new Map(), inpcMock, salarioMinimoMock)

    // 3 meses (jan, fev, mar) × R$1.000 = R$3.000 devido
    expect(r.totalDevido).toBe(3_000)
    expect(r.totalPago).toBe(0)
    expect(r.totalSaldoOriginal).toBe(3_000)
  })

  it('pagamento parcial reduz o saldo corretamente', () => {
    const pagamentos = new Map([
      ['2024-01', 600], // pagou 600 de 1000 em jan
      ['2024-02', 1_000], // pagou tudo em fev
    ])
    const r = calcPensao(
      { year: 2024, month: 1 },
      { year: 2024, month: 2 },
      'valor_fixo', 1_000, 0,
      pagamentos,
      inpcMock, salarioMinimoMock
    )

    expect(r.totalDevido).toBe(2_000)
    expect(r.totalPago).toBe(1_600)
    expect(r.totalSaldoOriginal).toBe(400) // só jan tem saldo
    // Fev foi pago integral → saldo 0
    expect(r.meses[1].saldo).toBe(0)
  })

  it('% salário mínimo usa o SM vigente do mês', () => {
    // 50% do SM de jan/2024 (R$1.412) = R$706
    const r = calcPensao(
      { year: 2024, month: 1 },
      { year: 2024, month: 1 },
      'percentual_salario_minimo', 50, 0,
      new Map(), inpcMock, salarioMinimoMock
    )
    expect(r.meses[0].valorDevido).toBe(706)
    expect(r.meses[0].salarioMinimo).toBe(1_412)
  })

  it('mês totalmente pago → saldoCorrigido = 0', () => {
    const pagamentos = new Map([['2024-01', 1_000]])
    const r = calcPensao(
      { year: 2024, month: 1 },
      { year: 2024, month: 1 },
      'valor_fixo', 1_000, 0,
      pagamentos, inpcMock, salarioMinimoMock
    )
    expect(r.meses[0].saldo).toBe(0)
    expect(r.meses[0].saldoCorrigido).toBe(0)
  })
})

// ─── calcPagamentosParciais ───────────────────────────────────────────────────

describe('calcPagamentosParciais', () => {
  it('nenhum pagamento → saldo cresce com juros e correção', () => {
    const r = calcPagamentosParciais(
      10_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 3 },
      [], ipcaeMock, 1
    )
    expect(r.saldoFinal).toBeGreaterThan(10_000)
    expect(r.totalPago).toBe(0)
  })

  it('pagamento que quita tudo → saldoFinal = 0', () => {
    // Paga 100k (muito mais que 10k) → quita
    const r = calcPagamentosParciais(
      10_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 3 },
      [{ id: '1', data: '2024-02', valor: 100_000 }],
      ipcaeMock, 1
    )
    expect(r.saldoFinal).toBe(0)
  })

  it('abate juros antes do principal (art. 354 CC)', () => {
    // Principal R$1000, juros 10%/mês → juros no mês 1 = R$100
    // Pagamento de R$50 (cobre só parte dos juros) → principal não diminui
    const r = calcPagamentosParciais(
      1_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 2 },
      [{ id: '1', data: '2024-02', valor: 50 }],
      ipcaeMock, 10 // 10% para ter juros visíveis
    )
    // Após pagamento de R$50, os juros cobrados são ~R$101 (com correção)
    // O principal deve permanecer próximo ao original
    expect(r.saldoFinal).toBeGreaterThan(900)
    expect(r.totalJuros).toBeGreaterThan(0)
  })
})

// ─── calcSuperendividamento ───────────────────────────────────────────────────

describe('calcSuperendividamento', () => {
  it('distribui proporcionalmente ao saldo de cada dívida', () => {
    const r = calcSuperendividamento(
      5_000, // renda bruta
      500,   // descontos
      [
        { id: '1', credor: 'Banco A', saldo: 10_000, taxaMensal: 0 },
        { id: '2', credor: 'Banco B', saldo: 10_000, taxaMensal: 0 },
      ],
      1_518 // mínimo existencial
    )

    // Disponível = 5000 - 500 - 1518 = 2982
    expect(round(r.disponivelDividas)).toBe(2_982)

    // Como as dívidas são iguais, as parcelas devem ser iguais
    expect(round(r.dividas[0].parcela)).toBe(round(r.dividas[1].parcela))
    expect(round(r.dividas[0].percentual)).toBe(50)
  })

  it('renda insuficiente → viavel = false, disponivelDividas = 0', () => {
    const r = calcSuperendividamento(
      1_000, // renda abaixo do mínimo existencial
      0,
      [{ id: '1', credor: 'X', saldo: 5_000, taxaMensal: 2 }],
      1_518
    )
    expect(r.viavel).toBe(false)
    expect(r.disponivelDividas).toBe(0)
  })

  it('totalDividas é a soma dos saldos', () => {
    const r = calcSuperendividamento(
      8_000, 0,
      [
        { id: '1', credor: 'A', saldo: 3_000, taxaMensal: 0 },
        { id: '2', credor: 'B', saldo: 7_000, taxaMensal: 0 },
      ],
      1_518
    )
    expect(r.totalDividas).toBe(10_000)
  })
})

// ─── calcDividaContrato ───────────────────────────────────────────────────────

describe('calcDividaContrato', () => {
  it('juros simples: principal × taxa × meses', () => {
    const r = calcDividaContrato(
      10_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 4 }, // 3 meses
      1,   // 1% a.m.
      0,   // sem multa
      'simples'
    )

    // Juros: 10000 × 0.01 × 3 = 300
    expect(round(r.jurosAcumulados)).toBe(300)
    expect(round(r.totalAtualizado)).toBe(10_300)
    expect(r.meses).toBe(3)
  })

  it('juros compostos: principal × (1+taxa)^meses - principal', () => {
    const r = calcDividaContrato(
      10_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 4 }, // 3 meses
      1,
      0,
      'composto'
    )

    const esperado = 10_000 * (1.01 ** 3 - 1)
    expect(round(r.jurosAcumulados)).toBe(round(esperado))
  })

  it('multa incide uma única vez sobre o principal', () => {
    const r = calcDividaContrato(
      10_000,
      { year: 2024, month: 1 },
      { year: 2024, month: 2 },
      0,   // sem juros
      2,   // 2% multa
      'simples'
    )
    expect(round(r.multa)).toBe(200) // 2% de 10000
    expect(round(r.totalAtualizado)).toBe(10_200)
  })

  it('juros compostos > juros simples para mesmo período', () => {
    const simples = calcDividaContrato(10_000, { year: 2024, month: 1 }, { year: 2025, month: 1 }, 2, 0, 'simples')
    const composto = calcDividaContrato(10_000, { year: 2024, month: 1 }, { year: 2025, month: 1 }, 2, 0, 'composto')
    expect(composto.jurosAcumulados).toBeGreaterThan(simples.jurosAcumulados)
  })
})
