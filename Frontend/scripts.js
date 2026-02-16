/* ========== NEURAL NETWORK ANIMATION ========== */
const canvas = document.getElementById("neuralCanvas");
const ctx = canvas.getContext("2d");
let particles = [];
let scanSpeed = 1;
let baseSpeed = 1;
let accentColor = '#6366f1';

function resize() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
}
window.addEventListener("resize", resize); 
resize();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 1.5 + 0.8;
        this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
        this.x += this.vx * scanSpeed * baseSpeed;
        this.y += this.vy * scanSpeed * baseSpeed;
        this.pulse += 0.05 * baseSpeed;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
        const alpha = (Math.sin(this.pulse) * 0.3 + 0.5) * (scanSpeed > 1 ? 1 : 0.6);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const [r, g, b] = hexToRgb(accentColor);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
    }
}

for (let i = 0; i < 120; i++) particles.push(new Particle());

function animate() {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.05)';
    if (document.body.classList.contains('light-mode')) {
        ctx.fillStyle = 'rgba(248, 250, 252, 0.05)';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, i) => {
        p.update();
        p.draw();
        for (let j = i + 1; j < particles.length; j++) {
            const dx = p.x - particles[j].x;
            const dy = p.y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const [r, g, b] = hexToRgb(accentColor);
                ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist/150) * (scanSpeed/10)})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    });
    requestAnimationFrame(animate);
}
animate();

/* ========== PERSONALIZATION ========== */
let userProfile = {
    name: '',
    age: '',
    accent: '#6366f1',
    animSpeed: 1,
    voice: false
};

function loadProfile() {
    const saved = localStorage.getItem('neuralHealthProfile');
    if (saved) {
        userProfile = JSON.parse(saved);
        document.getElementById('userName').value = userProfile.name || '';
        document.getElementById('ageRange').value = userProfile.age || '';
        document.getElementById('animSpeed').value = userProfile.animSpeed || 1;
        document.getElementById('speedValue').textContent = (userProfile.animSpeed || 1) + 'x';
        document.getElementById('voiceEnabled').checked = userProfile.voice || false;
        if (userProfile.accent) {
            accentColor = userProfile.accent;
            document.documentElement.style.setProperty('--primary', userProfile.accent);
            // Set active color button
            document.querySelectorAll('.color-btn').forEach(btn => {
                if (btn.dataset.color === userProfile.accent) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        updateGreeting();
    }
}

function updatePersonalization() {
    userProfile.name = document.getElementById('userName').value;
    userProfile.age = document.getElementById('ageRange').value;
    userProfile.voice = document.getElementById('voiceEnabled').checked;
    localStorage.setItem('neuralHealthProfile', JSON.stringify(userProfile));
    updateGreeting();
}

function updateGreeting() {
    const greeting = document.getElementById('greeting');
    if (userProfile.name) {
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        greeting.textContent = `${timeGreeting}, ${userProfile.name}`;
    } else {
        greeting.textContent = 'Awaiting input patterns...';
    }
}

function setAccent(btn) {
    const color = btn.dataset.color;
    accentColor = color;
    userProfile.accent = color;
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('neuralHealthProfile', JSON.stringify(userProfile));
    
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function updateAnimSpeed(value) {
    baseSpeed = parseFloat(value);
    userProfile.animSpeed = baseSpeed;
    document.getElementById('speedValue').textContent = value + 'x';
    localStorage.setItem('neuralHealthProfile', JSON.stringify(userProfile));
}

/* ========== UI INTERACTIONS ========== */
function toggleSettings() {
    document.getElementById('settingsPanel').classList.toggle('active');
}

function toggleHistory() {
    document.getElementById('historyPanel').classList.toggle('active');
    loadHistory();
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    document.body.classList.toggle("light-mode");
    document.getElementById("themeIcon").textContent = isDark ? "🌙" : "☀️";
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

/* ========== INPUT HANDLING ========== */
let typingTimer;
let uploadedImages = [];

function onUserType() {
    const text = document.getElementById("symptoms").value;
    const btn = document.getElementById("submitBtn");
    const feedback = document.getElementById("liveFeedback");
    const counter = document.getElementById("charCounter");
    
    counter.textContent = `${text.length}/500`;
    
    if (text.length > 15) {
        btn.classList.add("active");
        updateGreeting();
    } else {
        btn.classList.remove("active");
    }

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        analyzeInput(text, feedback);
    }, 500);
}

/* ========== IMAGE UPLOAD HANDLING ========== */
function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: formatFileSize(file.size),
                    url: e.target.result,
                    file: file
                };
                
                uploadedImages.push(imageData);
                displayImagePreviews();
                updateUploadUI();
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // Reset input
    event.target.value = '';
}

function displayImagePreviews() {
    const container = document.getElementById('imagePreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    
    if (uploadedImages.length > 0) {
        placeholder.classList.add('hidden');
        container.innerHTML = uploadedImages.map(img => `
            <div class="image-preview-item" data-id="${img.id}">
                <img src="${img.url}" alt="${img.name}">
                <button class="image-remove-btn" onclick="removeImage('${img.id}')">×</button>
                <div class="image-info">
                    <div>${img.name}</div>
                    <div>${img.size}</div>
                </div>
            </div>
        `).join('');
    } else {
        placeholder.classList.remove('hidden');
        container.innerHTML = '';
    }
}

function removeImage(imageId) {
    uploadedImages = uploadedImages.filter(img => img.id != imageId);
    displayImagePreviews();
    updateUploadUI();
}

function updateUploadUI() {
    const uploadLabel = document.querySelector('.upload-label');
    
    if (uploadedImages.length > 0) {
        const existingBadge = uploadLabel.querySelector('.image-count-badge');
        if (existingBadge) {
            existingBadge.textContent = `${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`;
        } else {
            const badge = document.createElement('span');
            badge.className = 'image-count-badge';
            badge.textContent = `${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`;
            uploadLabel.appendChild(badge);
        }
    } else {
        const existingBadge = uploadLabel.querySelector('.image-count-badge');
        if (existingBadge) existingBadge.remove();
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Drag and drop functionality
const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: formatFileSize(file.size),
                url: event.target.result,
                file: file
            };
            uploadedImages.push(imageData);
            displayImagePreviews();
            updateUploadUI();
        };
        reader.readAsDataURL(file);
    });
});

/* ========== INPUT HANDLING CONTINUED ========== */

function analyzeInput(text, feedback) {
    const markers = [];
    
    if (text.match(/pain|ache|hurt|sore/i)) markers.push('pain');
    if (text.match(/fever|hot|temperature/i)) markers.push('fever');
    if (text.match(/cough|throat/i)) markers.push('respiratory');
    if (text.match(/hour|day|week|month|since/i)) markers.push('duration');
    if (text.match(/morning|evening|night|afternoon/i)) markers.push('timing');
    
    if (markers.length > 0) {
        feedback.innerHTML = `<span class="marker-icon">✓</span> Detected: ${markers.join(', ')}`;
        feedback.style.opacity = 1;
    } else if (text.length > 20) {
        feedback.innerHTML = `<span class="marker-icon">⚡</span> Continue describing...`;
        feedback.style.opacity = 1;
    } else {
        feedback.style.opacity = 0;
    }
}

function addTag(tag) {
    const textarea = document.getElementById('symptoms');
    const current = textarea.value;
    textarea.value = current + (current ? ', ' : '') + tag;
    onUserType();
    textarea.focus();
}

function clearForm() {
    document.getElementById('symptoms').value = '';
    document.getElementById('resultOutput').innerHTML = '';
    document.getElementById('liveFeedback').style.opacity = 0;
    document.getElementById('charCounter').textContent = '0/500';
    document.getElementById('submitBtn').classList.remove('active');
    uploadedImages = [];
    displayImagePreviews();
    updateUploadUI();
    scanSpeed = 1;
}

function updateTempIndicator(temp) {
    const indicator = document.getElementById('tempIndicator');
    if (!temp) {
        indicator.textContent = 'Normal';
        indicator.className = 'temp-indicator';
        return;
    }
    const t = parseFloat(temp);
    if (t < 36) {
        indicator.textContent = 'Low';
        indicator.className = 'temp-indicator low';
    } else if (t >= 36 && t < 37.5) {
        indicator.textContent = 'Normal';
        indicator.className = 'temp-indicator normal';
    } else if (t >= 37.5 && t < 38.5) {
        indicator.textContent = 'Elevated';
        indicator.className = 'temp-indicator elevated';
    } else {
        indicator.textContent = 'High';
        indicator.className = 'temp-indicator high';
    }
}

function updateSeverity(val) {
    document.getElementById('severityValue').textContent = val;
    const label = document.getElementById('severityLabel');
    const labels = ['Minimal', 'Mild', 'Mild', 'Moderate', 'Moderate', 'Moderate', 'Severe', 'Severe', 'Very Severe', 'Critical'];
    label.textContent = labels[val - 1];
}

/* ========== ANALYSIS ENGINE ========== */
let analysisHistory = [];

async function initiateScan() {
    const text = document.getElementById("symptoms").value;
    if (text.length < 15) {
        showNotification('Please provide more details about your symptoms', 'warning');
        return;
    }

    scanSpeed = 5;
    const output = document.getElementById("resultOutput");
    output.innerHTML = `
        <div class="analysis-loading">
            <div class="spinner-advanced"></div>
            <p id="statusMsg" class="status-msg">INITIALIZING NEURAL SCAN...</p>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <p class="progress-text" id="progressText">0%</p>
        </div>`;

    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) progress += Math.random() * 5;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = Math.floor(progress) + '%';
    }, 200);

    try {
        // 1. Prepare Text Analysis Request
        const formData = new FormData();
        formData.append('text', text);
        const temp = document.getElementById('temperature').value;
        if (temp) formData.append('temperature', temp);

        // 2. Prepare Image Analysis Request (if images exist)
        const imageRequestPromise = (uploadedImages.length > 0 && uploadedImages[0].file) 
            ? (() => {
                const imgFormData = new FormData();
                imgFormData.append('file', uploadedImages[0].file);
                return fetch('http://127.0.0.1:8000/predict/image', { method: 'POST', body: imgFormData });
              })()
            : Promise.resolve(null);

        // 3. Execute Requests in Parallel
        const [textResponse, imageResponse] = await Promise.all([
            fetch('http://127.0.0.1:8000/predict', { method: 'POST', body: formData }),
            imageRequestPromise
        ]);

        if (!textResponse.ok) throw new Error('Text analysis failed');
        
        const textData = await textResponse.json();
        let imageData = null;
        
        if (imageResponse && imageResponse.ok) {
            imageData = await imageResponse.json();
        }

        // 4. Finalize UI
        clearInterval(progressInterval);
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressText').textContent = '100%';
        document.getElementById("statusMsg").textContent = "ANALYSIS COMPLETE";

        setTimeout(() => renderResults(text, textData, imageData), 500);
        incrementAnalysisCount();

    } catch (error) {
        clearInterval(progressInterval);
        console.error(error);
        output.innerHTML = `<div class="analysis-card"><h3 style="color:var(--danger)">Connection Error</h3><p>Could not connect to the AI model. Ensure the backend (main.py) is running.</p></div>`;
    }
}

function renderResults(inputText, textData, imageData) {
    scanSpeed = 2;
    const resultArea = document.getElementById("resultOutput");
    
    const analysis = processApiData(textData);
    
    // Generate image analysis section if images were uploaded
    let imageAnalysisHTML = '';
    if (imageData && imageData.analysis) {
        const imgPred = imageData.analysis[0];
        imageAnalysisHTML = `
            <div class="image-analysis-section">
                <h4>🖼️ Visual Analysis</h4>
                <div class="uploaded-images-grid">
                    ${uploadedImages.map(img => `
                        <div class="analyzed-image">
                            <img src="${img.url}" alt="${img.name}">
                            <div class="image-analysis-overlay">
                                <span class="analysis-status">✓ ${imgPred.condition}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <p class="image-analysis-note">Visual scan detected markers consistent with <strong>${imgPred.condition}</strong> (${imgPred.confidence}).</p>
            </div>
        `;
    } else if (uploadedImages.length > 0) {
        imageAnalysisHTML = `
            <div class="image-analysis-section">
                <h4>🖼️ Visual Analysis</h4>
                <p class="image-analysis-note">Images uploaded but could not be processed by the vision model.</p>
            </div>
        `;
    }
    
    resultArea.innerHTML = `
        <div class="analysis-card" id="finalCard">
            <div class="card-header">
                <div>
                    <h3>🧬 Neural Scan Complete</h3>
                    <p class="scan-id">Scan ID: #${Date.now().toString().slice(-6)}</p>
                </div>
                <div class="confidence-badge">${analysis.confidence}</div>
            </div>
            
            ${imageAnalysisHTML}
            
            <div class="analysis-grid">
                <div class="analysis-item">
                    <span class="item-label">Primary Pattern</span>
                    <span class="item-value">${analysis.pattern}</span>
                </div>
                <div class="analysis-item">
                    <span class="item-label">Risk Level</span>
                    <span class="item-value risk-${analysis.risk.toLowerCase()}">${analysis.risk}</span>
                </div>
                <div class="analysis-item">
                    <span class="item-label">Recommended Action</span>
                    <span class="item-value">${analysis.action}</span>
                </div>
            </div>

            <div class="insight-section">
                <h4>📊 Detailed Insights</h4>
                <p>${analysis.insight}</p>
            </div>

            <div class="recommendations">
                <h4>💡 Recommendations</h4>
                <ul>
                    ${analysis.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>

            <div class="disclaimer">
                <strong>⚠️ Medical Disclaimer:</strong> This is an AI-powered informational tool. Always consult healthcare professionals for medical advice.
            </div>

            <div class="action-buttons">
                <button onclick="downloadReport()" class="action-btn primary">
                    <span>📥</span> Download Report
                </button>
                <button onclick="saveToHistory()" class="action-btn secondary">
                    <span>💾</span> Save to History
                </button>
                <button onclick="shareResults()" class="action-btn secondary">
                    <span>📤</span> Share
                </button>
            </div>
        </div>`;
    
    setTimeout(() => {
        document.getElementById("finalCard").classList.add("show");
        if (userProfile.voice) {
            speakResult(analysis.pattern);
        }
    }, 100);
    
    saveAnalysis(inputText, analysis, analysis.confidence);
}

function processApiData(textData) {
    const prediction = textData.top_predictions[0];
    const disease = prediction.disease;
    const confidenceStr = prediction.confidence; // e.g. "98.50%"
    const confidenceVal = parseFloat(confidenceStr);
    
    // Determine risk based on confidence or specific keywords (Simple logic for demo)
    let risk = 'Low';
    if (confidenceVal > 80) risk = 'High';
    else if (confidenceVal > 50) risk = 'Medium';
    
    // If it's a "Simple Match" from rule engine, it's usually high certainty
    if (confidenceStr.includes('Simple Match')) risk = 'Medium';
    
    return {
        pattern: disease,
        confidence: confidenceStr,
        risk: risk,
        action: risk === 'High' ? 'Consult a Doctor' : 'Monitor Symptoms',
        insight: `AI analysis identifies patterns consistent with <strong>${disease}</strong>. The model indicates a ${confidenceStr} match based on the symptoms provided.`,
        recommendations: [
            'Consult a healthcare professional for accurate diagnosis',
            'Monitor symptoms for any changes over the next 24 hours',
            'Maintain hydration and rest',
            'Seek immediate care if condition worsens'
        ]
    };
}

function saveAnalysis(input, analysis, confidence) {
    const record = {
        id: Date.now(),
        date: new Date().toISOString(),
        input: input.substring(0, 100),
        pattern: analysis.pattern,
        confidence: confidence,
        risk: analysis.risk
    };
    
    analysisHistory.unshift(record);
    if (analysisHistory.length > 10) analysisHistory.pop();
    localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('analysisHistory');
    if (saved) {
        analysisHistory = JSON.parse(saved);
    }
    
    const content = document.getElementById('historyContent');
    if (analysisHistory.length === 0) {
        content.innerHTML = '<p class="empty-state">No previous analyses yet</p>';
        return;
    }
    
    content.innerHTML = analysisHistory.map(record => `
        <div class="history-item">
            <div class="history-header-content">
                <span class="history-date">${new Date(record.date).toLocaleDateString()}</span>
                <span class="history-confidence">${record.confidence}%</span>
            </div>
            <div class="history-pattern">${record.pattern}</div>
            <div class="history-risk risk-${record.risk.toLowerCase()}">${record.risk} Risk</div>
        </div>
    `).join('');
}

function saveToHistory() {
    showNotification('Analysis saved to history', 'success');
}

function downloadReport() {
    showNotification('Report download started', 'success');
    window.print();
}

function shareResults() {
    showNotification('Share feature coming soon', 'info');
}

/* ========== UTILITIES ========== */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [99, 102, 241];
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function speakResult(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Analysis complete. Pattern identified: ${text}`);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
}

function incrementAnalysisCount() {
    const countEl = document.getElementById('analysisCount');
    const current = parseInt(countEl.textContent) || 0;
    countEl.textContent = current + 1;
}

/* ========== SESSION TIMER ========== */
let sessionStart = Date.now();
setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('sessionTime').textContent = `${minutes}:${seconds}`;
}, 1000);

/* ========== INITIALIZATION ========== */
window.addEventListener('load', () => {
    loadProfile();
    if (localStorage.getItem("theme") === "light") {
        toggleDarkMode();
    }
    updateGreeting();
});
