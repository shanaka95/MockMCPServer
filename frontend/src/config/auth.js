// AWS Amplify Gen2 Configuration
// This configuration follows the Amplify Gen2 structure for Cognito authentication

export const amplifyConfig = {
  Auth: {
    Cognito: {
      // Amazon Cognito User Pool ID
      userPoolId: 'eu-central-1_4A3rsk3TT',
      
      // Amazon Cognito User Pool App Client ID  
      userPoolClientId: '5smbn0ca814kbie95eqspgmnk4',
      
      // Amazon Cognito Region
      region: 'eu-central-1',
      
      // Optional: Configure sign up verification method
      loginWith: {
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


