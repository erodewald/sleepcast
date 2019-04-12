window.addEventListener(
  "load",
  function() {
    firebase
      .auth()
      .getRedirectResult()
      .then(function(result) {
        if (result.credential) {
          // Accounts successfully linked.
          var credential = result.credential;
          var user = result.user;
          // ...
        }
      })
      .catch(function(error) {
        // Handle Errors here.
        // ...
      });
  },
  false
);
