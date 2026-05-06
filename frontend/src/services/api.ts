/**
 * Cliente HTTP centralizado.
 * Todos los componentes consumen el API a través de aquí.
 */
import axios from 'axios'
import type {
  AlternativeProvider,
  AuthToken,
  BusinessRule,
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

const http = axios.create({ baseURL: API_BASE })

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

  downloadPdf: async (id: number): Promise<void> => {
    const response = await http.get(`/quotations/${id}/pdf`, {
      responseType: 'blob',
    })
    const contentType: string = response.headers['content-type'] ?? ''
    const url = URL.createObjectURL(response.data)

    if (contentType.includes('text/html')) {
      // Dev Mac: WeasyPrint no disponible → abrir HTML en tab para imprimir (Cmd+P)
      window.open(url, '_blank')
    } else {
      // Producción: descargar PDF real
      const a = document.createElement('a')
      a.href = url
      a.download = `propuesta_${id}.pdf`
      a.click()
    }

    setTimeout(() => URL.revokeObjectURL(url), 5000)
  },
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
