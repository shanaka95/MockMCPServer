from mcp_server.mcp_server_handler import mcp_server_handler
import json

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
    
    # Extract user ID from authorizer context
    user_id = None
    request_context = event.get('requestContext', {})
    authorizer_context = request_context.get('authorizer', {})
    
    if isinstance(authorizer_context, dict):
        user_id = authorizer_context.get('userId')
    
    if not user_id:
        return {
            'statusCode': 401,
            'body': json.dumps({
                'error': 'User ID not found in request context'
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    
    print(f"Processing request for user: {user_id}")
    
    # Get first part of path
    path_parts = path.split('/')
    print(path_parts)
    if len(path_parts) > 1:
        resource = path_parts[1] # server
        session_id = path_parts[2] if len(path_parts) > 2 else None
        protocol = path_parts[-1]
        
        if resource == 'server' and protocol != 'mcp' and event.get('httpMethod') == 'POST':
            # Extract and validate request data using Pydantic
            request_data = json.loads(event.get('body', '{}'))
            # Handle MCP server creation request
            return mcp_server_handler.create_server(request_data, user_id)
        elif resource == 'server' and protocol == 'mcp':
            return mcp_server_handler.load_server(session_id, user_id, event, context)
        
    
    # Default 404 response
    return {
        'statusCode': 404,
        'body': 'Not Found',
        'headers': {
            'Content-Type': 'text/plain'
        }
    }
