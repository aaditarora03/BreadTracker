from pydantic import EmailStr
from ..SqlCamelModel import SqlCamelModel

class UserSignup(SqlCamelModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserLogin(SqlCamelModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(SqlCamelModel):
    email: EmailStr

class PasswordUpdate(SqlCamelModel):
    new_password: str