// ================= 7. ROL BOSHQARUVI =================

async function loadAdmins() {
    document.getElementById('rolesList').innerHTML = `
        <div class="skeleton skeleton-item"></div>
        <div class="skeleton skeleton-item"></div>`;
    try {
        const res  = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "get_admins", telegramId }) });
        const data = await res.json();
        if (data.success) {
            let html = '';
            data.data.forEach(r => {
                const badgeClass = r.role === 'Boss' ? 'boss' : r.role === 'Direktor' ? 'direktor' : 'admin';
                html += `
                <div class="role-item">
                    <div class="role-item-left">
                        <span class="role-item-name">${r.name}</span>
                        <span class="role-item-id">ID: ${r.tgId}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="role-badge ${badgeClass}">${r.role}</span>
                        <button class="del-icon-btn" onclick="delAdmin(${r.rowId})">🗑</button>
                    </div>
                </div>`;
            });
            document.getElementById('rolesList').innerHTML =
                html || `<div class="empty-state"><div class="empty-icon">👥</div><p>Hali rol belgilanmagan</p></div>`;
        }
    } catch {
        document.getElementById('rolesList').innerHTML =
            `<div class="empty-state"><p style="color:var(--red);">❌ Yuklanmadi</p></div>`;
    }
}

async function addAdmin() {
    const st      = document.getElementById('adminStatus');
    const newTgId = document.getElementById('newAdminId').value.trim();
    const newName = document.getElementById('newAdminName').value.trim() || "Yangi Xodim";
    const newRole = document.getElementById('newAdminRole').value;

    if (!newTgId) {
        st.style.color = "var(--red)";
        st.innerText   = "❗ Telegram ID kiritilishi shart!";
        return;
    }

    st.style.color = "var(--text-muted)";
    st.innerText   = "⏳ Qo'shilmoqda...";

    try {
        const res  = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "add_admin", telegramId, newTgId, newName, newRole }) });
        const data = await res.json();
        if (data.success) {
            st.style.color = "var(--green-dark)";
            st.innerText   = "✅ Muvaffaqiyatli qo'shildi!";
            document.getElementById('newAdminId').value   = '';
            document.getElementById('newAdminName').value = '';
            loadAdmins();
        } else {
            st.style.color = "var(--red)";
            st.innerText   = "❌ " + (data.error || "Xato yuz berdi");
        }
    } catch {
        st.style.color = "var(--red)";
        st.innerText   = "❌ Server bilan bog'lanib bo'lmadi";
    }
}

async function delAdmin(rowId) {
    if (!confirm("Bu rolni o'chirishga ishonchingiz komilmi?")) return;
    try {
        const res  = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "del_admin", telegramId, rowId }) });
        const data = await res.json();
        if (data.success) loadAdmins();
        else alert("❌ " + (data.error || "O'chirishda xato"));
    } catch {
        alert("❌ Server bilan bog'lanib bo'lmadi");
    }
}