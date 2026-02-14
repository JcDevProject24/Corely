from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from models.user import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # 'facebook', 'instagram'
    provider_user_id = Column(String(255), nullable=False)
    provider_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacion con User
    user = relationship("User", back_populates="social_accounts")

    # Constraint unico: un usuario de un proveedor solo puede estar vinculado una vez
    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_provider_user"),
    )

    def __repr__(self):
        return f"<SocialAccount(id={self.id}, provider={self.provider}, user_id={self.user_id})>"
