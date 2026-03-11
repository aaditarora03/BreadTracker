import uuid
from datetime import datetime, date
from typing import Optional
from sqlmodel import Field, SQLModel, Column, DateTime, func, Relationship


class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"
    
    subscription_id: Optional[int] = Field(default=None, primary_key=True)
    service_name: str = Field(nullable=False)
    cost: float = Field(nullable=False)
    billing_date: date = Field(nullable=False)
    recurrence_type: str = Field(default="monthly", nullable=False)
    auto_renew: bool = Field(default=True, nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    user_id: uuid.UUID = Field(foreign_key='profiles.user_id')
    user: Optional["Profile"] = Relationship(back_populates="subscriptions")
    
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True), 
            server_default=func.now(),
            nullable=False
        )
    )
    modified_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True), 
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False
        )
    )
    