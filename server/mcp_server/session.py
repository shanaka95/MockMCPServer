# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# This file contains code originally developed by Amazon.com, Inc. or its affiliates.
# 
# Modifications Copyright (c) 2025 Shanaka Anuradha

"""Session management for MCP server with pluggable storage."""

import boto3
import logging
import time
import uuid
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
from boto3.dynamodb.conditions import Key


logger = logging.getLogger(__name__)


class SessionStore(ABC):
    """Abstract base class for session storage implementations."""

    @abstractmethod
    def create_session(self, session_data: Optional[Dict[str, Any]] = None) -> str:
        """Create a new session.

        Args:
            session_data: Optional initial session data

        Returns:
            The session ID

        """
        pass

    @abstractmethod
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data.

        Args:
            session_id: The session ID to look up

        Returns:
            Session data or None if not found

        """
        pass

    @abstractmethod
    def update_session(self, session_id: str, session_data: Dict[str, Any]) -> bool:
        """Update session data.

        Args:
            session_id: The session ID to update
            session_data: New session data

        Returns:
            True if successful, False otherwise

        """
        pass

    @abstractmethod
    def delete_session(self, session_id: str) -> bool:
        """Delete a session.

        Args:
            session_id: The session ID to delete

        Returns:
            True if successful, False otherwise

        """
        pass


class DynamoDBSessionStore(SessionStore):
    """Manages MCP sessions using DynamoDB."""

    def __init__(self, table_name: str = 'mcp_sessions'):
        """Initialize the session store.

        Args:
            table_name: Name of DynamoDB table to use for sessions

        """
        self.table_name = table_name
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)  # pyright: ignore [reportAttributeAccessIssue]

    def create_session(self, session_data: Optional[Dict[str, Any]] = None) -> str:
        """Create a new session.

        Args:
            session_data: Optional initial session data

        Returns:
            The session ID

        """
        self.table.put_item(Item=session_data)
        logger.info(f'Created session {session_data["session_id"]}')

        return session_data["session_id"]

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data.

        Args:
            session_id: The session ID to look up

        Returns:
            Session data or None if not found

        """
        try:
            response = self.table.get_item(Key={'session_id': session_id})
            session = response.get('Item')
            if not session:
                return None
            return session
        except Exception as e:
            logger.error(f'Error getting session {session_id}: {e}')
            return None
        
    def get_all_sessions(self, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get all sessions for a user.

        Args:
            user_id: The user ID to look up

        Returns:
            List of session data or None if not found   
        """
        try:
            # Query the UserIdIndex GSI to efficiently get all sessions for a user
            response = self.table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression=Key('user_id').eq(user_id)
            )
            sessions = response.get('Items', [])
            return sessions
        except Exception as e:
            logger.error(f'Error getting all sessions for user {user_id}: {e}')
            return None

    def update_session(self, session_id: str, session_data: Dict[str, Any]) -> bool:
        """Update session data.

        Args:
            session_id: The session ID to update
            session_data: New session data

        Returns:
            True if successful, False otherwise

        """
        try:
            self.table.update_item(
                Key={'session_id': session_id},
                UpdateExpression='SET #data = :data',
                ExpressionAttributeNames={'#data': 'data'},
                ExpressionAttributeValues={':data': session_data},
            )
            return True
        except Exception as e:
            logger.error(f'Error updating session {session_id}: {e}')
            return False

    def delete_session(self, session_id: str) -> bool:
        """Delete a session.

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