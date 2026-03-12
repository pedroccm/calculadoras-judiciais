'use client'

import { useState } from 'react'
import {
  CalculatorShell, SectionCard, Field, Input, CurrencyInput, Select, BtnCalc,
  ResultBox, AlertError, MonthYearPicker,
} from '@/components/calculator-shell'
import { calcDividaContrato } from '@/lib/calculations'
import { formatCurrency, formatFactor, currentMonthInput, parseBrNumber } from '@/lib/format'
import type { DividaContratoResult } from '@/lib/types'

export default function ContratoPage() {
  const [error, setError] = useState<string | null>(null)

  const [valorPrincipal, setValorPrincipal] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [dataReferencia, setDataReferencia] = useState(currentMonthInput)
  const [taxaMensal, setTaxaMensal] = useState('1')
  const [multa, setMulta] = useState('2')
  const [tipoJuros, setTipoJuros] = useState<'simples' | 'composto'>('simples')

  const [resultado, setResultado] = useState<DividaContratoResult | null>(null)

  function calcular() {
    const v = parseBrNumber(valorPrincipal)
    if (!v || !dataVencimento || !dataReferencia) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    const [fy, fm] = dataVencimento.split('-').map(Number)
    const [ty, tm] = dataReferencia.split('-').map(Number)
    if (fy * 12 + fm >= ty * 12 + tm) {
      setError('A data de referência deve ser posterior ao vencimento.')
      return
    }

    setError(null)
    const r = calcDividaContrato(
      v,
      { year: fy, month: fm },
      { year: ty, month: tm },
      parseFloat(taxaMensal.replace(',', '.')) || 1,
      parseFloat(multa.replace(',', '.')) || 2,
      tipoJuros
    )
    setResultado(r)
  }

  return (
    <CalculatorShell
      titulo="Dívida por Contrato"
      subtitulo="Taxas contratuais"
      baseLegal="Art. 395 CC · Art. 52 CDC"
      
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Formulário ─────────────────────────────────────── */}
        <SectionCard titulo="Dados do Contrato">
          <div className="space-y-4">
            {error && <AlertError msg={error} />}

            <Field label="Valor Principal" hint="Valor original da dívida / prestação em atraso">
              <CurrencyInput value={valorPrincipal} onChange={setValorPrincipal} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Data de Vencimento" hint="Quando a dívida venceu">
                <MonthYearPicker value={dataVencimento} onChange={setDataVencimento} max={currentMonthInput()} />
              </Field>
              <Field label="Data de Referência" hint="Hoje ou data de cálculo">
                <MonthYearPicker value={dataReferencia} onChange={setDataReferencia} />
              </Field>
            </div>

            <div className="border-t border-navy-100 pt-4">
              <p className="text-xs font-semibold text-navy-600 uppercase tracking-wider mb-3">
                Cláusulas Contratuais
              </p>

              <div className="space-y-3">
                <Field
                  label="Multa de Atraso"
                  hint="Incidente uma única vez sobre o principal. Art. 52 CDC limita a 2% para consumidor."
                >
                  <Input type="text" value={multa} onChange={setMulta} suffix="%" placeholder="2" />
                </Field>

                <Field
                  label="Taxa de Juros"
                  hint="Juros remuneratórios/moratórios mensais conforme contrato"
                >
                  <Input type="text" value={taxaMensal} onChange={setTaxaMensal} suffix="% a.m." placeholder="1" />
                </Field>

                <Field
                  label="Regime de Juros"
                  hint="Simples: juro sobre principal. Composto: juro sobre juro (capitalização)."
                >
                  <Select value={tipoJuros} onChange={(v) => setTipoJuros(v as 'simples' | 'composto')}>
                    <option value="simples">Juros Simples</option>
                    <option value="composto">Juros Compostos (capitalização)</option>
                  </Select>
                </Field>
              </div>
            </div>

            <BtnCalc onClick={calcular} />

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-navy-800 leading-relaxed">
              <p className="font-semibold mb-1">Exemplos comuns:</p>
              <ul className="space-y-0.5 text-navy-700">
                <li>• <strong>Consumidor (CDC):</strong> 2% multa + juros contratuais simples</li>
                <li>• <strong>Civil comum:</strong> 10% multa + 1% a.m. simples (art. 406 CC)</li>
                <li>• <strong>Financiamento:</strong> multa + taxa mensal composta</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* ─── Resultado ──────────────────────────────────────── */}
        <div className="space-y-5">
          {resultado && (
            <div className="animate-fade-in-up space-y-4">
              <SectionCard titulo="Composição da Dívida">
                <div className="space-y-3">
                  <ResultBox label="Valor Principal" value={formatCurrency(resultado.principal)} />

                  <div className="grid grid-cols-2 gap-3">
                    <ResultBox
                      label={`Multa de Atraso (${parseFloat(multa).toFixed(0)}%)`}
                      value={`+ ${formatCurrency(resultado.multa)}`}
                     
                    />
                    <ResultBox
                      label={`Juros ${parseFloat(taxaMensal).toFixed(2).replace('.', ',')}% × ${resultado.meses} m.`}
                      value={`+ ${formatCurrency(resultado.jurosAcumulados)}`}
                     
                    />
                  </div>

                  <ResultBox
                    label="Total Atualizado"
                    value={formatCurrency(resultado.totalAtualizado)}
                    destaque
                   
                  />
                </div>
              </SectionCard>

              <SectionCard titulo="Memória de Cálculo">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-navy-100">
                    {[
                      ['Valor principal', formatCurrency(resultado.principal)],
                      [`Multa ${parseFloat(multa).toFixed(2).replace('.', ',')}%`, formatCurrency(resultado.multa)],
                      [
                        `Juros ${tipoJuros === 'composto' ? 'compostos' : 'simples'} ${resultado.meses} meses`,
                        formatCurrency(resultado.jurosAcumulados)
                      ],
                      ['Fator de juros', formatFactor(resultado.fatorJuros)],
                    ].map(([k, v]) => (
                      <tr key={k} className="hover:bg-navy-50/50">
                        <td className="py-2 text-navy-600">{k}</td>
                        <td className="py-2 text-right tabular-nums font-semibold text-navy-900">{v}</td>
                      </tr>
                    ))}
                    <tr className="bg-navy-700 text-white">
                      <td className="py-2.5 px-2 font-bold rounded-bl-lg">Total Atualizado</td>
                      <td className="py-2.5 px-2 text-right font-bold tabular-nums rounded-br-lg">
                        {formatCurrency(resultado.totalAtualizado)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-navy-50 rounded-lg p-3">
                    <p className="text-navy-500 mb-1">Período de atraso</p>
                    <p className="font-bold text-navy-900">{resultado.meses} meses</p>
                  </div>
                  <div className="bg-navy-50 rounded-lg p-3">
                    <p className="text-navy-500 mb-1">Acréscimo total</p>
                    <p className="font-bold text-navy-600">
                      + {(((resultado.totalAtualizado / resultado.principal) - 1) * 100).toFixed(2).replace('.', ',')}%
                    </p>
                  </div>
                </div>
              </SectionCard>

              {/* Projeção mensal */}
              <SectionCard titulo="Projeção por Mês (resumo)">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-navy-50 text-navy-600">
                        <th className="py-2 px-2 text-left font-semibold">Meses</th>
                        <th className="py-2 px-2 text-right font-semibold">Juros Acum.</th>
                        <th className="py-2 px-2 text-right font-semibold">Total c/ Multa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50">
                      {[1, 3, 6, 12, resultado.meses].filter((v, i, a) => a.indexOf(v) === i && v <= resultado.meses).map((m) => {
                        const taxa = parseFloat(taxaMensal.replace(',', '.')) / 100
                        const juros = tipoJuros === 'composto'
                          ? resultado.principal * (Math.pow(1 + taxa, m) - 1)
                          : resultado.principal * taxa * m
                        const total = resultado.principal + juros + resultado.multa
                        return (
                          <tr key={m} className={`hover:bg-navy-50/50 ${m === resultado.meses ? 'bg-slate-50/50 font-semibold' : ''}`}>
                            <td className="py-1.5 px-2 text-navy-700">{m} {m === 1 ? 'mês' : 'meses'}</td>
                            <td className="py-1.5 px-2 text-right tabular-nums text-navy-600">
                              {formatCurrency(juros)}
                            </td>
                            <td className="py-1.5 px-2 text-right tabular-nums font-bold text-navy-900">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {!resultado && (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 text-slate-300 opacity-60">
                <path d="M28 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V16L28 4z"/>
                <polyline points="28 4 28 16 40 16"/>
                <line x1="16" y1="24" x2="32" y2="24" strokeLinecap="round"/>
                <line x1="16" y1="32" x2="32" y2="32" strokeLinecap="round"/>
                <line x1="16" y1="16" x2="20" y2="16" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-medium text-navy-600">Informe as cláusulas do contrato</p>
              <p className="text-xs mt-1 text-slate-500">e clique em Calcular</p>
            </div>
          )}
        </div>
      </div>
    </CalculatorShell>
  )
}
