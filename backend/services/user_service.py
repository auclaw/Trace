# User Service
# 用户服务

from typing import Optional, Dict
from models.database_models import User
from utils.database import db
from core.auth import create_token


class UserService:
    @staticmethod
    def get_by_id(user_id: int) -> Optional[User]:
        return User.query.get(user_id)

    @staticmethod
    def get_by_phone(phone: str) -> Optional[User]:
        return User.query.filter_by(phone=phone).first()

    @staticmethod
    def create_user(phone: str) -> User:
        user = User(phone=phone)
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def login(user: User) -> Dict:
        """用户登录，返回token"""
        token = create_token(user.id)
        return {
            'token': token,
            'user_id': user.id,
            'plan': user.plan
        }

    @staticmethod
    def update_plan(user_id: int, plan: str) -> bool:
        user = User.query.get(user_id)
        if not user:
            return False
        user.plan = plan
        db.session.commit()
        return True
