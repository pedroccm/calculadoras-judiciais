'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  titulo: string
  subtitulo: string
  baseLegal: string
  children: ReactNode
}

export function CalculatorShell({ titulo, subtitulo, baseLegal, children }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-7">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs mb-4 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
            <path d="M13 8H3M7 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Calculadoras
        </Link>
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-navy-900">{titulo}</h1>
          <span className="text-xs font-mono text-slate-400">{baseLegal}</span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{subtitulo}</p>
      </div>

      {children}
    </div>
  )
}

export function SectionCard({
  titulo,
  children,
  className = '',
}: {
  titulo?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 overflow-hidden ${className}`}>
      {titulo && (
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{titulo}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  className = '',
  ...rest
}: {
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  prefix?: string
  suffix?: string
  className?: string
  min?: string
  max?: string
  step?: string
}) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-slate-400 text-sm select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full rounded border border-slate-200 bg-white text-slate-900
          px-3 py-2 text-sm
          focus:outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-100
          placeholder:text-slate-300
          transition-colors
          ${prefix ? 'pl-8' : ''}
          ${suffix ? 'pr-12' : ''}
          ${className}
        `}
        {...rest}
      />
      {suffix && (
        <span className="absolute right-3 text-slate-400 text-xs select-none pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  )
}

export function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-100 transition-colors cursor-pointer"
    >
      {children}
    </select>
  )
}

// ─── Currency Input com máscara automática ────────────────────────────────────

function formatAsCurrency(digits: string): string {
  const padded = digits.padStart(3, '0')
  const cents = padded.slice(-2)
  const intPart = padded.slice(0, -2).replace(/^0+/, '') || '0'
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${intFormatted},${cents}`
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
}: {
  value: string
  onChange: (formatted: string) => void
  placeholder?: string
}) {
  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    onChange(digits ? formatAsCurrency(digits) : '')
  }

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-slate-400 text-sm select-none pointer-events-none">R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-slate-200 bg-white text-slate-900 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-100 placeholder:text-slate-300 transition-colors tabular-nums"
      />
    </div>
  )
}

export function BtnCalc({
  onClick,
  loading = false,
  label = 'Calcular',
}: {
  onClick: () => void
  loading?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-navy-800 hover:bg-navy-900 disabled:bg-slate-300 text-white text-sm font-medium py-2.5 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
    >
      {loading ? (
        <>
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Carregando índices...
        </>
      ) : label}
    </button>
  )
}

export function ResultBox({
  label,
  value,
  destaque = false,
}: {
  label: string
  value: string
  destaque?: boolean
}) {
  if (destaque) {
    return (
      <div className="rounded border border-navy-800 bg-navy-800 p-4">
        <p className="text-xs text-navy-300 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
      </div>
    )
  }
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-base font-semibold text-slate-800 tabular-nums">{value}</p>
    </div>
  )
}

export function AlertError({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
      {msg}
    </div>
  )
}

export function LoadingIndices() {
  return (
    <div className="border border-slate-200 rounded p-3 flex items-center gap-2 text-slate-500 text-xs">
      <svg className="animate-spin w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      Carregando índices (BCB)...
    </div>
  )
}

export function EmptyResult() {
  return (
    <div className="border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-12 text-center">
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" className="w-10 h-10 mb-3 text-slate-200">
        <rect x="6" y="4" width="28" height="32" rx="3"/>
        <path d="M12 14h16M12 20h16M12 26h8" strokeLinecap="round"/>
      </svg>
      <p className="text-xs text-slate-400">Preencha os dados e clique em Calcular</p>
    </div>
  )
}
