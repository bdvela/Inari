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
  // Info del evento (disponible desde get_quotation)
  evento_tipo: EventType | null
  evento_fecha: string | null
  num_invitados: number | null
  estilo: string | null
  presupuesto_maximo: number | null
  style_analysis: StyleAnalysisResult | null
  package_selected: PackageSelected | null
  image_inferred_services: string[]
  imagenes_referencia: { url: string; nombre: string }[]
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

export interface PackageSelected {
  id: number
  name: string
  cost: number
  exceeds_max_range: boolean
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
  package_selected: PackageSelected | null
  image_inferred_services: string[]
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
  cliente_nombre: string | null
}

export interface BusinessRule {
  id: number
  tipo_evento: EventType
  servicio_id: number
  servicio_nombre: string
  es_obligatorio: boolean
  condicion: Record<string, unknown> | null
  descripcion: string | null
}

export interface ServiceOption {
  id: number
  nombre: string
  tipo: string
}

export interface EventTypeOption {
  value: string
  label: string
}

export interface ReprocessRequest {
  presupuesto_maximo: number
  incluir_opcionales: boolean
}

export interface ParsedDescription {
  parseable: boolean
  message: string
  event_type: string | null
  guest_count: number | null
  approximate_date: string | null
  max_budget: number | null
  style_hints: string[]
  mandatory_services: string[]
  confidence: number
}

export interface ServicePackageModel {
  id: number
  name: string
  content: string
  cost: number
  min_guests: number
  max_guests: number
  is_active: boolean
}

export interface StyleAnalysisResult {
  dominant_colors: string[]
  aesthetic_style: string
  luxury_level: number
  style_keywords: string[]
  visual_elements: string[]
  suggested_services: string[]
  confidence: number
}

export interface ChangeLogEntry {
  id: number
  accion: string
  usuario_nombre: string
  usuario_rol: string
  valor_anterior: string | null
  valor_nuevo: string | null
  created_at: string
}
