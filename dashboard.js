// ================= DASHBOARD =================
const _charts = {};
function destroyChart(id) { if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; } }

const MONTHS_UZ = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
const PALETTE   = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

function parseDate(s) {
    if (!s) return null;
    const p = s.split('/');
    if (p.length < 3) return null;
    return { m:p[1], y:p[2], key:`${p[2]}-${p[1]}`, label:`${MONTHS_UZ[parseInt(p[1])-1]} ${p[2]}` };
}

function getLastNMonths(n) {
    const r = [], now = new Date();
    for (let i = n-1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        r.push({ key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
                 label:`${MONTHS_UZ[d.getMonth()]} ${d.getFullYear()}` });
    }
    return r;
}

function sumByMonthKey(recs, months) {
    const map = {};
    months.forEach(mo => { map[mo.key] = 0; });
    recs.forEach(r => { const d = parseDate(r.date); if (d && map[d.key] !== undefined) map[d.key] += Number(r.amountUZS)||0; });
    return months.map(mo => map[mo.key]);
}

function sumByEmployee(recs) {
    const map = {};
    recs.forEach(r => { if (!r.name) return; map[r.name] = (map[r.name]||0) + (Number(r.amountUZS)||0); });
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
}

function sumByCategory(recs) {
    const map = {};
    recs.forEach(r => { const k = (r.comment||'Izohsiz').slice(0,22); map[k] = (map[k]||0) + (Number(r.amountUZS)||0); });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,6);
}

const sumUZS  = r => r.reduce((s,x) => s+(Number(x.amountUZS)||0), 0);
const sumUSD  = r => r.reduce((s,x) => s+(Number(x.amountUSD)||0), 0);
const pureUZS = r => r.filter(x => !Number(x.amountUSD)).reduce((s,x) => s+(Number(x.amountUZS)||0), 0);
const convUZS = r => r.filter(x => Number(x.amountUSD)>0).reduce((s,x) => s+(Number(x.amountUZS)||0), 0);

function avgMonthly(recs) {
    const keys = new Set(recs.map(r => { const d=parseDate(r.date); return d?d.key:null; }).filter(Boolean));
    return keys.size ? Math.round(sumUZS(recs)/keys.size) : 0;
}

function peakMonth(recs) {
    const map = {};
    recs.forEach(r => { const d=parseDate(r.date); if(d) map[d.label]=(map[d.label]||0)+(Number(r.amountUZS)||0); });
    const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]);
    return sorted.length ? sorted[0][0] : '—';
}

function fmt(v) { return v>=1e6?(v/1e6).toFixed(2)+'M':v>=1000?(v/1000).toFixed(0)+'K':v.toLocaleString(); }

// ---- Chart helpers ----
const BF = { family:"'Plus Jakarta Sans',sans-serif" };
const TC = { font:{...BF,size:11}, color:'#64748B' };
const TU = { callbacks:{ label:c=>` ${c.dataset.label||''}: ${Number(c.raw).toLocaleString()} UZS` } };

function mkDonut(id, labels, vals, colors) {
    destroyChart(id);
    const ctx = document.getElementById(id); if (!ctx) return;
    _charts[id] = new Chart(ctx, { type:'doughnut',
        data:{ labels, datasets:[{data:vals,backgroundColor:colors,borderWidth:0,hoverOffset:8}] },
        options:{ cutout:'70%', animation:{duration:900,easing:'easeOutQuart'},
            plugins:{ legend:{position:'bottom',labels:{padding:14,font:{...BF,size:11,weight:'600'},color:'#334155',boxWidth:10,borderRadius:3,useBorderRadius:true}},
                tooltip:{callbacks:{label:c=>` ${c.label}: ${Number(c.raw).toLocaleString()} UZS`}} } } });
}

function mkBar(id, labels, datasets, stacked=false) {
    destroyChart(id);
    const ctx = document.getElementById(id); if (!ctx) return;
    const tickCb = v => v>=1e6?(v/1e6).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':v;
    _charts[id] = new Chart(ctx, { type:'bar', data:{labels,datasets},
        options:{ responsive:true, maintainAspectRatio:false, animation:{duration:800,easing:'easeOutQuart'},
            scales:{ x:{stacked,grid:{display:false},ticks:TC}, y:{stacked,grid:{color:'#F1F5F9'},ticks:{...TC,callback:tickCb}} },
            plugins:{ legend:{display:datasets.length>1,labels:{font:{...BF,size:11},color:'#334155',boxWidth:10,borderRadius:3,useBorderRadius:true}}, tooltip:TU } } });
}

function mkHBar(id, labels, vals, colors) {
    destroyChart(id);
    const ctx = document.getElementById(id); if (!ctx) return;
    _charts[id] = new Chart(ctx, { type:'bar',
        data:{labels,datasets:[{data:vals,backgroundColor:colors,borderRadius:6,borderSkipped:false}]},
        options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, animation:{duration:800,easing:'easeOutQuart'},
            scales:{ x:{grid:{color:'#F1F5F9'},ticks:{...TC,callback:v=>v>=1e6?(v/1e6).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':v}},
                     y:{grid:{display:false},ticks:{font:{...BF,size:12,weight:'600'},color:'#0F172A'}} },
            plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${Number(c.raw).toLocaleString()} UZS`}} } } });
}

function mkLine(id, labels, datasets) {
    destroyChart(id);
    const ctx = document.getElementById(id); if (!ctx) return;
    _charts[id] = new Chart(ctx, { type:'line', data:{labels,datasets},
        options:{ responsive:true, maintainAspectRatio:false, animation:{duration:900,easing:'easeOutQuart'},
            scales:{ x:{grid:{display:false},ticks:TC}, y:{grid:{color:'#F1F5F9'},ticks:{...TC,callback:v=>v>=1e6?(v/1e6).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':v}} },
            plugins:{ legend:{display:datasets.length>1,labels:{font:{...BF,size:11},color:'#334155',boxWidth:10,borderRadius:3,useBorderRadius:true}}, tooltip:TU } } });
}

// ---- UI helpers ----
function sCard(icon, label, val, sub='', ac='') {
    return `<div class="dash-stat-card" style="${ac?'border-top:3px solid '+ac:''}">
        <div class="dash-stat-icon">${icon}</div>
        <div class="dash-stat-body">
            <div class="dash-stat-label">${label}</div>
            <div class="dash-stat-value">${val}</div>
            ${sub?`<div class="dash-stat-sub">${sub}</div>`:''}
        </div></div>`;
}

function cCard(title, id, h=220) {
    return `<div class="dash-chart-card">
        <div class="dash-chart-title">${title}</div>
        <div style="position:relative;height:${h}px;"><canvas id="${id}"></canvas></div>
    </div>`;
}

function secTitle(t) { return `<div class="dash-section-title">${t}</div>`; }

// ======================================================
function loadDashboard() {
    const el = document.getElementById('dashboardContent');
    if (!el) return;

    if (myRole === 'SuperAdmin') {
        // SuperAdmin: o'zining ham, kompaniyaning ham to'liq statistikasi
        renderSuperAdminDashboard(el);
    } else if (myRole === 'Direktor') {
        // Direktor: barcha kompaniya statistikasi + o'zini
        renderDirektorDashboard(el);
    } else if (myRole === 'Admin') {
        // Admin: faqat o'z statistikasi (agar ruhsat bo'lsa kompaniya ham)
        renderAdminDashboard(el);
    } else {
        // Hodim: faqat o'z statistikasi
        renderUserDashboard(el);
    }
}

// ---- HODIM ----
function renderUserDashboard(el) {
    // FIX: myFullRecords ishlatamiz, filtered bo'sh bo'lishi mumkin
    const rec = myFullRecords.length ? myFullRecords : [];
    if (!rec.length) {
        el.innerHTML = `<div class="empty-state" style="padding:60px 20px;">
            <div style="font-size:40px">📭</div>
            <p>Hali xarajatlar kiritilmagan</p></div>`;
        return;
    }

    const months6  = getLastNMonths(6);
    const bycat    = sumByCategory(rec);
    const txPerMo  = months6.map(mo => rec.filter(r=>{const d=parseDate(r.date);return d&&d.key===mo.key;}).length);
    const total    = sumUZS(rec), usd = sumUSD(rec), avg = avgMonthly(rec);
    const usdCnt   = rec.filter(r=>Number(r.amountUSD)>0).length;

    el.innerHTML = `
    <div class="dash-role-badge user">👤 Mening Statistikam</div>
    <div class="dash-stats-grid">
        ${sCard('💰','Jami Xarajat',fmt(total)+' UZS','So\'mda hisoblaganda','#10B981')}
        ${sCard('💵','Dollar Xarajat','$'+usd.toLocaleString(),'Dollar formatida','#F59E0B')}
        ${sCard('📅','Oylik O\'rtacha',fmt(avg)+' UZS','Hisoblangan o\'rtacha','#3B82F6')}
        ${sCard('🏆','Eng Faol Oy',peakMonth(rec),'Eng ko\'p xarajat','#8B5CF6')}
        ${sCard('📋','Jami Amallar',rec.length+' ta','Kiritilgan amallar','#EC4899')}
        ${sCard('💱','Dollar Amallar',usdCnt+' ta','USD formatida','#14B8A6')}
    </div>
    ${cCard('📊 Oxirgi 6 Oy','chartU_monthly',200)}
    ${cCard('🥧 Valyuta Taqsimoti','chartU_donut',230)}
    ${bycat.length ? cCard('📋 Xarajat Toifalari','chartU_cat',Math.max(160,bycat.length*44)) : ''}
    ${cCard('📈 Oylik Amallar Soni','chartU_txCount',160)}`;

    mkBar('chartU_monthly', months6.map(m=>m.label),
        [{label:'Xarajat',data:sumByMonthKey(rec,months6),
          backgroundColor:months6.map((_,i)=>i===months6.length-1?'#10B981':'#BFDBFE'),borderRadius:8,borderSkipped:false}]);

    const pu = pureUZS(rec), cu = convUZS(rec);
    if (pu>0||cu>0) mkDonut('chartU_donut',["Faqat So'm","Dollar (so'mga)"],[pu,cu],['#10B981','#F59E0B']);

    if (bycat.length) mkHBar('chartU_cat', bycat.map(x=>x[0]), bycat.map(x=>x[1]), PALETTE);

    mkLine('chartU_txCount', months6.map(m=>m.label),
        [{label:'Amallar',data:txPerMo,borderColor:'#8B5CF6',backgroundColor:'rgba(139,92,246,0.08)',
          borderWidth:2.5,pointRadius:5,pointBackgroundColor:'#8B5CF6',fill:true,tension:0.4}]);
}

// ---- ADMIN (faqat o'z statistikasi, agar ruhsat bo'lsa kompaniya ham) ----
function renderAdminDashboard(el) {
    const my = myFullRecords;
    const showCompany = myPermissions.canViewDashboard && globalAdminData.length > 0;
    const all = showCompany ? globalAdminData : [];
    const months6 = getLastNMonths(6);

    el.innerHTML = `
    <div class="dash-role-badge admin">🛡 Admin Statistikasi</div>

    ${secTitle('👤 Mening Statistikam')}
    <div class="dash-stats-grid">
        ${sCard('💰','Mening Xarajatim',fmt(sumUZS(my))+' UZS','','#10B981')}
        ${sCard('📅','Oylik O\'rtacha',fmt(avgMonthly(my))+' UZS','','#3B82F6')}
        ${sCard('🏆','Eng Faol Oy',peakMonth(my)||'—','','#8B5CF6')}
        ${sCard('📋','Jami Amallarim',my.length+' ta','','#EC4899')}
    </div>
    ${cCard('📊 Mening 6-Oylik Xarajatim','chartA_myMonthly',200)}
    ${cCard('🥧 Valyuta Taqsimotim','chartA_myDonut',220)}

    ${showCompany ? `
    ${secTitle('🏢 Kompaniya (Sizga ruxsat berilgan)')}
    <div class="dash-stats-grid">
        ${sCard('💰','Jami Budjet',fmt(sumUZS(all))+' UZS','','#10B981')}
        ${sCard('👥','Xodimlar',new Set(all.map(r=>r.name)).size+' nafar','','#3B82F6')}
    </div>
    ${cCard('📈 Kompaniya Trendi','chartA_allTrend',200)}
    ` : ''}`;

    mkBar('chartA_myMonthly', months6.map(m=>m.label),
        [{label:'Xarajat',data:sumByMonthKey(my,months6),backgroundColor:'#10B981',borderRadius:8,borderSkipped:false}]);
    const pu=pureUZS(my),cu=convUZS(my);
    if (pu>0||cu>0) mkDonut('chartA_myDonut',["So'm","Dollar"],[pu,cu],['#10B981','#F59E0B']);

    if (showCompany) {
        mkLine('chartA_allTrend', months6.map(m=>m.label),
            [{label:'Kompaniya',data:sumByMonthKey(all,months6),
              borderColor:'#3B82F6',backgroundColor:'rgba(59,130,246,0.08)',
              borderWidth:2.5,pointRadius:5,pointBackgroundColor:'#3B82F6',fill:true,tension:0.4}]);
    }
}

// ---- DIREKTOR ----
function renderDirektorDashboard(el) {
    // FIX: globalAdminData bo'sh bo'lsa, avval yuklaymiz
    if (!globalAdminData.length) {
        el.innerHTML = `<div class="dash-empty" style="padding:50px 20px;">
            <div style="font-size:40px">⏳</div>
            <p style="margin-top:12px;">Ma'lumotlar yuklanmoqda...</p></div>`;
        // Admin paneldan ma'lumotlarni yuklash
        fetch(API_URL, { method:'POST', body:JSON.stringify({ action:'admin_get_all', telegramId }) })
            .then(r=>r.json()).then(data=>{
                if (data.success) {
                    globalAdminData = data.data || [];
                    filteredData    = [...globalAdminData];
                    renderDirektorDashboard(el);
                }
            }).catch(()=>{
                el.innerHTML=`<div class="dash-empty"><p>Yuklanmadi. Admin paneliga o'ting.</p></div>`;
            });
        return;
    }

    const all     = globalAdminData;
    const months6 = getLastNMonths(6), months12 = getLastNMonths(12);
    const byEmp   = sumByEmployee(all).slice(0,8);
    const m6s     = months6.map(mo=>({
        uzs: all.filter(r=>{const d=parseDate(r.date);return d&&d.key===mo.key&&!Number(r.amountUSD);}).reduce((s,r)=>s+(Number(r.amountUZS)||0),0),
        usd: all.filter(r=>{const d=parseDate(r.date);return d&&d.key===mo.key&&Number(r.amountUSD)>0;}).reduce((s,r)=>s+(Number(r.amountUZS)||0),0),
    }));

    el.innerHTML = `
    <div class="dash-role-badge boss">🎯 Direktor — To'liq Ko'rinish</div>
    <div class="dash-stats-grid">
        ${sCard('💰','Jami Budjet',fmt(sumUZS(all))+' UZS','','#10B981')}
        ${sCard('💵','Dollar Xarajat','$'+sumUSD(all).toLocaleString(),'','#F59E0B')}
        ${sCard('👥','Xodimlar',new Set(all.map(r=>r.name)).size+' nafar','','#3B82F6')}
        ${sCard('📋','Amallar',all.length+' ta','','#8B5CF6')}
        ${sCard('📅','Oylik O\'rtacha',fmt(avgMonthly(all))+' UZS','','#EC4899')}
        ${sCard('🏆','Eng Faol Oy',peakMonth(all)||'—','','#14B8A6')}
    </div>
    ${cCard('📈 12 Oylik Trend','chartD_trend',220)}
    ${cCard('🥧 Valyuta Taqsimoti','chartD_donut',250)}
    ${cCard('🏅 Top Xodimlar','chartD_emp',Math.max(200,byEmp.length*50))}
    ${cCard('📊 6 Oy (So\'m / Dollar)','chartD_bar6',220)}`;

    mkLine('chartD_trend', months12.map(m=>m.label),
        [{label:'Jami',data:sumByMonthKey(all,months12),borderColor:'#10B981',
          backgroundColor:'rgba(16,185,129,0.07)',borderWidth:2.5,pointRadius:4,
          pointBackgroundColor:'#10B981',fill:true,tension:0.4}]);
    mkDonut('chartD_donut',["Faqat So'm","Dollar (so'mga)"],[pureUZS(all),convUZS(all)],['#10B981','#F59E0B']);
    mkHBar('chartD_emp', byEmp.map(e=>e[0].split(' ')[0]), byEmp.map(e=>e[1]), byEmp.map((_,i)=>PALETTE[i%PALETTE.length]));
    mkBar('chartD_bar6', months6.map(m=>m.label),
        [{label:"So'm",data:m6s.map(x=>x.uzs),backgroundColor:'#10B981',borderRadius:6,borderSkipped:false},
         {label:"Dollar",data:m6s.map(x=>x.usd),backgroundColor:'#F59E0B',borderRadius:6,borderSkipped:false}], true);
}

// ---- SUPERADMIN ----
function renderSuperAdminDashboard(el) {
    if (!globalAdminData.length) {
        el.innerHTML = `<div class="dash-empty" style="padding:50px 20px;">
            <div style="font-size:40px">⏳</div><p style="margin-top:12px;">Yuklanmoqda...</p></div>`;
        fetch(API_URL,{method:'POST',body:JSON.stringify({action:'admin_get_all',telegramId})})
            .then(r=>r.json()).then(data=>{
                if(data.success){globalAdminData=data.data||[];filteredData=[...globalAdminData];renderSuperAdminDashboard(el);}
            }).catch(()=>{el.innerHTML=`<div class="dash-empty"><p>Yuklanmadi.</p></div>`;});
        return;
    }

    const all=globalAdminData, my=myFullRecords;
    const months6=getLastNMonths(6), months12=getLastNMonths(12);
    const byEmp=sumByEmployee(all).slice(0,8);
    const m6s=months6.map(mo=>({
        uzs:all.filter(r=>{const d=parseDate(r.date);return d&&d.key===mo.key&&!Number(r.amountUSD);}).reduce((s,r)=>s+(Number(r.amountUZS)||0),0),
        usd:all.filter(r=>{const d=parseDate(r.date);return d&&d.key===mo.key&&Number(r.amountUSD)>0;}).reduce((s,r)=>s+(Number(r.amountUZS)||0),0),
    }));

    el.innerHTML = `
    <div class="dash-role-badge boss">👑 SuperAdmin — To'liq Nazorat</div>

    ${secTitle('🏢 Kompaniya Statistikasi')}
    <div class="dash-stats-grid">
        ${sCard('💰','Jami Budjet',fmt(sumUZS(all))+' UZS','','#10B981')}
        ${sCard('💵','Dollar','$'+sumUSD(all).toLocaleString(),'','#F59E0B')}
        ${sCard('👥','Xodimlar',new Set(all.map(r=>r.name)).size+' nafar','','#3B82F6')}
        ${sCard('📋','Amallar',all.length+' ta','','#8B5CF6')}
        ${sCard('📅','Oylik O\'rtacha',fmt(avgMonthly(all))+' UZS','','#EC4899')}
        ${sCard('🏆','Eng Faol Oy',peakMonth(all)||'—','','#14B8A6')}
    </div>
    ${cCard('📈 12 Oylik Trend','chartS_trend',220)}
    ${cCard('🥧 Valyuta Taqsimoti','chartS_donut',240)}
    ${cCard('🏅 Top Xodimlar','chartS_emp',Math.max(200,byEmp.length*50))}
    ${cCard('📊 6 Oy (So\'m / Dollar)','chartS_bar6',220)}

    ${secTitle('👤 Mening Statistikam')}
    <div class="dash-stats-grid">
        ${sCard('💰','Mening Xarajatim',fmt(sumUZS(my))+' UZS','','#10B981')}
        ${sCard('📅','Oylik O\'rtacha',fmt(avgMonthly(my))+' UZS','','#3B82F6')}
        ${sCard('🏆','Eng Faol Oy',peakMonth(my)||'—','','#8B5CF6')}
        ${sCard('📋','Amallarim',my.length+' ta','','#EC4899')}
    </div>
    ${cCard('📊 Mening Oylik Xarajatim','chartS_my',190)}`;

    mkLine('chartS_trend',months12.map(m=>m.label),
        [{label:'Jami',data:sumByMonthKey(all,months12),borderColor:'#10B981',
          backgroundColor:'rgba(16,185,129,0.07)',borderWidth:2.5,pointRadius:4,pointBackgroundColor:'#10B981',fill:true,tension:0.4}]);
    mkDonut('chartS_donut',["Faqat So'm","Dollar (so'mga)"],[pureUZS(all),convUZS(all)],['#10B981','#F59E0B']);
    mkHBar('chartS_emp',byEmp.map(e=>e[0].split(' ')[0]),byEmp.map(e=>e[1]),byEmp.map((_,i)=>PALETTE[i%PALETTE.length]));
    mkBar('chartS_bar6',months6.map(m=>m.label),
        [{label:"So'm",data:m6s.map(x=>x.uzs),backgroundColor:'#10B981',borderRadius:6,borderSkipped:false},
         {label:"Dollar",data:m6s.map(x=>x.usd),backgroundColor:'#F59E0B',borderRadius:6,borderSkipped:false}],true);
    mkBar('chartS_my',months6.map(m=>m.label),
        [{label:'Mening',data:sumByMonthKey(my,months6),backgroundColor:'#10B981',borderRadius:8,borderSkipped:false}]);
}