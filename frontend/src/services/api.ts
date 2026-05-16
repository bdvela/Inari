/**
 * Cliente HTTP centralizado.
 * Todos los componentes consumen el API a través de aquí.
 */
import axios from 'axios'
import type {
  AlternativeProvider,
  AuthToken,
  BusinessRule,
  ChangeLogEntry,
  DashboardStats,
  EventTypeOption,
  GenerateQuotationResult,
  ParsedDescription,
  Provider,
  Quotation,
  QuotationPair,
  QuotationSummary,
  ReprocessRequest,
  ServiceOption,
  ServicePackageModel,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export const http = axios.create({ baseURL: API_BASE })

// Inyectar token automáticamente si existe
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirigir a login si el token expira
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    http.post<AuthToken>('/auth/login', { email, password }).then((r) => r.data),

  register: (data: {
    nombre: string
    email: string
    password: string
    telefono?: string
    role?: string
  }) => http.post<AuthToken>('/auth/register', data).then((r) => r.data),

  getProfile: () =>
    http.get<{ id: number; nombre: string | null; email: string; telefono: string | null; role: string }>('/auth/me').then((r) => r.data),

  updateProfile: (data: { nombre?: string; telefono?: string }) =>
    http.patch<{ id: number; nombre: string | null; email: string; telefono: string | null; role: string }>('/auth/me', data).then((r) => r.data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    http.post('/auth/me/change-password', data).then((r) => r.data),

  registerAndQuote: (data: FormData) =>
    http.post<{
      access_token: string
      user_id: number
      role: string
      nombre: string
      quotation_basica_id: number | null
      quotation_premium_id: number | null
      basica_factible: boolean
      premium_factible: boolean
    }>('/auth/register-and-quote', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
}

// Cotizaciones
export const quotationsApi = {
  list: () =>
    http.get<QuotationSummary[]>('/quotations/').then((r) => r.data),

  parseDescription: (description: string) =>
    http.post<ParsedDescription>('/quotations/parse-description', { description }).then((r) => r.data),

  generate: (formData: FormData) =>
    http.post<GenerateQuotationResult>('/quotations/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  getById: (id: number) =>
    http.get<Quotation>(`/quotations/${id}`).then((r) => r.data),

  reprocess: (eventoId: number, data: ReprocessRequest) =>
    http.post<GenerateQuotationResult>(`/quotations/reprocess/${eventoId}`, data).then((r) => r.data),

  getStats: () =>
    http.get<DashboardStats>('/quotations/stats').then((r) => r.data),

  getAlternatives: (quotationId: number, detalleId: number) =>
    http.get<AlternativeProvider[]>(`/quotations/${quotationId}/alternatives/${detalleId}`).then((r) => r.data),

  swap: (quotationId: number, detalleId: number, newProviderId: number) =>
    http.post<Pick<Quotation, 'id' | 'costo_total' | 'quality_score' | 'detalles'>>(
      `/quotations/${quotationId}/swap`,
      { detalle_id: detalleId, new_provider_id: newProviderId },
    ).then((r) => r.data),

  getPair: (quotationId: number) =>
    http.get<QuotationPair>(`/quotations/${quotationId}/pair`).then((r) => r.data),

  getChangelog: (quotationId: number) =>
    http.get<ChangeLogEntry[]>(`/quotations/${quotationId}/changelog`).then((r) => r.data),

  getRequests: (quotationId: number) =>
    http.get<import('../types').QuotationRequest[]>(`/quotations/${quotationId}/requests`).then((r) => r.data),

  createRequest: (quotationId: number, mensaje: string) =>
    http.post(`/quotations/${quotationId}/requests`, { mensaje }).then((r) => r.data),

  updateRequest: (requestId: number, estado: 'en_revision' | 'resuelto') =>
    http.patch(`/quotations/requests/${requestId}`, { estado }).then((r) => r.data),

  downloadPdf: async (id: number, version: 'ejecutivo' | 'cliente' = 'ejecutivo'): Promise<void> => {
    const response = await http.get(`/quotations/${id}/pdf?version=${version}`, {
      responseType: 'blob',
    })
    const contentType: string = response.headers['content-type'] ?? ''
    const url = URL.createObjectURL(response.data)

    if (contentType.includes('text/html')) {
      window.open(url, '_blank')
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = `propuesta_${id}_${version}.pdf`
      a.click()
    }

    setTimeout(() => URL.revokeObjectURL(url), 5000)
  },

  approveAndShare: (id: number, expiresInDays = 30) =>
    http
      .post<{
        quotation_id: number
        client_url: string
        client_token: string
        expires_at: string
        quotation_status: string
      }>(`/quotations/${id}/approve-and-share`, { expires_in_days: expiresInDays })
      .then((r) => r.data),
}

// Reglas de negocio
export const rulesApi = {
  list: () => http.get<BusinessRule[]>('/rules/').then((r) => r.data),

  listServices: () => http.get<ServiceOption[]>('/rules/services/').then((r) => r.data),

  listEventTypes: () => http.get<EventTypeOption[]>('/rules/event-types/').then((r) => r.data),

  create: (data: {
    tipo_evento: string
    servicio_id: number
    es_obligatorio: boolean
    condicion: Record<string, unknown> | null
    descripcion: string | null
  }) => http.post<BusinessRule>('/rules/', data).then((r) => r.data),

  update: (id: number, data: {
    es_obligatorio?: boolean
    condicion?: Record<string, unknown> | null
    descripcion?: string | null
  }) => http.put<BusinessRule>(`/rules/${id}`, data).then((r) => r.data),

  delete: (id: number) => http.delete(`/rules/${id}`),
}

// Paquetes de servicios propios
export const packagesApi = {
  list: () => http.get<ServicePackageModel[]>('/packages/').then((r) => r.data),

  create: (data: Omit<ServicePackageModel, 'id' | 'is_active'>) =>
    http.post<ServicePackageModel>('/packages/', data).then((r) => r.data),

  update: (id: number, data: Partial<ServicePackageModel>) =>
    http.put<ServicePackageModel>(`/packages/${id}`, data).then((r) => r.data),

  delete: (id: number) => http.delete(`/packages/${id}`),
}

// Proveedores
export const providersApi = {
  list: () => http.get<Provider[]>('/providers/').then((r) => r.data),

  create: (data: Omit<Provider, 'id' | 'is_active'>) =>
    http.post<{ id: number; nombre: string }>('/providers/', data).then((r) => r.data),

  update: (id: number, data: Partial<Provider>) =>
    http.put<{ id: number; nombre: string }>(`/providers/${id}`, data).then((r) => r.data),

  delete: (id: number) => http.delete(`/providers/${id}`),
}

// Admin — configuración del sistema
export interface OptimizerConfig {
  quality_weight: number
  updated_at: string | null
  updated_by_email: string | null
}

export interface OptimizationLogSummary {
  id: number
  cotizacion_id: number
  algoritmo_usado: string
  duracion_ms: number
  es_factible: boolean
  created_at: string
}

export interface OptimizationLogDetail extends OptimizationLogSummary {
  input_json: Record<string, unknown>
  output_json: Record<string, unknown>
}

export interface PaginatedLogs {
  items: OptimizationLogSummary[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface LogFilters {
  algoritmo?: string
  fecha_desde?: string
  fecha_hasta?: string
  cotizacion_id?: number
  page?: number
  page_size?: number
}

export const adminApi = {
  getOptimizerConfig: () =>
    http.get<OptimizerConfig>('/admin/optimizer-config').then((r) => r.data),

  updateOptimizerConfig: (quality_weight: number) =>
    http.put<OptimizerConfig>('/admin/optimizer-config', { quality_weight }).then((r) => r.data),

  getLogs: (filters: LogFilters = {}) => {
    const params: Record<string, string | number> = {}
    if (filters.algoritmo)     params.algoritmo     = filters.algoritmo
    if (filters.fecha_desde)   params.fecha_desde   = filters.fecha_desde
    if (filters.fecha_hasta)   params.fecha_hasta   = filters.fecha_hasta
    if (filters.cotizacion_id) params.cotizacion_id = filters.cotizacion_id
    if (filters.page)          params.page          = filters.page
    if (filters.page_size)     params.page_size     = filters.page_size
    return http.get<PaginatedLogs>('/admin/optimization-logs', { params }).then((r) => r.data)
  },

  getLogDetail: (logId: number) =>
    http.get<OptimizationLogDetail>(`/admin/optimization-logs/${logId}`).then((r) => r.data),
}
