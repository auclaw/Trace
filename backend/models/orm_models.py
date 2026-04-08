"""
SQLAlchemy ORM Models
对应数据库表的 ORM 模型定义
供服务层使用
"""
from datetime import datetime
from utils.database import db


class User(db.Model):
    """用户表"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    phone = db.Column(db.Text, unique=True)
    openid = db.Column(db.Text, unique=True)
    created_at = db.Column(db.DateTime)
    is_vip = db.Column(db.Integer)
    expire_at = db.Column(db.DateTime)


class Task(db.Model):
    """任务表"""
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.Text)
    estimated_minutes = db.Column(db.Integer, default=0)
    status = db.Column(db.Text, nullable=False, default='pending')  # pending, in_progress, completed, cancelled
    due_date = db.Column(db.Date)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now)

    user = db.relationship('User', backref='tasks')


class TimeBlock(db.Model):
    """时间块计划表"""
    __tablename__ = 'timeblocks'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    title = db.Column(db.Text, nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    category = db.Column(db.Text)
    notes = db.Column(db.Text)
    is_completed = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now)

    user = db.relationship('User', backref='timeblocks')
    task = db.relationship('Task', backref='timeblocks')


class Pet(db.Model):
    """虚拟宠物表"""
    __tablename__ = 'pets'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    pet_type = db.Column(db.Text, default='cat')  # cat, dog, rabbit
    name = db.Column(db.Text, default='Merize')
    level = db.Column(db.Integer, default=1)
    experience = db.Column(db.Integer, default=0)
    hunger = db.Column(db.Integer, default=100)  # 0-100
    mood = db.Column(db.Integer, default=100)  # 0-100
    coins = db.Column(db.Integer, default=0)  # 游戏币
    last_fed = db.Column(db.DateTime, default=datetime.now)
    last_interacted = db.Column(db.DateTime, default=datetime.now)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now)

    user = db.relationship('User', backref='pet')


class PetItem(db.Model):
    """宠物道具表"""
    __tablename__ = 'pet_items'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pet_id = db.Column(db.Integer, db.ForeignKey('pets.id'), nullable=False)
    item_type = db.Column(db.Text, nullable=False)  # food, toy, decoration
    item_key = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Integer, default=1)
    acquired_at = db.Column(db.DateTime, default=datetime.now)

    pet = db.relationship('Pet', backref='items')


class TeamMemberStat(db.Model):
    """团队成员统计表 - HR游戏化"""
    __tablename__ = 'team_member_stats'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    level = db.Column(db.Integer, default=1)
    experience = db.Column(db.Integer, default=0)
    points = db.Column(db.Integer, default=0)
    total_hours = db.Column(db.REAL, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now)

    __table_args__ = (
        db.UniqueConstraint('team_id', 'user_id', name='unique_team_user'),
    )


class TeamAchievement(db.Model):
    """团队成就表 - HR游戏化"""
    __tablename__ = 'team_achievements'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    achievement_key = db.Column(db.Text, nullable=False)
    achievement_name = db.Column(db.Text, nullable=False)
    unlocked_at = db.Column(db.DateTime, nullable=False)
    points_reward = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)

    __table_args__ = (
        db.UniqueConstraint('team_id', 'user_id', 'achievement_key', name='unique_team_user_achievement'),
    )


# 兼容旧引用
# 让原有代码可以继续导入
from typing import List, Dict
