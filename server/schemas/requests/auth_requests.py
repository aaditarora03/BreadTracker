from typing import Annotated
from pydantic import AfterValidator, EmailStr
from email_validator import validate_email, EmailNotValidError
from ..SqlCamelModel import SqlCamelModel


def validate_real_email(value: str) -> str:
    """Validate that the email has proper format and a deliverable domain (MX records)."""
    try:
        emailinfo = validate_email(value, check_deliverability=True)
        return emailinfo.normalized
    except EmailNotValidError as e:
        raise ValueError(str(e))


RealEmail = Annotated[str, AfterValidator(validate_real_email)]


class UserSignup(SqlCamelModel):
    email: RealEmail
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

class CodeExchangeRequest(SqlCamelModel):
    code: str