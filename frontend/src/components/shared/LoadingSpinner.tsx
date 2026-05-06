import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullPage?: boolean
}

const SIZES = { sm: 20, md: 32, lg: 48 }

export default function LoadingSpinner({ size = 'md', text, fullPage = false }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 size={SIZES[size]} className="animate-spin text-accent" />
      {text && <p className="text-sm text-text-secondary">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        {content}
      </div>
    )
  }

  return content
}
