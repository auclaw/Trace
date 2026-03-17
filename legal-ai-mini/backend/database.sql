-- 法律AI小工具 数据库结构
-- 创建数据库
CREATE DATABASE IF NOT EXISTS legal_ai DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE legal_ai;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
  nickname VARCHAR(100) DEFAULT '',
  avatar VARCHAR(255) DEFAULT '',
  is_vip TINYINT(1) DEFAULT 0 COMMENT '是否VIP',
  vip_expire DATETIME DEFAULT NULL COMMENT 'VIP过期时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_open_id(open_id),
  INDEX idx_is_vip(is_vip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 使用记录表
CREATE TABLE IF NOT EXISTS usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL COMMENT 'consult/review/generate',
  created_at DATE NOT NULL COMMENT '使用日期',
  created_at_full DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date(user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='使用记录日志';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  product_type VARCHAR(20) NOT NULL COMMENT 'month/year',
  amount DECIMAL(10,2) NOT NULL,
  status TINYINT(1) DEFAULT 0 COMMENT '0-待支付 1-已支付',
  paid_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user(user_id),
  INDEX idx_status(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
