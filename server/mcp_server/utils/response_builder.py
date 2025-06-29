"""
Response Builder utility for standardizing HTTP responses
"""

import json
from typing import Dict, Any, Optional
from ..constants import (
    HTTP_OK, HTTP_CREATED, HTTP_BAD_REQUEST, HTTP_FORBIDDEN, 
    HTTP_NOT_FOUND, HTTP_INTERNAL_ERROR, CONTENT_TYPE_JSON, CORS_HEADERS
)


class ResponseBuilder:
    """Utility class for building standardized HTTP responses"""
    
    @staticmethod
    def success(data: Any, status_code: int = HTTP_OK, include_cors: bool = False) -> Dict[str, Any]:
        """
        Build a success response
        
        Args:
            data: Response data
            status_code: HTTP status code
            include_cors: Whether to include CORS headers
            
        Returns:
            Standardized response dictionary
        """
        response = {
            'statusCode': status_code,
            'body': json.dumps(data),
            'headers': {
                'Content-Type': CONTENT_TYPE_JSON
            }
        }
        
        if include_cors:
            response['headers'].update(CORS_HEADERS)
        
        return response
    
    @staticmethod
    def created(data: Any, include_cors: bool = False) -> Dict[str, Any]:
        """
        Build a created (201) response
        
        Args:
            data: Response data
            include_cors: Whether to include CORS headers
            
        Returns:
            Standardized response dictionary
        """
        return ResponseBuilder.success(data, HTTP_CREATED, include_cors)
    
    @staticmethod
    def error(message: str, status_code: int = HTTP_INTERNAL_ERROR, 
              details: Optional[Any] = None, include_cors: bool = False) -> Dict[str, Any]:
        """
        Build an error response
        
        Args:
            message: Error message
            status_code: HTTP status code
            details: Optional error details
            include_cors: Whether to include CORS headers
            
        Returns:
            Standardized error response dictionary
        """
        error_data = {'error': message}
        if details is not None:
            error_data['details'] = details
        
        response = {
            'statusCode': status_code,
            'body': json.dumps(error_data),
            'headers': {
                'Content-Type': CONTENT_TYPE_JSON
            }
        }
        
        if include_cors:
            response['headers'].update(CORS_HEADERS)
        
        return response
    
    @staticmethod
    def bad_request(message: str, details: Optional[Any] = None, include_cors: bool = False) -> Dict[str, Any]:
        """
        Build a bad request (400) response
        
        Args:
            message: Error message
            details: Optional error details
            include_cors: Whether to include CORS headers
            
        Returns:
            Standardized error response dictionary
        """
        return ResponseBuilder.error(message, HTTP_BAD_REQUEST, details, include_cors)
    
    @staticmethod
    def forbidden(message: str = "Access denied", include_cors: bool = False) -> Dict[str, Any]:
        """
        Build a forbidden (403) response
        
        Args:
            message: Error message
            include_cors: Whether to include CORS headers
            
        Returns:
            Standardized error response dictionary
        """
        return ResponseBuilder.error(message, HTTP_FORBIDDEN, include_cors=include_cors)
    
    @staticmethod
    def not_found(message: str = "Resource not found", include_cors: bool = False) -> Dict[str, Any]:
        """
        Build a not found (404) response
        
        Args:
            message: Error message
            include_cors: Whether to include CORS headers
            
        Returns:
            Standardized error response dictionary
        """
        return ResponseBuilder.error(message, HTTP_NOT_FOUND, include_cors=include_cors)
    
    @staticmethod
    def validation_error(message: str, validation_errors: Any, include_cors: bool = False) -> Dict[str, Any]:
        """
        Build a validation error response
        
        Args:
            message: Error message
            validation_errors: Validation error details
            include_cors: Whether to include CORS headers
            
        Returns:
            Standardized validation error response dictionary
        """
        return ResponseBuilder.bad_request(message, validation_errors, include_cors) 