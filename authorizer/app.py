from cognito_validator import validate_cognito_token
from m2m_validator import validate_m2m_token

def lambda_handler(event, context):
    """
    AWS Lambda authorizer that validates tokens for API Gateway requests.
    Supports both Cognito JWT tokens and custom M2M (machine-to-machine) tokens.
    """
    
    # Extract the authorization token and method info from the request
    auth_header = event.get('authorizationToken', '')
    method_arn = event['methodArn']
    
    try:
        # Make sure we have a proper Bearer token format
        if not auth_header.startswith('Bearer '):
            raise Exception('Unauthorized')
        
        # Pull out just the token part (after "Bearer ")
        token = auth_header.split(' ')[1]
        if not token:
            raise Exception('Unauthorized')
        
        # Route to the right validation based on token type
        if token.startswith('mcp_m2m_'):
            return handle_m2m_token(token, method_arn)
        else:
            return handle_cognito_token(token, method_arn)
        
    except Exception as e:
        print(f"Authorization failed: {str(e)}")
        raise Exception('Unauthorized')

def handle_m2m_token(token, method_arn):
    """Handle machine-to-machine token validation"""
    
    # Extract session ID from the API Gateway method ARN
    # The URL pattern is: /server/{session_id}/mcp
    session_id = extract_session_id_from_arn(method_arn)
    if not session_id:
        print("Could not find session ID in request URL")
        raise Exception('Unauthorized')
    
    # Validate the M2M token against our database
    user_id = validate_m2m_token(token, session_id)
    if not user_id:
        print("M2M token validation failed")
        raise Exception('Unauthorized')
    
    print(f"M2M token validated for session {session_id}, user {user_id}")
    
    # Return authorization policy for this M2M request
    return create_auth_policy(
        principal_id=f"m2m:{session_id}:{user_id}",
        method_arn=method_arn,
        context={
            'userId': user_id,
            'sessionId': session_id,
            'tokenType': 'm2m'
        }
    )

def handle_cognito_token(token, method_arn):
    """Handle Cognito JWT token validation"""
    
    user_id = validate_cognito_token(token)
    if not user_id:
        print("Cognito token validation failed")
        raise Exception('Unauthorized')
    
    print(f"Cognito token validated for user {user_id}")
    
    # Return authorization policy for this Cognito user
    return create_auth_policy(
        principal_id=user_id,
        method_arn=method_arn,
        context={
            'userId': user_id,
            'tokenType': 'cognito'
        }
    )

def extract_session_id_from_arn(method_arn):
    """
    Extract session ID from API Gateway method ARN.
    Looks for pattern: .../server/{session_id}/mcp/...
    """
    try:
        arn_parts = method_arn.split('/')
        # Find the pattern: server/SESSION_ID/mcp
        for i, part in enumerate(arn_parts):
            if part == 'server' and i + 2 < len(arn_parts) and arn_parts[i + 2] == 'mcp':
                return arn_parts[i + 1]
        return None
    except Exception:
        return None

def create_auth_policy(principal_id, method_arn, context=None):
    """Create the authorization policy response for API Gateway"""
    policy = {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': 'Allow',
                'Resource': method_arn
            }]
        }
    }
    
    if context:
        policy['context'] = context
    
    return policy

 