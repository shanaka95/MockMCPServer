import os
import boto3
import hashlib

# Set up AWS DynamoDB connection
dynamodb = boto3.resource('dynamodb')

def validate_m2m_token(token, session_id):
    """
    Check if an M2M token is valid by comparing its hash with stored data.
    M2M tokens are long-lived tokens for server-to-server communication.
    """
    try:
        # Get the session table from DynamoDB
        table_name = os.environ.get('MCP_SESSION_TABLE', 'mcp_sessions')
        table = dynamodb.Table(table_name)
        
        # Create hash of the provided token to compare with stored hash
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Look up the session in our database
        response = table.get_item(Key={'session_id': session_id})
        
        if 'Item' not in response:
            print(f"No session found: {session_id}")
            return None
        
        session = response['Item']
        
        # Make sure the session is still active
        if session.get('status') != 'active':
            print(f"Session {session_id} is not active")
            return None
        
        # Compare the token hash with what we have stored
        stored_hash = session.get('m2m_token_hash')
        if not stored_hash or token_hash != stored_hash:
            print(f"Token hash mismatch for session {session_id}")
            return None
        
        # All good. Return the user ID associated with this session
        return session.get('user_id')
        
    except Exception as e:
        print(f"M2M validation error: {str(e)}")
        return None 