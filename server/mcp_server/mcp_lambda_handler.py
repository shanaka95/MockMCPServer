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

import functools
import inspect
import json
import logging

from mcp_server.types import (
    Capabilities,
    ErrorContent,
    InitializeResult,
    JSONRPCError,
    JSONRPCRequest,
    JSONRPCResponse,
    ServerInfo,
    TextContent,
)
from enum import Enum
from typing import (
    Any,
    Callable,
    Dict,
    List,
    Optional,
    Union,
    get_args,
    get_origin,
    get_type_hints,
)


logger = logging.getLogger(__name__)


class MCPLambdaHandler:
    """A class to handle MCP (Model Context Protocol) HTTP events in AWS Lambda."""

    def __init__(
        self,
        name: str,
        version: str = '1.0.0',
        tools: Optional[List[Callable]] = None,
    ):
        """Initialize the MCP handler.

        Args:
            name: Handler name
            version: Handler version
            tools: List of callable functions to register as tools

        """
        self.name = name
        self.version = version
        self.tools: Dict[str, Dict] = {}
        self.tool_implementations: Dict[str, Callable] = {}
        
        # Process tools if provided
        if tools:
            for func in tools:
                self._register_tool(func)

    def _register_tool(self, func: Callable) -> None:
        """Register a function as an MCP tool.

        Uses function name, docstring, and type hints to generate the MCP tool schema.
        """
        # Get function name and convert to camelCase for tool name
        func_name = func.__name__
        tool_name = ''.join(
            [func_name.split('_')[0]]
            + [word.capitalize() for word in func_name.split('_')[1:]]
        )

        # Get docstring and parse into description
        doc = inspect.getdoc(func) or ''
        description = doc.split('\n\n')[0]  # First paragraph is description

        # Get type hints
        hints = get_type_hints(func)
        # return_type = hints.pop('return', Any)
        hints.pop('return', Any)

        # Build input schema from type hints and docstring
        properties = {}
        required = []

        # Parse docstring for argument descriptions
        arg_descriptions = {}
        if doc:
            lines = doc.split('\n')
            in_args = False
            for line in lines:
                if line.strip().startswith('Args:'):
                    in_args = True
                    continue
                if in_args:
                    if not line.strip() or line.strip().startswith('Returns:'):
                        break
                    if ':' in line:
                        arg_name, arg_desc = line.split(':', 1)
                        arg_descriptions[arg_name.strip()] = arg_desc.strip()

        def get_type_schema(type_hint: Any) -> Dict[str, Any]:
            # Handle basic types
            if type_hint is int:
                return {'type': 'integer'}
            elif type_hint is float:
                return {'type': 'number'}
            elif type_hint is bool:
                return {'type': 'boolean'}
            elif type_hint is str:
                return {'type': 'string'}

            # Handle Enums
            if isinstance(type_hint, type) and issubclass(type_hint, Enum):
                return {'type': 'string', 'enum': [e.value for e in type_hint]}

            # Get origin type (e.g., Dict from Dict[str, int])
            origin = get_origin(type_hint)
            if origin is None:
                return {'type': 'string'}  # Default for unknown types

            # Handle Dict types
            if origin is dict or origin is Dict:
                args = get_args(type_hint)
                if not args:
                    return {'type': 'object', 'additionalProperties': True}

                # Get value type schema (args[1] is value type)
                value_schema = get_type_schema(args[1])
                return {'type': 'object', 'additionalProperties': value_schema}

            # Handle List types
            if origin is list or origin is List:
                args = get_args(type_hint)
                if not args:
                    return {'type': 'array', 'items': {}}

                item_schema = get_type_schema(args[0])
                return {'type': 'array', 'items': item_schema}

            # Default for unknown complex types
            return {'type': 'string'}

        # Build properties from type hints
        for param_name, param_type in hints.items():
            param_schema = get_type_schema(param_type)

            if param_name in arg_descriptions:
                param_schema['description'] = arg_descriptions[param_name]

            properties[param_name] = param_schema
            required.append(param_name)

        # Create tool schema
        tool_schema = {
            'name': tool_name,
            'description': description,
            'inputSchema': {'type': 'object', 'properties': properties, 'required': required},
        }

        # Register the tool
        self.tools[tool_name] = tool_schema
        self.tool_implementations[tool_name] = func

    def _create_error_response(
        self,
        code: int,
        message: str,
        request_id: Optional[str] = None,
        error_content: Optional[List[Dict]] = None,
        status_code: Optional[int] = None,
    ) -> Dict:
        """Create a standardized error response."""
        error = JSONRPCError(code=code, message=message)
        response = JSONRPCResponse(
            jsonrpc='2.0', id=request_id, error=error, errorContent=error_content
        )

        headers = {'Content-Type': 'application/json', 'MCP-Version': '0.6'}

        return {
            'statusCode': status_code or self._error_code_to_http_status(code),
            'body': response.model_dump_json(),
            'headers': headers,
        }

    def _error_code_to_http_status(self, error_code: int) -> int:
        """Map JSON-RPC error codes to HTTP status codes."""
        error_map = {
            -32700: 400,  # Parse error
            -32600: 400,  # Invalid Request
            -32601: 404,  # Method not found
            -32602: 400,  # Invalid params
            -32603: 500,  # Internal error
        }
        return error_map.get(error_code, 500)

    def _create_success_response(
        self, result: Any, request_id: str | None,
    ) -> Dict:
        """Create a standardized success response."""
        response = JSONRPCResponse(jsonrpc='2.0', id=request_id, result=result)

        headers = {'Content-Type': 'application/json', 'MCP-Version': '0.6'}

        return {'statusCode': 200, 'body': response.model_dump_json(), 'headers': headers}

    def handle_request(self, event: Dict, context: Any) -> Dict:
        """Handle an incoming Lambda request."""
        request_id = None

        try:
            # Log the full event for debugging
            logger.debug(f'Received event: {event}')

            # Get headers (case-insensitive)
            headers = {k.lower(): v for k, v in event.get('headers', {}).items()}

            # Validate content type
            if headers.get('content-type') != 'application/json':
                return self._create_error_response(-32700, 'Unsupported Media Type')

            try:
                body = json.loads(event['body'])
                logger.debug(f'Parsed request body: {body}')
                request_id = body.get('id') if isinstance(body, dict) else None

                # Check if this is a notification (no id field)
                if isinstance(body, dict) and 'id' not in body:
                    logger.debug('Request is a notification')
                    return {
                        'statusCode': 202,
                        'body': '',
                        'headers': {'Content-Type': 'application/json', 'MCP-Version': '0.6'},
                    }

                # Validate basic JSON-RPC structure
                if (
                    not isinstance(body, dict)
                    or body.get('jsonrpc') != '2.0'
                    or 'method' not in body
                ):
                    return self._create_error_response(-32700, 'Parse error', request_id)

            except json.JSONDecodeError:
                return self._create_error_response(-32700, 'Parse error')

            # Parse and validate the request
            request = JSONRPCRequest.model_validate(body)
            logger.debug(f'Validated request: {request}')

            # Handle initialization request
            if request.method == 'initialize':
                logger.info('Handling initialize request')

                result = InitializeResult(
                    protocolVersion='2024-11-05',
                    serverInfo=ServerInfo(name=self.name, version=self.version),
                    capabilities=Capabilities(tools={'list': True, 'call': True}),
                )
                return self._create_success_response(result.model_dump(), request.id)

            # Handle tools/list request
            if request.method == 'tools/list':
                logger.info('Handling tools/list request')
                return self._create_success_response(
                    {'tools': list(self.tools.values())}, request.id
                )

            # Handle tool calls
            if request.method == 'tools/call' and request.params:
                tool_name = request.params.get('name')
                tool_args = request.params.get('arguments', {})

                if tool_name not in self.tools:
                    return self._create_error_response(
                        -32601, f"Tool '{tool_name}' not found", request.id
                    )

                try:
                    # Convert enum string values to enum objects
                    converted_args = {}
                    tool_func = self.tool_implementations[tool_name]
                    hints = get_type_hints(tool_func)

                    for arg_name, arg_value in tool_args.items():
                        arg_type = hints.get(arg_name)
                        if isinstance(arg_type, type) and issubclass(arg_type, Enum):
                            converted_args[arg_name] = arg_type(arg_value)
                        else:
                            converted_args[arg_name] = arg_value

                    result = tool_func(**converted_args)
                    content = [TextContent(text=str(result)).model_dump()]
                    return self._create_success_response(
                        {'content': content}, request.id
                    )
                except Exception as e:
                    logger.error(f'Error executing tool {tool_name}: {e}')
                    error_content = [ErrorContent(text=str(e)).model_dump()]
                    return self._create_error_response(
                        -32603,
                        f'Error executing tool: {str(e)}',
                        request.id,
                        error_content
                    )

            # Handle pings
            if request.method == 'ping':
                return self._create_success_response({}, request.id)

            # Handle unknown methods
            return self._create_error_response(
                -32601, f'Method not found: {request.method}', request.id,
            )

        except Exception as e:
            logger.error(f'Error processing request: {str(e)}', exc_info=True)
            return self._create_error_response(-32000, str(e), request_id)