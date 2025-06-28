"""
MCP Server Handler for managing server creation and lifecycle
"""

from typing import Dict, Any, List, Callable, Optional, Tuple
import json
import uuid
import time
import os
from decimal import Decimal
from pydantic import BaseModel, Field, ValidationError, validator
from mcp_server.session import DynamoDBSessionStore
from mcp_server import MCPLambdaHandler


class ParameterDefinition(BaseModel):
    """Model for individual parameter definitions"""
    type: str = Field(..., min_length=1, description="Parameter type (e.g., 'number', 'string')")
    description: str = Field(..., min_length=1, description="Parameter description")


class ToolDefinition(BaseModel):
    """Model for individual tool definitions"""
    name: str = Field(..., min_length=1, description="Tool name")
    description: str = Field(..., min_length=1, description="Tool description")
    output_text: str = Field(..., description="Expected output text")
    parameters: Dict[str, ParameterDefinition] = Field(..., description="Tool parameters")


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
                    # For now, return the predefined output_text
                    # In a real implementation, this would execute the actual tool logic
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
    
    def _new_server(self, request_data: Dict[str, Any], user_id: str, session_id: str = None) -> Tuple[Dict[str, Any], MCPLambdaHandler]:
       
        # Generate unique server ID
        session_id = session_id if session_id else str(uuid.uuid4())
        
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
            'created_at': int(time.time()),
            'updated_at': int(time.time()),
            'expires_at': int(time.time()) + (24 * 60 * 60)  # Expire after 24 hours
        }

        return server_data, mcp_handler

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
                    'server_details': {
                        'name': validated_request.name,
                        'description': validated_request.description,
                        'tools_count': len(validated_request.tools),
                        'created_at': server_data['created_at'],
                        'url': f'https://app.mockmcp.com/server/{session_id}/mcp'
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
