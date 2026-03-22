import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, JSON, String, Text, types
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


class Job(Base):
    __tablename__ = "jobs"

    id = Column(_UUID(), primary_key=True, default=uuid.uuid4)
    business_id = Column(_UUID(), ForeignKey("businesses.id"), nullable=True)
    clerk_user_id = Column(String, nullable=True)
    is_personal = Column(Boolean, default=False, nullable=False, server_default="false")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    salary_range = Column(String, nullable=True)
    skills_required = Column(JSON, default=list, nullable=False)
    application_link = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    verified = Column(Boolean, default=False, nullable=False)
    status = Column(String, default='Saved', nullable=False, server_default='Saved')
    category = Column(String, default='long_term', nullable=False, server_default='long_term')
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    business = relationship("Business", back_populates="jobs")
