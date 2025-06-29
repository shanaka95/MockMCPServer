from utils import extract_session_id_from_arn
from m2m_validator import validate_m2m_token
from cognito_validator import validate_cognito_token
from policy_generator import create_m2m_auth_policy, create_cognito_auth_policy


def handle_m2m_token(token, method_arn):
    """Handle machine-to-machine token validation"""
    
    # Extract session ID from the API Gateway method ARN
    # The URL pattern is: /servers/{session_id}/mcp
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
    
    # Return authorization policy for this M2M request - only allow access to this specific server's MCP endpoint
    return create_m2m_auth_policy(
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
    
    # Return authorization policy for this Cognito user - allow access to /servers and /upload-image endpoints
    return create_cognito_auth_policy(
        principal_id=user_id,
        method_arn=method_arn,
        context={
            'userId': user_id,
            'tokenType': 'cognito'
        }
    )