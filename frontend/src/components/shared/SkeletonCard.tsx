export function SkeletonLine({ width = 'full' }: { width?: 'full' | '3/4' | '1/2' | '1/3' }) {
  const widths: Record<string, string> = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
  }
  return (
    <div className={`h-4 bg-surface-raised rounded-lg animate-pulse ${widths[width]}`} />
  )
}

export default function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const widths: Array<'full' | '3/4' | '1/2' | '1/3'> = ['1/2', 'full', '3/4', 'full', '1/2']
  return (
    <div className="card space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={widths[i % widths.length]} />
      ))}
    </div>
  )
}
