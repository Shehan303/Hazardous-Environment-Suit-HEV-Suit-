let db;
let suitRef;

// DOM elements
const firebaseStatus = document.getElementById('firebaseStatus');
const currentDamageDisplay = document.getElementById('current-damage');
const jacketParts = {
    'body': document.getElementById('body'),
    'left-upper-arm': document.getElementById('left-upper-arm'),
    'left-lower-arm': document.getElementById('left-lower-arm'),
    'right-upper-arm': document.getElementById('right-upper-arm'),
    'right-lower-arm': document.getElementById('right-lower-arm')
};
const statusElements = {
    'body': document.getElementById('torso-status'),
    'left-upper-arm': document.getElementById('left-arm-status'),
    'left-lower-arm': document.getElementById('left-arm-status'),
    'right-upper-arm': document.getElementById('right-arm-status'),
    'right-lower-arm': document.getElementById('right-arm-status')
};

// Initialize Firebase
document.getElementById('initFirebase').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const authDomain = document.getElementById('authDomain').value;
    const databaseURL = document.getElementById('databaseURL').value;
    const projectId = document.getElementById('projectId').value;

    if (!apiKey || !authDomain || !databaseURL || !projectId) {
        firebaseStatus.textContent = "Please fill all fields";
        firebaseStatus.className = "status-value warning";
        return;
    }

    const firebaseConfig = {
        apiKey: apiKey,
        authDomain: authDomain,
        databaseURL: databaseURL,
        projectId: projectId
    };

    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        suitRef = db.ref('hev_suit');

        // Set up listeners
        setupFirebaseListeners();

        firebaseStatus.textContent = "Connected to Firebase";
        firebaseStatus.className = "status-value safe";
    } catch (error) {
        firebaseStatus.textContent = "Connection failed: " + error.message;
        firebaseStatus.className = "status-value critical";
        console.error("Firebase initialization error:", error);
    }
});

// Set up Firebase listeners
function setupFirebaseListeners() {
    // Vital signs
    suitRef.child('vitals').on('value', (snapshot) => {
        const vitals = snapshot.val();
        if (vitals) {
            document.getElementById('heart-rate').textContent = `${vitals.heartRate || '--'} bpm`;
            document.getElementById('body-temp').textContent = `${vitals.temperature || '--'} °C`;
            document.getElementById('humidity').textContent = `${vitals.humidity || '--'} %`;
            document.getElementById('battery').textContent = `${vitals.battery || '--'} %`;
        }
    });

    // Environmental data
    suitRef.child('environment').on('value', (snapshot) => {
        const env = snapshot.val();
        if (env) {
            document.getElementById('ext-temp').textContent = `${env.temperature || '--'} °C`;
            document.getElementById('air-quality').textContent = env.airQuality || '--';
            document.getElementById('toxic-gas').textContent = env.toxicGas || '--';
            document.getElementById('gps-location').textContent = env.gps || '--';

            // Update status colors
            document.getElementById('air-quality').className =
                env.airQuality === 'Good' ? 'status-value safe' :
                    env.airQuality === 'Fair' ? 'status-value warning' : 'status-value critical';

            document.getElementById('toxic-gas').className =
                env.toxicGas === 'None' ? 'status-value safe' :
                    env.toxicGas === 'Low' ? 'status-value warning' : 'status-value critical';
        }
    });

    // Damage detection
    suitRef.child('damage').on('value', (snapshot) => {
        const damage = snapshot.val();
        if (damage) {
            updateDamageVisualization(damage);
        }
    });
}

// Update jacket visualization based on damage data
function updateDamageVisualization(damage) {
    // Reset all parts to default
    Object.values(jacketParts).forEach(part => {
        part.className = part.id.includes('arm') ?
            `jacket-part ${part.id}` :
            `jacket-part ${part.id}`;
    });

    // Reset status indicators
    Object.values(statusElements).forEach(el => {
        el.textContent = 'Nominal';
        el.className = 'status-value safe';
    });

    // Update system status
    document.getElementById('system-status').textContent = '100%';
    document.getElementById('system-status').className = 'status-value safe';

    // Process damage data
    if (damage.part && damage.severity && damage.part !== 'none') {
        const partElement = jacketParts[damage.part];
        partElement.classList.add(`damage-${damage.severity}`);

        // Update status text
        const statusText = damage.severity === 'warning' ?
            'Minor Damage' : 'CRITICAL DAMAGE';

        statusElements[damage.part].textContent = statusText;
        statusElements[damage.part].className = `status-value ${damage.severity}`;

        // Update system integrity
        const integrity = damage.severity === 'warning' ? '85%' : '60%';
        document.getElementById('system-status').textContent = integrity;
        document.getElementById('system-status').className = `status-value ${damage.severity}`;

        // Update current damage display
        currentDamageDisplay.textContent = `${damage.part.replace('-', ' ').toUpperCase()} - ${statusText}`;
        currentDamageDisplay.className = `status-value ${damage.severity}`;
    } else {
        currentDamageDisplay.textContent = "No damage detected";
        currentDamageDisplay.className = "status-value safe";
    }
}

// Sample function to push test data (for demonstration)
function pushTestData() {
    if (!suitRef) return;

    // Sample vitals
    suitRef.child('vitals').set({
        heartRate: Math.floor(70 + Math.random() * 20),
        temperature: (36 + Math.random()).toFixed(1),
        humidity: Math.floor(40 + Math.random() * 20),
        battery: Math.floor(80 + Math.random() * 20)
    });

    // Sample environment
    const airQualities = ['Good', 'Fair', 'Poor'];
    const toxicLevels = ['None', 'Low', 'High'];
    suitRef.child('environment').set({
        temperature: Math.floor(25 + Math.random() * 15),
        airQuality: airQualities[Math.floor(Math.random() * airQualities.length)],
        toxicGas: toxicLevels[Math.floor(Math.random() * toxicLevels.length)],
        gps: "12.3456, 78.9012"
    });

    // Sample damage
    const parts = ['none', 'body', 'left-upper-arm', 'left-lower-arm', 'right-upper-arm', 'right-lower-arm'];
    const severities = ['none', 'warning', 'critical'];
    suitRef.child('damage').set({
        part: parts[Math.floor(Math.random() * parts.length)],
        severity: severities[Math.floor(Math.random() * severities.length)]
    });
}

// Add button for testing (remove in production)
const testBtn = document.createElement('button');
testBtn.textContent = "Push Test Data";
testBtn.style.position = "fixed";
testBtn.style.bottom = "20px";
testBtn.style.right = "20px";
testBtn.style.zIndex = "1000";
testBtn.style.padding = "10px";
testBtn.style.backgroundColor = "#64ffda";
testBtn.style.color = "#0a192f";
testBtn.style.border = "none";
testBtn.style.borderRadius = "4px";
testBtn.style.cursor = "pointer";
testBtn.addEventListener('click', pushTestData);
document.body.appendChild(testBtn);