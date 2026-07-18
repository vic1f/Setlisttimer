// --- Instrument SVGs ---
const INSTRUMENT_SVGS = {
    banjo: `
        <svg class="instrument-icon" viewBox="0 0 100 100">
            <g transform="rotate(-45 50 50)">
                <rect x="47" y="10" width="6" height="55" fill="#8B5A2B" rx="1"/>
                <rect x="45" y="5" width="10" height="8" fill="#5C3A21" rx="2"/>
                <circle cx="43" cy="7" r="1.5" fill="#A8A8A8"/>
                <circle cx="43" cy="11" r="1.5" fill="#A8A8A8"/>
                <circle cx="57" cy="7" r="1.5" fill="#A8A8A8"/>
                <circle cx="57" cy="11" r="1.5" fill="#A8A8A8"/>
                <circle cx="50" cy="75" r="18" fill="#D2B48C" stroke="#5C3A21" stroke-width="3"/>
                <circle cx="50" cy="75" r="14" fill="#F5F5DC"/>
                <rect x="47" y="88" width="6" height="4" fill="#A8A8A8"/>
                <line x1="44" y1="78" x2="56" y2="78" stroke="#5C3A21" stroke-width="2"/>
                <line x1="48" y1="10" x2="48" y2="88" stroke="#E0E0E0" stroke-width="0.5"/>
                <line x1="50" y1="10" x2="50" y2="88" stroke="#E0E0E0" stroke-width="0.5"/>
                <line x1="52" y1="10" x2="52" y2="88" stroke="#E0E0E0" stroke-width="0.5"/>
            </g>
        </svg>
    `,
    guitar: `
        <svg class="instrument-icon" viewBox="0 0 100 100">
            <g transform="rotate(-45 50 50)">
                <rect x="48" y="10" width="4" height="50" fill="#8B5A2B"/>
                <polygon points="46,5 54,5 53,12 47,12" fill="#5C3A21"/>
                <circle cx="50" cy="65" r="11" fill="#CD853F" stroke="#5C3A21" stroke-width="2"/>
                <circle cx="50" cy="78" r="15" fill="#CD853F" stroke="#5C3A21" stroke-width="2"/>
                <rect x="44" y="69" width="12" height="4" fill="#CD853F"/>
                <circle cx="50" cy="69" r="4.5" fill="#2C1D11"/>
                <rect x="45" y="82" width="10" height="2" fill="#5C3A21"/>
                <line x1="49" y1="5" x2="49" y2="82" stroke="#E0E0E0" stroke-width="0.5"/>
                <line x1="50" y1="5" x2="50" y2="82" stroke="#E0E0E0" stroke-width="0.5"/>
                <line x1="51" y1="5" x2="51" y2="82" stroke="#E0E0E0" stroke-width="0.5"/>
            </g>
        </svg>
    `,
    mandolin: `
        <svg class="instrument-icon" viewBox="0 0 100 100">
            <g transform="rotate(-45 50 50)">
                <rect x="48" y="15" width="4" height="45" fill="#8B5A2B"/>
                <rect x="46" y="8" width="8" height="8" fill="#5C3A21" rx="1"/>
                <path d="M 50,55 C 38,70 38,88 50,92 C 62,88 62,70 50,55 Z" fill="#A0522D" stroke="#5C3A21" stroke-width="2"/>
                <circle cx="50" cy="70" r="3" fill="#2C1D11"/>
                <rect x="46" y="82" width="8" height="2" fill="#5C3A21"/>
            </g>
        </svg>
    `,
    bass: `
        <svg class="instrument-icon" viewBox="0 0 100 100">
            <g transform="rotate(-45 50 50)">
                <rect x="48.5" y="5" width="3" height="60" fill="#5C3A21"/>
                <path d="M 44,60 C 32,65 35,88 50,90 C 65,88 68,65 56,60 C 53,57 47,57 44,60 Z" fill="#8B0000" stroke="#3A0000" stroke-width="2"/>
                <rect x="46" y="70" width="8" height="2.5" fill="#1C1C1C" rx="0.5"/>
                <rect x="46" y="75" width="8" height="2.5" fill="#1C1C1C" rx="0.5"/>
            </g>
        </svg>
    `,
    violin: `
        <svg class="instrument-icon" viewBox="0 0 100 100">
            <g transform="rotate(-45 50 50)">
                <rect x="49" y="10" width="2" height="48" fill="#5C3A21"/>
                <circle cx="50" cy="7" r="3" fill="#5C3A21"/>
                <path d="M 50,55 C 44,57 43,65 47,69 C 43,73 42,83 50,87 C 58,83 57,73 53,69 C 57,65 56,57 50,55 Z" fill="#B22222" stroke="#5C3A21" stroke-width="1.5"/>
                <rect x="47" y="74" width="6" height="1.5" fill="#D2B48C"/>
            </g>
        </svg>
    `
};

function getInstrumentSvg(type) {
    return INSTRUMENT_SVGS[type] || '';
}

// --- Utilities & State ---
let currentSet = {
    title: "Mon Set Mix",
    tracks: []
};

let savedSets = [];
let libraryTracks = [];
let editingTrackId = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    populateDurationDropdowns();
    loadSavedSetsFromStorage();
    initEventListeners();
    renderTracklist();
    renderSavedSets();
    renderLibrary();
    updateTotalDuration();
});

// --- Populate Duration Dropdowns ---
function populateDurationDropdowns() {
    const minSelect = document.getElementById("track-duration-min");
    const secSelect = document.getElementById("track-duration-sec");
    if (!minSelect || !secSelect) return;
    
    // Minutes: 0 to 59
    for (let i = 0; i < 60; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        if (i === 3) opt.selected = true; // default to 3 minutes
        minSelect.appendChild(opt);
    }
    
    // Seconds: 00 to 59
    for (let i = 0; i < 60; i++) {
        const opt = document.createElement("option");
        const valStr = String(i).padStart(2, '0');
        opt.value = i;
        opt.textContent = valStr;
        if (i === 30) opt.selected = true; // default to 30 seconds
        secSelect.appendChild(opt);
    }
}

// --- Time Parsing & Formatting ---

function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    timeStr = timeStr.trim();
    const parts = timeStr.split(':').map(p => p.trim());
    
    if (parts.length === 1) {
        const val = parseInt(parts[0], 10);
        if (isNaN(val)) return 0;
        return val < 60 ? val * 60 : val;
    }
    
    if (parts.length === 2) {
        const min = parseInt(parts[0], 10) || 0;
        const sec = parseInt(parts[1], 10) || 0;
        return (min * 60) + sec;
    }
    
    if (parts.length === 3) {
        const hrs = parseInt(parts[0], 10) || 0;
        const min = parseInt(parts[1], 10) || 0;
        const sec = parseInt(parts[2], 10) || 0;
        return (hrs * 3600) + (min * 60) + sec;
    }
    
    return 0;
}

function formatSecondsToTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function formatTrackDuration(totalSeconds) {
    if (!totalSeconds) return "00:00";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    if (hrs > 0) {
        return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
}

// --- Local Storage Management ---

function saveSavedSetsToStorage() {
    localStorage.setItem("setlist_saved_sets", JSON.stringify(savedSets));
}

function saveLibraryToStorage() {
    localStorage.setItem("setlist_library_tracks", JSON.stringify(libraryTracks));
}

function loadSavedSetsFromStorage() {
    const stored = localStorage.getItem("setlist_saved_sets");
    if (stored) {
        try { savedSets = JSON.parse(stored); } catch (e) { savedSets = []; }
    }
    
    const storedLib = localStorage.getItem("setlist_library_tracks");
    if (storedLib) {
        try { libraryTracks = JSON.parse(storedLib); } catch (e) { libraryTracks = []; }
    } else {
        // Default base library songs
        libraryTracks = [
            { title: "Gold Digger", duration: 185, capo: "" },
            { title: "The Fog", duration: 210, capo: "" },
            { title: "Agave Americana", duration: 165, capo: "" },
            { title: "Wagon Wheel (cover)", duration: 245, capo: "" },
            { title: "Leave It All Behind", duration: 220, capo: "" },
            { title: "The Witch", duration: 195, capo: "" },
            { title: "The Fortunate Ones", duration: 202, capo: "" },
            { title: "Will the Circle Be Unbroken (cover)", duration: 280, capo: "" },
            { title: "A New Rider in Town", duration: 175, capo: "" },
            { title: "The Boy Who Wouldn't Hoe Corn (cover)", duration: 260, capo: "" },
            { title: "Bloody Sunrise", duration: 230, capo: "" },
            { title: "The Cowboy's Soul", duration: 198, capo: "" },
            { title: "This Train Is Bound For Glory (cover)", duration: 245, capo: "" },
            { title: "A Man of a Constant Sorrow (cover)", duration: 250, capo: "" }
        ];
        saveLibraryToStorage();
    }
    
    const storedCurrent = localStorage.getItem("setlist_current_set");
    if (storedCurrent) {
        try {
            currentSet = JSON.parse(storedCurrent);
            const titleInput = document.getElementById("current-set-title");
            if (titleInput && currentSet.title) {
                titleInput.value = currentSet.title;
            }
        } catch (e) {
            console.error("Error parsing current set", e);
        }
    }
}

function persistCurrentWork() {
    localStorage.setItem("setlist_current_set", JSON.stringify(currentSet));
}

// --- Toast Notifications ---

function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    let icon = '✔️';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 3000);
}

// --- Library Management ---

function addTrackToLibrary(title, duration, capo) {
    const cleanTitle = title.trim();
    const exists = libraryTracks.some(t => t.title.toLowerCase() === cleanTitle.toLowerCase());
    if (!exists) {
        libraryTracks.push({
            title: cleanTitle,
            duration: duration,
            capo: capo ? capo.trim() : ""
        });
        libraryTracks.sort((a, b) => a.title.localeCompare(b.title));
        saveLibraryToStorage();
        renderLibrary();
        showToast(`"${cleanTitle}" créé et ajouté à la bibliothèque`);
    } else {
        showToast(`Un morceau nommé "${cleanTitle}" existe déjà dans la bibliothèque`, "error");
    }
}

function deleteTrackFromLibrary(title) {
    const idx = libraryTracks.findIndex(t => t.title.toLowerCase() === title.toLowerCase());
    if (idx !== -1) {
        libraryTracks.splice(idx, 1);
        saveLibraryToStorage();
        renderLibrary();
        showToast("Morceau retiré de la bibliothèque", "info");
    }
}

function renderLibrary(filterQuery = "") {
    const container = document.getElementById("library-list");
    container.innerHTML = "";
    
    const filtered = libraryTracks.filter(t => 
        t.title.toLowerCase().includes(filterQuery.toLowerCase())
    );
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.9rem;">
                Aucun morceau trouvé.
            </div>
        `;
        return;
    }
    
    filtered.forEach(track => {
        const item = document.createElement("div");
        item.className = "set-item library-item";
        item.setAttribute("draggable", "true");
        item.dataset.title = track.title;
        
        // Setup library item dragstart
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('application/json', JSON.stringify({
                source: 'library',
                title: track.title,
                duration: track.duration,
                capo: track.capo
            }));
            item.style.opacity = '0.5';
        });
        
        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
        });
        
        let capoBadge = "";
        if (track.capo) {
            capoBadge = ` <span style="font-size: 0.75rem; background: rgba(99, 102, 241, 0.15); color: var(--accent-indigo); padding: 2px 5px; border-radius: 4px;">Capo ${track.capo}</span>`;
        }

        item.innerHTML = `
            <div class="set-item-info" style="flex: 1; min-width: 0; pointer-events: none;">
                <span class="set-item-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</span>
                <span class="set-item-meta">${formatTrackDuration(track.duration)}${capoBadge}</span>
            </div>
            <div style="display: flex; gap: 0.25rem;">
                <button class="action-btn add-to-set-from-lib-btn" data-title="${escapeHtml(track.title)}" title="Ajouter à la setlist" style="color: var(--success);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button class="action-btn delete-from-lib-btn" data-title="${escapeHtml(track.title)}" title="Supprimer de la bibliothèque" style="color: var(--text-muted);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

// --- Active Setlist Logic ---

function addTrackToSetlist(title, duration, capo, atIndex = null) {
    const newTrack = {
        id: 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title: title,
        duration: duration,
        capo: capo ? capo.toString().trim() : "",
        enabled: true
    };
    
    if (atIndex !== null) {
        currentSet.tracks.splice(atIndex, 0, newTrack);
    } else {
        currentSet.tracks.push(newTrack);
    }
    
    persistCurrentWork();
    renderTracklist();
    updateTotalDuration();
    showToast(`"${newTrack.title}" ajouté à la setlist`);
}

function addSeparator() {
    const newSeparator = {
        id: 'separator_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        isSeparator: true,
        enabled: true
    };
    
    currentSet.tracks.push(newSeparator);
    persistCurrentWork();
    renderTracklist();
    showToast("Séparateur ajouté");
}

function addTuningItem(instrument) {
    const newTuning = {
        id: 'tuning_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        isTuning: true,
        instrument: instrument,
        enabled: true
    };
    
    currentSet.tracks.push(newTuning);
    persistCurrentWork();
    renderTracklist();
    
    const emojiMap = { banjo: "🪕", guitar: "🎸", mandolin: "🪕", bass: "🎸", violin: "🎻" };
    showToast(`Accordage ${emojiMap[instrument]} ajouté`);
}

function deleteTrack(id) {
    const index = currentSet.tracks.findIndex(t => t.id === id);
    if (index !== -1) {
        const item = currentSet.tracks[index];
        let label = `"${item.title}"`;
        if (item.isSeparator) label = "Séparateur";
        if (item.isTuning) label = "Accordage";
        
        const el = document.getElementById(id);
        if (el) {
            el.classList.add("fade-out");
            el.addEventListener("transitionend", () => {
                currentSet.tracks.splice(index, 1);
                persistCurrentWork();
                renderTracklist();
                updateTotalDuration();
                showToast(`${label} supprimé`);
            });
        } else {
            currentSet.tracks.splice(index, 1);
            persistCurrentWork();
            renderTracklist();
            updateTotalDuration();
            showToast(`${label} supprimé`);
        }
    }
}

function toggleTrack(id, isEnabled) {
    const track = currentSet.tracks.find(t => t.id === id);
    if (track) {
        track.enabled = isEnabled;
        persistCurrentWork();
        
        const el = document.getElementById(id);
        if (el) {
            if (isEnabled) el.classList.remove("disabled");
            else el.classList.add("disabled");
        }
        
        updateTotalDuration();
    }
}

function updateTrackInline(id, fields) {
    const track = currentSet.tracks.find(t => t.id === id);
    if (track) {
        if (fields.title) track.title = fields.title.trim();
        if (fields.capo !== undefined) track.capo = fields.capo.trim();
        if (fields.durationStr) {
            const secs = parseTimeToSeconds(fields.durationStr);
            if (secs > 0) {
                track.duration = secs;
            }
        }
        
        persistCurrentWork();
        renderTracklist();
        updateTotalDuration();
        showToast("Morceau mis à jour");
    }
}

function updateTotalDuration() {
    let totalSeconds = 0;
    let activeCount = 0;
    let trackCount = 0;
    
    currentSet.tracks.forEach(t => {
        if (!t.isSeparator && !t.isTuning) {
            trackCount++;
            if (t.enabled) {
                totalSeconds += t.duration;
                activeCount++;
            }
        }
    });
    
    const digits = document.getElementById("timer-digits");
    digits.textContent = formatSecondsToTime(totalSeconds);
    
    const badge = document.getElementById("track-count-badge");
    if (trackCount === 0) {
        badge.textContent = "0 morceaux";
    } else {
        badge.textContent = `${activeCount}/${trackCount} actif${activeCount > 1 ? 's' : ''}`;
    }
}

// --- UI Rendering ---

function renderTracklist() {
    const container = document.getElementById("tracklist");
    container.innerHTML = "";
    
    if (currentSet.tracks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">🎵</span>
                <p>Aucun morceau dans ce set pour le moment.</p>
                <p style="font-size: 0.85rem; color: var(--text-secondary);">Glissez des morceaux depuis la bibliothèque ou chargez la démo pour commencer !</p>
            </div>
        `;
        return;
    }
    
    currentSet.tracks.forEach((track, index) => {
        const isEditing = editingTrackId === track.id;
        const card = document.createElement("div");
        card.id = track.id;
        card.setAttribute("draggable", "true");
        card.dataset.index = index;
        
        setupDragAndDropEvents(card);
        
        // --- Render Separator ---
        if (track.isSeparator) {
            card.className = `track-card separator-card`;
            card.innerHTML = `
                <div class="track-drag" title="Glisser pour réordonner" style="margin-right: 0.5rem;">
                    <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
                    <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
                </div>
                <span>[ Séparateur horizontal ]</span>
                <div class="separator-line"></div>
                <div class="track-actions">
                    <button class="action-btn delete delete-track-btn" data-id="${track.id}" title="Supprimer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            container.appendChild(card);
            return;
        }
        
        // --- Render Tuning Item ---
        if (track.isTuning) {
            const emojiMap = { banjo: "🪕", guitar: "🎸", mandolin: "🪕", bass: "🎸", violin: "🎻" };
            const instrumentLabel = track.instrument.toUpperCase();
            card.className = `track-card separator-card`;
            card.style.borderColor = "rgba(245, 158, 11, 0.25)";
            card.innerHTML = `
                <div class="track-drag" title="Glisser pour réordonner" style="margin-right: 0.5rem;">
                    <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
                    <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
                </div>
                <span style="color: var(--warning); display: flex; align-items: center; gap: 0.5rem;">
                    ${getInstrumentSvg(track.instrument)}
                    <strong>ACCORDAGE : ${instrumentLabel} ${emojiMap[track.instrument]}</strong>
                </span>
                <div class="separator-line" style="border-top-color: rgba(245, 158, 11, 0.2);"></div>
                <div class="track-actions">
                    <button class="action-btn delete delete-track-btn" data-id="${track.id}" title="Supprimer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            const svg = card.querySelector('svg');
            if (svg) {
                svg.style.width = '18px';
                svg.style.height = '18px';
                svg.style.marginRight = '0';
            }
            container.appendChild(card);
            return;
        }
        
        // --- Render Regular Song ---
        card.className = `track-card ${track.enabled ? '' : 'disabled'}`;
        
        const capoBadge = track.capo
            ? `<span style="font-size: 0.75rem; background: rgba(99, 102, 241, 0.15); color: var(--accent-indigo); padding: 2px 6px; border-radius: 4px; margin-left: 0.5rem; font-weight: 600;">Capo ${track.capo}</span>`
            : '';
        
        const cardContent = isEditing ? 
            // EDIT MODE
            `
            <div class="track-drag" title="Faire glisser pour réordonner">
                <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
                <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
                <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
            </div>
            <div class="track-details" style="gap: 0.35rem;">
                <input type="text" id="edit-title-${track.id}" class="track-edit-input" value="${escapeHtml(track.title)}" placeholder="Titre">
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="edit-duration-${track.id}" class="track-edit-input" value="${formatTrackDuration(track.duration)}" placeholder="Durée (ex: 3:30)" style="flex: 1;">
                    <input type="text" id="edit-capo-${track.id}" class="track-edit-input" value="${escapeHtml(track.capo)}" placeholder="Capo (ex: 2)" style="flex: 0.8;">
                </div>
            </div>
            <div class="track-actions">
                <button class="action-btn save-edit-btn" data-id="${track.id}" title="Enregistrer" style="color: var(--success);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button class="action-btn cancel-edit-btn" title="Annuler" style="color: var(--text-muted);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            ` :
            // DISPLAY MODE
            `
            <div class="track-drag" title="Faire glisser pour réordonner">
                <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
                <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
                <div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div>
            </div>
            
            <label class="checkbox-container">
                <input type="checkbox" class="track-toggle" data-id="${track.id}" ${track.enabled ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
            
            <div class="track-details">
                <div class="track-title" title="${escapeHtml(track.title)}" style="display: flex; align-items: center; gap: 0.25rem;">
                    <span>${escapeHtml(track.title)}</span>
                    ${capoBadge}
                </div>
            </div>
            
            <div class="track-duration-badge">
                ${formatTrackDuration(track.duration)}
            </div>
            
            <div class="track-actions">
                <div style="display: flex; flex-direction: column; justify-content: center; gap: 2px;">
                    <button class="action-btn order-up" data-id="${track.id}" title="Monter" style="padding: 0.1rem; height: 16px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                    <button class="action-btn order-down" data-id="${track.id}" title="Descendre" style="padding: 0.1rem; height: 16px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </div>
                <button class="action-btn edit-track-btn" data-id="${track.id}" title="Modifier">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
                </button>
                <button class="action-btn delete delete-track-btn" data-id="${track.id}" title="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
            `;
            
        card.innerHTML = cardContent;
        container.appendChild(card);
    });
}

function renderSavedSets() {
    const container = document.getElementById("saved-sets-list");
    container.innerHTML = "";
    
    if (savedSets.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 2rem 0; font-size: 0.9rem;">
                Aucun set sauvegardé.
            </div>
        `;
        return;
    }
    
    savedSets.forEach(set => {
        const item = document.createElement("div");
        item.className = "set-item";
        item.dataset.id = set.id;
        
        const totalSecs = set.tracks.reduce((acc, t) => acc + ((!t.isSeparator && !t.isTuning && t.enabled) ? t.duration : 0), 0);
        const count = set.tracks.filter(t => !t.isSeparator && !t.isTuning).length;
        
        item.innerHTML = `
            <div class="set-item-info">
                <span class="set-item-name">${escapeHtml(set.title)}</span>
                <span class="set-item-meta">${count} morceaux • ${formatSecondsToTime(totalSecs)}</span>
            </div>
            <div style="display: flex; gap: 0.25rem;">
                <button class="action-btn load-set-btn" data-id="${set.id}" title="Charger ce set" style="color: var(--accent-cyan);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button class="action-btn delete delete-set-btn" data-id="${set.id}" title="Supprimer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

// --- Drag and Drop Handling (Global) ---

let dragSrcEl = null;

function setupDragAndDropEvents(el) {
    el.addEventListener('dragstart', (e) => {
        el.style.opacity = '0.4';
        dragSrcEl = el;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            source: 'setlist',
            index: el.dataset.index
        }));
    });
    
    el.addEventListener('dragend', () => {
        el.style.opacity = '1';
        const cards = document.querySelectorAll('.track-card');
        cards.forEach(c => c.style.borderTop = '');
    });
    
    el.addEventListener('dragover', (e) => {
        if (e.preventDefault) e.preventDefault();
        return false;
    });
    
    el.addEventListener('dragenter', (e) => {
        if (el !== dragSrcEl) {
            el.style.borderTop = '2px solid var(--accent-indigo)';
        }
    });
    
    el.addEventListener('dragleave', () => {
        el.style.borderTop = '';
    });
    
    el.addEventListener('drop', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        let data = {};
        try {
            data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
        } catch(err) { return; }
        
        const toIndex = parseInt(el.dataset.index, 10);
        
        if (data.source === 'library') {
            // Dragged from Library -> Insert in Setlist
            addTrackToSetlist(data.title, data.duration, data.capo, toIndex);
        } else if (data.source === 'setlist') {
            // Dragged within Setlist -> Reorder
            const fromIndex = parseInt(data.index, 10);
            if (fromIndex !== toIndex) {
                const temp = currentSet.tracks[fromIndex];
                currentSet.tracks.splice(fromIndex, 1);
                currentSet.tracks.splice(toIndex, 0, temp);
                
                persistCurrentWork();
                renderTracklist();
                updateTotalDuration();
            }
        }
        
        const cards = document.querySelectorAll('.track-card');
        cards.forEach(c => c.style.borderTop = '');
        return false;
    });
}

// --- Event Listeners Init ---

function initEventListeners() {
    // Current Set Title Change
    const titleInput = document.getElementById("current-set-title");
    titleInput.addEventListener("input", (e) => {
        currentSet.title = e.target.value || "Set sans nom";
        persistCurrentWork();
    });
    
    // Add Track Form Submit -> Adds to Library ONLY
    const form = document.getElementById("add-track-form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const titleVal = document.getElementById("track-title").value;
        
        // Read minutes & seconds dropdowns
        const mins = parseInt(document.getElementById("track-duration-min").value, 10) || 0;
        const secs = parseInt(document.getElementById("track-duration-sec").value, 10) || 0;
        const durationSeconds = (mins * 60) + secs;
        
        const capoVal = document.getElementById("track-capo").value;
        
        addTrackToLibrary(titleVal, durationSeconds, capoVal);
        form.reset();
        document.getElementById("track-title").focus();
    });
    
    // Add Separator Button
    document.getElementById("add-separator-btn").addEventListener("click", () => {
        addSeparator();
    });
    
    // Add Tuning Button
    document.getElementById("add-tuning-btn").addEventListener("click", () => {
        const instrument = document.getElementById("tuning-select").value;
        addTuningItem(instrument);
    });
    
    // Search library
    document.getElementById("library-search").addEventListener("input", (e) => {
        renderLibrary(e.target.value);
    });
    
    // Drop listener on empty tracklist container to support dropping library items at the end
    const tracklistContainer = document.getElementById("tracklist");
    tracklistContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
    });
    tracklistContainer.addEventListener("drop", (e) => {
        if (e.target === tracklistContainer || tracklistContainer.querySelector('.empty-state')) {
            let data = {};
            try {
                data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
            } catch(err) { return; }
            
            if (data.source === 'library') {
                addTrackToSetlist(data.title, data.duration, data.capo);
            }
        }
    });
    
    // Left Library click delegation (Add / Delete)
    const libraryContainer = document.getElementById("library-list");
    libraryContainer.addEventListener("click", (e) => {
        const target = e.target;
        const addBtn = target.closest(".add-to-set-from-lib-btn");
        const deleteBtn = target.closest(".delete-from-lib-btn");
        
        if (addBtn) {
            const songName = addBtn.dataset.title;
            const song = libraryTracks.find(t => t.title.toLowerCase() === songName.toLowerCase());
            if (song) {
                addTrackToSetlist(song.title, song.duration, song.capo);
            }
        } else if (deleteBtn) {
            const songName = deleteBtn.dataset.title;
            if (confirm(`Voulez-vous supprimer "${songName}" de votre bibliothèque définitivement ?`)) {
                deleteTrackFromLibrary(songName);
            }
        }
    });
    
    // Dynamic Click Listeners inside Tracklist (using Event Delegation)
    const tracklist = document.getElementById("tracklist");
    tracklist.addEventListener("click", (e) => {
        const target = e.target;
        const deleteBtn = target.closest(".delete-track-btn");
        const editBtn = target.closest(".edit-track-btn");
        const saveEditBtn = target.closest(".save-edit-btn");
        const cancelEditBtn = target.closest(".cancel-edit-btn");
        const checkbox = target.closest(".track-toggle");
        const orderUpBtn = target.closest(".order-up");
        const orderDownBtn = target.closest(".order-down");
        
        if (deleteBtn) {
            deleteTrack(deleteBtn.dataset.id);
        } else if (editBtn) {
            editingTrackId = editBtn.dataset.id;
            renderTracklist();
        } else if (saveEditBtn) {
            const id = saveEditBtn.dataset.id;
            const newTitle = document.getElementById(`edit-title-${id}`).value;
            const newDuration = document.getElementById(`edit-duration-${id}`).value;
            const newCapo = document.getElementById(`edit-capo-${id}`).value;
            
            editingTrackId = null;
            updateTrackInline(id, {
                title: newTitle,
                durationStr: newDuration,
                capo: newCapo
            });
        } else if (cancelEditBtn) {
            editingTrackId = null;
            renderTracklist();
        } else if (checkbox) {
            toggleTrack(checkbox.dataset.id, checkbox.checked);
        } else if (orderUpBtn) {
            const id = orderUpBtn.dataset.id;
            moveTrackOrder(id, -1);
        } else if (orderDownBtn) {
            const id = orderDownBtn.dataset.id;
            moveTrackOrder(id, 1);
        }
    });
    
    function moveTrackOrder(id, direction) {
        const index = currentSet.tracks.findIndex(t => t.id === id);
        if (index === -1) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= currentSet.tracks.length) return;
        
        const temp = currentSet.tracks[index];
        currentSet.tracks[index] = currentSet.tracks[targetIndex];
        currentSet.tracks[targetIndex] = temp;
        persistCurrentWork();
        renderTracklist();
    }
    
    // Load Demo Button (Matches the PDF provided!)
    document.getElementById("load-demo-btn").addEventListener("click", () => {
        loadDemoData();
    });
    
    // Reset Set Button
    document.getElementById("reset-set-btn").addEventListener("click", () => {
        if (confirm("Effacer tous les morceaux du set actuel ?")) {
            currentSet.tracks = [];
            currentSet.title = "Mon Set Mix";
            document.getElementById("current-set-title").value = currentSet.title;
            persistCurrentWork();
            renderTracklist();
            updateTotalDuration();
            showToast("Setlist réinitialisée", "info");
        }
    });
    
    // Print PDF Button
    document.getElementById("print-pdf-btn").addEventListener("click", () => {
        generateAndPrintPDF();
    });
    
    // Save Modal Events
    const saveModal = document.getElementById("save-modal");
    const saveNameInput = document.getElementById("save-set-name");
    
    document.getElementById("save-current-set-btn").addEventListener("click", () => {
        if (currentSet.tracks.length === 0) {
            showToast("Set vide !", "error");
            return;
        }
        saveNameInput.value = currentSet.title;
        saveModal.classList.add("active");
        saveNameInput.focus();
        saveNameInput.select();
    });
    
    document.getElementById("cancel-save-btn").addEventListener("click", () => {
        saveModal.classList.remove("active");
    });
    
    document.getElementById("confirm-save-btn").addEventListener("click", () => {
        const name = saveNameInput.value.trim() || "Set sans nom";
        saveCurrentSet(name);
        saveModal.classList.remove("active");
    });
    
    // Saved Sets Actions (Load / Delete)
    const savedSetsContainer = document.getElementById("saved-sets-list");
    savedSetsContainer.addEventListener("click", (e) => {
        const target = e.target;
        const loadBtn = target.closest(".load-set-btn");
        const deleteBtn = target.closest(".delete-set-btn");
        if (loadBtn) {
            loadSavedSet(loadBtn.dataset.id);
        } else if (deleteBtn) {
            deleteSavedSet(deleteBtn.dataset.id);
        }
    });
    
    // Export / Import
    document.getElementById("export-sets-btn").addEventListener("click", () => {
        exportSetsToJson();
    });
    
    const fileInput = document.getElementById("import-file-input");
    document.getElementById("trigger-import-btn").addEventListener("click", () => {
        fileInput.click();
    });
    fileInput.addEventListener("change", (e) => {
        importSetsFromJson(e);
    });
}

// --- Demo Data ---
// Exactly matches the user's PDF screenshot!
function loadDemoData() {
    currentSet.title = "Bluegrass Live Set 🪕";
    document.getElementById("current-set-title").value = currentSet.title;
    
    // NOTE: Guitar tuning item is placed BEFORE "A Man of a Constant Sorrow"
    // Banjo tunings are placed BEFORE their respective songs so they render next to them!
    currentSet.tracks = [
        { id: "pdf_1", title: "Gold Digger", duration: 185, capo: "", enabled: true },
        { id: "pdf_2", title: "The Fog", duration: 210, capo: "", enabled: true },
        { id: "pdf_3", title: "Agave Americana", duration: 165, capo: "", enabled: true },
        { id: "pdf_4", title: "Wagon Wheel (cover)", duration: 245, capo: "", enabled: true },
        { id: "pdf_5", title: "Leave It All Behind", duration: 220, capo: "", enabled: true },
        { id: "pdf_tuning_1", isTuning: true, instrument: "banjo", enabled: true },
        { id: "pdf_6", title: "The Witch", duration: 195, capo: "", enabled: true },
        { id: "pdf_tuning_2", isTuning: true, instrument: "banjo", enabled: true },
        { id: "pdf_7", title: "The Fortunate Ones", duration: 202, capo: "", enabled: true },
        { id: "pdf_8", title: "Will the Circle Be Unbroken (cover)", duration: 280, capo: "", enabled: true },
        { id: "pdf_9", title: "A New Rider in Town", duration: 175, capo: "", enabled: true },
        { id: "pdf_10", title: "The Boy Who Wouldn't Hoe Corn (cover)", duration: 260, capo: "", enabled: true },
        { id: "pdf_tuning_3", isTuning: true, instrument: "banjo", enabled: true },
        { id: "pdf_11", title: "Bloody Sunrise", duration: 230, capo: "", enabled: true },
        { id: "pdf_12", title: "The Cowboy's Soul", duration: 198, capo: "", enabled: true },
        { id: "pdf_13", title: "This Train Is Bound For Glory (cover)", duration: 245, capo: "", enabled: true },
        { id: "pdf_14", isSeparator: true, enabled: true },
        { id: "pdf_tuning_4", isTuning: true, instrument: "guitar", enabled: true },
        { id: "pdf_15", title: "A Man of a Constant Sorrow (cover)", duration: 250, capo: "", enabled: true }
    ];
    
    // Add all to library (avoiding duplicate names)
    currentSet.tracks.forEach(track => {
        if (!track.isSeparator && !track.isTuning) {
            addTrackToLibrary(track.title, track.duration, track.capo);
        }
    });
    
    persistCurrentWork();
    renderTracklist();
    updateTotalDuration();
    showToast("Setlist démo (identique au PDF) chargée ! 🪕🎸", "info");
}

// --- Set Saving Logic ---

function saveCurrentSet(name) {
    const setHash = 'set_' + Date.now();
    const setCopy = {
        id: setHash,
        title: name,
        tracks: JSON.parse(JSON.stringify(currentSet.tracks))
    };
    
    const existingIndex = savedSets.findIndex(s => s.title.toLowerCase() === name.toLowerCase());
    if (existingIndex !== -1) {
        if (confirm(`Le set "${name}" existe déjà. Remplacer ?`)) {
            savedSets[existingIndex] = setCopy;
            showToast(`"${name}" mis à jour`);
        } else {
            return;
        }
    } else {
        savedSets.unshift(setCopy);
        showToast(`Set "${name}" sauvegardé`);
    }
    
    saveSavedSetsToStorage();
    renderSavedSets();
}

function loadSavedSet(id) {
    const set = savedSets.find(s => s.id === id);
    if (set) {
        currentSet.title = set.title;
        currentSet.tracks = JSON.parse(JSON.stringify(set.tracks));
        document.getElementById("current-set-title").value = currentSet.title;
        persistCurrentWork();
        renderTracklist();
        updateTotalDuration();
        
        currentSet.tracks.forEach(t => {
            if (!t.isSeparator && !t.isTuning) {
                addTrackToLibrary(t.title, t.duration, t.capo);
            }
        });
        
        showToast(`Set "${set.title}" chargé`);
    }
}

// --- PDF Generation & Printing ---

function generateAndPrintPDF() {
    const printContainer = document.getElementById("printable-setlist");
    if (!printContainer) return;
    
    if (currentSet.tracks.length === 0) {
        showToast("Le setlist est vide. Rien à imprimer !", "error");
        return;
    }
    
    let html = `<div class="print-setlist">`;
    let pendingInstruments = [];
    
    currentSet.tracks.forEach(track => {
        if (track.isSeparator) {
            if (pendingInstruments.length > 0) {
                pendingInstruments.forEach(inst => {
                    html += `<div class="print-item-row tuning-row" style="min-height: 40px; margin: 4px 0;">`;
                    if (inst === 'banjo' || inst === 'mandolin') {
                        html += `<div class="print-instrument left">${getInstrumentSvg(inst)}</div>`;
                    } else {
                        html += `<div class="print-instrument right">${getInstrumentSvg(inst)}</div>`;
                    }
                    html += `</div>`;
                });
                pendingInstruments = [];
            }
            html += `<div class="print-divider-line"></div>`;
        } else if (track.isTuning && track.enabled) {
            pendingInstruments.push(track.instrument);
        } else if (track.enabled) {
            let leftInstrumentsHtml = "";
            let rightInstrumentsHtml = "";
            
            pendingInstruments.forEach(inst => {
                if (inst === 'banjo' || inst === 'mandolin') {
                    leftInstrumentsHtml += `<div class="print-instrument left">${getInstrumentSvg(inst)}</div>`;
                } else {
                    rightInstrumentsHtml += `<div class="print-instrument right">${getInstrumentSvg(inst)}</div>`;
                }
            });
            
            pendingInstruments = [];
            
            html += `<div class="print-item-row">`;
            html += leftInstrumentsHtml;
            
            let displayTitle = track.title;
            if (track.capo) {
                displayTitle += ` (capo ${track.capo})`;
            }
            
            html += `<span class="print-track-name">${escapeHtml(displayTitle)}</span>`;
            html += rightInstrumentsHtml;
            html += `</div>`;
        }
    });
    
    if (pendingInstruments.length > 0) {
        pendingInstruments.forEach(inst => {
            html += `<div class="print-item-row tuning-row" style="min-height: 40px; margin: 4px 0;">`;
            if (inst === 'banjo' || inst === 'mandolin') {
                html += `<div class="print-instrument left">${getInstrumentSvg(inst)}</div>`;
            } else {
                html += `<div class="print-instrument right">${getInstrumentSvg(inst)}</div>`;
            }
            html += `</div>`;
        });
    }
    
    html += `</div>`;
    printContainer.innerHTML = html;
    
    // Trigger Print
    window.print();
}

// --- Import & Export (JSON) ---

function exportSetsToJson() {
    if (savedSets.length === 0 && currentSet.tracks.length === 0) {
        showToast("Rien à exporter.", "error");
        return;
    }
    const dataStr = JSON.stringify({
        currentSet: currentSet,
        savedSets: savedSets,
        libraryTracks: libraryTracks,
        version: "5.0",
        exportedAt: new Date().toISOString()
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `setlist_timer_export_v5.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast("Exportation réussie");
}

function importSetsFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.savedSets && Array.isArray(importedData.savedSets)) {
                if (confirm("Fusionner les sets avec vos sauvegardes existantes ? (Annuler pour écraser)")) {
                    importedData.savedSets.forEach(newSet => {
                        const idx = savedSets.findIndex(s => s.title.toLowerCase() === newSet.title.toLowerCase());
                        if (idx !== -1) savedSets[idx] = newSet;
                        else savedSets.push(newSet);
                    });
                } else {
                    savedSets = importedData.savedSets;
                }
                
                if (importedData.libraryTracks && Array.isArray(importedData.libraryTracks)) {
                    importedData.libraryTracks.forEach(newTrack => {
                        const exists = libraryTracks.some(t => t.title.toLowerCase() === newTrack.title.toLowerCase());
                        if (!exists) libraryTracks.push(newTrack);
                    });
                    libraryTracks.sort((a, b) => a.title.localeCompare(b.title));
                    saveLibraryToStorage();
                    renderLibrary();
                }
                
                if (importedData.currentSet && importedData.currentSet.tracks) {
                    if (confirm("Charger le set actif inclus dans le fichier ?")) {
                        currentSet = importedData.currentSet;
                        document.getElementById("current-set-title").value = currentSet.title;
                        persistCurrentWork();
                        renderTracklist();
                    }
                }
                
                saveSavedSetsToStorage();
                renderSavedSets();
                updateTotalDuration();
                showToast("Importation réussie !");
            } else {
                showToast("Fichier JSON invalide.", "error");
            }
        } catch (err) {
            showToast("Erreur de lecture.", "error");
        }
        event.target.value = "";
    };
    reader.readAsText(file);
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
