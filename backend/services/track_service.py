# Tracking Service
# 追踪服务

from typing import List, Dict
from datetime import datetime, timedelta
from models.database_models import Activity, User
from utils.database import db


class TrackService:
    @staticmethod
    def get_activities_by_date(user_id: int, date: str) -> List[Dict]:
        """获取指定日期的活动"""
        start = datetime.fromisoformat(f"{date}T00:00:00")
        end = datetime.fromisoformat(f"{date}T23:59:59")
        activities = Activity.query.filter(
            Activity.user_id == user_id,
            Activity.start_time >= start,
            Activity.start_time <= end
        ).order_by(Activity.start_time.asc()).all()

        result = []
        for a in activities:
            result.append({
                'id': a.id,
                'start_time': a.start_time.isoformat(),
                'end_time': a.end_time.isoformat(),
                'category': a.category,
                'app_name': a.app_name,
                'window_title': a.window_title,
                'duration_minutes': int((a.end_time - a.start_time).total_seconds() / 60)
            })
        return result

    @staticmethod
    def get_total_duration(user_id: int, date: str) -> int:
        """获取指定日期总追踪时长（分钟）"""
        activities = TrackService.get_activities_by_date(user_id, date)
        return sum(a['duration_minutes'] for a in activities)

    @staticmethod
    def create_activity(user_id: int, data: Dict) -> Activity:
        """创建活动记录"""
        activity = Activity(
            user_id=user_id,
            start_time=datetime.fromisoformat(data['start_time']),
            end_time=datetime.fromisoformat(data['end_time']),
            category=data.get('category'),
            app_name=data.get('app_name'),
            window_title=data.get('window_title')
        )
        db.session.add(activity)
        db.session.commit()
        return activity

    @staticmethod
    def update_activity(activity_id: int, user_id: int, data: Dict) -> Activity | None:
        """更新活动"""
        activity = Activity.query.filter_by(id=activity_id, user_id=user_id).first()
        if not activity:
            return None
        for key, value in data.items():
            if hasattr(activity, key) and value is not None:
                if key in ['start_time', 'end_time']:
                    value = datetime.fromisoformat(value)
                setattr(activity, key, value)
        db.session.commit()
        return activity

    @staticmethod
    def delete_activity(activity_id: int, user_id: int) -> bool:
        """删除活动"""
        activity = Activity.query.filter_by(id=activity_id, user_id=user_id).first()
        if not activity:
            return False
        db.session.delete(activity)
        db.session.commit()
        return True

    @staticmethod
    def get_category_stats(user_id: int, start_date: str, end_date: str) -> List[Dict]:
        """按分类统计时长"""
        start = datetime.fromisoformat(f"{start_date}T00:0:00")
        end = datetime.fromisoformat(f"{end_date}T23:59:59")
        activities = Activity.query.filter(
            Activity.user_id == user_id,
            Activity.start_time >= start,
            Activity.start_time <= end
        ).all()

        stats: Dict[str, float] = {}
        for a in activities:
            duration = (a.end_time - a.start_time).total_seconds() / 3600
            category = a.category or '未分类'
            stats[category] = stats.get(category, 0) + duration

        result = []
        for category, hours in stats.items():
            result.append({
                'category': category,
                'hours': round(hours, 2)
            })
        return sorted(result, key=lambda x: x['hours'], reverse=True)
