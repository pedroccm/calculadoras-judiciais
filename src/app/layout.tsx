import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import pkg from '../../package.json'

export const metadata: Metadata = {
  title: 'Calculadoras Judiciais',
  description: 'Ferramentas de cálculo judicial para profissionais do direito',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-navy-800 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="white" strokeWidth="1.5">
                  <path d="M10 2L3 6v5c0 4.4 2.9 8.5 7 9.8 4.1-1.3 7-5.4 7-9.8V6l-7-4z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <span className="font-semibold text-navy-900 text-sm">Calculadoras Judiciais</span>
              </div>
            </Link>
            <span className="hidden sm:block text-xs text-slate-400">BCB · IBGE</span>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between text-xs text-slate-400">
            <span>Os resultados têm caráter orientativo. Consulte sempre um profissional habilitado.</span>
            <span className="font-mono shrink-0 ml-4">v{pkg.version}</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
