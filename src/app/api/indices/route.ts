import { NextResponse } from 'next/server'
import type { MonthlyIndex, SalarioMinimo } from '@/lib/types'

const BCB_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'
const DATA_INICIAL = '01/01/2015'

interface BcbItem {
  data: string  // "DD/MM/YYYY"
  valor: string
}

async function fetchSerie(serie: number): Promise<BcbItem[]> {
  const url = `${BCB_BASE}.${serie}/dados?formato=json&dataInicial=${DATA_INICIAL}`
  const res = await fetch(url, {
    next: { revalidate: 86400 }, // cache 24h
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`BCB série ${serie} status ${res.status}`)
  return res.json()
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
  try {
    const [rawIpcae, rawInpc, rawSalario] = await Promise.all([
      fetchSerie(10764), // IPCA-E mensal
      fetchSerie(188),   // INPC mensal
      fetchSerie(1619),  // Salário mínimo
    ])

    return NextResponse.json({
      ipcae: parseMonthly(rawIpcae),
      inpc: parseMonthly(rawInpc),
      salarioMinimo: parseSalario(rawSalario),
    })
  } catch (err) {
    console.error('Erro ao buscar índices BCB:', err)
    return NextResponse.json(
      { error: 'Não foi possível carregar os índices econômicos.' },
      { status: 503 }
    )
  }
}
