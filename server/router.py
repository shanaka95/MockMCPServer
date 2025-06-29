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
    
    # Extract authentication context from authorizer
    user_id = None
    session_id = None
    token_type = None
    
    request_context = event.get('requestContext', {})
    authorizer_context = request_context.get('authorizer', {})
    
    if isinstance(authorizer_context, dict):
        user_id = authorizer_context.get('userId')
        session_id = authorizer_context.get('sessionId')
        token_type = authorizer_context.get('tokenType')
    
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
    
    print(f"Processing request for user: {user_id}, token_type: {token_type}")
    
    # Get first part of path
    path_parts = path.split('/')
    print(path_parts)
    if len(path_parts) > 1:
        resource = path_parts[1] # server
        extracted_session_id = path_parts[2] if len(path_parts) > 2 else None
        protocol = path_parts[-1]
        
        # Server creation and listing - requires Cognito token (user authentication)
        if resource == 'server' and protocol != 'mcp' and event.get('httpMethod') == 'POST':
            # Only allow Cognito authenticated users to create servers
            if token_type != 'cognito':
                return {
                    'statusCode': 403,
                    'body': json.dumps({
                        'error': 'Server creation requires user authentication'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            # Extract and validate request data using Pydantic
            request_data = json.loads(event.get('body', '{}'))
            print(f"Creating server for user: {user_id}")
            # Handle MCP server creation request
            return mcp_server_handler.create_server(request_data, user_id)
            
        elif resource == 'upload-image' and event.get('httpMethod') == 'POST':
            # Only allow Cognito authenticated users to upload images
            if token_type != 'cognito':
                return {
                    'statusCode': 403,
                    'body': json.dumps({
                        'error': 'Image upload requires user authentication'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            # Extract and validate request data
            request_data = json.loads(event.get('body', '{}'))
            print(f"Uploading image for user: {user_id}")
            # Handle image upload request
            return mcp_server_handler.upload_image(request_data, user_id)
            
        elif resource == 'server' and protocol != 'mcp' and event.get('httpMethod') == 'GET':
            # Only allow Cognito authenticated users to list their servers
            if token_type != 'cognito':
                return {
                    'statusCode': 403,
                    'body': json.dumps({
                        'error': 'Server listing requires user authentication'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            # Handle MCP server listing request
            print(f"Getting all servers for user: {user_id}")
            return mcp_server_handler.get_all_servers(user_id)
            
        # MCP server access - requires M2M token
        elif resource == 'server' and protocol == 'mcp':
            # Only allow M2M authenticated requests for MCP server access
            if token_type != 'm2m':
                return {
                    'statusCode': 403,
                    'body': json.dumps({
                        'error': 'MCP server access requires M2M authentication'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            # For M2M tokens, verify the session_id matches the requested session
            if session_id != extracted_session_id:
                return {
                    'statusCode': 403,
                    'body': json.dumps({
                        'error': 'M2M token is not valid for this session'
                    }),
                    'headers': {
                        'Content-Type': 'application/json'
                    }
                }
            
            print(f"Loading MCP server for session: {session_id}, user: {user_id}")
            return mcp_server_handler.load_server(extracted_session_id, user_id, event, context)
        
    
    # Default 404 response
    return {
        'statusCode': 404,
        'body': 'Not Found',
        'headers': {
            'Content-Type': 'text/plain'
        }
    }
