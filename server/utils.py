"""
Utility functions for the MCP server router
"""
import json
from typing import Dict, Any, Optional
from constants import HttpStatus
from responses import error_response


def parse_path(path: str) -> Dict[str, Any]:
    """
    Parse the request path and extract components
    
    Args:
        path: Request path string
        
    Returns:
        Dictionary containing parsed path components
    """
    # Remove leading/trailing slashes and split
    path_parts = [part for part in path.strip('/').split('/') if part]
    
    if not path_parts:
        return {}
    
    resource = path_parts[0] if path_parts else None
    extracted_session_id = path_parts[1] if len(path_parts) > 1 else None
    protocol = path_parts[-1] if path_parts else None
    is_mcp = protocol == 'mcp'
    
    return {
        'resource': resource,
        'extracted_session_id': extracted_session_id,
        'protocol': protocol,
        'is_mcp': is_mcp,
        'path_parts': path_parts
    }


def parse_json_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Safely parse JSON body from Lambda event
    
    Args:
        event: AWS Lambda event object
        
    Returns:
        Parsed JSON data or empty dict if parsing fails
        
    Raises:
        json.JSONDecodeError: If JSON is invalid
    """
    body = event.get('body', '{}')
    if not body:
        return {}
    
    try:
        return json.loads(body)
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"Invalid JSON in request body: {str(e)}", body, 0)


def get_client_ip(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract client IP address from Lambda event
    
    Args:
        event: AWS Lambda event object
        
    Returns:
        Client IP address or None if not found
    """
    # Check for IP in various locations
    request_context = event.get('requestContext', {})
    
    # API Gateway v2
    if 'http' in request_context:
        return request_context['http'].get('sourceIp')
    
    # API Gateway v1
    identity = request_context.get('identity', {})
    return identity.get('sourceIp')


def log_request(event: Dict[str, Any], auth_context: Dict[str, Any]) -> None:
    """
    Log request details for debugging and monitoring
    
    Args:
        event: AWS Lambda event object
        auth_context: Authentication context
    """
    method = event.get('httpMethod', 'UNKNOWN')
    path = event.get('path', '')
    user_id = auth_context.get('user_id', 'anonymous')
    token_type = auth_context.get('token_type', 'none')
    client_ip = get_client_ip(event)
    
    print(f"REQUEST: {method} {path} | User: {user_id} | Auth: {token_type} | IP: {client_ip}")


def format_error_log(error: Exception, context: str = "") -> str:
    """
    Format error for logging
    
    Args:
        error: Exception object
        context: Additional context string
        
    Returns:
        Formatted error string
    """
    error_type = type(error).__name__
    error_msg = str(error)
    
    if context:
        return f"{context} - {error_type}: {error_msg}"
    return f"{error_type}: {error_msg}"


def validate_required_fields(data: Dict[str, Any], required_fields: list) -> Optional[Dict[str, Any]]:
    """
    Validate that required fields are present in data
    
    Args:
        data: Data dictionary to validate
        required_fields: List of required field names
        
    Returns:
        Error response if validation fails, None if valid
    """
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    
    if missing_fields:
        return error_response(
            HttpStatus.BAD_REQUEST, 
            f"Missing required fields: {', '.join(missing_fields)}"
        )
    
    return None 