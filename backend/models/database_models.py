"""
Database table definitions
"""

# Users table schema
USER_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    openid TEXT UNIQUE,
    created_at TIMESTAMP,
    is_vip INTEGER,
    expire_at TIMESTAMP
)
'''

# Activities table schema
ACTIVITY_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    window_title TEXT,
    application TEXT,
    url TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    category TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# Verification codes table schema (for SMS verification)
VERIFICATION_CODE_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expire_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
'''

# Subscription orders table schema (for payment orders)
SUBSCRIPTION_ORDER_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS subscription_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    plan_type TEXT NOT NULL, -- 'monthly' or 'yearly'
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'CNY',
    status TEXT NOT NULL, -- 'pending', 'paid', 'cancelled', 'expired'
    days INTEGER NOT NULL, -- Number of subscription days (30 or 365)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    expired_at TIMESTAMP NULL,
    transaction_id TEXT NULL,
    notify_data TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# Subscription events history table schema (track subscription changes)
SUBSCRIPTION_HISTORY_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS subscription_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL, -- 'trial_start', 'subscription_start', 'subscription_renew', 'subscription_expire', 'cancelled'
    order_id INTEGER NULL,
    previous_expire_at TIMESTAMP NULL,
    new_expire_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (order_id) REFERENCES subscription_orders (id)
)
'''
