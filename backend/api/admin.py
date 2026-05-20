from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.deps import require_admin
from backend.models.note import Note
from backend.models.user import User
from backend.schemas.note import NoteRead
from backend.schemas.user import UserRead

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/notes", response_model=list[NoteRead])
def list_all_notes(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[Note]:
    return db.query(Note).order_by(Note.updated_at.desc()).all()

