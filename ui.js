// ================= DASTLABKI YUKLANISH =================
window.onload = async () => {
    document.getElementById('greeting').innerText = `Salom, ${user ? user.first_name : 'Xodim'}!`;
    try {
        const res  = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'init', telegramId }) });
        const data = await res.json();

        if (data.success) {
            myFullRecords     = data.data || [];
            myFilteredRecords = [...myFullRecords]; // ← avvaliga HAMMASI

            initMyFilters();

            // ---- Rollarni aniqlash ----
            if      (data.isBoss || data.isSuperAdmin) myRole = 'SuperAdmin';
            else if (data.isAdmin)                     myRole = 'Admin';
            else if (data.isDirector || data.isDirektor) myRole = 'Direktor';
            else                                       myRole = 'User';

            // ---- Ruhsatlarni aniqlash ----
            if (myRole === 'SuperAdmin') {
                myPermissions = { canViewAll:true, canEdit:true, canDelete:true, canExport:true, canViewDashboard:true };
            } else if (myRole === 'Direktor') {
                myPermissions = { canViewAll:true, canEdit:false, canDelete:false, canExport:true, canViewDashboard:true };
            } else if (myRole === 'Admin') {
                // Admin ruhsatlari backend dan keladi
                myPermissions = {
                    canViewAll:       data.permissions?.canViewAll       ?? false,
                    canEdit:          data.permissions?.canEdit          ?? false,
                    canDelete:        data.permissions?.canDelete        ?? false,
                    canExport:        data.permissions?.canExport        ?? false,
                    canViewDashboard: data.permissions?.canViewDashboard ?? false,
                };
            } else {
                myPermissions = { canViewAll:false, canEdit:false, canDelete:false, canExport:false, canViewDashboard:false };
            }

            // ---- Navigatsiya ko'rinishi ----
            // Admin panel — SuperAdmin, Direktor, va ruxsatli Adminlar
            const showAdmin = myRole === 'SuperAdmin' || myRole === 'Direktor' ||
                              (myRole === 'Admin' && myPermissions.canViewAll);
            if (showAdmin) document.getElementById('nav-admin').classList.remove('hidden');

            // Boss sub-tabs (Rollar boshqaruvi) — faqat SuperAdmin
            if (myRole === 'SuperAdmin') document.getElementById('bossNav').classList.remove('hidden');
        }
    } catch (e) {
        console.error('Init xato:', e);
    }
};

// ---- Tab almashtirish ----
function switchTab(tabId, navId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (navId !== 'nav-add') {
        const el = document.getElementById(navId);
        if (el) el.classList.add('active');
    }
    if (tabId === 'adminTab')     loadAdminData();
    if (tabId === 'dashboardTab') loadDashboard();
}

function switchAdminSub(areaId, btn) {
    document.getElementById('adminDataArea').classList.add('hidden');
    document.getElementById('adminRolesArea').classList.add('hidden');
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(areaId).classList.remove('hidden');
    btn.classList.add('active');
}

function toggleRate() {
    const isUsd = document.getElementById('currency').value === 'USD';
    document.getElementById('rateDiv').classList.toggle('hidden', !isUsd);
}