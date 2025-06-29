"""
Server models for MCP Server Handler
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator
from ..constants import VALID_OUTPUT_TYPES


class Output(BaseModel):
    """Unified output model for all output types"""
    output_type: str = Field(..., description="Output type: text, image, or custom")
    output_content: Dict[str, Any] = Field(..., description="Output content based on type")
    
    @validator('output_type')
    def validate_output_type(cls, v):
        """Validate output type is one of the allowed values"""
        if v not in VALID_OUTPUT_TYPES:
            raise ValueError(f'output_type must be one of: {", ".join(VALID_OUTPUT_TYPES)}')
        return v
    
    @validator('output_content', always=True)
    def validate_output_content(cls, v, values):
        """Validate output content based on output type"""
        output_type = values.get('output_type')
        
        if output_type == 'text':
            if 'text' not in v:
                raise ValueError('Text output must contain "text" field in output_content')
            if not isinstance(v['text'], str) or not v['text'].strip():
                raise ValueError('Text output must have non-empty text content')
                
        elif output_type == 'image':
            if 's3_key' not in v:
                raise ValueError('Image output must contain "s3_key" field in output_content')
            if not isinstance(v['s3_key'], str) or not v['s3_key'].strip():
                raise ValueError('Image output must have valid s3_key')
            # s3_bucket is optional, will default if not provided
                
        elif output_type == 'custom':
            if 'flow_type' not in v:
                raise ValueError('Custom output must contain "flow_type" field in output_content')
            if 'configuration' not in v:
                raise ValueError('Custom output must contain "configuration" field in output_content')
        
        return v

class ParameterDefinition(BaseModel):
    """Model for individual parameter definitions"""
    type: str = Field(..., min_length=1, description="Parameter type (e.g., 'number', 'string')")
    description: str = Field(..., min_length=1, description="Parameter description")


class ToolDefinition(BaseModel):
    """Model for individual tool definitions"""
    name: str = Field(..., min_length=1, description="Tool name")
    description: str = Field(..., min_length=1, description="Tool description")
    output: Output = Field(..., description="Unified output configuration")
    parameters: Dict[str, ParameterDefinition] = Field(..., description="Tool parameters")


class MCPServerRequest(BaseModel):
    """Model for MCP server creation request"""
    name: str = Field(..., min_length=1, description="Server name")
    description: str = Field(..., min_length=1, description="Server description")
    tools: List[ToolDefinition] = Field(..., min_items=1, description="List of tools") 