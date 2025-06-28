import os
import json
import jwt
import requests
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

def validate_cognito_token(token):
    """
    Validate a Cognito JWT token by checking its signature and claims.
    Returns the user ID if the token is valid and not expired.
    """
    try:
        # Get Cognito configuration from environment
        user_pool_id = os.environ.get('USER_POOL_ID')
        if not user_pool_id:
            print("USER_POOL_ID not configured")
            return None
        
        # Figure out which AWS region this user pool is in
        region = user_pool_id.split('_')[0]
        
        # Get the key ID from the token header to find the right public key
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        if not kid:
            print("No key ID in token header")
            return None
        
        # Fetch Cognito's public keys to verify the token signature
        jwks_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
        jwks_response = requests.get(jwks_url, timeout=10)
        jwks_response.raise_for_status()
        jwks = jwks_response.json()
        
        # Find the specific key that matches our token
        public_key = None
        for key in jwks['keys']:
            if key['kid'] == kid:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                break
        
        if not public_key:
            print(f"No matching key found for {kid}")
            return None
        
        # Verify the token signature and decode the claims
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            options={
                'verify_signature': True,
                'verify_exp': True,  # Check if token has expired
                'verify_aud': False,  # Skip audience verification
                'verify_iss': True   # Verify the issuer
            },
            issuer=f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}'
        )
        
        # Extract the user ID from the token
        user_id = decoded_token.get('sub')
        if not user_id:
            print("No user ID in token")
            return None
        
        # Make sure this is a valid token type (access or ID token)
        token_use = decoded_token.get('token_use')
        if token_use not in ['access', 'id']:
            print(f"Invalid token type: {token_use}")
            return None
        
        return user_id
        
    except ExpiredSignatureError:
        print("Token has expired")
        return None
    except InvalidTokenError as e:
        print(f"Invalid token: {str(e)}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch Cognito keys: {str(e)}")
        return None
    except Exception as e:
        print(f"Token validation error: {str(e)}")
        return None 