"""
AI Client - Unified interface for ERNIE and Doubao
Singleton pattern to avoid recreating client for each request
"""
from openai import OpenAI
from config.settings import ERNIE_API_KEY, DOUBAN_API_KEY
from utils.logger import setup_logger

logger = setup_logger()

class AIClient:
    """Unified AI client supporting multiple providers"""

    _instances = {}

    def __init__(self, provider: str):
        """
        Initialize AI client
        :param provider: "ernie" or "doubao"
        """
        self.provider = provider

        if provider == 'ernie':
            api_key = ERNIE_API_KEY
            base_url = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions"
            self.default_model = "ERNIE-Bot-4"
        elif provider == 'doubao':
            api_key = DOUBAN_API_KEY
            base_url = "https://aip.volcengineapi.com/v1/chat/completions"
            self.default_model = "doubao-4k"
        else:
            raise ValueError(f"Unknown provider: {provider}")

        if not api_key:
            raise ValueError(f"API key not set for provider: {provider}")

        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )

    @classmethod
    def get_instance(cls, provider: str) -> 'AIClient':
        """Get singleton instance"""
        if provider not in cls._instances:
            cls._instances[provider] = cls(provider)
        return cls._instances[provider]

    def chat_completion(self, prompt: str, model: str = None) -> str:
        """
        Single round chat completion
        :param prompt: User prompt
        :param model: Optional model override
        :return: Response text
        """
        model = model or self.default_model

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            result = response.choices[0].message.content.strip()
            logger.info(f"AI {self.provider} call completed successfully")
            return result
        except Exception as e:
            logger.error(f"AI {self.provider} call failed: {str(e)}")
            raise

    @classmethod
    def get_default_client(cls) -> 'AIClient':
        """Get default client based on configured API key"""
        if ERNIE_API_KEY:
            return cls.get_instance('ernie')
        elif DOUBAN_API_KEY:
            return cls.get_instance('doubao')
        else:
            raise ValueError("No AI API key configured")
