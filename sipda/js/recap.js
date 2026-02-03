class Recap {
    static currentDate = new Date();
    
    static init() {
        this.setupMonthNavigation();
        this.generateCalendar();
        this.loadAttendanceDetails();
    }
    
    static setupMonthNavigation() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateMonthDisplay();
            this.generateCalendar();
            this.loadAttendanceDetails();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateMonthDisplay();
            this.generateCalendar();
            this.loadAttendanceDetails();
        });
        
        this.updateMonthDisplay();
    }
    
    static updateMonthDisplay() {
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        
        const month = monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        
        document.getElementById('currentMonth').textContent = `${month} ${year}`;
    }
    
    static generateCalendar() {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
        
        // Add day headers
        const dayNames = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
        dayNames.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-header';
            dayElement.textContent = day;
            calendar.appendChild(dayElement);
        });
        
        // Get first day of month
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        // Adjust starting day (Monday as first day)
        const startOffset = startingDay === 0 ? 6 : startingDay - 1;
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startOffset; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day day-empty';
            calendar.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.setAttribute('data-date', `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            
            const dayStatus = document.createElement('div');
            dayStatus.className = 'day-status status-normal-bg';
            dayStatus.setAttribute('data-status', 'normal');
            
            dayElement.appendChild(dayNumber);
            dayElement.appendChild(dayStatus);
            
            // Add click event
            dayElement.addEventListener('click', () => {
                this.showDayDetails(dayElement.getAttribute('data-date'));
            });
            
            calendar.appendChild(dayElement);
        }
        
        // Load attendance data for each day
        this.loadAttendanceColors();
    }
    
    static async loadAttendanceColors() {
        const user = Auth.getCurrentUser();
        if (!user.uid) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        
        try {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
            
            const attendanceRef = db.collection('attendance')
                .where('userId', '==', user.uid)
                .where('date', '>=', startDate)
                .where('date', '<=', endDate);
            
            const snapshot = await attendanceRef.get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.date;
                const status = data.status || 'normal';
                const outTime = data.outTime;
                
                // Determine final status
                let finalStatus = status;
                if (status === 'on_time' && !outTime) {
                    finalStatus = 'no_out';
                }
                
                const dayElement = document.querySelector(`.calendar-day[data-date="${date}"]`);
                if (dayElement) {
                    const statusElement = dayElement.querySelector('.day-status');
                    statusElement.setAttribute('data-status', finalStatus);
                    
                    switch(finalStatus) {
                        case 'on_time':
                            statusElement.className = 'day-status status-present-bg';
                            break;
                        case 'late':
                            statusElement.className = 'day-status status-late-bg';
                            break;
                        case 'absent':
                            statusElement.className = 'day-status status-absent-bg';
                            break;
                        case 'no_out':
                            statusElement.className = 'day-status status-no-out-bg';
                            break;
                        default:
                            statusElement.className = 'day-status status-normal-bg';
                    }
                }
            });
            
        } catch (error) {
            console.error('Error loading attendance colors:', error);
        }
    }
    
    static async loadAttendanceDetails() {
        const user = Auth.getCurrentUser();
        if (!user.uid) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        
        try {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
            
            const attendanceRef = db.collection('attendance')
                .where('userId', '==', user.uid)
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .orderBy('date', 'desc');
            
            const snapshot = await attendanceRef.get();
            const detailsContainer = document.getElementById('attendanceDetails');
            detailsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'detail-item';
                emptyMessage.innerHTML = '<p>Tidak ada data kehadiran untuk bulan ini</p>';
                detailsContainer.appendChild(emptyMessage);
                return;
            }
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const detailItem = this.createDetailItem(data);
                detailsContainer.appendChild(detailItem);
            });
            
        } catch (error) {
            console.error('Error loading attendance details:', error);
        }
    }
    
    static createDetailItem(data) {
        const detailItem = document.createElement('div');
        detailItem.className = 'detail-item';
        
        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'detail-status';
        
        let status = data.status || 'normal';
        let statusText = '';
        let statusClass = '';
        
        if (data.outTime) {
            if (status === 'on_time') {
                statusText = 'TEPAT WAKTU';
                statusClass = 'status-present-bg';
            } else if (status === 'late') {
                statusText = 'TERLAMBAT';
                statusClass = 'status-late-bg';
            }
        } else {
            if (status === 'on_time' || status === 'late') {
                statusText = 'TIDAK ABSEN PULANG';
                statusClass = 'status-no-out-bg';
                status = 'no_out';
            } else if (status === 'absent') {
                statusText = 'ALPA';
                statusClass = 'status-absent-bg';
            }
        }
        
        statusIndicator.className = 'detail-status ' + statusClass;
        
        // Date info
        const detailInfo = document.createElement('div');
        detailInfo.className = 'detail-info';
        
        const dateElement = document.createElement('div');
        dateElement.className = 'detail-date';
        
        const date = new Date(data.date);
        dateElement.textContent = date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const timeElement = document.createElement('div');
        timeElement.className = 'detail-time';
        
        if (data.inTime) {
            const inTime = data.inTime.toDate ? data.inTime.toDate() : new Date(data.inTime);
            timeElement.textContent = `Masuk: ${inTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
            
            if (data.outTime) {
                const outTime = data.outTime.toDate ? data.outTime.toDate() : new Date(data.outTime);
                timeElement.textContent += ` • Pulang: ${outTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
            }
        } else {
            timeElement.textContent = 'Tidak hadir';
        }
        
        detailInfo.appendChild(dateElement);
        detailInfo.appendChild(timeElement);
        
        // Status type
        const detailType = document.createElement('div');
        detailType.className = 'detail-type';
        detailType.textContent = statusText;
        
        detailItem.appendChild(statusIndicator);
        detailItem.appendChild(detailInfo);
        detailItem.appendChild(detailType);
        
        return detailItem;
    }
    
    static showDayDetails(date) {
        // This can be expanded to show detailed information for a specific day
        console.log('Selected date:', date);
        // You can implement a modal or expand the detail item for the selected date
    }
}

// Initialize recap module when recap page is shown
document.addEventListener('DOMContentLoaded', () => {
    const recapBtn = document.querySelector('.nav-btn[data-page="recapPage"]');
    recapBtn.addEventListener('click', () => {
        Recap.init();
    });
});