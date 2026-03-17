#!/usr/bin/env python3
"""
生成小红书格式的星座日运图文
输出：
1. 封面文案
2. 12星座每页文案，方便做成9图/13图（封面+12星座）
你可以用这个输出直接做图，Canva就能做
"""

import sys
import os
from datetime import datetime

def load_daily_content(date_str):
    """加载日运内容"""
    path = f"./content/daily/{date_str}.md"
    if not os.path.exists(path):
        print(f"文件不存在: {path}")
        return None
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    return content

def parse_content(content):
    """解析内容，提取每个星座运势"""
    lines = content.split('\n')
    zodiacs = []
    current_zodiac = None
    current_text = []
    
    zodiac_names = {
        '♈': '白羊座',
        '♉': '金牛座', 
        '♊': '双子座',
        '♋': '巨蟹座',
        '♌': '狮子座',
        '♍': '处女座',
        '♎': '天秤座',
        '♏': '天蝎座',
        '♐': '射手座',
        '♑': '摩羯座',
        '♒': '水瓶座',
        '♓': '双鱼座',
    }
    
    for line in lines:
        if line.startswith('###') and any(em in line for em in zodiac_names):
            if current_zodiac:
                zodiacs.append({
                    'icon': current_zodiac,
                    'name': zodiac_names[current_zodiac[0]],
                    'text': '\n'.join(current_text).strip()
                })
            # 开始新星座
            em = line.split()[1][0]
            current_zodiac = em
            current_text = [line.split(' ', 2)[2] if len(line.split(' ', 2))>2 else '']
        elif current_zodiac:
            current_text.append(line.strip())
    
    if current_zodiac and current_text:
        zodiacs.append({
            'icon': current_zodiac,
            'name': zodiac_names[current_zodiac[0]],
            'text': '\n'.join(current_text).strip()
        })
    
    return zodiacs

def generate_xiaohongshu(date_str):
    """生成小红书格式"""
    content = load_daily_content(date_str)
    if not content:
        return
    
    zodiacs = parse_content(content)
    if not zodiacs:
        print("没有解析到星座内容")
        return
    
    # 提取日期
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    month = dt.month
    day = dt.day
    
    print("\n" + "="*50)
    print(f"📱 小红书 {month}月{day}日 日运 图文输出")
    print("="*50 + "\n")
    
    # 封面
    print("## 🎨 封面页")
    print("```")
    print(f"✨ 今日运势 ✨")
    print(f"{month}月{day}日")
    print("☀️ 你的今日星座运势来啦")
    print("```\n")
    
    # 每个星座一页
    print("## 📄 星座分页（每页一个星座）\n")
    for i, z in enumerate(zodiacs, 1):
        print(f"### 第 {i} 页：{z['icon']} {z['name']}")
        print("```")
        print(f"{z['icon']} {z['name']}")
        print("")
        print(z['text'])
        print("```\n")
    
    # 正文文案
    print("## 📝 小红书正文文案（直接复制）\n")
    print("```")
    print(f"{month}月{day}日运势来啦✨\n")
    print("今天星象提示放在开头啦👉 ")
    # 提取星象提示
    first_line = content.split('\n')[0]
    if '💫' in first_line:
        print(first_line.replace('# 今日运势','').strip() + "\n")
    print("留下你的星座，接今日好运哦🍀")
    print("#星座运势 #每日运势 #今日运势 #星座博主 #小红书星座")
    print("```")
    
    print("\n✅ 生成完成！可以直接复制这些文案去Canva做图了")
    print("建议：封面+12个星座 一共13图，小红书推荐9图的话可以放前8个星座+封面")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("用法: python generate-xiaohongshu.py 2026-03-18")
        sys.exit(1)
    
    date_str = sys.argv[1]
    generate_xiaohongshu(date_str)
