import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option { value: string; label: string }

interface EventTypeSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  isAiDetected?: boolean
}

export default function EventTypeSelect({ value, onChange, options, isAiDetected = false }: EventTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input w-full flex items-center justify-between text-left"
        style={isAiDetected ? {
          background: 'rgba(232,87,42,0.04)',
          borderColor: 'rgba(232,87,42,0.20)',
          color: '#C94A1F',
          fontWeight: 500,
        } : {}}
      >
        <span>{selected?.label ?? 'Seleccionar'}</span>
        <ChevronDown
          size={14}
          className="text-text-secondary flex-shrink-0 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-black/8 rounded-xl shadow-lg overflow-hidden animate-slide-up">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent-light transition-colors text-left"
            >
              <span className={value === opt.value ? 'font-semibold text-accent' : 'text-text-primary'}>
                {opt.label}
              </span>
              {value === opt.value && <Check size={13} className="text-accent flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
