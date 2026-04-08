# Pet Service
# 虚拟宠物服务 - 新增核心功能

from typing import Optional, Dict
from datetime import datetime
from models.database_models import Pet, User
from utils.database import db


class PetService:
    @staticmethod
    def get_or_create(user_id: int) -> Pet:
        """获取用户宠物，如果没有则创建默认猫咪"""
        pet = Pet.query.filter_by(user_id=user_id).first()
        if pet:
            return pet

        # 创建默认猫咪宠物
        pet = Pet(
            user_id=user_id,
            pet_type='cat',
            name='小橙',
            level=1,
            experience=0,
            mood=100,
            hunger=100,
            coins=0
        )
        db.session.add(pet)
        db.session.commit()
        return pet

    @staticmethod
    def add_experience(user_id: int, minutes: int) -> Dict:
        """添加经验（专注分钟数转换）"""
        pet = PetService.get_or_create(user_id)
        exp_gain = minutes  # 1分钟 = 1经验
        pet.experience += exp_gain

        # 检查升级
        leveled_up = False
        required_exp = pet.level * 100  # 每级需要 100 * level 经验
        while pet.experience >= required_exp:
            pet.experience -= required_exp
            pet.level += 1
            leveled_up = True
            required_exp = pet.level * 100

        db.session.commit()
        return {
            'success': True,
            'exp_gained': exp_gain,
            'leveled_up': leveled_up,
            'new_level': pet.level,
            'current_exp': pet.experience,
            'pet': PetService.to_dict(pet)
        }

    @staticmethod
    def change_mood(pet: Pet, delta: int) -> None:
        """改变心情"""
        pet.mood = max(0, min(100, pet.mood + delta))

    @staticmethod
    def change_hunger(pet: Pet, delta: int) -> None:
        """改变饱食度"""
        pet.hunger = max(0, min(100, pet.hunger + delta))

    @staticmethod
    def feed(pet_id: int, user_id: int, food_type: str) -> Optional[Dict]:
        """喂食，消耗金币"""
        # 定义食物
        food = {
            'fish': {'hunger': +30, 'mood': +10, 'cost': 5},
            'milk': {'hunger': +20, 'mood': +15, 'cost': 3},
            'treat': {'hunger': +10, 'mood': +25, 'cost': 2}
        }

        if food_type not in food:
            return None

        pet = Pet.query.filter_by(id=pet_id, user_id=user_id).first()
        if not pet:
            return None

        if pet.coins < food[food_type]['cost']:
            return {'success': False, 'reason': '金币不足'}

        pet.coins -= food[food_type]['cost']
        PetService.change_hunger(pet, food[food_type]['hunger'])
        PetService.change_mood(pet, food[food_type]['mood'])
        db.session.commit()

        return {
            'success': True,
            'pet': PetService.to_dict(pet),
            'coins_left': pet.coins
        }

    @staticmethod
    def interact(pet_id: int, user_id: int) -> Optional[Dict]:
        """互动：摸头，增加心情"""
        pet = Pet.query.filter_by(id=pet_id, user_id=user_id).first()
        if not pet:
            return None

        PetService.change_mood(pet, +5)
        db.session.commit()
        return {
            'success': True,
            'pet': PetService.to_dict(pet)
        }

    @staticmethod
    def award_coins(user_id: int, amount: int) -> int:
        """奖励金币（完成任务给金币）"""
        pet = PetService.get_or_create(user_id)
        pet.coins += amount
        db.session.commit()
        return pet.coins

    @staticmethod
    def penalize_mood(pet: Pet, distraction_minutes: int) -> None:
        """分心扣心情"""
        # 每分钟分心扣 0.5 心情
        delta = -int(distraction_minutes * 0.5)
        PetService.change_mood(pet, delta)
        PetService.change_hunger(pet, -int(distraction_minutes * 0.2))
        db.session.commit()

    @staticmethod
    def to_dict(pet: Pet) -> Dict:
        return {
            'id': pet.id,
            'pet_type': pet.pet_type,
            'name': pet.name,
            'level': pet.level,
            'experience': pet.experience,
            'mood': pet.mood,
            'hunger': pet.hunger,
            'coins': pet.coins,
            'exp_to_next_level': pet.level * 100 - pet.experience
        }
