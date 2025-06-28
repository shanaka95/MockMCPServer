// AWS Cognito Authentication Configuration
export const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_cgALzk9yn",
  client_id: "4p4ep487j7oq7p8o7dnllb59ui",
  redirect_uri: "http://localhost:3001/login/callback",
  response_type: "code",
  scope: "email openid profile",
};

// Amplify configuration
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-central-1_cgALzk9yn',
      userPoolClientId: '4p4ep487j7oq7p8o7dnllb59ui'
    }
  }
}; 