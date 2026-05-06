# Inari Group — Sistema Inteligente de Propuestas de Eventos

Plataforma web para INARI GROUP S.A.C. que automatiza cotizaciones de eventos desde imágenes de referencia.
TSP · Ingeniería de Software · UPC Lima.

---

## Desarrollo local

### Requisitos
- Python 3.11+
- Node.js 20+
- Docker + Docker Compose (para PostgreSQL)

### Backend

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 2. Levantar PostgreSQL
docker-compose up -d db

# 3. Instalar dependencias
pip install -r requirements.txt -r requirements-dev.txt

# 4. Correr migraciones
alembic upgrade head

# 5. Seed inicial (servicios y proveedores de ejemplo)
python scripts/seed.py

# 6. Iniciar servidor
uvicorn backend.main:app --reload
# API disponible en http://localhost:8000
# Docs en http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App en http://localhost:5173
```

### Tests

```bash
# Tests unitarios + cobertura de módulos críticos
pytest --cov=backend/modules --cov-report=term-missing

# Solo optimizer (los 6 casos obligatorios)
pytest tests/unit/optimizer/ -v

# Tests de integración (requieren BD activa)
pytest tests/integration/ -v
```

---

## Despliegue en producción (Railway)

### Variables de entorno requeridas

Configurar en Railway → Variables de entorno del servicio backend:

```bash
# Base de datos (Railway provee DATABASE_URL automáticamente con PostgreSQL plugin)
DATABASE_URL=postgresql+asyncpg://...

# Google Gemini
GEMINI_API_KEY=AIza...

# JWT
SECRET_KEY=<secreto-largo-y-aleatorio>
ACCESS_TOKEN_EXPIRE_MINUTES=480

# CORS — agregar URL del frontend desplegado
ALLOWED_ORIGINS=https://tu-frontend.up.railway.app,https://tudominio.com

# Storage
STORAGE_BACKEND=local
STORAGE_BASE_URL=https://tu-backend.up.railway.app

# Optimizador
OPTIMIZER_ILP_MAX_COMBINATIONS=500
PREMIUM_BUDGET_MULTIPLIER=1.30
QUALITY_WEIGHT_HISTORICAL=0.5
QUALITY_WEIGHT_PRICE=0.3
QUALITY_WEIGHT_EXPERIENCE=0.2

# Gemini Vision
VISION_MODEL=gemini-2.5-flash

# App
DEBUG=false
```

### Comando de build / start

Railway detecta automáticamente el `Dockerfile.backend`. Si se configura manualmente:

```bash
# Build
pip install -r requirements.txt

# Start
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

### Migraciones en Railway

Ejecutar antes del primer despliegue (o después de cambios de modelo):

```bash
# En la consola de Railway o como Release Command:
alembic upgrade head
```

Para configurar como Release Command en Railway:
`alembic upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### WeasyPrint — dependencias nativas para PDF

El `Dockerfile.backend` debe instalar las bibliotecas nativas requeridas por WeasyPrint en Linux:

```dockerfile
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*
```

Sin estas dependencias, el endpoint `GET /quotations/{id}/pdf` retornará HTTP 500.

### CORS — configuración para producción

`ALLOWED_ORIGINS` acepta múltiples origins separados por coma:

```bash
ALLOWED_ORIGINS=https://inari-frontend.up.railway.app,https://inarigroup.pe
```

El backend rechazará requests de cualquier origin no listado aquí.

---

## Arquitectura

Ver `CLAUDE.md` para detalles completos de arquitectura, convenciones de código y módulos.

```
backend/modules/optimizer/      → Motor ILP + Greedy (núcleo del sistema)
backend/modules/visual_analysis/ → Análisis de imagen con Google Gemini
backend/modules/rules_engine/   → Reglas de negocio por tipo de evento
backend/modules/pdf_gen/        → Generación de PDF con WeasyPrint
backend/api/routers/            → Endpoints REST (orquestación, sin lógica de negocio)
frontend/src/pages/             → Páginas React
```
