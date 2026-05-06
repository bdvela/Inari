"""
Generador de PDF de propuesta usando WeasyPrint.

Flujo:
  1. Renderizar template HTML con Jinja2
  2. Convertir a PDF con WeasyPrint
  3. Retornar bytes del PDF

El PDF debe generarse en < 5 segundos (RNF-02).
Si WeasyPrint no está disponible (dev en Mac sin libs nativas),
retorna HTML con CSS de impresión — el usuario puede hacer Cmd+P.
"""
import io
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from backend.core.logging import get_logger
from backend.modules.proposal_gen.schemas import Proposal

logger = get_logger("pdf_gen")

TEMPLATES_DIR = Path(__file__).parent / "templates"

WEASYPRINT_AVAILABLE: bool | None = None  # cacheado en primera llamada


def _get_jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )


def _check_weasyprint() -> bool:
    global WEASYPRINT_AVAILABLE
    if WEASYPRINT_AVAILABLE is None:
        try:
            from weasyprint import HTML  # noqa: F401
            WEASYPRINT_AVAILABLE = True
        except (ImportError, OSError):
            WEASYPRINT_AVAILABLE = False
            logger.warning(
                "WeasyPrint no disponible (faltan librerías nativas). "
                "Usando fallback HTML imprimible. "
                "En producción (Docker/Railway) el PDF funciona correctamente."
            )
    return WEASYPRINT_AVAILABLE


def generate_pdf(proposal: Proposal) -> bytes:
    """
    Genera PDF con WeasyPrint si disponible; si no, HTML imprimible (Cmd+P).
    Retorna bytes. El Content-Type se determina con is_pdf_available().
    """
    env = _get_jinja_env()
    template = env.get_template("proposal.html")
    html_content = template.render(proposal=proposal)

    if _check_weasyprint():
        from weasyprint import HTML
        logger.info("Generando PDF para cotización %d (%s)", proposal.quotation_id, proposal.nivel)
        pdf_bytes = HTML(string=html_content).write_pdf()
        logger.info("PDF generado: %d bytes", len(pdf_bytes))
        return pdf_bytes

    # Fallback: HTML con CSS de impresión — funciona en Mac dev
    logger.info("Generando HTML imprimible para cotización %d", proposal.quotation_id)
    return html_content.encode("utf-8")


def is_pdf_available() -> bool:
    """True si WeasyPrint está disponible y el resultado es un PDF real."""
    return _check_weasyprint()
