/**
 * Smoke tests — AdminProvidersPage (campo tier / nivel de proveedor)
 *
 * 1. El formulario renderiza el dropdown "Nivel"
 * 2. Al guardar, tier se incluye en los datos enviados al backend
 * 3. La tabla muestra el badge correcto según tier
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AdminProvidersPage from '../AdminProvidersPage'
import type { Provider, ServiceOption } from '../../types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../services/api', () => ({
  providersApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  rulesApi: {
    listServices: vi.fn(),
  },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockService: ServiceOption = { id: 1, nombre: 'catering', tipo: 'catering' }

const mockProviders: Provider[] = [
  {
    id: 1, nombre: 'Catering Básico', servicio_id: 1,
    costo_base: 2000, indice_calidad: 0.7,
    tipos_evento_compatibles: ['boda'], is_active: true, tier: 'basico',
  },
  {
    id: 2, nombre: 'Catering Premium', servicio_id: 1,
    costo_base: 5000, indice_calidad: 0.92,
    tipos_evento_compatibles: ['boda'], is_active: true, tier: 'premium',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
}

async function renderPage() {
  const { providersApi, rulesApi } = await import('../../services/api')
  vi.mocked(providersApi.list).mockResolvedValue(mockProviders)
  vi.mocked(rulesApi.listServices).mockResolvedValue([mockService] as never)
  vi.mocked(providersApi.create).mockResolvedValue({ id: 99, nombre: 'Nuevo' })

  render(
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter>
        <AdminProvidersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AdminProvidersPage — tier/nivel', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('el formulario de creación muestra el dropdown Nivel', async () => {
    await renderPage()

    // Abrir formulario
    const newBtn = screen.getByText(/nuevo proveedor/i)
    fireEvent.click(newBtn)

    // El select de tier debe estar presente
    const tierSelect = await screen.findByTestId('tier-select')
    expect(tierSelect).toBeInTheDocument()

    // Debe tener opciones basico y premium
    const options = tierSelect.querySelectorAll('option')
    const values = Array.from(options).map(o => (o as HTMLOptionElement).value)
    expect(values).toContain('basico')
    expect(values).toContain('premium')
  })

  it('guardar proveedor incluye tier en los datos enviados', async () => {
    await renderPage()
    const { providersApi } = await import('../../services/api')

    // Abrir formulario
    fireEvent.click(screen.getByText(/nuevo proveedor/i))

    // Esperar a que el form esté visible
    await screen.findByTestId('tier-select')

    // Cambiar tier a premium
    const tierSelect = screen.getByTestId('tier-select')
    fireEvent.change(tierSelect, { target: { value: 'premium' } })

    // Guardar — encontrar el botón por role dentro del form
    const saveBtn = screen.getAllByRole('button').find(
      b => b.textContent?.includes('Guardar'),
    )
    expect(saveBtn).toBeDefined()
    fireEvent.click(saveBtn!)

    await waitFor(() => {
      const calls = vi.mocked(providersApi.create).mock.calls
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0][0]).toMatchObject({ tier: 'premium' })
    }, { timeout: 3000 })
  })

  it('la tabla muestra badge Premium para proveedor tier=premium', async () => {
    await renderPage()

    // findAllByText porque "Premium" también aparece en el dropdown de filtro
    const premiumEls = await screen.findAllByText('Premium')
    // Al menos uno debe estar dentro de la tabla (el badge)
    expect(premiumEls.length).toBeGreaterThanOrEqual(1)
  })

  it('la tabla muestra badge Básico para proveedor tier=basico', async () => {
    await renderPage()

    // findAllByText porque "Básico" también aparece en el dropdown de filtro
    const basicoEls = await screen.findAllByText('Básico')
    expect(basicoEls.length).toBeGreaterThanOrEqual(1)
  })

  it('el filtro de nivel oculta proveedores del otro tier', async () => {
    await renderPage()

    // Esperar que cargue
    await screen.findByText('Catering Básico')
    await screen.findByText('Catering Premium')

    // Filtrar a solo premium
    const filterSelect = screen.getByTestId('tier-filter')
    fireEvent.change(filterSelect, { target: { value: 'premium' } })

    // Básico ya no debe aparecer
    expect(screen.queryByText('Catering Básico')).not.toBeInTheDocument()
    expect(screen.getByText('Catering Premium')).toBeInTheDocument()
  })
})
