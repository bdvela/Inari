import { useState, useEffect } from 'react'
import { CalendarDays } from 'lucide-react'

interface DateInputProps {
  value: string          // YYYY-MM-DD (form value)
  onChange: (iso: string) => void
  isAiDetected?: boolean
  min?: string           // YYYY-MM-DD
  placeholder?: string
}

function toDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function toIso(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  return `${match[3]}-${match[2]}-${match[1]}`
}

export default function DateInput({
  value, onChange, isAiDetected, min, placeholder = 'DD/MM/AAAA',
}: DateInputProps) {
  const [display, setDisplay] = useState(() => toDisplay(value))

  useEffect(() => {
    setDisplay(toDisplay(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d/]/g, '')

    // Auto-insert slashes
    const digits = raw.replace(/\//g, '')
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8)
    formatted = formatted.slice(0, 10)

    setDisplay(formatted)

    const iso = toIso(formatted)
    if (iso) {
      // Validate min
      if (min && iso < min) return
      onChange(iso)
    } else if (formatted === '') {
      onChange('')
    }
  }

  return (
    <div className="relative">
      <CalendarDays
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
      />
      <input
        className="input w-full pl-9"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        maxLength={10}
        inputMode="numeric"
        style={isAiDetected ? {
          background: 'rgba(232,87,42,0.04)',
          borderColor: 'rgba(232,87,42,0.20)',
          color: '#C94A1F',
          fontWeight: 500,
        } : {}}
      />
    </div>
  )
}
