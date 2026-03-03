"""add media assets table"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_media_assets'
down_revision = '003_uploads'
branch_labels = None
depends_on = None


def upgrade() -> None:
    media_type_enum = postgresql.ENUM('image', 'video', name='mediatypeenum', create_type=True)

    op.create_table(
        'media_assets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('type', media_type_enum, nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('storage_key', sa.String(length=500), nullable=False),
        sa.Column('public_url', sa.String(length=1000), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_media_assets_category', 'media_assets', ['category'])
    op.create_index('ix_media_assets_type', 'media_assets', ['type'])
    op.create_index('ix_media_assets_id', 'media_assets', ['id'])


def downgrade() -> None:
    op.drop_table('media_assets')
    op.execute('DROP TYPE IF EXISTS mediatypeenum')

