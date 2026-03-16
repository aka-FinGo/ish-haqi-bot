// 3. Xodim Funksiyalari
function initMyFilters() {
    const yearSelect = document.getElementById('myFilterYear');
    let years = new Set();
    myFullRecords.forEach(r => { if(r.date) years.add(r.date.split('/')[2]); });
    yearSelect.innerHTML = '<option value="all">Yillar</option>';
    Array.from(years).sort((a,b)=>b-a).forEach(y => yearSelect.innerHTML += `<option value="${y}">${y}</option>`);
    applyMyFilters();
}

function applyMyFilters() {
    const month = document.getElementById('myFilterMonth').value;
    const year = document.getElementById('myFilterYear').value;
    myFilteredRecords = myFullRecords.filter(r => {
        let m = true, y = true;
        if (r.date) {
            const p = r.date.split('/');
            if (month !== 'all') m = p[1] === month;
            if (year !== 'all') y = p[2] === year;
        }
        return m && y;
    });
    drawMyHistoryUI();
}

function drawMyHistoryUI() {
    let tUZS = 0, tUSD = 0, tTotalBudget = 0, html = '';
    [...myFilteredRecords].reverse().forEach(r => {
        const uzs = Number(r.amountUZS) || 0;
        const usd = Number(r.amountUSD) || 0;
        tTotalBudget += uzs;
        if (usd > 0) tUSD += usd; else tUZS += uzs;

        html += `<div class="history-item">
            <div style="flex:1"><strong>${r.comment}</strong><br><small>${r.date}</small></div>
            <div style="text-align:right"><strong>${uzs.toLocaleString()} UZS</strong></div>
        </div>`;
    });
    document.getElementById('myTotalBudget').innerText = tTotalBudget.toLocaleString() + " UZS";
    document.getElementById('myHistory').innerHTML = html || "<p>Hali ma'lumot yo'q</p>";
}

// Ma'lumot qo'shish formasi
document.getElementById('financeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    let amount = parseFloat(document.getElementById('amount').value);
    let currency = document.getElementById('currency').value;
    let rate = parseFloat(document.getElementById('rate').value) || 0;
    let comment = document.getElementById('comment').value || "Izoh yo'q";
    let amountUZS = currency === 'USD' ? amount * rate : amount;
    let amountUSD = currency === 'USD' ? amount : 0;

    btn.disabled = true; btn.innerText = "Yuborilmoqda...";
    const date = new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "add", employeeName, telegramId, amountUZS, amountUSD, rate, comment, date }) });
    window.location.reload();
});
