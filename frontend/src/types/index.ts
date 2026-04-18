// Tipos de dominio compartidos entre componentes

export type UserRole = 'cliente' | 'ejecutivo' | 'admin'

export type EventType =
  | 'boda'
  | 'corporativo'
  | 'cumpleanos'
  | 'quinceanos'
  | 'conferencia'
  | 'otro'

export type QuotationLevel = 'basico' | 'premium'
export type QuotationStatus = 'procesando' | 'completado' | 'error'

export interface User {
  id: number
  nombre: string
  email: string
  role: UserRole
}

export interface AuthToken {
  access_token: string
  token_type: string
  user_id: number
  role: UserRole
}

export interface QuotationDetail {
  id: number
  servicio: string
  proveedor: string
  proveedor_id: number
  servicio_id: number | null
  costo: number
  es_obligatorio: boolean
  indice_calidad: number
}

export interface AlternativeProvider {
  id: number
  nombre: string
  costo: number
  indice_calidad: number
  delta_costo: number
  delta_quality: number
}

export interface Quotation {
  id: number
  nivel: QuotationLevel
  estado: QuotationStatus
  version: number
  costo_total: number | null
  quality_score: number | null
  created_at: string
  evento_id: number
  detalles: QuotationDetail[]
}

export interface QuotationPairItem {
  id: number
  nivel: QuotationLevel
  estado: QuotationStatus
  costo_total: number | null
  quality_score: number | null
  version: number
  detalles: QuotationDetail[]
}

export interface QuotationPair {
  current: QuotationPairItem
  sibling: QuotationPairItem | null
}

export interface DashboardStats {
  total: number
  completadas: number
  procesando: number
  con_error: number
  quality_score_promedio: number | null
  costo_promedio: number | null
}

export interface GenerateQuotationResult {
  evento_id: number
  quotation_basica_id: number
  quotation_premium_id: number
  basica_factible: boolean
  premium_factible: boolean
  basica_costo: number | null
  premium_costo: number | null
  version: number
}

export interface Provider {
  id: number
  nombre: string
  servicio_id: number
  costo_base: number
  indice_calidad: number
  tipos_evento_compatibles: string[]
  is_active: boolean
}

export interface QuotationSummary {
  id: number
  nivel: QuotationLevel
  estado: QuotationStatus
  version: number
  costo_total: number | null
  quality_score: number | null
  created_at: string
  evento_id: number
  evento_tipo: EventType
  evento_nombre: string
}

export interface ReprocessRequest {
  presupuesto_maximo: number
  incluir_opcionales: boolean
}
