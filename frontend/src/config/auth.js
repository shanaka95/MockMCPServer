// AWS Cognito Authentication Configuration
export const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_4A3rsk3TT",
  client_id: "5smbn0ca814kbie95eqspgmnk4",
  redirect_uri: "http://localhost:5173/login/callback",
  response_type: "code",
  scope: "email openid profile",
};

// Amplify Gen 2 Configuration
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-central-1_4A3rsk3TT',
      userPoolClientId: '5smbn0ca814kbie95eqspgmnk4',
      region: 'eu-central-1'
    }
  }
}; 


