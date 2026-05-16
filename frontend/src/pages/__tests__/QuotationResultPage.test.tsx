/**
 * Smoke tests — QuotationResultPage
 *
 * Verifican contratos de UI sin levantar backend:
 * 1. Paquete base visible cuando existe
 * 2. Ambos niveles (básica/premium) visibles cuando hay par
 * 3. Botón "Aprobar y enviar al cliente" solo aparece para staff
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import QuotationResultPage from '../QuotationResultPage'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/api', () => ({
  quotationsApi: {
    getById: vi.fn(),
    getPair: vi.fn(),
    getChangelog: vi.fn(),
    list: vi.fn(),
    getRequests: vi.fn(),
  },
  // used by chatApi.ts import — keep empty
  http: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseDetalle = {
  id: 1, servicio: 'catering', proveedor: 'Catering Pro', proveedor_id: 10,
  servicio_id: 1, costo: 3000, es_obligatorio: true, indice_calidad: 0.85,
}

const baseQuotation = {
  id: 42,
  nivel: 'basico' as const,
  estado: 'completado' as const,
  version: 1,
  costo_total: 3000,
  quality_score: 0.85,
  created_at: '2026-05-01T00:00:00Z',
  evento_id: 7,
  evento_tipo: 'boda' as const,
  evento_fecha: '2027-06-15',
  num_invitados: 100,
  estilo: 'rustico',
  presupuesto_maximo: 10000,
  style_analysis: null,
  package_selected: null,
  image_inferred_services: [],
  imagenes_referencia: [],
  detalles: [baseDetalle],
}

const quotationWithPackage = {
  ...baseQuotation,
  package_selected: {
    id: 1, name: 'Paquete Esencial', cost: 1200, exceeds_max_range: false,
  },
}

const siblingQuotation = {
  id: 43,
  nivel: 'premium' as const,
  estado: 'completado' as const,
  costo_total: 6000,
  quality_score: 0.92,
  version: 1,
  detalles: [{ ...baseDetalle, id: 2, costo: 6000 }],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderPage(quotation: any, role = 'ejecutivo') {
  const { quotationsApi } = await import('../../services/api')
  const { useAuth } = await import('../../context/AuthContext')

  vi.mocked(quotationsApi.getById).mockResolvedValue(quotation as unknown as never)
  vi.mocked(quotationsApi.getPair).mockResolvedValue({
    current: quotation as unknown as never,
    sibling: null,
  })
  vi.mocked(quotationsApi.getChangelog).mockResolvedValue([])
  vi.mocked(quotationsApi.list).mockResolvedValue([])
  vi.mocked(quotationsApi.getRequests).mockResolvedValue([])
  vi.mocked(useAuth).mockReturnValue({
    role,
    isAuthenticated: true,
    userId: 1,
    nombre: 'Test User',
    login: vi.fn(),
    loginWithToken: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  } as never)

  render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[`/quotations/${quotation.id}`]}>
        <Routes>
          <Route path="/quotations/:id" element={<QuotationResultPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuotationResultPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('muestra paquete base cuando existe', async () => {
    await renderPage(quotationWithPackage)

    // La sección de paquete base usa el nombre del paquete
    const el = await screen.findByText(/Paquete Esencial/i)
    expect(el).toBeInTheDocument()
  })

  it('muestra ambos niveles cuando hay cotización gemela', async () => {
    const { quotationsApi } = await import('../../services/api')
    vi.mocked(quotationsApi.getPair).mockResolvedValue({
      current: baseQuotation as unknown as never,
      sibling: siblingQuotation as unknown as never,
    })

    await renderPage(baseQuotation)

    // Ambas etiquetas de nivel presentes en la vista de staff
    const basicaEl = await screen.findAllByText(/básica/i)
    expect(basicaEl.length).toBeGreaterThan(0)
    const premiumEl = await screen.findAllByText(/premium/i)
    expect(premiumEl.length).toBeGreaterThan(0)
  })

  it('botón Aprobar y enviar visible para ejecutivo', async () => {
    await renderPage(baseQuotation, 'ejecutivo')

    const btn = await screen.findByTestId('approve-btn')
    expect(btn).toBeInTheDocument()
  })

  it('botón Aprobar y enviar NO visible para cliente', async () => {
    await renderPage(baseQuotation, 'cliente')

    // El botón no debe aparecer en vista de cliente
    const btn = screen.queryByTestId('approve-btn')
    expect(btn).not.toBeInTheDocument()
  })
})
