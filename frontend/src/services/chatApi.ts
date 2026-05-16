/**
 * API del asistente conversacional de cotización.
 * Usa la instancia http autenticada de api.ts.
 */
import { http } from './api'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ChatStartResponse {
  session_id: string
  assistant_message: string
}

export interface ChatMessageResponse {
  assistant_message: string
  extracted_params: ExtractedParams
  missing_fields: string[]
  is_complete: boolean
}

export interface ExtractedParams {
  tipo_evento?: string
  num_invitados?: number
  fecha?: string
  presupuesto?: number
  style_hints?: string[]
  [key: string]: unknown
}

export interface ChatConfirmResponse {
  evento_id: number
  quotation_id: number
  quotation_premium_id: number
  redirect_to: string
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const chatApi = {
  start: () =>
    http
      .post<ChatStartResponse>('/chat/start')
      .then((r) => r.data),

  sendMessage: (sessionId: string, message: string) =>
    http
      .post<ChatMessageResponse>(`/chat/${sessionId}/message`, { message })
      .then((r) => r.data),

  confirm: (sessionId: string, params?: Record<string, unknown>) =>
    http
      .post<ChatConfirmResponse>(`/chat/${sessionId}/confirm`, { params: params ?? null })
      .then((r) => r.data),
}
