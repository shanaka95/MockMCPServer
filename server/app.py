"""
Main Lambda application for handling MCP server requests

This is the AWS Lambda entry point that coordinates all the separated modules:
- constants: HTTP status codes, token types, etc.
- responses: Standardized response helpers
- auth: Authentication decorators and utilities
- handlers: Individual route handler functions
- routes: Route mapping and delegation
- utils: Utility functions for parsing and logging
"""
from typing import Dict, Any
from constants import HttpStatus, ErrorMessage
from responses import error_response, success_response
from auth import extract_auth_context
from utils import parse_path, log_request, format_error_log
from routes import get_route_handler


def router(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main router function that handles incoming requests
    
    This function:
    1. Extracts authentication context
    2. Parses the request path
    3. Finds the appropriate handler
    4. Delegates to the handler with proper error handling
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        
    Returns:
        Response from the appropriate handler
    """
    try:
        # Extract authentication context
        auth_context = extract_auth_context(event)
        user_id = auth_context.get('user_id')
        
        if not user_id:
            return error_response(HttpStatus.UNAUTHORIZED, ErrorMessage.USER_ID_NOT_FOUND)
        
        # Parse request path
        path = event.get('path', '')
        path_info = parse_path(path)
        
        if not path_info.get('resource'):
            return error_response(HttpStatus.NOT_FOUND, ErrorMessage.RESOURCE_NOT_FOUND)
        
        # Add extracted session ID to auth context for validation
        auth_context['extracted_session_id'] = path_info.get('extracted_session_id')
        
        # Get HTTP method
        http_method = event.get('httpMethod', 'GET')
        
        # Log the request for monitoring
        log_request(event, auth_context)
        
        # Find and execute the appropriate handler
        route_handler = get_route_handler()
        handler = route_handler.get_handler(
            path_info['resource'], 
            http_method, 
            path_info['is_mcp']
        )
        
        if not handler:
            return error_response(HttpStatus.NOT_FOUND, ErrorMessage.ENDPOINT_NOT_FOUND)
        
        # Execute the handler with proper context
        return handler(event, context, auth_context)
        
    except Exception as e:
        # Global error handling for unexpected errors
        error_msg = format_error_log(e, "Unexpected error in router")
        print(error_msg)
        return error_response(HttpStatus.INTERNAL_SERVER_ERROR, ErrorMessage.INTERNAL_ERROR)


def health_check() -> Dict[str, Any]:
    """
    Simple health check endpoint for monitoring
    
    Returns:
        Health status response
    """
    return success_response({
        'status': 'healthy',
        'service': 'mcp-server',
        'version': '1.0.0'
    })


def get_route_info() -> Dict[str, Any]:
    """
    Get information about registered routes for debugging
    
    Returns:
        Route information response
    """
    route_handler = get_route_handler()
    return success_response({
        'routes': route_handler.get_route_info()
    })


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler function - main entry point
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        
    Returns:
        Response from the router
    """
    return router(event, context)