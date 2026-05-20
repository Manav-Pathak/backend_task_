from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models.note import Note
from backend.models.user import User, UserRole
from backend.schemas.note import NoteCreate, NoteRead, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


def get_note_for_user(db: Session, note_id: int, user: User) -> Note:
    query = db.query(Note).filter(Note.id == note_id)
    if user.role != UserRole.ADMIN:
        query = query.filter(Note.owner_id == user.id)

    note = query.first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return note


@router.get("", response_model=list[NoteRead])
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Note]:
    return (
        db.query(Note)
        .filter(Note.owner_id == current_user.id)
        .order_by(Note.updated_at.desc())
        .all()
    )


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    note = Note(
        title=payload.title,
        content=payload.content,
        completed=payload.completed,
        owner_id=current_user.id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteRead)
def read_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    return get_note_for_user(db, note_id, current_user)


@router.patch("/{note_id}", response_model=NoteRead)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Note:
    note = get_note_for_user(db, note_id, current_user)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(note, field, value)

    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    note = get_note_for_user(db, note_id, current_user)
    db.delete(note)
    db.commit()

