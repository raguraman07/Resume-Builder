document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const pageName = path.substring(path.lastIndexOf('/') + 1);
    
    // Page Route Guards
    activeAuth.onAuthStateChanged((user) => {
        if (user) {
            if (pageName === 'login.html' || pageName === '') {
                window.location.href = 'dashboard.html';
            }
            
            const userNameEl = document.getElementById('user-display-name');
            const userEmailEl = document.getElementById('user-display-email');
            if (userNameEl) userNameEl.textContent = user.displayName || user.email.split('@')[0];
            if (userEmailEl) userEmailEl.textContent = user.email;

            updateAvatarDisplay(user);
        } else {
            if (pageName === 'dashboard.html' || pageName === 'builder.html') {
                window.location.href = 'login.html';
            }
        }
    });

    if (pageName === 'login.html') {
        initAuthForm();
    }
    
    const logoutBtns = document.querySelectorAll('.btn-logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await activeAuth.signOut();
                window.location.href = 'index.html';
            } catch (err) {
                console.error("Logout failed: ", err);
            }
        });
    });
});

function initAuthForm() {
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    const alertBanner = document.getElementById('auth-alert');

    function showAlert(message, type = 'error') {
        alertBanner.textContent = message;
        alertBanner.className = `alert-banner active alert-${type}`;
        alertBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function hideAlert() {
        alertBanner.classList.remove('active');
    }

    // Form Submit: Login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value;
        const btn = formLogin.querySelector('button[type="submit"]');
        
        try {
            btn.disabled = true;
            btn.textContent = "Logging in...";
            await activeAuth.signInWithEmailAndPassword(email, pass);
            window.location.href = 'dashboard.html';
        } catch (err) {
            showAlert(err.message || "Invalid email or password.");
            btn.disabled = false;
            btn.textContent = "Log In";
        }
    });
    
    // Form Submit: Register
    formSignup.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const pass = document.getElementById('signup-password').value;
        const confirmPass = document.getElementById('signup-confirm').value;
        const btn = formSignup.querySelector('button[type="submit"]');
        
        if (pass !== confirmPass) return showAlert("Passwords do not match.");
        if (pass.length < 6) return showAlert("Password should be at least 6 characters.");
        
        try {
            btn.disabled = true;
            btn.textContent = "Creating Account...";
            
            const credentials = await activeAuth.createUserWithEmailAndPassword(email, pass);
            await credentials.user.updateProfile({ displayName: name });
            
            const userObj = {
                uid: credentials.user.uid,
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            };
            
            // Database operation must be awaited
            await activeDb.collection('users').doc(credentials.user.uid).set(userObj);
            window.location.href = 'dashboard.html';
        } catch (err) {
            console.error("Registration error:", err);
            showAlert(err.message || "Failed to create account.");
            btn.disabled = false;
            btn.textContent = "Create Account";
        }
    });
    
    // OAuth: Google Sign-in
    const googleBtns = document.querySelectorAll('.btn-google');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            hideAlert();
            try {
                const result = await activeAuth.signInWithPopup(googleProvider);
                const userObj = {
                    uid: result.user.uid,
                    name: result.user.displayName || result.user.email.split('@')[0],
                    email: result.user.email,
                    createdAt: new Date().toISOString()
                };
                
                await activeDb.collection('users').doc(result.user.uid).set(userObj, { merge: true });
                window.location.href = 'dashboard.html';
            } catch (err) {
                console.error("Google Auth error:", err);
                showAlert(err.message || "Google login failed.");
            }
        });
    });
}

function updateAvatarDisplay(user) {
    const initialsNode = document.getElementById('user-avatar-initials');
    const largeInitialsNode = document.getElementById('profile-large-avatar');
    
    const photoUrl = user.photoURL;
    const nameFallback = user.displayName || "User";
    const firstLetter = nameFallback.charAt(0).toUpperCase();

    if (photoUrl) {
        if (initialsNode) {
            initialsNode.innerHTML = `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            initialsNode.style.background = 'transparent';
        }
        if (largeInitialsNode) {
            largeInitialsNode.innerHTML = `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            largeInitialsNode.style.background = 'transparent';
        }
    } else {
        if (initialsNode) {
            initialsNode.innerText = firstLetter;
            initialsNode.style.background = 'var(--grad-cyan-indigo)';
        }
        if (largeInitialsNode) {
            largeInitialsNode.innerText = firstLetter;
            largeInitialsNode.style.background = 'var(--primary-color, #6366f1)';
        }
    }
}