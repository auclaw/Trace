"""
Database connection management
"""
import sqlite3
from contextlib import contextmanager
from config.settings import DATABASE_PATH
from models.database_models import (
    USER_TABLE_SQL,
    ACTIVITY_TABLE_SQL,
    VERIFICATION_CODE_TABLE_SQL,
    SUBSCRIPTION_ORDER_TABLE_SQL,
    SUBSCRIPTION_HISTORY_TABLE_SQL
)

@contextmanager
def get_db_connection():
    """
    Get database connection with proper cleanup
    Usage:
    with get_db_connection() as conn:
        # do something with conn
    """
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    """Initialize all database tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(USER_TABLE_SQL)
        cursor.execute(ACTIVITY_TABLE_SQL)
        cursor.execute(VERIFICATION_CODE_TABLE_SQL)
        cursor.execute(SUBSCRIPTION_ORDER_TABLE_SQL)
        cursor.execute(SUBSCRIPTION_HISTORY_TABLE_SQL)
        conn.commit()
