# Team Service
# 团队服务

from typing import List, Optional, Dict
from models.database_models import Organization, Team, OrganizationMember
from utils.database import db


class TeamService:
    @staticmethod
    def get_user_organizations(user_id: int) -> List[Organization]:
        """获取用户参与的组织"""
        members = OrganizationMember.query.filter_by(user_id=user_id).all()
        orgs = []
        for m in members:
            orgs.append(m.organization)
        return orgs

    @staticmethod
    def get_organization_teams(org_id: int) -> List[Team]:
        """获取组织下的所有团队"""
        return Team.query.filter_by(org_id=org_id).order_by(Team.name).all()

    @staticmethod
    def create_organization(name: str, domain: str, admin_id: int, seat_count: int) -> Organization:
        """创建组织"""
        org = Organization(
            name=name,
            domain=domain,
            seat_count=seat_count,
            status='active'
        )
        db.session.add(org)
        db.session.flush()

        # 添加创建者为管理员
        member = OrganizationMember(
            organization_id=org.id,
            user_id=admin_id,
            role='admin',
            status='active'
        )
        db.session.add(member)
        db.session.commit()
        return org

    @staticmethod
    def create_team(org_id: int, name: str, lead_user_id: int) -> Team:
        """创建团队"""
        team = Team(
            org_id=org_id,
            name=name,
            lead_user_id=lead_user_id
        )
        db.session.add(team)
        db.session.commit()
        return team

    @staticmethod
    def add_member(org_id: int, user_id: int, role: str = 'member') -> bool:
        """添加成员到组织"""
        existing = OrganizationMember.query.filter_by(
            organization_id=org_id,
            user_id=user_id
        ).first()
        if existing:
            return False

        member = OrganizationMember(
            organization_id=org_id,
            user_id=user_id,
            role=role,
            status='active'
        )
        db.session.add(member)
        db.session.commit()
        return True
