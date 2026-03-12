'use client'

import { useState, useEffect } from 'react'
import {
  CalculatorShell, SectionCard, Field, Input, BtnCalc,
  ResultBox, AlertError, LoadingIndices,
} from '@/components/calculator-shell'
import { calcPagamentosParciais } from '@/lib/calculations'
import { formatCurrency, formatFactor, currentMonthInput, parseBrNumber } from '@/lib/format'
import type { Indices, PagamentosParciaisResult, Pagamento, PagamentoParcialLinha } from '@/lib/types'

let nextId = 1

function gerarId() {
  return String(nextId++)
}

export default function PagamentosParciaisPage() {
  const [indices, setIndices] = useState<Indices | null>(null)
  const [loadingIdx, setLoadingIdx] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [valorCondenacao, setValorCondenacao] = useState('')
  const [dataCondena, setDataCondena] = useState('')
  const [dataAtual, setDataAtual] = useState(currentMonthInput)
  const [taxaJuros, setTaxaJuros] = useState('1')

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([
    { id: gerarId(), data: '', valor: 0 },
  ])
  const [pagamentosInput, setPagamentosInput] = useState<{ id: string; data: string; valor: string }[]>([
    { id: '1', data: '', valor: '' },
  ])

  const [resultado, setResultado] = useState<PagamentosParciaisResult | null>(null)

  useEffect(() => {
    fetch('/api/indices')
      .then((r) => r.json())
      .then((d) => { setIndices(d); setLoadingIdx(false) })
      .catch(() => { setError('Não foi possível carregar os índices.'); setLoadingIdx(false) })
  }, [])

  function addPagamento() {
    const id = gerarId()
    setPagamentosInput((prev) => [...prev, { id, data: '', valor: '' }])
  }

  function removePagamento(id: string) {
    setPagamentosInput((prev) => prev.filter((p) => p.id !== id))
  }

  function updatePagamento(id: string, field: 'data' | 'valor', value: string) {
    setPagamentosInput((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  function calcular() {
    if (!indices) return
    const v = parseBrNumber(valorCondenacao)
    if (!v || !dataCondena || !dataAtual) {
      setError('Preencha valor da condenação, data da condenação e data atual.')
      return
    }

    const [fy, fm] = dataCondena.split('-').map(Number)
    const [ty, tm] = dataAtual.split('-').map(Number)
    if (fy * 12 + fm >= ty * 12 + tm) {
      setError('A data atual deve ser posterior à data da condenação.')
      return
    }

    const pags: Pagamento[] = pagamentosInput
      .filter((p) => p.data && p.valor)
      .map((p) => ({ id: p.id, data: p.data, valor: parseBrNumber(p.valor) }))

    setError(null)
    const r = calcPagamentosParciais(
      v,
      { year: fy, month: fm },
      { year: ty, month: tm },
      pags,
      indices.ipcae,
      parseFloat(taxaJuros) || 1
    )
    setResultado(r)
  }

  return (
    <CalculatorShell
      titulo="Pagamentos Parciais"
      subtitulo="Com abatimentos"
      baseLegal="Art. 354 CC · Art. 509 CPC"
      
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Formulário ─────────────────────────────────────── */}
        <div className="space-y-5">
          <SectionCard titulo="Dados da Condenação">
            <div className="space-y-4">
              {loadingIdx && <LoadingIndices />}
              {error && <AlertError msg={error} />}

              <Field label="Valor da Condenação">
                <Input type="text" value={valorCondenacao} onChange={setValorCondenacao} prefix="R$" placeholder="100.000,00" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Data da Condenação">
                  <Input type="month" value={dataCondena} onChange={setDataCondena} max={currentMonthInput()} />
                </Field>
                <Field label="Data Atual">
                  <Input type="month" value={dataAtual} onChange={setDataAtual} />
                </Field>
              </div>

              <Field label="Taxa de Juros de Mora" hint="1% a.m. padrão">
                <Input type="number" value={taxaJuros} onChange={setTaxaJuros} suffix="% a.m." step="0.1" min="0" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard titulo="Pagamentos Realizados">
            <div className="space-y-3">
              <p className="text-xs text-navy-500">
                Cada pagamento abate primeiro os juros, depois o principal (art. 354 CC).
              </p>

              {pagamentosInput.map((p, i) => (
                <div key={p.id} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-1.5">
                      #{i + 1} Data
                    </label>
                    <Input
                      type="month"
                      value={p.data}
                      onChange={(v) => updatePagamento(p.id, 'data', v)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-1.5">
                      Valor
                    </label>
                    <Input
                      type="text"
                      value={p.valor}
                      onChange={(v) => updatePagamento(p.id, 'valor', v)}
                      prefix="R$"
                      placeholder="0,00"
                    />
                  </div>
                  {pagamentosInput.length > 1 && (
                    <button
                      onClick={() => removePagamento(p.id)}
                      className="mb-0.5 p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Remover"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addPagamento}
                className="w-full border border-dashed border-navy-300 text-navy-500 hover:border-navy-500 hover:text-navy-700 rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
                </svg>
                Adicionar Pagamento
              </button>
            </div>
          </SectionCard>

          <BtnCalc onClick={calcular} loading={loadingIdx} label="Calcular Saldo Devedor" />
        </div>

        {/* ─── Resultado ──────────────────────────────────────── */}
        <div className="space-y-5">
          {resultado && (
            <div className="animate-fade-in-up space-y-4">
              <SectionCard titulo="Resumo">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ResultBox label="Total Pago" value={formatCurrency(resultado.totalPago)} />
                    <ResultBox label="Total Juros" value={formatCurrency(resultado.totalJuros)} />
                  </div>
                  <ResultBox
                    label="Saldo Final em Aberto"
                    value={resultado.saldoFinal <= 0 ? 'Quitado' : formatCurrency(resultado.saldoFinal)}
                    destaque={resultado.saldoFinal > 0}
                  />
                </div>
              </SectionCard>

              <SectionCard titulo="Evolução Mensal">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="bg-navy-50 text-navy-600">
                        <th className="py-2 px-2 text-left font-semibold">Mês/Ano</th>
                        <th className="py-2 px-2 text-right font-semibold">Saldo Início</th>
                        <th className="py-2 px-2 text-right font-semibold">Juros</th>
                        <th className="py-2 px-2 text-right font-semibold">Pagamento</th>
                        <th className="py-2 px-2 text-right font-semibold">Saldo Fim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50">
                      {resultado.linhas.map((l: PagamentoParcialLinha) => (
                        <tr
                          key={l.mesAno}
                          className={`hover:bg-navy-50/50 ${l.pagamento > 0 ? 'bg-slate-50/40' : ''}`}
                        >
                          <td className="py-1.5 px-2 font-medium text-navy-700">{l.mesAno}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums text-navy-600">
                            {formatCurrency(l.saldoInicio)}
                          </td>
                          <td className="py-1.5 px-2 text-right tabular-nums text-navy-500">
                            {formatCurrency(l.juros)}
                          </td>
                          <td className={`py-1.5 px-2 text-right tabular-nums font-semibold ${l.pagamento > 0 ? 'text-navy-700' : 'text-navy-300'}`}>
                            {l.pagamento > 0 ? formatCurrency(l.pagamento) : '—'}
                          </td>
                          <td className={`py-1.5 px-2 text-right tabular-nums font-bold ${l.saldoFim <= 0 ? 'text-navy-700' : 'text-navy-900'}`}>
                            {l.saldoFim <= 0 ? 'Quitado' : formatCurrency(l.saldoFim)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {!resultado && !loadingIdx && (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 text-slate-300 opacity-60">
                <rect x="4" y="10" width="40" height="28" rx="4"/>
                <path d="M4 20h40M12 30h4M28 30h8" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-medium text-navy-600">Adicione os pagamentos realizados</p>
              <p className="text-xs mt-1 text-slate-500">e clique em Calcular</p>
            </div>
          )}
        </div>
      </div>
    </CalculatorShell>
  )
}
