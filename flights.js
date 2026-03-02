// Map city -> IATA airport code (first occurrence per city in tour)
const cityAirportMap = {};
tourData.forEach(s => { if (!cityAirportMap[s.city]) cityAirportMap[s.city] = s.airport; });

function getIATA(city) { return cityAirportMap[city] || city; }
function getPax() { return parseInt(document.getElementById('paxCount').value) || 3; }

function populateDropdowns() {
    // Deduplicated city list in tour order (NOT alphabetical)
    const seen = new Set(), cities = [];
    tourData.forEach(s => { if (!seen.has(s.city)) { seen.add(s.city); cities.push(s.city); } });

    const fromSelect = document.getElementById('fromCity');
    const toSelect = document.getElementById('toCity');
    fromSelect.innerHTML = toSelect.innerHTML = '';
    cities.forEach(city => {
        const code = cityAirportMap[city];
        const label = `${city} (${code})`;
        fromSelect.add(new Option(label, city));
        toSelect.add(new Option(label, city));
    });
    // Default to first → second city
    if (cities.length > 1) toSelect.value = cities[1];
}

function swapCities() {
    const f = document.getElementById('fromCity');
    const t = document.getElementById('toCity');
    [f.value, t.value] = [t.value, f.value];
}

function searchGoogle() {
    const from = getIATA(document.getElementById('fromCity').value);
    const to = getIATA(document.getElementById('toCity').value);
    const date = document.getElementById('flightDate').value;
    const pax = getPax();
    window.open(`https://www.google.com/travel/flights?q=Flights+from+${from}+to+${to}+on+${date}&adults=${pax}`, '_blank');
}

function searchSkyscanner() {
    const from = getIATA(document.getElementById('fromCity').value).toLowerCase();
    const to = getIATA(document.getElementById('toCity').value).toLowerCase();
    const date = document.getElementById('flightDate').value.replace(/-/g, '').slice(2);
    const pax = getPax();
    window.open(`https://www.skyscanner.net/transport/flights/${from}/${to}/${date}/?adults=${pax}&currency=USD`, '_blank');
}

function searchKiwi() {
    const from = getIATA(document.getElementById('fromCity').value);
    const to = getIATA(document.getElementById('toCity').value);
    const date = document.getElementById('flightDate').value;
    const pax = getPax();
    window.open(`https://www.kiwi.com/en/search/results/${from}-${to}/${date}/${date}?adults=${pax}&currency=USD`, '_blank');
}

function searchKayak() {
    const from = getIATA(document.getElementById('fromCity').value);
    const to = getIATA(document.getElementById('toCity').value);
    const date = document.getElementById('flightDate').value;
    const pax = getPax();
    window.open(`https://www.kayak.com/flights/${from}-${to}/${date}/${pax}adults?sort=bestflight_a`, '_blank');
}

function searchMomondo() {
    const from = getIATA(document.getElementById('fromCity').value);
    const to = getIATA(document.getElementById('toCity').value);
    const date = document.getElementById('flightDate').value;
    const pax = getPax();
    window.open(`https://www.momondo.com/flight-search/${from}-${to}/${date}//${pax}adults?currency=USD`, '_blank');
}

// Build consecutive tour legs (whenever the airport changes)
function buildTourLegs() {
    const legs = [];
    for (let i = 0; i < liveData.length - 1; i++) {
        const a = liveData[i], b = liveData[i + 1];
        if (a.airport !== b.airport) {
            const info = b.flight || (b.notes && /[A-Z]{2,3}\d{3,4}/.test(b.notes) ? b.notes : null);
            const booked = !!(b.flight && /booked/i.test(b.flight)) ||
                !!(b.notes && /booked/i.test(b.notes));
            legs.push({
                fromCity: a.city, fromCode: a.airport,
                toCity: b.city, toCode: b.airport,
                date: b.date, booked, info
            });
        }
    }
    return legs;
}

function renderTourLegs() {
    const legs = buildTourLegs();
    const container = document.getElementById('tourLegsContainer');
    container.innerHTML = legs.map((leg, i) => `
        <button onclick="fillLeg(${i})" class="w-full text-left bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-2xl px-4 py-3 transition-colors">
            <div class="flex items-center justify-between mb-0.5">
                <div class="font-mono text-sm text-zinc-300">${leg.fromCode} <span class="text-zinc-600">→</span> ${leg.toCode}</div>
                ${leg.booked ? '<span class="text-[9px] bg-lime-600 text-black font-bold px-2 py-0.5 rounded-full uppercase">✓ Booked</span>' : '<span class="text-[9px] text-zinc-600 border border-zinc-700 px-2 py-0.5 rounded-full uppercase">Search</span>'}
            </div>
            <div class="flex items-center justify-between">
                <span class="text-xs text-zinc-500">${leg.fromCity} → ${leg.toCity}</span>
                <span class="text-[10px] font-mono text-zinc-600">${leg.date.slice(5)}</span>
            </div>
            ${leg.info ? `<div class="text-[10px] text-amber-400/70 mt-1 truncate">${leg.info}</div>` : ''}
        </button>`).join('');
}

function fillLeg(i) {
    const leg = buildTourLegs()[i];
    if (!leg) return;
    document.getElementById('fromCity').value = leg.fromCity;
    document.getElementById('toCity').value = leg.toCity;
    document.getElementById('flightDate').value = leg.date;
    document.getElementById('flightsView').scrollTo({ top: 0, behavior: 'smooth' });
}

function updateTourLegs() { /* hooks into swap/fill if needed */ }
