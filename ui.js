// Format YYYY-MM-DD → friendly string e.g. "Wed, Mar 4"
function fmtDate(d) {
    if (!d) return '';
    try {
        const dt = new Date(d + 'T12:00:00'); // noon to avoid timezone shifts
        return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) { return d; }
}

function renderShows(data) {
    const container = document.getElementById('showsView');
    container.innerHTML = '';
    data.forEach(show => {
        const div = document.createElement('div');
        div.className = `card bg-zinc-900 border border-zinc-800 rounded-3xl p-5 cursor-pointer active:scale-[0.98]`;
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-mono text-red-500 text-sm">${fmtDate(show.date)}</div>
                    <div class="text-2xl font-bold mt-1 leading-none">${show.city}</div>
                    <div class="text-red-400 mt-1">${show.venue || 'Travel / Off day'}</div>
                </div>
                <div class="text-right">
                    <div class="inline-block bg-zinc-800 text-[10px] px-3 py-1 rounded-2xl">${show.country}</div>
                </div>
            </div>
            ${show.deal ? `<div class="mt-4 text-xs uppercase tracking-widest text-lime-400">${show.deal}</div>` : ''}
        `;
        div.onclick = () => showDetail(show);
        container.appendChild(div);
    });
}

function showDetail(show) {
    currentShow = show;
    isEditing = false;
    const editBtn = document.getElementById('editBtn');
    if (editBtn) { editBtn.querySelector('i').className = 'fa-solid fa-pen-to-square'; editBtn.title = 'Edit show'; }
    const content = document.getElementById('modalContent');

    // HTML-escape user values
    const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Always-visible info row — safe string concat, no nested backticks
    function infoRow(label, value, valCls) {
        var cls = value ? (valCls || 'text-zinc-300') : 'text-zinc-700';
        return '<div class="flex items-start justify-between gap-4 px-4 py-3">'
            + '<span class="text-[10px] uppercase tracking-widest text-zinc-600 shrink-0 pt-0.5">' + label + '</span>'
            + '<span class="text-sm text-right ' + cls + '">' + (value ? esc(value) : '\u2014') + '</span>'
            + '</div>';
    }

    // Visa badge — safe, no nested backticks
    function visaBadge(value) {
        if (!value) return '<span class="text-xs text-zinc-700">\u2014</span>';
        var bg = /free/i.test(value) ? 'bg-lime-600' : 'bg-yellow-600';
        return '<span class="text-xs font-bold px-3 py-1 rounded-full ' + bg + ' text-black">' + esc(value) + '</span>';
    }

    // ── header ──
    var html = '<div class="text-center mb-7">'
        + '<div class="font-mono text-3xl font-bold text-white mb-1">' + fmtDate(show.date) + '</div>'
        + (show.city ? '<div class="text-red-400 text-lg font-semibold">' + esc(show.city) + '</div>' : '')
        + '<div class="text-zinc-600 text-xs mt-1">' + esc(show.country) + ' \u00b7 ' + esc(show.airport) + '</div>'
        + '</div>';

    // ── venue ──
    html += '<div class="bg-zinc-800/60 rounded-2xl p-5 mb-5">'
        + '<div class="uppercase text-[10px] tracking-widest text-zinc-500 mb-1">Venue</div>'
        + '<div class="text-xl font-semibold ' + (show.venue ? '' : 'text-zinc-600') + '">' + (show.venue ? esc(show.venue) : '\u2014') + '</div>'
        + '<div class="text-sm text-zinc-400 mt-1"><i class="fa-solid fa-location-dot mr-1 text-red-500/50"></i>'
        + (show.address ? esc(show.address) : '<span class="text-zinc-700">\u2014</span>') + '</div>'
        + '</div>';

    // ── show info table ──
    html += '<div class="mb-5 rounded-2xl overflow-hidden border border-zinc-800 divide-y divide-zinc-800">'
        + infoRow('Name', show.name)
        + infoRow('Deal', show.deal, 'text-lime-400')
        + infoRow('Openers', show.openers)
        + infoRow('Schedule', show.schedule)
        + infoRow('Email', show.email, 'text-zinc-200 font-mono')
        + infoRow('Phone', show.phone, 'text-zinc-200 font-mono')
        + '</div>';

    // ── flight ──
    var qFlight = show.flight ? encodeURIComponent('flight ' + show.flight) : '';
    var qStatus = show.status ? encodeURIComponent('flight status ' + show.status) : '';

    html += '<div class="bg-amber-900/20 border border-amber-800/40 rounded-2xl p-5 mb-5">'
        + '<div class="uppercase text-[10px] tracking-widest text-amber-400 mb-3"><i class="fa-solid fa-plane mr-1"></i>Flight</div>'
        + '<div class="font-mono text-sm leading-relaxed ' + (show.flight ? '' : 'text-zinc-700') + '">' + (show.flight ? '<a href="https://www.google.com/search?q=' + qFlight + '" target="_blank" class="underline underline-offset-4 decoration-amber-800/50 hover:decoration-amber-400 hover:text-amber-300 transition-colors cursor-pointer">' + esc(show.flight) + '</a>' : '\u2014') + '</div>'
        + (show.status ? '<div class="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">Status</div><div class="font-mono text-xs text-amber-300"><a href="https://www.google.com/search?q=' + qStatus + '" target="_blank" class="underline underline-offset-4 decoration-amber-800/50 hover:decoration-amber-400 hover:text-amber-200 transition-colors cursor-pointer">' + esc(show.status) + '</a></div>' : '')
        + '</div>';

    // ── hotel / notes ──
    html += '<div class="mb-5 rounded-2xl overflow-hidden border border-zinc-800 divide-y divide-zinc-800">'
        + infoRow('Hotel', show.hotel)
        + infoRow('Notes', show.notes)
        + '</div>';

    // ── visa ──
    var visaNoteHtml = '';
    if (show.visaNote) {
        var noteContent = /^https?:\/\//.test(show.visaNote)
            ? '<a href="' + show.visaNote + '" target="_blank" class="underline underline-offset-2">' + esc(show.visaNote) + '</a>'
            : esc(show.visaNote);
        visaNoteHtml = '<div class="text-xs text-blue-300 mt-2">' + noteContent + '</div>';
    }
    html += '<div class="bg-blue-950/30 border border-blue-900/40 rounded-2xl p-4 mb-5">'
        + '<div class="uppercase text-[10px] tracking-widest text-blue-400 mb-3"><i class="fa-solid fa-passport mr-1"></i>Visa Requirements</div>'
        + '<div class="flex items-center justify-between py-2 border-b border-blue-900/30">'
        + '<span class="text-xs text-zinc-500 uppercase tracking-widest">\ud83c\udde8\ud83c\udde6 CDN</span>'
        + visaBadge(show.visaCDN)
        + '</div>'
        + '<div class="flex items-center justify-between py-2' + (show.visaNote ? ' border-b border-blue-900/30' : '') + '">'
        + '<span class="text-xs text-zinc-500 uppercase tracking-widest">\ud83c\uddf2\ud83c\uddfd MEX</span>'
        + visaBadge(show.visaMEX)
        + '</div>'
        + visaNoteHtml
        + '</div>';

    // ── flight search ──
    var cityEsc = esc(show.city);
    html += '<div class="mt-6 pt-6 border-t border-zinc-800">'
        + '<div class="uppercase text-[10px] tracking-widest text-amber-400 mb-3 flex items-center gap-2"><i class="fa-solid fa-magnifying-glass"></i> Quick Flight Search</div>'
        + '<div class="grid grid-cols-2 gap-2">'
        + '<button onclick="quickFlightSearch(\'' + show.city + '\',\'' + show.date + '\',\'to\')" class="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 py-4 rounded-2xl text-sm font-bold">\u2192 ' + cityEsc + '</button>'
        + '<button onclick="quickFlightSearch(\'' + show.city + '\',\'' + show.date + '\',\'from\')" class="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 py-4 rounded-2xl text-sm font-bold">From ' + cityEsc + '</button>'
        + '</div></div>';
    content.innerHTML = html;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function quickFlightSearch(city, date, dir) {
    closeModal();
    if (dir === 'from') {
        document.getElementById('fromCity').value = city;
    } else {
        document.getElementById('toCity').value = city;
    }
    document.getElementById('flightDate').value = date;
    switchTab('flights');
}
