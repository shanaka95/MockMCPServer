"""
Constants and enums used throughout the MCP server router
"""

class TokenType:
    """Authentication token types"""
    COGNITO = 'cognito'
    M2M = 'm2m'

class HttpMethod:
    """HTTP methods"""
    GET = 'GET'
    POST = 'POST'
    DELETE = 'DELETE'
    PUT = 'PUT'
    PATCH = 'PATCH'

class HttpStatus:
    """HTTP status codes"""
    OK = 200
    CREATED = 201
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_SERVER_ERROR = 500

class ContentType:
    """Content types"""
    JSON = 'application/json'
    TEXT = 'text/plain'
    HTML = 'text/html'

class ErrorMessage:
    """Standard error messages"""
    USER_AUTH_REQUIRED = 'This operation requires user authentication'
    SERVER_AUTH_REQUIRED = 'This operation requires server authentication'
    INVALID_AUTH_TYPE = 'Invalid authentication type'
    TOKEN_SESSION_MISMATCH = 'Token is not valid for this session'
    USER_ID_NOT_FOUND = 'User ID not found in request context'
    RESOURCE_NOT_FOUND = 'Resource not found'
    ENDPOINT_NOT_FOUND = 'Endpoint not found'
    INVALID_JSON = 'Invalid JSON in request body'
    SERVER_CREATE_FAILED = 'Failed to create server'
    SERVER_LIST_FAILED = 'Failed to retrieve servers'
    SERVER_DELETE_FAILED = 'Failed to delete server'
    IMAGE_UPLOAD_FAILED = 'Failed to upload image'
    SERVER_LOAD_FAILED = 'Failed to load server'
    INTERNAL_ERROR = 'Internal server error' 