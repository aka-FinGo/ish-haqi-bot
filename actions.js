// 6. Tahrirlash va O'chirish
function openEdit(rowId, uzs, usd, rate, comment, name, date) {
    document.getElementById('editRowId').value = rowId;
    document.getElementById('editAmountUZS').value = uzs;
    document.getElementById('editAmountUSD').value = usd;
    document.getElementById('editRate').value = rate;
    document.getElementById('editComment').value = comment;
    document.getElementById('editHeaderName').innerText = "👤 " + name;
    document.getElementById('editHeaderDate').innerText = "📅 " + date;
    document.getElementById('editModal').classList.remove('hidden');
    tg.HapticFeedback.impactOccurred('medium');
}

async function saveEdit() {
    const payload = {
        action: "admin_edit", telegramId,
        rowId: document.getElementById('editRowId').value,
        amountUZS: document.getElementById('editAmountUZS').value,
        amountUSD: document.getElementById('editAmountUSD').value,
        rate: document.getElementById('editRate').value,
        comment: document.getElementById('editComment').value
    };
    await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
    window.location.reload();
}

async function deleteRecord(rowId) {
    if(!confirm("O'chirishga ishonchingiz komilmi?")) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "admin_delete", telegramId, rowId }) });
    loadAdminData();
}
