# Task Service
# 任务服务

from typing import List, Optional, Dict
from datetime import datetime
from models.database_models import Task, User
from utils.database import db


class TaskService:
    @staticmethod
    def list_tasks(user_id: int, status: str = None) -> List[Dict]:
        """获取用户任务列表"""
        query = Task.query.filter_by(user_id=user_id)
        if status:
            query = query.filter_by(status=status)
        query = query.order_by(Task.due_date.asc(), Task.created_at.desc())
        tasks = query.all()
        return [TaskService.to_dict(task) for task in tasks]

    @staticmethod
    def get_task(task_id: int, user_id: int) -> Optional[Dict]:
        """获取单个任务"""
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        return TaskService.to_dict(task) if task else None

    @staticmethod
    def get_user_tasks(user_id: int, date: str = None) -> List[Task]:
        """获取用户任务列表，可按日期筛选"""
        query = Task.query.filter_by(user_id=user_id)
        if date:
            query = query.filter_by(date=date)
        return query.order_by(Task.priority.desc()).all()

    @staticmethod
    def create_task(user_id: int, data: Dict) -> Optional[Task]:
        """创建任务"""
        task = Task(
            user_id=user_id,
            title=data.get('title', ''),
            description=data.get('description', ''),
            priority=data.get('priority', 3),
            project=data.get('project', ''),
            estimated_minutes=data.get('estimated_minutes', 0),
            date=data.get('date', datetime.now().date().isoformat())
        )
        db.session.add(task)
        db.session.commit()
        return task

    @staticmethod
    def update_task(task_id: int, user_id: int, data: Dict) -> Optional[Task]:
        """更新任务"""
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return None

        for key, value in data.items():
            if hasattr(task, key) and value is not None:
                setattr(task, key, value)

        db.session.commit()
        return task

    @staticmethod
    def toggle_completed(task_id: int, user_id: int) -> Optional[Task]:
        """切换完成状态"""
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return None
        if task.status == 'completed':
            task.status = 'pending'
            task.completed_at = None
        else:
            task.status = 'completed'
            task.completed_at = datetime.now()
        db.session.commit()
        return task

    @staticmethod
    def delete_task(task_id: int, user_id: int) -> bool:
        """删除任务"""
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return False
        db.session.delete(task)
        db.session.commit()
        return True

    @staticmethod
    def get_stats(user_id: int, date: str) -> Dict:
        """获取任务统计"""
        tasks = Task.query.filter_by(user_id=user_id, date=date).all()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == 'completed')
        estimated_total = sum(t.estimated_minutes for t in tasks)
        return {
            'total': total,
            'completed': completed,
            'estimated_total_minutes': estimated_total
        }

    @staticmethod
    def to_dict(task: Task) -> Dict:
        """转换为字典"""
        return {
            'id': task.id,
            'user_id': task.user_id,
            'title': task.title,
            'description': task.description,
            'category': task.category,
            'estimated_minutes': task.estimated_minutes,
            'status': task.status,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'created_at': task.created_at.isoformat() if task.created_at else None,
            'updated_at': task.updated_at.isoformat() if task.updated_at else None,
        }
