"""
S3 Service for handling image uploads and bucket operations
"""

import os
import base64
import uuid
import boto3
from botocore.exceptions import ClientError
from ..constants import (
    DEFAULT_S3_BUCKET_ENV,
    DEFAULT_S3_BUCKET_NAME,
    S3_IMAGE_PREFIX,
    DEFAULT_IMAGE_CONTENT_TYPE,
    DEFAULT_IMAGE_EXTENSION
)


class S3Service:
    """Service class for handling S3 operations"""
    
    def __init__(self, bucket_name: str = None):
        """
        Initialize S3 service
        
        Args:
            bucket_name: Optional bucket name override
        """
        self.s3_client = boto3.client('s3')
        self.bucket_name = bucket_name or os.environ.get(
            DEFAULT_S3_BUCKET_ENV, 
            DEFAULT_S3_BUCKET_NAME
        )
        self._bucket_checked = False
        # Don't check bucket existence during init - defer until needed
    
    def _ensure_bucket_exists(self) -> None:
        """Ensure the S3 bucket exists - gracefully handle permission issues"""
        if self._bucket_checked:
            return
            
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            print(f"S3 bucket '{self.bucket_name}' exists and is accessible")
            self._bucket_checked = True
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                # Bucket doesn't exist, try to create it
                try:
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                    print(f"Created S3 bucket: {self.bucket_name}")
                    self._bucket_checked = True
                except ClientError as create_error:
                    print(f"Failed to create S3 bucket: {create_error}")
                    # Continue anyway - maybe we can still upload
                    self._bucket_checked = True
            elif error_code == 403:
                # Access denied - might not have ListBucket permission
                # This is common in production - assume bucket exists and continue
                print(f"Warning: Access denied checking bucket '{self.bucket_name}' - assuming it exists")
                self._bucket_checked = True
            else:
                print(f"Warning: Error checking S3 bucket '{self.bucket_name}': {e}")
                # Don't fail - try to continue with uploads
                self._bucket_checked = True
    
    def upload_image(self, image_data: str, filename: str = None) -> str:
        """
        Upload base64 encoded image data to S3
        
        Args:
            image_data: Base64 encoded image data
            filename: Optional filename, will generate one if not provided
            
        Returns:
            str: S3 key of the uploaded image
            
        Raises:
            Exception: If upload fails
        """
        try:
            # Check bucket exists before attempting upload
            self._ensure_bucket_exists()
            
            image_bytes, content_type, file_extension = self._process_image_data(image_data)
            
            # Generate filename if not provided
            if not filename:
                filename = f"{uuid.uuid4().hex}.{file_extension}"
            
            # Upload to S3
            key = f"{S3_IMAGE_PREFIX}/{filename}"
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=image_bytes,
                ContentType=content_type
            )
            
            print(f"Successfully uploaded image to S3: {key}")
            return key
            
        except ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 403:
                raise Exception(f"Access denied uploading to S3 bucket '{self.bucket_name}'. Check IAM permissions.")
            elif error_code == 404:
                raise Exception(f"S3 bucket '{self.bucket_name}' not found. Check bucket name and permissions.")
            else:
                raise Exception(f"AWS error uploading image to S3: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to upload image to S3: {str(e)}")
    
    def _process_image_data(self, image_data: str) -> tuple[bytes, str, str]:
        """
        Process base64 image data and extract metadata
        
        Args:
            image_data: Base64 encoded image data
            
        Returns:
            tuple: (image_bytes, content_type, file_extension)
        """
        if image_data.startswith('data:'):
            # Remove data:image/jpeg;base64, prefix if present
            header, encoded = image_data.split(',', 1)
            image_bytes = base64.b64decode(encoded)
            
            # Extract content type from header
            content_type = header.split(';')[0].split(':')[1]
            file_extension = content_type.split('/')[1]
        else:
            # Assume it's already base64 encoded
            image_bytes = base64.b64decode(image_data)
            content_type = DEFAULT_IMAGE_CONTENT_TYPE
            file_extension = DEFAULT_IMAGE_EXTENSION
        
        return image_bytes, content_type, file_extension
    
    @property
    def bucket(self) -> str:
        """Get the current S3 bucket name"""
        return self.bucket_name 