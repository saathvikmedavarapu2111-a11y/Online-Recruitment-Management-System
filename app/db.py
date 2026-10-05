"""PostgreSQL access layer.

A single process-wide connection pool (psycopg 3). Every query in the
routers goes through `fetch_all`, `fetch_one` or `execute` below, so all
SQL stays parameterized — no string-built queries, no SQL injection.
"""
from contextlib import contextmanager
from typing import Any, Sequence

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import settings

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            settings.database_url,
            min_size=1,
            max_size=10,
            kwargs={"row_factory": dict_row, "autocommit": True},
        )
        _pool.open()
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def conn():
    pool = get_pool()
    with pool.connection() as c:
        yield c


def fetch_all(query: str, params: Sequence[Any] | None = None) -> list[dict]:
    with conn() as c:
        cur = c.execute(query, params or ())
        return list(cur.fetchall())


def fetch_one(query: str, params: Sequence[Any] | None = None) -> dict | None:
    with conn() as c:
        cur = c.execute(query, params or ())
        return cur.fetchone()


def execute(query: str, params: Sequence[Any] | None = None) -> int:
    """Run INSERT/UPDATE/DELETE. Returns the affected row count."""
    with conn() as c:
        cur = c.execute(query, params or ())
        return cur.rowcount or 0


def execute_returning(query: str, params: Sequence[Any] | None = None) -> dict | None:
    """Run INSERT ... RETURNING and hand back the new row."""
    with conn() as c:
        cur = c.execute(query, params or ())
        return cur.fetchone()


# Re-exported so routers can build safe dynamic identifiers if needed.
identifier = sql.Identifier
