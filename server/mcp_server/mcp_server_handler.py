"""
MCP Server Handler for managing server creation and lifecycle
"""

from typing import Dict, Any, List, Callable
import json
import uuid
import time
import os
from pydantic import BaseModel, Field, ValidationError
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


class MCPServerHandler:
    """
    Handler class for managing MCP server creation requests
    """
    
    def __init__(self):
        """Initialize the MCP server creation handler"""
        # Get DynamoDB table name from environment variable
        table_name = os.environ.get('MCP_SESSION_TABLE', 'mcp_sessions')
        self.session_store = DynamoDBSessionStore(table_name=table_name)

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

    def create_server(self, event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Handle MCP server creation request
        
        Args:
            event: AWS Lambda event object containing request details
            context: AWS Lambda context object
            
        Returns:
            Dict containing response with status code and body
        """
        try:
            # Extract and validate request data using Pydantic
            request_data = json.loads(event.get('body', '{}'))
            
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
            
            # Generate unique server ID
            session_id = str(uuid.uuid4())
            
            # Create tool functions from validated request
            tool_functions = self._create_tool_functions(validated_request.tools)
            
            # Create MCPLambdaHandler instance with the tools
            mcp_handler = MCPLambdaHandler(
                name=validated_request.name,
                version="1.0.0",
                tools=tool_functions
            )
            
            # Prepare server data for storage
            server_data = {
                'session_id': session_id,
                'name': validated_request.name,
                'description': validated_request.description,
                'tools': [tool.dict() for tool in validated_request.tools],
                'status': 'active',
                'created_at': int(time.time()),
                'updated_at': int(time.time())
            }
            
            # Store server configuration in DynamoDB
            try:
                self.session_store.create_session(server_data)
                
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
                            'created_at': server_data['created_at']
                        }
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
                
            except Exception as storage_error:
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': f'Failed to store server configuration: {str(storage_error)}'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid JSON in request body'
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

# Create a global instance for use in router
mcp_server_handler = MCPServerHandler()
