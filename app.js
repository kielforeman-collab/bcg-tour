let liveData = [];   // runtime data array (localStorage > hardcoded)
let currentShow = null;   // the show object currently in the modal
let isEditing = false;

// ─── DATA LAYER ──────────────────────────────────────────────────────────
const LS_DATA = 'bcg_tourData';
const LS_URL = 'bcg_sheetUrl';
const LS_WRITE_URL = 'bcg_writeUrl';
const LS_SYNCED = 'bcg_lastSynced';

// Version key — bump suffix to force a one-time cache purge
const LS_VER = 'bcg_dataVer';
const DATA_VER = `${tourData.length}:${tourData[tourData.length - 1].date}:r11`;

function loadData() {
    try {
        const storedVer = localStorage.getItem(LS_VER);
        const stored = localStorage.getItem(LS_DATA);
        const storedUrl = localStorage.getItem(LS_URL) || DEFAULT_SHEET_URL;
        const storedWriteUrl = localStorage.getItem(LS_WRITE_URL) || DEFAULT_WRITE_URL;
        document.getElementById('sheetUrl').value = storedUrl;
        document.getElementById('sheetWriteUrl').value = storedWriteUrl;

        if (stored && storedVer === DATA_VER) {
            liveData = JSON.parse(stored);
        } else {
            // Wipe ALL bcg_ keys to remove any stale / corrupt data
            Object.keys(localStorage)
                .filter(k => k.startsWith('bcg_'))
                .forEach(k => localStorage.removeItem(k));
            liveData = [...tourData];
            localStorage.setItem(LS_VER, DATA_VER);
        }
    } catch (e) {
        liveData = [...tourData];
    }
}

function saveData(arr) {
    liveData = arr;
    localStorage.setItem(LS_DATA, JSON.stringify(arr));
    localStorage.setItem(LS_VER, DATA_VER);   // stamp version so reload keeps synced data
    renderShows(liveData);
    populateDropdowns();
    renderTourLegs();
    filterBy(document.getElementById('countryFilter').value);
}

function resetData() {
    if (!confirm('Reset to hardcoded defaults? All edits and synced data will be lost.')) return;
    localStorage.removeItem(LS_DATA);
    localStorage.removeItem(LS_SYNCED);
    localStorage.removeItem(LS_URL);
    localStorage.removeItem(LS_WRITE_URL);
    loadData();
    // Re-populate inputs from defaults
    document.getElementById('sheetUrl').value = DEFAULT_SHEET_URL;
    document.getElementById('sheetWriteUrl').value = DEFAULT_WRITE_URL;
    renderShows(liveData);
    populateDropdowns();
    renderTourLegs();
    updateDataStatus();
    document.getElementById('syncStatus').textContent = '';
}

function updateDataStatus() {
    const stored = !!localStorage.getItem(LS_DATA);
    const synced = localStorage.getItem(LS_SYNCED);
    const el = document.getElementById('dataStatus');
    if (!el) return;
    el.innerHTML = [
        `<span class="text-zinc-500">Source:</span> ${stored ? '<span class="text-lime-400">localStorage</span>' : '<span class="text-zinc-400">hardcoded defaults</span>'}`,
        `<span class="text-zinc-500">Shows:</span> ${liveData.length}`,
        synced ? `<span class="text-zinc-500">Last synced:</span> ${synced}` : ''
    ].filter(Boolean).join(' &nbsp;·&nbsp; ');
}

// ─── EDIT MODE ────────────────────────────────────────────────────────────

function toggleEdit() {
    isEditing = !isEditing;
    const btn = document.getElementById('editBtn');
    btn.querySelector('i').className = isEditing
        ? 'fa-solid fa-eye'
        : 'fa-solid fa-pen-to-square';
    btn.title = isEditing ? 'View' : 'Edit show';
    if (isEditing) showEditForm(currentShow);
    else showDetail(currentShow);
}

function showEditForm(show) {
    const content = document.getElementById('modalContent');
    const fields = [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'airport', label: 'Airport (IATA)', type: 'text' },
        { key: 'country', label: 'Country', type: 'text' },
        { key: 'venue', label: 'Venue', type: 'text' },
        { key: 'address', label: 'Address', type: 'text' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'deal', label: 'Deal', type: 'text' },
        { key: 'openers', label: 'Openers', type: 'text' },
        { key: 'schedule', label: 'Schedule', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'flight', label: 'Flight', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'hotel', label: 'Hotel', type: 'text' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
        { key: 'visaCDN', label: 'Visa 🇨🇦 CDN', type: 'text' },
        { key: 'visaMEX', label: 'Visa 🇲🇽 MEX', type: 'text' },
        { key: 'visaNote', label: 'Visa Note', type: 'text' },
    ];

    const fieldHtml = fields.map(f => {
        const val = (show[f.key] || '').replace(/"/g, '&quot;');
        const cls = 'w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm focus:outline-none';
        const input = f.type === 'textarea'
            ? `<textarea id="ef_${f.key}" rows="3" class="${cls} resize-none">${show[f.key] || ''}</textarea>`
            : `<input id="ef_${f.key}" type="${f.type}" value="${val}" class="${cls}">`;
        return `<div>
            <label class="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">${f.label}</label>
            ${input}
        </div>`;
    }).join('');

    content.innerHTML = `
        <div class="space-y-4">
            ${fieldHtml}
            <div class="grid grid-cols-2 gap-2 pt-2">
                <button onclick="saveEdit()" class="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold py-3 rounded-2xl text-sm">
                    <i class="fa-solid fa-floppy-disk mr-1"></i> Save
                </button>
                <button onclick="cancelEdit()" class="bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 font-bold py-3 rounded-2xl text-sm">
                    Cancel
                </button>
            </div>
        </div>`;
}

function saveEdit() {
    const fields = ['date', 'city', 'airport', 'country', 'venue', 'address', 'name', 'deal', 'openers',
        'schedule', 'email', 'phone', 'flight', 'status', 'hotel', 'notes', 'visaCDN', 'visaMEX', 'visaNote'];
    const updated = { ...currentShow };
    fields.forEach(k => {
        const el = document.getElementById('ef_' + k);
        if (el) updated[k] = el.value.trim() || undefined;
    });
    // Clean undefined keys
    Object.keys(updated).forEach(k => { if (updated[k] === undefined) delete updated[k]; });

    const idx = liveData.findIndex(s => s.id === updated.id);
    if (idx !== -1) liveData[idx] = updated;
    else liveData.push(updated);

    localStorage.setItem(LS_DATA, JSON.stringify(liveData));
    pushToSheet(); // Auto-push on save
    renderShows(liveData);
    populateDropdowns();
    renderTourLegs();
    filterBy(document.getElementById('countryFilter').value);
    currentShow = updated;
    isEditing = false;
    const btn = document.getElementById('editBtn');
    btn.querySelector('i').className = 'fa-solid fa-pen-to-square';
    btn.title = 'Edit show';
    showDetail(updated);
}

function cancelEdit() {
    isEditing = false;
    const btn = document.getElementById('editBtn');
    btn.querySelector('i').className = 'fa-solid fa-pen-to-square';
    btn.title = 'Edit show';
    showDetail(currentShow);
}

function switchTab(tab) {
    const views = ['shows', 'flights', 'settings'];
    views.forEach(v => {
        document.getElementById(v + 'View').classList.toggle('hidden', tab !== v);
        const btn = document.getElementById('bottom-' + v);
        btn.classList.toggle('text-red-500', tab === v);
        btn.classList.toggle('border-t-4', tab === v);
        btn.classList.toggle('border-red-600', tab === v);
        btn.classList.toggle('text-zinc-400', tab !== v);
    });
    // Filter bar only on shows
    document.getElementById('filterDropdown').classList.toggle('hidden', tab !== 'shows');
    // Update data status when settings opens
    if (tab === 'settings') updateDataStatus();
}

function filterBy(country) {
    let filtered = liveData;
    if (country === 'other') filtered = liveData.filter(s => !['Japan', 'Taiwan', 'China'].includes(s.country));
    else if (country !== 'all') filtered = liveData.filter(s => s.country === country);
    renderShows(filtered);
}

function searchShows() {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!term) return filterBy(document.getElementById('countryFilter').value);
    const results = liveData.filter(s =>
        s.city.toLowerCase().includes(term) ||
        (s.venue && s.venue.toLowerCase().includes(term)) ||
        s.date.includes(term)
    );
    renderShows(results);
}

function countdown() {
    const shows = liveData.map(s => new Date(s.date + 'T00:00:00'));
    const now = new Date();
    const next = shows.find(d => d >= now) || shows[shows.length - 1];
    const diff = next - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    document.getElementById('countdown').innerHTML = days > 0 ? `${days}<span class="text-xs align-super ml-1">d</span>` : 'GO!';
}

window.onload = () => {
    // Load data & init URLs
    loadData();

    renderShows(liveData);
    populateDropdowns();
    renderTourLegs();
    countdown();
    setInterval(countdown, 3600000);
    switchTab('shows');
    document.getElementById('countryFilter').value = 'all';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('%c✅ Service Worker registered — offline ready!', 'color:#22c55e'))
            .catch(err => console.log('SW registration failed:', err));
    }

    console.log('%c🤘 BCG Tour App — OFFLINE READY!', 'color:#ef4444; font-size:13px; font-family:monospace');
};

// Close modal on background tap
document.getElementById('modal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});
