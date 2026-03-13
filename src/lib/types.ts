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
  selic: MonthlyIndex[]
}

// ─── Cumprimento Simples ────────────────────────────────
export interface CumprimentoSimplesResult {
  principalOriginal: number
  fatorCorrecao: number
  principalCorrigido: number
  jurosMora: number
  taxaJurosTotal: number   // soma % de todas as taxas mensais aplicadas
  totalAtualizado: number
  meses: number
  detalhesCorrecao: DetalheCorrecao[]
  detalhesJuros: DetalheJuros[]
}

export interface DetalheCorrecao {
  mesAno: string
  ipcae: number
  fatorMensal: number
  fatorAcumulado: number
}

export type TipoJurosPeriodo = '6% a.a.' | '12% a.a.' | 'SELIC real'

export interface DetalheJuros {
  mesAno: string
  taxaMensal: number      // taxa aplicada neste mês (%)
  taxaAcumulada: number   // soma acumulada até este mês (%)
  tipo: TipoJurosPeriodo
  selicMensal?: number    // valor SELIC do mês (só no período SELIC real)
  ipcaeMensal?: number    // valor IPCA-E do mês (só no período SELIC real)
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
