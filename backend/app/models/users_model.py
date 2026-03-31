from pydantic import BaseModel


# Define Pydantic models for user operations
class UserRegister(BaseModel):
    id: str
    email: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None

class UserUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None