"""
Token Generator utility for creating secure IDs and tokens
"""

import secrets
import hashlib
from ..constants import (
    DEFAULT_ID_LENGTH,
    M2M_TOKEN_RANDOM_LENGTH,
    M2M_TOKEN_DETERMINISTIC_LENGTH,
    M2M_TOKEN_PREFIX
)


class TokenGenerator:
    """Utility class for generating secure tokens and IDs"""
    
    @staticmethod
    def generate_id(length: int = DEFAULT_ID_LENGTH) -> str:
        """
        Generate a short, cryptographically secure random ID
        
        Args:
            length: Length of the ID to generate
            
        Returns:
            Short random ID
        """
        return secrets.token_urlsafe(length)[:length]
    
    @staticmethod
    def generate_m2m_token(session_id: str, user_id: str) -> str:
        """
        Generate a secure M2M token for MCP server access
        
        Args:
            session_id: Unique session identifier
            user_id: User who owns the server
            
        Returns:
            Secure M2M token with prefix
        """
        # Generate a cryptographically secure random token
        random_part = secrets.token_urlsafe(M2M_TOKEN_RANDOM_LENGTH)
        
        # Create a deterministic part based on session and user
        deterministic_part = hashlib.sha256(
            f"{session_id}:{user_id}".encode()
        ).hexdigest()[:M2M_TOKEN_DETERMINISTIC_LENGTH]
        
        # Combine with prefix for easy identification
        return f"{M2M_TOKEN_PREFIX}_{random_part}_{deterministic_part}"
    
    @staticmethod
    def hash_token(token: str) -> str:
        """
        Generate a SHA256 hash of a token for secure storage
        
        Args:
            token: Token to hash
            
        Returns:
            SHA256 hex digest of the token
        """
        return hashlib.sha256(token.encode()).hexdigest() 