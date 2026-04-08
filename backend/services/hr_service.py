# HR Gameification Service
# HR 游戏化服务 - 团队等级/成就/积分

from typing import List, Optional, Dict
from datetime import datetime
from models.database_models import TeamMemberStat, TeamAchievement, User
from utils.database import db
from services.pet_service import PetService


class HRService:
    @staticmethod
    def get_or_create_member_stat(team_id: int, user_id: int) -> TeamMemberStat:
        """获取或创建成员统计"""
        stat = TeamMemberStat.query.filter_by(
            team_id=team_id,
            user_id=user_id
        ).first()
        if stat:
            return stat

        stat = TeamMemberStat(
            team_id=team_id,
            user_id=user_id,
            level=1,
            experience=0,
            points=0,
            total_hours=0
        )
        db.session.add(stat)
        db.session.commit()
        return stat

    @staticmethod
    def add_experience(team_id: int, user_id: int, hours: float) -> Dict:
        """添加经验（工时转换）"""
        stat = HRService.get_or_create_member_stat(team_id, user_id)
        exp_gain = int(hours * 10)  # 1小时 = 10经验
        points_gain = int(hours * 5)  # 1小时 = 5积分
        stat.experience += exp_gain
        stat.points += points_gain
        stat.total_hours += hours

        # 检查升级
        leveled_up = False
        required_exp = stat.level * 100
        while stat.experience >= required_exp:
            stat.experience -= required_exp
            stat.level += 1
            leveled_up = True
            required_exp = stat.level * 100

        db.session.commit()
        return {
            'success': True,
            'exp_gained': exp_gain,
            'points_gained': points_gain,
            'leveled_up': leveled_up,
            'new_level': stat.level,
            'stat': HRService.to_dict(stat)
        }

    @staticmethod
    def spend_points(team_id: int, user_id: int, points: int) -> bool:
        """消费积分"""
        stat = HRService.get_or_create_member_stat(team_id, user_id)
        if stat.points < points:
            return False
        stat.points -= points
        db.session.commit()
        return True

    @staticmethod
    def unlock_achievement(team_id: int, user_id: int, achievement_key: str, achievement_name: str) -> bool:
        """解锁成就"""
        existing = TeamAchievement.query.filter_by(
            team_id=team_id,
            user_id=user_id,
            achievement_key=achievement_key
        ).first()
        if existing:
            return False  # 已解锁

        achievement = TeamAchievement(
            team_id=team_id,
            user_id=user_id,
            achievement_key=achievement_key,
            achievement_name=achievement_name,
            unlocked_at=datetime.now()
        )
        db.session.add(achievement)
        db.session.commit()
        return True

    @staticmethod
    def get_weekly_ranking(team_id: int, start_date: str, end_date: str) -> List[Dict]:
        """获取每周排行榜"""
        # 这简化实现，实际按每周工时排序
        # 实际需要按周分组统计，这里简化返回按总工时排序
        from sqlalchemy import desc
        stats = TeamMemberStat.query.filter_by(team_id=team_id).order_by(desc(TeamMemberStat.total_hours)).all()

        result = []
        for stat in stats:
            user = User.query.get(stat.user_id)
            result.append({
                'user_id': stat.user_id,
                'user_name': user.phone if user else 'Unknown',
                'level': stat.level,
                'points': stat.points,
                'total_hours': round(stat.total_hours, 1),
                'experience': stat.experience
            })
        return result

    @staticmethod
    def to_dict(stat: TeamMemberStat) -> Dict:
        return {
            'id': stat.id,
            'team_id': stat.team_id,
            'user_id': stat.user_id,
            'level': stat.level,
            'experience': stat.experience,
            'points': stat.points,
            'total_hours': round(stat.total_hours, 1),
            'exp_to_next_level': stat.level * 100 - stat.experience
        }
