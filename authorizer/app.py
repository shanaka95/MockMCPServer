from token_handler import handle_m2m_token, handle_cognito_token

def lambda_handler(event, context):
    """
    AWS Lambda authorizer that validates tokens for API Gateway requests.
    Supports both Cognito JWT tokens and custom M2M (machine-to-machine) tokens.
    """
    
    # Extract the authorization token and method info from the request
    auth_header = event.get('authorizationToken', '')
    method_arn = event['methodArn']
    print(f"Method ARN: {method_arn}")
    
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