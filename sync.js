// ─── CSV PARSER ──────────────────────────────────────────────────────────

function parseCSV(text) {
    const rows = [];
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    for (const line of lines) {
        if (!line.trim()) continue;
        const cells = [];
        let i = 0;
        while (i < line.length) {
            if (line[i] === '"') {
                let j = i + 1, val = '';
                while (j < line.length) {
                    if (line[j] === '"' && line[j + 1] === '"') { val += '"'; j += 2; }
                    else if (line[j] === '"') { j++; break; }
                    else { val += line[j++]; }
                }
                cells.push(val);
                if (line[j] === ',') j++;
                i = j;
            } else {
                let j = i;
                while (j < line.length && line[j] !== ',') j++;
                cells.push(line.slice(i, j));
                i = j + 1;
            }
        }
        if (line.endsWith(',')) cells.push('');
        rows.push(cells);
    }
    if (rows.length < 2) return [];

    // Normalise header names → internal field keys
    const headerMap = h => {
        const s = h.replace(/\s+/g, '').toLowerCase();
        if (s === 'visacdn?' || s === 'visacdn') return 'visaCDN';
        if (s === 'visamex?' || s === 'visamex') return 'visaMEX';
        if (s === 'visaadditionalinfo' || s === 'visanote') return 'visaNote';
        if (s === 'name' || s === 'promoter' || s === 'booker') return 'name';
        if (s === 'email' || s === 'contactemail' || s === 'emailaddress') return 'email';
        if (s === 'phone' || s === 'mobile' || s === 'mob' || s === 'tel' || s === 'contact#' || s === 'phone#' || s === 'phonenumber') return 'phone';
        if (s === 'openers' || s === 'support' || s === 'supportacts') return 'openers';
        return s;
    };

    const headers = rows[0].map(headerMap);

    return rows.slice(1).filter(r => r.some(c => c.trim())).map((r, idx) => {
        const obj = { id: idx + 1 };
        headers.forEach((key, i) => { obj[key] = (r[i] || '').trim(); });

        // Normalise date to YYYY-MM-DD
        if (obj.date && obj.date.includes('/')) {
            const [m, d, y] = obj.date.split('/').map(Number);
            obj.date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }

        // Strip empty string fields
        Object.keys(obj).forEach(k => { if (obj[k] === '') delete obj[k]; });
        return obj;
    }).filter(o => o.date);
}

// ─── GOOGLE SHEET SYNC ────────────────────────────────────────────────────
async function syncSheet() {
    const urlInput = document.getElementById('sheetUrl');
    const statusEl = document.getElementById('syncStatus');
    const url = urlInput.value.trim();
    if (!url) { statusEl.textContent = '⚠️  Paste a CSV URL first'; return; }

    localStorage.setItem(LS_URL, url);
    statusEl.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i>  Syncing…';

    // Try fetching via multiple strategies (CORS proxy needed for file:// origins)
    const attempts = [
        { label: 'direct', fetch: () => fetch(url) },
        { label: 'corsproxy.io', fetch: () => fetch('https://corsproxy.io/?' + encodeURIComponent(url)) },
        { label: 'allorigins', fetch: () => fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url)) },
    ];

    let text = null;
    let lastErr = '';
    for (const attempt of attempts) {
        try {
            statusEl.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i>  Trying ${attempt.label}…`;
            const res = await attempt.fetch();
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            text = await res.text();
            break; // success
        } catch (e) {
            lastErr = e.message;
        }
    }

    if (!text) {
        statusEl.innerHTML = `<span class="text-red-400">✗ Failed to fetch — ${lastErr}<br><span class="text-zinc-500">Make sure the sheet is published as CSV (File → Share → Publish to web)</span></span>`;
        return;
    }

    try {
        const parsed = parseCSV(text);
        if (!parsed.length) throw new Error('No rows found — check that column headers match and sheet is published');
        const ts = new Date().toLocaleTimeString();
        localStorage.setItem(LS_SYNCED, ts);
        saveData(parsed);
        updateDataStatus();
        statusEl.innerHTML = `<span class="text-lime-400">✓ Synced ${parsed.length} shows — ${ts}</span>`;
    } catch (e) {
        statusEl.innerHTML = `<span class="text-red-400">✗ Parse error: ${e.message}</span>`;
    }
}

async function pushToSheet() {
    const statusEl = document.getElementById('syncStatus');
    const writeUrl = document.getElementById('sheetWriteUrl').value.trim();
    if (!writeUrl) {
        statusEl.innerHTML = '⚠️  Paste a Write URL first (from Apps Script)';
        switchTab('settings');
        return;
    }
    localStorage.setItem(LS_WRITE_URL, writeUrl);

    statusEl.innerHTML = '<i class="fa-solid fa-cloud-arrow-up fa-spin"></i>  Pushing to sheet…';
    try {
        const res = await fetch(writeUrl, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors for simple POST or it fails preflight
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(liveData)
        });
        // Note: With no-cors, we can't read the response body or status, 
        // but we assume success if it doesn't throw.
        const ts = new Date().toLocaleTimeString();
        statusEl.innerHTML = `<span class="text-amber-400">✓ Pushed to sheet — ${ts}</span>`;
    } catch (e) {
        statusEl.innerHTML = `<span class="text-red-400">✗ Push failed: ${e.message}</span>`;
    }
}
