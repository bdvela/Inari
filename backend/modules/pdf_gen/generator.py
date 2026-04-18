"""
Generador de PDF de propuesta usando WeasyPrint.

Flujo:
  1. Renderizar template HTML con Jinja2
  2. Convertir a PDF con WeasyPrint
  3. Retornar bytes del PDF

El PDF debe generarse en < 5 segundos (RNF-02).
"""
import io
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from backend.core.logging import get_logger
from backend.modules.proposal_gen.schemas import Proposal

logger = get_logger("pdf_gen")

TEMPLATES_DIR = Path(__file__).parent / "templates"


def _get_jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )


def generate_pdf(proposal: Proposal) -> bytes:
    """
    Genera un PDF formal de la propuesta.
    Retorna bytes del PDF. Lanza RuntimeError si WeasyPrint falla.
    """
    try:
        from weasyprint import HTML
    except (ImportError, OSError):
        # WeasyPrint no disponible o faltan libs nativas (GTK en Windows).
        # En Docker/Linux funciona. Dev Windows recibe HTML como fallback.
        logger.warning("WeasyPrint no disponible (faltan libs nativas). Retornando HTML.")
        return _generate_html_fallback(proposal).encode("utf-8")

    env = _get_jinja_env()
    template = env.get_template("proposal.html")
    html_content = template.render(proposal=proposal)

    logger.info("Generando PDF para cotización %d (%s)", proposal.quotation_id, proposal.nivel)
    pdf_bytes = HTML(string=html_content).write_pdf()
    logger.info("PDF generado: %d bytes", len(pdf_bytes))
    return pdf_bytes


def _generate_html_fallback(proposal: Proposal) -> str:
    """Fallback HTML cuando WeasyPrint no está disponible."""
    env = _get_jinja_env()
    template = env.get_template("proposal.html")
    return template.render(proposal=proposal)
