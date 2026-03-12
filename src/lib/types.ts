export interface YearMonth {
  year: number
  month: number // 1-12
}

export interface MonthlyIndex {
  year: number
  month: number
  value: number // percentual, ex: 0.22 = 0.22%
}

export interface SalarioMinimo {
  year: number
  month: number
  value: number // em R$
}

export interface Indices {
  ipcae: MonthlyIndex[]
  inpc: MonthlyIndex[]
  salarioMinimo: SalarioMinimo[]
}

// ─── Cumprimento Simples ────────────────────────────────
export interface CumprimentoSimplesResult {
  principalOriginal: number
  fatorCorrecao: number
  principalCorrigido: number
  jurosMora: number
  totalAtualizado: number
  meses: number
  detalhesCorrecao: DetalheCorrecao[]
}

export interface DetalheCorrecao {
  mesAno: string
  ipcae: number
  fatorMensal: number
  fatorAcumulado: number
}

// ─── Cumprimento com Multa ──────────────────────────────
export interface CumprimentoMultaResult extends CumprimentoSimplesResult {
  multa10: number
  honorarios10: number
  totalComMulta: number
}

// ─── Pensão Alimentícia ─────────────────────────────────
export type TipoPensao = 'percentual_salario_minimo' | 'percentual_salario' | 'valor_fixo'

export interface PensaoMes {
  mesAno: string
  yearMonth: YearMonth
  valorDevido: number
  valorPago: number
  saldo: number
  salarioMinimo: number
  fatorInpc: number
  saldoCorrigido: number
}

export interface PensaoResult {
  meses: PensaoMes[]
  totalDevido: number
  totalPago: number
  totalSaldoOriginal: number
  totalCorrigido: number
  totalAtualizado: number
}

// ─── Pagamentos Parciais ────────────────────────────────
export interface Pagamento {
  id: string
  data: string // YYYY-MM
  valor: number
}

export interface PagamentoParcialLinha {
  mesAno: string
  yearMonth: YearMonth
  fatorCorrecao: number
  saldoInicio: number
  juros: number
  saldoAtualizado: number
  pagamento: number
  saldoFim: number
}

export interface PagamentosParciaisResult {
  linhas: PagamentoParcialLinha[]
  saldoFinal: number
  totalPago: number
  totalJuros: number
  totalCorrecao: number
}

// ─── Superendividamento ─────────────────────────────────
export interface Divida {
  id: string
  credor: string
  saldo: number
  taxaMensal: number // % ao mês
}

export interface ParcialDivida {
  credor: string
  saldoAtual: number
  parcela: number
  percentual: number
  prazoMeses: number
}

export interface SuperendividamentoResult {
  rendaLiquida: number
  minimoExistencial: number
  disponivelDividas: number
  dividas: ParcialDivida[]
  totalDividas: number
  prazoMaximo: number
  viavel: boolean
}

// ─── Dívida Contrato ────────────────────────────────────
export interface DividaContratoResult {
  principal: number
  multa: number
  jurosAcumulados: number
  totalAtualizado: number
  fatorJuros: number
  meses: number
  tipoJuros: 'simples' | 'composto'
}
