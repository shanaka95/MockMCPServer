"""
Output handler for processing different types of tool outputs in MCP responses
"""

import json
import logging
from typing import Any, List, Dict
from ..types import TextContent, ImageContent
from ..services import S3Service

logger = logging.getLogger(__name__)


class OutputHandler:
    """Handles processing of different output types for MCP responses"""
    
    def __init__(self):
        """Initialize the output handler with S3 service"""
        self.s3_service = S3Service()
    
    def process_output(self, result: Any) -> List[Dict]:
        """
        Process tool output and return appropriate content list
        
        Args:
            result: The tool execution result
            
        Returns:
            List of content dictionaries for MCP response
        """
        try:
            # Convert result to string and try to parse as JSON
            result_str = str(result)
            
            # Try to parse as JSON to check if it's structured data
            try:
                parsed_result = json.loads(result_str)
                
                # Check if it's an image output
                if isinstance(parsed_result, dict) and parsed_result.get('type') == 'image':
                    return self._handle_image_output(parsed_result)
                
            except json.JSONDecodeError:
                # Not JSON, treat as text
                pass
            
            # Default to text content
            return self._handle_text_output(result_str)
            
        except Exception as e:
            logger.error(f"Error processing output: {e}")
            # Return error as text content
            return [TextContent(text=f"Error processing output: {str(e)}").model_dump()]
    
    def _handle_text_output(self, text: str) -> List[Dict]:
        """
        Handle text output
        
        Args:
            text: Text content
            
        Returns:
            List with text content
        """
        return [TextContent(text=text).model_dump()]
    
    def _handle_image_output(self, image_data: Dict) -> List[Dict]:
        """
        Handle image output by fetching from S3 and creating ImageContent
        
        Args:
            image_data: Dictionary containing image information
            
        Returns:
            List with image content
        """
        try:
            s3_key = image_data.get('s3_key')
            s3_bucket = image_data.get('s3_bucket')
            
            if not s3_key:
                raise ValueError("Image output missing s3_key")
            
            # Get image from S3
            base64_data, mime_type = self.s3_service.get_image(s3_key, s3_bucket)
            
            # Create ImageContent
            image_content = ImageContent(
                data=base64_data,
                mimeType=mime_type
            )
            
            return [image_content.model_dump()]
            
        except Exception as e:
            logger.error(f"Error handling image output: {e}")
            # Return error as text content
            return [TextContent(text=f"Error loading image: {str(e)}").model_dump()]
