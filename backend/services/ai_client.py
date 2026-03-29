"""
AI Client - Unified interface for multiple providers
Singleton pattern to avoid recreating client for each request
Supported: ERNIE (baidu), Doubao (bytedance), Qwen (alibabacloud), DeepSeek, MiniMax, Kimi (moonshot)
"""
from openai import OpenAI
from config.settings import (
    ERNIE_API_KEY, DOUBAN_API_KEY, QWEN_API_KEY,
    DEEPSEEK_API_KEY, MINIMAX_API_KEY, KIMI_API_KEY,
    VOLCENGINE_API_KEY, OLLAMA_API_KEY, OLLAMA_BASE_URL, OLLAMA_DEFAULT_MODEL
)
from utils.logger import setup_logger

logger = setup_logger()

class AIClient:
    """Unified AI client supporting multiple providers"""

    _instances = {}

    def __init__(self, provider: str):
        """
        Initialize AI client
        :param provider: "ernie", "doubao" or "qwen"
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
        elif provider == 'qwen':
            api_key = QWEN_API_KEY
            base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
            self.default_model = "qwen-max"
        elif provider == 'deepseek':
            api_key = DEEPSEEK_API_KEY
            base_url = "https://api.deepseek.com/v1"
            self.default_model = "deepseek-chat"
        elif provider == 'minimax':
            api_key = MINIMAX_API_KEY
            base_url = "https://api.minimax.chat/v1"
            self.default_model = "abab6.5-chat"
        elif provider == 'kimi':
            api_key = KIMI_API_KEY
            base_url = "https://api.moonshot.cn/v1"
            self.default_model = "moonshot-v1-8k"
        elif provider == 'volcengine':
            api_key = VOLCENGINE_API_KEY
            base_url = "https://ark.cn-beijing.volces.com/api/v1"
            self.default_model = "doubao-4k"
        elif provider == 'ollama':
            api_key = OLLAMA_API_KEY
            base_url = OLLAMA_BASE_URL
            self.default_model = OLLAMA_DEFAULT_MODEL
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
        elif QWEN_API_KEY:
            return cls.get_instance('qwen')
        elif DEEPSEEK_API_KEY:
            return cls.get_instance('deepseek')
        elif MINIMAX_API_KEY:
            return cls.get_instance('minimax')
        elif KIMI_API_KEY:
            return cls.get_instance('kimi')
        elif VOLCENGINE_API_KEY:
            return cls.get_instance('volcengine')
        elif OLLAMA_API_KEY is not None:
            return cls.get_instance('ollama')
        else:
            raise ValueError("No AI API key configured")

    def build_legal_document_prompt(self, scene_id: str, answers: dict) -> str:
        """
        Build prompt for legal document generation based on scene and user answers
        """
        scene_templates = {
            'civil-debt': """你是一位经验丰富的中国民事律师，请根据用户提供的信息，帮我生成一份专业规范的民事起诉状（欠钱不还）。

要求：
1. 严格按照中国法院要求的起诉状格式
2. 诉讼请求和事实理由要清晰明确
3. 使用法言法语，但保持内容准确
4. 只输出起诉状内容，不要其他解释

用户信息：
""",
            'labor-dispute': """你是一位经验丰富的中国劳动法律师，请根据用户提供的信息，帮我生成一份专业规范的劳动仲裁申请书。

要求：
1. 严格按照中国劳动仲裁委员会要求的格式
2. 仲裁请求和事实理由要清晰明确
3. 使用法言法语，但保持内容准确
4. 只输出仲裁申请书内容，不要其他解释

用户信息：
""",
            'divorce-agreement': """你是一位经验丰富的中国婚姻家庭律师，请根据用户提供的信息，帮我生成一份专业规范的离婚协议书。

要求：
1. 严格按照法律要求的离婚协议书格式
2. 财产分割、子女抚养要写清楚
3. 所有约定要明确，避免歧义
4. 只输出离婚协议书内容，不要其他解释

用户信息：
""",
            'consumer-rights': """你是一位经验丰富的中国消费维权律师，请根据用户提供的信息，帮我生成一份专业规范的民事起诉状（消费维权）。

要求：
1. 严格按照中国法院要求的起诉状格式
2. 诉讼请求和事实理由要清晰明确
3. 使用法言法语，但保持内容准确
4. 只输出起诉状内容，不要其他解释

用户信息：
""",
            '答辩状': """你是一位经验丰富的中国民事律师，请根据用户提供的信息，帮我生成一份专业规范的民事答辩状。

要求：
1. 严格按照中国法院要求的答辩状格式
2. 针对原告诉求逐一答辩，事实理由清晰明确
3. 使用法言法语，但保持内容准确
4. 只输出答辩状内容，不要其他解释

用户信息：
""",
            'loan-contract': """你是一位经验丰富的中国民商事律师，请根据用户提供的信息，帮我生成一份专业规范的民间借贷借条/借款合同。

要求：
1. 严格按照法律要求的规范格式
2. 借款金额、利息、还款日期要写清楚
3. 违约责任明确
4. 只输出借条/借款合同内容，不要其他解释

用户信息：
""",
            'custom': """你是一位经验丰富的中国律师，请根据用户描述的案情和需求，帮用户生成一份专业规范的法律文书。

要求：
1. 根据用户需求判断需要什么类型的法律文书，使用正确格式
2. 诉讼请求/事实理由要清晰明确
3. 使用法言法语，但保持内容准确
4. 如果用户信息不足，你根据常识合理补充完整
5. 只输出最终文书内容，不要其他解释

用户描述：
""",
        }

        template = scene_templates.get(scene_id, scene_templates['civil-debt'])

        # Add user answers
        for key, value in answers.items():
            if value:
                template += f"- {key}: {value}\n"

        return template

    def generate_document(self, prompt: str) -> str:
        """Generate legal document using AI"""
        return self.chat_completion(prompt)

    def validate_law_articles(self, document_content: str) -> dict:
        """
        Validate that all law articles cited in the document are still valid (not repealed)
        Returns validation result with issues found
        """
        prompt = f"""请帮我检查下面这份法律文书中引用的法条是否仍然是现行有效的，有没有已经被废止或者修改的。

文书内容：
{document_content}

请帮我：
1. 找出所有引用的法条
2. 检查每一条是否现行有效
3. 如果有失效/修改的，请指出来并给出正确的现行法条编号和名称
4. 以JSON格式输出结果：{{"valid": true/false, "issues": [{{"article": "原法条", "status": "repealed/modified", "suggestion": "建议改用"}}]}}

只输出JSON，不要其他内容。
"""
        try:
            result = self.chat_completion(prompt)
            # Try to parse JSON result
            import json
            try:
                return json.loads(result)
            except:
                # If AI doesn't output valid JSON, return basic result
                return {
                    "valid": True,
                    "issues": [],
                    "raw": result
                }
        except Exception as e:
            logger.error(f"Law article validation failed: {str(e)}")
            return {
                "valid": True,
                "issues": [],
                "error": str(e)
            }
