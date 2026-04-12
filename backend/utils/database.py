"""
Database connection management
"""
import sqlite3
from contextlib import contextmanager
from flask_sqlalchemy import SQLAlchemy
from config.settings import DATABASE_PATH

# SQLAlchemy ORM instance for service layer
db = SQLAlchemy()

from models.database_models import (
    USER_TABLE_SQL,
    ACTIVITY_TABLE_SQL,
    VERIFICATION_CODE_TABLE_SQL,
    USER_PHONE_INDEX_SQL,
    USER_EMAIL_INDEX_SQL,
    USER_OPENID_INDEX_SQL,
    ACTIVITY_USER_ID_INDEX_SQL,
    VERIFICATION_CODE_PHONE_INDEX_SQL,
    WECHAT_TOKEN_CACHE_TABLE_SQL,
    SUBSCRIPTION_ORDER_TABLE_SQL,
    SUBSCRIPTION_HISTORY_TABLE_SQL,
    ORGANIZATION_TABLE_SQL,
    TEAM_TABLE_SQL,
    ORG_MEMBER_TABLE_SQL,
    ORG_INVITATION_TABLE_SQL,
    NOTIFICATION_EVENTS_TABLE_SQL,
    TIME_APPROVAL_TABLE_SQL,
    HABIT_TARGET_TABLE_SQL,
    HABIT_CHECKIN_TABLE_SQL,
    FLOW_BLOCK_TABLE_SQL,
    INTERRUPTION_TABLE_SQL,
    TEAM_FOCUS_SESSION_TABLE_SQL,
    TEAM_FOCUS_MEMBER_TABLE_SQL,
    DEEP_FLOW_BLOCK_TABLE_SQL,
    MELEGAL_DOCUMENTS_TABLE_SQL,
    MELEGAL_REVIEW_ORDER_TABLE_SQL,
    TASKS_TABLE_SQL,
    TIMEBLOCKS_TABLE_SQL,
    PET_TABLE_SQL,
    TEAM_MEMBER_STAT_TABLE_SQL,
    TEAM_ACHIEVEMENT_TABLE_SQL,
    PET_ITEMS_TABLE_SQL
)


def _ensure_column(cursor: sqlite3.Cursor, table_name: str, column_name: str, definition: str):
    cursor.execute(f'PRAGMA table_info({table_name})')
    existing_columns = {row[1] for row in cursor.fetchall()}
    if column_name not in existing_columns:
        cursor.execute(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}')

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
        cursor.execute(WECHAT_TOKEN_CACHE_TABLE_SQL)
        cursor.execute(SUBSCRIPTION_ORDER_TABLE_SQL)
        cursor.execute(SUBSCRIPTION_HISTORY_TABLE_SQL)
        # Team/enterprise features
        cursor.execute(ORGANIZATION_TABLE_SQL)
        cursor.execute(TEAM_TABLE_SQL)
        cursor.execute(ORG_MEMBER_TABLE_SQL)
        cursor.execute(ORG_INVITATION_TABLE_SQL)
        cursor.execute(NOTIFICATION_EVENTS_TABLE_SQL)
        cursor.execute(TIME_APPROVAL_TABLE_SQL)
        cursor.execute(HABIT_TARGET_TABLE_SQL)
        cursor.execute(HABIT_CHECKIN_TABLE_SQL)
        cursor.execute(FLOW_BLOCK_TABLE_SQL)
        cursor.execute(INTERRUPTION_TABLE_SQL)
        cursor.execute(TEAM_FOCUS_SESSION_TABLE_SQL)
        cursor.execute(TEAM_FOCUS_MEMBER_TABLE_SQL)
        # melegal 可颂法务 tables
        cursor.execute(DEEP_FLOW_BLOCK_TABLE_SQL)
        cursor.execute(MELEGAL_DOCUMENTS_TABLE_SQL)
        cursor.execute(MELEGAL_REVIEW_ORDER_TABLE_SQL)
        # Tasks and Timeblocks
        cursor.execute(TASKS_TABLE_SQL)
        cursor.execute(TIMEBLOCKS_TABLE_SQL)
        # Virtual Pet
        cursor.execute(PET_TABLE_SQL)
        cursor.execute(PET_ITEMS_TABLE_SQL)
        # HR Gamification
        cursor.execute(TEAM_MEMBER_STAT_TABLE_SQL)
        cursor.execute(TEAM_ACHIEVEMENT_TABLE_SQL)
        _ensure_column(cursor, 'users', 'email', 'TEXT')
        cursor.execute(USER_PHONE_INDEX_SQL)
        cursor.execute(USER_EMAIL_INDEX_SQL)
        cursor.execute(USER_OPENID_INDEX_SQL)
        cursor.execute(ACTIVITY_USER_ID_INDEX_SQL)
        cursor.execute(VERIFICATION_CODE_PHONE_INDEX_SQL)
        conn.commit()
