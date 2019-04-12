function signIn() {
    if (!firebase.auth().currentUser) {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            test: 0001
        });
        firebase.auth().signInWithRedirect(provider);
    } else {
        firebase.auth().signOut();
    }
}

function initApp() {
    firebase.auth().getRedirectResult().then(function(result) {
        if (result.credential) {
            var token = result.credential.accessToken;
            console.info(token);
        }
        var user = result.user;
        console.info(user);
    }).catch(function(error) {
        console.error(error);
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            document.getElementById("quickstart-auth-account").textContent = JSON.stringify(user, undefined, 2);
            document.getElementById("quickstart-sign-in").textContext = "Sign Out";
        } else {
            document.getElementById("quickstart-auth-account").textContent = 'null';
            document.getElementById("quickstart-sign-in").textContext = "Sign In";
        }
    });

    document.getElementById("quickstart-sign-in").addEventListener('click', signIn, false);
}

window.onload = function() {
    initApp();
};