import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, String, types
from sqlalchemy.orm import relationship
from database import Base


class _UUID(types.TypeDecorator):
    """Platform-independent UUID type."""
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


class Business(Base):
    __tablename__ = "businesses"

    id = Column(_UUID(), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    business_number = Column(String, nullable=True)
    verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    jobs = relationship("Job", back_populates="business", cascade="all, delete-orphan")
