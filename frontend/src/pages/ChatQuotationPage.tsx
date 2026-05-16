/**
 * Interfaz de cotización conversacional — reemplaza NewQuotationPage en /quotations/new.
 * Layout 2-col desktop: izquierda chat · derecha panel de parámetros en vivo.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Send,
  Loader2,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Bot,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  chatApi,
  type ChatMessageResponse,
  type ExtractedParams,
} from '../services/chatApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  tipo_evento:   'Tipo de evento',
  num_invitados: 'N° de invitados',
  fecha:         'Fecha del evento',
  presupuesto:   'Presupuesto',
}

const EVENT_LABELS: Record<string, string> = {
  boda:        'Boda',
  corporativo: 'Corporativo',
  cumpleanos:  'Cumpleaños',
  quinceanos:  'Quinceañera',
  conferencia: 'Conferencia',
  otro:        'Evento especial',
}

function formatParamValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return '—'
  if (key === 'tipo_evento') return EVENT_LABELS[String(value)] ?? String(value)
  if (key === 'presupuesto') {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency', currency: 'PEN', maximumFractionDigits: 0,
    }).format(Number(value))
  }
  if (key === 'num_invitados') return `${value} personas`
  return String(value)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-accent text-white'
            : 'bg-bg-deep text-text-cream border border-border-hover'
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-accent text-white rounded-br-sm'
            : 'glass rounded-bl-sm text-text-primary'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-7 h-7 rounded-full bg-bg-deep border border-border-hover flex items-center justify-center shrink-0">
        <Bot size={13} className="text-text-cream" />
      </div>
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-soft"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function ParamsPanel({
  params,
  missingFields,
  isComplete,
  onConfirm,
  confirming,
}: {
  params: ExtractedParams
  missingFields: string[]
  isComplete: boolean
  onConfirm: () => void
  confirming: boolean
}) {
  const allFields = Object.keys(REQUIRED_FIELD_LABELS)

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <p className="text-[10px] font-semibold tracking-widest text-accent uppercase mb-1">
          Parámetros detectados
        </p>
        <h2 className="font-display text-xl font-bold text-text-primary">
          Tu evento en tiempo real
        </h2>
      </div>

      <div className="space-y-3 flex-1">
        {allFields.map((field) => {
          const present = !missingFields.includes(field) && params[field] !== undefined
          return (
            <div
              key={field}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                present ? 'bg-ok/10 border border-ok/20' : 'glass border border-border'
              }`}
            >
              {present ? (
                <CheckCircle2 size={16} className="text-ok mt-0.5 shrink-0" />
              ) : (
                <Circle size={16} className="text-text-muted mt-0.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-muted mb-0.5">
                  {REQUIRED_FIELD_LABELS[field]}
                </p>
                <p
                  className={`text-sm font-medium truncate ${
                    present ? 'text-text-primary' : 'text-text-muted italic'
                  }`}
                >
                  {present
                    ? formatParamValue(field, params[field])
                    : 'Pendiente...'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Style hints (bonus) */}
      {params.style_hints && params.style_hints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-text-muted mb-2">Estilo detectado</p>
          <div className="flex flex-wrap gap-1.5">
            {params.style_hints.map((hint) => (
              <span key={hint} className="badge badge-accent text-xs capitalize">
                {hint}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confirm button */}
      {isComplete && (
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="btn btn-primary w-full mt-5 flex items-center justify-center gap-2"
        >
          {confirming ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Sparkles size={16} />
              Confirmar y generar propuesta
              <ArrowRight size={14} />
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatQuotationPage() {
  const navigate = useNavigate()

  // Chat state
  const [sessionId, setSessionId]     = useState<string | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [isTyping, setIsTyping]       = useState(false)
  const [isLoading, setIsLoading]     = useState(true)

  // Params state
  const [extractedParams, setExtractedParams] = useState<ExtractedParams>({})
  const [missingFields, setMissingFields]     = useState<string[]>(
    Object.keys(REQUIRED_FIELD_LABELS),
  )
  const [isComplete, setIsComplete]   = useState(false)
  const [confirming, setConfirming]   = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Start session on mount
  useEffect(() => {
    chatApi
      .start()
      .then((data) => {
        setSessionId(data.session_id)
        setMessages([
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.assistant_message,
          },
        ])
      })
      .catch(() => {
        toast.error('No se pudo iniciar el asistente. Inténtalo de nuevo.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !sessionId || isTyping) return

    setInput('')
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: text },
    ])
    setIsTyping(true)

    try {
      const res: ChatMessageResponse = await chatApi.sendMessage(sessionId, text)

      setExtractedParams(res.extracted_params)
      setMissingFields(res.missing_fields)
      setIsComplete(res.is_complete)
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: res.assistant_message },
      ])
    } catch (err: unknown) {
      const status = axios.isAxiosError(err) ? err.response?.status : null
      if (status === 410) {
        toast.error('La sesión expiró. Recarga la página para empezar de nuevo.')
      } else if (status === 503) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Estoy teniendo problemas en este momento. Por favor intenta de nuevo en un momento.',
          },
        ])
      } else {
        toast.error('Error al enviar el mensaje.')
      }
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleConfirm = async () => {
    if (!sessionId || confirming) return
    setConfirming(true)
    try {
      const res = await chatApi.confirm(sessionId)
      navigate(`/quotations/${res.quotation_id}`)
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail
        : null
      toast.error(
        typeof detail === 'string'
          ? detail
          : 'No se pudo generar la cotización. Verifica los datos.',
      )
    } finally {
      setConfirming(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 size={28} className="text-accent animate-spin" />
          <p className="text-sm">Iniciando asistente...</p>
        </div>
      </div>
    )
  }

  // ── Main layout ────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      {/* Page header */}
      <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
        <p className="text-[10px] font-semibold tracking-widest text-accent uppercase mb-0.5">
          Nueva cotización
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          Cuéntanos sobre tu evento
        </h1>
      </div>

      {/* 2-column body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ── Left: chat ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-border">

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 border-t border-border px-4 py-3">
            <div className="flex items-end gap-2.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Describe tu evento... (Enter para enviar)"
                disabled={isTyping || isComplete}
                className="input flex-1 resize-none min-h-[40px] max-h-[120px] py-2 text-sm leading-relaxed disabled:opacity-50"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = `${el.scrollHeight}px`
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isComplete}
                className="btn btn-primary h-10 w-10 flex items-center justify-center shrink-0 disabled:opacity-40"
                aria-label="Enviar mensaje"
              >
                {isTyping ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            {isComplete && (
              <p className="text-xs text-ok mt-2 text-center">
                ¡Todos los datos listos! Confirma en el panel para generar tu cotización.
              </p>
            )}
          </div>
        </div>

        {/* ── Right: params panel ─────────────────────────────────────── */}
        <div className="w-72 xl:w-80 shrink-0 flex flex-col min-h-0 overflow-y-auto px-5 py-5">
          <ParamsPanel
            params={extractedParams}
            missingFields={missingFields}
            isComplete={isComplete}
            onConfirm={handleConfirm}
            confirming={confirming}
          />
        </div>

      </div>
    </div>
  )
}
