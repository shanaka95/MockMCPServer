"""
Route mapping and handler delegation
"""
from typing import Optional, Callable, Dict, Tuple
from constants import HttpMethod
from handlers import (
    handle_server_creation,
    handle_server_listing,
    handle_server_deletion,
    handle_image_upload,
    handle_mcp_server_access
)


class RouteMap:
    """Route mapping configuration"""
    
    def __init__(self):
        """Initialize route mappings"""
        self.routes: Dict[Tuple[str, str, str], Callable] = {
            # Server management routes (require Cognito auth)
            ('server', HttpMethod.POST, 'non_mcp'): handle_server_creation,
            ('server', HttpMethod.GET, 'non_mcp'): handle_server_listing,
            ('server', HttpMethod.DELETE, 'non_mcp'): handle_server_deletion,
            
            # Image upload route (require Cognito auth)
            ('upload-image', HttpMethod.POST, 'non_mcp'): handle_image_upload,
            
            # MCP server access routes (require M2M auth)
            ('server', HttpMethod.GET, 'mcp'): handle_mcp_server_access,
            ('server', HttpMethod.POST, 'mcp'): handle_mcp_server_access,
        }
    
    def get_handler(self, resource: str, method: str, is_mcp: bool) -> Optional[Callable]:
        """
        Get the appropriate handler for the given route
        
        Args:
            resource: Resource name (e.g., 'server', 'upload-image')
            method: HTTP method
            is_mcp: Whether this is an MCP protocol request
            
        Returns:
            Handler function or None if not found
        """
        protocol = 'mcp' if is_mcp else 'non_mcp'
        route_key = (resource, method, protocol)
        return self.routes.get(route_key)
    
    def add_route(self, resource: str, method: str, is_mcp: bool, handler: Callable) -> None:
        """
        Add a new route to the mapping
        
        Args:
            resource: Resource name
            method: HTTP method
            is_mcp: Whether this is an MCP protocol request
            handler: Handler function
        """
        protocol = 'mcp' if is_mcp else 'non_mcp'
        route_key = (resource, method, protocol)
        self.routes[route_key] = handler
    
    def remove_route(self, resource: str, method: str, is_mcp: bool) -> bool:
        """
        Remove a route from the mapping
        
        Args:
            resource: Resource name
            method: HTTP method
            is_mcp: Whether this is an MCP protocol request
            
        Returns:
            True if route was removed, False if not found
        """
        protocol = 'mcp' if is_mcp else 'non_mcp'
        route_key = (resource, method, protocol)
        
        if route_key in self.routes:
            del self.routes[route_key]
            return True
        return False
    
    def list_routes(self) -> Dict[str, str]:
        """
        List all registered routes
        
        Returns:
            Dictionary of route descriptions
        """
        route_descriptions = {}
        for (resource, method, protocol), handler in self.routes.items():
            route_name = f"{method} /{resource} ({protocol})"
            route_descriptions[route_name] = handler.__name__
        return route_descriptions


class RouteHandler:
    """Main route handler class"""
    
    def __init__(self):
        """Initialize with default route map"""
        self.route_map = RouteMap()
    
    def get_handler(self, resource: str, method: str, is_mcp: bool) -> Optional[Callable]:
        """
        Get handler for the given route
        
        Args:
            resource: Resource name
            method: HTTP method
            is_mcp: Whether this is an MCP protocol request
            
        Returns:
            Handler function or None if not found
        """
        return self.route_map.get_handler(resource, method, is_mcp)
    
    def register_route(self, resource: str, method: str, is_mcp: bool, handler: Callable) -> None:
        """
        Register a new route handler
        
        Args:
            resource: Resource name
            method: HTTP method
            is_mcp: Whether this is an MCP protocol request
            handler: Handler function
        """
        self.route_map.add_route(resource, method, is_mcp, handler)
    
    def get_route_info(self) -> Dict[str, str]:
        """
        Get information about all registered routes
        
        Returns:
            Dictionary of route information
        """
        return self.route_map.list_routes()


# Global route handler instance
route_handler = RouteHandler()


def get_route_handler() -> RouteHandler:
    """
    Get the global route handler instance
    
    Returns:
        RouteHandler instance
    """
    return route_handler 