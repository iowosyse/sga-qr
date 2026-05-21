import ssl
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings


def _clean_url(url: str) -> str:
    """Strip asyncpg-incompatible query params (sslmode, channel_binding)."""
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    params.pop("sslmode", None)
    params.pop("channel_binding", None)
    clean_query = urlencode({k: v[0] for k, v in params.items()})
    return urlunparse(parsed._replace(query=clean_query))


_ssl_ctx = ssl.create_default_context()

engine = create_async_engine(
    _clean_url(settings.DATABASE_URL),
    connect_args={"ssl": _ssl_ctx},
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_async_session():
    async with AsyncSessionLocal() as session:
        yield session
