// AWS Amplify Gen2 Configuration
// This configuration follows the Amplify Gen2 structure for Cognito authentication

export const amplifyConfig = {
  Auth: {
    Cognito: {
      // Amazon Cognito User Pool ID
      userPoolId: 'eu-central-1_MsY5AFTWl',
      
      // Amazon Cognito User Pool App Client ID  
      userPoolClientId: '4vmj8qnjb03avkimogpj38sj1j',
      
      // Amazon Cognito Region
      region: 'eu-central-1',
      
      // Custom Cognito Auth Domain
      loginWith: {
        oauth: {
          domain: 'mockmcp-207567790021',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['https://mockmcp.com/login/callback', 'https://www.mockmcp.com/login/callback', 'http://localhost:3000/login/callback'],
          redirectSignOut: ['https://mockmcp.com/logout', 'https://www.mockmcp.com/logout', 'http://localhost:3000/logout'],
          responseType: 'code'
        },
        email: true,
        username: false,
        phone: false
      },
      
      // Optional: Configure user attributes
      userAttributes: {
        email: {
          required: true
        },
        name: {
          required: true
        }
      }
    }
  }
};

// Export individual config parts for potential future use
export const cognitoConfig = amplifyConfig.Auth.Cognito; 

// API Configuration
export const apiConfig = {
  // API Gateway endpoint for MCP server
  mcpApiEndpoint: 'https://app.mockmcp.com',
  
  // Custom domain API endpoint
  customDomainEndpoint: 'https://www.mockmcp.com',
  
  // DynamoDB table name for sessions
  sessionsTableName: 'sam-app-mcp-sessions'
};


