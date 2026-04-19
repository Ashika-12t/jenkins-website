// ================================================
//  드라마 DRAMA.KR  —  app.js
//  Full Application Logic
// ================================================

// ── State ──────────────────────────────────────
let activeGenre  = "all";
let sortBy       = "rating";
let searchQuery  = "";
let currentDrama = null;
let watchlist    = JSON.parse(localStorage.getItem("dramakr_wl") || "[]");

// ── Helpers ─────────────────────────────────────
const $ = id => document.getElementById(id);

function genreColor(id) {
  const g = GENRES.find(g => g.id === id);
  return g ? g.color : "var(--pink)";
}
function genreEmoji(id) {
  const g = GENRES.find(g => g.id === id);
  return g ? g.emoji : "🎬";
}
function genreLabel(id) {
  const g = GENRES.find(g => g.id === id);
  return g ? g.label : id;
}
function inWL(drama) {
  return watchlist.some(w => w.id === drama.id);
}

// ── Filter & Sort ────────────────────────────────
function getFiltered() {
  let list = [...DRAMAS];
  if (activeGenre !== "all") list = list.filter(d => d.genre === activeGenre);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.krTitle.toLowerCase().includes(q) ||
      d.cast.some(c => c.toLowerCase().includes(q)) ||
      d.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  list.sort((a,b) => {
    if (sortBy === "rating")   return b.rating - a.rating;
    if (sortBy === "year")     return b.year - a.year;
    if (sortBy === "episodes") return a.episodes - b.episodes;
    if (sortBy === "alpha")    return a.title.localeCompare(b.title);
    return 0;
  });
  return list;
}

function resetAll() {
  activeGenre  = "all";
  searchQuery  = "";
  sortBy       = "rating";
  $("searchInput").value = "";
  $("sortSelect").value  = "rating";
  updateGenrePillStates();
  renderGrid();
}

// ── Genre Pill States ────────────────────────────
function updateGenrePillStates() {
  document.querySelectorAll(".genre-card").forEach(el => {
    el.classList.toggle("active", el.dataset.genre === activeGenre);
  });
}

// ── Render Genre Grid ────────────────────────────
function renderGenreGrid() {
  const container = $("genreGrid");
  container.innerHTML = "";

  GENRES.forEach(g => {
    const count = g.id === "all" ? DRAMAS.length : DRAMAS.filter(d => d.genre === g.id).length;
    const card = document.createElement("div");
    card.className = `genre-card${g.id === activeGenre ? " active" : ""}`;
    card.dataset.genre = g.id;
    card.style.setProperty("--gc", g.color);
    card.style.setProperty("--gc-grad", g.grad);

    card.innerHTML = `
      <div class="genre-card-bg"></div>
      <div class="genre-card-border"></div>
      <div class="genre-card-inner">
        <div class="genre-emoji">${g.emoji}</div>
        <div class="genre-name">${g.label}</div>
        <div class="genre-cnt">${count} drama${count !== 1 ? "s" : ""}</div>
      </div>
    `;
    card.addEventListener("click", () => {
      activeGenre = g.id;
      updateGenrePillStates();
      renderGrid();
      setTimeout(() => {
        document.getElementById("dramas").scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
    container.appendChild(card);
  });
}

// ── Render Drama Grid ────────────────────────────
function renderGrid() {
  const grid    = $("dramaGrid");
  const empty   = $("emptyState");
  const countEl = $("countBadge");
  const dramas  = getFiltered();

  grid.innerHTML = "";
  countEl.textContent = dramas.length;

  if (dramas.length === 0) {
    empty.classList.remove("hidden");
    grid.style.display = "none";
    return;
  }
  empty.classList.add("hidden");
  grid.style.display = "";

  dramas.forEach((drama, i) => {
    const card = createDramaCard(drama, i);
    grid.appendChild(card);
  });
}

// ── Create Drama Card ────────────────────────────
function createDramaCard(drama, index) {
  const color = genreColor(drama.genre);
  const card  = document.createElement("div");
  card.className = "dcard";
  card.style.setProperty("--dc", color);
  card.style.setProperty("--dc-grad", GENRES.find(g => g.id === drama.genre)?.grad || "");
  card.style.animationDelay = `${index * 0.035}s`;

  card.innerHTML = `
    <div class="dcard-poster">
      <img
        src="${drama.poster}"
        alt="${drama.title}"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        loading="lazy"
      />
      <div class="dcard-poster-fallback" style="display:none;background:${GENRES.find(g=>g.id===drama.genre)?.grad||''}">
        ${drama.fallback}
      </div>
      ${drama.isNew ? `<div class="dcard-new">New</div>` : ""}
      <div class="dcard-rating">⭐ ${drama.rating}</div>
      <div class="dcard-genre-chip">${genreEmoji(drama.genre)} ${genreLabel(drama.genre)}</div>
      <div class="dcard-overlay"></div>
      <p class="dcard-synopsis">${drama.synopsis}</p>
    </div>
    <div class="dcard-body">
      <div class="dcard-kr">${drama.krTitle}</div>
      <h3 class="dcard-title">${drama.title}</h3>
      <div class="dcard-meta">
        <span>${drama.network}</span>
        <span class="dot">·</span>
        <span>${drama.year}</span>
        <span class="dot">·</span>
        <span>${drama.episodes} eps</span>
      </div>
      <div class="dcard-tags">
        ${drama.tags.slice(0,2).map(t => `<span class="dcard-tag">${t}</span>`).join("")}
      </div>
    </div>
  `;

  card.addEventListener("click", () => openModal(drama));
  return card;
}

// ── Trending Strip ───────────────────────────────
function renderTrending() {
  const row = $("trendingRow");
  const list = DRAMAS.filter(d => d.isTrending);
  row.innerHTML = "";

  list.forEach((drama, i) => {
    const color = genreColor(drama.genre);
    const card  = document.createElement("div");
    card.className = "tcard";
    card.style.setProperty("--dc", color);

    card.innerHTML = `
      <div class="tcard-poster" style="background:${GENRES.find(g=>g.id===drama.genre)?.grad||'#111'}">
        <div class="tcard-rank">${String(i+1).padStart(2,"0")}</div>
        <img
          src="${drama.poster}"
          alt="${drama.title}"
          onerror="this.style.display='none'"
          loading="lazy"
        />
      </div>
      <div class="tcard-body">
        <div class="tcard-title">${drama.title}</div>
        <div class="tcard-meta">
          ⭐ ${drama.rating}
          <span>·</span>
          ${genreEmoji(drama.genre)} ${genreLabel(drama.genre)}
        </div>
      </div>
    `;
    card.addEventListener("click", () => openModal(drama));
    row.appendChild(card);
  });
}

// ── Modal ────────────────────────────────────────
function openModal(drama) {
  currentDrama = drama;
  const color  = genreColor(drama.genre);
  const g      = GENRES.find(g => g.id === drama.genre);

  $("modalPoster").src = drama.poster;
  $("modalPoster").onerror = function() {
    this.style.display = "none";
    this.parentElement.style.background = g?.grad || "#111";
    this.parentElement.innerHTML += `<div style="font-size:5rem;display:flex;align-items:center;justify-content:center;height:100%">${drama.fallback}</div>`;
  };

  $("modalGenreChip").textContent = `${genreEmoji(drama.genre)} ${genreLabel(drama.genre)}`;
  $("modalGenreChip").style.cssText = `background:color-mix(in srgb,${color} 20%,rgba(15,17,28,.9));color:${color};border:1px solid color-mix(in srgb,${color} 50%,transparent);`;

  $("modalTitle").textContent = drama.title;
  $("modalKr").textContent    = drama.krTitle;

  $("modalMeta").innerHTML = [
    drama.network, `${drama.year}`, `${drama.episodes} Episodes`, `⭐ ${drama.rating}`
  ].map(m => `<span class="modal-meta-item">${m}</span>`).join("");

  $("modalTags").innerHTML = drama.tags.map(t => `<span class="modal-tag">${t}</span>`).join("");
  $("modalSyn").textContent = drama.synopsis;
  $("modalCast").innerHTML  = `<span>Cast: </span><span>${drama.cast.join(", ")}</span>`;

  updateWLBtn();

  $("modalBg").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  $("modalBg").classList.add("hidden");
  document.body.style.overflow = "";
  currentDrama = null;
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

// ── Watchlist ────────────────────────────────────
function toggleWL() {
  if (!currentDrama) return;
  const idx = watchlist.findIndex(w => w.id === currentDrama.id);
  if (idx === -1) {
    watchlist.push({ id: currentDrama.id, title: currentDrama.title, genre: currentDrama.genre, krTitle: currentDrama.krTitle, poster: currentDrama.poster, rating: currentDrama.rating });
    showToast(`💗 Added "${currentDrama.title}"`);
  } else {
    watchlist.splice(idx, 1);
    showToast(`Removed "${currentDrama.title}"`);
  }
  saveWL();
  updateWLBtn();
  renderWLItems();
}

function updateWLBtn() {
  if (!currentDrama) return;
  const btn = $("wlBtn");
  const has = inWL(currentDrama);
  btn.textContent = has ? "❤ In Watchlist" : "♡ Add to Watchlist";
  btn.classList.toggle("in-wl", has);
}

function saveWL() {
  localStorage.setItem("dramakr_wl", JSON.stringify(watchlist));
  $("wlCount").textContent = watchlist.length;
}

function toggleWLPanel() {
  $("wlPanel").classList.toggle("hidden");
  renderWLItems();
}

function renderWLItems() {
  const box = $("wlItems");
  if (watchlist.length === 0) {
    box.innerHTML = `<p class="wl-empty-msg">No dramas saved yet!<br/>Tap ♡ on any drama.</p>`;
    return;
  }
  box.innerHTML = watchlist.map(w => `
    <div class="wl-item" onclick="openModal(DRAMAS.find(d=>d.id===${w.id}))">
      <img class="wl-item-img" src="${w.poster}" alt="${w.title}" onerror="this.style.display='none'"/>
      <div class="wl-item-info">
        <div class="wl-item-name">${w.title}</div>
        <div class="wl-item-genre">${w.krTitle}</div>
      </div>
      <button class="wl-rm" onclick="event.stopPropagation();removeWL(${w.id})">✕</button>
    </div>
  `).join("");
}

function removeWL(id) {
  watchlist = watchlist.filter(w => w.id !== id);
  saveWL();
  renderWLItems();
}

// ── Toast ─────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ── Cursor Glow ───────────────────────────────────
function initCursor() {
  const glow = $("cursorGlow");
  document.addEventListener("mousemove", e => {
    glow.style.left = e.clientX + "px";
    glow.style.top  = e.clientY + "px";
  });
  // Hide system cursor only on desktop
  if (window.matchMedia("(pointer:fine)").matches) {
    document.body.style.cursor = "none";
    document.querySelectorAll("a,button,input,select").forEach(el => {
      el.style.cursor = "pointer";
    });
  } else {
    glow.style.display = "none";
    document.body.style.cursor = "";
  }
}

// ── Scroll Navbar ─────────────────────────────────
function initScrollNav() {
  const nav = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    nav.style.boxShadow = window.scrollY > 60
      ? "0 4px 40px rgba(255,45,120,0.15)"
      : "";
  }, { passive: true });
}

// ── Search ─────────────────────────────────────────
function initSearch() {
  $("searchInput").addEventListener("input", e => {
    searchQuery = e.target.value;
    renderGrid();
  });
}

// ── Sort ───────────────────────────────────────────
function initSort() {
  $("sortSelect").addEventListener("change", e => {
    sortBy = e.target.value;
    renderGrid();
  });
}

// ── Modal backdrop close ───────────────────────────
$("modalBg").addEventListener("click", e => {
  if (e.target === $("modalBg")) closeModal();
});

// ── Init ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderGenreGrid();
  renderGrid();
  renderTrending();
  initCursor();
  initScrollNav();
  initSearch();
  initSort();
  $("wlCount").textContent = watchlist.length;

  console.log(
    "%c드라마 DRAMA.KR\n%cK-Drama Universe loaded ✨",
    "color:#ff2d78;font-size:1.4rem;font-weight:900;",
    "color:#06d6a0;font-size:.9rem;"
  );
});
