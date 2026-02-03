class Settings {
    static init() {
        this.setupLogout();
        this.setupAdminFeatures();
    }
    
    static setupLogout() {
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                const result = await Auth.logout();
                if (result.success) {
                    showLoginScreen();
                }
            }
        });
    }
    
    static setupAdminFeatures() {
        // Check if user is admin
        const user = Auth.getCurrentUser();
        // In a real app, you would check user role from database
        // For demo, we'll check from URL or localStorage
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        
        if (isAdmin) {
            const adminSection = document.getElementById('adminSection');
            adminSection.style.display = 'flex';
            
            adminSection.addEventListener('click', () => {
                this.showAdminPanel();
            });
        }
    }
    
    static showEditName() {
        const currentName = document.getElementById('userName').textContent;
        const newName = prompt('Masukkan nama baru:', currentName);
        
        if (newName && newName !== currentName) {
            this.updateUserName(newName);
        }
    }
    
    static async updateUserName(newName) {
        const user = Auth.getCurrentUser();
        
        try {
            await db.collection('users').doc(user.uid).update({
                name: newName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            document.getElementById('userName').textContent = newName;
            document.getElementById('currentNameDisplay').textContent = newName;
            
            alert('Nama berhasil diperbarui');
        } catch (error) {
            console.error('Error updating name:', error);
            alert('Gagal memperbarui nama');
        }
    }
    
    static showChangePassword() {
        // In a real app, implement proper password change with Firebase Auth
        alert('Fitur ganti sandi akan mengirim email reset password ke email Anda');
        
        // For demo purposes
        const email = prompt('Masukkan email Anda untuk reset password:');
        if (email) {
            this.sendPasswordResetEmail(email);
        }
    }
    
    static async sendPasswordResetEmail(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            alert('Email reset password telah dikirim. Silakan cek inbox email Anda.');
        } catch (error) {
            console.error('Error sending reset email:', error);
            alert('Gagal mengirim email reset password');
        }
    }
    
    static showAdminPanel() {
        alert('Panel Admin - Fitur ini tersedia untuk administrator\n\nFitur yang tersedia:\n1. Kelola pengguna\n2. Lihat semua presensi\n3. Atur jam kerja\n4. Generate laporan');
        
        // In a real app, you would redirect to admin page
        // window.location.href = 'admin.html';
    }
}

// Initialize settings module
document.addEventListener('DOMContentLoaded', () => {
    Settings.init();
});