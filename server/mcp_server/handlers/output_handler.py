"""
Output handler for processing different types of tool outputs in MCP responses
"""

import json
import logging
import re
from typing import Any, List, Dict
import dukpy
from ..types import TextContent, ImageContent
from ..services import S3Service

logger = logging.getLogger(__name__)


class OutputHandler:
    """Handles processing of different output types for MCP responses"""
    
    def __init__(self):
        """Initialize the output handler with S3 service"""
        self.s3_service = S3Service()
    
    def process_output(self, result: Any, parameters: Dict[str, Any] = None) -> List[Dict]:
        """
        Process tool output and return appropriate content list
        
        Args:
            result: The tool execution result
            parameters: Tool parameters for custom flow execution
            
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
                
                # Check if it's a custom flow output
                if isinstance(parsed_result, dict) and parsed_result.get('type') in ['custom', 'custom_flow']:
                    return self._handle_custom_flow_output(parsed_result, parameters or {})
                
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
    
    def _handle_custom_flow_output(self, flow_data: Dict, parameters: Dict[str, Any]) -> List[Dict]:
        """
        Handle custom flow output by executing JavaScript code securely
        
        Args:
            flow_data: Dictionary containing flow information
            parameters: Parameters passed to the tool
            
        Returns:
            List with content from JavaScript execution (JSON or text)
        """
        try:
            flow_type = flow_data.get('flow_type', '')
            configuration = flow_data.get('configuration', '')
            
            # Only handle JavaScript flows for now
            if flow_type != 'javascript':
                return self._handle_text_output(f"Unsupported flow type: {flow_type}")
            
            if not configuration:
                return self._handle_text_output("No JavaScript code provided")
            
            # Execute JavaScript and get the raw result
            result = self._execute_javascript(configuration, parameters)
            
            # If result is a string, try to parse as JSON first
            if isinstance(result, str):
                try:
                    # Try to parse as JSON
                    json_result = json.loads(result)
                    # If it's valid JSON, return it as text content containing the JSON
                    return [TextContent(text=json.dumps(json_result)).model_dump()]
                except json.JSONDecodeError:
                    # Not JSON, return as plain text
                    return [TextContent(text=result).model_dump()]
            
            # For non-string results (numbers, booleans, objects), convert to JSON
            elif result is not None:
                try:
                    json_str = json.dumps(result)
                    return [TextContent(text=json_str).model_dump()]
                except (TypeError, ValueError):
                    # If can't serialize to JSON, convert to string
                    return [TextContent(text=str(result)).model_dump()]
            
            else:
                return [TextContent(text="No 'output' variable found in JavaScript code").model_dump()]
            
        except Exception as e:
            logger.error(f"Error handling custom flow output: {e}")
            return [TextContent(text=f"Error executing custom flow: {str(e)}").model_dump()]
    
    def _execute_javascript(self, js_code: str, parameters: Dict[str, Any]) -> Any:
        """
        Execute JavaScript code securely with parameters as variables using DukPy
        
        Args:
            js_code: JavaScript code to execute
            parameters: Parameters to make available as variables in the code
            
        Returns:
            Result of JavaScript execution (value of 'output' variable)
        """
        try:
            print(f"Executing JavaScript code: {js_code}")
            print(f"Parameters: {parameters}")
            # Create variable declarations for parameters
            param_declarations = self._create_parameter_variables(parameters)
            
            # Also substitute parameter placeholders for backward compatibility
            processed_code = self._substitute_parameters(js_code, parameters)
            
            # Add code to capture and return the output variable
            execution_code = f"""
            // Parameter variables
            {param_declarations}
            
            // User code
            {processed_code}
            
            // Return the output variable if it exists
            (function() {{
                if (typeof output !== 'undefined') {{
                    return output;
                }} else {{
                    return null;
                }}
            }})();
            """
            print(f"Execution code: {execution_code}")
            
            # Execute the JavaScript code using DukPy
            result = dukpy.evaljs(execution_code)
            print(f"Result: {result}")
            if result is not None:
                return result
            else:
                return "No 'output' variable found in JavaScript code"
                
        except Exception as e:
            logger.error(f"JavaScript execution error: {e}")
            raise ValueError(f"JavaScript execution failed: {str(e)}")
    
    def _substitute_parameters(self, js_code: str, parameters: Dict[str, Any]) -> str:
        """
        Substitute parameter placeholders in JavaScript code with actual values
        
        Args:
            js_code: JavaScript code with parameter placeholders
            parameters: Actual parameter values
            
        Returns:
            JavaScript code with parameters substituted
        """
        processed_code = js_code
        
        # Find all parameter placeholders like {parameter 1}, {parameter 2}, etc.
        parameter_pattern = r'\{parameter\s+(\d+)\}'
        matches = re.findall(parameter_pattern, processed_code)
        
        # Convert parameters dict to list for positional access
        param_values = list(parameters.values())
        
        for match in matches:
            param_index = int(match) - 1  # Convert to 0-based index
            placeholder = f"{{parameter {match}}}"
            
            if 0 <= param_index < len(param_values):
                param_value = param_values[param_index]
                
                # Convert parameter value to JavaScript-compatible format
                if isinstance(param_value, str):
                    # Escape quotes and wrap in quotes
                    escaped_value = param_value.replace('"', '\\"').replace("'", "\\'")
                    js_value = f'"{escaped_value}"'
                elif isinstance(param_value, (int, float)):
                    js_value = str(param_value)
                elif isinstance(param_value, bool):
                    js_value = 'true' if param_value else 'false'
                elif param_value is None:
                    js_value = 'null'
                else:
                    # Convert complex types to JSON
                    js_value = json.dumps(param_value)
                
                processed_code = processed_code.replace(placeholder, js_value)
            else:
                # Replace with null if parameter index is out of bounds
                processed_code = processed_code.replace(placeholder, 'null')
        
        return processed_code
    
    def _create_parameter_variables(self, parameters: Dict[str, Any]) -> str:
        """
        Create JavaScript variable declarations from parameters
        
        Args:
            parameters: Dictionary of parameter names and values
            
        Returns:
            JavaScript code declaring variables for each parameter
        """
        if not parameters:
            return ""
        
        variable_declarations = []
        
        for param_name, param_value in parameters.items():
            # Create a safe variable name (replace spaces and special chars with underscores)
            safe_var_name = re.sub(r'[^a-zA-Z0-9_]', '_', str(param_name))
            
            # Convert parameter value to JavaScript-compatible format
            if isinstance(param_value, str):
                # Escape quotes and wrap in quotes
                escaped_value = param_value.replace('"', '\\"').replace("'", "\\'")
                js_value = f'"{escaped_value}"'
            elif isinstance(param_value, (int, float)):
                js_value = str(param_value)
            elif isinstance(param_value, bool):
                js_value = 'true' if param_value else 'false'
            elif param_value is None:
                js_value = 'null'
            else:
                # Convert complex types to JSON
                js_value = json.dumps(param_value)
            
            variable_declarations.append(f"var {safe_var_name} = {js_value};")
        
        return "\n".join(variable_declarations)
