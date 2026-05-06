import { X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-bg/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-surface rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4 animate-slide-up border border-border">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-text-primary font-display text-lg">{title}</h3>
          <button
            onClick={onCancel}
            className="text-text-secondary hover:text-text-primary p-1 -mr-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost text-sm">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              danger
                ? 'bg-danger hover:opacity-90 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all active:scale-[0.98]'
                : 'btn-primary text-sm px-5 py-2'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
