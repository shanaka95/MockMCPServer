"""
Database Service for MCP Server - Session and data management using DynamoDB
"""

import boto3
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
from boto3.dynamodb.conditions import Key
from ..constants import DEFAULT_SESSION_TABLE_ENV, DEFAULT_SESSION_TABLE_NAME


logger = logging.getLogger(__name__)


class SessionStore(ABC):
    """Abstract base class for session storage implementations."""

    @abstractmethod
    def create_session(self, session_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Create a new session.

        Args:
            session_data: Optional initial session data

        Returns:
            The session ID
        """
        pass

    @abstractmethod
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data.

        Args:
            session_id: The session ID to look up

        Returns:
            Session data or None if not found
        """
        pass

    @abstractmethod
    def update_session(self, session_id: str, session_data: Dict[str, Any]) -> bool:
        """
        Update session data.

        Args:
            session_id: The session ID to update
            session_data: New session data

        Returns:
            True if successful, False otherwise
        """
        pass

    @abstractmethod
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session.

        Args:
            session_id: The session ID to delete

        Returns:
            True if successful, False otherwise
        """
        pass

    @abstractmethod
    def get_all_sessions(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get all sessions for a user.

        Args:
            user_id: The user ID to look up

        Returns:
            List of session data or None if not found
        """
        pass


class DynamoDBService(SessionStore):
    """Database service for managing MCP sessions using DynamoDB."""

    def __init__(self, table_name: Optional[str] = None):
        """
        Initialize the database service.

        Args:
            table_name: Name of DynamoDB table to use for sessions.
                       If None, uses environment variable or default.
        """
        import os
        
        self.table_name = table_name or os.environ.get(
            DEFAULT_SESSION_TABLE_ENV, 
            DEFAULT_SESSION_TABLE_NAME
        )
        
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(self.table_name)
        
        logger.info(f"Initialized DynamoDB service with table: {self.table_name}")

    def create_session(self, session_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Create a new session.

        Args:
            session_data: Session data to store

        Returns:
            The session ID

        Raises:
            Exception: If session creation fails
        """
        if not session_data or 'session_id' not in session_data:
            raise ValueError("Session data must contain session_id")
        
        try:
            self.table.put_item(Item=session_data)
            session_id = session_data["session_id"]
            logger.info(f'Created session {session_id}')
            return session_id
        except Exception as e:
            logger.error(f'Error creating session: {e}')
            raise

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data by session ID.

        Args:
            session_id: The session ID to look up

        Returns:
            Session data or None if not found
        """
        try:
            response = self.table.get_item(Key={'session_id': session_id})
            session = response.get('Item')
            
            if session:
                logger.debug(f'Retrieved session {session_id}')
            else:
                logger.debug(f'Session {session_id} not found')
                
            return session
        except Exception as e:
            logger.error(f'Error getting session {session_id}: {e}')
            return None
        
    def get_all_sessions(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get all sessions for a specific user.

        Args:
            user_id: The user ID to look up

        Returns:
            List of session data or None if error occurs
        """
        try:
            # Query the UserIdIndex GSI to efficiently get all sessions for a user
            response = self.table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression=Key('user_id').eq(user_id)
            )
            sessions = response.get('Items', [])
            logger.debug(f'Retrieved {len(sessions)} sessions for user {user_id}')
            return sessions
        except Exception as e:
            logger.error(f'Error getting all sessions for user {user_id}: {e}')
            return None

    def update_session(self, session_id: str, session_data: Dict[str, Any]) -> bool:
        """
        Update session data.

        Args:
            session_id: The session ID to update
            session_data: New session data

        Returns:
            True if successful, False otherwise
        """
        try:
            # Update all fields in session_data
            update_expression_parts = []
            expression_attribute_names = {}
            expression_attribute_values = {}
            
            for key, value in session_data.items():
                if key != 'session_id':  # Don't update the primary key
                    safe_key = f'#{key}'
                    value_key = f':{key}'
                    update_expression_parts.append(f'{safe_key} = {value_key}')
                    expression_attribute_names[safe_key] = key
                    expression_attribute_values[value_key] = value
            
            if not update_expression_parts:
                logger.warning(f'No fields to update for session {session_id}')
                return True
            
            update_expression = 'SET ' + ', '.join(update_expression_parts)
            
            self.table.update_item(
                Key={'session_id': session_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
            )
            
            logger.info(f'Updated session {session_id}')
            return True
        except Exception as e:
            logger.error(f'Error updating session {session_id}: {e}')
            return False

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session.

        Args:
            session_id: The session ID to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            self.table.delete_item(Key={'session_id': session_id})
            logger.info(f'Deleted session {session_id}')
            return True
        except Exception as e:
            logger.error(f'Error deleting session {session_id}: {e}')
            return False
    
    def delete_expired_sessions(self, current_timestamp: int) -> int:
        """
        Delete expired sessions (utility method).

        Args:
            current_timestamp: Current timestamp to compare against expires_at

        Returns:
            Number of sessions deleted
        """
        try:
            # This would require a scan operation which is expensive
            # In a real implementation, you might want to use a TTL attribute instead
            # or implement this as a separate cleanup job
            logger.info("Expired session cleanup not implemented - consider using DynamoDB TTL")
            return 0
        except Exception as e:
            logger.error(f'Error cleaning up expired sessions: {e}')
            return 0


# Create a factory function for easier instantiation
def create_database_service(table_name: Optional[str] = None) -> DynamoDBService:
    """
    Factory function to create a database service instance.
    
    Args:
        table_name: Optional table name override
        
    Returns:
        DynamoDBService instance
    """
    return DynamoDBService(table_name)


# For backward compatibility, create an alias
DynamoDBSessionStore = DynamoDBService 