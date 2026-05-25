// Add this at the very top to track reports
let lastReportId = 0;
let map, marker; // Added for map functionality

// --- NOTIFICATION PERMISSION REQUEST ---
if ("Notification" in window) {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// Helper function to trigger the "Earthquake-style" System Pop-up
// RETURNS the notification object so we can close it later
function showSystemNotification(title, message) {
    if ("Notification" in window && Notification.permission === "granted") {
        return new Notification(title, {
            body: message,
            icon: "https://cdn-icons-png.flaticon.com/512/564/564619.png", 
            requireInteraction: true 
        });
    }
    return null;
}

// --- PAGE NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.container').forEach(div => {
        div.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';

    // Added: Initialize Map only when the report page is shown
    if (pageId === 'report') {
        initMap();
    }
}

// --- NEW: MAP INITIALIZATION FUNCTION ---
function initMap() {
    if (map) {
        map.invalidateSize(); // Ensures map loads correctly if div was hidden
        return;
    }

    // Centered at Barangay Balaquid area
    const defaultLat = 11.4589; 
    const defaultLng = 124.4750;

    map = L.map('map').setView([defaultLat, defaultLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Click event to place/move the pin
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng).addTo(map);
        }

        // Send coordinates to the hidden inputs in your HTML
        document.getElementById('latInput').value = lat;
        document.getElementById('lngInput').value = lng;
    });
}

// --- RESIDENT REPORT SUBMISSION ---
function toggleAnonymous() {
    const isAnonymous = document.getElementById('anonymousToggle').checked;
    const reporterInfo = document.getElementById('reporterInfo');
    const reporterInput = document.getElementById('reporterInput');

    if (isAnonymous) {
        reporterInfo.style.display = "none";
        reporterInput.required = false;
        reporterInput.value = "";
    } else {
        reporterInfo.style.display = "block";
        reporterInput.required = true;
    }
}

function submitReport() {
    const form = document.getElementById('reportForm');
    const formData = new FormData(form);

    const reportType = formData.get('type');
    const reportLocation = formData.get('location');

    if (document.getElementById('anonymousToggle').checked) {
        formData.set('reporter', 'Anonymous');
    }

    fetch("submit_report.php", {
        method: "POST",
        body: formData 
    })
    .then(response => response.text())
    .then(data => {
        if (data.trim() === "success") {
            const audio = document.getElementById('alertSound');
            
            // 1. SHOW NOTIFICATION
            const notification = showSystemNotification(
                "🚨 NEW BARANGAY REPORT", 
                `Type: ${reportType}\nLocation: ${reportLocation}`
            );
            
            // 2. PLAY SOUND AND AUTO-CLOSE NOTIFICATION WHEN SOUND ENDS
            audio.play();
            audio.onended = () => {
                if (notification) notification.close();
            };
            
            // 3. ORIGINAL BROWSER ALERT
            alert("Report submitted successfully!");
            
            form.reset();
            if(marker) { map.removeLayer(marker); marker = null; } // Clear map pin after submit
            showPage('home');
        } else {
            console.error("Server Error:", data);
            alert("Failed to submit report. Server says: " + data);
        }
    })
    .catch(error => {
        console.error("Fetch Error:", error);
        alert("An error occurred. Please check your connection.");
    });
}

// --- ADMIN AUTHENTICATION ---
function checkAdmin() {
    showPage('adminLogin');
}

function adminLogin() {
    const user = document.getElementById("adminUser").value;
    const pass = document.getElementById("adminPass").value;
    const formData = new FormData();
    formData.append("username", user);
    formData.append("password", pass);

    fetch("login.php", { method: "POST", body: formData })
    .then(response => response.text())
    .then(data => {
        if (data.trim() === "success") {
            const alarm = document.getElementById('alertSound');
            alarm.play().then(() => { alarm.pause(); alarm.currentTime = 0; });
            showPage('adminDashboard');
            fetch("get_reports.php")
                .then(res => res.json())
                .then(reports => {
                    if (reports.length > 0) { lastReportId = Math.max(...reports.map(r => parseInt(r.id))); }
                    loadAdminDashboard();
                    startAdminPolling(); 
                });
        } else {
            alert("Invalid Credentials");
        }
    });
}

// --- ADMIN DASHBOARD LOGIC ---
function loadAdminDashboard() {
    fetch("get_reports.php")
    .then(response => response.json())
    .then(reports => {
        const incidentTable = document.getElementById("incidentTable");
        incidentTable.innerHTML = "";

        if (reports.length > 0) {
            const currentLatestId = Math.max(...reports.map(r => parseInt(r.id)));
            if (lastReportId !== 0 && currentLatestId > lastReportId) {
                const newest = reports.find(r => parseInt(r.id) === currentLatestId);
                const audio = document.getElementById('alertSound');

                // 1. SHOW NOTIFICATION
                const notification = showSystemNotification("🚨 NEW BARANGAY REPORT", `Type: ${newest.type}\nLocation: ${newest.location}`);
                
                // 2. PLAY SOUND AND AUTO-CLOSE NOTIFICATION WHEN SOUND ENDS
                audio.play();
                audio.onended = () => {
                    if (notification) notification.close();
                };

                alert("🚨 NEW EMERGENCY REPORT RECEIVED!");
                
                lastReportId = currentLatestId;
            }
        }

        reports.forEach(report => {
            let attachmentHTML = "";
            if (report.photo && report.photo.trim() !== "") {
                attachmentHTML += `<button onclick="window.open('uploads/${report.photo}', '_blank')" style="background:#22c55e; margin-bottom:5px; width:100%;">View Photo</button><br>`;
            }
            if (report.video && report.video.trim() !== "") {
                attachmentHTML += `<button onclick="window.open('uploads/${report.video}', '_blank')" style="background:#3b82f6; width:100%;">View Video</button>`;
            }
            if (!attachmentHTML) { attachmentHTML = "None"; }

            // Added: Create Map link for Admin if coordinates exist in database
            let mapLink = "";
            if (report.lat && report.lng) {
                mapLink = `<br><a href="https://www.google.com/maps?q=${report.lat},${report.lng}" target="_blank" style="color:blue; font-size:11px; text-decoration:underline;">📍 View Exact Pin</a>`;
            }

            const urgencyClass = `urgency-${report.urgency.toLowerCase()}`;
            const finalClass = (report.status === "False Alarm") ? "status-false-alarm" : urgencyClass;

            let blinkStyle = "";
            if (report.status === "Resolved") {
                blinkStyle = "animation: none !important;";
            }

            incidentTable.innerHTML += `
                <tr>
                    <td>${report.reporter}</td>
                    <td>${report.type}</td>
                    <td><span class="${finalClass}" style="padding: 5px 10px; border-radius: 5px; display: inline-block; width: 100%; text-align: center; ${blinkStyle}">${report.urgency}</span></td>
                    <td>${report.location} ${mapLink}</td>
                    <td>${report.details}</td>
                    <td>${attachmentHTML}</td>
                    <td>${new Date(report.created_at).toLocaleString()}</td>
                    <td>${getHotline(report.type)}</td>
                    <td>
                        <select onchange="updateStatus(${report.id}, this.value)">
                            <option value="Ongoing" ${report.status === "Ongoing" ? "selected" : ""}>Ongoing</option>
                            <option value="Resolved" ${report.status === "Resolved" ? "selected" : ""}>Resolved</option>
                            <option value="False Alarm" ${report.status === "False Alarm" ? "selected" : ""}>False Alarm</option>
                        </select>
                    </td>
                </tr>`;
        });
    });
}

function updateStatus(id, newStatus) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", newStatus);
    fetch("update_status.php", { method: "POST", body: formData })
    .then(response => response.text())
    .then(data => { if (data.trim() === "success") { loadAdminDashboard(); } });
}

function startAdminPolling() {
    setInterval(() => {
        if (document.getElementById('adminDashboard').style.display === 'block') { loadAdminDashboard(); }
    }, 10000); 
}

function getHotline(type) {
    const hotlines = { "Fire": "BFP: 0917-163-6020", "Crime": "PNP: 0917-310-6465", "Medical": "RHU: 0961-042-4541", "Flood": "PDRRMO: (053) 500-0091", "Minor Dispute / Tip": "Barangay HQ" };
    return hotlines[type] || "Local Police";
}

function printDashboard() { window.print(); }

window.onload = () => showPage('home');