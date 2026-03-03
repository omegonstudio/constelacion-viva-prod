"""add uploads table"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_uploads'
down_revision = '002_gallery'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'uploads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('uploader_id', sa.Integer(), nullable=True),
        sa.Column('filename', sa.String(length=500), nullable=False),
        sa.Column('key', sa.String(length=500), nullable=False),
        sa.Column('url', sa.String(length=1000), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=True),
        sa.Column('size', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploader_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_uploads_tenant_id', 'uploads', ['tenant_id'])
    op.create_index('ix_uploads_uploader_id', 'uploads', ['uploader_id'])
    op.create_index('ix_uploads_id', 'uploads', ['id'])


def downgrade() -> None:
    op.drop_table('uploads')

