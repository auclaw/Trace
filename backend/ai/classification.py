# Activity Classification
# 活动分类 AI 服务

from typing import Optional, List
from services.ai_client import AIClient


def classify_activity(app_name: str, window_title: str, existing_categories: List[str], custom_rules: str = '', provider: str = None) -> str:
    """
    对活动进行AI分类
    :param app_name: 应用名称
    :param window_title: 窗口标题
    :param existing_categories: 用户已有的分类列表
    :param custom_rules: 用户自定义的分类规则
    :return: 分类名称
    """
    prompt = f"""你是一个工作时间追踪分类助手。
请根据以下应用信息，判断这个活动应该分到哪个类别。

应用名称: {app_name}
窗口标题: {window_title}
用户已有分类: {', '.join(existing_categories)}
"""

    if custom_rules and custom_rules.strip():
        prompt += f"""
用户自定义分类规则（请优先遵循这些规则）:
{custom_rules}
"""

    prompt += """
请直接返回分类名称，如果能匹配已有分类就用已有分类，不能匹配就返回一个合适的新分类名称。
只返回分类名称，不要其他内容。
"""

    if provider:
        client = AIClient.get_instance(provider)
    else:
        client = AIClient.get_default_client()

    response = client.chat_completion(prompt)
    return response.strip() if response else '其他'


def suggest_category(title: str, description: str, provider: str = None) -> str:
    """为任务建议分类"""
    prompt = f"""请为以下任务建议一个分类标签：

任务标题: {title}
任务描述: {description}

直接返回分类名称，不要其他内容。
"""
    if provider:
        client = AIClient.get_instance(provider)
    else:
        client = AIClient.get_default_client()

    response = client.chat_completion(prompt)
    return response.strip() if response else '工作'
