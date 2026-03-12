'use client'

import { useState, useEffect } from 'react'
import {
  CalculatorShell, SectionCard, Field, Input, CurrencyInput, Select, BtnCalc,
  ResultBox, AlertError, LoadingIndices, IndicesCarregados, MonthYearPicker,
} from '@/components/calculator-shell'
import { calcPensao } from '@/lib/calculations'
import { formatCurrency, currentMonthInput, parseBrNumber, addMonths, compareYearMonth } from '@/lib/format'
import type { Indices, PensaoResult, TipoPensao, PensaoMes } from '@/lib/types'

export default function PensaoPage() {
  const [indices, setIndices] = useState<Indices | null>(null)
  const [loadingIdx, setLoadingIdx] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState(currentMonthInput)
  const [tipoPensao, setTipoPensao] = useState<TipoPensao>('percentual_salario_minimo')
  const [valorBase, setValorBase] = useState('')        // % ou R$
  const [salarioPagador, setSalarioPagador] = useState('')

  // Pagamentos: lista de {mes: "YYYY-MM", valor: string}
  const [pagamentos, setPagamentos] = useState<{ mes: string; valor: string }[]>([])
  const [pagamentoUniforme, setPagamentoUniforme] = useState('') // paga o mesmo todo mês

  const [resultado, setResultado] = useState<PensaoResult | null>(null)
  const [mostrarTabela, setMostrarTabela] = useState(true)

  useEffect(() => {
    fetch('/api/indices')
      .then((r) => r.json())
      .then((d) => { setIndices(d); setLoadingIdx(false) })
      .catch(() => { setError('Não foi possível carregar os índices.'); setLoadingIdx(false) })
  }, [])

  // Gera linhas de pagamento quando o período muda
  useEffect(() => {
    if (!periodoInicio || !periodoFim) return
    const [fy, fm] = periodoInicio.split('-').map(Number)
    const [ty, tm] = periodoFim.split('-').map(Number)
    if (!fy || !fm || !ty || !tm) return

    const meses: string[] = []
    let cur = { year: fy, month: fm }
    const toYm = { year: ty, month: tm }
    while (compareYearMonth(cur, toYm) <= 0) {
      meses.push(`${cur.year}-${String(cur.month).padStart(2, '0')}`)
      cur = addMonths(cur, 1)
    }

    setPagamentos((prev) => {
      const prevMap = new Map(prev.map((p) => [p.mes, p.valor]))
      return meses.map((m) => ({ mes: m, valor: prevMap.get(m) ?? '' }))
    })
  }, [periodoInicio, periodoFim])

  function setPagamentoUniformeTodos(val: string) {
    setPagamentoUniforme(val)
    setPagamentos((prev) => prev.map((p) => ({ ...p, valor: val })))
  }

  function calcular() {
    if (!indices) return
    const vb = parseBrNumber(valorBase)
    if (!vb || !periodoInicio || !periodoFim) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    const [fy, fm] = periodoInicio.split('-').map(Number)
    const [ty, tm] = periodoFim.split('-').map(Number)

    const [cy, cm] = currentMonthInput().split('-').map(Number)

    const pagMap = new Map<string, number>()
    for (const p of pagamentos) {
      if (p.valor) pagMap.set(p.mes, parseBrNumber(p.valor))
    }

    setError(null)
    const r = calcPensao(
      { year: fy, month: fm },
      { year: ty, month: tm },
      tipoPensao,
      vb,
      parseBrNumber(salarioPagador),
      pagMap,
      indices.inpc,
      indices.salarioMinimo,
    )
    setResultado(r)
  }

  const totalMeses = pagamentos.length

  return (
    <CalculatorShell
      titulo="Pensão Alimentícia"
      subtitulo="Débito alimentar"
      baseLegal="Art. 529 CPC · Súmula 309 STJ"
      
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ─── Formulário (3 colunas) ─────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          <SectionCard titulo="Configuração da Pensão">
            <div className="space-y-4">
              {loadingIdx && <LoadingIndices />}
              {indices && <IndicesCarregados ipcae={indices.ipcae} inpc={indices.inpc} />}
              {error && <AlertError msg={error} />}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Período — Início">
                  <MonthYearPicker value={periodoInicio} onChange={setPeriodoInicio} max={currentMonthInput()} />
                </Field>
                <Field label="Período — Fim">
                  <MonthYearPicker value={periodoFim} onChange={setPeriodoFim} max={currentMonthInput()} />
                </Field>
              </div>

              <Field label="Tipo de Pensão">
                <Select value={tipoPensao} onChange={(v) => setTipoPensao(v as TipoPensao)}>
                  <option value="percentual_salario_minimo">% do Salário Mínimo (automático)</option>
                  <option value="percentual_salario">% do Salário do Alimentante</option>
                  <option value="valor_fixo">Valor Fixo em R$</option>
                </Select>
              </Field>

              {tipoPensao === 'percentual_salario_minimo' && (
                <Field label="Percentual do Salário Mínimo" hint="Ex: 50 para 50% do SM vigente">
                  <Input type="number" value={valorBase} onChange={setValorBase} suffix="%" placeholder="50" step="0.01" min="0" />
                </Field>
              )}
              {tipoPensao === 'percentual_salario' && (
                <>
                  <Field label="Percentual do Salário" hint="% do salário do alimentante">
                    <Input type="number" value={valorBase} onChange={setValorBase} suffix="%" placeholder="30" step="0.01" min="0" />
                  </Field>
                  <Field label="Salário do Alimentante (R$)" hint="Valor mensal bruto">
                    <CurrencyInput value={salarioPagador} onChange={setSalarioPagador} />
                  </Field>
                </>
              )}
              {tipoPensao === 'valor_fixo' && (
                <Field label="Valor Fixo da Pensão" hint="Valor mensal estipulado na sentença">
                  <CurrencyInput value={valorBase} onChange={setValorBase} />
                </Field>
              )}
            </div>
          </SectionCard>

          {/* Pagamentos por mês */}
          {pagamentos.length > 0 && (
            <SectionCard titulo={`Valores Pagos (${totalMeses} meses)`}>
              <div className="space-y-3">
                <Field
                  label="Aplicar mesmo valor a todos os meses"
                  hint="Preencha e clique fora para aplicar a todos"
                >
                  <CurrencyInput
                    value={pagamentoUniforme}
                    onChange={(v) => { setPagamentoUniforme(v); setPagamentos(prev => prev.map(p => ({ ...p, valor: v }))) }}
                  />
                </Field>

                <div className="border-t border-navy-100 pt-3">
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                    {pagamentos.map((p, i) => {
                      const [y, m] = p.mes.split('-').map(Number)
                      const label = `${String(m).padStart(2, '0')}/${y}`
                      return (
                        <div key={p.mes} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-navy-500 w-16 flex-shrink-0">{label}</span>
                          <div className="flex-1">
                            <CurrencyInput
                              value={p.valor}
                              onChange={(v) => {
                                const next = [...pagamentos]
                                next[i] = { ...p, valor: v }
                                setPagamentos(next)
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          <BtnCalc onClick={calcular} loading={loadingIdx} label="Calcular Débito Alimentar" />
        </div>

        {/* ─── Resultado (2 colunas) ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {resultado && (
            <div className="animate-fade-in-up space-y-4">
              <SectionCard titulo="Resumo">
                <div className="space-y-3">
                  <ResultBox label="Total Devido no Período" value={formatCurrency(resultado.totalDevido)} />
                  <ResultBox label="Total Pago" value={formatCurrency(resultado.totalPago)} />
                  <ResultBox
                    label="Saldo Original em Aberto"
                    value={formatCurrency(resultado.totalSaldoOriginal)}
                   
                  />
                  <ResultBox
                    label="Total Atualizado (com INPC)"
                    value={formatCurrency(resultado.totalAtualizado)}
                    destaque
                   
                  />
                </div>
              </SectionCard>
            </div>
          )}

          {!resultado && !loadingIdx && (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center p-10 text-center text-slate-300">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 opacity-40">
                <path d="M32 42v-4a8 8 0 0 0-8-8H10a8 8 0 0 0-8 8v4M18 14a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/>
              </svg>
              <p className="text-sm font-medium text-slate-500">Configure o período e os pagamentos</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela detalhada por mês */}
      {resultado && (
        <div className="mt-5">
          <SectionCard>
            <button
              onClick={() => setMostrarTabela(!mostrarTabela)}
              className="w-full flex items-center justify-between text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors cursor-pointer"
            >
              <span>Detalhamento por Mês ({resultado.meses.length} meses)</span>
              <svg
                viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                className={`w-4 h-4 transition-transform ${mostrarTabela ? 'rotate-180' : ''}`}
              >
                <path d="M4 6l4 4 4-4" strokeLinecap="round"/>
              </svg>
            </button>

            {mostrarTabela && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs min-w-[680px]">
                  <thead>
                    <tr className="bg-navy-50 text-navy-600">
                      <th className="py-2 px-2 text-left font-semibold">Mês/Ano</th>
                      <th className="py-2 px-2 text-right font-semibold">SM Vigente</th>
                      <th className="py-2 px-2 text-right font-semibold">Valor Devido</th>
                      <th className="py-2 px-2 text-right font-semibold">Valor Pago</th>
                      <th className="py-2 px-2 text-right font-semibold">Saldo</th>
                      <th className="py-2 px-2 text-right font-semibold">Fator INPC</th>
                      <th className="py-2 px-2 text-right font-semibold">Saldo Corrigido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {resultado.meses.map((m: PensaoMes) => (
                      <tr key={m.mesAno} className={`hover:bg-navy-50/50 ${m.saldo > 0 ? 'bg-slate-50/30' : ''}`}>
                        <td className="py-1.5 px-2 font-medium text-navy-700">{m.mesAno}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-navy-500">
                          {formatCurrency(m.salarioMinimo)}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums font-medium text-navy-700">
                          {formatCurrency(m.valorDevido)}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-navy-700">
                          {formatCurrency(m.valorPago)}
                        </td>
                        <td className={`py-1.5 px-2 text-right tabular-nums font-semibold ${m.saldo > 0 ? 'text-slate-600' : 'text-navy-400'}`}>
                          {m.saldo > 0 ? formatCurrency(m.saldo) : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-navy-500">
                          {m.fatorInpc.toFixed(4).replace('.', ',')}
                        </td>
                        <td className={`py-1.5 px-2 text-right tabular-nums font-bold ${m.saldoCorrigido > 0 ? 'text-slate-600' : 'text-navy-400'}`}>
                          {m.saldoCorrigido > 0 ? formatCurrency(m.saldoCorrigido) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-navy-800 text-white">
                      <td colSpan={2} className="py-2.5 px-2 font-bold rounded-bl-lg">TOTAL</td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-bold">
                        {formatCurrency(resultado.totalDevido)}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-bold">
                        {formatCurrency(resultado.totalPago)}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-bold">
                        {formatCurrency(resultado.totalSaldoOriginal)}
                      </td>
                      <td className="py-2.5 px-2 text-right">—</td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-bold text-white rounded-br-lg">
                        {formatCurrency(resultado.totalAtualizado)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </CalculatorShell>
  )
}
