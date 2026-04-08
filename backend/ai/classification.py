# Activity Classification
# 活动分类 AI 服务

from typing import Optional, List
from .client import volcano_client


def classify_activity(app_name: str, window_title: str, existing_categories: List[str]) -> str:
    """
    对活动进行AI分类
    :param app_name: 应用名称
    :param window_title: 窗口标题
    :param existing_categories: 用户已有的分类列表
    :return: 分类名称
    """
    prompt = f"""你是一个工作时间追踪分类助手。
请根据以下应用信息，判断这个活动应该分到哪个类别。

应用名称: {app_name}
窗口标题: {window_title}
用户已有分类: {', '.join(existing_categories)}

请直接返回分类名称，如果能匹配已有分类就用已有分类，不能匹配就返回一个合适的新分类名称。
只返回分类名称，不要其他内容。
"""

    response = volcano_client.get_response_text('classification', [
        {"role": "user", "content": prompt}
    ])
    return response.strip() if response else '未分类'


def suggest_category(title: str, description: str) -> str:
    """为任务建议分类"""
    prompt = f"""请为以下任务建议一个分类标签：

任务标题: {title}
任务描述: {description}

直接返回分类名称，不要其他内容。
"""
    response = volcano_client.get_response_text('analysis', [
        {"role": "user", "content": prompt}
    ])
    return response.strip() if response else '工作'
