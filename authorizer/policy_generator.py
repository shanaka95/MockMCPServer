def create_m2m_auth_policy(principal_id, method_arn, context=None):
    """Create the authorization policy response for M2M tokens - allows access to any server's MCP endpoint"""
    # Extract base ARN and create resource pattern for /servers/*/mcp (any server)
    # From: arn:aws:execute-api:region:account:api/stage/method/servers/session123/mcp
    # To:   arn:aws:execute-api:region:account:api/stage/*/servers/*/mcp
    arn_parts = method_arn.split('/')
    base_arn = '/'.join(arn_parts[:2])  # Gets "arn:aws:execute-api:region:account:api/stage"
    mcp_resource = f"{base_arn}/*/servers/*/mcp"
    
    policy = {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': 'Allow',
                'Resource': mcp_resource
            }]
        }
    }
    
    if context:
        policy['context'] = context
    
    return policy

def create_cognito_auth_policy(principal_id, method_arn, context=None):
    """Create the authorization policy response for Cognito tokens - allows access to /servers and /upload-image endpoints"""
    # Extract base ARN and create resource patterns for /servers and /upload-image
    # From: arn:aws:execute-api:region:account:api/stage/method/path
    # To:   arn:aws:execute-api:region:account:api/stage/*/servers and arn:aws:execute-api:region:account:api/stage/*/upload-image
    arn_parts = method_arn.split('/')
    base_arn = '/'.join(arn_parts[:2])  # Gets "arn:aws:execute-api:region:account:api/stage"
    
    policy = {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': 'Allow',
                'Resource': [
                    f"{base_arn}/*/servers",
                    f"{base_arn}/*/images"
                ]
            }]
        }
    }
    
    if context:
        policy['context'] = context
    
    return policy