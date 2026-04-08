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
    org_id INTEGER,
    team_id INTEGER,
    window_title TEXT,
    application TEXT,
    url TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    category TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (org_id) REFERENCES organizations (id),
    FOREIGN KEY (team_id) REFERENCES teams (id)
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

# Organization table (for enterprise/team version)
ORGANIZATION_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    admin_user_id INTEGER NOT NULL,
    domain TEXT,
    seat_count INTEGER NOT NULL,
    billing_cycle TEXT NOT NULL, -- 'monthly' or 'yearly'
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users (id)
)
'''

# Team table (within organization)
TEAM_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    lead_user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations (id),
    FOREIGN KEY (lead_user_id) REFERENCES users (id)
)
'''

# Organization member table
ORG_MEMBER_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS org_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id INTEGER NOT NULL,
    team_id INTEGER,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'lead', 'member'
    status TEXT NOT NULL, -- 'pending', 'active', 'suspended'
    invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations (id),
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# Weekly time approval table (member submits, lead approves)
TIME_APPROVAL_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS time_approval (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    org_id INTEGER NOT NULL,
    week_start DATE NOT NULL,
    status TEXT NOT NULL, -- 'draft', 'submitted', 'approved', 'rejected'
    submitted_at DATETIME,
    approved_at DATETIME,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
'''

# Habit target table (daily deep work target)
HABIT_TARGET_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS habit_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_hours REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
'''

# Habit checkin table (daily checkin)
HABIT_CHECKIN_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS habit_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    checkin_date DATE NOT NULL,
    actual_hours REAL NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habit_targets (id)
)
'''

# Flow block (distracting websites blocking)
FLOW_BLOCK_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS flow_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    domain TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
'''

# Interruption record (statistics)
INTERRUPTION_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS interruptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    interrupt_time DATETIME NOT NULL,
    source TEXT NOT NULL, -- 'chat', 'email', 'meeting', 'other'
    recovery_minutes REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
'''

# Team focus session (sync focus time)
TEAM_FOCUS_SESSION_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS team_focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status TEXT NOT NULL, -- 'active', 'finished'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (creator_id) REFERENCES users (id)
)
'''

# Deep flow block record (statistics for deep work analysis)
DEEP_FLOW_BLOCK_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS deep_flow_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# Team focus session membership
TEAM_FOCUS_MEMBER_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS team_focus_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'focusing', 'break', 'finished'
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES team_focus_sessions (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# melegal - 可颂法务: 法律文书表
MELEGAL_DOCUMENTS_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS melegal_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scene_id TEXT NOT NULL,
    answers TEXT NOT NULL, -- JSON of user answers
    content TEXT NOT NULL, -- generated document content
    status TEXT NOT NULL, -- 'generating', 'reviewing', 'done', 'failed'
    package_type TEXT NOT NULL, -- 'basic', 'pro', 'premium'
    price DECIMAL(10,2) NOT NULL,
    reviewer_id INTEGER NULL, -- lawyer user id if reviewed
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# melegal - 律师复核订单表
MELEGAL_REVIEW_ORDER_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS melegal_review_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    lawyer_id INTEGER NULL,
    status TEXT NOT NULL, -- 'pending', 'assigned', 'completed', 'cancelled'
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    notes TEXT NULL,
    FOREIGN KEY (document_id) REFERENCES melegal_documents (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# Tasks table (任务管理)
TASKS_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    estimated_minutes INTEGER DEFAULT 0,
    status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'cancelled'
    due_date DATE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# Timeblocks table (时间块计划)
TIMEBLOCKS_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS timeblocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT,
    notes TEXT,
    is_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (task_id) REFERENCES tasks (id)
)
'''

# Virtual Pet table (虚拟宠物)
PET_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    pet_type TEXT DEFAULT 'cat', -- 'cat', 'dog', 'rabbit'
    name TEXT DEFAULT 'Merize',
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    hunger INTEGER DEFAULT 100, -- 0-100
    mood INTEGER DEFAULT 100, -- 0-100
    coins INTEGER DEFAULT 0, -- 游戏币
    last_fed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interacted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
'''

# Team Member Statistics (HR游戏化 - 成员统计)
TEAM_MEMBER_STAT_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS team_member_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    total_hours REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(team_id, user_id)
)
'''

# Team Achievement (HR游戏化 - 成就解锁)
TEAM_ACHIEVEMENT_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS team_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    achievement_key TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    unlocked_at TIMESTAMP NOT NULL,
    points_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(team_id, user_id, achievement_key)
)
'''

# Pet items table (宠物道具/物品)
PET_ITEMS_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS pet_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    item_type TEXT NOT NULL, -- 'food', 'toy', 'decoration'
    item_key TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets (id)
)
'''
