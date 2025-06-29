"""
Server Service for handling MCP server creation and management
"""

import time
from typing import Dict, Any, Tuple
from pydantic import ValidationError

from ..models import MCPServerRequest, MCPServerListResponse
from ..utils import TokenGenerator
from ..constants import SERVER_EXPIRY_SECONDS
from .tool_factory import ToolFactory
from ..handlers.mcp_lambda_handler import MCPLambdaHandler


class ServerService:
    """Service class for MCP server management operations"""
    
    @staticmethod
    def create_server_data(request: MCPServerRequest, user_id: str, 
                          session_id: str = None) -> Tuple[Dict[str, Any], MCPLambdaHandler]:
        """
        Create server data and MCP handler from request
        
        Args:
            request: Validated server creation request
            user_id: ID of the user creating the server
            session_id: Optional session ID override
            
        Returns:
            Tuple of (server_data_dict, mcp_handler_instance)
        """
        # Generate unique server ID if not provided
        if not session_id:
            session_id = TokenGenerator.generate_id()
        
        # Generate M2M token for this server
        m2m_token = TokenGenerator.generate_m2m_token(session_id, user_id)
        
        # Create tool functions from validated request
        tool_factory = ToolFactory()
        tool_functions = tool_factory.create_tool_functions(request.tools)
        
        # Create MCPLambdaHandler instance with the tools
        mcp_handler = MCPLambdaHandler(
            name=request.name,
            version="1.0.0",
            tools=tool_functions
        )
        
        # Prepare server data for storage
        current_time = int(time.time())
        server_data = {
            'session_id': session_id,
            'user_id': user_id,
            'name': request.name,
            'description': request.description,
            'tools': [tool.dict() for tool in request.tools],
            'status': 'active',
            'm2m_token': m2m_token,
            'm2m_token_hash': TokenGenerator.hash_token(m2m_token),
            'created_at': current_time,
            'updated_at': current_time,
            'expires_at': current_time + SERVER_EXPIRY_SECONDS
        }
        
        return server_data, mcp_handler
    
    @staticmethod
    def recreate_handler_from_session(session_data: Dict[str, Any], 
                                    user_id: str, session_id: str) -> MCPLambdaHandler:
        """
        Recreate MCP handler from stored session data
        
        Args:
            session_data: Stored session data from database
            user_id: ID of the user requesting the server
            session_id: Session ID
            
        Returns:
            MCPLambdaHandler instance
            
        Raises:
            ValidationError: If session data is invalid
        """
        # Validate session data by creating MCPServerRequest
        validated_request = MCPServerRequest(**session_data)
        
        # Recreate server data and handler
        _, mcp_handler = ServerService.create_server_data(
            validated_request, user_id, session_id
        )
        
        return mcp_handler
    
    @staticmethod
    def process_server_list_response(sessions: list, active_sessions: set) -> list:
        """
        Process list of sessions into standardized response format
        
        Args:
            sessions: List of session data from database
            active_sessions: Set of currently active session IDs
            
        Returns:
            List of processed server response data
        """
        server_responses = []
        
        for session in sessions:
            try:
                # Check if this server is currently active (loaded in memory)
                session_id = session.get('session_id')
                if session_id in active_sessions:
                    session['status'] = 'active'
                else:
                    session['status'] = 'idle'
                
                # Convert to response model for proper JSON serialization
                server_response = MCPServerListResponse(**session)
                server_responses.append(server_response.dict())
            except ValidationError as e:
                # Log the error but continue processing other sessions
                print(f"Error converting session {session.get('session_id', 'unknown')}: {e}")
                continue
        
        return server_responses
    
    @staticmethod
    def create_server_response_data(server_data: Dict[str, Any], 
                                  validated_request: MCPServerRequest) -> Dict[str, Any]:
        """
        Create response data for successful server creation
        
        Args:
            server_data: Created server data
            validated_request: Validated server creation request
            
        Returns:
            Response data dictionary
        """
        return {
            'message': 'MCP server created successfully',
            'session_id': server_data['session_id'],
            'status': 'created',
            'm2m_token': server_data['m2m_token'],
            'server_details': {
                'name': validated_request.name,
                'description': validated_request.description,
                'tools_count': len(validated_request.tools),
                'created_at': server_data['created_at'],
                'url': f'https://app.mockmcp.com/servers/{server_data["session_id"]}/mcp'
            },
            'authentication': {
                'type': 'Bearer',
                'token': server_data['m2m_token'],
                'usage': 'Use this token in Authorization header for MCP server access'
            }
        } 