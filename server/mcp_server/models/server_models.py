"""
Server models for MCP Server Handler
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator
from ..constants import VALID_OUTPUT_TYPES


class ImageOutput(BaseModel):
    """Model for image output configuration"""
    s3_key: str = Field(..., description="S3 key for the image")
    s3_bucket: str = Field("", description="S3 bucket name")


class CustomOutput(BaseModel):
    """Model for custom flow output configuration"""
    flow_type: str = Field("", description="Type of custom flow")
    configuration: str = Field("", description="Custom flow configuration")


class ParameterDefinition(BaseModel):
    """Model for individual parameter definitions"""
    type: str = Field(..., min_length=1, description="Parameter type (e.g., 'number', 'string')")
    description: str = Field(..., min_length=1, description="Parameter description")


class ToolDefinition(BaseModel):
    """Model for individual tool definitions"""
    name: str = Field(..., min_length=1, description="Tool name")
    description: str = Field(..., min_length=1, description="Tool description")
    output_type: str = Field(default="text", description="Output type: text, image, or custom")
    output_text: str = Field("", description="Expected output text")
    output_image: Optional[ImageOutput] = Field(None, description="Image output configuration")
    output_custom: Optional[CustomOutput] = Field(None, description="Custom flow output configuration")
    parameters: Dict[str, ParameterDefinition] = Field(..., description="Tool parameters")
    
    @validator('output_type')
    def validate_output_type(cls, v):
        """Validate output type is one of the allowed values"""
        if v not in VALID_OUTPUT_TYPES:
            raise ValueError(f'output_type must be one of: {", ".join(VALID_OUTPUT_TYPES)}')
        return v
    
    @validator('output_image', always=True)
    def validate_image_output(cls, v, values):
        """Validate that image output is provided when output_type is image"""
        output_type = values.get('output_type')
        if output_type == 'image' and (not v or not v.s3_key):
            raise ValueError('Image S3 key is required when output_type is "image"')
        return v
    
    @validator('output_text', always=True)
    def validate_text_output(cls, v, values):
        """Validate that text output is provided when output_type is text"""
        output_type = values.get('output_type')
        if output_type == 'text' and not v:
            raise ValueError('Output text is required when output_type is "text"')
        return v


class MCPServerRequest(BaseModel):
    """Model for MCP server creation request"""
    name: str = Field(..., min_length=1, description="Server name")
    description: str = Field(..., min_length=1, description="Server description")
    tools: List[ToolDefinition] = Field(..., min_items=1, description="List of tools") 