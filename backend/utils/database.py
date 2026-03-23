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
    SUBSCRIPTION_HISTORY_TABLE_SQL,
    ORGANIZATION_TABLE_SQL,
    TEAM_TABLE_SQL,
    ORG_MEMBER_TABLE_SQL,
    TIME_APPROVAL_TABLE_SQL,
    HABIT_TARGET_TABLE_SQL,
    HABIT_CHECKIN_TABLE_SQL,
    FLOW_BLOCK_TABLE_SQL,
    INTERRUPTION_TABLE_SQL,
    TEAM_FOCUS_SESSION_TABLE_SQL,
    TEAM_FOCUS_MEMBER_TABLE_SQL,
    MELEGAL_DOCUMENTS_TABLE_SQL,
    MELEGAL_REVIEW_ORDER_TABLE_SQL
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
        # Team/enterprise features
        cursor.execute(ORGANIZATION_TABLE_SQL)
        cursor.execute(TEAM_TABLE_SQL)
        cursor.execute(ORG_MEMBER_TABLE_SQL)
        cursor.execute(TIME_APPROVAL_TABLE_SQL)
        cursor.execute(HABIT_TARGET_TABLE_SQL)
        cursor.execute(HABIT_CHECKIN_TABLE_SQL)
        cursor.execute(FLOW_BLOCK_TABLE_SQL)
        cursor.execute(INTERRUPTION_TABLE_SQL)
        cursor.execute(TEAM_FOCUS_SESSION_TABLE_SQL)
        cursor.execute(TEAM_FOCUS_MEMBER_TABLE_SQL)
        # melegal 可颂法务 tables
        cursor.execute(MELEGAL_DOCUMENTS_TABLE_SQL)
        cursor.execute(MELEGAL_REVIEW_ORDER_TABLE_SQL)
        conn.commit()
