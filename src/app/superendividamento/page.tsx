'use client'

import { useState } from 'react'
import {
  CalculatorShell, SectionCard, Field, Input, BtnCalc,
  ResultBox, AlertError,
} from '@/components/calculator-shell'
import { calcSuperendividamento } from '@/lib/calculations'
import { formatCurrency, parseBrNumber } from '@/lib/format'
import type { Divida, SuperendividamentoResult, ParcialDivida } from '@/lib/types'

let nextDividaId = 1
function genId() { return String(nextDividaId++) }

interface DividaInput {
  id: string
  credor: string
  saldo: string
  taxaMensal: string
}

export default function SuperendividamentoPage() {
  const [error, setError] = useState<string | null>(null)

  const [rendaBruta, setRendaBruta] = useState('')
  const [descontos, setDescontos] = useState('')
  const [minimoCustom, setMinimoCustom] = useState('') // vazio = usar SM 2025

  const [dividas, setDividas] = useState<DividaInput[]>([
    { id: genId(), credor: '', saldo: '', taxaMensal: '' },
  ])

  const [resultado, setResultado] = useState<SuperendividamentoResult | null>(null)

  function addDivida() {
    setDividas((prev) => [...prev, { id: genId(), credor: '', saldo: '', taxaMensal: '' }])
  }

  function removeDivida(id: string) {
    setDividas((prev) => prev.filter((d) => d.id !== id))
  }

  function updateDivida(id: string, field: keyof DividaInput, value: string) {
    setDividas((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }

  function calcular() {
    const renda = parseBrNumber(rendaBruta)
    if (!renda) { setError('Informe a renda bruta.'); return }

    const validDividas: Divida[] = dividas
      .filter((d) => d.credor && d.saldo)
      .map((d) => ({
        id: d.id,
        credor: d.credor,
        saldo: parseBrNumber(d.saldo),
        taxaMensal: parseFloat(d.taxaMensal.replace(',', '.')) || 0,
      }))

    if (validDividas.length === 0) { setError('Adicione ao menos uma dívida.'); return }

    setError(null)
    const r = calcSuperendividamento(
      renda,
      parseBrNumber(descontos),
      validDividas,
      minimoCustom ? parseBrNumber(minimoCustom) : undefined
    )
    setResultado(r)
  }

  return (
    <CalculatorShell
      titulo="Superendividamento"
      subtitulo="Plano de pagamento"
      baseLegal="Lei 14.181/2021 · Art. 54-A CDC"
      
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Formulário ─────────────────────────────────────── */}
        <div className="space-y-5">
          <SectionCard titulo="Situação Financeira do Devedor">
            <div className="space-y-4">
              {error && <AlertError msg={error} />}

              <Field label="Renda Bruta Mensal" hint="Salário, benefícios, aluguéis, etc.">
                <Input type="text" value={rendaBruta} onChange={setRendaBruta} prefix="R$" placeholder="4.000,00" />
              </Field>

              <Field label="Descontos e Despesas Fixas" hint="INSS, IRRF, plano de saúde, aluguel, alimentação...">
                <Input type="text" value={descontos} onChange={setDescontos} prefix="R$" placeholder="1.500,00" />
              </Field>

              <Field
                label="Mínimo Existencial Personalizado"
                hint="Vazio = Salário Mínimo vigente (R$ 1.518 em 2025). Art. 54-A da Lei 14.181/2021"
              >
                <Input type="text" value={minimoCustom} onChange={setMinimoCustom} prefix="R$" placeholder="1.518,00 (padrão: SM)" />
              </Field>

              {rendaBruta && (
                <div className="bg-navy-50 rounded-lg p-3 text-sm space-y-1.5">
                  <div className="flex justify-between text-navy-600">
                    <span>Renda Bruta</span>
                    <span className="tabular-nums font-medium">{formatCurrency(parseBrNumber(rendaBruta))}</span>
                  </div>
                  <div className="flex justify-between text-navy-600">
                    <span>(-) Descontos</span>
                    <span className="tabular-nums font-medium text-slate-600">- {formatCurrency(parseBrNumber(descontos))}</span>
                  </div>
                  <div className="flex justify-between text-navy-600">
                    <span>(-) Mínimo Existencial</span>
                    <span className="tabular-nums font-medium text-slate-600">- {formatCurrency(minimoCustom ? parseBrNumber(minimoCustom) : 1518)}</span>
                  </div>
                  <div className="border-t border-navy-200 pt-1.5 flex justify-between font-bold text-navy-900">
                    <span>Disponível para dívidas</span>
                    <span className={`tabular-nums ${
                      parseBrNumber(rendaBruta) - parseBrNumber(descontos) - (minimoCustom ? parseBrNumber(minimoCustom) : 1518) > 0
                        ? 'text-navy-700' : 'text-slate-600'
                    }`}>
                      {formatCurrency(Math.max(0, parseBrNumber(rendaBruta) - parseBrNumber(descontos) - (minimoCustom ? parseBrNumber(minimoCustom) : 1518)))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard titulo="Dívidas">
            <div className="space-y-3">
              <p className="text-xs text-navy-500">
                Liste todas as dívidas. A renda disponível será distribuída proporcionalmente ao saldo de cada credor.
              </p>

              {dividas.map((d, i) => (
                <div key={d.id} className="bg-navy-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-navy-600">Dívida #{i + 1}</span>
                    {dividas.length > 1 && (
                      <button
                        onClick={() => removeDivida(d.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <Input
                    type="text"
                    value={d.credor}
                    onChange={(v) => updateDivida(d.id, 'credor', v)}
                    placeholder="Nome do credor (banco, empresa...)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      value={d.saldo}
                      onChange={(v) => updateDivida(d.id, 'saldo', v)}
                      placeholder="Saldo devedor"
                      prefix="R$"
                    />
                    <Input
                      type="text"
                      value={d.taxaMensal}
                      onChange={(v) => updateDivida(d.id, 'taxaMensal', v)}
                      placeholder="Taxa (opcional)"
                      suffix="% a.m."
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addDivida}
                className="w-full border border-dashed border-navy-300 text-navy-500 hover:border-navy-500 hover:text-navy-700 rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
                </svg>
                Adicionar Dívida
              </button>
            </div>
          </SectionCard>

          <BtnCalc onClick={calcular} label="Gerar Plano de Pagamento" />

          <div className="bg-navy-50 border border-navy-200 rounded-xl p-4 text-xs text-navy-500 leading-relaxed">
            <p className="font-semibold text-navy-700 mb-1">Sobre o cálculo</p>
            <p>Baseado na Lei 14.181/2021 (Lei do Superendividamento). O plano preserva o mínimo existencial do consumidor, distribuindo a renda disponível proporcionalmente entre os credores. Prazo máximo de 60 meses previsto na lei.</p>
          </div>
        </div>

        {/* ─── Resultado ──────────────────────────────────────── */}
        <div className="space-y-5">
          {resultado && (
            <div className="animate-fade-in-up space-y-4">
              {/* Viabilidade */}
              <div className={`rounded-2xl p-4 border-2 ${
                resultado.viavel
                  ? 'bg-slate-50 border-slate-200 text-navy-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2 font-bold text-base mb-1">
                  {resultado.viavel ? (
                    <>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                        <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Plano Viável
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <circle cx="8" cy="8" r="6"/>
                        <path d="M8 5v3M8 11h.01" strokeLinecap="round"/>
                      </svg>
                      Renda Insuficiente
                    </>
                  )}
                </div>
                <p className="text-sm">
                  {resultado.viavel
                    ? `Disponível para dívidas: ${formatCurrency(resultado.disponivelDividas)}/mês`
                    : 'A renda disponível é zero ou negativa após o mínimo existencial.'}
                </p>
              </div>

              <SectionCard titulo="Situação Financeira">
                <div className="space-y-2">
                  {[
                    ['Renda Líquida', formatCurrency(resultado.rendaLiquida)],
                    ['Mínimo Existencial', `- ${formatCurrency(resultado.minimoExistencial)}`],
                    ['Disponível p/ Dívidas', formatCurrency(resultado.disponivelDividas)],
                    ['Total das Dívidas', formatCurrency(resultado.totalDividas)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1.5 border-b border-navy-100 last:border-0">
                      <span className="text-navy-600">{k}</span>
                      <span className="tabular-nums font-semibold text-navy-900">{v}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard titulo="Plano de Pagamento">
                <div className="space-y-3">
                  {resultado.dividas.map((d: ParcialDivida) => (
                    <div key={d.credor} className="bg-navy-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-navy-900 text-sm">{d.credor}</p>
                          <p className="text-xs text-navy-500">{d.percentual.toFixed(1).replace('.', ',')}% do saldo total</p>
                        </div>
                        <span className="text-xs font-mono bg-navy-200 text-navy-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {d.prazoMeses >= 60 ? '60+ meses' : `${d.prazoMeses} meses`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-navy-500">Saldo devedor</p>
                          <p className="font-bold text-navy-900 tabular-nums">{formatCurrency(d.saldoAtual)}</p>
                        </div>
                        <div>
                          <p className="text-navy-500">Parcela mensal</p>
                          <p className={`font-bold tabular-nums ${resultado.viavel ? 'text-navy-700' : 'text-slate-600'}`}>
                            {formatCurrency(d.parcela)}
                          </p>
                        </div>
                      </div>
                      {/* Barra de progresso da parcela */}
                      <div className="mt-2 h-1.5 bg-navy-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, d.percentual)}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="border-t-2 border-navy-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-navy-700">Parcela Total Mensal</span>
                      <span className="text-xl font-bold text-navy-900 tabular-nums">
                        {formatCurrency(resultado.dividas.reduce((s, d) => s + d.parcela, 0))}
                      </span>
                    </div>
                    <p className="text-xs text-navy-400 mt-1">
                      Prazo máximo estimado: {resultado.prazoMaximo >= 60 ? '60+ meses (limite legal)' : `${resultado.prazoMaximo} meses`}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {!resultado && (
            <div className="bg-navy-50 border border-navy-200 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center text-navy-300">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 opacity-50">
                <path d="M24 44s16-8 16-20V10L24 4 8 10v14c0 12 16 20 16 20z"/>
                <path d="M16 22l6 6 10-10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm font-medium text-navy-400">Preencha os dados financeiros</p>
              <p className="text-xs mt-1 text-navy-300">e clique em Gerar Plano</p>
            </div>
          )}
        </div>
      </div>
    </CalculatorShell>
  )
}
