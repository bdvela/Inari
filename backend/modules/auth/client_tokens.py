"""
Tokens firmados para acceso de clientes a sus cotizaciones.

JWT self-contained — no requiere BD para verificar. Firmado con
CLIENT_TOKEN_SECRET (distinto de SECRET_KEY de staff).

Lanza jose.JWTError si el token es inválido, expirado o manipulado.
"""
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from jose import JWTError, jwt  # noqa: F401 — JWTError re-exportado para callers

from backend.core.config import get_settings

ALGORITHM = "HS256"
CLIENT_SCOPE = ["view", "request_adjustment", "download_pdf"]
_MAX_EXPIRY_DAYS = 90


def create_client_token(quotation_id: int, expires_in_days: int = 30) -> str:
    """Crea JWT firmado para que cliente acceda a su cotización.

    Raises:
        ValueError: si expires_in_days > 90.
    """
    if expires_in_days > _MAX_EXPIRY_DAYS:
        raise ValueError(
            f"expires_in_days no puede superar {_MAX_EXPIRY_DAYS} días"
        )

    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": "client",
        "qid": quotation_id,
        "scope": CLIENT_SCOPE,
        "jti": str(uuid4()),  # garantiza unicidad entre tokens del mismo recurso
        "iat": now,
        "exp": now + timedelta(days=expires_in_days),
    }
    return jwt.encode(payload, get_settings().CLIENT_TOKEN_SECRET, algorithm=ALGORITHM)


def verify_client_token(token: str) -> dict[str, Any]:
    """Decodifica y verifica token de cliente.

    Raises:
        jose.JWTError: token inválido, expirado o firmado con otra secret.
    """
    return jwt.decode(
        token,
        get_settings().CLIENT_TOKEN_SECRET,
        algorithms=[ALGORITHM],
    )
