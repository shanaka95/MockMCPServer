"""
MCP Server Handler for managing server creation and lifecycle
"""

from typing import Dict, Any, List, Callable, Optional, Tuple
import json
import time
import os
import secrets
import hashlib
import base64
import uuid
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field, ValidationError, validator
from mcp_server.session import DynamoDBSessionStore
from mcp_server import MCPLambdaHandler


class ParameterDefinition(BaseModel):
    """Model for individual parameter definitions"""
    type: str = Field(..., min_length=1, description="Parameter type (e.g., 'number', 'string')")
    description: str = Field(..., min_length=1, description="Parameter description")


class ImageOutput(BaseModel):
    """Model for image output configuration"""
    s3_key: str = Field(..., description="S3 key for the image")
    s3_bucket: str = Field("", description="S3 bucket name")


class CustomOutput(BaseModel):
    """Model for custom flow output configuration"""
    flow_type: str = Field("", description="Type of custom flow")
    configuration: str = Field("", description="Custom flow configuration")


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
        allowed_types = ['text', 'image', 'custom']
        if v not in allowed_types:
            raise ValueError(f'output_type must be one of: {", ".join(allowed_types)}')
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


class MCPServerHandler:
    """
    Handler class for managing MCP server creation requests
    """
    
    def __init__(self):
        """Initialize the MCP server creation handler"""
        # Get DynamoDB table name from environment variable
        table_name = os.environ.get('MCP_SESSION_TABLE', 'mcp_sessions')
        self.session_store = DynamoDBSessionStore(table_name=table_name)
        
        # In-memory storage for MCPLambdaHandler instances
        self.active_handlers: Dict[str, MCPLambdaHandler] = {}
        
        # Initialize S3 client
        self.s3_client = boto3.client('s3')
        self.s3_bucket = os.environ.get('MOCKMCP_S3_BUCKET', 'mockmcp-images')
        
        # Ensure S3 bucket exists
        self._ensure_s3_bucket_exists()

    def _ensure_s3_bucket_exists(self):
        """Ensure the S3 bucket exists, create if it doesn't"""
        try:
            self.s3_client.head_bucket(Bucket=self.s3_bucket)
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                # Bucket doesn't exist, create it
                try:
                    self.s3_client.create_bucket(Bucket=self.s3_bucket)
                    print(f"Created S3 bucket: {self.s3_bucket}")
                except ClientError as create_error:
                    print(f"Failed to create S3 bucket: {create_error}")
            else:
                print(f"Error checking S3 bucket: {e}")

    def upload_image_to_s3(self, image_data: str, filename: str = None) -> str:
        """
        Upload base64 encoded image data to S3
        
        Args:
            image_data: Base64 encoded image data
            filename: Optional filename, will generate one if not provided
            
        Returns:
            str: S3 URL of the uploaded image
        """
        try:
            # Decode base64 image data
            if image_data.startswith('data:'):
                # Remove data:image/jpeg;base64, prefix if present
                header, encoded = image_data.split(',', 1)
                image_bytes = base64.b64decode(encoded)
                
                # Extract content type from header
                content_type = header.split(';')[0].split(':')[1]
                file_extension = content_type.split('/')[1]
            else:
                # Assume it's already base64 encoded
                image_bytes = base64.b64decode(image_data)
                content_type = 'image/jpeg'
                file_extension = 'jpg'
            
            # Generate filename if not provided
            if not filename:
                filename = f"{uuid.uuid4().hex}.{file_extension}"
            
            # Upload to S3
            key = f"tool-images/{filename}"
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=key,
                Body=image_bytes,
                ContentType=content_type
            )
            
            # Return S3 key (not public URL since files are private)
            return key
            
        except Exception as e:
            raise Exception(f"Failed to upload image to S3: {str(e)}")

    def _create_tool_functions(self, tools: List[ToolDefinition]) -> List[Callable]:
        """
        Create callable functions from tool definitions
        
        Args:
            tools: List of validated tool definitions
            
        Returns:
            List of callable functions that can be used by MCPLambdaHandler
        """
        tool_functions = []
        
        for tool in tools:
            # Create a dynamic function for each tool
            def create_tool_function(tool_def: ToolDefinition):
                def tool_function(**kwargs) -> str:
                    """
                    Dynamically generated tool function
                    """
                    # Handle different output types
                    if tool_def.output_type == 'text':
                        return tool_def.output_text
                    elif tool_def.output_type == 'image' and tool_def.output_image:
                        # Return image information as JSON
                        return json.dumps({
                            "type": "image",
                            "s3_key": tool_def.output_image.s3_key,
                            "s3_bucket": tool_def.output_image.s3_bucket
                        })
                    elif tool_def.output_type == 'custom' and tool_def.output_custom:
                        # Return custom flow information as JSON
                        return json.dumps({
                            "type": "custom_flow",
                            "flow_type": tool_def.output_custom.flow_type,
                            "configuration": tool_def.output_custom.configuration
                        })
                    else:
                        # Fallback to text output
                        return tool_def.output_text
                
                # Set function metadata for MCP processing
                tool_function.__name__ = tool_def.name
                tool_function.__doc__ = f"{tool_def.description}\n\nArgs:\n"
                
                # Add parameter documentation for MCP schema generation
                for param_name, param_def in tool_def.parameters.items():
                    tool_function.__doc__ += f"    {param_name}: {param_def.description}\n"
                
                tool_function.__doc__ += "\nReturns:\n    str: Tool execution result"
                
                # Add type hints dynamically
                annotations = {}
                for param_name, param_def in tool_def.parameters.items():
                    # Map parameter types to Python types
                    if param_def.type == 'number':
                        annotations[param_name] = float
                    elif param_def.type == 'integer':
                        annotations[param_name] = int
                    elif param_def.type == 'boolean':
                        annotations[param_name] = bool
                    else:
                        annotations[param_name] = str
                
                annotations['return'] = str
                tool_function.__annotations__ = annotations
                
                return tool_function
            
            tool_functions.append(create_tool_function(tool))
        
        return tool_functions
    
    def _generate_id(self, length: int = 12) -> str:
        """
        Generate a short, cryptographically secure random ID
        
        Args:
            length: Length of the ID to generate (default: 12)
            
        Returns:
            str: Short random ID
        """
        return secrets.token_urlsafe(length)[:length]
    
    def _generate_m2m_token(self, session_id: str, user_id: str) -> str:
        """
        Generate a secure M2M token for MCP server access
        
        Args:
            session_id: Unique session identifier
            user_id: User who owns the server
            
        Returns:
            str: Secure M2M token
        """
        # Generate a cryptographically secure random token
        random_part = secrets.token_urlsafe(32)  # 256-bit entropy
        
        # Create a deterministic part based on session and user
        deterministic_part = hashlib.sha256(f"{session_id}:{user_id}".encode()).hexdigest()[:16]
        
        # Combine with prefix for easy identification
        m2m_token = f"mcp_m2m_{random_part}_{deterministic_part}"
        
        return m2m_token

    def _new_server(self, request_data: Dict[str, Any], user_id: str, session_id: str = None) -> Tuple[Dict[str, Any], MCPLambdaHandler]:
       
        # Generate unique server ID
        session_id = session_id if session_id else self._generate_id()
        
        # Generate M2M token for this server
        m2m_token = self._generate_m2m_token(session_id, user_id)
        
        # Create tool functions from validated request
        tool_functions = self._create_tool_functions(request_data.tools)
        
        # Create MCPLambdaHandler instance with the tools
        mcp_handler = MCPLambdaHandler(
            name=request_data.name,
            version="1.0.0",
            tools=tool_functions
        )
        
        # Prepare server data for storage
        server_data = {
            'session_id': session_id,
            'user_id': user_id,
            'name': request_data.name,
            'description': request_data.description,
            'tools': [tool.dict() for tool in request_data.tools],
            'status': 'active',
            'm2m_token': m2m_token,  # Store M2M token
            'm2m_token_hash': hashlib.sha256(m2m_token.encode()).hexdigest(),  # Store hash for validation
            'created_at': int(time.time()),
            'updated_at': int(time.time()),
            'expires_at': int(time.time()) + (24 * 60 * 60)  # Expire after 24 hours
        }

        return server_data, mcp_handler

    def upload_image(self, request_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Handle image upload request
        
        Args:
            request_data: Request data containing base64 encoded image
            user_id: ID of the authenticated user uploading the image
            
        Returns:
            Dict containing response with status code and body
        """
        try:
            # Validate required fields
            if 'image_data' not in request_data:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': 'Missing image_data field'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            image_data = request_data['image_data']
            filename = request_data.get('filename')
            
            # Upload image to S3
            s3_key = self.upload_image_to_s3(image_data, filename)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Image uploaded successfully',
                    'key': s3_key,
                    'bucket': self.s3_bucket
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                }
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': f'Image upload failed: {str(e)}'
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                }
            }

    def create_server(self, request_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Handle MCP server creation request
        
        Args:
            request_data: Request data containing server configuration
            user_id: ID of the authenticated user creating the server
            
        Returns:
            Dict containing response with status code and body
        """
        try:
            # Validate using Pydantic model
            try:
                validated_request = MCPServerRequest(**request_data)
            except ValidationError as e:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': 'Validation failed',
                        'details': e.errors()
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            server_data, mcp_handler = self._new_server(validated_request, user_id)

            session_id = server_data['session_id']
            
            self.session_store.create_session(server_data)
            
            # Store the handler in in-memory storage
            self.active_handlers[session_id] = mcp_handler
            
            return {
                'statusCode': 201,
                'body': json.dumps({
                    'message': 'MCP server created successfully',
                    'session_id': session_id,
                    'status': 'created',
                    'm2m_token': server_data['m2m_token'],  # Return M2M token to user
                    'server_details': {
                        'name': validated_request.name,
                        'description': validated_request.description,
                        'tools_count': len(validated_request.tools),
                        'created_at': server_data['created_at'],
                        'url': f'https://app.mockmcp.com/server/{session_id}/mcp'
                    },
                    'authentication': {
                        'type': 'Bearer',
                        'token': server_data['m2m_token'],
                        'usage': 'Use this token in Authorization header for MCP server access'
                    }
                }),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }
                
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': f'Server creation failed: {str(e)}'
                }),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }
        
    def load_server(self, session_id: str, user_id: str, event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Load a stored MCPLambdaHandler instance by session_id
        
        Args:
            session_id: The session ID to load
            user_id: ID of the authenticated user requesting the server
            event: AWS Lambda event object
            context: AWS Lambda context object
            
        Returns:
            Response from the MCP handler or error response
        """
        
        # Check if session_id is in the active_handlers dictionary
        if session_id not in self.active_handlers:
            # Try load from DynamoDB
            session = self.session_store.get_session(session_id)
            if not session:
                return {
                    'statusCode': 404,
                    'body': json.dumps({
                        'error': 'Session not found'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            # Verify that the session belongs to the requesting user
            if session.get('user_id') != user_id:
                return {
                    'statusCode': 403,
                    'body': json.dumps({
                        'error': 'Access denied: Session does not belong to authenticated user'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            # Create the validated request from session data
            try:
                validated_request = MCPServerRequest(**session)
                server_data, mcp_handler = self._new_server(validated_request, user_id)
                self.active_handlers[session_id] = mcp_handler
                handler = mcp_handler
            except ValidationError as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': 'Invalid session data',
                        'details': e.errors()
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
        else:
            handler = self.active_handlers[session_id]

        return handler.handle_request(event, context)
    
    def get_all_servers(self, user_id: str) -> Dict[str, Any]:
        """
        Get all MCP servers for a user
        
        Args:
            user_id: ID of the authenticated user
            
        Returns:
            Dict containing response with status code and body
        """
        try:
            sessions = self.session_store.get_all_sessions(user_id)
            
            if sessions is None:
                sessions = []
            
            # Convert DynamoDB data to Pydantic models for proper JSON serialization
            server_responses = []
            for session in sessions:
                try:
                    # Check if this server is currently active (loaded in memory)
                    session_id = session.get('session_id')
                    if session_id in self.active_handlers:
                        # Server is loaded in memory - keep status as active
                        session['status'] = 'active'
                    else:
                        # Server is stored but not loaded - mark as idle
                        session['status'] = 'idle'
                    
                    server_response = MCPServerListResponse(**session)
                    server_responses.append(server_response.dict())
                except ValidationError as e:
                    # Log the error but continue processing other sessions
                    print(f"Error converting session {session.get('session_id', 'unknown')}: {e}")
                    continue
            
            return {
                'statusCode': 200,
                'body': json.dumps(server_responses),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                }
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': f'Failed to retrieve servers: {str(e)}'
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                }
            }


# Create a global instance for use in router
mcp_server_handler = MCPServerHandler()
