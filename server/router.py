from mcp_server.mcp_server_handler import mcp_server_handler


def router(event, context):
    """
    Route incoming requests to appropriate handlers
    
    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object
        
    Returns:
        Response from the appropriate handler
    """
    path = event.get('path', '')
    
    # Get first part of path
    path_parts = path.split('/')
    if len(path_parts) > 1:
        first_part = path_parts[1]
        last_part = path_parts[-1]
        
        if first_part == 'server' and event.get('httpMethod') == 'POST':
            # Handle MCP server creation request
            return mcp_server_handler.create_server(event, context)
        
    
    # Default 404 response
    return {
        'statusCode': 404,
        'body': 'Not Found',
        'headers': {
            'Content-Type': 'text/plain'
        }
    }
