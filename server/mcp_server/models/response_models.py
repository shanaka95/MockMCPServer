"""
Response models for MCP Server Handler
"""

from typing import List, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, validator


class MCPServerListResponse(BaseModel):
    """Model for MCP server list response data - handles DynamoDB Decimal conversion"""
    session_id: str
    user_id: str
    name: str
    description: str
    tools: List[Dict[str, Any]]
    status: str
    m2m_token: str  # Include M2M token in response
    created_at: int
    updated_at: int
    expires_at: int
    
    @validator('created_at', 'updated_at', 'expires_at', pre=True)
    def convert_decimal_to_int(cls, v):
        """Convert DynamoDB Decimal objects to integers"""
        if isinstance(v, Decimal):
            return int(v)
        return v

    class Config:
        """Pydantic config"""
        # Allow arbitrary types for flexibility
        arbitrary_types_allowed = True 