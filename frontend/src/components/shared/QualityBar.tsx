interface QualityBarProps {
  value: number  // 0 to 1
  showLabel?: boolean
}

export default function QualityBar({ value, showLabel = true }: QualityBarProps) {
  const pct = Math.round(value * 100)
  const fill = pct >= 80 ? 'bg-ok' : pct >= 50 ? 'bg-accent' : 'bg-amber'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-black/6 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-xs text-text-secondary tabular-nums w-8 text-right">{pct}%</span>
      )}
    </div>
  )
}
