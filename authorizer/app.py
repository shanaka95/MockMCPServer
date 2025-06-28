import os
import json
import jwt
import requests
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from cryptography.hazmat.primitives import serialization

def lambda_handler(event, context):
    """Lambda authorizer for API Gateway that validates Cognito JWT tokens."""
    
    # Get the Authorization header from the event
    auth_header = event.get('authorizationToken', '')
    method_arn = event['methodArn']
    
    try:
        # Check if it's a Bearer token
        if not auth_header.startswith('Bearer '):
            print("Missing or invalid Authorization header format")
            raise Exception('Unauthorized')
        
        # Extract JWT token
        token = auth_header.split(' ')[1]
        if not token:
            print("Empty token")
            raise Exception('Unauthorized')
        
        # Validate token and get user ID
        user_id = validate_cognito_token(token)
        if not user_id:
            print("Token validation failed")
            raise Exception('Unauthorized')
        
        print(f"Successfully validated token for user: {user_id}")
        
        # Generate the IAM policy with user context
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
                'userId': user_id
            }
        }
        
    except Exception as e:
        print(f"Authorization failed: {str(e)}")
        raise Exception('Unauthorized')

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