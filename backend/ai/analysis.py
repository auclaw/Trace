# Efficiency Analysis
# AI 效率分析服务

from typing import List, Dict
from datetime import datetime
from .client import volcano_client


def generate_daily_insights(daily_data: Dict) -> str:
    """生成每日个性化效率洞察"""
    total_minutes = daily_data.get('total_minutes', 0)
    by_category = daily_data.get('by_category', [])
    focus_sessions = daily_data.get('focus_sessions', 0)
    total_focus_minutes = daily_data.get('total_focus_minutes', 0)

    category_str = "\n".join([f"- {cat['category']}: {cat['minutes']/60:.1f}小时" for cat in by_category[:8]])

    prompt = f"""请作为一个专业的AI效率教练，根据我今天的数据生成个性化的效率洞察和建议。

今日数据：
- 总记录工时：{total_minutes/60:.1f}小时
- 完成专注番茄：{focus_sessions} 个，共 {total_focus_minutes} 分钟
- 分类工时分布：
{category_str}

请给我：
1. 一句话整体评价
2. 一个值得肯定的优点
3. 一个具体可操作的改进建议
保持简洁，总共不超过200字，中文。
"""

    response = volcano_client.get_response_text('analysis', [
        {"role": "user", "content": prompt}
    ])
    return response if response else "无法生成今日洞察"


def generate_weekly_report(weekly_data: Dict) -> str:
    """生成每周效率报告"""
    total_hours = weekly_data.get('total_hours', 0)
    by_category = weekly_data.get('by_category', [])
    tasks_completed = weekly_data.get('tasks_completed', 0)
    tasks_total = weekly_data.get('tasks_total', 0)

    category_str = "\n".join([f"- {cat['category']}: {cat['hours']}小时" for cat in by_category[:10]])

    prompt = f"""请作为一个专业的效率教练，根据我一周的数据生成一份简洁的效率分析报告。

一周数据：
- 总记录工时：{total_hours:.1f}小时
- 完成任务：{tasks_completed}/{tasks_total}
- 分类工时分布：
{category_str}

请给我：
1. 整体评价
2. 优点肯定
3. 可以改进的具体建议
4. 下周行动建议

语言要简洁专业，中文，不超过500字。
"""

    response = volcano_client.get_response_text('analysis', [
        {"role": "user", "content": prompt}
    ])
    return response if response else "无法生成分析报告"


def suggest_timeblock_schedule(tasks: List[Dict], total_hours_available: float) -> List[Dict]:
    """AI 建议时间块安排"""
    tasks_str = "\n".join([
        f"- {t['title']}, 预估{t.get('estimated_minutes', 0)}分钟" for t in tasks
    ])

    prompt = f"""我今天有以下任务需要安排，请帮我建议一个合理的时间块安排。

任务列表：
{tasks_str}

今天可用总时间：{total_hours_available}小时

请返回JSON格式，每个时间块包含：title, start_time(HH:MM), duration_minutes, notes
不要其他内容，只返回合法JSON数组。
"""

    response = volcano_client.get_response_text('complex', [
        {"role": "user", "content": prompt}
    ])

    if not response:
        return []

    try:
        # 清理返回，提取JSON
        import json
        response = response.strip()
        if response.startswith('```json'):
            response = response[7:-3]
        return json.loads(response)
    except Exception as e:
        print(f"Parse AI suggestion error: {e}")
        return []


def analyze_personal_efficiency(profile: Dict) -> str:
    """生成个人效率画像分析"""
    prompt = f"""基于我的数据生成个人效率画像分析：

- 每周平均工时：{profile.get('avg_weekly_hours', 0):.1f}小时
- 专注时段分布：{profile.get('peak_hours', '[]')}
- 任务完成率：{profile.get('completion_rate', 0)*100:.0f}%
- 平均专注时长：{profile.get('avg_focus_duration', 0):.0f}分钟

请分析我的效率特点，给具体改进建议，中文，300字以内。
"""

    response = volcano_client.get_response_text('analysis', [
        {"role": "user", "content": prompt}
    ])
    return response if response else "无法生成分析"
