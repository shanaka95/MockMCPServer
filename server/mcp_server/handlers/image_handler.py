"""
Image Handler for managing image upload operations
"""

from typing import Dict, Any
from ..services import S3Service
from ..utils import ResponseBuilder


class ImageHandler:
    """
    Handler class for managing image upload requests
    """
    
    def __init__(self):
        """Initialize the image handler"""
        # Initialize S3 service for image operations
        self.s3_service = S3Service()
    
    def upload_image(self, request_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Handle image upload request
        
        Args:
            request_data: Request data containing base64 encoded image
            user_id: ID of the authenticated user uploading the image
            
        Returns:
            Dict containing response with status code and body
        """
        try:
            # Validate required fields
            if 'image_data' not in request_data:
                return ResponseBuilder.bad_request(
                    'Missing image_data field', 
                    include_cors=True
                )
            
            image_data = request_data['image_data']
            filename = request_data.get('filename')
            
            # Upload image to S3
            s3_key = self.s3_service.upload_image(image_data, filename)
            
            response_data = {
                'message': 'Image uploaded successfully',
                'key': s3_key,
                'bucket': self.s3_service.bucket,
                'user_id': user_id  # Include user context
            }
            
            return ResponseBuilder.success(response_data, include_cors=True)
            
        except Exception as e:
            return ResponseBuilder.error(
                f'Image upload failed: {str(e)}', 
                include_cors=True
            )
    
    def get_upload_presigned_url(self, request_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Generate a presigned URL for direct S3 upload (future enhancement)
        
        Args:
            request_data: Request data containing file details
            user_id: ID of the authenticated user
            
        Returns:
            Dict containing presigned URL response
        """
        # This is a placeholder for future implementation
        # Could be used to allow direct browser-to-S3 uploads
        return ResponseBuilder.error(
            'Presigned URL generation not yet implemented',
            include_cors=True
        )
    
    def delete_image(self, request_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Delete an uploaded image (future enhancement)
        
        Args:
            request_data: Request data containing image key to delete
            user_id: ID of the authenticated user
            
        Returns:
            Dict containing deletion response
        """
        # This is a placeholder for future implementation
        # Would need to verify user owns the image before deletion
        return ResponseBuilder.error(
            'Image deletion not yet implemented',
            include_cors=True
        ) 