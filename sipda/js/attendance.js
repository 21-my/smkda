class Attendance {
    static currentLocation = null;
    static isLoadingGPS = false;
    
    static init() {
        this.setupAttendanceButton();
        this.setupGPSRefresh();
        this.loadAttendanceStatus();
        this.startGPS();
    }
    
    static setupAttendanceButton() {
        const attendanceBtn = document.getElementById('attendanceBtn');
        attendanceBtn.addEventListener('click', () => {
            this.recordAttendance();
        });
    }
    
    static setupGPSRefresh() {
        const refreshBtn = document.getElementById('refreshGPS');
        refreshBtn.addEventListener('click', () => {
            this.startGPS(true);
        });
    }
    
    static async startGPS(forceRefresh = false) {
        if (this.isLoadingGPS && !forceRefresh) return;
        
        this.isLoadingGPS = true;
        const gpsIcon = document.getElementById('gpsIcon');
        const gpsStatus = document.querySelector('.gps-status span');
        const refreshBtn = document.getElementById('refreshGPS');
        
        gpsIcon.classList.add('fa-spin');
        gpsStatus.textContent = 'Mengkalibrasi GPS...';
        refreshBtn.disabled = true;
        
        try {
            const position = await this.getCurrentPosition();
            this.currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            gpsStatus.textContent = `Lokasi terkunci (Akurasi: ${Math.round(this.currentLocation.accuracy)}m)`;
            
            // Save location to Firestore
            await this.saveLocationToFirestore();
            
        } catch (error) {
            console.error('GPS Error:', error);
            gpsStatus.textContent = 'Gagal mendapatkan lokasi';
        } finally {
            this.isLoadingGPS = false;
            gpsIcon.classList.remove('fa-spin');
            refreshBtn.disabled = false;
        }
    }
    
    static getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation tidak didukung'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
    }
    
    static async recordAttendance() {
        if (!this.currentLocation) {
            alert('Harap tunggu GPS terkunci terlebih dahulu');
            await this.startGPS();
            return;
        }
        
        const user = Auth.getCurrentUser();
        if (!user.uid) return;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        try {
            // Check if already attendance today
            const attendanceRef = db.collection('attendance')
                .where('userId', '==', user.uid)
                .where('date', '==', today);
            
            const snapshot = await attendanceRef.get();
            
            if (snapshot.empty) {
                // Record attendance
                await this.saveAttendance(now, 'in');
                this.updateAttendanceDisplay(now, 'in');
            } else {
                // Check if already checkout
                const doc = snapshot.docs[0];
                const data = doc.data();
                
                if (!data.outTime) {
                    // Record checkout
                    await doc.ref.update({
                        outTime: now,
                        outLocation: this.currentLocation
                    });
                    this.updateAttendanceDisplay(now, 'out');
                } else {
                    alert('Anda sudah melakukan presensi masuk dan pulang hari ini');
                }
            }
            
        } catch (error) {
            console.error('Attendance error:', error);
            alert('Gagal merekam presensi');
        }
    }
    
    static async saveAttendance(time, type) {
        const user = Auth.getCurrentUser();
        const today = time.toISOString().split('T')[0];
        
        const attendanceData = {
            userId: user.uid,
            username: user.username,
            date: today,
            location: this.currentLocation,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (type === 'in') {
            attendanceData.inTime = time;
            attendanceData.status = this.calculateStatus(time);
        } else {
            attendanceData.outTime = time;
        }
        
        await db.collection('attendance').add(attendanceData);
    }
    
    static calculateStatus(time) {
        const hour = time.getHours();
        const minute = time.getMinutes();
        const totalMinutes = hour * 60 + minute;
        
        // Office hours: 07:00 - 16:00
        const startTime = 7 * 60; // 07:00
        const lateThreshold = 7 * 60 + 15; // 07:15
        
        if (totalMinutes <= startTime) {
            return 'on_time';
        } else if (totalMinutes <= lateThreshold) {
            return 'late';
        } else {
            return 'absent';
        }
    }
    
    static async loadAttendanceStatus() {
        const user = Auth.getCurrentUser();
        if (!user.uid) return;
        
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const attendanceRef = db.collection('attendance')
                .where('userId', '==', user.uid)
                .where('date', '==', today);
            
            const snapshot = await attendanceRef.get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                
                this.updateAttendanceDisplay(data.inTime?.toDate(), 'in', data.outTime?.toDate());
            } else {
                this.updateAttendanceDisplay(null, 'none');
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    }
    
    static updateAttendanceDisplay(inTime, type, outTime = null) {
        const attendanceTime = document.getElementById('attendanceTime');
        const attendanceStatus = document.getElementById('attendanceStatus');
        const inTimeElement = document.getElementById('inTime');
        const outTimeElement = document.getElementById('outTime');
        
        // Set default office hours
        inTimeElement.textContent = '07:00';
        outTimeElement.textContent = '16:00';
        
        if (type === 'in') {
            const timeString = inTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            attendanceTime.textContent = timeString;
            
            const status = this.calculateStatus(inTime);
            let statusText = '';
            let statusClass = '';
            
            switch(status) {
                case 'on_time':
                    statusText = 'TEPAT WAKTU';
                    statusClass = 'status-present';
                    break;
                case 'late':
                    statusText = 'TERLAMBAT';
                    statusClass = 'status-late';
                    break;
                case 'absent':
                    statusText = 'ALPA';
                    statusClass = 'status-absent';
                    break;
            }
            
            attendanceStatus.textContent = statusText;
            attendanceStatus.className = 'status-type ' + statusClass;
            
        } else if (type === 'out') {
            const timeString = outTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            attendanceTime.textContent = timeString;
            attendanceStatus.textContent = 'SUDAH PULANG';
            attendanceStatus.className = 'status-type status-present';
            
        } else {
            attendanceTime.textContent = '--:--';
            
            const now = new Date();
            const hour = now.getHours();
            
            if (hour < 16) {
                attendanceStatus.textContent = 'BELUM PRESENSI';
                attendanceStatus.className = 'status-type';
            } else {
                attendanceStatus.textContent = 'ALPA';
                attendanceStatus.className = 'status-type status-absent';
            }
        }
    }
    
    static async saveLocationToFirestore() {
        const user = Auth.getCurrentUser();
        if (!user.uid) return;
        
        try {
            await db.collection('gps_logs').add({
                userId: user.uid,
                location: this.currentLocation,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving location:', error);
        }
    }
}

// Initialize attendance module
document.addEventListener('DOMContentLoaded', () => {
    Attendance.init();
});