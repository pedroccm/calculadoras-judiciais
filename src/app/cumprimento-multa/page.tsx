'use client'

import { useState, useEffect } from 'react'
import {
  CalculatorShell, SectionCard, Field, Input, CurrencyInput, BtnCalc,
  ResultBox, AlertError, LoadingIndices, TabelaIndices, IndicesCarregados,
} from '@/components/calculator-shell'
import { calcCumprimentoMulta } from '@/lib/calculations'
import { formatCurrency, formatFactor, currentMonthInput, parseBrNumber } from '@/lib/format'
import type { Indices, CumprimentoMultaResult } from '@/lib/types'

export default function CumprimentoMultaPage() {
  const [indices, setIndices] = useState<Indices | null>(null)
  const [loadingIdx, setLoadingIdx] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [valor, setValor] = useState('')
  const [dataCondena, setDataCondena] = useState('')
  const [dataPrazo, setDataPrazo] = useState('') // data em que escoou o prazo de 15 dias
  const [dataAtual, setDataAtual] = useState(currentMonthInput)
  const [taxaJuros, setTaxaJuros] = useState('1')
  const [percMulta, setPercMulta] = useState('10')
  const [percHonorarios, setPercHonorarios] = useState('10')

  const [resultado, setResultado] = useState<CumprimentoMultaResult | null>(null)

  useEffect(() => {
    fetch('/api/indices')
      .then((r) => r.json())
      .then((d) => { setIndices(d); setLoadingIdx(false) })
      .catch(() => { setError('Não foi possível carregar os índices.'); setLoadingIdx(false) })
  }, [])

  function calcular() {
    if (!indices) return
    const v = parseBrNumber(valor)
    if (!v || !dataCondena || !dataAtual) { setError('Preencha todos os campos obrigatórios.'); return }

    const [fy, fm] = dataCondena.split('-').map(Number)
    const [ty, tm] = dataAtual.split('-').map(Number)
    if (fy * 12 + fm >= ty * 12 + tm) { setError('A data atual deve ser posterior à data da condenação.'); return }

    setError(null)
    const r = calcCumprimentoMulta(
      v,
      { year: fy, month: fm },
      { year: ty, month: tm },
      indices.ipcae,
      parseFloat(taxaJuros) || 1,
      parseFloat(percMulta) || 10,
      parseFloat(percHonorarios) || 10
    )
    setResultado(r)
  }

  const pctMulta = parseFloat(percMulta) || 10
  const pctHon = parseFloat(percHonorarios) || 10

  return (
    <CalculatorShell
      titulo="Cumprimento + Multa"
      subtitulo="Com multa e honorários"
      baseLegal="Art. 523, §1º CPC"
      
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard titulo="Dados da Condenação">
          <div className="space-y-4">
            {loadingIdx && <LoadingIndices />}
            {indices && <IndicesCarregados ipcae={indices.ipcae} />}
            {error && <AlertError msg={error} />}

            <Field label="Valor da Condenação (R$)">
              <CurrencyInput value={valor} onChange={setValor} />
            </Field>

            <Field label="Data da Condenação">
              <Input type="month" value={dataCondena} onChange={setDataCondena} max={currentMonthInput()} />
            </Field>

            <Field
              label="Data de Referência (hoje)"
              hint="Mês em que o cálculo é realizado"
            >
              <Input type="month" value={dataAtual} onChange={setDataAtual} />
            </Field>

            <div className="border-t border-navy-100 pt-4">
              <p className="text-xs font-semibold text-navy-600 uppercase tracking-wider mb-3">
                Acréscimos por Inadimplemento (Art. 523, §1º CPC)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Multa %" hint="Padrão: 10%">
                  <Input type="number" value={percMulta} onChange={setPercMulta} suffix="%" step="1" min="0" max="100" />
                </Field>
                <Field label="Honorários %" hint="Padrão: 10%">
                  <Input type="number" value={percHonorarios} onChange={setPercHonorarios} suffix="%" step="1" min="0" max="100" />
                </Field>
              </div>
            </div>

            <Field label="Taxa de Juros de Mora" hint="1% a.m. (art. 406 CC)">
              <Input type="number" value={taxaJuros} onChange={setTaxaJuros} suffix="% a.m." step="0.1" min="0" />
            </Field>

            <BtnCalc onClick={calcular} loading={loadingIdx} />

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed">
              <strong>Art. 523, §1º CPC:</strong> "Não ocorrendo pagamento voluntário no prazo de 15
              (quinze) dias, o débito será acrescido de multa de dez por cento e, também, de honorários
              de advogado de dez por cento."
            </div>
          </div>
        </SectionCard>

        <div className="space-y-5">
          {resultado && (
            <div className="animate-fade-in-up space-y-3">
              <SectionCard titulo="Composição do Débito">
                <div className="space-y-3">
                  <ResultBox label="Valor Original da Condenação" value={formatCurrency(resultado.principalOriginal)} />

                  <div className="grid grid-cols-2 gap-3">
                    <ResultBox
                      label="Correção Monetária (IPCA-E)"
                      value={`+ ${formatCurrency(resultado.principalCorrigido - resultado.principalOriginal)}`}
                    />
                    <ResultBox
                      label={`Juros ${parseFloat(taxaJuros)}% × ${resultado.meses} m.`}
                      value={`+ ${formatCurrency(resultado.jurosMora)}`}
                    />
                  </div>

                  <ResultBox
                    label="Subtotal (Débito Atualizado)"
                    value={formatCurrency(resultado.totalAtualizado)}
                   
                  />

                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Acréscimos por Inadimplemento
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <ResultBox
                        label={`Multa ${pctMulta}% (Art. 523)`}
                        value={`+ ${formatCurrency(resultado.multa10)}`}
                       
                      />
                      <ResultBox
                        label={`Honorários ${pctHon}%`}
                        value={`+ ${formatCurrency(resultado.honorarios10)}`}
                       
                      />
                    </div>
                  </div>

                  <ResultBox
                    label="TOTAL GERAL"
                    value={formatCurrency(resultado.totalComMulta)}
                    destaque
                   
                  />
                </div>
              </SectionCard>

              <SectionCard titulo="Memória de Cálculo">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-navy-100">
                    {[
                      ['Valor da condenação', formatCurrency(resultado.principalOriginal), ''],
                      ['Fator correção IPCA-E', formatFactor(resultado.fatorCorrecao), ''],
                      ['Principal corrigido', formatCurrency(resultado.principalCorrigido), ''],
                      [`Juros ${parseFloat(taxaJuros)}% × ${resultado.meses} m.`, formatCurrency(resultado.jurosMora), ''],
                      ['Débito atualizado', formatCurrency(resultado.totalAtualizado), 'font-bold'],
                      [`Multa ${pctMulta}% (art. 523 §1º)`, formatCurrency(resultado.multa10), 'text-slate-600'],
                      [`Honorários ${pctHon}% (art. 523 §1º)`, formatCurrency(resultado.honorarios10), 'text-slate-600'],
                    ].map(([k, v, cls]) => (
                      <tr key={k} className="hover:bg-navy-50/50">
                        <td className={`py-2 text-navy-600 ${cls}`}>{k}</td>
                        <td className={`py-2 text-right tabular-nums font-semibold text-navy-900 ${cls}`}>{v}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-700 text-white">
                      <td className="py-2.5 px-2 font-bold rounded-bl-lg">Total Geral</td>
                      <td className="py-2.5 px-2 text-right font-bold tabular-nums text-white rounded-br-lg">
                        {formatCurrency(resultado.totalComMulta)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 bg-navy-50 rounded-lg p-3 text-xs text-navy-500">
                  <strong className="text-navy-700">Acréscimo total:</strong>{' '}
                  {formatCurrency(resultado.totalComMulta - resultado.principalOriginal)}{' '}
                  ({(((resultado.totalComMulta / resultado.principalOriginal) - 1) * 100).toFixed(2).replace('.', ',')}%
                  sobre o valor original)
                </div>
              </SectionCard>

              <TabelaIndices detalhes={resultado.detalhesCorrecao} />
            </div>
          )}

          {!resultado && !loadingIdx && (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-300">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 opacity-40">
                <circle cx="24" cy="24" r="18"/>
                <path d="M24 16v8M24 32h.01" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-medium text-slate-400">Preencha os dados e clique em Calcular</p>
            </div>
          )}
        </div>
      </div>
    </CalculatorShell>
  )
}
