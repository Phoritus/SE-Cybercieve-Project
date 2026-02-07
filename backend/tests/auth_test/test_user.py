from app.services.users import Userservices
from app.models.users_model import UserRegister, UserUpdate

import pytest
from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import uuid4, UUID

@pytest.fixture
def user_service(db_session: Session) -> Userservices:
    user_service = Userservices(db_session)
    assert user_service is not None
    return user_service


def test_add_user(user_service: Userservices):
    # Verify DB is empty initially
    existing_users = user_service.get_all_users()
    assert existing_users == []

    # Create and add user
    user_id = str(uuid4())
    user = UserRegister(username="test", first_name="test", last_name="test", email="test@test.com", id=user_id)
    user_service.create_user(user)
    # Verify user was added
    assert user_service.get_user_by_email("test@test.com") is not None



def test_add_user_duplicate(user_service: Userservices):
    # Verify DB is empty initially
    existing_users = user_service.get_all_users()
    assert existing_users == []

    # Create and add user
    user_id = str(uuid4())
    user = UserRegister(username="test", first_name="test", last_name="test", email="test@test.com", id=user_id)
    user_service.create_user(user)

    # Verify user was added
    assert user_service.get_user_by_email("test@test.com") is not None
    with pytest.raises(HTTPException) as exc_info:
        user_service.create_user(user)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Username or email already exists"


def test_update_user(user_service: Userservices):
    # Verify DB is empty initially
    existing_users = user_service.get_all_users()
    assert existing_users == []

    # Create and add user
    user_id = str(uuid4())
    user = UserRegister(username="test", first_name="test", last_name="test", email="test@test.com", id=user_id)
    user_service.create_user(user)
    # Verify user was added
    assert user_service.get_user_by_email("test@test.com") is not None
    # Update user
    user_update = UserUpdate(username="test2", first_name="test2", last_name="test2")
    user_service.update_user(user_id, user_update)

    # Email should NOT change
    assert user_service.get_user_by_email("test2@test.com") is None
    updated_user = user_service.get_user_by_email("test@test.com")
    assert updated_user is not None
    assert updated_user.username == "test2"
    assert updated_user.first_name == "test2"
    assert updated_user.last_name == "test2"


def test_update_user_with_uuid_object(user_service: Userservices):
    # Create and add user
    user_id = str(uuid4())
    user = UserRegister(username="test_uuid", first_name="test", last_name="test", email="test_uuid@test.com", id=user_id)
    user_service.create_user(user)

    # Update user passing UUID object as user_id
    user_update = UserUpdate(username="test_uuid_updated")
    # This should not raise AttributeError
    updated_user = user_service.update_user(UUID(user_id), user_update)
    assert updated_user.username == "test_uuid_updated"

def test_update_user_with_duplicate_username(user_service: Userservices):
    # Create and add user
    user_id = str(uuid4())
    user = UserRegister(username="test", first_name="test", last_name="test", email="test@test.com", id=user_id)
    user_service.create_user(user)

    # Update user with duplicate username
    user_id2 = str(uuid4())
    user2 = UserRegister(username="test2", first_name="test", last_name="test", email="test2@test.com", id=user_id2)
    user_service.create_user(user2)
    user_update = UserUpdate(username="test2")
    with pytest.raises(HTTPException) as exc_info:
        user_service.update_user(user_id, user_update)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Username already taken"