from pydantic import BaseModel, Field
from typing import Optional, Any


class ChatMessage(BaseModel):
    """单条对话消息"""
    role: str = Field(..., description="消息角色: system / user / assistant")
    content: str = Field(..., description="消息内容")


class ChatCompletionResponse(BaseModel):
    """Chat Completion 响应"""
    content: str = Field(..., description="模型返回的文本内容")
    model: str = Field(..., description="实际使用的模型")
    usage: Optional[dict[str, int]] = Field(
        default=None,
        description="Token 用量 {prompt_tokens, completion_tokens, total_tokens}",
    )
