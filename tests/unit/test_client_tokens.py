"""
Tests unitarios — backend/modules/auth/client_tokens.py

Verifican contratos de seguridad del token de cliente:
- estructura del JWT emitido
- ausencia de PII en payload
- verificación correcta e incorrecta
- expiración
- manipulación
- validación de parámetros
"""
import base64
import json
from datetime import timedelta

import pytest
from jose import JWTError, jwt

from backend.modules.auth.client_tokens import (
    ALGORITHM,
    CLIENT_SCOPE,
    create_client_token,
    verify_client_token,
)

# Secret fijo para tests — independiente del .env
_TEST_SECRET = "test-client-secret-unit"
_OTHER_SECRET = "completely-different-secret"


@pytest.fixture(autouse=True)
def patch_settings(monkeypatch):
    """Aísla tests de cualquier .env real y limpia el cache de settings."""
    monkeypatch.setenv("CLIENT_TOKEN_SECRET", _TEST_SECRET)
    # Limpia lru_cache para que get_settings() lea el env parcheado
    from backend.core.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


# ---------------------------------------------------------------------------
# create_client_token
# ---------------------------------------------------------------------------

def test_create_returns_decodable_jwt():
    token = create_client_token(quotation_id=42)
    assert isinstance(token, str)
    # Debe tener 3 partes separadas por '.'
    assert token.count(".") == 2


def test_payload_contains_correct_qid():
    token = create_client_token(quotation_id=99)
    payload = jwt.decode(token, _TEST_SECRET, algorithms=[ALGORITHM])
    assert payload["qid"] == 99


def test_payload_contains_expected_scope():
    token = create_client_token(quotation_id=1)
    payload = jwt.decode(token, _TEST_SECRET, algorithms=[ALGORITHM])
    assert payload["scope"] == CLIENT_SCOPE
    assert "view" in payload["scope"]
    assert "request_adjustment" in payload["scope"]
    assert "download_pdf" in payload["scope"]


def test_payload_sub_is_client():
    token = create_client_token(quotation_id=1)
    payload = jwt.decode(token, _TEST_SECRET, algorithms=[ALGORITHM])
    assert payload["sub"] == "client"


def test_payload_has_iat_and_exp():
    token = create_client_token(quotation_id=1)
    payload = jwt.decode(token, _TEST_SECRET, algorithms=[ALGORITHM])
    assert "iat" in payload
    assert "exp" in payload
    # exp > iat
    assert payload["exp"] > payload["iat"]


def test_payload_no_pii():
    token = create_client_token(quotation_id=7)
    payload = jwt.decode(token, _TEST_SECRET, algorithms=[ALGORITHM])
    pii_fields = {"email", "nombre", "telefono", "password", "user_id", "id"}
    for field in pii_fields:
        assert field not in payload, f"PII field '{field}' found in client token payload"


def test_expires_in_days_respected():
    """Token a 1 día expira antes que token a 30 días."""
    t1 = create_client_token(quotation_id=1, expires_in_days=1)
    t30 = create_client_token(quotation_id=1, expires_in_days=30)
    p1 = jwt.decode(t1, _TEST_SECRET, algorithms=[ALGORITHM])
    p30 = jwt.decode(t30, _TEST_SECRET, algorithms=[ALGORITHM])
    assert p1["exp"] < p30["exp"]


def test_expires_in_days_over_90_raises_value_error():
    with pytest.raises(ValueError, match="90"):
        create_client_token(quotation_id=1, expires_in_days=91)


def test_expires_in_days_exactly_90_ok():
    token = create_client_token(quotation_id=1, expires_in_days=90)
    assert token  # no lanza


# ---------------------------------------------------------------------------
# verify_client_token
# ---------------------------------------------------------------------------

def test_verify_valid_token_returns_payload():
    token = create_client_token(quotation_id=55)
    payload = verify_client_token(token)
    assert payload["qid"] == 55
    assert payload["sub"] == "client"


def test_verify_token_signed_with_other_secret_raises():
    foreign_token = jwt.encode(
        {"sub": "client", "qid": 1, "scope": CLIENT_SCOPE},
        _OTHER_SECRET,
        algorithm=ALGORITHM,
    )
    with pytest.raises(JWTError):
        verify_client_token(foreign_token)


def test_verify_expired_token_raises():
    expired = jwt.encode(
        {
            "sub": "client",
            "qid": 1,
            "scope": CLIENT_SCOPE,
            "exp": 1,  # epoch 1 = ya expirado
        },
        _TEST_SECRET,
        algorithm=ALGORITHM,
    )
    with pytest.raises(JWTError):
        verify_client_token(expired)


def test_verify_tampered_token_raises():
    """Altera el payload del JWT a mano — la firma deja de ser válida."""
    token = create_client_token(quotation_id=10)
    header_b64, payload_b64, signature = token.split(".")

    # Decodifica payload (añade padding si falta)
    padding = 4 - len(payload_b64) % 4
    decoded = base64.urlsafe_b64decode(payload_b64 + "=" * padding)
    tampered = json.loads(decoded)
    tampered["qid"] = 9999  # cambia qid

    new_payload = base64.urlsafe_b64encode(
        json.dumps(tampered).encode()
    ).rstrip(b"=").decode()
    tampered_token = f"{header_b64}.{new_payload}.{signature}"

    with pytest.raises(JWTError):
        verify_client_token(tampered_token)


def test_verify_garbage_string_raises():
    with pytest.raises(JWTError):
        verify_client_token("not.a.jwt")
