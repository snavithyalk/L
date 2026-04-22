// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDy5PXHDOWEASIxRd2bukF5FRscxFy9ZwQ",
    authDomain: "navithya-e33ae.firebaseapp.com",
    databaseURL: "https://navithya-e33ae-default-rtdb.firebaseio.com",
    projectId: "navithya-e33ae",
    storageBucket: "navithya-e33ae.firebasestorage.app",
    messagingSenderId: "753981072296",
    appId: "1:753981072296:web:a92cb922b52fcd1fabb39d",
    measurementId: "G-7YKLBE203D"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// App State
let users = [];
let requests = [];
let homeData = { title: "Welcome to Navithya", sub: "Cloud-Based Service Portal" };
let storeItems = [];
let galleryItems = [];
let currentUser = null;

// Persistence Initialization
function restoreSession() {
    const saved = localStorage.getItem('navithya_session');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            loginSuccess(user, true); // Pass true to avoid re-saving
        } catch (e) {
            localStorage.removeItem('navithya_session');
        }
    }
}

// Realtime listeners
db.ref('users').on('value', (snapshot) => {
    const data = snapshot.val();
    users = data ? Object.values(data) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});
db.ref('requests').on('value', (snapshot) => {
    const data = snapshot.val();
    requests = data ? Object.values(data) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});

// Constants
const ADMIN_USER = { username: 'ADITHYA', role: 'admin', name: 'Adithya Admin' };
const ADMIN_PASS = '19980307';
const WHATSAPP_NUM = '94769929453';

// Sidebar Roles Configuration
const ROLE_MENUS = {
    admin: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'admin-jobs', label: 'Provider Jobs', icon: 'fas fa-briefcase' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'admin', label: 'Admin Dashboard', icon: 'fas fa-user-shield' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'broadcast', label: 'Global Broadcast', icon: 'fas fa-bullhorn' },
        { id: 'plans-edit', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    developer: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'admin-jobs', label: 'Provider Jobs', icon: 'fas fa-briefcase' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'admin', label: 'Admin Dashboard', icon: 'fas fa-user-shield' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'plans-edit', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    provider: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'provider-jobs', label: 'Received Jobs', icon: 'fas fa-inbox' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'provider-dashboard', label: 'Provider Dashboard', icon: 'fas fa-tachometer-alt' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'plans', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    customer: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'services', label: 'Request Job', icon: 'fas fa-file-signature' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'customer-dashboard', label: 'Customer Dashboard', icon: 'fas fa-user' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'tracking', label: 'Tracking Job', icon: 'fas fa-map-marker-alt' }
    ]
};

// DOM Elements
const authOverlay = document.getElementById('auth-overlay');

// Tabs setup
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const btns = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;

    if (username === ADMIN_USER.username && pass === ADMIN_PASS) {
        loginSuccess(ADMIN_USER);
        return;
    }

    const foundUser = users.find(u => u.phone === username || u.name === username);
    if (foundUser) {
        if (foundUser.pass !== pass) return alert('Invalid Password!');
        if (foundUser.status === 'pending') return alert('Your account is pending admin approval.');
        loginSuccess(foundUser);
    } else {
        alert('User not found. Please sign up.');
    }
}

function handleForgetPassword() {
    const phone = prompt("Enter your registered Phone Number:");
    if (!phone) return;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=Reset%20Password%20for%20${phone}`, '_blank');
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const pass = document.getElementById('signup-password').value;
    const country = document.getElementById('signup-country').value;
    const city = document.getElementById('signup-city').value;
    const experience = document.getElementById('signup-experience').value;
    const skills = document.getElementById('signup-skills').value;
    const bio = document.getElementById('signup-bio').value;

    const newUser = { id: Date.now(), name, phone, pass, country, district: city, experience, skills, bio, role: 'unassigned', status: 'pending', timestamp: Date.now() };
    db.ref('users/' + newUser.id).set(newUser);

    window.open(`https://wa.me/${WHATSAPP_NUM}?text=New%20Signup%3A%20${name}%20(${phone})`, '_blank');

    alert('Signup successful! Wait for Admin approval.');
    switchAuthTab('login');
}

function showAuthOverlay() { authOverlay.classList.remove('hidden'); }
function hideAuthOverlay() { authOverlay.classList.add('hidden'); }

// UI Control
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    sidebar.classList.toggle('hidden');
}

function populateSidebar(role) {
    const sidebar = document.getElementById('main-sidebar');
    const linksList = document.getElementById('sidebar-links');
    const roleDisplay = sidebar.querySelector('.role-display');
    
    linksList.innerHTML = '';
    roleDisplay.innerText = role.toUpperCase() + ' PANEL';

    const menu = ROLE_MENUS[role] || [];
    menu.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<button onclick="navigate('${item.id}')"><i class="${item.icon}"></i> ${item.label}</button>`;
        linksList.appendChild(li);
    });
}

function loginSuccess(user, isRestoration = false) {
    currentUser = user;
    if (!isRestoration) {
        localStorage.setItem('navithya_session', JSON.stringify(user));
    }
    authOverlay.classList.add('hidden');

    // Show Sidebar Toggle
    document.getElementById('sidebar-toggle').classList.remove('hidden');
    
    // UI toggles
    document.getElementById('nav-login-btn').classList.add('hidden');
    document.getElementById('nav-logout-btn').classList.remove('hidden');

    // Populate Sidebar based on role
    populateSidebar(user.role);

    if (user.role === 'admin' || user.role === 'developer') {
        document.getElementById('gallery-upload-section').classList.remove('hidden');
        updateAdminPanel();
    }

    if (user.role === 'provider') {
        updateProviderPanel();
    }

    alert(`Welcome back, ${user.name}!`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('navithya_session');

    // UI toggles
    document.getElementById('nav-login-btn').classList.remove('hidden');
    document.getElementById('nav-logout-btn').classList.add('hidden');
    document.getElementById('sidebar-toggle').classList.add('hidden');
    document.getElementById('main-sidebar').classList.add('hidden');

    // Clear forms
    document.getElementById('login-form').reset();
    document.getElementById('signup-form').reset();

    // Go back home
    navigate('home');
}

// Navigation
function navigate(pageId) {
    // Route aliases for sub-components
    if (pageId === 'rate-us' || pageId === 'reviews') pageId = 'reviews';
    if (pageId === 'admin-jobs' || pageId === 'plans-edit') pageId = 'admin';
    if (pageId === 'provider-jobs' || pageId === 'plans') pageId = 'provider-dashboard';

    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
    
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.style.animation = 'fadeIn 0.6s ease-out forwards';
    } else {
        console.warn(`Page page-${pageId} not found!`);
        const home = document.getElementById('page-home');
        home.classList.remove('hidden');
        home.style.animation = 'fadeIn 0.6s ease-out forwards';
    }

    // Update active state in sidebar
    const sidebarButtons = document.querySelectorAll('.sidebar-links button');
    sidebarButtons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${pageId}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (pageId === 'admin' && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer'))) {
        alert('Access Denied. Admins/Developers Only.');
        navigate('home');
        return;
    }

    if (pageId === 'admin') {
        updateAdminPanel();
        document.getElementById('admin-home-title').value = homeData.title;
        document.getElementById('admin-home-sub').value = homeData.sub;
    }

    if (pageId === 'provider-dashboard') {
        updateProviderDashboard();
    }

    if (pageId === 'gallery') {
        renderGallery();
    }
}


// Job Flow Handling
window.updateTowns = function() {
    // This could be used for dynamic town lists if needed
    filterProviders();
};

function filterProviders() {
    const dist = document.getElementById('req-district').value;
    const serv = document.getElementById('req-service').value;

    const resultsDiv = document.getElementById('provider-results');
    const list = document.getElementById('provider-list');
    list.innerHTML = '';

    if (!serv) {
        resultsDiv.classList.add('hidden');
        return;
    }

    const matched = users.filter(u => {
        const isProvider = u.role === 'provider' && u.status === 'approved';
        const hasService = u.providerService === serv;
        const matchesDistrict = dist ? u.district === dist : true;
        return isProvider && hasService && matchesDistrict;
    });

    if (matched.length > 0) {
        matched.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding:1rem 0;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <img src="${p.logo || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">
                        <div>
                            <span style="font-weight:600; font-size:1.1rem;">${p.shopName || p.name}</span><br>
                            <small style="color:var(--text-muted);"><i class="fas fa-map-marker-alt"></i> ${p.district}</small><br>
                            <small style="color:#fbbf24;">${'★'.repeat(p.rating || 5)}<span style="color:var(--text-dim)">${'★'.repeat(5-(p.rating || 5))}</span></small>
                        </div>
                    </div>
                    <button type="button" onclick="selectProvider('${p.id}', '${p.shopName || p.name}')" class="btn-outline" style="padding:8px 16px; font-size:0.9rem;">Select Provider</button>
                </div>
            `;
            list.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = "No verified providers available in this area yet. Our Admin will assign one manually.";
        li.style.color = '#666';
        list.appendChild(li);
    }

    resultsDiv.classList.remove('hidden');
}

window.selectProvider = function (id, name) {
    document.getElementById('selected-provider-id').value = id;
    alert(`Provider ${name} selected!`);
};

function handleServiceRequest(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('Please login to continue.');
        showAuthOverlay();
        return;
    }

    const custName = document.getElementById('req-customer-name').value;
    const district = document.getElementById('req-district').value;
    const town = document.getElementById('req-town').value;
    const village = document.getElementById('req-village').value;
    const service = document.getElementById('req-service').value;
    const desc = document.getElementById('req-desc').value;
    const providerId = document.getElementById('selected-provider-id').value;

    const reqId = "NAV-" + Math.floor(1000 + Math.random() * 9000); // Requested format
    
    let providerName = null;
    let providerPhone = null;
    if (providerId) {
        const p = users.find(u => u.id == providerId);
        if (p) {
            providerName = p.shopName || p.name;
            providerPhone = p.phone;
        }
    }

    const reqData = {
        id: reqId,
        userId: currentUser.id,
        customerName: custName,
        customerPhone: currentUser.phone,
        district,
        town,
        village,
        service,
        desc,
        status: 'pending_admin',
        providerId: providerId || null,
        providerName: providerName || null,
        providerPhone: providerPhone || null,
        timestamp: Date.now()
    };

    db.ref('requests/' + reqId).set(reqData);

    // Automation: Send WhatsApp Link (Opens browser/app)
    // "automatic WhatsApp message generate wala sent wenna hadanna" -> We route via Admin
    const waMsg = `*NEW SERVICE REQUEST*\nID: ${reqId}\nCustomer: ${custName}\nLocation: ${town}, ${village}, ${district}\nService: ${service}\nIssue: ${desc}\nProvider: ${providerName || 'Manual Assignment Needed'}`;
    const waUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(waMsg)}`;
    
    alert(`Request ${reqId} submitted! Your tracking number is ${reqId}.`);
    window.open(waUrl, '_blank');
    navigate('home');
    e.target.reset();
}

// Provider Logic
function updateProviderDashboard() {
    if (!currentUser || currentUser.role !== 'provider') return;

    // Display Profile & Bank Info
    const profileDiv = document.getElementById('provider-profile-display');
    profileDiv.innerHTML = `
        <div style="padding:15px; border:1px solid var(--border); border-radius:var(--radius-sm); background:rgba(255,255,255,0.02);">
            <h3 style="color:var(--primary); margin-bottom:10px;">Professional CV Profile</h3>
            <p><strong>Name:</strong> ${currentUser.name}</p>
            <p><strong>Location:</strong> ${currentUser.district || currentUser.city || 'N/A'}, ${currentUser.country || 'N/A'}</p>
            <p><strong>Experience:</strong> ${currentUser.experience || 'Not specified'}</p>
            <p><strong>Skills:</strong> ${currentUser.skills || 'Not specified'}</p>
            <p><strong>Bio:</strong> <span style="color:var(--text-muted);">${currentUser.bio || 'Not specified'}</span></p>
            <hr style="border:0; border-top:1px solid var(--border); margin: 10px 0;">
            <p><strong>Shop:</strong> ${currentUser.shopName || 'Not Set'}</p>
            <p><strong>Bank:</strong> ${currentUser.bankName || 'N/A'} - ${currentUser.accNumber || 'N/A'}</p>
            <p><strong>Plan Status:</strong> <span style="color:#10b981; font-weight:bold;">${currentUser.planStatus || 'Free Trial'}</span></p>
        </div>
    `;

    // Manage Employees
    const empList = document.getElementById('employee-list');
    empList.innerHTML = '';
    const myEmps = currentUser.employees ? Object.values(currentUser.employees) : [];
    if (myEmps.length === 0) empList.innerHTML = 'No employees added.';
    myEmps.forEach(emp => {
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = `${emp.name} <button onclick="deleteEmployee('${emp.id}')" style="color:red; float:right; border:none; background:none; cursor:pointer;">✖</button>`;
        empList.appendChild(div);
    });

    // Received Jobs
    const jobsList = document.getElementById('provider-jobs-list');
    jobsList.innerHTML = '';
    const myJobs = requests.filter(r => r.providerId == currentUser.id && r.status !== 'pending_admin');
    if (myJobs.length === 0) jobsList.innerHTML = 'No jobs received.';
    myJobs.forEach(job => {
        const div = document.createElement('div');
        div.className = 'card mt-2';
        div.innerHTML = `
            <h3>${job.service} (${job.id})</h3>
            <p><strong>Customer:</strong> ${job.customerName}</p>
            <p><strong>Town/Village:</strong> ${job.town}, ${job.village}</p>
            <p><strong>Status:</strong> ${job.status}</p>
            ${job.status !== 'completed' ? `
                <button onclick="markJobStatus('${job.id}', 'accepted')" class="btn-outline">Accept</button>
                <button onclick="showJobCompletionModal('${job.id}')" class="btn-primary">Complete</button>
            ` : ''}
        `;
        jobsList.appendChild(div);
    });
}

window.handleAddEmployee = function(e) {
    e.preventDefault();
    const name = document.getElementById('new-employee-name').value;
    const id = Date.now();
    db.ref(`users/${currentUser.id}/employees/${id}`).set({ id, name });
    document.getElementById('new-employee-name').value = '';
    alert('Employee added!');
};

window.deleteEmployee = function(id) {
    if (confirm('Delete employee?')) {
        db.ref(`users/${currentUser.id}/employees/${id}`).remove();
    }
};

window.handleSaveMiniSite = function(e) {
    e.preventDefault();
    const updates = {
        shopName: document.getElementById('mini-shop-name').value,
        logo: document.getElementById('mini-logo-url').value,
        shopAbout: document.getElementById('mini-about').value
    };
    db.ref(`users/${currentUser.id}`).update(updates);
    alert('Mini site updated!');
};

window.markJobStatus = function(rid, status) {
    db.ref(`requests/${rid}`).update({ status });
    alert(`Job ${status}!`);
};

window.showJobCompletionModal = function(rid) {
    const img = prompt("Upload Completion Photo (URL):");
    const payMode = prompt("Payment Mode (Cash / Card / Bank Advance):");
    let advAmount = "";
    if (payMode && payMode.toLowerCase() === 'bank advance') {
        advAmount = prompt("Enter Advance Amount:");
    }

    if (img && payMode) {
        db.ref(`requests/${rid}`).update({ 
            status: 'completed', 
            completionImage: img,
            paymentMode: payMode,
            advance: advAmount
        });

        // If Bank selected, send WhatsApp to customer (Via Admin)
        if (payMode.toLowerCase().includes('bank')) {
            const msg = `*BANK PAYMENT DETAILS*\nJob: ${rid}\nProvider: ${currentUser.shopName}\nBank: ${currentUser.bankName}\nACC: ${currentUser.accNumber}\nBrach: ${currentUser.bankBranch}\nAmount: ${advAmount || 'Full'}`;
            const waUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
        }
        alert('Job marked as completed!');
    }
};

// Customer Tracking
window.trackJob = function() {
    const tid = document.getElementById('track-number-input').value;
    const resDiv = document.getElementById('tracking-result');
    const job = requests.find(r => r.id === tid);
    if (job) {
        resDiv.innerHTML = `
            <div class="card" style="background:var(--bg-alt);">
                <h4>Status: <span style="color:var(--primary);">${job.status.toUpperCase()}</span></h4>
                <p><strong>Service:</strong> ${job.service}</p>
                <p><strong>Provider:</strong> ${job.providerName || 'Assigning...'}</p>
                ${job.completionImage ? `<a href="${job.completionImage}" target="_blank">View Completed Proof</a>` : ''}
            </div>
        `;
    } else {
        resDiv.innerHTML = '<p style="color:red;">Invalid Tracking Number.</p>';
    }
};

// Plans logic
const DEFAULT_PLANS = [
    { name: "Free Trial", duration: "2.5 Weeks", price: 0 },
    { name: "Weekly", duration: "1 Week", price: 250 },
    { name: "Monthly", duration: "1 Month", price: 1000 },
    { name: "Annual", duration: "1 Year", price: 12000 }
];

// Final Init
db.ref('homeData').on('value', (snapshot) => {
    if (snapshot.val()) {
        homeData = snapshot.val();
        const t = document.getElementById('home-title-display');
        const s = document.getElementById('home-sub-display');
        if (t) t.innerHTML = homeData.title;
        if (s) s.innerHTML = homeData.sub;
    }
});

db.ref('storeItems').on('value', snap => {
    storeItems = snap.val() ? Object.values(snap.val()) : [];
    renderStoreItems();
});

db.ref('gallery').on('value', snap => {
    galleryItems = snap.val() ? Object.values(snap.val()) : [];
    renderGallery();
});

// AI Bot Logic
window.toggleChat = function () {
    const win = document.getElementById('ai-chat-window');
    win.classList.toggle('hidden');
};

window.sendMessage = function () {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage(msg, 'user-msg');
    input.value = '';

    setTimeout(() => {
        const lowerMsg = msg.toLowerCase();
        let reply = "I'm sorry, I don't understand. Can you rephrase? I can help with CCTV, Solar, Plumbing, and PC repairs.";

        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) reply = "Hello! Welcome to Navithya. How can I help you with our services today?";
        if (lowerMsg.includes('service') || lowerMsg.includes('offer')) reply = "We offer CCTV Installation, House Wiring, Networking, Solar Panels, Plumbing, and PC/Software repairs.";
        if (lowerMsg.includes('price') || lowerMsg.includes('cost')) reply = "Prices vary by service. You can check our 'Store' page for products or request a service for a custom quote.";
        if (lowerMsg.includes('contact') || lowerMsg.includes('phone')) reply = "You can contact us at 0729929453 / 0769929453 or email SNAVITHYA@GMAIL.COM.";

        appendMessage(reply, 'bot-msg');
    }, 600);
};

function appendMessage(text, className) {
    const body = document.getElementById('chat-body');
    if(!body) return;
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

// Global Features Logic
window.sendBroadcast = function() {
    const msg = document.getElementById('broadcast-msg').value;
    if (!msg) return alert("Enter a message");
    
    const id = Date.now();
    db.ref('notifications/' + id).set({
        id,
        msg,
        type: 'global',
        timestamp: id
    });
    
    alert("Global broadcast sent!");
    document.getElementById('broadcast-msg').value = '';
    navigate('home');
};

db.ref('notifications').on('value', snap => {
    const data = snap.val();
    const list = data ? Object.values(data) : [];
    renderNotifications(list);
});

function renderNotifications(notifs) {
    const listDiv = document.getElementById('notifications-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    notifs.slice().reverse().forEach(n => {
        const div = document.createElement('div');
        div.className = 'card mt-2';
        div.style.borderLeft = '4px solid var(--primary)';
        div.innerHTML = `<p>${n.msg}</p><small>${new Date(n.timestamp).toLocaleString()}</small>`;
        listDiv.appendChild(div);
    });
}

// Plan Management logic
window.showNewPlanModal = function() {
    const name = prompt("Plan Name:");
    const dur = prompt("Duration (e.g. 1 Month):");
    const price = prompt("Price (Rs.):");
    if (name && dur && price) {
        db.ref('plans/' + Date.now()).set({ name, duration: dur, price });
        alert("Plan added!");
    }
};

db.ref('plans').on('value', snap => {
    const data = snap.val();
    const plans = data ? Object.values(data) : DEFAULT_PLANS;
    renderPlans(plans);
});

function renderPlans(plans) {
    const adminList = document.getElementById('admin-plans-list');
    if (adminList) {
        adminList.innerHTML = '';
        plans.forEach(p => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `<strong>${p.name}</strong> - Rs. ${p.price} / ${p.duration} <button onclick="deletePlan('${p.name}')" style="color:red; background:none; border:none; cursor:pointer; margin-left:10px;">🗑️</button>`;
            adminList.appendChild(div);
        });
    }
}

window.deletePlan = function(name) {
    if (confirm(`Delete plan "${name}"?`)) {
        db.ref('plans').once('value', snap => {
            const data = snap.val();
            for (let key in data) {
                if (data[key].name === name) {
                    db.ref('plans/' + key).remove();
                    break;
                }
            }
        });
    }
};

// Gallery Logic
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if(!grid) return;
    grid.innerHTML = '';
    galleryItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        if (item.type === 'video') {
            div.innerHTML = `<video src="${item.url}" controls></video>`;
        } else {
            div.innerHTML = `<img src="${item.url}" alt="Gallery Item">`;
        }
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) {
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => db.ref('gallery/' + item.id).remove();
            div.appendChild(delBtn);
        }
        grid.appendChild(div);
    });
}

window.trackJobDirect = function() {
    const tid = document.getElementById('track-number-direct').value;
    const resDiv = document.getElementById('tracking-result-direct');
    if(!resDiv) return;
    const job = requests.find(r => r.id === tid);
    if (job) {
        resDiv.innerHTML = `
            <div class="card" style="background:#f1f5f9; border-left: 5px solid var(--primary);">
                <h4>Status: <span style="color:var(--primary);">${job.status.toUpperCase().replace('_', ' ')}</span></h4>
                <p><strong>Service:</strong> ${job.service}</p>
                <p><strong>Provider:</strong> ${job.providerName || 'Pending Assignment'}</p>
                <p><strong>Location:</strong> ${job.town}, ${job.village}</p>
                ${job.completionImage ? `<div class="mt-2"><img src="${job.completionImage}" style="max-width:100%; border-radius:8px;"></div>` : ''}
            </div>
        `;
    } else {
        resDiv.innerHTML = '<p style="color:red; font-weight:600;">Invalid Tracking Number.</p>';
    }
};

window.setRating = function(n) {
    document.getElementById('selected-rating').value = n;
    const stars = document.querySelectorAll('.rating-stars span');
    stars.forEach((s, idx) => {
        if (idx < n) s.classList.add('active');
        else s.classList.remove('active');
    });
};

window.submitReview = function() {
    const rat = document.getElementById('selected-rating').value;
    const txt = document.getElementById('review-text').value;
    if (rat == 0) return alert("Please select a rating");
    
    const id = Date.now();
    db.ref('reviews/' + id).set({
        id,
        user: currentUser ? currentUser.name : 'Guest',
        rating: rat,
        text: txt,
        timestamp: id
    });
    
    alert("Review submitted!");
    document.getElementById('review-text').value = '';
    setRating(0);
};

db.ref('reviews').on('value', snap => {
    const data = snap.val();
    const reviews = data ? Object.values(data) : [];
    const display = document.getElementById('reviews-display');
    if (!display) return;
    display.innerHTML = '';
    reviews.slice().reverse().forEach(r => {
        const div = document.createElement('div');
        div.className = 'card mt-2';
        div.innerHTML = `<strong>${r.user}</strong><br><span style="color:#f6ad55;">${'⭐'.repeat(r.rating)}</span><p>${r.text}</p>`;
        display.appendChild(div);
    });
});

let orders = [];
db.ref('orders').on('value', snap => {
    orders = snap.val() ? Object.values(snap.val()) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});

let services = [];
db.ref('services').on('value', snap => {
    services = snap.val() ? Object.values(snap.val()) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});

// ====== MISSING ADMIN AND PROVIDER FUNCTIONS ======

window.updateAdminPanel = function() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) return;

    // Stats
    const validUsers = users.filter(u => u && u.name);
    document.getElementById('stat-users').innerText = validUsers.length;
    document.getElementById('stat-pending').innerText = validUsers.filter(u => u.status === 'pending').length;

    // User Management
    const usersList = document.getElementById('admin-users-list');
    if (usersList) {
        usersList.innerHTML = '';
        const sortedUsers = validUsers.sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0));
        sortedUsers.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.name}<br><small style="color:var(--text-muted)">${u.phone}</small></td>
                <td>${u.district || 'N/A'}<br><small>${u.country || u.province || ''}</small></td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; background: ${u.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${u.status === 'approved' ? '#10b981' : '#f59e0b'};">
                        ${u.status ? u.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                </td>
                <td>
                    <select onchange="assignRole('${u.id}', this.value)" style="margin-bottom: 5px; padding: 5px; background: rgba(255,255,255,0.1); color: var(--text); border: 1px solid var(--border);">
                        <option value="unassigned" ${u.role === 'unassigned' ? 'selected' : ''}>Unassigned</option>
                        <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
                        <option value="provider" ${u.role === 'provider' ? 'selected' : ''}>Provider</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <select onchange="assignService('${u.id}', this.value)" style="padding: 5px; background: rgba(255,255,255,0.1); color: var(--text); border: 1px solid var(--border);" ${u.role !== 'provider' ? 'disabled' : ''}>
                        <option value="">No Service</option>
                        <option value="CCTV Installation" ${u.providerService === 'CCTV Installation' ? 'selected' : ''}>CCTV</option>
                        <option value="House Wiring" ${u.providerService === 'House Wiring' ? 'selected' : ''}>Wiring</option>
                        <option value="Computer Networking" ${u.providerService === 'Computer Networking' ? 'selected' : ''}>Networking</option>
                        <option value="Hardware" ${u.providerService === 'Hardware' ? 'selected' : ''}>Hardware</option>
                        <option value="Plumbing" ${u.providerService === 'Plumbing' ? 'selected' : ''}>Plumbing</option>
                        <option value="Solar System" ${u.providerService === 'Solar System' ? 'selected' : ''}>Solar</option>
                        <option value="TV Radio Repair" ${u.providerService === 'TV Radio Repair' ? 'selected' : ''}>TV/Radio</option>
                        <option value="Software" ${u.providerService === 'Software' ? 'selected' : ''}>Software</option>
                    </select>
                </td>
                <td>
                    ${u.status !== 'approved' ? `<button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="approveUser('${u.id}')">Approve</button>` : ''}
                    <button class="btn-outline" style="padding: 5px 10px; font-size: 0.8rem; border-color: #ef4444; color: #ef4444;" onclick="rejectUser('${u.id}')">Remove</button>
                </td>
            `;
            usersList.appendChild(tr);
        });
    }

    // System Requests (Pending Admin)
    const sysReqList = document.getElementById('admin-system-requests');
    if (sysReqList) {
        sysReqList.innerHTML = '';
        const pendingReqs = requests.filter(r => r && r.status === 'pending_admin').sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (pendingReqs.length === 0) sysReqList.innerHTML = '<li style="color:var(--text-muted)">No pending requests.</li>';
        pendingReqs.forEach(req => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.style.paddingBottom = '10px';
            li.style.borderBottom = '1px solid var(--border)';
            li.innerHTML = `
                <strong>${req.id}</strong> - ${req.service} in ${req.district}<br>
                <small>Customer: ${req.customerName} (${req.customerPhone})</small><br>
                <select id="assign-provider-${req.id}" style="padding: 5px; margin-top: 5px; width: auto; display: inline-block; background: rgba(255,255,255,0.1); color: var(--text); border: 1px solid var(--border);">
                    <option value="">Select Provider to Assign</option>
                    ${users.filter(u => u.role === 'provider' && u.status === 'approved' && (!req.service || u.providerService === req.service)).map(u => `<option value="${u.id}">${u.shopName || u.name} (${u.district})</option>`).join('')}
                </select>
                <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="assignProviderToJob('${req.id}')">Assign</button>
            `;
            sysReqList.appendChild(li);
        });
    }

    // Provider Completed Jobs
    const compJobsList = document.getElementById('admin-completed-jobs');
    if (compJobsList) {
        compJobsList.innerHTML = '';
        const completedReqs = requests.filter(r => r && r.status === 'completed').sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (completedReqs.length === 0) compJobsList.innerHTML = '<li style="color:var(--text-muted)">No completed jobs yet.</li>';
        completedReqs.forEach(req => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.innerHTML = `<strong>${req.id}</strong> - ${req.service} by ${req.providerName || 'Unknown'} <a href="${req.completionImage}" target="_blank" style="color:var(--primary); font-size:0.8rem; margin-left:10px;"><i class="fas fa-image"></i> Proof</a>`;
            compJobsList.appendChild(li);
        });
    }

    // Admin Store Orders
    const ordersList = document.getElementById('admin-store-orders');
    if (ordersList) {
        ordersList.innerHTML = '';
        if (orders.length === 0) ordersList.innerHTML = '<li style="color:var(--text-muted)">No orders yet.</li>';
        orders.forEach(o => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.innerHTML = `<strong>${o.id}</strong> - ${o.itemName}<br><small>By: ${o.userName} (${o.phone})</small>`;
            ordersList.appendChild(li);
        });
    }

    // Admin Services List
    const servicesList = document.getElementById('admin-services-list');
    if (servicesList) {
        servicesList.innerHTML = '';
        services.forEach(s => {
            const li = document.createElement('li');
            li.style.marginBottom = '5px';
            li.innerHTML = `${s.name} <button onclick="db.ref('services/${s.id}').remove()" style="color:red; background:none; border:none; cursor:pointer; float:right;">✖</button>`;
            servicesList.appendChild(li);
        });
    }
};

window.approveUser = function(uid) {
    db.ref(`users/${uid}`).update({ status: 'approved', planStatus: 'Free Trial' });
    alert('User approved & default plan assigned!');
};

window.rejectUser = function(uid) {
    if (confirm('Remove this user?')) {
        db.ref(`users/${uid}`).remove();
    }
};

window.assignRole = function(uid, role) {
    db.ref(`users/${uid}`).update({ role });
};

window.assignService = function(uid, service) {
    db.ref(`users/${uid}`).update({ providerService: service });
};

window.assignProviderToJob = function(jobId) {
    const providerId = document.getElementById(`assign-provider-${jobId}`).value;
    if (!providerId) return alert('Select a provider first.');
    const provider = users.find(u => u.id == providerId);
    db.ref(`requests/${jobId}`).update({
        providerId,
        providerName: provider.shopName || provider.name,
        providerPhone: provider.phone,
        status: 'assigned'
    });
    // Send WhatsApp to Provider via Admin Number
    const msg = `*NEW JOB ASSIGNED*\nID: ${jobId}\nPlease check your provider dashboard on Navithya!`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
    alert('Job assigned to provider!');
};

window.updateProviderPanel = function() {
    updateProviderDashboard();
};

window.renderStoreItems = function() {
    const grid = document.querySelector('.store-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (storeItems.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); padding:3rem; text-align:center;">No items available right now.</p>';
        return;
    }
    storeItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'service-card glass'; // Reuse styling
        div.innerHTML = `
            <img src="${item.image || 'https://images.unsplash.com/photo-1550009158-9ebf6d250406?q=80&w=600&auto=format&fit=crop'}" alt="${item.name}">
            <div class="service-info">
                <h3>${item.name}</h3>
                <p>${item.desc || 'Premium quality product.'}</p>
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-bottom: 1rem;">Rs. ${item.price}</div>
                <button class="btn-primary w-100" onclick="buyStoreItem('${item.id}', '${item.name}')"><i class="fas fa-shopping-cart"></i> Buy Now</button>
            </div>
        `;
        grid.appendChild(div);
    });
};

window.buyStoreItem = function(id, name) {
    if (!currentUser) {
        alert("Please login to purchase items.");
        showAuthOverlay();
        return;
    }
    const reqId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    db.ref(`orders/${reqId}`).set({
        id: reqId,
        itemId: id,
        itemName: name,
        userId: currentUser.id,
        userName: currentUser.name,
        phone: currentUser.phone,
        timestamp: Date.now(),
        status: 'pending'
    });
    alert(`Order placed successfully! Order ID: ${reqId}`);
};

window.handleAddService = function(e) {
    e.preventDefault();
    const name = document.getElementById('new-service-name').value;
    const id = Date.now();
    db.ref(`services/${id}`).set({ id, name });
    document.getElementById('new-service-name').value = '';
    alert('Service added!');
};

window.adminUpdateHomeInfo = function(e) {
    e.preventDefault();
    const title = document.getElementById('admin-home-title').value;
    const sub = document.getElementById('admin-home-sub').value;
    db.ref('homeData').set({ title, sub });
    alert('Home info updated!');
};

window.adminAddStoreItem = function(e) {
    e.preventDefault();
    const name = document.getElementById('admin-store-name').value;
    const price = document.getElementById('admin-store-price').value;
    const desc = document.getElementById('admin-store-desc').value;
    const id = Date.now();
    db.ref(`storeItems/${id}`).set({ id, name, price, desc, image: 'https://images.unsplash.com/photo-1550009158-9ebf6d250406?q=80&w=600&auto=format&fit=crop' });
    e.target.reset();
    alert('Store item added!');
};

window.handleGalleryUpload = function(e) {
    e.preventDefault();
    const url = document.getElementById('gallery-url').value;
    const type = document.getElementById('gallery-type').value;
    const id = Date.now();
    db.ref(`gallery/${id}`).set({ id, url, type, timestamp: id });
    e.target.reset();
    alert('Uploaded to gallery!');
};

window.showProfileEdit = function() {
    if (!currentUser) return;
    let modal = document.getElementById('profile-modal');
    if (!modal) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'profile-modal';
        modalDiv.className = 'auth-overlay';
        modalDiv.innerHTML = `
            <div class="auth-box">
                <button class="close-auth" type="button" onclick="document.getElementById('profile-modal').classList.add('hidden')">&times;</button>
                <h2>Edit Profile</h2>
                <form onsubmit="handleProfileUpdate(event)" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="prof-name" value="${currentUser.name || ''}" required>
                    </div>
                    ${currentUser.role === 'provider' ? `
                    <div class="form-group">
                        <label>Bank Name</label>
                        <input type="text" id="prof-bank" value="${currentUser.bankName || ''}">
                    </div>
                    <div class="form-group">
                        <label>Account Number</label>
                        <input type="text" id="prof-acc" value="${currentUser.accNumber || ''}">
                    </div>
                    <div class="form-group">
                        <label>Branch</label>
                        <input type="text" id="prof-branch" value="${currentUser.bankBranch || ''}">
                    </div>
                    ` : ''}
                    <button type="submit" class="btn-primary w-100 mt-4">Save Profile</button>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
        modal = modalDiv;
    }
    modal.classList.remove('hidden');
};

window.handleProfileUpdate = function(e) {
    e.preventDefault();
    const updates = {
        name: document.getElementById('prof-name').value,
    };
    if (currentUser.role === 'provider') {
        updates.bankName = document.getElementById('prof-bank') ? document.getElementById('prof-bank').value : '';
        updates.accNumber = document.getElementById('prof-acc') ? document.getElementById('prof-acc').value : '';
        updates.bankBranch = document.getElementById('prof-branch') ? document.getElementById('prof-branch').value : '';
    }
    db.ref(`users/${currentUser.id}`).update(updates);
    alert('Profile updated successfully!');
    document.getElementById('profile-modal').classList.add('hidden');
    currentUser = { ...currentUser, ...updates };
    localStorage.setItem('navithya_session', JSON.stringify(currentUser));
    if (currentUser.role === 'provider') updateProviderDashboard();
};

navigate('home');
restoreSession();


