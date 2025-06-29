"""
Route handlers for MCP server operations
"""
import json
from typing import Dict, Any
from constants import TokenType, HttpStatus, ErrorMessage
from responses import error_response
from auth import require_auth, require_session_match
from utils import parse_json_body, log_request, format_error_log
from mcp_server.mcp_server_handler import mcp_server_handler


@require_auth(TokenType.COGNITO)
def handle_server_creation(event: Dict[str, Any], context: Any, auth_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle server creation requests
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        auth_context: Authentication context
        
    Returns:
        Response from server creation
    """
    try:
        user_id = auth_context['user_id']
        log_request(event, auth_context)
        
        # Parse and validate request data
        request_data = parse_json_body(event)
        
        print(f"Creating server for user: {user_id}")
        return mcp_server_handler.create_server(request_data, user_id)
        
    except json.JSONDecodeError:
        print("Invalid JSON in server creation request")
        return error_response(HttpStatus.BAD_REQUEST, ErrorMessage.INVALID_JSON)
    except Exception as e:
        error_msg = format_error_log(e, "Server creation failed")
        print(error_msg)
        return error_response(HttpStatus.INTERNAL_SERVER_ERROR, ErrorMessage.SERVER_CREATE_FAILED)


@require_auth(TokenType.COGNITO)
def handle_server_listing(event: Dict[str, Any], context: Any, auth_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle server listing requests
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        auth_context: Authentication context
        
    Returns:
        Response with server list
    """
    try:
        user_id = auth_context['user_id']
        log_request(event, auth_context)
        
        print(f"Getting all servers for user: {user_id}")
        return mcp_server_handler.get_all_servers(user_id)
        
    except Exception as e:
        error_msg = format_error_log(e, "Server listing failed")
        print(error_msg)
        return error_response(HttpStatus.INTERNAL_SERVER_ERROR, ErrorMessage.SERVER_LIST_FAILED)


@require_auth(TokenType.COGNITO)
def handle_server_deletion(event: Dict[str, Any], context: Any, auth_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle server deletion requests
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        auth_context: Authentication context
        
    Returns:
        Response from server deletion
    """
    try:
        user_id = auth_context['user_id']
        session_id = auth_context['session_id']
        log_request(event, auth_context)
        
        print(f"Deleting server for user: {user_id}, session: {session_id}")
        return mcp_server_handler.delete_server(user_id, session_id)
        
    except Exception as e:
        error_msg = format_error_log(e, "Server deletion failed")
        print(error_msg)
        return error_response(HttpStatus.INTERNAL_SERVER_ERROR, ErrorMessage.SERVER_DELETE_FAILED)


@require_auth(TokenType.COGNITO)
def handle_image_upload(event: Dict[str, Any], context: Any, auth_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle image upload requests
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        auth_context: Authentication context
        
    Returns:
        Response from image upload
    """
    try:
        user_id = auth_context['user_id']
        log_request(event, auth_context)
        
        # Parse and validate request data
        request_data = parse_json_body(event)
        
        print(f"Uploading image for user: {user_id}")
        return mcp_server_handler.upload_image(request_data, user_id)
        
    except json.JSONDecodeError:
        print("Invalid JSON in image upload request")
        return error_response(HttpStatus.BAD_REQUEST, ErrorMessage.INVALID_JSON)
    except Exception as e:
        error_msg = format_error_log(e, "Image upload failed")
        print(error_msg)
        return error_response(HttpStatus.INTERNAL_SERVER_ERROR, ErrorMessage.IMAGE_UPLOAD_FAILED)


@require_auth(TokenType.M2M)
@require_session_match
def handle_mcp_server_access(event: Dict[str, Any], context: Any, auth_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle MCP server access requests
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        auth_context: Authentication context
        
    Returns:
        Response from MCP server
    """
    try:
        user_id = auth_context['user_id']
        extracted_session_id = auth_context['extracted_session_id']
        log_request(event, auth_context)
        
        print(f"Loading MCP server for session: {extracted_session_id}, user: {user_id}")
        return mcp_server_handler.load_server(extracted_session_id, user_id, event, context)
        
    except Exception as e:
        error_msg = format_error_log(e, "MCP server access failed")
        print(error_msg)
        return error_response(HttpStatus.INTERNAL_SERVER_ERROR, ErrorMessage.SERVER_LOAD_FAILED)


# Handler registry for easy extension
HANDLER_REGISTRY = {
    'server_creation': handle_server_creation,
    'server_listing': handle_server_listing,
    'server_deletion': handle_server_deletion,
    'image_upload': handle_image_upload,
    'mcp_server_access': handle_mcp_server_access,
}


def get_handler_by_name(name: str):
    """
    Get handler by name from registry
    
    Args:
        name: Handler name
        
    Returns:
        Handler function or None if not found
    """
    return HANDLER_REGISTRY.get(name) 