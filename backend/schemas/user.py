from datetime import datetime

from pydantic import BaseModel, ConfigDict

from backend.models.user import UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

