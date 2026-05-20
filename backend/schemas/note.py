from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class NoteBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    content: str = Field(default="", max_length=2000)
    completed: bool = False

    @field_validator("title", "content", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return str(value).strip()


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    content: str | None = Field(default=None, max_length=2000)
    completed: bool | None = None

    @field_validator("title", "content", mode="before")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return str(value).strip() if value is not None else None

    @model_validator(mode="after")
    def require_one_field(self) -> "NoteUpdate":
        if self.title is None and self.content is None and self.completed is None:
            raise ValueError("At least one field must be provided.")
        return self


class NoteRead(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
