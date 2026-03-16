// ================= 4. ADMIN FUNKSIYALARI =================

async function loadAdminData() {
    document.getElementById('adminList').innerHTML = "<p class='text-center'>Yuklanmoqda... ⏳</p>";
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "admin_get_all", telegramId })
        });
        const data = await res.json();
        if (data.success) {
            globalAdminData = data.data;
            filteredData = [...globalAdminData];
            currentPage = 1;
            // FIX: to'g'ri funksiya nomi
            populateFilters();
            calculateTotal();
            renderAdminPage();
        }
    } catch (e) {
        console.error("Admin ma'lumotlari yuklanmadi:", e);
        document.getElementById('adminList').innerHTML = "<p class='text-center' style='color:red;'>❌ Ma'lumot yuklanmadi</p>";
    }
}

// FIX: bu funksiya admin.js da yo'q edi — qo'shildi
function populateFilters() {
    const empSelect  = document.getElementById('filterEmployee');
    const yearSelect = document.getElementById('filterYear');
    let employees = new Set();
    let years     = new Set();

    globalAdminData.forEach(r => {
        if (r.name) employees.add(r.name);
        if (r.date) years.add(r.date.split('/')[2]);
    });

    empSelect.innerHTML  = '<option value="all">Barcha xodimlar</option>';
    yearSelect.innerHTML = '<option value="all">Yillar</option>';

    Array.from(employees).sort().forEach(emp =>
        empSelect.innerHTML += `<option value="${emp}">${emp}</option>`
    );
    Array.from(years).sort((a, b) => b - a).forEach(y =>
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`
    );
}

// FIX: bu funksiya admin.js da yo'q edi — qo'shildi
let debounceTimer;
function applyFilters() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const emp   = document.getElementById('filterEmployee').value;
        const month = document.getElementById('filterMonth').value;
        const year  = document.getElementById('filterYear').value;

        filteredData = globalAdminData.filter(item => {
            const matchesText = (item.name    && item.name.toLowerCase().includes(query)) ||
                                (item.comment && item.comment.toLowerCase().includes(query));
            const matchesEmp  = emp === 'all' || item.name === emp;

            let matchesMonth = true;
            let matchesYear  = true;
            if (item.date) {
                const parts = item.date.split('/');
                if (month !== 'all') matchesMonth = parts[1] === month;
                if (year  !== 'all') matchesYear  = parts[2] === year;
            }
            return matchesText && matchesEmp && matchesMonth && matchesYear;
        });

        currentPage = 1;
        calculateTotal();
        renderAdminPage();
    }, 300);
}

// FIX: calculateAdminTotal → calculateTotal (umumiy nom), filteredCount ham yangilanadi
function calculateTotal() {
    let totalBudget = 0;
    filteredData.forEach(r => { totalBudget += Number(r.amountUZS) || 0; });

    const budgetEl = document.getElementById('totalCompanyUzs');
    if (budgetEl) budgetEl.innerText = totalBudget.toLocaleString() + " UZS";

    const countEl = document.getElementById('filteredCount');
    if (countEl) countEl.innerText = filteredData.length;
}

function renderAdminPage() {
    const start    = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, start + ITEMS_PER_PAGE);

    let html = '';
    pageData.forEach(r => {
        const isUsd    = Number(r.amountUSD) > 0;
        const rateText = isUsd && r.rate
            ? `<span style="font-size:10px;color:#888;">(Kurs: ${r.rate})</span>`
            : '';

        let actionBtns = '';
        if (myRole === 'Boss' || myRole === 'Admin') {
            // comment va name ichida apostrof bo'lsa crash bermasligi uchun encodeURIComponent ishlatilmaydi,
            // lekin xavfsizroq qilib JSON.stringify orqali uzatamiz
            const safeComment = (r.comment || '').replace(/'/g, "\\'");
            const safeName    = (r.name    || '').replace(/'/g, "\\'");
            const safeDate    = (r.date    || '').replace(/'/g, "\\'");
            actionBtns = `
            <div class="action-btns" style="margin-top:8px;">
                <button class="edit-btn" onclick="openEdit(${r.rowId}, ${r.amountUZS}, ${r.amountUSD}, ${r.rate}, '${safeComment}', '${safeName}', '${safeDate}')">✏️ Tahrirlash</button>
                <button class="del-btn"  onclick="deleteRecord(${r.rowId})">🗑 O'chirish</button>
            </div>`;
        }

        html += `
        <div class="history-item" style="flex-direction:column;align-items:stretch;">
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding-bottom:5px;">
                <strong>👤 ${r.name}</strong>
                <span style="font-size:11px;color:#888;">📅 ${r.date}</span>
            </div>
            <div style="margin:8px 0;color:#444;">📝 ${r.comment}</div>
            <div style="font-weight:bold;font-size:15px;">
                ${Number(r.amountUZS) > 0 ? `<div style="color:#2e7d32;">${Number(r.amountUZS).toLocaleString()} UZS</div>` : ''}
                ${isUsd ? `<div style="color:#e65100;">$${Number(r.amountUSD).toLocaleString()} ${rateText}</div>` : ''}
            </div>
            ${actionBtns}
        </div>`;
    });

    document.getElementById('adminList').innerHTML =
        html || "<p class='text-center' style='color:#888;'>Ma'lumot topilmadi</p>";

    renderPaginationControls();
}

function renderPaginationControls() {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    let html = '';
    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
    }
    document.getElementById('pagination').innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderAdminPage();
    document.getElementById('adminDataArea').scrollIntoView({ behavior: 'smooth' });
}