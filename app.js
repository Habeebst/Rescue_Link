/* =================================================================
   RescueLink — vanilla JS build with real Google Maps.

   Structure:
   - ICONS: small inline SVG strings (kept dependency-free)
   - DATA: emergency types, hospitals, driver requests — with real
     Lagos-area coordinates so the map calls are genuine
   - STATE: current screen, selected request, trip step
   - RENDER: one function per screen, building HTML strings
   - MAPS: Google Maps init/update functions, called after each
     render so the map container that render() just created exists
     in the DOM before Maps tries to attach to it
   ================================================================= */

/* ---------------- ICONS (inline SVG, no icon library needed) ---------------- */
const ICONS = {
  briefcase: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  triangleAlert: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  baby: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.7 0-1.5-.4-1.5-1"/></svg>`,
  skull: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>`,
  more: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
  mapPin: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  check: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
  building: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>`,
  truck: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17H9"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
  chevronRight: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
  chevronLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  phoneCall: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2a9 9 0 0 1 9 9"/><path d="M13 6a5 5 0 0 1 5 5"/><path d="M21.29 16.59a1.7 1.7 0 0 0-.53-1.14L18 13a1.7 1.7 0 0 0-2.4 0l-.7.7a11.7 11.7 0 0 1-4.6-4.6l.7-.7a1.7 1.7 0 0 0 0-2.4L8.55 3.24a1.7 1.7 0 0 0-1.14-.53A2 2 0 0 0 6 3.5a17 17 0 0 0 14.5 14.5 2 2 0 0 0 .79-1.41Z"/></svg>`,
  navigation: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
  fileWarning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
};

/* ---------------- DATA (with real Lagos-area coordinates) ---------------- */
const CENTER = { lat: 6.5920, lng: 3.4890 }; // Ikorodu Road corridor

const EMERGENCIES = [
  { id: "road", label: "Road Accident", icon: "briefcase", fg: "#E5372B" },
  { id: "house", label: "House Accident", icon: "triangleAlert", fg: "#D89A1B" },
  { id: "birth", label: "ChildBirth", icon: "baby", fg: "#DB2777" },
  { id: "poison", label: "Poisoning", icon: "skull", fg: "#E5372B" },
  { id: "other", label: "Others", icon: "more", fg: "#E5372B" },
];

const HOSPITALS = [
  { name: "General Hospital, Yaba", distance: "1.2 km away", pos: { lat: 6.5083, lng: 3.3792 } },
  { name: "Hope Hospital, Yaba", distance: "1.5 km away", pos: { lat: 6.5106, lng: 3.3820 } },
  { name: "Promise Hospital, Yaba", distance: "1.7 km away", pos: { lat: 6.5062, lng: 3.3765 } },
];

const CALLER_STEPS = ["Matched", "En route", "Arrived", "Transporting"];
const DRIVER_STEPS = ["Matched", "En route", "Arrived", "Transporting"];

const REQUESTS = [
  { id: 1, type: "Child Birth", icon: "baby", fg: "#DB2777", distance: "0.8 km", timeAgo: "1 min ago", address: "Behind NEPA office, Alapere", pos: { lat: 6.5892, lng: 3.3958 } },
  { id: 2, type: "Road Accident", icon: "briefcase", fg: "#E5372B", distance: "2.4 km", timeAgo: "2 min ago", address: "7, Aje Rd, Ikeja Lagos", pos: { lat: 6.6018, lng: 3.3515 } },
  { id: 3, type: "House Accident", icon: "triangleAlert", fg: "#D89A1B", distance: "3.4 km", timeAgo: "4 min ago", address: "29, Ola Street, Agege Lagos", pos: { lat: 6.6329, lng: 3.3208 } },
];

const PATIENT_ROUTE = { origin: { lat: 6.6018, lng: 3.5106 }, dest: { lat: 6.5083, lng: 3.3792 } }; // Ikorodu -> General Hospital, Yaba
const DRIVER_DETAIL_ROUTE = { origin: { lat: 6.5892, lng: 3.3958 }, dest: { lat: 6.5130, lng: 3.3780 } }; // Alapere -> City Hospital
const TRANSPORT_DEST = { lat: 6.6059, lng: 3.3491 }; // General Hospital, Ikeja
const COMPLETE_DEST = { lat: 6.5885, lng: 3.3945 }; // Lagos State Health Center, Alapere

/* ---------------- STATE ---------------- */
const state = {
  mode: "patient",       // 'patient' | 'driver'
  patientScreen: "home",
  driverScreen: "list",
  selected: REQUESTS[0],
  stepIdx: 0,
  eta: 3,
};

let mapsReady = true; // Leaflet has no async key/callback gate — it's ready as soon as the script tag loads

/* ---------------- RENDER HELPERS ---------------- */
function icon(name, color) {
  return `<span style="color:${color || "currentColor"}; display:inline-flex">${ICONS[name]}</span>`;
}

function stepperSingle(steps, currentIdx) {
  return `<div class="stepper">${steps.map((s, i) => `
    <div class="step-node">
      <div class="step-circle ${i === currentIdx ? "done" : ""}">${i + 1}</div>
      <div class="step-label ${i === currentIdx ? "current" : ""}">${s}</div>
    </div>
    ${i < steps.length - 1 ? `<span class="step-arrow">&#8594;</span>` : ""}
  `).join("")}</div>`;
}

function stepperCumulative(steps, currentIdx) {
  return `<div class="stepper stepper-cumulative">${steps.map((s, i) => `
    <div class="step-node">
      <div class="step-circle ${i <= currentIdx ? "done" : ""}">${i + 1}</div>
      <div class="step-label ${i === currentIdx ? "current" : ""}">${s}</div>
    </div>
    ${i < steps.length - 1 ? `<div class="step-line ${i < currentIdx ? "done" : ""}"></div>` : ""}
  `).join("")}</div>`;
}

/* ---------------- ROOT RENDER ---------------- */
function render() {
  document.getElementById("btn-switch").textContent = state.mode === "patient" ? "Driver" : "Caller";

  const { html, navy, withMap, full } = state.mode === "patient" ? buildPatient() : buildDriver();

  const panel = document.getElementById("panel");
  panel.innerHTML = `<div class="${full ? "centered-content" : ""}" style="display:flex; flex-direction:column; flex:1">${html}</div>`;
  panel.classList.toggle("navy", !!navy);
  panel.classList.toggle("full", !!full);

  const mapPane = document.getElementById("map-pane");
  const wasHidden = mapPane.classList.contains("hidden");
  mapPane.classList.toggle("hidden", !withMap);
  if (withMap) {
    if (wasHidden) setTimeout(() => map && map.invalidateSize(), 0);
    updateMapForCurrentScreen();
  }

  wireEvents();
}

/* ================================================================
   PATIENT (CALLER) SCREENS
   ================================================================ */
function buildPatient() {
  const s = state.patientScreen;
  let panelHtml = "";

  if (s === "home") {
    panelHtml = `
      <div class="h-lg">What's the emergency?</div>
      ${EMERGENCIES.map(e => `
        <button class="emergency-row" data-action="goto-location">
          <span class="emergency-icon">${icon(e.icon, e.fg)}</span>
          <span class="emergency-label">${e.label}</span>
          ${icon("chevronRight", "#E5372B")}
        </button>
      `).join("")}
    `;
  }

  if (s === "location") {
    panelHtml = `
      <div class="h-lg" style="font-size:22px">Confirm Location</div>
      <div class="location-row">
        ${icon("mapPin", "#E5372B")}
        <span>Ikorodu Road, Lagos</span>
        ${icon("check", "#22C55E")}
      </div>
      <div class="spacer"></div>
      <button class="btn btn-red" data-action="goto-loading">Request Ambulance</button>
    `;
  }

  if (s === "loading") {
    panelHtml = `
      <div class="h-md">Finding the nearest ambulance…</div>
      <p class="sub">Stay on this page — this won't take long.</p>
      <div class="loading-wrap">
        ${icon("truck", "#E5372B")}
        <div class="loading-label">LOADING</div>
      </div>
      <div class="control-label">Backend controls</div>
      <div style="display:flex; flex-direction:column; gap:10px">
        <button class="btn btn-red" data-action="goto-noambulance">No Ambulance Found &#8594;</button>
        <button class="btn btn-green" style="border-radius:8px" data-action="goto-matched">Ambulance Found &#8594;</button>
      </div>
    `;
  }

  if (s === "noambulance") {
    panelHtml = `
      <div class="h-md">No ambulance available right now</div>
      <p class="sub" style="margin-bottom:20px">All nearby drivers are on other emergencies.</p>
      ${HOSPITALS.map(h => `
        <div class="hospital-card">
          ${icon("building", "#14213D")}
          <div><div class="hospital-name">${h.name}</div><div class="hospital-dist">${h.distance}</div></div>
        </div>
      `).join("")}
      <div class="spacer"></div>
      <button class="btn btn-red" data-action="goto-home">Get Directions</button>
    `;
  }

  if (["matched", "enroute", "arrived", "transporting"].includes(s)) {
    const map = { matched: 0, enroute: 1, arrived: 2, transporting: 3 };
    const idx = map[s];
    const nextLabel = { matched: "En route", enroute: "Arrived", arrived: "Transporting", transporting: "Trip completed" }[s];
    const nextAction = { matched: "goto-enroute", enroute: "goto-arrived", arrived: "goto-transporting", transporting: "goto-complete" }[s];

    panelHtml = `
      ${s !== "transporting" ? `
        <p class="eyebrow">${s === "arrived" ? "Help is here" : "Help is on the way"}</p>
        <div class="h-lg">${s === "arrived" ? "0 min away" : (state.eta + " min away")}</div>
      ` : `<div class="h-lg" style="font-weight:700">Transporting…</div>`}
      ${stepperSingle(CALLER_STEPS, idx)}
      <div class="driver-card">
        <div class="driver-avatar">${icon("truck", "#E5372B")}</div>
        <div>
          <div class="driver-label">Driver:</div>
          <div class="driver-name">Femi Isa</div>
          <div class="driver-label" style="margin-top:6px">Vehicle:</div>
          <div class="driver-name" style="font-size:14px">HiAce Ambulance</div>
          <div class="driver-plate">ABC 123 Xy</div>
        </div>
      </div>
      <div class="spacer"></div>
      <div class="control-label">Driver's control</div>
      <button class="btn btn-green" data-action="${nextAction}">${nextLabel}</button>
    `;
  }

  if (s === "complete") {
    panelHtml = `
      <div class="complete-center">
        <div class="complete-icon">${icon("check", "#22C55E")}</div>
        <div class="h-md" style="font-size:20px">Trip complete</div>
        <p class="sub" style="margin-bottom:32px">The ambulance arrived and completed the trip.</p>
        <div style="width:100%"><button class="btn btn-amber" data-action="goto-home">Start a new request</button></div>
      </div>
    `;
  }

  const isDesktop = window.innerWidth > 768;
  const activeTrip = ["matched", "enroute", "arrived", "transporting"].includes(s);
  return {
    html: panelHtml,
    navy: false,
    withMap: isDesktop || activeTrip,
    full: false,
  };
}

/* ================================================================
   DRIVER SCREENS
   ================================================================ */
function buildDriver() {
  const s = state.driverScreen;
  const isDesktop = window.innerWidth > 768;
  const withMap = isDesktop || ["matched", "enroute", "arrived", "transporting"].includes(s);
  let panelHtml = "";

  if (s === "list") {
    panelHtml = `
      <div class="h-lg" style="color:#fff">Nearby Requests</div>
      <p class="sub" style="margin-top:-14px; margin-bottom:20px">Ranked Distance. Select one to view details</p>
      ${REQUESTS.map(r => `
        <div class="request-card">
          <div class="request-top">
            <span class="request-icon">${icon(r.icon, r.fg)}</span>
            <div class="request-title-row" style="flex-direction:column; align-items:flex-start">
              <div style="display:flex; align-items:center; justify-content:space-between; width:100%">
                <span class="request-type">${r.type}</span>
                <span class="verified-pill">verified</span>
              </div>
              <div class="request-meta">${r.distance} · ${r.timeAgo}</div>
              <div class="request-meta">${r.address}</div>
            </div>
          </div>
          <div class="btn-row">
            <button class="btn btn-green btn-sm" data-action="open-detail" data-id="${r.id}">Accept</button>
            <button class="btn btn-sm" style="background:#E5372B; color:#fff; border-radius:999px" data-action="decline">Decline</button>
          </div>
        </div>
      `).join("")}
      <button class="nav-link" style="color:var(--navy-muted); margin-top:8px; text-align:center; font-weight:700">Load more</button>
    `;
  }

  if (s === "detail") {
    const r = state.selected;
    panelHtml = `
      <div class="detail-header">
        <button class="back-btn" data-action="goto-list">${icon("chevronLeft", "#fff")}</button>
        <div class="h-md" style="color:#fff; font-size:19px">Request Details</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
        <span class="sub" style="margin:0">Current Status</span>
        <span class="status-pill-accepted">ACCEPTED</span>
      </div>
      <div class="detail-card">
        <div class="detail-divider">
          <span class="request-icon">${icon(r.icon, r.fg)}</span>
          <div>
            <div style="font-size:16px; font-weight:700; color:#fff">${r.type}</div>
            <div class="request-meta">Obstetrics &amp; Gynecology Emergency</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px">${icon("mapPin", "#9FB4CC")}<span style="color:#fff; font-size:13px; font-weight:600">${r.address}</span></div>
        <div class="request-meta" style="margin-top:4px">${r.distance} · ~3 min away</div>
      </div>
      <div class="detail-card">
        <div class="section-label">Requester Details</div>
        <div style="display:flex; align-items:center; justify-content:space-between">
          <div>
            <div style="font-size:14.5px; font-weight:700; color:#fff">Folasade Adebayo</div>
            <div class="request-meta">+234 803 123 4567</div>
          </div>
          <div class="call-btn">${icon("phoneCall", "#fff")}</div>
        </div>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-green" data-action="start-trip">Start Trip</button>
      <div style="height:12px"></div>
      <button class="btn btn-outline-red" data-action="goto-list">Cancel Request</button>
    `;
  }

  if (s === "matched") {
    const r = state.selected;
    panelHtml = `
      <p class="eyebrow">Trip matched</p>
      <div class="h-lg" style="color:#fff; margin-bottom:4px">${r.type}</div>
      <p class="sub" style="margin-bottom:20px">${r.address}</p>
      ${stepperCumulative(DRIVER_STEPS, 0)}
      <div class="spacer"></div>
      <button class="btn btn-amber" data-action="goto-enroute">Start Trip</button>
      <div style="height:12px"></div>
      <button class="btn btn-outline-dark" data-action="noop">Open Navigation</button>
    `;
  }

  if (s === "enroute" || s === "arrived") {
    const r = state.selected;
    const idx = s === "enroute" ? 1 : 2;
    panelHtml = `
      <p class="eyebrow">${s === "arrived" ? "Arrived at destination" : "Trip in progress"}</p>
      <div class="h-lg" style="color:#fff; margin-bottom:4px">${r.type}</div>
      <p class="sub" style="margin-bottom:20px">${r.address}</p>
      ${s === "arrived" ? `<div class="confirm-banner-arrived">${icon("check", "#22C55E")}<span style="color:#22C55E; font-weight:700; font-size:13px">You have arrived at the scene</span></div>` : ""}
      ${stepperCumulative(DRIVER_STEPS, idx)}
      <div class="spacer"></div>
      <button class="btn btn-amber" data-action="${s === "enroute" ? "goto-arrived" : "goto-transporting"}">Mark: ${s === "enroute" ? "Arrived" : "Transporting"}</button>
      <div style="height:12px"></div>
      <button class="btn btn-outline-dark" data-action="noop">${s === "arrived" ? "Contact Patient" : "Open Navigation"}</button>
    `;
  }

  if (s === "transporting") {
    panelHtml = `
      <p class="eyebrow">Trip in progress</p>
      <div class="h-lg" style="color:#fff">House Accident</div>
      <div class="section-label" style="margin-top:8px">Origin</div>
      <div style="color:#fff; font-size:13.5px; font-weight:600; margin-bottom:16px">${state.selected.address}</div>
      <div class="section-label">Destination (Drop-off)</div>
      <div style="color:#fff; font-size:14.5px; font-weight:700; margin-bottom:20px">General Hospital, Ikeja</div>
      ${stepperCumulative(DRIVER_STEPS, 3)}
      <div class="spacer"></div>
      <button class="btn btn-amber" data-action="goto-driver-complete">Mark: Completed</button>
      <div style="height:12px"></div>
      <button class="btn btn-outline-dark" data-action="noop">Open Navigation</button>
    `;
  }

  if (s === "complete") {
    panelHtml = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px">
        <span style="width:8px; height:8px; border-radius:99px; background:#22C55E; display:inline-block"></span>
        <span style="font-size:11px; text-transform:uppercase; letter-spacing:.04em; font-weight:800; color:#22C55E">Trip Completed Successfully</span>
      </div>
      <div class="h-md" style="color:#fff; font-size:22px">House Accident</div>
      <p class="sub" style="margin-bottom:16px">${state.selected.address}</p>
      <div class="confirm-banner">
        ${icon("check", "#22C55E")}
        <div><div style="color:#fff; font-size:13px; font-weight:700">Patient Delivered Safe</div><div class="request-meta">Lagos State Health Center, Alapere</div></div>
      </div>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-label">Trip Duration</div><div class="stat-value">18 mins</div></div>
        <div class="stat-box"><div class="stat-label">Distance</div><div class="stat-value">5.4 km</div></div>
      </div>
      <div class="section-label">Journey Timeline</div>
      ${stepperCumulative(DRIVER_STEPS, 3)}
      <div class="spacer"></div>
      <button class="btn btn-amber" data-action="goto-list">Back to request</button>
      <div style="height:12px"></div>
      <button class="btn btn-outline-dark" data-action="noop">${icon("fileWarning", "#fff")} Report Incident</button>
    `;
  }

  return { html: panelHtml, navy: true, withMap, full: !withMap };
}

/* ---------------- EVENT WIRING ---------------- */
function wireEvents() {
  document.querySelectorAll("[data-action]").forEach(el => {
    el.addEventListener("click", () => handleAction(el.dataset.action, el.dataset.id));
  });
}

function handleAction(action, id) {
  if (state.mode === "patient") {
    if (action === "goto-home") { state.patientScreen = "home"; }
    else if (action === "goto-location") { state.patientScreen = "location"; }
    else if (action === "goto-loading") { state.patientScreen = "loading"; }
    else if (action === "goto-noambulance") { state.patientScreen = "noambulance"; }
    else if (action === "goto-matched") { state.patientScreen = "matched"; state.eta = 3; }
    else if (action === "goto-enroute") { state.patientScreen = "enroute"; state.eta = 1; }
    else if (action === "goto-arrived") { state.patientScreen = "arrived"; }
    else if (action === "goto-transporting") { state.patientScreen = "transporting"; }
    else if (action === "goto-complete") { state.patientScreen = "complete"; }
  } else {
    if (action === "open-detail") { state.selected = REQUESTS.find(r => r.id == id) || REQUESTS[0]; state.driverScreen = "detail"; }
    else if (action === "goto-list") { state.driverScreen = "list"; }
    else if (action === "start-trip") { state.driverScreen = "matched"; state.stepIdx = 0; }
    else if (action === "goto-enroute") { state.driverScreen = "enroute"; state.stepIdx = 1; }
    else if (action === "goto-arrived") { state.driverScreen = "arrived"; }
    else if (action === "goto-transporting") { state.driverScreen = "transporting"; }
    else if (action === "goto-driver-complete") { state.driverScreen = "complete"; }
    else if (action === "decline") { /* no-op in this build */ }
  }
  render();
}

document.getElementById("btn-home").addEventListener("click", () => {
  if (state.mode === "patient") state.patientScreen = "home"; else state.driverScreen = "list";
  render();
});
document.getElementById("btn-home-2").addEventListener("click", () => {
  if (state.mode === "patient") state.patientScreen = "home"; else state.driverScreen = "list";
  render();
});
document.getElementById("btn-switch").addEventListener("click", () => {
  state.mode = state.mode === "patient" ? "driver" : "patient";
  render();
});

let map = null;
let markerLayer = null;
let mapReqId = 0; 

function initBaseMap() {
  const el = document.getElementById("gmap");
  if (typeof L === "undefined") { showMapFallback(el); return; }
  map = L.map(el, { zoomControl: true, attributionControl: true }).setView([CENTER.lat, CENTER.lng], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
}

function updateMapForCurrentScreen() {
  if (!map) return;
  const myReqId = ++mapReqId;

  if (state.mode === "patient") {
    const s = state.patientScreen;
    if (["home", "location", "loading", "noambulance", "complete"].includes(s)) {
      return;
    } else if (["matched", "enroute", "arrived", "transporting"].includes(s)) {
      const idxOf = { matched: 0, enroute: 1, arrived: 2, transporting: 3 };
      showRouteMap(PATIENT_ROUTE.origin, PATIENT_ROUTE.dest, {
        statusLabel: CALLER_STEPS[idxOf[s]], progress: idxOf[s] / 3, destLabel: "Your Location",
      }, myReqId);
    }
  } else {
    const s = state.driverScreen;
    if (s === "list") {
      showRegionalMap({ markers: REQUESTS.map(r => r.pos) });
    } else if (s === "detail") {
      showRegionalMap({ markers: [DRIVER_DETAIL_ROUTE.origin, DRIVER_DETAIL_ROUTE.dest] });
    } else if (s === "matched") {
      showRouteMap(DRIVER_DETAIL_ROUTE.origin, DRIVER_DETAIL_ROUTE.dest, {
        statusLabel: "Matched", progress: 0.05, destLabel: "Your Location", hospitalAt: DRIVER_DETAIL_ROUTE.dest, hospitalName: "City Hospital",
      }, myReqId);
    } else if (s === "enroute") {
      showRouteMap(DRIVER_DETAIL_ROUTE.origin, DRIVER_DETAIL_ROUTE.dest, {
        statusLabel: "Ambulance En Route", progress: 0.35, destLabel: "Your Location", hospitalAt: DRIVER_DETAIL_ROUTE.dest, hospitalName: "City Hospital",
      }, myReqId);
    } else if (s === "arrived") {
      showRouteMap(DRIVER_DETAIL_ROUTE.origin, DRIVER_DETAIL_ROUTE.dest, {
        statusLabel: "Arrived at Scene", progress: 1, destLabel: "Your Location", hospitalAt: DRIVER_DETAIL_ROUTE.dest, hospitalName: "City Hospital",
      }, myReqId);
    } else if (s === "transporting") {
      showRegionalMap({ markerAt: TRANSPORT_DEST, labelTag: "General Hospital, Ikeja" });
    }
  }
}

function divMarker(layer, latlng, html, size, anchor) {
  const ic = L.divIcon({ html, className: "", iconSize: size, iconAnchor: anchor });
  return L.marker([latlng.lat, latlng.lng], { icon: ic }).addTo(layer);
}

/* Regional (searching-stage) view: no route, just a pan to the
   relevant point(s) and a marker or two. */
function showRegionalMap(opts) {
  markerLayer.clearLayers();
  map.flyTo([(opts.markerAt || CENTER).lat, (opts.markerAt || CENTER).lng], 12, { duration: 0.85 });

  if (opts.markers) {
    opts.markers.forEach(pos => divMarker(markerLayer, pos, `<div class="you-dot"></div>`, [26, 26], [13, 13]));
  }
  if (opts.markerAt && !opts.labelTag) {
    divMarker(markerLayer, opts.markerAt, `<div class="you-dot"></div>`, [26, 26], [13, 13]);
  }
  if (opts.labelTag) {
    const color = opts.green ? "#22C55E" : "#2F6FE0";
    divMarker(markerLayer, opts.markerAt, `
      <div class="dest-marker">
        <div class="you-dot" style="background:${color}"></div>
        <div class="dest-tag" style="background:${color}">${opts.labelTag}</div>
      </div>`, [160, 60], [80, 26]);
  }
}

/* Route (tracking-stage) view: fetches the real route once, then
   flies the camera to it and places markers along the real path. */
function showRouteMap(origin, dest, opts, reqId) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (reqId !== mapReqId) return; // a newer screen change has already superseded this request
      let latlngs;
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        latlngs = data.routes[0].geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
      } else {
        latlngs = [origin, dest];
      }
      drawRoute(latlngs, dest, opts);
    })
    .catch(() => {
      if (reqId !== mapReqId) return;
      // Offline or the public OSRM server is unreachable 
      drawRoute([origin, dest], dest, opts);
    });
}

function drawRoute(latlngs, dest, opts) {
  markerLayer.clearLayers();

  const line = L.polyline(latlngs.map(p => [p.lat, p.lng]), { color: "#2F6FE0", weight: 6, opacity: 0.92, lineCap: "round", lineJoin: "round" }).addTo(markerLayer);
  map.flyToBounds(line.getBounds(), { padding: [40, 40], duration: 0.85 });

  const ambulancePos = pointAlongPath(latlngs, opts.progress);
  divMarker(markerLayer, ambulancePos, `
    <div class="status-marker">
      <div class="status-pill-tag">${opts.statusLabel}</div>
      <div class="status-bubble">${icon("truck", "#E5372B")}</div>
    </div>`, [160, 100], [80, 100]);

  if (opts.hospitalAt) {
    divMarker(markerLayer, opts.hospitalAt, `
      <div class="hospital-marker">
        <div class="hospital-badge">H</div>
        <div class="hospital-tag">${opts.hospitalName}</div>
      </div>`, [140, 60], [70, 60]);
  }

  divMarker(markerLayer, dest, `
    <div class="dest-marker">
      <div class="you-dot"></div>
      <div class="dest-tag" style="background:#2F6FE0">${opts.destLabel}</div>
    </div>`, [160, 60], [80, 26]);
}

function showMapFallback(container) {
  container.innerHTML = `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#EEF1F3;padding:24px;text-align:center">
      <div style="max-width:320px;color:#6B7684;font-size:14px">
        Map library didn't load — check your internet connection, or that
        the Leaflet script tag in <code>index.html</code> loaded correctly.
      </div>
    </div>`;
}

/* Distance-weighted interpolation along a path of {lat,lng} points,
   using the haversine formula — pure JS, no external geometry
   library needed. Gives an even-looking position along the real
   route rather than snapping to path vertices. */
function haversine(a, b) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function lerpLatLng(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}
function pointAlongPath(path, fraction) {
  if (!path || path.length === 0) return CENTER;
  if (path.length === 1) return path[0];
  const segLens = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const d = haversine(path[i], path[i + 1]);
    segLens.push(d);
    total += d;
  }
  let target = total * Math.max(0, Math.min(1, fraction));
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const segFrac = segLens[i] === 0 ? 0 : target / segLens[i];
      return lerpLatLng(path[i], path[i + 1], Math.max(0, Math.min(1, segFrac)));
    }
    target -= segLens[i];
  }
  return path[path.length - 1];
}

/* ---------------- INIT ---------------- */
initBaseMap();
render();
