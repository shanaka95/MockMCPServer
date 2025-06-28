from router import router

def lambda_handler(event, context):
    """AWS Lambda handler function."""
    return router(event, context)