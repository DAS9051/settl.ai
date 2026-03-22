import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, JSON, String, types
from database import Base


class _UUID(types.TypeDecorator):
    """Platform-independent UUID type.

    Stores as a native UUID on PostgreSQL, and as a VARCHAR(36) string on
    SQLite/other databases.  Always returns Python ``uuid.UUID`` objects.
    """
    impl = types.String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(types.String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(_UUID(), primary_key=True, default=uuid.uuid4)
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
    province = Column(String, default="Ontario", nullable=False, server_default="Ontario")
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )
