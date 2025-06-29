"""
Constants for MCP Server Handler
"""

# Server Configuration
DEFAULT_ID_LENGTH = 12
M2M_TOKEN_RANDOM_LENGTH = 32
M2M_TOKEN_DETERMINISTIC_LENGTH = 16
SERVER_EXPIRY_HOURS = 24
SERVER_EXPIRY_SECONDS = SERVER_EXPIRY_HOURS * 60 * 60

# Output Types
VALID_OUTPUT_TYPES = ['text', 'image', 'custom']

# Parameter Types
PARAMETER_TYPE_MAPPING = {
    'number': float,
    'integer': int,
    'boolean': bool,
    'string': str
}

# S3 Configuration
DEFAULT_S3_BUCKET_ENV = 'MOCKMCP_S3_BUCKET'
DEFAULT_S3_BUCKET_NAME = 'mockmcp-images'
S3_IMAGE_PREFIX = 'tool-images'

# DynamoDB Configuration
DEFAULT_SESSION_TABLE_ENV = 'MCP_SESSION_TABLE'
DEFAULT_SESSION_TABLE_NAME = 'mcp_sessions'

# HTTP Status Codes
HTTP_OK = 200
HTTP_CREATED = 201
HTTP_BAD_REQUEST = 400
HTTP_FORBIDDEN = 403
HTTP_NOT_FOUND = 404
HTTP_INTERNAL_ERROR = 500

# Content Types
CONTENT_TYPE_JSON = 'application/json'
DEFAULT_IMAGE_CONTENT_TYPE = 'image/jpeg'
DEFAULT_IMAGE_EXTENSION = 'jpg'

# CORS Headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}

# Token Configuration
M2M_TOKEN_PREFIX = 'mcp_m2m' 