"""
Response helper functions for standardized HTTP responses
"""
import json
from typing import Dict, Any
from constants import HttpStatus, ContentType


def create_response(status_code: int, body: Any, content_type: str = ContentType.JSON) -> Dict[str, Any]:
    """
    Create a standardized HTTP response
    
    Args:
        status_code: HTTP status code
        body: Response body
        content_type: Content type header
        
    Returns:
        Standardized response dictionary
    """
    return {
        'statusCode': status_code,
        'body': json.dumps(body) if content_type == ContentType.JSON else body,
        'headers': {
            'Content-Type': content_type,
            'Access-Control-Allow-Origin': '*',  # Add CORS support
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    }


def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """
    Create a standardized error response
    
    Args:
        status_code: HTTP status code
        message: Error message
        
    Returns:
        Standardized error response
    """
    return create_response(status_code, {'error': message})


def success_response(data: Any = None, status_code: int = HttpStatus.OK) -> Dict[str, Any]:
    """
    Create a standardized success response
    
    Args:
        data: Response data
        status_code: HTTP status code (default: 200)
        
    Returns:
        Standardized success response
    """
    if data is not None:
        return create_response(status_code, data)
    return create_response(status_code, {'success': True})


def validation_error_response(errors: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a validation error response
    
    Args:
        errors: Validation errors dictionary
        
    Returns:
        Validation error response
    """
    return create_response(HttpStatus.BAD_REQUEST, {
        'error': 'Validation failed',
        'details': errors
    }) 