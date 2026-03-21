import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(String, unique=True, index=True, nullable=False)
    # JSON list of strings, e.g. ["Python", "FastAPI"]
    skills = Column(JSON, default=list, nullable=False)
    # JSON list of objects: [{school, degree, year}]
    education = Column(JSON, default=list, nullable=False)
    # JSON list of strings
    certifications = Column(JSON, default=list, nullable=False)
    # JSON list of objects: [{company, role, years, description}]
    experience = Column(JSON, default=list, nullable=False)
    # JSON list of strings, e.g. ["Backend Engineer", "Data Scientist"]
    target_roles = Column(JSON, default=list, nullable=False)
    preferred_language = Column(String, default="English", nullable=False, server_default="English")
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
