// 4. Admin Funksiyalari
async function loadAdminData() {
    document.getElementById('adminList').innerHTML = "<p>Yuklanmoqda...</p>";
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "admin_get_all", telegramId }) });
    const data = await res.json();
    if (data.success) {
        globalAdminData = data.data;
        filteredData = [...globalAdminData];
        populateAdminFilters();
        calculateAdminTotal();
        renderAdminPage();
    }
}

function calculateAdminTotal() {
    let total = 0;
    filteredData.forEach(r => total += Number(r.amountUZS) || 0);
    document.getElementById('totalCompanyUzs').innerText = total.toLocaleString() + " UZS";
}

function renderAdminPage() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, end);
    let html = '';
    pageData.forEach(r => {
        let actionBtns = (myRole === 'Boss' || myRole === 'Admin') ? `
            <button onclick="openEdit(${r.rowId}, ${r.amountUZS}, ${r.amountUSD}, ${r.rate}, '${r.comment}', '${r.name}', '${r.date}')">✏️</button>
            <button onclick="deleteRecord(${r.rowId})">🗑</button>` : '';
        html += `<div class="card"><strong>${r.name}</strong> - ${r.amountUZS.toLocaleString()} UZS ${actionBtns}</div>`;
    });
    document.getElementById('adminList').innerHTML = html;
}
