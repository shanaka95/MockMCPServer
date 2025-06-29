"""
Authentication decorators and utilities
"""
from functools import wraps
from typing import Dict, Any, Callable
from constants import TokenType, ErrorMessage
from responses import error_response, HttpStatus

def require_auth(required_token_type: str):
    """
    Decorator to require specific authentication type
    
    Args:
        required_token_type: Required token type (TokenType.COGNITO or TokenType.M2M)
        
    Returns:
        Decorated function that enforces authentication
    """
    def decorator(handler: Callable):
        @wraps(handler)
        def wrapper(event: Dict[str, Any], context: Any, auth_context: Dict[str, Any]):
            token_type = auth_context.get('token_type')
            
            if token_type != required_token_type:
                auth_error_messages = {
                    TokenType.COGNITO: ErrorMessage.USER_AUTH_REQUIRED,
                    TokenType.M2M: ErrorMessage.SERVER_AUTH_REQUIRED
                }
                message = auth_error_messages.get(required_token_type, ErrorMessage.INVALID_AUTH_TYPE)
                return error_response(HttpStatus.FORBIDDEN, message)
            
            return handler(event, context, auth_context)
        return wrapper
    return decorator


def require_session_match(handler: Callable):
    """
    Decorator to require session ID match for M2M tokens
    
    Args:
        handler: Handler function to wrap
        
    Returns:
        Decorated function that enforces session matching
    """
    @wraps(handler)
    def wrapper(event: Dict[str, Any], context: Any, auth_context: Dict[str, Any]):
        session_id = auth_context.get('session_id')
        extracted_session_id = auth_context.get('extracted_session_id')
        
        if session_id != extracted_session_id:
            return error_response(HttpStatus.FORBIDDEN, ErrorMessage.TOKEN_SESSION_MISMATCH)
        
        return handler(event, context, auth_context)
    return wrapper


def extract_auth_context(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract authentication context from the Lambda event
    
    Args:
        event: AWS Lambda event object
        
    Returns:
        Authentication context dictionary
    """
    request_context = event.get('requestContext', {})
    authorizer_context = request_context.get('authorizer', {})
    
    if not isinstance(authorizer_context, dict):
        return {}
    
    return {
        'user_id': authorizer_context.get('userId'),
        'session_id': authorizer_context.get('sessionId'),
        'token_type': authorizer_context.get('tokenType')
    }


def validate_auth_context(auth_context: Dict[str, Any]) -> bool:
    """
    Validate that the authentication context contains required fields
    
    Args:
        auth_context: Authentication context dictionary
        
    Returns:
        True if valid, False otherwise
    """
    return bool(auth_context.get('user_id') and auth_context.get('token_type')) 