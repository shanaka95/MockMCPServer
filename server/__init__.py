"""
MCP Server Router Package

This package provides a modular, professional router for handling MCP server requests.

Main Components:
- router: Main routing function
- constants: Shared constants and enums
- responses: Standardized response helpers
- auth: Authentication decorators and utilities
- handlers: Route handler functions
- routes: Route mapping and delegation
- utils: Utility functions

Usage:
    from server.router import router
    
    # In your Lambda handler
    def lambda_handler(event, context):
        return router(event, context)
"""

from .constants import TokenType, HttpMethod, HttpStatus, ErrorMessage
from .responses import error_response, success_response, create_response
from .auth import require_auth, require_session_match, extract_auth_context
from .utils import parse_path, parse_json_body, log_request

# Import router and routes separately to handle dependencies
try:
    from .routes import get_route_handler
    from .app import router, health_check, get_route_info, lambda_handler
    ROUTER_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Router not fully available due to missing dependencies: {e}")
    ROUTER_AVAILABLE = False

__version__ = "1.0.0"
__author__ = "MCP Server Team"

# Public API - Core modules always available
__all__ = [
    # Constants
    'TokenType',
    'HttpMethod', 
    'HttpStatus',
    'ErrorMessage',
    
    # Response helpers
    'error_response',
    'success_response',
    'create_response',
    
    # Authentication
    'require_auth',
    'require_session_match',
    'extract_auth_context',
    
    # Utilities
    'parse_path',
    'parse_json_body',
    'log_request',
    
    # Availability flag
    'ROUTER_AVAILABLE',
]

# Add router components if available
if ROUTER_AVAILABLE:
    __all__.extend([
        'router',
        'health_check', 
        'get_route_info',
        'get_route_handler',
        'lambda_handler',
    ]) 