from typing import Optional, Literal
from datetime import date
from ..SqlCamelModel import SqlCamelModel

class CreateSubscriptionRequest(SqlCamelModel):
    service_name: str
    cost: float
    billing_date: date
    recurrence_type: Literal["weekly", "monthly", "yearly"] = "monthly"
    auto_renew: bool = True

class UpdateSubscriptionRequest(SqlCamelModel):
    service_name: Optional[str] = None
    cost: Optional[float] = None
    billing_date: Optional[date] = None
    recurrence_type: Optional[Literal["weekly", "monthly", "yearly"]] = None
    auto_renew: Optional[bool] = None
    is_active: Optional[bool] = None