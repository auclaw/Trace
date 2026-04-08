# TimeBlock Service
# 时间块服务 - 新增核心功能

from typing import List, Optional, Dict
from datetime import datetime, timedelta
from models.database_models import TimeBlock, Task
from utils.database import db
from services.task_service import TaskService


class TimeBlockService:
    @staticmethod
    def get_timeblocks_by_date(user_id: int, date: str) -> List[Dict]:
        """获取指定日期的所有时间块"""
        blocks = TimeBlock.query.filter_by(
            user_id=user_id,
            date=date
        ).order_by(TimeBlock.start_time).all()

        result = []
        for block in blocks:
            result.append({
                'id': block.id,
                'task_id': block.task_id,
                'user_id': block.user_id,
                'date': block.date,
                'start_time': block.start_time.isoformat(),
                'end_time': block.end_time.isoformat(),
                'duration_minutes': block.duration_minutes,
                'title': block.title,
                'notes': block.notes,
                'task_title': block.task.title if block.task else None
            })
        return result

    @staticmethod
    def create_timeblock(user_id: int, data: Dict) -> Optional[TimeBlock]:
        """创建时间块"""
        # 解析时间
        date = data['date']
        start_dt = datetime.fromisoformat(data['start_time'])
        end_dt = datetime.fromisoformat(data['end_time'])
        duration_minutes = int((end_dt - start_dt).total_seconds() / 60)

        block = TimeBlock(
            user_id=user_id,
            task_id=data.get('task_id'),
            date=date,
            start_time=start_dt,
            end_time=end_dt,
            duration_minutes=duration_minutes,
            title=data.get('title', ''),
            notes=data.get('notes', '')
        )
        db.session.add(block)
        db.session.commit()
        return block

    @staticmethod
    def update_timeblock(block_id: int, user_id: int, data: Dict) -> Optional[TimeBlock]:
        """更新时间块"""
        block = TimeBlock.query.filter_by(id=block_id, user_id=user_id).first()
        if not block:
            return None

        if 'start_time' in data:
            data['start_time'] = datetime.fromisoformat(data['start_time'])
        if 'end_time' in data:
            data['end_time'] = datetime.fromisoformat(data['end_time'])
            if 'start_time' in data:
                data['duration_minutes'] = int((data['end_time'] - data['start_time']).total_seconds() / 60)
            elif block.start_time:
                data['duration_minutes'] = int((data['end_time'] - block.start_time).total_seconds() / 60)

        for key, value in data.items():
            if hasattr(block, key) and value is not None:
                setattr(block, key, value)

        db.session.commit()
        return block

    @staticmethod
    def delete_timeblock(block_id: int, user_id: int) -> bool:
        """删除时间块"""
        block = TimeBlock.query.filter_by(id=block_id, user_id=user_id).first()
        if not block:
            return False
        db.session.delete(block)
        db.session.commit()
        return True

    @staticmethod
    def get_stats(user_id: int, date: str) -> Dict:
        """获取当日时间块统计"""
        blocks = TimeBlockService.get_timeblocks_by_date(user_id, date)
        total_duration = sum(b['duration_minutes'] for b in blocks)
        total_blocks = len(blocks)
        linked_to_tasks = sum(1 for b in blocks if b['task_id'] is not None)
        return {
            'total_duration_minutes': total_duration,
            'total_blocks': total_blocks,
            'linked_to_tasks': linked_to_tasks
        }

    @staticmethod
    def auto_add_buffer(start_dt: datetime, buffer_minutes: int = 15) -> datetime:
        """自动添加缓冲时间"""
        return start_dt + timedelta(minutes=buffer_minutes)
