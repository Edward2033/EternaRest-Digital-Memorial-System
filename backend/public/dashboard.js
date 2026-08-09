const API_BASE = 'http://localhost:5000/api';
let refreshInterval;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    startAutoRefresh();
});

// Load dashboard data
async function loadDashboard() {
    await Promise.all([loadStats(), loadBookings()]);
    updateLastUpdateTime();
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/stats`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('totalBookings').textContent = data.stats.totalBookings;
            document.getElementById('pendingBookings').textContent = data.stats.pendingBookings;
            document.getElementById('approvedBookings').textContent = data.stats.approvedBookings;
            document.getElementById('totalMemorials').textContent = data.stats.totalMemorials;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load bookings
async function loadBookings() {
    try {
        const response = await fetch(`${API_BASE}/bookings`);
        const data = await response.json();
        
        if (data.success) {
            renderBookings(data.bookings);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsBody').innerHTML = 
            '<tr><td colspan="7" class="loading">Error loading bookings</td></tr>';
    }
}

// Render bookings table
function renderBookings(bookings) {
    const tbody = document.getElementById('bookingsBody');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No bookings found</td></tr>';
        return;
    }
    
    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td><strong>${booking.bookingId}</strong></td>
            <td>${booking.deceasedName}</td>
            <td>${booking.packageType.toUpperCase()}</td>
            <td>$${booking.price}</td>
            <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
            <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    ${booking.status === 'pending' ? 
                        `<button class="btn btn-approve" onclick="approveBooking('${booking.bookingId}')">✓ Approve</button>` : 
                        `<button class="btn btn-approve" disabled>✓ Approved</button>`
                    }
                    <button class="btn btn-view" onclick="viewMemorial('${booking.bookingId}')">👁 View</button>
                    ${booking.status === 'approved' ? 
                        `<button class="btn btn-upload" onclick="openUploadModal('${booking.bookingId}')">📤 Upload</button>` : 
                        ''
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Approve booking
async function approveBooking(bookingId) {
    if (!confirm(`Approve booking ${bookingId}? This will generate QR code and send email.`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/bookings/approve/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Booking approved! QR code generated and email sent.');
            loadDashboard();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error approving booking:', error);
        alert('❌ Failed to approve booking');
    }
}

// View memorial
function viewMemorial(bookingId) {
    window.open(`/memorial/${bookingId}`, '_blank');
}

// Open upload modal
function openUploadModal(bookingId) {
    document.getElementById('uploadBookingId').value = bookingId;
    document.getElementById('uploadModal').style.display = 'block';
}

// Close upload modal
function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('uploadForm').reset();
}

// Handle upload form
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookingId = document.getElementById('uploadBookingId').value;
    const formData = new FormData();
    const files = document.getElementById('mediaFiles').files;
    const caption = document.getElementById('mediaCaption').value;
    
    for (let file of files) {
        formData.append('media', file);
    }
    if (caption) formData.append('caption', caption);
    
    try {
        const response = await fetch(`${API_BASE}/media/upload/${bookingId}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ ${data.media.length} file(s) uploaded successfully!`);
            closeUploadModal();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error uploading media:', error);
        alert('❌ Failed to upload media');
    }
});

// Refresh bookings
function refreshBookings() {
    loadDashboard();
}

// Auto refresh every 10 seconds
function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        loadDashboard();
    }, 10000);
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = `Last updated: ${timeString}`;
}

// Close modal on outside click
window.onclick = (event) => {
    const modal = document.getElementById('uploadModal');
    if (event.target === modal) {
        closeUploadModal();
    }
};
