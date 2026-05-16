/**
 * Cliente HTTP para endpoints públicos (sin auth).
 * Instancia separada de api.ts — sin interceptor de redirección a /login.
 */
import axios from 'axios'

const PUBLIC_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

const publicHttp = axios.create({ baseURL: PUBLIC_BASE })

// ─── Tipos de respuesta ──────────────────────────────────────────────────────

export interface EventoPublico {
  tipo: string
  fecha: string
  num_invitados: number
  estilo: string | null
}

export interface PaqueteBase {
  nombre: string
  contenido: string
  costo: number
}

export interface ServicioExterno {
  categoria: string
  descripcion: string
  costo: number
  es_obligatorio: boolean
}

export interface CondicionesPago {
  separacion: number
  primer_pago_porcentaje: number
  segundo_pago_porcentaje: number
  tercer_pago_porcentaje: number
}

export interface VersionAnterior {
  id: number
  version: number
  costo_total: number | null
  created_at: string
}

export interface PublicQuotation {
  id: number
  evento: EventoPublico
  paquete_base: PaqueteBase | null
  servicios_externos: ServicioExterno[]
  narrativa: string | null
  costo_total: number | null
  presupuesto_cliente: number | null
  condiciones_pago: CondicionesPago
  versiones_anteriores: VersionAnterior[]
  expires_at: string
}

export interface SolicitudAjuste {
  id: number
  mensaje: string
  estado: 'pendiente' | 'en_revision' | 'resuelto' | string
  created_at: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function fetchPublicQuotation(token: string): Promise<PublicQuotation> {
  const res = await publicHttp.get<PublicQuotation>('/public/quotations/by-token', {
    params: { token },
  })
  return res.data
}

export async function fetchPublicRequests(token: string): Promise<SolicitudAjuste[]> {
  const res = await publicHttp.get<SolicitudAjuste[]>('/public/quotations/by-token/requests', {
    params: { token },
  })
  return res.data
}

export async function createPublicRequest(
  token: string,
  mensaje: string,
): Promise<SolicitudAjuste> {
  const res = await publicHttp.post<SolicitudAjuste>(
    '/public/quotations/by-token/requests',
    { mensaje },
    { params: { token } },
  )
  return res.data
}
