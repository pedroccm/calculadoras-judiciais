import type {
  YearMonth,
  MonthlyIndex,
  SalarioMinimo,
  CumprimentoSimplesResult,
  CumprimentoMultaResult,
  DetalheCorrecao,
  TipoPensao,
  PensaoResult,
  PensaoMes,
  Pagamento,
  PagamentosParciaisResult,
  PagamentoParcialLinha,
  Divida,
  SuperendividamentoResult,
  DividaContratoResult,
} from './types'
import { compareYearMonth, formatYearMonth, addMonths } from './format'

// ─── Helpers básicos ─────────────────────────────────────────────────────────

export function monthsBetween(from: YearMonth, to: YearMonth): number {
  return (to.year - from.year) * 12 + (to.month - from.month)
}

export function iterateMonths(from: YearMonth, to: YearMonth): YearMonth[] {
  const months: YearMonth[] = []
  let cur = { ...from }
  while (compareYearMonth(cur, to) < 0) {
    months.push({ ...cur })
    cur = addMonths(cur, 1)
  }
  return months
}

function findIndex(indices: MonthlyIndex[], ym: YearMonth): number | null {
  const found = indices.find(i => i.year === ym.year && i.month === ym.month)
  return found ? found.value : null
}

function findSalario(salarios: SalarioMinimo[], ym: YearMonth): number {
  // Pega o salário vigente na competência (último <= ym)
  let best: SalarioMinimo | null = null
  for (const s of salarios) {
    if (compareYearMonth({ year: s.year, month: s.month }, ym) <= 0) {
      if (!best || compareYearMonth({ year: s.year, month: s.month }, { year: best.year, month: best.month }) > 0) {
        best = s
      }
    }
  }
  return best?.value ?? 1412 // fallback 2025
}

// ─── Correção Monetária por IPCA-E ──────────────────────────────────────────

export function calcCorrectionFactor(
  ipcae: MonthlyIndex[],
  from: YearMonth,
  to: YearMonth
): { factor: number; detalhes: DetalheCorrecao[] } {
  const months = iterateMonths(from, to)
  let fatorAcumulado = 1.0
  const detalhes: DetalheCorrecao[] = []

  for (const m of months) {
    const val = findIndex(ipcae, m)
    const ipcaeVal = val ?? 0 // se não tem dado, assume 0 (idealmente mostrar aviso)
    const fatorMensal = 1 + ipcaeVal / 100
    fatorAcumulado *= fatorMensal
    detalhes.push({
      mesAno: formatYearMonth(m),
      ipcae: ipcaeVal,
      fatorMensal,
      fatorAcumulado,
    })
  }

  return { factor: fatorAcumulado, detalhes }
}

// ─── 1. Cumprimento de Sentença Simples ─────────────────────────────────────
// IPCA-E (correção) + 1% a.m. simples (juros de mora)
// Base legal: Tabela Prática TJSP, Art. 405 CC, Art. 161 CTN

export function calcCumprimentoSimples(
  principal: number,
  from: YearMonth,
  to: YearMonth,
  ipcae: MonthlyIndex[],
  taxaJurosMensal: number = 1 // 1% a.m.
): CumprimentoSimplesResult {
  const { factor, detalhes } = calcCorrectionFactor(ipcae, from, to)
  const meses = monthsBetween(from, to)

  const principalCorrigido = principal * factor
  const jurosMora = principalCorrigido * (taxaJurosMensal / 100) * meses
  const totalAtualizado = principalCorrigido + jurosMora

  return {
    principalOriginal: principal,
    fatorCorrecao: factor,
    principalCorrigido,
    jurosMora,
    totalAtualizado,
    meses,
    detalhesCorrecao: detalhes,
  }
}

// ─── 2. Cumprimento com Multa e Honorários ───────────────────────────────────
// Art. 523, §1º CPC: Multa 10% + Honorários 10% sobre o débito atualizado

export function calcCumprimentoMulta(
  principal: number,
  from: YearMonth,
  to: YearMonth,
  ipcae: MonthlyIndex[],
  taxaJurosMensal: number = 1,
  percentualMulta: number = 10,
  percentualHonorarios: number = 10
): CumprimentoMultaResult {
  const base = calcCumprimentoSimples(principal, from, to, ipcae, taxaJurosMensal)
  const multa10 = base.totalAtualizado * (percentualMulta / 100)
  const honorarios10 = base.totalAtualizado * (percentualHonorarios / 100)
  const totalComMulta = base.totalAtualizado + multa10 + honorarios10

  return { ...base, multa10, honorarios10, totalComMulta }
}

// ─── 3. Pensão Alimentícia ───────────────────────────────────────────────────
// Correção por INPC do valor em aberto de cada mês

export function calcPensao(
  from: YearMonth,
  to: YearMonth,
  tipoPensao: TipoPensao,
  valorBase: number, // % ou R$ conforme tipo
  salarioPagador: number, // para tipo percentual_salario
  pagamentosPorMes: Map<string, number>, // "YYYY-MM" -> valor pago
  inpc: MonthlyIndex[],
  salarios: SalarioMinimo[]
): PensaoResult {
  const months = iterateMonths(from, addMonths(to, 1)) // inclui mês final
  const toCalc = to // mês de referência para correção (hoje)

  let totalDevido = 0
  let totalPago = 0
  let totalSaldoOriginal = 0
  let totalCorrigido = 0

  const meses: PensaoMes[] = months.map((ym) => {
    const salMin = findSalario(salarios, ym)
    let valorDevido: number

    if (tipoPensao === 'percentual_salario_minimo') {
      valorDevido = salMin * (valorBase / 100)
    } else if (tipoPensao === 'percentual_salario') {
      valorDevido = salarioPagador * (valorBase / 100)
    } else {
      valorDevido = valorBase
    }

    const chave = `${ym.year}-${String(ym.month).padStart(2, '0')}`
    const valorPago = pagamentosPorMes.get(chave) ?? 0
    const saldo = Math.max(0, valorDevido - valorPago)

    // Corrige saldo pelo INPC de ym até toCalc
    const { factor: fatorInpc } = calcCorrectionFactor(inpc, ym, toCalc)
    const saldoCorrigido = saldo * fatorInpc

    totalDevido += valorDevido
    totalPago += valorPago
    totalSaldoOriginal += saldo
    totalCorrigido += saldoCorrigido

    return {
      mesAno: formatYearMonth(ym),
      yearMonth: ym,
      valorDevido,
      valorPago,
      saldo,
      salarioMinimo: salMin,
      fatorInpc,
      saldoCorrigido,
    }
  })

  return {
    meses,
    totalDevido,
    totalPago,
    totalSaldoOriginal,
    totalCorrigido,
    totalAtualizado: totalCorrigido,
  }
}

// ─── 4. Pagamentos Parciais ──────────────────────────────────────────────────
// Cada pagamento abate o saldo atualizado (juros primeiro, depois principal)

export function calcPagamentosParciais(
  principal: number,
  fromDate: YearMonth,
  toDate: YearMonth,
  pagamentos: Pagamento[],
  ipcae: MonthlyIndex[],
  taxaJurosMensal: number = 1
): PagamentosParciaisResult {
  const months = iterateMonths(fromDate, addMonths(toDate, 1))
  const pagsByMonth = new Map<string, number>()
  for (const p of pagamentos) {
    const key = p.data // YYYY-MM
    pagsByMonth.set(key, (pagsByMonth.get(key) ?? 0) + p.valor)
  }

  let saldoPrincipal = principal
  let totalPago = 0
  let totalJuros = 0
  let totalCorrecao = 0
  const linhas: PagamentoParcialLinha[] = []

  for (const ym of months) {
    const chave = `${ym.year}-${String(ym.month).padStart(2, '0')}`
    const ipcaeVal = findIndex(ipcae, ym) ?? 0
    const fatorMes = 1 + ipcaeVal / 100

    // Aplica correção ao saldo
    const correcaoMes = saldoPrincipal * (fatorMes - 1)
    saldoPrincipal *= fatorMes
    totalCorrecao += correcaoMes

    // Aplica juros simples mensais
    const jurosMes = saldoPrincipal * (taxaJurosMensal / 100)
    const saldoComJuros = saldoPrincipal + jurosMes
    totalJuros += jurosMes

    const pagamento = pagsByMonth.get(chave) ?? 0
    const saldoFim = Math.max(0, saldoComJuros - pagamento)

    // Abate: juros primeiro, depois principal
    const pagoJuros = Math.min(pagamento, jurosMes)
    const pagoPrincipal = Math.max(0, pagamento - pagoJuros)
    saldoPrincipal = Math.max(0, saldoPrincipal - pagoPrincipal)

    totalPago += pagamento

    linhas.push({
      mesAno: formatYearMonth(ym),
      yearMonth: ym,
      fatorCorrecao: fatorMes,
      saldoInicio: saldoPrincipal - correcaoMes,
      juros: jurosMes,
      saldoAtualizado: saldoComJuros,
      pagamento,
      saldoFim,
    })

    if (saldoFim <= 0) break
  }

  return {
    linhas,
    saldoFinal: Math.max(0, linhas[linhas.length - 1]?.saldoFim ?? 0),
    totalPago,
    totalJuros,
    totalCorrecao,
  }
}

// ─── 5. Superendividamento (Lei 14.181/2021) ─────────────────────────────────

export function calcSuperendividamento(
  rendaBruta: number,
  descontos: number,
  dividas: Divida[],
  minimoExistencialCustom?: number
): SuperendividamentoResult {
  const rendaLiquida = rendaBruta - descontos
  // Mínimo existencial: salário mínimo atual (art. 54-A, Lei 14.181)
  const minimoExistencial = minimoExistencialCustom ?? 1518 // SM 2025

  const disponivelDividas = Math.max(0, rendaLiquida - minimoExistencial)
  const totalDividas = dividas.reduce((sum, d) => sum + d.saldo, 0)
  const viavel = disponivelDividas > 0

  const result = dividas.map((d) => {
    const percentual = totalDividas > 0 ? d.saldo / totalDividas : 0
    const parcela = disponivelDividas * percentual

    // Prazo para quitar: saldo / (parcela - juros mensais)
    // Se taxa > 0, calculamos prazo considerando amortização
    let prazoMeses = 0
    if (parcela > 0) {
      if (d.taxaMensal <= 0) {
        prazoMeses = Math.ceil(d.saldo / parcela)
      } else {
        const r = d.taxaMensal / 100
        // n = -ln(1 - P*r/PMT) / ln(1+r)  [fórmula de amortização]
        const arg = 1 - (d.saldo * r) / parcela
        if (arg > 0) {
          prazoMeses = Math.ceil(-Math.log(arg) / Math.log(1 + r))
        } else {
          prazoMeses = 999 // parcela não cobre juros
        }
      }
    }

    return {
      credor: d.credor,
      saldoAtual: d.saldo,
      parcela,
      percentual: percentual * 100,
      prazoMeses: Math.min(prazoMeses, 60), // máx 60 meses na lei
    }
  })

  const prazoMaximo = result.reduce((max, d) => Math.max(max, d.prazoMeses), 0)

  return {
    rendaLiquida,
    minimoExistencial,
    disponivelDividas,
    dividas: result,
    totalDividas,
    prazoMaximo,
    viavel,
  }
}

// ─── 6. Dívida Conforme Contrato ─────────────────────────────────────────────

export function calcDividaContrato(
  principal: number,
  from: YearMonth,
  to: YearMonth,
  taxaMensalPercent: number,
  multaPercent: number,
  tipoJuros: 'simples' | 'composto' = 'simples'
): DividaContratoResult {
  const meses = monthsBetween(from, to)
  const taxa = taxaMensalPercent / 100
  const multa = principal * (multaPercent / 100)

  let jurosAcumulados: number
  let fatorJuros: number

  if (tipoJuros === 'simples') {
    jurosAcumulados = principal * taxa * meses
    fatorJuros = 1 + taxa * meses
  } else {
    fatorJuros = Math.pow(1 + taxa, meses)
    jurosAcumulados = principal * (fatorJuros - 1)
  }

  const totalAtualizado = principal + jurosAcumulados + multa

  return {
    principal,
    multa,
    jurosAcumulados,
    totalAtualizado,
    fatorJuros,
    meses,
    tipoJuros,
  }
}
