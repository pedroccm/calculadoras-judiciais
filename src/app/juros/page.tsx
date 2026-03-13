'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPercent, currentYearMonth } from '@/lib/format'
import type { Indices } from '@/lib/types'

const PERIODOS = [
  {
    periodo: 'Até set/2003',
    taxa: '0,5% a.m.',
    taxaAa: '6% a.a.',
    base: 'CC/1916 · Início vigência CC/2002',
    cor: 'bg-slate-100 text-slate-700',
  },
  {
    periodo: 'Out/2003 – ago/2024',
    taxa: '1% a.m.',
    taxaAa: '12% a.a.',
    base: 'Art. 406 CC · Tabela Prática TJSP',
    cor: 'bg-blue-100 text-blue-700',
  },
  {
    periodo: 'Set/2024 em diante',
    taxa: 'SELIC – IPCA-E',
    taxaAa: 'variável / mês',
    base: 'STJ Tema 1.243 · STF Tema 1.285 (26/08/2024)',
    cor: 'bg-amber-100 text-amber-700',
  },
]

function mesLabel(year: number, month: number) {
  return `${String(month).padStart(2, '0')}/${year}`
}

export default function JurosPage() {
  const [indices, setIndices] = useState<Indices | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/indices')
      .then(r => r.json())
      .then(d => { setIndices(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const current = currentYearMonth()

  // Últimos 18 meses de SELIC a partir de set/2024
  const selicRecente = (indices?.selic ?? [])
    .filter(s => s.year > 2024 || (s.year === 2024 && s.month >= 9))
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-18)

  // Taxa do mês atual
  const selicAtual = (indices?.selic ?? []).find(s => s.year === current.year && s.month === current.month)
  const ipcaeAtual = (indices?.ipcae ?? []).find(s => s.year === current.year && s.month === current.month)
  const taxaRealAtual = selicAtual != null && ipcaeAtual != null
    ? Math.max(0, selicAtual.value - ipcaeAtual.value)
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div>
        <Link href="/" className="text-xs text-navy-400 hover:text-navy-600 mb-3 inline-flex items-center gap-1">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Calculadoras
        </Link>
        <h1 className="text-2xl font-semibold text-navy-900">Juros de Mora — Referência</h1>
        <p className="text-navy-500 text-sm mt-1">
          Regras aplicadas automaticamente nos cálculos de Cumprimento de Sentença.
        </p>
      </div>

      {/* Períodos legais */}
      <section>
        <h2 className="text-sm font-semibold text-navy-700 uppercase tracking-wider mb-3">
          Três Períodos Legais
        </h2>
        <div className="rounded-xl border border-navy-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800 text-white">
                <th className="py-3 px-4 text-left font-semibold">Período</th>
                <th className="py-3 px-4 text-center font-semibold">Taxa Mensal</th>
                <th className="py-3 px-4 text-center font-semibold">Equivalente Anual</th>
                <th className="py-3 px-4 text-left font-semibold hidden sm:table-cell">Base Legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {/* Períodos fixos */}
              {PERIODOS.slice(0, 2).map((p) => (
                <tr key={p.periodo} className="hover:bg-navy-50/50">
                  <td className="py-3 px-4 font-medium text-navy-800">{p.periodo}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${p.cor}`}>
                      {p.taxa}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-navy-600 font-mono text-xs">{p.taxaAa}</td>
                  <td className="py-3 px-4 text-xs text-navy-500 hidden sm:table-cell">{p.base}</td>
                </tr>
              ))}

              {/* Período SELIC real — com valores ao vivo */}
              <tr className="bg-amber-50/60 hover:bg-amber-50">
                <td className="py-3 px-4 font-medium text-navy-800">
                  {PERIODOS[2].periodo}
                </td>
                <td className="py-3 px-4 text-center">
                  {loading ? (
                    <span className="text-xs text-navy-400">carregando…</span>
                  ) : taxaRealAtual != null ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-700">
                        {formatPercent(taxaRealAtual)} a.m.
                      </span>
                      <span className="text-xs text-navy-400">
                        SELIC {formatPercent(selicAtual!.value)} − IPCA-E {formatPercent(ipcaeAtual!.value)}
                      </span>
                    </div>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${PERIODOS[2].cor}`}>
                      {PERIODOS[2].taxa}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-navy-500 font-mono text-xs">
                  {loading ? '—' : taxaRealAtual != null
                    ? `≈ ${formatPercent(taxaRealAtual * 12)} a.a.*`
                    : 'variável'}
                </td>
                <td className="py-3 px-4 text-xs text-navy-500 hidden sm:table-cell">
                  {PERIODOS[2].base}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-navy-400 mt-2">
          * Equivalente anual aproximado (taxa mensal × 12). A taxa real (SELIC − IPCA-E) nunca é negativa — quando a diferença for menor que zero, aplica-se 0%.
        </p>
      </section>

      {loading && (
        <div className="text-center py-10 text-navy-400 text-sm">
          Carregando dados do Banco Central…
        </div>
      )}

      {/* Tabela histórica SELIC real */}
      {selicRecente.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-navy-700 uppercase tracking-wider mb-3">
            Histórico — Juros Reais (set/2024 em diante)
          </h2>
          <div className="rounded-xl border border-navy-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-100 text-navy-700">
                    <th className="py-2.5 px-4 text-left font-semibold">Mês/Ano</th>
                    <th className="py-2.5 px-4 text-right font-semibold">SELIC</th>
                    <th className="py-2.5 px-4 text-right font-semibold">IPCA-E</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Juros Reais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {selicRecente.map((s) => {
                    const ipcae = indices?.ipcae.find(i => i.year === s.year && i.month === s.month)
                    const real = ipcae != null ? Math.max(0, s.value - ipcae.value) : null
                    const isCurrent = s.year === current.year && s.month === current.month
                    return (
                      <tr
                        key={`${s.year}-${s.month}`}
                        className={isCurrent ? 'bg-amber-50 font-semibold' : 'hover:bg-navy-50/50'}
                      >
                        <td className="py-2 px-4 tabular-nums font-mono text-navy-800">
                          {mesLabel(s.year, s.month)}
                          {isCurrent && (
                            <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                              atual
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums text-navy-700">
                          {formatPercent(s.value)}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums text-navy-500">
                          {ipcae != null ? formatPercent(ipcae.value) : '—'}
                        </td>
                        <td className={`py-2 px-4 text-right tabular-nums font-semibold ${real != null && real > 0 ? 'text-navy-900' : 'text-navy-400'}`}>
                          {real != null ? formatPercent(real) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-navy-400 mt-2">
            Fonte: Banco Central do Brasil — Séries Temporais. Atualizado automaticamente a cada 24h.
          </p>
        </section>
      )}

      {/* Como funciona o cálculo */}
      <section className="bg-navy-50 border border-navy-200 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-navy-700 uppercase tracking-wider">
          Como o Cálculo é Feito
        </h2>
        <ol className="text-sm text-navy-700 space-y-2 list-decimal list-inside leading-relaxed">
          <li>
            <strong>Correção monetária</strong> pelo IPCA-E acumulado do mês da condenação até hoje
            (Tabela Prática do TJSP).
          </li>
          <li>
            <strong>Juros de mora simples</strong> incidem sobre o principal corrigido, somando as taxas
            mensais de cada período: 0,5%/mês (antes out/2003), 1%/mês (out/2003–ago/2024) e SELIC real
            (set/2024 em diante).
          </li>
          <li>
            <strong>Fórmula:</strong>{' '}
            <code className="bg-white border border-navy-200 rounded px-1.5 py-0.5 text-xs font-mono">
              Total = Principal × Fator_IPCA-E × (1 + Σ taxas mensais / 100)
            </code>
          </li>
        </ol>
        <p className="text-xs text-navy-500 pt-1">
          As taxas SELIC e IPCA-E são buscadas diretamente do Banco Central e não precisam ser
          atualizadas manualmente — a tabela se atualiza sozinha todo mês.
        </p>
      </section>

    </div>
  )
}
