from app.services.users import Userservices
from app.models.users_model import UserRegister

import pytest
from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import uuid4

@pytest.fixture
def user_service(db_session: Session) -> Userservices:
    return Userservices(db_session)

def test_create_user_missing_id_dict(user_service: Userservices):
    # Passing dict without id
    user_data = {"username": "test_bad", "email": "test_bad@test.com"}
    with pytest.raises(HTTPException) as exc_info:
        user_service.create_user(user_data)
    assert exc_info.value.status_code == 500
    print(f"\nCaught expected 500 for missing ID: {exc_info.value.detail}")


def test_create_user_invalid_id_dict(user_service: Userservices):
    # Passing dict with invalid id
    user_data = {"username": "test_bad2", "email": "test_bad2@test.com", "id": "not-a-uuid"}
    with pytest.raises(HTTPException) as exc_info:
        user_service.create_user(user_data)
    assert exc_info.value.status_code == 500
    print(f"\nCaught expected 500 for invalid ID: {exc_info.value.detail}")


def test_update_user_invalid_id(user_service: Userservices):
    # Passing invalid id
    user_id = "not-a-uuid"
    user_update = {"username": "test_bad3"}
    with pytest.raises(HTTPException) as exc_info:
        user_service.update_user(user_id, user_update)
    assert exc_info.value.status_code == 400
    print(f"\nCaught expected 400 for invalid ID: {exc_info.value.detail}")


def test_update_user_with_dict(user_service: Userservices):
    # Create and add user
    user_id = str(uuid4())
    user = UserRegister(username="test", first_name="test", last_name="test", email="test@test.com", id=user_id)
    user_service.create_user(user)

    # Update user with dict
    user_update = {"username": "test2", "first_name": "test2", "last_name": "test2", "email": "test2@test.com"}
    user_service.update_user(user_id, user_update)

    # Verify user was updated
    assert user_service.get_user_by_email("test2@test.com") is not None
