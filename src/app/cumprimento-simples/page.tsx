'use client'

import { useState, useEffect } from 'react'
import {
  CalculatorShell, SectionCard, Field, Input, CurrencyInput, BtnCalc,
  ResultBox, AlertError, LoadingIndices, TabelaIndices,
} from '@/components/calculator-shell'
import { calcCumprimentoSimples } from '@/lib/calculations'
import { formatCurrency, formatPercent, formatFactor, currentMonthInput, parseBrNumber } from '@/lib/format'
import type { Indices, CumprimentoSimplesResult } from '@/lib/types'

export default function CumprimentoSimplesPage() {
  const [indices, setIndices] = useState<Indices | null>(null)
  const [loadingIdx, setLoadingIdx] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulário
  const [valor, setValor] = useState('')
  const [dataCondena, setDataCondena] = useState('')
  const [dataAtual, setDataAtual] = useState(currentMonthInput)
  const [taxaJuros, setTaxaJuros] = useState('1')

  const [resultado, setResultado] = useState<CumprimentoSimplesResult | null>(null)

  useEffect(() => {
    fetch('/api/indices')
      .then((r) => r.json())
      .then((d) => { setIndices(d); setLoadingIdx(false) })
      .catch(() => { setError('Não foi possível carregar os índices. Verifique sua conexão.'); setLoadingIdx(false) })
  }, [])

  function calcular() {
    if (!indices) return
    const v = parseBrNumber(valor)
    if (!v || !dataCondena || !dataAtual) { setError('Preencha todos os campos obrigatórios.'); return }

    const [fy, fm] = dataCondena.split('-').map(Number)
    const [ty, tm] = dataAtual.split('-').map(Number)
    if (fy * 12 + fm >= ty * 12 + tm) { setError('A data atual deve ser posterior à data da condenação.'); return }

    setError(null)
    const r = calcCumprimentoSimples(
      v,
      { year: fy, month: fm },
      { year: ty, month: tm },
      indices.ipcae,
      parseFloat(taxaJuros) || 1
    )
    setResultado(r)
  }

  return (
    <CalculatorShell
      titulo="Cumprimento de Sentença"
      subtitulo="Atualização simples"
      baseLegal="Art. 509 CPC · Tabela TJSP"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Formulário ─────────────────────────────────────── */}
        <SectionCard titulo="Dados da Condenação">
          <div className="space-y-4">
            {loadingIdx && <LoadingIndices />}
            {error && <AlertError msg={error} />}

            <Field
              label="Valor da Condenação (R$)"
              hint="Valor original conforme a sentença"
            >
              <CurrencyInput value={valor} onChange={setValor} />
            </Field>

            <Field label="Data da Condenação (mês/ano)">
              <Input
                type="month"
                value={dataCondena}
                onChange={setDataCondena}
                max={currentMonthInput()}
              />
            </Field>

            <Field label="Data de Referência (hoje ou outra)">
              <Input
                type="month"
                value={dataAtual}
                onChange={setDataAtual}
              />
            </Field>

            <Field
              label="Taxa de Juros de Mora"
              hint="Padrão: 1% a.m. (art. 406 CC / Tabela TJSP)"
            >
              <Input
                type="number"
                value={taxaJuros}
                onChange={setTaxaJuros}
                placeholder="1"
                suffix="% a.m."
                step="0.1"
                min="0"
              />
            </Field>

            <div className="pt-1">
              <BtnCalc onClick={calcular} loading={loadingIdx} />
            </div>

            <div className="bg-navy-50 rounded-lg p-3 text-xs text-navy-500 leading-relaxed">
              <strong className="text-navy-700">Metodologia:</strong> Correção monetária pelo IPCA-E
              acumulado (Tabela Prática do TJSP) + juros de mora simples sobre o valor corrigido.
              Fórmula: <em>VOriginal × Fator IPCA-E × (1 + taxa × meses)</em>
            </div>
          </div>
        </SectionCard>

        {/* ─── Resultado ──────────────────────────────────────── */}
        <div className="space-y-5">
          {resultado && (
            <div className="animate-fade-in-up space-y-3">
              <SectionCard titulo="Resultado">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <ResultBox label="Valor Original" value={formatCurrency(resultado.principalOriginal)} />
                  <ResultBox
                    label="Fator IPCA-E"
                    value={formatFactor(resultado.fatorCorrecao)}
                  />
                  <ResultBox
                    label="Correção Monetária"
                    value={formatCurrency(resultado.principalCorrigido - resultado.principalOriginal)}
                  />
                  <ResultBox
                    label={`Juros de Mora (${resultado.meses} meses)`}
                    value={formatCurrency(resultado.jurosMora)}
                  />
                </div>
                <ResultBox
                  label="Total Atualizado"
                  value={formatCurrency(resultado.totalAtualizado)}
                  destaque
                 
                />
              </SectionCard>

              <SectionCard titulo="Resumo do Cálculo">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-navy-100">
                    {[
                      ['Valor da condenação', formatCurrency(resultado.principalOriginal)],
                      ['Fator de correção IPCA-E', formatFactor(resultado.fatorCorrecao)],
                      ['Principal corrigido', formatCurrency(resultado.principalCorrigido)],
                      [`Juros ${parseFloat(taxaJuros)}% × ${resultado.meses} meses`, formatCurrency(resultado.jurosMora)],
                    ].map(([k, v]) => (
                      <tr key={k} className="hover:bg-navy-50/50">
                        <td className="py-2 text-navy-600">{k}</td>
                        <td className="py-2 text-right font-semibold text-navy-900 tabular-nums">{v}</td>
                      </tr>
                    ))}
                    <tr className="bg-navy-800 text-white">
                      <td className="py-2.5 px-2 font-bold rounded-bl-lg">Total Atualizado</td>
                      <td className="py-2.5 px-2 text-right font-bold tabular-nums text-slate-300 rounded-br-lg">
                        {formatCurrency(resultado.totalAtualizado)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </SectionCard>

              <TabelaIndices detalhes={resultado.detalhesCorrecao} />
            </div>
          )}

          {!resultado && !loadingIdx && (
            <div className="bg-navy-50 border border-navy-200 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center text-navy-400">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 opacity-40">
                <rect x="8" y="4" width="32" height="40" rx="4"/>
                <path d="M16 16h16M16 24h16M16 32h8" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-medium">Preencha os dados e clique em Calcular</p>
              <p className="text-xs mt-1">O resultado aparecerá aqui</p>
            </div>
          )}
        </div>
      </div>
    </CalculatorShell>
  )
}
