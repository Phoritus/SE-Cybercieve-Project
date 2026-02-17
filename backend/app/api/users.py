from app.services.users import Userservices
from app.services.auth import AuthService, AuthError
from app.models.users_model import UserRegister, UserUpdate
from app.db.supabase import supabase_client, get_db

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
router = APIRouter()


@router.get('/me')
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = AuthService(supabase_client, db).verify_token(token)
        email = payload.get("email")
        user = Userservices(db).get_user_by_email(email)
        if not user:
            # Fallback to payload if user not in local DB (shouldn't happen if synced)
            return payload
        return user
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.put('/me')
def update_current_user(user_update: UserUpdate, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = AuthService(supabase_client, get_db()).verify_token(token)        
        email = payload.get("email")
        # Find local user by email
        # We need a service method for this.
        # Let's add get_user_by_email to Userservices first.
        
        # For now, let's assume we can query by email in the service update method or add a helper.
        # Let's modify Userservices to update by email or add get_by_email.
        
        # Actually, let's just use the email from the token to find the user.
        user = Userservices(db).get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return Userservices(db).update_user(user.id, user_update.dict(exclude_unset=True))
        
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    return AuthService(supabase_client, db).register(user)

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    # user is authenticated if we get here
    return Userservices(db).get_all_users()

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    # user is authenticated if we get here
    return Userservices(db).delete_user(user_id)

