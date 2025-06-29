"""
Tool Factory for creating dynamic tool functions from definitions
"""

import json
from typing import List, Callable
from ..models.server_models import ToolDefinition
from ..constants import PARAMETER_TYPE_MAPPING


class ToolFactory:
    """Factory class for creating dynamic tool functions"""
    
    @staticmethod
    def create_tool_functions(tools: List[ToolDefinition]) -> List[Callable]:
        """
        Create callable functions from tool definitions
        
        Args:
            tools: List of validated tool definitions
            
        Returns:
            List of callable functions that can be used by MCPLambdaHandler
        """
        tool_functions = []
        
        for tool in tools:
            tool_function = ToolFactory._create_single_tool_function(tool)
            tool_functions.append(tool_function)
        
        return tool_functions
    
    @staticmethod
    def _create_single_tool_function(tool_def: ToolDefinition) -> Callable:
        """
        Create a single tool function from a tool definition
        
        Args:
            tool_def: Tool definition to create function from
            
        Returns:
            Callable function with proper metadata
        """
        def tool_function(**kwargs) -> str:
            """Dynamically generated tool function"""
            return ToolFactory._execute_tool_logic(tool_def, kwargs)
        
        # Set function metadata for MCP processing
        ToolFactory._set_function_metadata(tool_function, tool_def)
        
        return tool_function
    
    @staticmethod
    def _execute_tool_logic(tool_def: ToolDefinition, kwargs: dict) -> str:
        """
        Execute the tool logic based on output type
        
        Args:
            tool_def: Tool definition
            kwargs: Function arguments (unused in current implementation)
            
        Returns:
            Tool execution result as string
        """
        # Handle different output types
        if tool_def.output_type == 'text':
            return tool_def.output_text
        elif tool_def.output_type == 'image' and tool_def.output_image:
            # Return image information as JSON
            return json.dumps({
                "type": "image",
                "s3_key": tool_def.output_image.s3_key,
                "s3_bucket": tool_def.output_image.s3_bucket
            })
        elif tool_def.output_type == 'custom' and tool_def.output_custom:
            # Return custom flow information as JSON
            return json.dumps({
                "type": "custom_flow",
                "flow_type": tool_def.output_custom.flow_type,
                "configuration": tool_def.output_custom.configuration
            })
        else:
            # Fallback to text output
            return tool_def.output_text
    
    @staticmethod
    def _set_function_metadata(tool_function: Callable, tool_def: ToolDefinition) -> None:
        """
        Set function metadata for MCP processing
        
        Args:
            tool_function: Function to set metadata on
            tool_def: Tool definition containing metadata
        """
        # Set function name and documentation
        tool_function.__name__ = tool_def.name
        tool_function.__doc__ = ToolFactory._generate_docstring(tool_def)
        
        # Add type hints dynamically
        tool_function.__annotations__ = ToolFactory._generate_type_annotations(tool_def)
    
    @staticmethod
    def _generate_docstring(tool_def: ToolDefinition) -> str:
        """
        Generate function docstring from tool definition
        
        Args:
            tool_def: Tool definition
            
        Returns:
            Generated docstring
        """
        docstring = f"{tool_def.description}\n\nArgs:\n"
        
        # Add parameter documentation for MCP schema generation
        for param_name, param_def in tool_def.parameters.items():
            docstring += f"    {param_name}: {param_def.description}\n"
        
        docstring += "\nReturns:\n    str: Tool execution result"
        return docstring
    
    @staticmethod
    def _generate_type_annotations(tool_def: ToolDefinition) -> dict:
        """
        Generate type annotations from tool definition
        
        Args:
            tool_def: Tool definition
            
        Returns:
            Dictionary of parameter name to type mappings
        """
        annotations = {}
        
        for param_name, param_def in tool_def.parameters.items():
            # Map parameter types to Python types
            annotations[param_name] = PARAMETER_TYPE_MAPPING.get(
                param_def.type, 
                str  # Default to string type
            )
        
        annotations['return'] = str
        return annotations 