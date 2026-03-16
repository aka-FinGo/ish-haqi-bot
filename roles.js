// 7. Rol Boshqaruvi
async function loadAdmins() {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "get_admins", telegramId }) });
    const data = await res.json();
    if (data.success) {
        let html = '';
        data.data.forEach(r => {
            html += `<div>${r.name} (${r.role}) <button onclick="delAdmin(${r.rowId})">🗑</button></div>`;
        });
        document.getElementById('rolesList').innerHTML = html;
    }
}

async function addAdmin() {
    const payload = {
        action: "add_admin", telegramId,
        newTgId: document.getElementById('newAdminId').value,
        newName: document.getElementById('newAdminName').value,
        newRole: document.getElementById('newAdminRole').value
    };
    await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
    loadAdmins();
}
