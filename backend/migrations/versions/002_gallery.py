"""Add gallery items table"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_gallery'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enums
    gallery_type_enum = postgresql.ENUM('image', 'video', name='galleryitemtypeenum', create_type=True)
    gallery_category_enum = postgresql.ENUM('eventos', 'terapeutas', name='gallerycategoryenum', create_type=True)

    # Create table
    op.create_table(
        'gallery_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('type', gallery_type_enum, nullable=False),
        sa.Column('category', gallery_category_enum, nullable=False),
        sa.Column('src', sa.String(length=1000), nullable=False),
        sa.Column('video_src', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_gallery_items_category', 'gallery_items', ['category'])
    op.create_index('ix_gallery_items_type', 'gallery_items', ['type'])
    op.create_index('ix_gallery_items_id', 'gallery_items', ['id'])

    # Seed minimal demo data (safe for dev; can be deleted later)
    gallery_items_table = sa.table(
        'gallery_items',
        sa.column('id', sa.Integer),
        sa.column('title', sa.String),
        sa.column('type', gallery_type_enum),
        sa.column('category', gallery_category_enum),
        sa.column('src', sa.String),
        sa.column('video_src', sa.String),
    )
    op.bulk_insert(
        gallery_items_table,
        [
          {"id": 1, "title": "Taller de Meditación Lunar", "type": "image", "category": "eventos", "src": "/meditation-workshop-moon.jpg", "video_src": None},
          {"id": 2, "title": "Sesión de Reiki", "type": "video", "category": "terapeutas", "src": "/reiki-therapy-session.jpg", "video_src": "https://www.w3schools.com/html/mov_bbb.mp4"},
          {"id": 3, "title": "Círculo de Mujeres", "type": "image", "category": "eventos", "src": "/women-circle-gathering.jpg", "video_src": None},
          {"id": 4, "title": "Terapia de Sonido", "type": "image", "category": "terapeutas", "src": "/sound-therapy-bowls.jpg", "video_src": None},
          {"id": 5, "title": "Retiro de Bienestar", "type": "image", "category": "eventos", "src": "/wellness-retreat-nature.jpg", "video_src": None},
        ],
    )


def downgrade() -> None:
    op.drop_table('gallery_items')
    op.execute('DROP TYPE IF EXISTS galleryitemtypeenum')
    op.execute('DROP TYPE IF EXISTS gallerycategoryenum')

