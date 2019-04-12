window.addEventListener(
  "load",
  function() {
    var uiConfig = {
      callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          // User successfully signed in.
          // Return type determines whether we continue the redirect automatically
          // or whether we leave that to developer to handle.
          let credential = btoa(JSON.stringify(authResult.credential));
          let uid = authResult.user.uid;
          redirectUrl = `https://api.smartthings.com/oauth/callback?state=${state}&uid=${uid}&credential=${credential}`
          window.location.href = redirectUrl;
        }
      },
      queryParameterForSignInSuccessUrl: "signInSuccessUrl",
      queryParameterForWidgetMode: "mode",
      signInSuccessUrl: `https://api.smartthings.com/oauth/callback?state=${state}`,
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      ],
      credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,
      // tosUrl and privacyPolicyUrl accept either url string or a callback
      // function.
      // Terms of service url/callback.
      tosUrl: "<your-tos-url>",
      // Privacy policy url/callback.
      privacyPolicyUrl: function() {
        window.location.assign("<your-privacy-policy-url>");
      }
    };
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start("#firebaseui-auth-container", uiConfig);
  },
  false
);
