initApp = function() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => {
          console.log("auth persistence changed");
        })
        .catch((error) => {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          console.error(`Code ${errorCode}: ${errorMessage}`)
        });


        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var uid = user.uid;
        var phoneNumber = user.phoneNumber;
        var providerData = user.providerData;
        user.getIdToken().then(function(accessToken) {
          document.getElementById('account-status').textContent = `Signed in as ${displayName}`;
          document.getElementById('log-in').classList.add("is-hidden");
          document.getElementById('log-out').classList.remove("is-hidden");
          document.getElementById('account-photo-empty').classList.add("is-hidden");
          document.getElementById('account-photo-container').classList.remove("is-hidden");
          document.getElementById('account-photo-img').src = photoURL;
          document.getElementById('account-email').textContent = email;
        });
      } else {
        // User is signed out.
        document.getElementById('account-status').textContent = 'Signed out';
        document.getElementById('log-in').classList.remove("is-hidden");
        document.getElementById('log-out').classList.add("is-hidden");
        document.getElementById('account-photo-empty').classList.remove("is-hidden");
        document.getElementById('account-photo-container').classList.add("is-hidden");
        document.getElementById('account-photo-img').src = null;
        document.getElementById('account-details').textContent = 'null';
      }
    }, function(error) {
      console.log(error);
    });
  };

  window.addEventListener('load', function() {
    initApp()
  });