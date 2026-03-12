import Link from 'next/link'

const calculadoras = [
  {
    href: '/cumprimento-simples',
    num: '01',
    titulo: 'Cumprimento de Sentença',
    descricao: 'Atualiza condenação com IPCA-E e juros de mora de 1% a.m.',
    base: 'Art. 509 CPC',
  },
  {
    href: '/cumprimento-multa',
    num: '02',
    titulo: 'Cumprimento + Multa',
    descricao: 'Débito atualizado acrescido de multa de 10% e honorários de 10% pelo inadimplemento.',
    base: 'Art. 523, §1º CPC',
  },
  {
    href: '/pensao',
    num: '03',
    titulo: 'Pensão Alimentícia',
    descricao: 'Débito alimentar com correção por INPC. Suporta % SM, % salário ou valor fixo.',
    base: 'Art. 529 CPC',
  },
  {
    href: '/pagamentos-parciais',
    num: '04',
    titulo: 'Pagamentos Parciais',
    descricao: 'Saldo devedor após depósitos parcelados com imputação de juros e correção.',
    base: 'Art. 354 CC',
  },
  {
    href: '/superendividamento',
    num: '05',
    titulo: 'Superendividamento',
    descricao: 'Plano de pagamento respeitando o mínimo existencial e distribuição proporcional.',
    base: 'Lei 14.181/2021',
  },
  {
    href: '/contrato',
    num: '06',
    titulo: 'Dívida por Contrato',
    descricao: 'Atualização conforme cláusulas contratuais: multa de atraso e taxa de juros.',
    base: 'Art. 395 CC',
  },
]

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-navy-900 mb-1">Calculadoras</h2>
        <p className="text-navy-500 text-sm">Selecione o tipo de cálculo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-navy-200 border border-navy-200 rounded-xl overflow-hidden shadow-sm">
        {calculadoras.map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="bg-white hover:bg-navy-50 transition-colors duration-150 p-6 flex flex-col gap-3 group"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-mono text-navy-300">{calc.num}</span>
              <svg
                viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="w-4 h-4 text-navy-300 group-hover:text-navy-600 transition-colors flex-shrink-0"
              >
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-navy-900 text-sm mb-1 group-hover:text-navy-700 leading-snug">
                {calc.titulo}
              </h3>
              <p className="text-xs text-navy-500 leading-relaxed">{calc.descricao}</p>
            </div>
            <span className="text-xs font-mono text-navy-400 mt-auto">{calc.base}</span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs text-navy-400 text-center">
        Índices via Banco Central do Brasil · IPCA-E · INPC · Salário Mínimo
      </p>
    </div>
  )
}
