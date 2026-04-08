# Data Sync Core Service
# 数据同步核心服务

from datetime import datetime, timedelta
from models.database_models import Activity, User
from utils.database import db


def sync_local_activities(user_id: int, activities: list) -> dict:
    """同步本地活动数据到云端"""
    try:
        for activity_data in activities:
            # 检查是否已存在，存在更新，不存在创建
            existing = Activity.query.filter_by(
                user_id=user_id,
                start_time=datetime.fromisoformat(activity_data['start_time'])
            ).first()

            if existing:
                existing.end_time = datetime.fromisoformat(activity_data['end_time'])
                existing.category = activity_data.get('category')
                existing.app_name = activity_data.get('app_name')
                existing.window_title = activity_data.get('window_title')
            else:
                new_activity = Activity(
                    user_id=user_id,
                    start_time=datetime.fromisoformat(activity_data['start_time']),
                    end_time=datetime.fromisoformat(activity_data['end_time']),
                    category=activity_data.get('category'),
                    app_name=activity_data.get('app_name'),
                    window_title=activity_data.get('window_title')
                )
                db.session.add(new_activity)

        db.session.commit()
        return {'success': True, 'synced_count': len(activities)}
    except Exception as e:
        db.session.rollback()
        return {'success': False, 'error': str(e)}


def get_activities_since(user_id: int, since_datetime: datetime) -> list:
    """获取从某个时间点之后的活动数据"""
    activities = Activity.query.filter(
        Activity.user_id == user_id,
        Activity.start_time >= since_datetime
    ).order_by(Activity.start_time.asc()).all()

    result = []
    for activity in activities:
        result.append({
            'id': activity.id,
            'start_time': activity.start_time.isoformat(),
            'end_time': activity.end_time.isoformat(),
            'category': activity.category,
            'app_name': activity.app_name,
            'window_title': activity.window_title
        })
    return result
