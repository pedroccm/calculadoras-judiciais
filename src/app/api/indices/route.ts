import { NextResponse } from 'next/server'
import type { MonthlyIndex, SalarioMinimo } from '@/lib/types'

const BCB_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'
const DATA_HISTORICA  = '01/01/2003' // IPCA-E, INPC, salário mínimo
const DATA_SELIC      = '01/08/2024' // SELIC só é usada a partir de set/2024
const TIMEOUT_MS = 8000

interface BcbItem {
  data: string  // "DD/MM/YYYY"
  valor: string
}

async function fetchSerie(serie: number, dataInicial: string): Promise<BcbItem[]> {
  const url = `${BCB_BASE}.${serie}/dados?formato=json&dataInicial=${dataInicial}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 }, // cache Next.js 1h
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) throw new Error(`BCB série ${serie} status ${res.status}`)
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

function parseMonthly(items: BcbItem[]): MonthlyIndex[] {
  return items.map((item) => {
    const parts = item.data.split('/')
    const month = parseInt(parts[1])
    const year = parseInt(parts[2])
    const value = parseFloat(item.valor)
    return { year, month, value: isNaN(value) ? 0 : value }
  }).filter(i => !isNaN(i.year) && !isNaN(i.month))
}

function parseSalario(items: BcbItem[]): SalarioMinimo[] {
  return items.map((item) => {
    const parts = item.data.split('/')
    const month = parseInt(parts[1])
    const year = parseInt(parts[2])
    const value = parseFloat(item.valor)
    return { year, month, value: isNaN(value) ? 0 : value }
  }).filter(i => !isNaN(i.year) && !isNaN(i.month) && i.value > 0)
}

export async function GET() {
  const [resIpcae, resInpc, resSalario, resSelic] = await Promise.allSettled([
    fetchSerie(10764, DATA_HISTORICA), // IPCA-E mensal
    fetchSerie(188,   DATA_HISTORICA), // INPC mensal
    fetchSerie(1619,  DATA_HISTORICA), // Salário mínimo
    fetchSerie(4390,  DATA_SELIC),     // Selic acumulada no mês % a.m. (só precisa de set/2024+)
  ])

  // Retorna o que conseguiu — séries com falha ficam como array vazio
  const ipcae   = resIpcae.status   === 'fulfilled' ? parseMonthly(resIpcae.value)   : []
  const inpc    = resInpc.status    === 'fulfilled' ? parseMonthly(resInpc.value)    : []
  const salario = resSalario.status === 'fulfilled' ? parseSalario(resSalario.value) : []
  const selic   = resSelic.status   === 'fulfilled' ? parseMonthly(resSelic.value)   : []

  const hasError = [resIpcae, resInpc, resSalario, resSelic].some(r => r.status === 'rejected')
  if (hasError) {
    const erros = [resIpcae, resInpc, resSalario, resSelic]
      .map((r, i) => r.status === 'rejected' ? `série ${[10764,188,1619,11][i]}` : null)
      .filter(Boolean)
    console.error('Erro ao buscar índices BCB:', erros.join(', '))
  }

  return NextResponse.json(
    { ipcae, inpc, salarioMinimo: salario, selic },
    {
      headers: {
        // CDN Netlify cacheia por 1h; serve stale por mais 23h enquanto revalida
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=82800',
      },
    }
  )
}
