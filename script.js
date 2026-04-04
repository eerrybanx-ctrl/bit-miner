// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUrHJn2JjlUswltkXLYrgzUZJMdDIMWH8",
  authDomain: "bit-miner-697ce.firebaseapp.com",
  projectId: "bit-miner-697ce",
  storageBucket: "bit-miner-697ce.firebasestorage.app",
  messagingSenderId: "726423430868",
  appId: "1:726423430868:web:955e45d3f06289a116fd41",
  measurementId: "G-PLT0TVEEW3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); 

let currentUserId = null; 
let isListeningToDeposits = false; 

const plans = [
    { id: 1, name: "Starter Miner", cost: 75, daily: 10.5, duration: 40 },
    { id: 2, name: "Basic Miner", cost: 150, daily: 21, duration: 40 },
    { id: 3, name: "Standard Miner", cost: 300, daily: 42, duration: 40 },
    { id: 4, name: "Advanced Miner", cost: 550, daily: 77, duration: 40 },
    { id: 5, name: "Pro Miner", cost: 700, daily: 98, duration: 40 },
    { id: 6, name: "Premium Miner", cost: 1000, daily: 140, duration: 40 },
    { id: 7, name: "Elite Miner", cost: 1500, daily: 210, duration: 40 },
    { id: 8, name: "VIP Miner", cost: 2000, daily: 280, duration: 40 },
    { id: 9, name: "Ultimate Miner", cost: 2500, daily: 350, duration: 40 }
];

let userData = {
    username: "",
    phone: "",
    balance: 0.00,
    referral: 0.00,
    activeInvestments: [],
    lastClaimDate: "",
    refCode: "" // Added field
};

function updateBalance() {
    document.getElementById('bal-amount').textContent = parseFloat(userData.balance).toFixed(2);
    document.getElementById('ref-comm').textContent = parseFloat(userData.referral || 0).toFixed(2);
    
    const header = document.getElementById('header-bal');
    if (header) header.textContent = `₵${parseFloat(userData.balance).toFixed(2)}`;
}

function showModal(title, message) {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-msg').innerHTML = message;
    document.getElementById('modal').style.display = 'flex';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

function toggleAuth() {
    document.getElementById('signup-box').classList.toggle('hidden');
    document.getElementById('login-box').classList.toggle('hidden');
}

function launchApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    document.getElementById('display-name').textContent = userData.username || "Miner";
    document.getElementById('prof-user').textContent = userData.username || "Miner";
    document.getElementById('prof-phone').textContent = userData.phone || "0500000000";

    // Set the unique referral code for this specific user
    document.getElementById('ref-code').textContent = userData.refCode || "GH-7721";

    renderPlans();
    updateActiveList();
    updateBalance();
    startLiveCounters();
    loadDepositHistory(); 
}

function handleSignup() {
    const user = document.getElementById('reg-user').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-pass-confirm').value;

    if (!user || !phone || !pass) return showModal("Missing Info", "Please fill all fields.");
    if (pass !== confirm) return showModal("Error", "Passwords do not match.");

    const emailPlaceholder = `${phone}@bitminer.gh`;

    // Generate a unique 5-digit code for the new user
    const uniqueRefCode = "GH-" + Math.floor(10000 + Math.random() * 90000);

    auth.createUserWithEmailAndPassword(emailPlaceholder, pass)
        .then((userCredential) => {
            const fbUser = userCredential.user;
            currentUserId = fbUser.uid;

            return db.collection("users").doc(fbUser.uid).set({
                username: user,
                phone: phone,
                balance: 0.00,
                referral: 0.00,
                activeInvestments: [],
                lastClaimDate: "",
                refCode: uniqueRefCode, // Save the code
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            showModal("Account Secured", "Welcome! Your professional mining vault is ready.");
        })
        .catch((error) => {
            showModal("Signup Failed", error.message);
        });
}

function handleLogin() {
    const id = document.getElementById('login-id').value.trim(); 
    const pass = document.getElementById('login-pass').value;

    if (!id || !pass) return showModal("Login Error", "Enter credentials.");

    const emailPlaceholder = `${id}@bitminer.gh`;

    auth.signInWithEmailAndPassword(emailPlaceholder, pass)
        .catch((error) => {
            showModal("Access Denied", "Invalid phone number or password.");
        });
}

function logout() {
    auth.signOut().then(() => {
        location.reload();
    });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
        db.collection("users").doc(user.uid).onSnapshot((doc) => {
            if (doc.exists) {
                userData = doc.data();
                launchApp(); 
            }
        });
    } else {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }
});

function saveUserData() {
    if (!currentUserId) return;
    db.collection("users").doc(currentUserId).update(userData)
      .catch(err => console.error("Sync error:", err));
}

function showSection(sectionId, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
}

function renderPlans() {
    const containers = ['home-plans-list', 'market-plans'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        container.innerHTML = '';

        plans.forEach(plan => {
            const dailyROI = ((plan.daily / plan.cost) * 100).toFixed(1);
            const totalReturn = (plan.daily * plan.duration).toFixed(0);

            const html = `
                <div class="plan-card">
                    <div class="plan-header">
                        <strong style="font-size:1.25rem;">${plan.name}</strong>
                        <span style="color:var(--primary); font-size:1.35rem; font-weight:700;">₵${plan.cost}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.95rem;">
                        <span>Daily Return</span>
                        <span style="color:var(--success); font-weight:600;">₵${plan.daily}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.95rem;">
                        <span>Duration</span>
                        <span>40 days</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#94a3b8;">
                        <span>Daily ROI</span>
                        <span style="color:var(--success); font-weight:600;">${dailyROI}%</span>
                    </div>
                    <div style="margin-top:14px; font-size:0.9rem;">
                        Total projected earnings: <strong style="color:var(--text)">₵${totalReturn}</strong>
                    </div>
                    <button class="btn btn-primary" style="margin-top:22px;" onclick="buyPlan(${plan.id})">
                        Invest ₵${plan.cost} Now
                    </button>
                </div>`;
            container.innerHTML += html;
        });
    });
}

function buyPlan(id) {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;

    if (userData.balance >= plan.cost) {
        userData.balance -= plan.cost;
        userData.activeInvestments.push({
            ...plan,
            daysLeft: plan.duration,
            dateBought: new Date().toLocaleDateString('en-GB')
        });

        updateBalance();
        updateActiveList();
        saveUserData();

        showModal("Investment Activated", 
            `✅ Success!<br>You have invested ₵${plan.cost} in <strong>${plan.name}</strong>.<br>Daily mining rewards start immediately.`);
    } else {
        const needed = plan.cost - userData.balance;
        showModal("Insufficient Wallet Balance", 
            `You need ₵${plan.cost} for this plan.<br>` +
            `Your current balance is ₵${parseFloat(userData.balance).toFixed(2)}.<br><br>` +
            `Please recharge at least ₵${needed.toFixed(2)} to continue.`);
    }
}

function updateActiveList() {
    const list = document.getElementById('active-list');
    list.innerHTML = '';

    if (userData.activeInvestments.length === 0) {
        list.innerHTML = `
            <div class="card" style="text-align:center; border-left-color:#64748b; padding:2.5rem 1rem;">
                <p style="font-size:1.3rem; margin-bottom:12px;">No active rigs yet</p>
                <p style="color:#94a3b8;">Your mining rigs will appear here once you invest.</p>
            </div>`;
        return;
    }

    userData.activeInvestments.forEach(inv => {
        const progress = Math.round(((inv.duration - inv.daysLeft) / inv.duration) * 100);
        list.innerHTML += `
            <div class="card" style="border-left-color:var(--success);">
                <div style="display:flex; justify-content:space-between;">
                    <h4>${inv.name}</h4>
                    <span style="background:#052e16; color:var(--success); padding:4px 12px; border-radius:9999px; font-size:0.8rem;">LIVE</span>
                </div>
                <p style="margin:14px 0 6px;">Daily reward: <strong>₵${inv.daily}</strong></p>
                <p style="color:#94a3b8; font-size:0.9rem;">Purchased: ${inv.dateBought}</p>
                <div style="margin-top:18px;">
                    <div style="height:10px; background:#334155; border-radius:9999px; position:relative;">
                        <div style="height:100%; width:${progress}%; background:linear-gradient(90deg, #10b981, #34d399); border-radius:9999px;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:0.85rem;">
                        <span>${inv.daysLeft} days left</span>
                        <span>${progress}% mined</span>
                    </div>
                </div>
            </div>`;
    });
}

function showRecharge() {
    document.getElementById('recharge-screen').classList.remove('hidden');
}

function hideRecharge() {
    document.getElementById('recharge-screen').classList.add('hidden');
}

function submitDeposit() {
    const amount = document.getElementById('depositAmount').value;
    const transactionId = document.getElementById('txID').value;

    if (!amount || !transactionId) {
        showModal("Incomplete", "Please enter the amount and Transaction ID!");
        return;
    }

    db.collection("depositRequests").add({
        userId: currentUserId,
        amount: parseFloat(amount),
        txID: transactionId,
        status: "pending",
        credited: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showModal("Success!", "Your payment has been submitted and is being verified by Admin.");
        document.getElementById('depositAmount').value = "";
        document.getElementById('txID').value = "";
        hideRecharge();
    })
    .catch((error) => {
        showModal("Error", "Something went wrong. Please try again.");
    });
}

function showWithdraw() {
    const MIN_WITHDRAW = 60;
    if (userData.balance < MIN_WITHDRAW) {
        return showModal("Minimum Withdrawal", `Your balance is below ₵${MIN_WITHDRAW}.`);
    }

    const amt = prompt("Enter amount to withdraw (₵):", userData.balance.toFixed(2));
    if (!amt) return;

    const amount = parseFloat(amt);
    if (isNaN(amount) || amount < MIN_WITHDRAW || amount > userData.balance) {
        return showModal("Invalid Amount", `Please enter a valid amount.`);
    }

    const net = prompt("Network (MTN / Telecel / Tigo):", "Telecel");
    const num = prompt("Mobile Money Number:");

    if (net && num) {
        showModal("Withdrawal Requested", `₵${amount.toFixed(2)} requested.`);
        userData.balance -= amount;
        updateBalance();
        saveUserData();
    }
}

function simulateDaily() {
    if (userData.activeInvestments.length === 0) {
        return showModal("No Active Rigs", "You need active mining plans.");
    }

    const today = new Date().toLocaleDateString('en-GB'); 

    if (userData.lastClaimDate === today) {
        return showModal("Already Claimed", "Please come back tomorrow!");
    }

    let totalEarned = 0;
    userData.activeInvestments.forEach(inv => {
        if (inv.daysLeft > 0) {
            totalEarned += inv.daily;
            inv.daysLeft--;
        }
    });

    if (totalEarned > 0) {
        userData.balance += totalEarned;
        userData.lastClaimDate = today; 
        updateBalance();
        updateActiveList();
        saveUserData();
        showModal("Rewards Credited", `₵${totalEarned.toFixed(2)} added!`);
    }
}

function startLiveCounters() {
    let hash = 3.84;
    setInterval(() => {
        hash += (Math.random() * 0.12 - 0.04);
        const liveHash = document.getElementById('live-hashrate');
        if (liveHash) liveHash.textContent = hash.toFixed(2) + " PH/s";
    }, 2200);
}

function loadDepositHistory() {
    const list = document.getElementById('pending-list');
    if (!currentUserId || isListeningToDeposits) return;
    isListeningToDeposits = true; 

    db.collection("depositRequests")
      .where("userId", "==", currentUserId)
      .onSnapshot((snapshot) => {
        if (snapshot.empty) {
            list.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:2rem;">No history found.</p>';
            return;
        }

        let html = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;
            const statusColor = data.status === 'approved' ? 'var(--success)' : 'var(--primary)';
            const statusText = (data.status || 'PENDING').toUpperCase();

            if (data.status === 'approved' && !data.credited) {
                userData.balance += parseFloat(data.amount);
                updateBalance();
                saveUserData();
                db.collection("depositRequests").doc(docId).update({ credited: true });
                showModal("✅ Wallet Credited", `GH₵${parseFloat(data.amount).toFixed(2)} added to your balance!`);
            }

            html += `
                <div class="deposit-item" style="border-left-color: ${statusColor}">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>GH₵${parseFloat(data.amount).toFixed(2)}</strong>
                        <span style="color:${statusColor}; font-size:0.8rem; font-weight:bold;">${statusText}</span>
                    </div>
                    <p style="font-size:0.85rem; color:#94a3b8; margin-top:5px;">TX ID: ${data.txID}</p>
                </div>`;
        });
        list.innerHTML = html;
    });
}
