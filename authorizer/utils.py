def extract_session_id_from_arn(method_arn):
    """
    Extract session ID from API Gateway method ARN.
    Looks for pattern: .../servers/{session_id}/mcp/...
    """
    try:
        arn_parts = method_arn.split('/')
        # Find the pattern: servers/SESSION_ID/mcp
        for i, part in enumerate(arn_parts):
            if part == 'servers' and i + 2 < len(arn_parts) and arn_parts[i + 2] == 'mcp':
                return arn_parts[i + 1]
        return None
    except Exception:
        return None