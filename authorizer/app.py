import os
import json
import jwt
import requests
import boto3
import hashlib
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from cryptography.hazmat.primitives import serialization

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """Lambda authorizer for API Gateway that validates Cognito JWT tokens and M2M tokens."""
    
    # Get the Authorization header from the event
    auth_header = event.get('authorizationToken', '')
    method_arn = event['methodArn']
    
    try:
        # Check if it's a Bearer token
        if not auth_header.startswith('Bearer '):
            print("Missing or invalid Authorization header format")
            raise Exception('Unauthorized')
        
        # Extract token
        token = auth_header.split(' ')[1]
        if not token:
            print("Empty token")
            raise Exception('Unauthorized')
        
        # Determine token type and validate accordingly
        if token.startswith('mcp_m2m_'):
            # Handle M2M token
            print("Processing M2M token")
            validation_result = validate_m2m_token(token)
            
            if not validation_result:
                print("M2M token validation failed")
                raise Exception('Unauthorized')
                
            user_id, session_id = validation_result
            print(f"Successfully validated M2M token for session: {session_id}, user: {user_id}")
            
            return {
                'principalId': f"m2m:{session_id}:{user_id}",
                'policyDocument': {
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Action': 'execute-api:Invoke',
                        'Effect': 'Allow',
                        'Resource': method_arn
                    }]
                },
                'context': {
                    'userId': user_id,
                    'sessionId': session_id,
                    'tokenType': 'm2m'
                }
            }
        else:
            # Handle Cognito JWT token
            print("Processing Cognito JWT token")
            user_id = validate_cognito_token(token)
            if not user_id:
                print("Cognito token validation failed")
                raise Exception('Unauthorized')
            
            print(f"Successfully validated Cognito token for user: {user_id}")
            
            return {
                'principalId': user_id,
                'policyDocument': {
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Action': 'execute-api:Invoke',
                        'Effect': 'Allow',
                        'Resource': method_arn
                    }]
                },
                'context': {
                    'userId': user_id,
                    'tokenType': 'cognito'
                }
            }
        
    except Exception as e:
        print(f"Authorization failed: {str(e)}")
        raise Exception('Unauthorized')

def validate_m2m_token(token):
    """
    Validate M2M token against stored hash in DynamoDB
    
    Args:
        token: M2M token string
        
    Returns:
        tuple: (user_id, session_id) if valid, None otherwise
    """
    try:
        # Get DynamoDB table name from environment variable
        table_name = os.environ.get('MCP_SESSION_TABLE', 'mcp_sessions')
        table = dynamodb.Table(table_name)
        
        # Hash the provided token
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Search for session with matching token hash
        # Note: This is a scan operation which is not ideal for large datasets
        # For production, consider using a GSI on m2m_token_hash
        response = table.scan(
            FilterExpression='m2m_token_hash = :token_hash',
            ExpressionAttributeValues={
                ':token_hash': token_hash
            }
        )
        
        if not response['Items']:
            print("No session found with matching M2M token hash")
            return None
        
        if len(response['Items']) > 1:
            print("Multiple sessions found with same M2M token hash - security issue!")
            return None
        
        session = response['Items'][0]
        
        # Check if session is still active
        if session.get('status') != 'active':
            print(f"Session {session.get('session_id')} is not active")
            return None
        
        # For M2M tokens, we don't check expiration as they should be long-lived
        # But you could add additional checks here if needed
        
        return session.get('user_id'), session.get('session_id')
        
    except Exception as e:
        print(f"M2M token validation error: {str(e)}")
        return None

def validate_cognito_token(token):
    """
    Validate Cognito JWT token and return user ID
    
    Args:
        token: JWT token string
        
    Returns:
        str: User ID (sub claim) if valid, None otherwise
    """
    try:
        user_pool_id = os.environ.get('USER_POOL_ID')
        if not user_pool_id:
            print("USER_POOL_ID environment variable not set")
            return None
        
        # Extract region from user pool ID
        region = user_pool_id.split('_')[0]
        
        # Get JWT header to find the key ID
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        
        if not kid:
            print("No key ID found in token header")
            return None
        
        # Get the public keys from Cognito
        jwks_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
        jwks_response = requests.get(jwks_url, timeout=10)
        jwks_response.raise_for_status()
        jwks = jwks_response.json()
        
        # Find the matching key
        public_key = None
        for key in jwks['keys']:
            if key['kid'] == kid:
                # Convert JWK to PEM format
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                break
        
        if not public_key:
            print(f"No matching key found for kid: {kid}")
            return None
        
        # Verify and decode the token
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            options={
                'verify_signature': True,
                'verify_exp': True,
                'verify_aud': False,  # We'll verify manually if needed
                'verify_iss': True
            },
            issuer=f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}'
        )
        
        # Extract user ID from the 'sub' claim
        user_id = decoded_token.get('sub')
        if not user_id:
            print("No 'sub' claim found in token")
            return None
        
        # Additional validation
        token_use = decoded_token.get('token_use')
        if token_use not in ['access', 'id']:
            print(f"Invalid token_use: {token_use}")
            return None
        
        return user_id
        
    except ExpiredSignatureError:
        print("Token has expired")
        return None
    except InvalidTokenError as e:
        print(f"Invalid token: {str(e)}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch JWKS: {str(e)}")
        return None
    except Exception as e:
        print(f"Token validation error: {str(e)}")
        return None 