const API_URL = "https://script.google.com/macros/s/AKfycbyELe4JB8a4NpmaZr2wlonnOwu9gDIkumw3JEu2VuMyl--pwImUrcvkG4e5H1GnONk9Pw/exec"; 

const tg = window.Telegram.WebApp;
tg.expand();
const user = tg.initDataUnsafe?.user;
const employeeName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : "Test User";
const telegramId = user ? String(user.id) : "123456789";

let globalAdminData = []; 
let filteredData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10; // Bitta sahifada 10 ta ma'lumot (qotib qolmasligi uchun)

// 1. Dastlabki yuklanish
window.onload = async () => {
    document.getElementById('greeting').innerText = `Salom, ${user ? user.first_name : 'Xodim'}!`;
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "init", telegramId }) });
        const data = await res.json();
        if (data.success) {
            renderMyHistory(data.data);
            if (data.isAdmin) document.getElementById('nav-admin').classList.remove('hidden');
            if (data.isBoss) document.getElementById('bossNav').classList.remove('hidden');
        }
    } catch (e) { console.error("Xato:", e); }
};

// 2. Oynalarni almashtirish
function switchTab(tabId, navId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if(navId !== 'nav-add') document.getElementById(navId).classList.add('active');
    if (tabId === 'adminTab') loadAdminData();
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

// 3. Mening Hisobotim
function renderMyHistory(records) {
    let tUZS = 0, tUSD = 0, html = '';
    records.reverse().forEach(r => {
        tUZS += Number(r.amountUZS) || 0; tUSD += Number(r.amountUSD) || 0;
        html += `<div class="history-item">
            <div><div style="font-size:11px; color:#888;">📅 ${r.date}</div><div style="font-weight:600;">${r.comment}</div></div>
            <div style="text-align:right;">
                ${r.amountUZS > 0 ? `<div style="color:#2e7d32; font-weight:bold;">${r.amountUZS.toLocaleString()} UZS</div>` : ''}
                ${r.amountUSD > 0 ? `<div style="color:#e65100; font-weight:bold;">$${r.amountUSD.toLocaleString()}</div>` : ''}
            </div>
        </div>`;
    });
    document.getElementById('myUzs').innerText = tUZS.toLocaleString(); 
    document.getElementById('myUsd').innerText = '$' + tUSD.toLocaleString();
    document.getElementById('myHistory').innerHTML = html || "<p class='text-center text-gray'>Ma'lumot yo'q</p>";
}

// 4. Ma'lumot qo'shish
document.getElementById('financeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn'); 
    let amount = parseFloat(document.getElementById('amount').value); 
    let currency = document.getElementById('currency').value;
    let rate = parseFloat(document.getElementById('rate').value) || 0; 
    let comment = document.getElementById('comment').value || "Izoh yo'q";
    
    let amountUZS = currency === 'USD' ? amount * rate : amount; 
    let amountUSD = currency === 'USD' ? amount : 0;
    if (currency === 'USD' && rate < 5000) return alert("Kurs xato!");

    const date = new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

    btn.disabled = true; btn.innerText = "Yuborilmoqda...";
    try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "add", employeeName, telegramId, amountUZS, amountUSD, rate, comment, date }) });
        btn.innerText = "✅ Saqlandi!"; setTimeout(() => window.location.reload(), 1000);
    } catch (err) { btn.disabled = false; btn.innerText = "Saqlash"; }
});

// 5. ADMIN QISMI (DEBOUNCE va PAGINATSIYA bilan)
async function loadAdminData() {
    document.getElementById('adminList').innerHTML = "<p class='text-center'>Yuklanmoqda... ⏳</p>";
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "admin_get_all", telegramId }) });
        const data = await res.json();
        if (data.success) { 
            globalAdminData = data.data; 
            filteredData = [...globalAdminData];
            currentPage = 1;
            calculateTotal();
            renderAdminPage(); 
        }
    } catch(e) {}
}

// Qotib qolmasligi uchun DEBOUNCE (Foydalanuvchi yozishdan to'xtagach 300ms kutib keyin izlaydi)
let debounceTimer;
function debounceSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const query = document.getElementById('searchInput').value.toLowerCase();
        filteredData = globalAdminData.filter(item => 
            (item.name && item.name.toLowerCase().includes(query)) || 
            (item.comment && item.comment.toLowerCase().includes(query)) ||
            (item.date && item.date.includes(query))
        );
        currentPage = 1;
        calculateTotal();
        renderAdminPage();
    }, 300);
}

function calculateTotal() {
    // Umumiy summani faqat UZS da hisoblash (Dollar bo'lsa UZS ga konvert qilingan summasini qo'shadi)
    let totalUZS = 0;
    filteredData.forEach(r => { totalUZS += Number(r.amountUZS) || 0; });
    document.getElementById('totalCompanyUzs').innerText = totalUZS.toLocaleString() + " UZS";
}

// Sahifalarga bo'lib chizish (Paginatsiya)
function renderAdminPage() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, end);
    
    let html = '';
    pageData.forEach(r => {
        const isUsd = r.amountUSD > 0;
        const rateText = isUsd ? `<span style="font-size:10px; color:#888;">(Kurs: ${r.rate})</span>` : '';
        html += `<div class="history-item" style="flex-direction: column; align-items: stretch;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:5px;">
                <strong>👤 ${r.name}</strong><span style="font-size:11px; color:#888;">📅 ${r.date}</span>
            </div>
            <div style="margin:8px 0;">📝 ${r.comment}</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:bold;">
                    ${r.amountUZS > 0 ? `<div style="color:#2e7d32;">${r.amountUZS.toLocaleString()} UZS</div>` : ''}
                    ${isUsd ? `<div style="color:#e65100;">$${r.amountUSD.toLocaleString()} ${rateText}</div>` : ''}
                </div>
                <div class="action-btns">
                    <button class="edit-btn" onclick="openEdit(${r.rowId}, ${r.amountUZS}, ${r.amountUSD}, ${r.rate||0}, '${r.comment}')">✏️</button>
                    <button class="del-btn" onclick="deleteRecord(${r.rowId})">🗑</button>
                </div>
            </div>
        </div>`;
    });
    document.getElementById('adminList').innerHTML = html;
    renderPaginationControls();
}

function renderPaginationControls() {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    let html = '';
    for(let i=1; i<=totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    document.getElementById('pagination').innerHTML = html;
}

function goToPage(page) { currentPage = page; renderAdminPage(); }

// 6. CSV ga Eksport qilish (Yuklab olish)
function exportToCSV() {
    let csv = "Sana,Ism,Izoh,UZS Summa,USD Summa,Kurs\n";
    filteredData.forEach(r => {
        csv += `"${r.date}","${r.name}","${r.comment}",${r.amountUZS || 0},${r.amountUSD || 0},${r.rate || 0}\n`;
    });
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Hisobot_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// 7. Tahrirlash va O'chirish
function openEdit(rowId, uzs, usd, rate, comment) {
    document.getElementById('editRowId').value = rowId;
    document.getElementById('editAmountUZS').value = uzs || 0;
    document.getElementById('editAmountUSD').value = usd || 0;
    document.getElementById('editRate').value = rate || 0;
    document.getElementById('editComment').value = comment !== 'undefined' ? comment : '';
    document.getElementById('editModal').classList.remove('hidden');
}

function closeModal() { document.getElementById('editModal').classList.add('hidden'); }

async function saveEdit() {
    const rowId = document.getElementById('editRowId').value;
    const amountUZS = document.getElementById('editAmountUZS').value;
    const amountUSD = document.getElementById('editAmountUSD').value;
    const rate = document.getElementById('editRate').value;
    const comment = document.getElementById('editComment').value;
    
    closeModal();
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "admin_edit", telegramId, rowId, amountUZS, amountUSD, rate, comment }) });
    loadAdminData();
}

async function deleteRecord(rowId) {
    if(!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "admin_delete", telegramId, rowId }) });
    loadAdminData();
}
