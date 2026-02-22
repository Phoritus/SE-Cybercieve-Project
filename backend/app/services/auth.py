from app.db.supabase import supabase_client
from app.models.users_model import UserRegister
from app.core.config import supabase_config
from app.models.exception import AuthError

from supabase import Client
from sqlalchemy.orm import Session
from app.services.users import Userservices
import jwt
from jwt import PyJWKClient

class AuthService:
    def __init__(self, supabase_client: Client, db: Session):
        self.supabase_client = supabase_client
        self.db = db
        self.jwks_client = PyJWKClient(supabase_config.JWKS_URL)
        self.audience = supabase_config.AUDIENCE
        self.algorithm = supabase_config.ALGORITHM

    def verify_token(self, token: str):
        try:
            # Public key
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            
            # Verify token
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[self.algorithm],
                audience=self.audience,
                leeway=60
            )
            return payload

        except jwt.ExpiredSignatureError:
            raise AuthError("Token has expired")
        except jwt.InvalidAudienceError:
            raise AuthError("Invalid audience")
        except jwt.PyJWTError as e:
            # Detalied error message
            raise AuthError(f"Invalid Token: {str(e)}")
        except Exception as e:
            raise AuthError(f"Authentication failed: {str(e)}")

    def register(self, user: UserRegister):
        # Create user in local database
        user_service = Userservices(self.db)
        user_service.create_user(user)