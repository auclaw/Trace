"""
数据库操作
"""

import pymysql
from config import Config

class Database:
    def __init__(self):
        self.conn = pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASS,
            database=Config.DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
    
    def get_user_by_openid(self, open_id):
        """根据openid获取用户"""
        with self.conn.cursor() as cursor:
            sql = "SELECT * FROM users WHERE open_id = %s"
            cursor.execute(sql, (open_id,))
            return cursor.fetchone()
    
    def create_user(self, open_id, nickname='', avatar=''):
        """创建新用户"""
        with self.conn.cursor() as cursor:
            sql = "INSERT INTO users (open_id, nickname, avatar) VALUES (%s, %s, %s)"
            cursor.execute(sql, (open_id, nickname, avatar))
            self.conn.commit()
            return cursor.lastrowid
    
    def get_remaining_today(self, user_id):
        """获取用户今日剩余免费次数"""
        import datetime
        today = datetime.date.today().strftime('%Y-%m-%d')
        
        with self.conn.cursor() as cursor:
            sql = "SELECT COUNT(*) as count FROM usage_logs WHERE user_id = %s AND created_at = %s"
            cursor.execute(sql, (user_id, today))
            result = cursor.fetchone()
            count = result['count']
        
        user = self.get_user_by_id(user_id)
        if user['is_vip']:
            return 999  # VIP不限次
        
        return max(0, 1 - count)  # 免费用户每天1次
    
    def add_usage(self, user_id, action_type):
        """记录使用"""
        import datetime
        today = datetime.date.today().strftime('%Y-%m-%d')
        
        with self.conn.cursor() as cursor:
            sql = "INSERT INTO usage_logs (user_id, action_type, created_at) VALUES (%s, %s, %s)"
            cursor.execute(sql, (user_id, action_type, today))
            self.conn.commit()
            return True
    
    def get_user_by_id(self, user_id):
        """根据ID获取用户"""
        with self.conn.cursor() as cursor:
            sql = "SELECT * FROM users WHERE id = %s"
            cursor.execute(sql, (user_id,))
            return cursor.fetchone()
    
    def update_user_vip(self, user_id, is_vip, expire_date):
        """更新用户VIP状态"""
        with self.conn.cursor() as cursor:
            sql = "UPDATE users SET is_vip = %s, vip_expire = %s WHERE id = %s"
            cursor.execute(sql, (is_vip, expire_date, user_id))
            self.conn.commit()
            return True
    
    def create_order(self, order_no, user_id, product_type, amount):
        """创建订单"""
        with self.conn.cursor() as cursor:
            sql = "INSERT INTO orders (order_no, user_id, product_type, amount) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (order_no, user_id, product_type, amount))
            self.conn.commit()
            return cursor.lastrowid
    
    def get_order(self, order_no):
        """获取订单"""
        with self.conn.cursor() as cursor:
            sql = "SELECT * FROM orders WHERE order_no = %s"
            cursor.execute(sql, (order_no,))
            return cursor.fetchone()
    
    def update_order_paid(self, order_no):
        """更新订单为已支付"""
        import datetime
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        with self.conn.cursor() as cursor:
            sql = "UPDATE orders SET status = 1, paid_at = %s WHERE order_no = %s"
            cursor.execute(sql, (now, order_no))
            self.conn.commit()
            return True
    
    def close(self):
        self.conn.close()

# 单例
db = Database()
