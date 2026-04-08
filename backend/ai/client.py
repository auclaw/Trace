# Volcano Engine AI Client
# 统一火山引擎 API 客户端

import json
import hashlib
import hmac
import base64
import requests
from datetime import datetime
from config.settings import (
    VOLC_API_KEY,
    VOLC_API_SECRET,
    VOLC_ENDPOINT,
    MODEL_CONFIG
)


class VolcanoClient:
    def __init__(self):
        self.api_key = VOLC_API_KEY
        self.api_secret = VOLC_API_SECRET
        self.endpoint = VOLC_ENDPOINT
        self.model_config = MODEL_CONFIG

    def _sign(self, date: str, body: str) -> str:
        """签名"""
        signed_string = f"date: {date}\n"
        signed_string += f"content-sha256: {hashlib.sha256(body.encode()).hexdigest()}"
        signature = hmac.new(
            self.api_secret.encode(),
            signed_string.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature

    def chat_completion(self, model_key: str, messages: list, temperature: float = 0.7) -> dict:
        """调用聊天 completion"""
        model = self.model_config.get(model_key)
        if not model:
            model = self.model_config['analysis']

        date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
        body = json.dumps({
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": False
        })

        signature = self._sign(date, body)

        headers = {
            'Authorization': f'HmacSHA256 {self.api_key}:{signature}',
            'X-Date': date,
            'Content-Type': 'application/json'
        }

        response = requests.post(
            f"{self.endpoint}/chat/completions",
            headers=headers,
            data=body
        )
        response.raise_for_status()
        return response.json()

    def get_response_text(self, model_key: str, messages: list) -> str | None:
        """获取响应文本"""
        try:
            result = self.chat_completion(model_key, messages)
            if 'choices' in result and len(result['choices']) > 0:
                return result['choices'][0]['message']['content']
            return None
        except Exception as e:
            print(f"Volcano API error: {e}")
            return None


# 全局单例
volcano_client = VolcanoClient()
