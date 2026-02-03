class Auth {
    static async login(username, password) {
        try {
            // In production, use Firebase Auth with email/password
            // For demo, we'll use a simple check
            if (username && password) {
                const userCredential = await auth.signInWithEmailAndPassword(
                    username + "@smkda.id",
                    password
                );
                
                // Save user data to localStorage
                localStorage.setItem('user', JSON.stringify({
                    uid: userCredential.user.uid,
                    username: username
                }));
                
                return { success: true, user: userCredential.user };
            } else {
                throw new Error('Username dan sandi harus diisi');
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
    
    static async logout() {
        try {
            await auth.signOut();
            localStorage.removeItem('user');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    static isLoggedIn() {
        return localStorage.getItem('user') !== null;
    }
    
    static getCurrentUser() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user;
    }
}

// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('loginError');
            
            errorElement.textContent = '';
            
            const result = await Auth.login(username, password);
            
            if (result.success) {
                showAppScreen();
            } else {
                errorElement.textContent = result.error || 'Login gagal';
            }
        });
    }
    
    // Auto login if already logged in
    if (Auth.isLoggedIn()) {
        showAppScreen();
    }
});

function showLoginScreen() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('appScreen').classList.remove('active');
}

function showAppScreen() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');
}