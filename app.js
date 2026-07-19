// ============================================================
// FIREBASE IMPORTS & INIT
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBux5iisFYcNSuGJtEFh8-AM_MsaaYHac4",
    authDomain: "setlisttimer.firebaseapp.com",
    projectId: "setlisttimer",
    storageBucket: "setlisttimer.firebasestorage.app",
    messagingSenderId: "749879199315",
    appId: "1:749879199315:web:15b418a45ef831ccbda8a6"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Firestore unsubscribe handles
let unsubLibrary = null;
let unsubSavedSets = null;

// ============================================================
// INSTRUMENT SVGs
// ============================================================
const INSTRUMENT_SVGS = {
    banjo: `<svg class="instrument-icon" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="47" y="10" width="6" height="55" fill="#8B5A2B" rx="1"/><rect x="45" y="5" width="10" height="8" fill="#5C3A21" rx="2"/><circle cx="43" cy="7" r="1.5" fill="#A8A8A8"/><circle cx="43" cy="11" r="1.5" fill="#A8A8A8"/><circle cx="57" cy="7" r="1.5" fill="#A8A8A8"/><circle cx="57" cy="11" r="1.5" fill="#A8A8A8"/><circle cx="50" cy="75" r="18" fill="#D2B48C" stroke="#5C3A21" stroke-width="3"/><circle cx="50" cy="75" r="14" fill="#F5F5DC"/><rect x="47" y="88" width="6" height="4" fill="#A8A8A8"/><line x1="44" y1="78" x2="56" y2="78" stroke="#5C3A21" stroke-width="2"/><line x1="48" y1="10" x2="48" y2="88" stroke="#E0E0E0" stroke-width="0.5"/><line x1="50" y1="10" x2="50" y2="88" stroke="#E0E0E0" stroke-width="0.5"/><line x1="52" y1="10" x2="52" y2="88" stroke="#E0E0E0" stroke-width="0.5"/></g></svg>`,
    guitar: `<svg class="instrument-icon" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="48" y="10" width="4" height="50" fill="#8B5A2B"/><polygon points="46,5 54,5 53,12 47,12" fill="#5C3A21"/><circle cx="50" cy="65" r="11" fill="#CD853F" stroke="#5C3A21" stroke-width="2"/><circle cx="50" cy="78" r="15" fill="#CD853F" stroke="#5C3A21" stroke-width="2"/><rect x="44" y="69" width="12" height="4" fill="#CD853F"/><circle cx="50" cy="69" r="4.5" fill="#2C1D11"/><rect x="45" y="82" width="10" height="2" fill="#5C3A21"/><line x1="49" y1="5" x2="49" y2="82" stroke="#E0E0E0" stroke-width="0.5"/><line x1="50" y1="5" x2="50" y2="82" stroke="#E0E0E0" stroke-width="0.5"/><line x1="51" y1="5" x2="51" y2="82" stroke="#E0E0E0" stroke-width="0.5"/></g></svg>`,
    mandolin: `<svg class="instrument-icon" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="48" y="15" width="4" height="45" fill="#8B5A2B"/><rect x="46" y="8" width="8" height="8" fill="#5C3A21" rx="1"/><path d="M 50,55 C 38,70 38,88 50,92 C 62,88 62,70 50,55 Z" fill="#A0522D" stroke="#5C3A21" stroke-width="2"/><circle cx="50" cy="70" r="3" fill="#2C1D11"/><rect x="46" y="82" width="8" height="2" fill="#5C3A21"/></g></svg>`,
    bass: `<svg class="instrument-icon" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="48.5" y="5" width="3" height="60" fill="#5C3A21"/><path d="M 44,60 C 32,65 35,88 50,90 C 65,88 68,65 56,60 C 53,57 47,57 44,60 Z" fill="#8B0000" stroke="#3A0000" stroke-width="2"/><rect x="46" y="70" width="8" height="2.5" fill="#1C1C1C" rx="0.5"/><rect x="46" y="75" width="8" height="2.5" fill="#1C1C1C" rx="0.5"/></g></svg>`,
    violin: `<svg class="instrument-icon" viewBox="0 0 100 100"><g transform="rotate(-45 50 50)"><rect x="49" y="10" width="2" height="48" fill="#5C3A21"/><circle cx="50" cy="7" r="3" fill="#5C3A21"/><path d="M 50,55 C 44,57 43,65 47,69 C 43,73 42,83 50,87 C 58,83 57,73 53,69 C 57,65 56,57 50,55 Z" fill="#B22222" stroke="#5C3A21" stroke-width="1.5"/><rect x="47" y="74" width="6" height="1.5" fill="#D2B48C"/></g></svg>`
};

function getInstrumentSvg(type) { return INSTRUMENT_SVGS[type] || ''; }

// ============================================================
// ENERGY LEVELS
// ============================================================
const ENERGY_LEVELS = {
    calme:     { color: "#10b981", label: "Calme" },
    rythme:    { color: "#f59e0b", label: "Rythmé" },
    dynamique: { color: "#ef4444", label: "Dynamique" }
};

function energyDot(energy) {
    const lvl = ENERGY_LEVELS[energy];
    if (!lvl) return "";
    return `<span class="energy-dot" style="background:${lvl.color};" title="Énergie : ${lvl.label}"></span>`;
}

function energySelectHtml(id, selected) {
    const opts = Object.entries(ENERGY_LEVELS)
        .map(([key, lvl]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${lvl.label}</option>`)
        .join('');
    return `<select id="${id}" class="track-edit-input"><option value="">Énergie : —</option>${opts}</select>`;
}

// ============================================================
// STATE
// ============================================================
let currentSet = { title: "Mon Set Mix", tracks: [] };
let savedSets = [];
let libraryTracks = [];
let editingTrackId = null;
let currentUserId = null;
let currentGroupName = "Groupe";

// ============================================================
// FIREBASE AUTH — Login / Register / Logout
// ============================================================
function initAuth() {
    // Login form
    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        setLoginLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            showLoginError(friendlyAuthError(err.code));
            setLoginLoading(false);
        }
    });

    // Register form
    document.getElementById("register-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const groupName = document.getElementById("register-group-name").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;
        setRegisterLoading(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: groupName });
        } catch (err) {
            showLoginError(friendlyAuthError(err.code));
            setRegisterLoading(false);
        }
    });

    // Toggle login/register views
    document.getElementById("show-register-btn").addEventListener("click", () => {
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("register-form").classList.remove("hidden");
        document.getElementById("login-error").classList.add("hidden");
    });
    document.getElementById("show-login-btn").addEventListener("click", () => {
        document.getElementById("register-form").classList.add("hidden");
        document.getElementById("login-form").classList.remove("hidden");
        document.getElementById("login-error").classList.add("hidden");
    });

    // Logout
    document.getElementById("logout-btn").addEventListener("click", async () => {
        if (confirm("Se déconnecter ?")) {
            if (unsubLibrary) unsubLibrary();
            if (unsubSavedSets) unsubSavedSets();
            await signOut(auth);
        }
    });

    // Auth state listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            currentGroupName = user.displayName || user.email.split("@")[0];
            document.getElementById("user-badge-name").textContent = currentGroupName;
            showApp();
            initApp();
        } else {
            currentUserId = null;
            showLoginScreen();
        }
    });
}

function showApp() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("app-hidden");
}

function showLoginScreen() {
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("app").classList.add("app-hidden");
    setLoginLoading(false);
    setRegisterLoading(false);
}

function setLoginLoading(loading) {
    document.getElementById("login-btn").disabled = loading;
    document.getElementById("login-btn-text").textContent = loading ? "Connexion..." : "Se connecter";
    document.getElementById("login-spinner").classList.toggle("hidden", !loading);
}

function setRegisterLoading(loading) {
    document.getElementById("register-btn").disabled = loading;
    document.getElementById("register-btn-text").textContent = loading ? "Création..." : "Créer le compte";
    document.getElementById("register-spinner").classList.toggle("hidden", !loading);
}

function showLoginError(msg) {
    const el = document.getElementById("login-error");
    el.textContent = msg;
    el.classList.remove("hidden");
}

function friendlyAuthError(code) {
    const map = {
        "auth/user-not-found": "Aucun compte trouvé avec cet email.",
        "auth/wrong-password": "Mot de passe incorrect.",
        "auth/invalid-email": "Adresse email invalide.",
        "auth/email-already-in-use": "Un compte existe déjà avec cet email.",
        "auth/weak-password": "Le mot de passe doit faire au moins 6 caractères.",
        "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
        "auth/invalid-credential": "Email ou mot de passe incorrect.",
    };
    return map[code] || "Une erreur est survenue. Vérifiez vos informations.";
}

// ============================================================
// FIRESTORE HELPERS
// ============================================================
function libraryRef() {
    return collection(db, "groups", currentUserId, "library");
}
function savedSetsRef() {
    return collection(db, "groups", currentUserId, "savedSets");
}

async function saveTrackToFirestore(track) {
    setSyncStatus("syncing");
    await setDoc(doc(libraryRef(), track.title), track);
    setSyncStatus("synced");
}

async function deleteTrackFromFirestore(title) {
    setSyncStatus("syncing");
    await deleteDoc(doc(libraryRef(), title));
    setSyncStatus("synced");
}

async function saveSavedSetToFirestore(set) {
    setSyncStatus("syncing");
    await setDoc(doc(savedSetsRef(), set.id), set);
    setSyncStatus("synced");
}

async function deleteSavedSetFromFirestore(id) {
    setSyncStatus("syncing");
    await deleteDoc(doc(savedSetsRef(), id));
    setSyncStatus("synced");
}

function setSyncStatus(status) {
    const icon = document.getElementById("sync-icon");
    const text = document.getElementById("sync-text");
    if (status === "syncing") {
        icon.textContent = "🔄";
        text.textContent = "Synchronisation...";
    } else {
        icon.textContent = "☁️";
        text.textContent = "Synchronisé";
    }
}

// Subscribe to library changes in real-time
function subscribeToLibrary() {
    if (unsubLibrary) unsubLibrary();
    unsubLibrary = onSnapshot(query(libraryRef()), (snapshot) => {
        libraryTracks = snapshot.docs.map(d => d.data());
        libraryTracks.sort((a, b) => a.title.localeCompare(b.title));
        renderLibrary();
    });
}

// Subscribe to saved sets changes in real-time
function subscribeToSavedSets() {
    if (unsubSavedSets) unsubSavedSets();
    unsubSavedSets = onSnapshot(query(savedSetsRef()), (snapshot) => {
        savedSets = snapshot.docs.map(d => d.data());
        savedSets.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        renderSavedSets();
    });
}

// ============================================================
// APP INIT (called after login)
// ============================================================
function initApp() {
    populateDurationDropdowns();
    loadCurrentSetFromLocal();
    initEventListeners();
    renderTracklist();
    updateTotalDuration();
    subscribeToLibrary();
    subscribeToSavedSets();
}

// ============================================================
// DURATION DROPDOWNS
// ============================================================
function populateDurationDropdowns() {
    const minSelect = document.getElementById("track-duration-min");
    const secSelect = document.getElementById("track-duration-sec");
    if (!minSelect || !secSelect || minSelect.options.length > 0) return;
    for (let i = 0; i < 60; i++) {
        const opt = document.createElement("option");
        opt.value = i; opt.textContent = i;
        if (i === 3) opt.selected = true;
        minSelect.appendChild(opt);
    }
    for (let i = 0; i < 60; i++) {
        const opt = document.createElement("option");
        opt.value = i; opt.textContent = String(i).padStart(2, '0');
        if (i === 30) opt.selected = true;
        secSelect.appendChild(opt);
    }
}

// ============================================================
// TIME HELPERS
// ============================================================
function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':').map(p => parseInt(p, 10) || 0);
    if (parts.length === 1) return parts[0] < 60 ? parts[0] * 60 : parts[0];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function formatSecondsToTime(s) {
    const pad = n => String(n).padStart(2, '0');
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function formatTrackDuration(s) {
    if (!s) return "00:00";
    const pad = n => String(n).padStart(2, '0');
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// ============================================================
// LOCAL STORAGE (current working set only)
// ============================================================
function loadCurrentSetFromLocal() {
    const stored = localStorage.getItem(`setlist_current_${currentUserId}`);
    if (stored) {
        try {
            currentSet = JSON.parse(stored);
            const titleInput = document.getElementById("current-set-title");
            if (titleInput && currentSet.title) titleInput.value = currentSet.title;
        } catch (e) { /* ignore */ }
    }
}

function persistCurrentWork() {
    localStorage.setItem(`setlist_current_${currentUserId}`, JSON.stringify(currentSet));
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icons = { success: '✔️', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || '✔️'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("fade-out");
        toast.addEventListener("animationend", () => toast.remove());
    }, 3000);
}

// ============================================================
// LIBRARY MANAGEMENT
// ============================================================
async function addTrackToLibrary(title, duration, capo, energy = "") {
    const cleanTitle = title.trim();
    const exists = libraryTracks.some(t => t.title.toLowerCase() === cleanTitle.toLowerCase());
    if (exists) {
        showToast(`"${cleanTitle}" existe déjà dans la bibliothèque`, "error");
        return;
    }
    const track = { title: cleanTitle, duration, capo: capo ? capo.trim() : "", energy: energy || "" };
    try {
        await saveTrackToFirestore(track);
        showToast(`"${cleanTitle}" ajouté à la bibliothèque ☁️`);
    } catch (err) {
        showToast("Erreur de sauvegarde. Vérifiez votre connexion.", "error");
    }
}

async function deleteTrackFromLibrary(title) {
    try {
        await deleteTrackFromFirestore(title);
        showToast("Morceau supprimé de la bibliothèque", "info");
    } catch (err) {
        showToast("Erreur de suppression.", "error");
    }
}

function renderLibrary(filterQuery = "") {
    const container = document.getElementById("library-list");
    container.innerHTML = "";
    const filtered = libraryTracks.filter(t =>
        t.title.toLowerCase().includes((filterQuery || "").toLowerCase())
    );
    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:2rem 0;font-size:0.9rem;">Aucun morceau trouvé.</div>`;
        return;
    }
    filtered.forEach(track => {
        const item = document.createElement("div");
        item.className = "set-item library-item";
        item.setAttribute("draggable", "true");
        item.dataset.title = track.title;
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('application/json', JSON.stringify({ source: 'library', title: track.title, duration: track.duration, capo: track.capo, energy: track.energy || "" }));
            item.style.opacity = '0.5';
        });
        item.addEventListener('dragend', () => { item.style.opacity = '1'; });
        const capoBadge = track.capo ? ` <span style="font-size:0.75rem;background:rgba(99,102,241,0.15);color:var(--accent-indigo);padding:2px 5px;border-radius:4px;">Capo ${track.capo}</span>` : '';
        item.innerHTML = `
            <div class="set-item-info" style="flex:1;min-width:0;pointer-events:none;">
                <span class="set-item-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(track.title)}">${energyDot(track.energy)}${escapeHtml(track.title)}</span>
                <span class="set-item-meta">${formatTrackDuration(track.duration)}${capoBadge}</span>
            </div>
            <div style="display:flex;gap:0.25rem;">
                <button class="action-btn add-to-set-from-lib-btn" data-title="${escapeHtml(track.title)}" title="Ajouter à la setlist" style="color:var(--success);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button class="action-btn delete-from-lib-btn" data-title="${escapeHtml(track.title)}" title="Supprimer" style="color:var(--text-muted);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>`;
        container.appendChild(item);
    });
}

// ============================================================
// SETLIST MANAGEMENT
// ============================================================
function addTrackToSetlist(title, duration, capo, energy = "", atIndex = null) {
    const newTrack = {
        id: 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title, duration,
        capo: capo ? capo.toString().trim() : "",
        energy: energy || "",
        enabled: true
    };
    if (atIndex !== null) currentSet.tracks.splice(atIndex, 0, newTrack);
    else currentSet.tracks.push(newTrack);
    persistCurrentWork();
    renderTracklist();
    updateTotalDuration();
    showToast(`"${newTrack.title}" ajouté à la setlist`);
}

function addSeparator() {
    currentSet.tracks.push({ id: 'sep_' + Date.now(), isSeparator: true, enabled: true });
    persistCurrentWork(); renderTracklist(); showToast("Séparateur ajouté");
}

function addTuningItem(instrument) {
    currentSet.tracks.push({ id: 'tune_' + Date.now(), isTuning: true, instrument, enabled: true });
    persistCurrentWork(); renderTracklist();
    const em = { banjo: "🪕", guitar: "🎸", mandolin: "🪕", bass: "🎸", violin: "🎻" };
    showToast(`Accordage ${em[instrument]} ajouté`);
}

function deleteTrack(id) {
    const index = currentSet.tracks.findIndex(t => t.id === id);
    if (index === -1) return;
    const item = currentSet.tracks[index];
    let label = item.isSeparator ? "Séparateur" : item.isTuning ? "Accordage" : `"${item.title}"`;
    currentSet.tracks.splice(index, 1);
    persistCurrentWork(); renderTracklist(); updateTotalDuration();
    showToast(`${label} supprimé`);
}

function toggleTrack(id, isEnabled) {
    const track = currentSet.tracks.find(t => t.id === id);
    if (track) { track.enabled = isEnabled; persistCurrentWork(); updateTotalDuration(); }
}

function updateTrackInline(id, fields) {
    const track = currentSet.tracks.find(t => t.id === id);
    if (!track) return;
    if (fields.title) track.title = fields.title.trim();
    if (fields.capo !== undefined) track.capo = fields.capo.trim();
    if (fields.energy !== undefined) track.energy = fields.energy;
    if (fields.durationStr) { const s = parseTimeToSeconds(fields.durationStr); if (s > 0) track.duration = s; }
    persistCurrentWork(); renderTracklist(); updateTotalDuration(); showToast("Morceau mis à jour");
}

function updateTotalDuration() {
    let total = 0, active = 0, count = 0;
    currentSet.tracks.forEach(t => {
        if (!t.isSeparator && !t.isTuning) {
            count++;
            if (t.enabled) { total += t.duration; active++; }
        }
    });
    document.getElementById("timer-digits").textContent = formatSecondsToTime(total);
    const badge = document.getElementById("track-count-badge");
    badge.textContent = count === 0 ? "0 morceaux" : `${active}/${count} actif${active > 1 ? 's' : ''}`;
}

// ============================================================
// RENDER TRACKLIST
// ============================================================
function renderTracklist() {
    const container = document.getElementById("tracklist");
    container.innerHTML = "";
    if (currentSet.tracks.length === 0) {
        container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🎵</span><p>Aucun morceau dans ce set.</p><p style="font-size:0.85rem;color:var(--text-secondary);">Glissez des morceaux depuis la bibliothèque !</p></div>`;
        return;
    }
    currentSet.tracks.forEach((track, index) => {
        const card = document.createElement("div");
        card.id = track.id;
        card.setAttribute("draggable", "true");
        card.dataset.index = index;
        setupDragAndDropEvents(card);

        if (track.isSeparator) {
            card.className = "track-card separator-card";
            card.innerHTML = `<div class="track-drag"><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div></div><span>[ Séparateur ]</span><div class="separator-line"></div><div class="track-actions"><button class="action-btn delete delete-track-btn" data-id="${track.id}" title="Supprimer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div>`;
            container.appendChild(card); return;
        }

        if (track.isTuning) {
            const em = { banjo: "🪕", guitar: "🎸", mandolin: "🪕", bass: "🎸", violin: "🎻" };
            card.className = "track-card separator-card";
            card.style.borderColor = "rgba(245,158,11,0.25)";
            card.innerHTML = `<div class="track-drag"><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div></div><span style="color:var(--warning);display:flex;align-items:center;gap:0.5rem;">${getInstrumentSvg(track.instrument)}<strong>ACCORDAGE : ${track.instrument.toUpperCase()} ${em[track.instrument]}</strong></span><div class="separator-line" style="border-top-color:rgba(245,158,11,0.2);"></div><div class="track-actions"><button class="action-btn delete delete-track-btn" data-id="${track.id}" title="Supprimer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div>`;
            container.appendChild(card); return;
        }

        const isEditing = editingTrackId === track.id;
        card.className = `track-card ${track.enabled ? '' : 'disabled'}`;
        const capoBadge = track.capo ? `<span style="font-size:0.75rem;background:rgba(99,102,241,0.15);color:var(--accent-indigo);padding:2px 6px;border-radius:4px;margin-left:0.5rem;font-weight:600;">Capo ${track.capo}</span>` : '';

        if (isEditing) {
            card.innerHTML = `
                <div class="track-drag"><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div></div>
                <div class="track-details" style="gap:0.35rem;">
                    <input type="text" id="edit-title-${track.id}" class="track-edit-input" value="${escapeHtml(track.title)}" placeholder="Titre">
                    <div style="display:flex;gap:0.5rem;">
                        <input type="text" id="edit-duration-${track.id}" class="track-edit-input" value="${formatTrackDuration(track.duration)}" placeholder="Durée (ex: 3:30)" style="flex:1;">
                        <input type="text" id="edit-capo-${track.id}" class="track-edit-input" value="${escapeHtml(track.capo)}" placeholder="Capo" style="flex:0.6;">
                        ${energySelectHtml(`edit-energy-${track.id}`, track.energy)}
                    </div>
                </div>
                <div class="track-actions">
                    <button class="action-btn save-edit-btn" data-id="${track.id}" title="Enregistrer" style="color:var(--success);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
                    <button class="action-btn cancel-edit-btn" title="Annuler" style="color:var(--text-muted);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>`;
        } else {
            card.innerHTML = `
                <div class="track-drag"><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div><div class="drag-dot-row"><div class="drag-dot"></div><div class="drag-dot"></div></div></div>
                <label class="checkbox-container"><input type="checkbox" class="track-toggle" data-id="${track.id}" ${track.enabled ? 'checked' : ''}><span class="checkmark"></span></label>
                <div class="track-details">
                    <div class="track-title" style="display:flex;align-items:center;gap:0.25rem;">${energyDot(track.energy)}<span>${escapeHtml(track.title)}</span>${capoBadge}</div>
                </div>
                <div class="track-duration-badge">${formatTrackDuration(track.duration)}</div>
                <div class="track-actions">
                    <div style="display:flex;flex-direction:column;justify-content:center;gap:2px;">
                        <button class="action-btn order-up" data-id="${track.id}" title="Monter" style="padding:0.1rem;height:16px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg></button>
                        <button class="action-btn order-down" data-id="${track.id}" title="Descendre" style="padding:0.1rem;height:16px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                    </div>
                    <button class="action-btn edit-track-btn" data-id="${track.id}" title="Modifier"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg></button>
                    <button class="action-btn delete delete-track-btn" data-id="${track.id}" title="Supprimer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                </div>`;
        }
        container.appendChild(card);
    });
}

// ============================================================
// RENDER SAVED SETS
// ============================================================
function renderSavedSets() {
    const container = document.getElementById("saved-sets-list");
    container.innerHTML = "";
    if (savedSets.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:2rem 0;font-size:0.9rem;">Aucun set sauvegardé.</div>`;
        return;
    }
    savedSets.forEach(set => {
        const item = document.createElement("div");
        item.className = "set-item";
        const totalSecs = (set.tracks || []).reduce((acc, t) => acc + (!t.isSeparator && !t.isTuning && t.enabled ? t.duration : 0), 0);
        const count = (set.tracks || []).filter(t => !t.isSeparator && !t.isTuning).length;
        item.innerHTML = `
            <div class="set-item-info">
                <span class="set-item-name">${escapeHtml(set.title)}</span>
                <span class="set-item-meta">${count} morceaux • ${formatSecondsToTime(totalSecs)}</span>
            </div>
            <div style="display:flex;gap:0.25rem;">
                <button class="action-btn load-set-btn" data-id="${set.id}" title="Charger ce set" style="color:var(--accent-cyan);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                <button class="action-btn delete delete-set-btn" data-id="${set.id}" title="Supprimer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>`;
        container.appendChild(item);
    });
}

// ============================================================
// DRAG AND DROP
// ============================================================
let dragSrcEl = null;

function setupDragAndDropEvents(el) {
    el.addEventListener('dragstart', (e) => {
        el.style.opacity = '0.4'; dragSrcEl = el;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ source: 'setlist', index: el.dataset.index }));
    });
    el.addEventListener('dragend', () => {
        el.style.opacity = '1';
        document.querySelectorAll('.track-card').forEach(c => c.style.borderTop = '');
    });
    el.addEventListener('dragover', (e) => { e.preventDefault(); return false; });
    el.addEventListener('dragenter', () => { if (el !== dragSrcEl) el.style.borderTop = '2px solid var(--accent-indigo)'; });
    el.addEventListener('dragleave', () => { el.style.borderTop = ''; });
    el.addEventListener('drop', (e) => {
        e.stopPropagation(); e.preventDefault();
        let data = {};
        try { data = JSON.parse(e.dataTransfer.getData('application/json') || '{}'); } catch { return; }
        const toIndex = parseInt(el.dataset.index, 10);
        if (data.source === 'library') {
            addTrackToSetlist(data.title, data.duration, data.capo, data.energy, toIndex);
        } else if (data.source === 'setlist') {
            const fromIndex = parseInt(data.index, 10);
            if (fromIndex !== toIndex) {
                const temp = currentSet.tracks[fromIndex];
                currentSet.tracks.splice(fromIndex, 1);
                currentSet.tracks.splice(toIndex, 0, temp);
                persistCurrentWork(); renderTracklist(); updateTotalDuration();
            }
        }
        document.querySelectorAll('.track-card').forEach(c => c.style.borderTop = '');
        return false;
    });
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function initEventListeners() {
    document.getElementById("current-set-title").addEventListener("input", (e) => {
        currentSet.title = e.target.value || "Set sans nom";
        persistCurrentWork();
    });

    document.getElementById("add-track-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const titleVal = document.getElementById("track-title").value;
        const mins = parseInt(document.getElementById("track-duration-min").value, 10) || 0;
        const secs = parseInt(document.getElementById("track-duration-sec").value, 10) || 0;
        const capoVal = document.getElementById("track-capo").value;
        const energyVal = document.getElementById("track-energy").value;
        await addTrackToLibrary(titleVal, (mins * 60) + secs, capoVal, energyVal);
        e.target.reset();
        document.getElementById("track-title").focus();
    });

    document.getElementById("add-separator-btn").addEventListener("click", addSeparator);
    document.getElementById("add-tuning-btn").addEventListener("click", () => {
        addTuningItem(document.getElementById("tuning-select").value);
    });

    document.getElementById("library-search").addEventListener("input", (e) => renderLibrary(e.target.value));

    // Drop on empty tracklist
    const tracklist = document.getElementById("tracklist");
    tracklist.addEventListener("dragover", (e) => e.preventDefault());
    tracklist.addEventListener("drop", (e) => {
        if (e.target === tracklist || tracklist.querySelector('.empty-state')) {
            let data = {};
            try { data = JSON.parse(e.dataTransfer.getData('application/json') || '{}'); } catch { return; }
            if (data.source === 'library') addTrackToSetlist(data.title, data.duration, data.capo, data.energy);
        }
    });

    // Library click delegation
    document.getElementById("library-list").addEventListener("click", (e) => {
        const addBtn = e.target.closest(".add-to-set-from-lib-btn");
        const deleteBtn = e.target.closest(".delete-from-lib-btn");
        if (addBtn) {
            const song = libraryTracks.find(t => t.title.toLowerCase() === addBtn.dataset.title.toLowerCase());
            if (song) addTrackToSetlist(song.title, song.duration, song.capo, song.energy);
        } else if (deleteBtn) {
            if (confirm(`Supprimer "${deleteBtn.dataset.title}" de la bibliothèque ?`)) {
                deleteTrackFromLibrary(deleteBtn.dataset.title);
            }
        }
    });

    // Tracklist click delegation
    tracklist.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".delete-track-btn");
        const editBtn = e.target.closest(".edit-track-btn");
        const saveEditBtn = e.target.closest(".save-edit-btn");
        const cancelEditBtn = e.target.closest(".cancel-edit-btn");
        const checkbox = e.target.closest(".track-toggle");
        const orderUpBtn = e.target.closest(".order-up");
        const orderDownBtn = e.target.closest(".order-down");

        if (deleteBtn) deleteTrack(deleteBtn.dataset.id);
        else if (editBtn) { editingTrackId = editBtn.dataset.id; renderTracklist(); }
        else if (saveEditBtn) {
            const id = saveEditBtn.dataset.id;
            editingTrackId = null;
            updateTrackInline(id, {
                title: document.getElementById(`edit-title-${id}`).value,
                durationStr: document.getElementById(`edit-duration-${id}`).value,
                capo: document.getElementById(`edit-capo-${id}`).value,
                energy: document.getElementById(`edit-energy-${id}`).value
            });
        }
        else if (cancelEditBtn) { editingTrackId = null; renderTracklist(); }
        else if (checkbox) toggleTrack(checkbox.dataset.id, checkbox.checked);
        else if (orderUpBtn) moveTrackOrder(orderUpBtn.dataset.id, -1);
        else if (orderDownBtn) moveTrackOrder(orderDownBtn.dataset.id, 1);
    });

    document.getElementById("load-demo-btn").addEventListener("click", loadDemoData);
    document.getElementById("reset-set-btn").addEventListener("click", () => {
        if (confirm("Effacer tous les morceaux du set actuel ?")) {
            currentSet.tracks = []; currentSet.title = "Mon Set Mix";
            document.getElementById("current-set-title").value = currentSet.title;
            persistCurrentWork(); renderTracklist(); updateTotalDuration();
            showToast("Setlist réinitialisée", "info");
        }
    });
    document.getElementById("print-pdf-btn").addEventListener("click", generateAndPrintPDF);

    // Save modal
    const saveModal = document.getElementById("save-modal");
    const saveNameInput = document.getElementById("save-set-name");
    document.getElementById("save-current-set-btn").addEventListener("click", () => {
        if (currentSet.tracks.length === 0) { showToast("Set vide !", "error"); return; }
        saveNameInput.value = currentSet.title;
        saveModal.classList.add("active"); saveNameInput.focus(); saveNameInput.select();
    });
    document.getElementById("cancel-save-btn").addEventListener("click", () => saveModal.classList.remove("active"));
    document.getElementById("confirm-save-btn").addEventListener("click", () => {
        saveCurrentSet(saveNameInput.value.trim() || "Set sans nom");
        saveModal.classList.remove("active");
    });

    // Saved sets actions
    document.getElementById("saved-sets-list").addEventListener("click", (e) => {
        const loadBtn = e.target.closest(".load-set-btn");
        const deleteBtn = e.target.closest(".delete-set-btn");
        if (loadBtn) loadSavedSet(loadBtn.dataset.id);
        else if (deleteBtn) deleteSavedSet(deleteBtn.dataset.id);
    });

    // Export/Import
    document.getElementById("export-sets-btn").addEventListener("click", exportSetsToJson);
    const fileInput = document.getElementById("import-file-input");
    document.getElementById("trigger-import-btn").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", importSetsFromJson);
}

function moveTrackOrder(id, direction) {
    const index = currentSet.tracks.findIndex(t => t.id === id);
    if (index === -1) return;
    const target = index + direction;
    if (target < 0 || target >= currentSet.tracks.length) return;
    [currentSet.tracks[index], currentSet.tracks[target]] = [currentSet.tracks[target], currentSet.tracks[index]];
    persistCurrentWork(); renderTracklist();
}

// ============================================================
// SAVE / LOAD SETS (Firestore)
// ============================================================
async function saveCurrentSet(name) {
    const setId = 'set_' + Date.now();
    const setCopy = {
        id: setId, title: name,
        tracks: JSON.parse(JSON.stringify(currentSet.tracks)),
        savedAt: Date.now()
    };
    const existing = savedSets.find(s => s.title.toLowerCase() === name.toLowerCase());
    if (existing) {
        if (!confirm(`Le set "${name}" existe déjà. Remplacer ?`)) return;
        setCopy.id = existing.id;
    }
    try {
        await saveSavedSetToFirestore(setCopy);
        showToast(`Set "${name}" sauvegardé ☁️`);
    } catch (err) {
        showToast("Erreur de sauvegarde.", "error");
    }
}

function loadSavedSet(id) {
    const set = savedSets.find(s => s.id === id);
    if (!set) return;
    currentSet.title = set.title;
    currentSet.tracks = JSON.parse(JSON.stringify(set.tracks));
    document.getElementById("current-set-title").value = currentSet.title;
    persistCurrentWork(); renderTracklist(); updateTotalDuration();
    showToast(`Set "${set.title}" chargé`);
}

async function deleteSavedSet(id) {
    const set = savedSets.find(s => s.id === id);
    if (!set) return;
    if (!confirm(`Supprimer le set "${set.title}" ?`)) return;
    try {
        await deleteSavedSetFromFirestore(id);
        showToast("Set supprimé", "info");
    } catch { showToast("Erreur de suppression.", "error"); }
}

// ============================================================
// DEMO DATA
// ============================================================
async function loadDemoData() {
    currentSet.title = "Bluegrass Live Set 🪕";
    document.getElementById("current-set-title").value = currentSet.title;
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
    for (const t of currentSet.tracks) {
        if (!t.isSeparator && !t.isTuning) await addTrackToLibrary(t.title, t.duration, t.capo);
    }
    persistCurrentWork(); renderTracklist(); updateTotalDuration();
    showToast("Setlist démo chargée ! 🪕", "info");
}

// ============================================================
// PDF PRINT
// ============================================================
function generateAndPrintPDF() {
    const printContainer = document.getElementById("printable-setlist");
    if (currentSet.tracks.length === 0) { showToast("Le setlist est vide !", "error"); return; }
    let html = `<div class="print-setlist">`;
    let pendingInstruments = [];
    currentSet.tracks.forEach(track => {
        if (track.isSeparator) {
            pendingInstruments.forEach(inst => {
                html += `<div class="print-item-row tuning-row"><div class="print-instrument ${inst === 'banjo' || inst === 'mandolin' ? 'left' : 'right'}">${getInstrumentSvg(inst)}</div></div>`;
            });
            pendingInstruments = [];
            html += `<div class="print-divider-line"></div>`;
        } else if (track.isTuning && track.enabled) {
            pendingInstruments.push(track.instrument);
        } else if (track.enabled) {
            let left = "", right = "";
            pendingInstruments.forEach(inst => {
                if (inst === 'banjo' || inst === 'mandolin') left += `<div class="print-instrument left">${getInstrumentSvg(inst)}</div>`;
                else right += `<div class="print-instrument right">${getInstrumentSvg(inst)}</div>`;
            });
            pendingInstruments = [];
            let title = track.title + (track.capo ? ` (capo ${track.capo})` : '');
            const dot = track.energy && ENERGY_LEVELS[track.energy] ? `<span class="print-energy-dot" style="background:${ENERGY_LEVELS[track.energy].color};"></span>` : '';
            html += `<div class="print-item-row">${left}<span class="print-track-name">${dot}${escapeHtml(title)}</span>${right}</div>`;
        }
    });
    pendingInstruments.forEach(inst => {
        html += `<div class="print-item-row tuning-row"><div class="print-instrument ${inst === 'banjo' || inst === 'mandolin' ? 'left' : 'right'}">${getInstrumentSvg(inst)}</div></div>`;
    });
    html += `</div>`;
    printContainer.innerHTML = html;
    window.print();
}

// ============================================================
// EXPORT / IMPORT (JSON)
// ============================================================
function exportSetsToJson() {
    if (savedSets.length === 0 && currentSet.tracks.length === 0) { showToast("Rien à exporter.", "error"); return; }
    const dataStr = JSON.stringify({ currentSet, savedSets, libraryTracks, version: "5.0", exportedAt: new Date().toISOString() }, null, 2);
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    a.download = `setlist_export_${Date.now()}.json`;
    a.click();
    showToast("Exportation réussie");
}

async function importSetsFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.libraryTracks) {
                for (const t of data.libraryTracks) {
                    await addTrackToLibrary(t.title, t.duration, t.capo, t.energy);
                }
            }
            if (data.savedSets) {
                for (const s of data.savedSets) {
                    await saveSavedSetToFirestore({ ...s, id: 'set_' + Date.now() + Math.random() });
                }
            }
            showToast("Importation réussie !");
        } catch { showToast("Fichier JSON invalide.", "error"); }
        event.target.value = "";
    };
    reader.readAsText(file);
}

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

// ============================================================
// BOOTSTRAP
// ============================================================
initAuth();
