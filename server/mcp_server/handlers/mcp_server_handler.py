"""
MCP Server Handler for managing MCP server creation and lifecycle
"""

from typing import Dict, Any
from pydantic import ValidationError

from .mcp_lambda_handler import MCPLambdaHandler
from ..models import MCPServerRequest
from ..services import ServerService, DynamoDBService
from ..utils import ResponseBuilder


class MCPServerHandler:
    """
    Handler class for managing MCP server creation and lifecycle operations
    """
    
    def __init__(self):
        """Initialize the MCP server handler"""
        # Initialize database service
        self.db_service = DynamoDBService()
        
        # In-memory storage for MCPLambdaHandler instances
        self.active_handlers: Dict[str, MCPLambdaHandler] = {}

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
                return ResponseBuilder.validation_error('Validation failed', e.errors())
            
            # Create server data and handler using service
            server_data, mcp_handler = ServerService.create_server_data(validated_request, user_id)
            
            session_id = server_data['session_id']
            
            # Store in database
            self.db_service.create_session(server_data)
            
            # Store the handler in in-memory storage
            self.active_handlers[session_id] = mcp_handler
            
            # Create response data using service
            response_data = ServerService.create_server_response_data(server_data, validated_request)
            
            return ResponseBuilder.created(response_data)
                
        except Exception as e:
            return ResponseBuilder.error(f'Server creation failed: {str(e)}')
        
    def load_server(self, session_id: str, user_id: str, event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Load a stored MCPLambdaHandler instance by session_id and handle MCP requests
        
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
            session = self.db_service.get_session(session_id)
            if not session:
                return ResponseBuilder.not_found('MCP server session not found')
            
            # Verify that the session belongs to the requesting user
            if session.get('user_id') != user_id:
                return ResponseBuilder.forbidden(
                    'Access denied: MCP server session does not belong to authenticated user'
                )
            
            # Recreate handler from session data using service
            try:
                mcp_handler = ServerService.recreate_handler_from_session(session, user_id, session_id)
                self.active_handlers[session_id] = mcp_handler
                handler = mcp_handler
            except ValidationError as e:
                return ResponseBuilder.error('Invalid MCP server session data', details=e.errors())
        else:
            handler = self.active_handlers[session_id]

        # Handle the MCP request
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
            sessions = self.db_service.get_all_sessions(user_id)
            
            if sessions is None:
                sessions = []
            
            # Process server responses using service
            active_sessions = set(self.active_handlers.keys())
            server_responses = ServerService.process_server_list_response(sessions, active_sessions)
            
            return ResponseBuilder.success(server_responses, include_cors=True)
            
        except Exception as e:
            return ResponseBuilder.error(
                f'Failed to retrieve MCP servers: {str(e)}', 
                include_cors=True
            )
    
    def delete_server(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """
        Delete an MCP server (future enhancement)
        
        Args:
            session_id: The session ID to delete
            user_id: ID of the authenticated user
            
        Returns:
            Dict containing deletion response
        """
        try:
            # Verify session exists and belongs to user
            session = self.db_service.get_session(session_id)
            if not session:
                return ResponseBuilder.not_found('MCP server session not found')
            
            if session.get('user_id') != user_id:
                return ResponseBuilder.forbidden(
                    'Access denied: Cannot delete MCP server that does not belong to you'
                )
            
            # Remove from active handlers if loaded
            if session_id in self.active_handlers:
                del self.active_handlers[session_id]
            
            # Delete from database
            success = self.db_service.delete_session(session_id)
            
            if success:
                return ResponseBuilder.success({
                    'message': 'MCP server deleted successfully',
                    'session_id': session_id
                }, include_cors=True)
            else:
                return ResponseBuilder.error('Failed to delete MCP server', include_cors=True)
                
        except Exception as e:
            return ResponseBuilder.error(
                f'Failed to delete MCP server: {str(e)}', 
                include_cors=True
            )
    
    def get_server_status(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get status of a specific MCP server
        
        Args:
            session_id: The session ID to check
            user_id: ID of the authenticated user
            
        Returns:
            Dict containing server status response
        """
        try:
            session = self.db_service.get_session(session_id)
            if not session:
                return ResponseBuilder.not_found('MCP server session not found')
            
            if session.get('user_id') != user_id:
                return ResponseBuilder.forbidden(
                    'Access denied: Cannot access MCP server that does not belong to you'
                )
            
            # Determine if server is active (loaded in memory)
            is_active = session_id in self.active_handlers
            
            status_data = {
                'session_id': session_id,
                'name': session.get('name'),
                'status': 'active' if is_active else 'idle',
                'created_at': session.get('created_at'),
                'expires_at': session.get('expires_at'),
                'tools_count': len(session.get('tools', []))
            }
            
            return ResponseBuilder.success(status_data, include_cors=True)
            
        except Exception as e:
            return ResponseBuilder.error(
                f'Failed to get MCP server status: {str(e)}', 
                include_cors=True
            ) 