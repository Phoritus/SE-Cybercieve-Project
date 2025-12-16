from app.db.supabase import User as DBUser
from app.models.users_model import UserRegister

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from uuid import UUID, uuid4

class Userservices:
    def __init__(self, db: Session):
        self.db = db

    def get_all_users(self):
        return self.db.query(DBUser).all()
    
    def get_user_by_email(self, email: str):
        return self.db.query(DBUser).filter(DBUser.email == email).first()

    def get_user_by_id(self, user_id: str):
        return self.db.query(DBUser).filter(DBUser.id == UUID(str(user_id))).first()
    
    def create_user(self, user: UserRegister | dict):

        # Logic to handle both dict and Pydantic model
        if isinstance(user, dict):
            email = user.get("email")
            username = user.get("username")
            first_name = user.get("first_name")
            last_name = user.get("last_name")
            user_id = user.get("id")
        else:
            user_id = user.id
            email = user.email
            username = getattr(user, "username", None)
            first_name = getattr(user, "first_name", None)
            last_name = getattr(user, "last_name", None)

        try:
            db_user = DBUser(
                id=UUID(str(user_id)), # Ensure it's a UUID object
                username=username, 
                first_name=first_name, 
                last_name=last_name, 
                email=email
            )
            self.db.add(db_user)
            self.db.commit()
            self.db.refresh(db_user)
            return db_user

        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail="Username or email already exists")
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def update_user(self, user_id: str, user_update: dict):
        try:
            uuid_obj = UUID(str(user_id))
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid UUID format")

        db_user = self.db.query(DBUser).filter(DBUser.id == uuid_obj).first()
        if not db_user:
            return None

        if not isinstance(user_update, dict):
            if hasattr(user_update, "model_dump"):
                user_update = user_update.model_dump(exclude_unset=True)
            elif hasattr(user_update, "dict"):
                 user_update = user_update.dict(exclude_unset=True)
            else:
                 # Fallback/Error or try vars()?
                 user_update = vars(user_update)

        if user_update.get("username") is not None:
            db_user.username = user_update["username"]
        if user_update.get("first_name") is not None:
            db_user.first_name = user_update["first_name"]
        if user_update.get("last_name") is not None:
            db_user.last_name = user_update["last_name"]
        if user_update.get("email") is not None:
            db_user.email = user_update["email"]
            
        try:
            self.db.commit()
            self.db.refresh(db_user)
            return db_user
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail="Username already taken")

    def delete_user(self, user_id: str):
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        self.db.delete(user)
        self.db.commit()
        return user