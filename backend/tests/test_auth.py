from app.services.auth import AuthService
from app.models.exception import AuthError
from app.models.users_model import UserRegister

import pytest
import jwt
from unittest.mock import patch, MagicMock
from uuid import uuid4


@pytest.fixture
def auth_service_setup() -> AuthService:
    mock_supabase_client = MagicMock()
    mock_db = MagicMock()

    # Patch class PyJWKClient
    with patch("app.services.auth.PyJWKClient") as mock_jwk_client:
        service = AuthService(mock_supabase_client, mock_db)
        
        # Return service and mock_jwk_client
        yield service, mock_jwk_client.return_value


def test_verify_token_success(auth_service_setup):
    service, mock_jwk_client = auth_service_setup

    # Prepare mock data
    fake_token = "fake.token.string"
    expected_payload = {"sub": "1234567890", "role": "user"}

    # Mock PyJWKClient founded key
    mock_key = MagicMock()
    mock_key.key = "fake_public_key"
    mock_jwk_client.get_signing_key_from_jwt.return_value = mock_key
    
    # Mock jwt.decode
    with patch("app.services.auth.jwt.decode") as mock_decode:
        mock_decode.return_value = expected_payload

        # Call verify_token
        result = service.verify_token(fake_token)

    # Assert
    assert result == expected_payload
    assert result["sub"] == "1234567890"

    # Check if PyJWKClient was called
    mock_jwk_client.get_signing_key_from_jwt.assert_called_once_with(
        fake_token
    )


def test_verify_token_expired(auth_service_setup):
    service, mock_jwk_client = auth_service_setup
    # Mock Founded key
    mock_key = mock_jwk_client.get_signing_key_from_jwt.return_value
    mock_key.key = "fake_public_key"

    # Mock jwt.decode
    with patch("app.services.auth.jwt.decode", side_effect=jwt.ExpiredSignatureError) as mock_decode:
        # Call verify_token
        with pytest.raises(AuthError) as e:
            service.verify_token("expired_token")

        assert str(e.value) == "Token has expired"


def test_verify_token_invalid(auth_service_setup):
    service, mock_jwk_client = auth_service_setup
    # Mock Founded key
    mock_key = mock_jwk_client.get_signing_key_from_jwt.return_value
    mock_key.key = "fake_public_key"

    # Mock jwt.decode
    with patch("app.services.auth.jwt.decode", side_effect=jwt.InvalidTokenError) as mock_decode:
        # Call verify_token
        with pytest.raises(AuthError) as e:
            service.verify_token("invalid_token")

        assert str(e.value) == "Invalid Token: "


def test_verify_token_invalid_audience(auth_service_setup):
    service, mock_jwk_client = auth_service_setup
    # Mock Founded key
    mock_key = mock_jwk_client.get_signing_key_from_jwt.return_value
    mock_key.key = "fake_public_key"

    # Mock jwt.decode
    with patch("app.services.auth.jwt.decode", side_effect=jwt.InvalidAudienceError) as mock_decode:
        # Call verify_token
        with pytest.raises(AuthError) as e:
            service.verify_token("invalid_token")

        assert str(e.value) == "Invalid audience"


def test_verify_token_other_error(auth_service_setup):
    service, mock_jwk_client = auth_service_setup
    # Mock Founded key
    mock_key = mock_jwk_client.get_signing_key_from_jwt.return_value
    mock_key.key = "fake_public_key"

    # Mock jwt.decode
    with patch("app.services.auth.jwt.decode", side_effect=Exception) as mock_decode:
        # Call verify_token
        with pytest.raises(AuthError) as e:
            service.verify_token("invalid_token")
        assert str(e.value) == "Authentication failed: "


def test_register_success(auth_service_setup):
    service, _ = auth_service_setup
    user = UserRegister(
        id=str(uuid4()),
        email="test@example.com",
        username="testuser",
        first_name="Test",
        last_name="User"
    )
    with patch("app.services.auth.Userservices") as mock_create_user:
        mock_create_user.return_value.create_user.return_value = user
        service.register(user)
        
        # Assert create_user was called
        mock_create_user.return_value.create_user.assert_called_once_with(user)
        # Assert Userservices initialized
        mock_create_user.assert_called_once_with(service.db)
        