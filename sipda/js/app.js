class App {
    static init() {
        this.setupNavigation();
        this.setupTime();
        this.setupSettings();
        this.loadUserProfile();
    }
    
    static setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pageId = button.getAttribute('data-page');
                
                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show selected page
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                document.getElementById(pageId).classList.add('active');
            });
        });
    }
    
    static setupTime() {
        function updateTime() {
            const now = new Date();
            const timeElement = document.getElementById('currentTime');
            const dateElement = document.getElementById('currentDate');
            
            // Format time
            const timeString = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            // Format date
            const dateString = now.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            timeElement.textContent = timeString;
            dateElement.textContent = dateString;
        }
        
        updateTime();
        setInterval(updateTime, 1000);
    }
    
    static setupSettings() {
        // Profile button click
        document.getElementById('profileButton').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('active');
        });
        
        // Close modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('active');
        });
        
        // Click outside modal to close
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('settingsModal')) {
                document.getElementById('settingsModal').classList.remove('active');
            }
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        }
    }
    
    static async loadUserProfile() {
        const user = Auth.getCurrentUser();
        if (user.uid) {
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    document.getElementById('userName').textContent = userData.name || user.username;
                    document.getElementById('userRole').textContent = userData.role || 'Guru SMK Darul Abror';
                    document.getElementById('currentNameDisplay').textContent = userData.name || user.username;
                    
                    // Check if user is admin
                    if (userData.isAdmin) {
                        document.getElementById('adminSection').style.display = 'flex';
                    }
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});