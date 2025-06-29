"""
Handlers package for MCP Server application

This package contains domain-specific handlers that manage different aspects
of the MCP server application:

- ImageHandler: Manages image upload operations
- MCPServerHandler: Manages MCP server creation and lifecycle
- MCPLambdaHandler: Handles MCP (Model Context Protocol) requests in AWS Lambda

Each handler is focused on a single domain responsibility and uses
the shared services, models, and utilities.
"""

from .image_handler import ImageHandler
from .mcp_server_handler import MCPServerHandler
from .mcp_lambda_handler import MCPLambdaHandler

# Lazy initialization - instances created on first access
_image_handler = None
_mcp_server_handler = None

def get_image_handler():
    """Get the image handler instance (lazy initialization)"""
    global _image_handler
    if _image_handler is None:
        _image_handler = ImageHandler()
    return _image_handler

def get_mcp_server_handler():
    """Get the MCP server handler instance (lazy initialization)"""
    global _mcp_server_handler
    if _mcp_server_handler is None:
        _mcp_server_handler = MCPServerHandler()
    return _mcp_server_handler

# Module-level lazy instances for backward compatibility
# These will be created on first access, not at import time
class _LazyHandler:
    def __init__(self, handler_factory):
        self._handler_factory = handler_factory
        self._instance = None
    
    def __getattr__(self, name):
        if self._instance is None:
            self._instance = self._handler_factory()
        return getattr(self._instance, name)

# Create lazy handler instances
image_handler = _LazyHandler(ImageHandler)
mcp_server_handler = _LazyHandler(MCPServerHandler)

__all__ = [
    'ImageHandler',
    'MCPServerHandler', 
    'MCPLambdaHandler',
    'get_image_handler',
    'get_mcp_server_handler',
    'image_handler',
    'mcp_server_handler'
] 