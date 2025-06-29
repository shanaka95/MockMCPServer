# MCP Server Router - Modular Architecture

This directory contains a professionally refactored and modularized router for handling MCP (Model Context Protocol) server requests.

## 📁 Project Structure

```
server/
├── __init__.py          # Package initialization and public API
├── app.py              # Main Lambda entry point with router logic
├── constants.py         # Constants, enums, and error messages
├── responses.py         # Standardized response helpers
├── auth.py             # Authentication decorators and utilities
├── handlers.py         # Individual route handler functions
├── routes.py           # Route mapping and delegation
├── utils.py            # Utility functions (parsing, logging, etc.)
└── README.md           # This documentation
```

## 🏗️ Architecture Overview

### Separation of Concerns

Each module has a specific responsibility:

- **`app.py`**: Main Lambda entry point with router logic and orchestration
- **`constants.py`**: Centralized constants and configuration
- **`responses.py`**: Consistent response formatting with CORS support
- **`auth.py`**: Authentication logic and decorators
- **`handlers.py`**: Business logic for each endpoint
- **`routes.py`**: Route mapping and handler selection
- **`utils.py`**: Shared utilities and helper functions

### Key Benefits

✅ **Modular**: Each component is independently testable and maintainable
✅ **Professional**: Follows Python best practices and enterprise patterns
✅ **Type Safe**: Comprehensive type hints throughout
✅ **Error Handling**: Consistent error responses and logging
✅ **Extensible**: Easy to add new routes and handlers
✅ **CORS Ready**: Built-in CORS support for web applications

## 🚀 Usage

### Basic Usage

```python
from server.app import lambda_handler

# Use directly as Lambda handler
handler = lambda_handler

# Or use the router function directly
from server.app import router

def my_handler(event, context):
    return router(event, context)
```

### Adding New Routes

```python
from server.routes import get_route_handler
from server.auth import require_auth
from server.constants import TokenType

@require_auth(TokenType.COGNITO)
def handle_new_feature(event, context, auth_context):
    # Your handler logic here
    pass

# Register the new route
route_handler = get_route_handler()
route_handler.register_route('new-feature', 'POST', False, handle_new_feature)
```

## 🔐 Authentication

The system supports two authentication types:

- **`TokenType.COGNITO`**: User authentication for management operations
- **`TokenType.M2M`**: Machine-to-machine authentication for MCP protocol access

### Authentication Flow

1. **Token Extraction**: Auth context extracted from Lambda authorizer
2. **Validation**: Token type validated against route requirements
3. **Session Matching**: For M2M tokens, session IDs must match

## 🛣️ Supported Routes

### Server Management (Cognito Auth Required)
- `POST /server` - Create new server
- `GET /server` - List user's servers  
- `DELETE /server` - Delete server

### Image Upload (Cognito Auth Required)
- `POST /upload-image` - Upload image

### MCP Protocol Access (M2M Auth Required)
- `GET /server/{session_id}/mcp` - Access MCP server
- `POST /server/{session_id}/mcp` - Send MCP requests

## 📊 Monitoring & Debugging

### Health Check
```python
from server.app import health_check
response = health_check()
```

### Route Information
```python
from server.app import get_route_info
routes = get_route_info()
```

## 🧪 Testing

Each module can be tested independently:

```python
# Test authentication
from server.auth import extract_auth_context
auth_context = extract_auth_context(mock_event)

# Test route mapping
from server.routes import get_route_handler
handler = get_route_handler().get_handler('server', 'GET', False)

# Test responses
from server.responses import error_response
response = error_response(404, 'Not found')
```

## 🔧 Configuration

Key configuration is centralized in `constants.py`:

- HTTP status codes
- Token types
- Error messages
- Content types

## 📝 Error Handling

The system provides consistent error handling:

1. **Input Validation**: JSON parsing errors
2. **Authentication**: Token validation errors
3. **Business Logic**: Handler-specific errors
4. **System Errors**: Unexpected exceptions

All errors are logged with context and return standardized responses.

## 🚀 Performance

- **Lazy Loading**: Modules loaded only when needed
- **Efficient Routing**: O(1) route lookup via dictionary mapping
- **Minimal Overhead**: Clean separation reduces processing time

## 🔄 Migration from Old Router

The refactored router is backward compatible. Simply replace:

```python
# Old
from router import router

# New - Option 1: Use Lambda handler directly  
from server.app import lambda_handler

# New - Option 2: Use router function
from server.app import router
```

All existing functionality is preserved with improved structure and error handling. 