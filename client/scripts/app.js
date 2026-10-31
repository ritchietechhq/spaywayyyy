(function () {
  var root = document.getElementById("app");
  var params = new URLSearchParams(window.location.search);

  var storedUid = "u-member";
  try {
    storedUid =
      params.get("userId") ||
      localStorage.getItem("spayway_user_id") ||
      "u-member";
  } catch (e) {}

  var state = {
    data: null,
    activeUserId: storedUid,
    nav: params.get("tab") || params.get("view") || "personal",
    personalSubTab: params.get("subtab") || "Assets",
    homeFeedTab: "Popular",
    assetSlide: 0,
    lastNavIdx: -1,
    lastNavKey: "",
    lastModal: null,
    chartMode: params.get("chart") === "candle" ? "candlestick" : "line",
    chartPair: params.get("pair") || "SPW/USD",
    chartTimeframe: params.get("tf") || "24H",
    selectedCandleIndex: null,
    isSyncingRates: false,
    discoverCategory: "All",
    searchQuery: "",
    incomePeriod: "Week",
    orderFilter: params.get("filter") || "All",
    rechargeNetwork: "USDT-TRC20",
    rechargePrefillAmount: 50,
    lastTxReceipt: null,
    selectedPackToBuy: null,
    lastDividendClaim: null,
    rankTab: "Views",
    participationTab: "Like",
    modal: params.get("modal") || null,
    selectedArticleId: null,
    mobileMenuOpen: false,
    openCommentId: null,
    savingsBalance: 0,
    usdcBalance: 0,
    likedArticles: [],
    favoriteArticles: [],
    userComments: [],
    withdrawalMethods: [],
    flashExchanges: [],
    milestones: [],
    completedTasks: {},
    chatMessages: [
      {
        sender: "agent",
        text: "Welcome to Spayway Support Desk. How can we assist you with your wallet, chapter, or membership today?"
      }
    ],
    toast: null,
    articles: [
      {
        id: "art-1",
        category: "Economy",
        title: "Cross-Border Trade Settlement & Regional Liquidity Corridors",
        excerpt: "How verified merchant chapters streamline regional trade settlement across West Africa.",
        author: "Spayway Research",
        date: "10/28/2026 07:20:54 AM",
        views: 18,
        likes: 4,
        favorites: 2,
        comments: 1
      },
      {
        id: "art-2",
        category: "Technology",
        title: "Isolated Pack Accounting: Independent Contract Timelines",
        excerpt: "Why isolating each membership contract ensures transparent ledger verification.",
        author: "Protocol Desk",
        date: "10/28/2026 07:20:51 AM",
        views: 12,
        likes: 3,
        favorites: 1,
        comments: 0
      },
      {
        id: "art-3",
        category: "Finance",
        title: "Using Flexible Wallet, Points Wallet, and Savings Jar Effectively",
        excerpt: "Best practices for managing liquid USDT, Points credits, and Savings Jar allocations.",
        author: "Academy Team",
        date: "10/28/2026 07:20:48 AM",
        views: 9,
        likes: 2,
        favorites: 1,
        comments: 0
      },
      {
        id: "art-4",
        category: "Society",
        title: "Building High-Trust Offline Community Chapters & Trade Hubs",
        excerpt: "Field playbook for organizing regional member meetups and merchant onboarding.",
        author: "Community Hub",
        date: "10/28/2026 07:20:45 AM",
        views: 7,
        likes: 1,
        favorites: 0,
        comments: 0
      }
    ]
  };

  var ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-10.5z"/></svg>',
    discover: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    stake: '<svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    team: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    personal: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    milestone: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    upline: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    support: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    cs: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    savings: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 14h.01"/><path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>',
    creator: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    member: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    withdraw: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    swap: '<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    send: '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    up: '<svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
  };

  var MAIN_NAV = [
    { id: "home", label: "Home", icon: ICONS.home },
    { id: "discover", label: "Discover", icon: ICONS.discover },
    { id: "stake", label: "Stake", icon: ICONS.stake },
    { id: "team", label: "Team", icon: ICONS.team },
    { id: "personal", label: "Personal Center", icon: ICONS.personal },
    { id: "milestone", label: "Milestone", icon: ICONS.milestone },
    { id: "upline", label: "Upline", icon: ICONS.upline },
    { id: "support", label: "Support Center", icon: ICONS.support },
    { id: "cs", label: "Customer Support", icon: ICONS.cs },
    { id: "savings", label: "Savings Jar", icon: ICONS.savings }
  ];

  var BOTTOM_NAV = [
    { id: "creator", label: "Creator", icon: ICONS.creator },
    { id: "member", label: "Member", icon: ICONS.member },
    { id: "download", label: "Download", icon: ICONS.download }
  ];

  function fmt(n) {
    var val = Number(n || 0);
    return val === 0 ? "0" : val.toFixed(2);
  }

  function userFlexUsdt(u) {
    return Number(((u.availableBalanceCents || 0) / 100).toFixed(2));
  }

  function showToast(msg, isError) {
    state.toast = { msg: msg, isError: !!isError };
    render();
    setTimeout(function () {
      state.toast = null;
      render();
    }, 3200);
  }

  function copyToClipboard(text, label) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch (e) {}
    showToast((label || "Copied") + ": " + text, false);
  }

  function syncFromSnapshot(snap) {
    if (!snap) return;
    state.data = snap;
    state.activeUserId = snap.activeUser.id;
    try {
      localStorage.setItem("spayway_user_id", snap.activeUser.id);
    } catch (e) {}
    if (Array.isArray(snap.articles) && snap.articles.length) {
      state.articles = snap.articles.map(function (a) {
        return {
          id: a.id,
          category: a.category,
          title: a.title,
          excerpt: a.excerpt,
          author: a.authorName || a.author || "Spayway",
          date: a.date || "10/28/2026 07:20 AM",
          views: Number(a.views || 0),
          likes: Number(a.likes || 0),
          favorites: Number(a.favorites || 0),
          comments: Number(a.comments || 0)
        };
      });
    }
    var ws = snap.isolatedWorkspace;
    if (ws) {
      state.usdcBalance = Number(((ws.usdcBalanceCents || 0) / 100).toFixed(2));
      state.savingsBalance = Number(((ws.savingsJarCents || 0) / 100).toFixed(2));
      state.likedArticles = Array.isArray(ws.likedArticleIds) ? ws.likedArticleIds.slice() : [];
      state.favoriteArticles = Array.isArray(ws.favoriteArticleIds) ? ws.favoriteArticleIds.slice() : [];
      state.userComments = Array.isArray(ws.comments) ? ws.comments.slice() : [];
      state.withdrawalMethods = Array.isArray(ws.withdrawalMethods) ? ws.withdrawalMethods.slice() : [];
      state.flashExchanges = Array.isArray(ws.flashExchanges) ? ws.flashExchanges.slice() : [];
      state.milestones = Array.isArray(ws.milestones) ? ws.milestones.slice() : [];
      var doneMap = {};
      (ws.completedTaskIds || []).forEach(function (tid) {
        doneMap[tid] = true;
      });
      state.completedTasks = doneMap;
    }
  }

  function getAuthHeaders(ignoreToken) {
    var headers = { "Content-Type": "application/json" };
    if (!ignoreToken) {
      try {
        var tok = localStorage.getItem("spayway_token");
        if (tok) headers["Authorization"] = "Bearer " + tok;
      } catch (e) {}
    }
    return headers;
  }

  async function loadState(userId, clearToken) {
    if (clearToken) {
      try {
        localStorage.removeItem("spayway_token");
      } catch (e) {}
    }
    var uid = userId || state.activeUserId;
    var res = await fetch("/api/state?userId=" + encodeURIComponent(uid), {
      headers: getAuthHeaders(clearToken)
    });
    var snap = await res.json();
    syncFromSnapshot(snap);
    render();
  }

  async function dispatchAction(actionName, payload, successMsg, keepModalOpen) {
    try {
      var res = await fetch("/api/action", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: actionName,
          activeUserId: state.activeUserId,
          payload: payload || {}
        })
      });
      var json = await res.json();
      if (!res.ok || json.error || json.ok === false) {
        showToast(json.error || "Operation failed", true);
        return false;
      }
      if (json.token) {
        try {
          localStorage.setItem("spayway_token", json.token);
        } catch (e) {}
      }
      syncFromSnapshot(json.state || json);
      if (!keepModalOpen) {
        state.modal = null;
      }
      if (successMsg) showToast(successMsg, false);
      render(false, true);
      return json.result !== undefined ? json.result : true;
    } catch (err) {
      showToast(err.message || "Network error", true);
      return false;
    }
  }

  function renderLeftSidebar(u) {
    var mainHtml = MAIN_NAV.map(function (item) {
      var active = state.nav === item.id ? " active" : "";
      return (
        '<button type="button" class="echo-nav-item' +
        active +
        '" data-nav="' +
        item.id +
        '">' +
        '<span class="echo-nav-icon">' +
        item.icon +
        "</span>" +
        "<span>" +
        item.label +
        "</span>" +
        "</button>"
      );
    }).join("");

    var bottomHtml = BOTTOM_NAV.map(function (item) {
      var active = state.nav === item.id ? " active" : "";
      return (
        '<button type="button" class="echo-nav-item' +
        active +
        '" data-nav="' +
        item.id +
        '">' +
        '<span class="echo-nav-icon">' +
        item.icon +
        "</span>" +
        "<span>" +
        item.label +
        "</span>" +
        "</button>"
      );
    }).join("");

    var initial = (u.name || "S").charAt(0).toUpperCase();

    return (
      '<aside class="echo-sidebar' +
      (state.mobileMenuOpen ? " mobile-open" : "") +
      '">' +
      "<div>" +
      '<div class="echo-brand-row">' +
      '<a href="/" class="echo-brand">' +
      '<img src="/assets/logo-mark.svg" alt="Spayway" />' +
      "<span>SPAYWAY</span>" +
      "</a>" +
      "</div>" +
      '<div class="sidebar-user-card" data-subtab="Account" title="View Account Profile">' +
      '<div class="sidebar-user-left">' +
      '<div class="sidebar-user-avatar">' +
      initial +
      "</div>" +
      '<div class="sidebar-user-info">' +
      "<strong>" +
      u.name +
      "</strong>" +
      "<span>Good afternoon</span>" +
      "</div>" +
      "</div>" +
      '<span class="sidebar-user-arrow">›</span>' +
      "</div>" +
      '<nav class="echo-nav-list">' +
      mainHtml +
      '<div class="echo-nav-divider"></div>' +
      bottomHtml +
      "</nav>" +
      "</div>" +
      '<button type="button" class="sidebar-logout-btn" id="logoutBtn">Log out</button>' +
      "</aside>"
    );
  }

  function renderCenterSearchRow() {
    var u = state.data ? state.data.activeUser : null;
    var isTestUser = u && u.id === "u-test";
    return (
      '<div class="center-top-search-row">' +
      '<div class="echo-search-pill">' +
      ICONS.search +
      '<input type="text" id="searchInput" placeholder="Search Spayway" value="' +
      state.searchQuery +
      '" />' +
      "</div>" +
      '<div class="center-top-icons">' +
      '<button type="button" class="icon-circle-btn" data-switch-user="' +
      (isTestUser ? "u-member" : "u-test") +
      '" title="' +
      (isTestUser
        ? "Switch to Clean 0-Balance Account (USER-1088554)"
        : "Switch to Pre-Loaded Test Account (test@spayway.app)") +
      '">' +
      ICONS.globe +
      "</button>" +
      '<button type="button" class="icon-circle-btn" data-open-modal="notifications" title="Notifications">' +
      ICONS.bell +
      "</button>" +
      "</div>" +
      "</div>"
    );
  }

  function getActivePairSummary() {
    var mr = state.data && state.data.marketRates;
    if (mr && mr.pairs && mr.pairs[state.chartPair]) {
      return mr.pairs[state.chartPair];
    }
    var pair = state.chartPair || "SPW/USD";
    var parts = pair.split("/");
    var base = parts[0] || "SPW";
    var quote = parts[1] || "USD";
    var isStable = pair === "USDC/USDT";
    var isNgn = pair === "USDT/NGN";
    var isGhs = pair === "USDT/GHS";
    var curP = isStable ? 1.0001 : isNgn ? 1620.0 : isGhs ? 15.65 : 1.054;
    var dec = (isNgn || isGhs) ? 2 : 4;
    var baseCandles = [
      { label: "10-28 06:00", open: curP * 0.985, high: curP * 0.992, low: curP * 0.982, close: curP * 0.990, volume: 1200 },
      { label: "10-28 08:00", open: curP * 0.990, high: curP * 0.998, low: curP * 0.988, close: curP * 0.995, volume: 1540 },
      { label: "10-28 10:00", open: curP * 0.995, high: curP * 1.006, low: curP * 0.993, close: curP * 1.002, volume: 1820 },
      { label: "10-28 12:00", open: curP * 1.002, high: curP * 1.010, low: curP * 0.998, close: curP * 1.005, volume: 1650 },
      { label: "10-28 14:00", open: curP * 1.005, high: curP * 1.018, low: curP * 1.001, close: curP * 1.012, volume: 2100 },
      { label: "10-28 16:00", open: curP * 1.012, high: curP * 1.025, low: curP * 1.008, close: curP, volume: 1950 }
    ];
    return {
      pair: pair,
      baseAsset: base,
      quoteAsset: quote,
      currentPrice: curP,
      open24h: curP * 0.985,
      high24h: curP * 1.025,
      low24h: curP * 0.982,
      change24hValue: curP * 0.015,
      change24hPct: 1.52,
      volume24h: 38500,
      decimals: dec,
      lastSyncedAt: new Date().toISOString(),
      candles: {
        "24H": baseCandles,
        "7D": baseCandles,
        "30D": baseCandles,
        "90D": baseCandles
      }
    };
  }

  function renderInteractiveChart() {
    var summary = getActivePairSummary();
    var tf = state.chartTimeframe || "24H";
    var candles = (summary.candles && summary.candles[tf]) || summary.candles["24H"] || [];
    if (!candles.length) {
      return '<div class="echo-empty-state">No rate candles available for ' + summary.pair + " (" + tf + ").</div>";
    }

    var dec = summary.decimals || (summary.quoteAsset === "NGN" || summary.quoteAsset === "GHS" ? 2 : 4);

    var minP = Infinity;
    var maxP = -Infinity;
    for (var i = 0; i < candles.length; i++) {
      var c = candles[i];
      var lo = typeof c.low === "number" ? c.low : Math.min(c.open, c.close);
      var hi = typeof c.high === "number" ? c.high : Math.max(c.open, c.close);
      if (lo < minP) minP = lo;
      if (hi > maxP) maxP = hi;
    }
    if (maxP === minP || !isFinite(minP) || !isFinite(maxP)) {
      maxP += 0.005;
      minP = Math.max(0, minP - 0.005);
    }
    var pad = (maxP - minP) * 0.08;
    var pMax = maxP + pad;
    var pMin = Math.max(0, minP - pad);
    var pRange = pMax - pMin || 1;

    var isMobileChart = window.innerWidth <= 768;
    var VBW = isMobileChart ? 360 : 680;
    var VBH = isMobileChart ? 215 : 190;
    var chartW = isMobileChart ? 292 : 560;
    var chartX0 = isMobileChart ? 12 : 25;
    var chartY0 = 20;
    var chartH = isMobileChart ? 150 : 126;
    var chartY1 = chartY0 + chartH;
    var yLabelX = chartX0 + chartW + (isMobileChart ? 8 : 11);

    function getX(idx) {
      if (candles.length <= 1) return chartX0 + chartW / 2;
      return chartX0 + (idx / (candles.length - 1)) * chartW;
    }
    function getY(price) {
      return chartY1 - ((price - pMin) / pRange) * chartH;
    }

    var yGrid1 = chartY0 + 12;
    var yGrid2 = chartY0 + chartH / 2;
    var yGrid3 = chartY1 - 8;

    var pGrid1 = pMax - ((yGrid1 - chartY0) / chartH) * pRange;
    var pGrid2 = (pMax + pMin) / 2;
    var pGrid3 = pMax - ((yGrid3 - chartY0) / chartH) * pRange;

    var labelCount = Math.min(window.innerWidth <= 768 ? 4 : 6, candles.length);
    var xLabelsHtml = "";
    for (var s = 0; s < labelCount; s++) {
      var sIdx = Math.round((s / (labelCount - 1 || 1)) * (candles.length - 1));
      var cand = candles[sIdx];
      if (cand) {
        var lx = Math.round(getX(sIdx));
        var txt = cand.label || (cand.timestamp ? cand.timestamp.slice(5, 10) : "");
        xLabelsHtml += '<text x="' + Math.max(4, Math.min(chartX0 + chartW - 44, lx - 24)) + '" y="' + (chartY1 + 22) + '" fill="#a1a1aa" font-size="10">' + txt + "</text>";
      }
    }

    var chartContent = "";
    if (state.chartMode === "candlestick") {
      var candleWidth = Math.max(5, Math.min(14, Math.floor(chartW / (candles.length * 1.45))));
      var candleBars = candles
        .map(function (cd, idx) {
          var cx = Math.round(getX(idx));
          var isUp = cd.close >= cd.open;
          var color = isUp ? "#10b981" : "#e11d48";
          var top = Math.round(Math.min(getY(cd.open), getY(cd.close)));
          var bottom = Math.round(Math.max(getY(cd.open), getY(cd.close)));
          var h = Math.max(3, bottom - top);
          var wickTop = Math.round(getY(cd.high));
          var wickBottom = Math.round(getY(cd.low));
          var isSelected = state.selectedCandleIndex === idx;
          var strokeW = isSelected ? 2.5 : 1.3;
          var strokeCol = isSelected ? "#0f172a" : color;

          return (
            '<g class="chart-candle-group" data-inspect-candle="' +
            idx +
            '" style="cursor:pointer;">' +
            '<line x1="' +
            cx +
            '" y1="' +
            wickTop +
            '" x2="' +
            cx +
            '" y2="' +
            wickBottom +
            '" stroke="' +
            color +
            '" stroke-width="' +
            strokeW +
            '"/>' +
            '<rect x="' +
            (cx - candleWidth / 2) +
            '" y="' +
            top +
            '" width="' +
            candleWidth +
            '" height="' +
            h +
            '" rx="1" fill="' +
            color +
            '" stroke="' +
            strokeCol +
            '" stroke-width="' +
            (isSelected ? 1.5 : 0) +
            '"/>' +
            "</g>"
          );
        })
        .join("");

      chartContent = (
        '<svg viewBox="0 0 ' + VBW + ' ' + VBH + '" role="img" aria-label="SPW Candlestick Chart">' +
        '<line x1="' +
        chartX0 +
        '" y1="' +
        yGrid1 +
        '" x2="' +
        (chartX0 + chartW) +
        '" y2="' +
        yGrid1 +
        '" stroke="#f1f1f4" stroke-width="1"/>' +
        '<line x1="' +
        chartX0 +
        '" y1="' +
        yGrid2 +
        '" x2="' +
        (chartX0 + chartW) +
        '" y2="' +
        yGrid2 +
        '" stroke="#f1f1f4" stroke-width="1"/>' +
        '<line x1="' +
        chartX0 +
        '" y1="' +
        yGrid3 +
        '" x2="' +
        (chartX0 + chartW) +
        '" y2="' +
        yGrid3 +
        '" stroke="#f1f1f4" stroke-width="1"/>' +
        candleBars +
        '<text x="' + yLabelX + '" y="' +
        (yGrid1 + 4) +
        '" fill="#a1a1aa" font-size="10">' +
        pGrid1.toFixed(dec) +
        "</text>" +
        '<text x="' + yLabelX + '" y="' +
        (yGrid2 + 4) +
        '" fill="#a1a1aa" font-size="10">' +
        pGrid2.toFixed(dec) +
        "</text>" +
        '<text x="' + yLabelX + '" y="' +
        (yGrid3 + 4) +
        '" fill="#a1a1aa" font-size="10">' +
        pGrid3.toFixed(dec) +
        "</text>" +
        xLabelsHtml +
        "</svg>"
      );
    } else {
      var isNetUp = candles[candles.length - 1].close >= candles[0].open;
      var lineColor = isNetUp ? "#10b981" : "#e11d48";
      var fillColor = isNetUp ? "#ecfdf5" : "#ffe4e6";
      var pts = candles
        .map(function (cd, idx) {
          return Math.round(getX(idx)) + "," + Math.round(getY(cd.close));
        })
        .join(" ");
      var areaPts = chartX0 + "," + chartY1 + " " + pts + " " + (chartX0 + chartW) + "," + chartY1;

      var dotsHtml = candles
        .map(function (cd, idx) {
          var cx = Math.round(getX(idx));
          var cy = Math.round(getY(cd.close));
          var isSelected = state.selectedCandleIndex === idx;
          return (
            '<g data-inspect-candle="' +
            idx +
            '" style="cursor:pointer;">' +
            '<rect x="' +
            (cx - 10) +
            '" y="' +
            chartY0 +
            '" width="20" height="' +
            chartH +
            '" fill="transparent"/>' +
            (isSelected
              ? '<line x1="' +
                cx +
                '" y1="' +
                chartY0 +
                '" x2="' +
                cx +
                '" y2="' +
                chartY1 +
                '" stroke="#94a3b8" stroke-dasharray="3,3" stroke-width="1"/>' +
                '<circle cx="' +
                cx +
                '" cy="' +
                cy +
                '" r="5" fill="' +
                lineColor +
                '" stroke="#ffffff" stroke-width="2"/>'
              : '<circle cx="' +
                cx +
                '" cy="' +
                cy +
                '" r="3" fill="' +
                lineColor +
                '" class="chart-candle-dot"/>') +
            "</g>"
          );
        })
        .join("");

      chartContent = (
        '<svg viewBox="0 0 ' + VBW + ' ' + VBH + '" role="img" aria-label="SPW Price Line Chart">' +
        '<line x1="' +
        chartX0 +
        '" y1="' +
        yGrid1 +
        '" x2="' +
        (chartX0 + chartW) +
        '" y2="' +
        yGrid1 +
        '" stroke="#f1f1f4" stroke-width="1"/>' +
        '<line x1="' +
        chartX0 +
        '" y1="' +
        yGrid2 +
        '" x2="' +
        (chartX0 + chartW) +
        '" y2="' +
        yGrid2 +
        '" stroke="#f1f1f4" stroke-width="1"/>' +
        '<line x1="' +
        chartX0 +
        '" y1="' +
        yGrid3 +
        '" x2="' +
        (chartX0 + chartW) +
        '" y2="' +
        yGrid3 +
        '" stroke="#f1f1f4" stroke-width="1"/>' +
        '<polygon points="' +
        areaPts +
        '" fill="' +
        fillColor +
        '" fill-opacity="0.65"/>' +
        '<polyline fill="none" stroke="' +
        lineColor +
        '" stroke-width="2" points="' +
        pts +
        '"/>' +
        dotsHtml +
        '<text x="' + yLabelX + '" y="' +
        (yGrid1 + 4) +
        '" fill="#a1a1aa" font-size="10">' +
        pGrid1.toFixed(dec) +
        "</text>" +
        '<text x="' + yLabelX + '" y="' +
        (yGrid2 + 4) +
        '" fill="#a1a1aa" font-size="10">' +
        pGrid2.toFixed(dec) +
        "</text>" +
        '<text x="' + yLabelX + '" y="' +
        (yGrid3 + 4) +
        '" fill="#a1a1aa" font-size="10">' +
        pGrid3.toFixed(dec) +
        "</text>" +
        xLabelsHtml +
        "</svg>"
      );
    }

    var activeIdx =
      state.selectedCandleIndex !== null &&
      state.selectedCandleIndex >= 0 &&
      state.selectedCandleIndex < candles.length
        ? state.selectedCandleIndex
        : candles.length - 1;
    var activeCandle = candles[activeIdx] || candles[0];

    var inspectorHtml = (
      '<div class="chart-inspector-bar" id="candleInspectorInfo">' +
      '<div class="chart-inspector-stats">' +
      "<span><strong>" +
      (activeCandle.label || activeCandle.timestamp || "") +
      "</strong></span>" +
      "<span>O: <strong>" +
      activeCandle.open.toFixed(dec) +
      "</strong></span>" +
      "<span>H: <strong>" +
      activeCandle.high.toFixed(dec) +
      "</strong></span>" +
      "<span>L: <strong>" +
      activeCandle.low.toFixed(dec) +
      "</strong></span>" +
      "<span>C: <strong>" +
      activeCandle.close.toFixed(dec) +
      "</strong></span>" +
      "<span>Vol: <strong>" +
      Number(activeCandle.volume || 0).toLocaleString() +
      "</strong></span>" +
      "</div>" +
      (activeCandle.eventNote
        ? '<div class="chart-inspector-note" style="color:var(--accent);font-weight:600;">📌 ' +
          activeCandle.eventNote +
          "</div>"
        : "") +
      "</div>"
    );

    return chartContent + inspectorHtml;
  }

  function renderArticleCards(list) {
    if (!list.length) {
      return '<div class="echo-empty-state">No matching articles found.</div>';
    }
    return list
      .map(function (a) {
        var isLiked = state.likedArticles.indexOf(a.id) !== -1;
        var isFav = state.favoriteArticles.indexOf(a.id) !== -1;
        var commentOpen = state.openCommentId === a.id;
        return (
          '<article class="echo-article-card">' +
          '<span class="echo-article-cat">' +
          a.category +
          "</span>" +
          '<div class="echo-article-title" style="cursor:pointer;" data-read-article="' +
          a.id +
          '">' +
          a.title +
          "</div>" +
          '<div class="echo-article-visual" style="cursor:pointer;" data-read-article="' +
          a.id +
          '">' +
          "<span>" +
          a.category +
          " · SPAYWAY DISPATCH</span>" +
          "<strong>" +
          a.excerpt +
          "</strong>" +
          "</div>" +
          '<div class="echo-article-foot">' +
          '<div class="echo-article-stats">' +
          '<button type="button" class="stat-act-btn" data-read-article="' +
          a.id +
          '">👁 ' +
          a.views +
          "</button>" +
          '<button type="button" class="stat-act-btn' +
          (isLiked ? " liked" : "") +
          '" data-like-article="' +
          a.id +
          '">👍 ' +
          a.likes +
          "</button>" +
          '<button type="button" class="stat-act-btn' +
          (isFav ? " liked" : "") +
          '" data-fav-article="' +
          a.id +
          '">☆ ' +
          (a.favorites || 0) +
          "</button>" +
          '<button type="button" class="stat-act-btn" data-toggle-comment="' +
          a.id +
          '">💬 ' +
          a.comments +
          "</button>" +
          "</div>" +
          "<span>📅 " +
          a.date +
          "</span>" +
          "</div>" +
          (commentOpen
            ? '<form class="article-comment-form" data-comment-form="' +
              a.id +
              '">' +
              '<input type="text" name="commentText" placeholder="Write a comment..." required />' +
              '<button type="submit" class="btn btn-primary">Post</button>' +
              "</form>"
            : "") +
          "</article>"
        );
      })
      .join("");
  }

  function renderHomeCenter() {
    var filtered = state.articles
      .filter(function (a) {
        if (!state.searchQuery) return true;
        var q = state.searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().indexOf(q) !== -1 ||
          a.excerpt.toLowerCase().indexOf(q) !== -1 ||
          a.category.toLowerCase().indexOf(q) !== -1
        );
      })
      .slice();

    if (state.homeFeedTab === "Popular") {
      filtered.sort(function (a, b) {
        return b.views + b.likes * 3 - (a.views + a.likes * 3);
      });
    } else {
      filtered.reverse();
    }

    return (
      '<div class="echo-bookmark-banner">' +
      "<div><strong>Bookmark us</strong><span>Bookmark this site for easy access next time</span></div>" +
      '<button type="button" class="save-url-btn" data-copy-text="' +
      window.location.origin +
      '/app">Save URL</button>' +
      "</div>" +
      renderCenterSearchRow() +
      '<div class="home-quick-cards">' +
      '<div class="home-quick-card tint-1" data-open-modal="recharge"><strong>Top up</strong><span class="home-quick-badge">' +
      ICONS.plus +
      "</span></div>" +
      '<div class="home-quick-card tint-2" data-nav="stake"><strong>Subscription</strong><span class="home-quick-badge">' +
      ICONS.stake +
      "</span></div>" +
      '<div class="home-quick-card tint-3" data-subtab="Refer & Earn"><strong>Invite</strong><span class="home-quick-badge">' +
      ICONS.team +
      "</span></div>" +
      '<div class="home-quick-card tint-4" data-subtab="Tasks"><strong>Task Center</strong><span class="home-quick-badge">' +
      ICONS.milestone +
      "</span></div>" +
      '<div class="home-quick-card tint-5" data-nav="support"><strong>Help</strong><span class="home-quick-badge">' +
      ICONS.support +
      "</span></div>" +
      "</div>" +
      '<div class="segmented-tabs cols-2">' +
      ["Popular", "Latest"]
        .map(function (t) {
          return (
            '<button type="button" class="seg-tab' +
            (state.homeFeedTab === t ? " active" : "") +
            '" data-home-tab="' +
            t +
            '">' +
            t +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="chart-card">' +
      '<div class="chart-controls-row">' +
      '<div class="chart-pair-pills">' +
      ["SPW/USD", "USDC/USDT", "USDT/NGN", "USDT/GHS"]
        .map(function (p) {
          return (
            '<button type="button" class="chart-pair-pill' +
            (state.chartPair === p ? " active" : "") +
            '" data-chart-pair="' +
            p +
            '">' +
            p +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="chart-tf-pills">' +
      ["24H", "7D", "30D", "90D"]
        .map(function (tf) {
          return (
            '<button type="button" class="chart-tf-pill' +
            (state.chartTimeframe === tf ? " active" : "") +
            '" data-chart-tf="' +
            tf +
            '">' +
            tf +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<button type="button" class="chart-sync-btn" id="syncRatesBtn" title="Sync live exchange rates">' +
      (state.isSyncingRates ? "↻" : '↻<span class="sync-label"> Sync Live Rates</span>') +
      "</button>" +
      "</div>" +
      '<div class="chart-card-top">' +
      '<div class="chart-token-head"><span class="chart-token-dot">' +
      getActivePairSummary().baseAsset.charAt(0) +
      "</span><span>" +
      getActivePairSummary().pair +
      '</span><span class="chart-sync-tag">' +
      (getActivePairSummary().lastSyncedAt ? "Synced " + getActivePairSummary().lastSyncedAt.slice(11, 19) + " UTC" : "Live Oracle") +
      "</span></div>" +
      '<button type="button" class="chart-mode-btn" id="toggleChartModeBtn">' +
      (state.chartMode === "line" ? "Candlestick Chart ›" : "Area Line Chart ›") +
      "</button>" +
      "</div>" +
      '<div class="chart-price-line">' +
      '<span class="chart-price-label">Current Price</span>' +
      '<span class="chart-price-val">' +
      getActivePairSummary().currentPrice.toFixed(getActivePairSummary().decimals) +
      " " +
      getActivePairSummary().quoteAsset +
      "</span>" +
      '<span class="chart-price-change' +
      (getActivePairSummary().change24hPct < 0 ? " negative" : "") +
      '">' +
      (getActivePairSummary().change24hPct >= 0 ? "+" : "") +
      getActivePairSummary().change24hPct.toFixed(2) +
      "%</span>" +
      '<span class="chart-stats-pill">24h H: ' +
      getActivePairSummary().high24h.toFixed(getActivePairSummary().decimals) +
      "</span>" +
      '<span class="chart-stats-pill">24h L: ' +
      getActivePairSummary().low24h.toFixed(getActivePairSummary().decimals) +
      "</span>" +
      '<span class="chart-stats-pill">Vol: $' +
      getActivePairSummary().volume24h.toLocaleString() +
      "</span>" +
      "</div>" +
      '<div class="chart-svg-wrap">' +
      renderInteractiveChart() +
      "</div>" +
      "</div>" +
      '<div class="echo-section-head" style="margin-top:4px;"><h3>Hot news</h3></div>' +
      '<div class="hot-news-grid">' +
      '<div class="hot-news-card" data-read-article="art-1">' +
      '<span class="hot-news-badge">🔥 Top 1</span>' +
      "<div><h4>Cross-Border Trade Settlement &amp; Regional Liquidity Corridors</h4><p>Verified merchant chapters &amp; settlement analytics</p></div>" +
      "</div>" +
      '<div class="hot-news-card" data-read-article="art-2">' +
      '<span class="hot-news-badge">⚡ Featured</span>' +
      "<div><h4>Isolated Pack Accounting &amp; 90-Day Chapter Structure</h4><p>Read full protocol dispatch</p></div>" +
      "</div>" +
      "</div>" +
      '<div class="echo-feed-list">' +
      renderArticleCards(filtered) +
      "</div>"
    );
  }

  function renderDiscoverCenter() {
    var cats = [
      "All",
      "Web3",
      "DeFi",
      "DePIN",
      "Economy",
      "Technology",
      "Finance",
      "Regulation",
      "Security",
      "Global Affairs"
    ];
    var filtered = state.articles.filter(function (a) {
      var catMatch =
        state.discoverCategory === "All" || a.category === state.discoverCategory;
      var qMatch =
        !state.searchQuery ||
        a.title.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1 ||
        a.excerpt.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1;
      return catMatch && qMatch;
    });

    return (
      renderCenterSearchRow() +
      '<h1 class="page-main-title">Discover</h1>' +
      '<div class="discover-cat-bar">' +
      '<div class="echo-cat-pills">' +
      cats
        .map(function (c) {
          return (
            '<button type="button" class="echo-cat-pill' +
            (state.discoverCategory === c ? " active" : "") +
            '" data-disc-cat="' +
            c +
            '">' +
            c +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<button type="button" class="discover-plus-btn" data-nav="creator" title="Publish Dispatch">+</button>' +
      "</div>" +
      '<div class="echo-feed-list">' +
      renderArticleCards(filtered) +
      "</div>"
    );
  }

  function renderPersonalSubTabContent(u, d) {
    var mr = (d && d.marketRates) || (state.data && state.data.marketRates) || {};
    var spwRate = Number(
      mr.spwUsd ||
        (mr.pairs && mr.pairs["SPW/USD"] && mr.pairs["SPW/USD"].currentPrice) ||
        1.054
    );
    var usdcRate = Number(
      mr.usdcUsdt ||
        (mr.pairs && mr.pairs["USDC/USDT"] && mr.pairs["USDC/USDT"].currentPrice) ||
        1.0001
    );

    var flexUsdt = userFlexUsdt(u);
    var pointsBal = Number(u.xpPoints || 0);
    var savingsBal = Number(state.savingsBalance || 0);
    var usdcBal = Number(state.usdcBalance || 0);
    var totalAssets =
      flexUsdt + usdcBal * usdcRate + savingsBal + pointsBal * spwRate;

    var userContracts = (d.contracts || []).filter(function (c) {
      return c.userId === u.id;
    });
    var userLogs = (d.ledgerLogs || []).filter(function (l) {
      return l.userId === u.id;
    });

    var periodMultiplier =
      state.incomePeriod === "Week" ? 1 : state.incomePeriod === "Month" ? 1 : 1;
    var referralRebate = Number(
      (((u.totalCommissionsEarnedCents || 0) / 100) * periodMultiplier).toFixed(2)
    );
    var activityRebate = Number(
      (
        (((u.totalCapitalReturnedCents || 0) +
          (u.totalRoyaltiesEarnedCents || 0)) /
          100) *
        periodMultiplier
      ).toFixed(2)
    );

    if (state.personalSubTab === "Account") {
      var isTestAcct = u.id === "u-test";
      return (
        '<div class="echo-card" style="display:flex;flex-direction:column;gap:14px;">' +
        '<div class="echo-section-head" style="margin-bottom:0;">' +
        "<h3>Account Profile &amp; Workspace Switcher</h3>" +
        '<button type="button" class="btn btn-primary" data-switch-user="' +
        (isTestAcct ? "u-member" : "u-test") +
        '">' +
        (isTestAcct
          ? "Switch to Clean 0-Balance Account"
          : "Switch to Pre-Loaded Test Account (test@spayway.app)") +
        "</button>" +
        "</div>" +
        '<div class="echo-token-list">' +
        '<div class="echo-token-row"><div class="echo-token-name">Member Display Name</div><div class="echo-token-bal">' +
        u.name +
        "</div></div>" +
        '<div class="echo-token-row"><div class="echo-token-name">Workspace Member ID</div><div class="echo-token-bal">' +
        u.id +
        "</div></div>" +
        '<div class="echo-token-row"><div class="echo-token-name">Registered Email</div><div class="echo-token-bal">' +
        (u.email || "—") +
        "</div></div>" +
        '<div class="echo-token-row"><div class="echo-token-name">Invitation Code</div><div class="echo-token-bal">' +
        u.referralCode +
        "</div></div>" +
        '<div class="echo-token-row"><div class="echo-token-name">Preferred Settlement</div><div class="echo-token-bal">' +
        (u.preferredCurrency || "USDT") +
        "</div></div>" +
        "</div>" +
        '<form id="profileUpdateForm" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;padding-top:8px;border-top:1px solid var(--line);">' +
        '<div class="field" style="flex:1;min-width:180px;"><label>Update Display Name</label><input type="text" name="name" value="' +
        u.name +
        '" required /></div>' +
        '<div class="field" style="width:140px;"><label>Currency</label><select name="currency"><option value="USDT"' +
        (u.preferredCurrency === "USDT" ? " selected" : "") +
        '>USDT</option><option value="USD"' +
        (u.preferredCurrency === "USD" ? " selected" : "") +
        '>USD</option><option value="NGN"' +
        (u.preferredCurrency === "NGN" ? " selected" : "") +
        '>NGN</option><option value="GHS"' +
        (u.preferredCurrency === "GHS" ? " selected" : "") +
        '>GHS</option></select></div>' +
        '<button type="submit" class="btn btn-primary" style="height:38px;">Save Profile</button>' +
        "</form>" +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button type="button" class="btn btn-outline" data-open-modal="withdrawalInfo">Manage Withdrawal Methods (' +
        state.withdrawalMethods.length +
        ")</button>" +
        '<button type="button" class="btn btn-outline" data-open-modal="withdrawalHistory">Withdrawal Records (' +
        ((state.data && (state.data.userWithdrawals || state.data.withdrawals) || []).length) +
        ")</button>" +
        '<a href="/auth?mode=signin" class="btn btn-outline">Open Auth Portal (/auth)</a>' +
        "</div>" +
        "</div>"
      );
    }

    if (state.personalSubTab === "Membership") {
      return (
        '<div class="echo-section-head"><h3>Active Subscriptions (' +
        userContracts.length +
        ')</h3><button type="button" class="btn btn-primary" data-nav="stake">Browse / Activate Packs</button></div>' +
        (userContracts.length === 0
          ? '<div class="echo-empty-state">No active subscription packs yet. Click "Browse / Activate Packs" to activate a $30, $50, $120, or $350 pack.</div>'
          : '<div class="echo-token-list">' +
            userContracts
              .map(function (c) {
                var pct = Math.min(
                  100,
                  Math.round(((c.currentDayElapsed || 0) / (c.activeDailyEarningDays || 60)) * 100)
                );
                return (
                  '<div class="echo-card" style="display:flex;flex-direction:column;gap:12px;">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
                  '<div><div class="echo-token-name" style="font-size:0.95rem;">' +
                  c.packName +
                  '</div><div class="echo-token-sub">Day ' +
                  (c.currentDayElapsed || 0) +
                  " / " +
                  c.totalLifecycleDays +
                  " · Daily Payout: $" +
                  fmt((c.dailyPayoutCents || 0) / 100) +
                  "/day · Status: " +
                  c.phaseStatus +
                  "</div></div>" +
                  '<div class="echo-token-right"><div class="echo-token-bal" style="color:var(--positive);">Earned: $' +
                  fmt((c.totalDailyCreditedCents || 0) / 100) +
                  ' USDT</div><div class="echo-token-usd">Principal: $' +
                  fmt((c.principalCents || 0) / 100) +
                  " USDT</div></div>" +
                  "</div>" +
                  '<div style="height:8px;background:var(--surface-muted);border-radius:999px;overflow:hidden;">' +
                  '<div style="height:100%;width:' +
                  pct +
                  '%;background:var(--positive);"></div>' +
                  "</div>" +
                  '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                  '<button type="button" class="btn btn-primary" data-advance-contract="' +
                  c.id +
                  '" data-advance-days="1">Simulate +1 Day Dividend (+$' +
                  fmt((c.dailyPayoutCents || 0) / 100) +
                  ")</button>" +
                  '<button type="button" class="btn btn-outline" data-advance-contract="' +
                  c.id +
                  '" data-advance-days="5">Simulate +5 Days</button>' +
                  "</div>" +
                  "</div>"
                );
              })
              .join("") +
            "</div>")
      );
    }

    if (state.personalSubTab === "Tasks") {
      var tasks = d.taskDefinitions || [
        { id: "t1", title: "Verify Member Account Profile", rewardLabel: "Verified Badge + 10 SPW" },
        { id: "t2", title: "Read & Like 1 Community Dispatch in Discover", rewardLabel: "+15 SPW Points" },
        { id: "t3", title: "Share Invitation Code with Regional Chapter", rewardLabel: "+25 SPW Points" },
        { id: "t4", title: "Execute a 1:1 Flash Exchange or Savings Jar Allocation", rewardLabel: "+20 SPW Points" },
        { id: "t5", title: "Save a Verified USDT / Bank Withdrawal Method", rewardLabel: "+30 SPW Points" }
      ];
      return (
        '<div class="echo-section-head"><h3>Member Skill &amp; Onboarding Tasks</h3><span style="font-size:0.78rem;color:var(--muted);">Points Balance: <strong>' +
        fmt(pointsBal) +
        " SPW</strong></span></div>" +
        '<div class="echo-token-list">' +
        tasks
          .map(function (t) {
            var done = !!state.completedTasks[t.id];
            return (
              '<div class="echo-token-row">' +
              '<div><div class="echo-token-name">' +
              t.title +
              '</div><div class="echo-token-sub">' +
              (t.rewardLabel || t.reward) +
              "</div></div>" +
              '<button type="button" class="btn ' +
              (done ? "btn-outline" : "btn-primary") +
              '" data-complete-task="' +
              t.id +
              '">' +
              (done ? "Completed ✓" : "Claim Task") +
              "</button>" +
              "</div>"
            );
          })
          .join("") +
        "</div>"
      );
    }

    if (state.personalSubTab === "Order") {
      var userWds = (state.data && (state.data.userWithdrawals || state.data.withdrawals)) || [];
      var filteredLogs = userLogs.filter(function (l) {
        if (state.orderFilter === "All") return true;
        if (state.orderFilter === "Credits") return l.direction === "CREDIT";
        if (state.orderFilter === "Debits") return l.direction === "DEBIT";
        return true;
      });
      return (
        '<div class="echo-section-head">' +
        "<h3>Ledger &amp; Settlement Orders (" +
        (state.orderFilter === "Withdrawals" ? userWds.length : filteredLogs.length) +
        ")</h3>" +
        '<div class="echo-mini-tabs">' +
        ["All", "Credits", "Debits", "Withdrawals"]
          .map(function (f) {
            return (
              '<button type="button" class="echo-mini-tab' +
              (state.orderFilter === f ? " active" : "") +
              '" data-order-filter="' +
              f +
              '">' +
              f +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        "</div>" +
        (state.orderFilter === "Withdrawals"
          ? (userWds.length === 0
              ? '<div class="echo-empty-state">No external withdrawal records yet.</div>'
              : '<div class="echo-token-list">' +
                userWds.map(function (w) {
                  var net = (w.netAmountCents || (w.grossAmountCents - (w.platformFeeCents || 0))) / 100;
                  var gross = (w.grossAmountCents || 0) / 100;
                  var fee = (w.platformFeeCents || 0) / 100;
                  var txH = w.txHash || ("0x" + w.id.replace(/[^a-f0-9]/gi, "").padEnd(40, "0").slice(0, 40));
                  return (
                    '<div class="echo-token-row" style="flex-direction:column;align-items:stretch;gap:6px;padding:12px;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<div><strong style="font-size:0.92rem;">External ' + (w.channel || "USDT") + ' Withdrawal</strong><div style="font-size:0.75rem;color:var(--muted);">' + new Date(w.createdAt).toLocaleString() + '</div></div>' +
                    '<div style="text-align:right;"><span style="color:var(--ink);font-weight:700;font-size:1rem;">-$' + fmt(net) + ' USDT</span><div style="font-size:0.72rem;color:var(--muted);">Gross $' + fmt(gross) + ' · 3% Fee -$' + fmt(fee) + '</div></div>' +
                    '</div>' +
                    '<div style="font-size:0.75rem;color:var(--ink-secondary);word-break:break-all;">' +
                    'Dest: ' + w.destinationDetails +
                    '</div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--surface-muted);border-radius:4px;border:1px solid var(--line);font-size:0.72rem;">' +
                    '<span style="color:var(--positive);font-weight:700;">● ' + (w.status === "APPROVED_PAID" ? "CONFIRMED" : w.status) + '</span>' +
                    '<span style="font-family:monospace;color:var(--accent);">' + txH.slice(0, 14) + '...' + txH.slice(-6) + '</span>' +
                    '<button type="button" class="btn btn-outline" style="height:22px;padding:0 6px;font-size:0.68rem;" data-copy-text="' + txH + '">Copy Tx</button>' +
                    '</div>' +
                    '</div>'
                  );
                }).join("") +
                '</div>')
          : (filteredLogs.length === 0
              ? '<div class="echo-empty-state">No order or transaction history matching filter.</div>'
              : '<div class="echo-token-list">' +
                filteredLogs
                  .slice(0, 20)
                  .map(function (l) {
                    var isCredit = l.direction === "CREDIT";
                    return (
                      '<div class="echo-token-row">' +
                      '<div><div class="echo-token-name">' +
                      l.category +
                      '</div><div class="echo-token-sub">' +
                      l.description +
                      "</div></div>" +
                      '<div class="echo-token-bal" style="color:' +
                      (isCredit ? "var(--positive)" : "var(--ink)") +
                      ';">' +
                      (isCredit ? "+" : "-") +
                      fmt(l.amountCents / 100) +
                      " USDT</div>" +
                      "</div>"
                    );
                  })
                  .join("") +
                "</div>"))
      );
    }

    if (state.personalSubTab === "Download") {
      return (
        '<div class="echo-card" style="display:flex;flex-direction:column;gap:14px;">' +
        "<h3>Spayway App &amp; Ledger Statement Export</h3>" +
        '<p style="font-size:0.84rem;color:var(--muted);">Install Spayway to your mobile home screen or export your verified account statement.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button type="button" class="btn btn-primary" id="exportStatementBtn">Download Account Statement (.JSON)</button>' +
        '<button type="button" class="btn btn-outline" data-toast="PWA shortcut ready in browser menu">Install Web App</button>' +
        "</div>" +
        "</div>"
      );
    }

    if (state.personalSubTab === "Refer & Earn") {
      var inviteUrl =
        window.location.origin +
        "/auth?mode=register&invite=" +
        encodeURIComponent(u.referralCode);
      return (
        '<div class="echo-card" style="display:flex;flex-direction:column;gap:14px;">' +
        '<div class="echo-token-list">' +
        '<div class="echo-token-row"><div><div class="echo-token-name">Your Invitation Code</div><div class="echo-token-sub">Required when inviting new chapter members (5% / 2% / 1% Rebates)</div></div><div class="echo-token-bal">' +
        u.referralCode +
        "</div></div>" +
        '<div class="echo-token-row"><div><div class="echo-token-name">Direct Chapter Members (Gen 1)</div><div class="echo-token-sub">5% Instant Rebate on Pack Subscriptions</div></div><div class="echo-token-bal">' +
        (u.directReferralsCount || 0) +
        "</div></div>" +
        '<div class="echo-token-row"><div><div class="echo-token-name">Total referral commissions earned</div><div class="echo-token-sub">Credited directly to Flexible Wallet</div></div><div class="echo-token-bal" style="color:var(--positive);">$' +
        fmt((u.totalCommissionsEarnedCents || 0) / 100) +
        " USDT</div></div>" +
        "</div>" +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button type="button" class="btn btn-primary" data-copy-text="' +
        u.referralCode +
        '">Copy Invitation Code (' +
        u.referralCode +
        ")</button>" +
        '<button type="button" class="btn btn-outline" data-copy-text="' +
        inviteUrl +
        '">Copy Registration Link</button>' +
        '<button type="button" class="btn btn-outline" data-nav="team">Open Team Directory</button>' +
        "</div>" +
        "</div>"
      );
    }

    // Default: Assets sub-tab (Exact Match to Reference Screenshot 1)
    var unlockedStages = {};
    (state.milestones || []).forEach(function (m) {
      if (m.isUnlocked) unlockedStages[m.stageNumber] = true;
    });

    return (
      '<div class="pc-assets-card">' +
      '<div class="pc-assets-carousel">' +
      '<div class="pc-dark-banner" id="assetCarousel">' +
      '<div class="pc-metric-col" data-slide="0"><span>Total Assets</span><strong><b class="pc-num" data-val="' +
      totalAssets.toFixed(2) +
      '">' +
      fmt(totalAssets) +
      "</b><small>USDT</small></strong></div>" +
      '<div class="pc-metric-col is-link" data-slide="1" data-open-modal="exchange"><span>Points Wallet ›</span><strong><b class="pc-num" data-val="' +
      pointsBal.toFixed(2) +
      '">' +
      fmt(pointsBal) +
      '</b><small>SPW</small></strong><em class="pc-sub">≈ $' +
      fmt(pointsBal * spwRate) +
      " USDT</em></div>" +
      '<div class="pc-metric-col is-link" data-slide="2" data-open-modal="recharge"><span>Flexible Wallet ›</span><strong><b class="pc-num" data-val="' +
      flexUsdt.toFixed(2) +
      '">' +
      fmt(flexUsdt) +
      "</b><small>USDT</small></strong></div>" +
      '<div class="pc-metric-col is-link" data-slide="3" data-nav="savings"><span>Savings Jar Balance ›</span><strong><b class="pc-num" data-val="' +
      savingsBal.toFixed(2) +
      '">' +
      fmt(savingsBal) +
      "</b><small>USDT</small></strong></div>" +
      "</div>" +
      '<div class="pc-carousel-dots" role="tablist" aria-label="Asset cards">' +
      [0, 1, 2, 3]
        .map(function (i) {
          return (
            '<button type="button" class="pc-dot' +
            (state.assetSlide === i ? " active" : "") +
            '" data-slide-dot="' +
            i +
            '" aria-label="Show asset card ' +
            (i + 1) +
            '"></button>'
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      '<div class="pc-progress-line-wrap">' +
      '<div class="pc-progress-track">' +
      [1, 2, 3, 4, 5, 6, 7]
        .map(function (n) {
          var active =
            unlockedStages[n] ||
            n === 1 ||
            (userContracts.length > 0 && n <= 2)
              ? " active"
              : "";
          return (
            '<span class="pc-progress-dot' +
            active +
            '" style="cursor:pointer;" data-nav="milestone" aria-label="Milestone Stage ' +
            n +
            '"></span>'
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      '<div class="pc-inline-actions">' +
      '<button type="button" class="pc-inline-btn" data-open-modal="recharge">' +
      ICONS.plus +
      "<span>Recharge</span></button>" +
      '<button type="button" class="pc-inline-btn" data-open-modal="withdraw">' +
      ICONS.withdraw +
      "<span>Withdraw</span></button>" +
      '<button type="button" class="pc-inline-btn" data-open-modal="exchange">' +
      ICONS.swap +
      "<span>Flash Exchange</span></button>" +
      '<button type="button" class="pc-inline-btn" data-open-modal="transfer">' +
      ICONS.send +
      "<span>Transfer</span></button>" +
      '<button type="button" class="pc-inline-btn" data-open-modal="withdrawalInfo">' +
      ICONS.doc +
      "<span>Withdrawal Info</span></button>" +
      "</div>" +
      "</div>" +
      '<div class="echo-section-head" style="margin-top:4px;"><h3>Flexible Asset List</h3></div>' +
      '<div class="echo-token-list">' +
      '<div class="echo-token-row" style="cursor:pointer;" data-open-modal="exchange">' +
      '<div class="echo-token-left"><span class="echo-token-badge usdc">$</span><div><div class="echo-token-name">USDC</div><div class="echo-token-sub">USD Coin</div></div></div>' +
      '<div class="echo-token-right"><div class="echo-token-bal">' +
      fmt(usdcBal) +
      '</div><div class="echo-token-usd">≈ $' +
      fmt(usdcBal * usdcRate) +
      " USDT (@ $" +
      usdcRate.toFixed(4) +
      ")</div></div>" +
      "</div>" +
      '<div class="echo-token-row" style="cursor:pointer;" data-open-modal="recharge">' +
      '<div class="echo-token-left"><span class="echo-token-badge usdt">₮</span><div><div class="echo-token-name">USDT</div><div class="echo-token-sub">Tether USD</div></div></div>' +
      '<div class="echo-token-right"><div class="echo-token-bal">' +
      fmt(flexUsdt) +
      '</div><div class="echo-token-usd">≈ $' +
      fmt(flexUsdt) +
      " USDT (1:1 Spot)</div></div>" +
      "</div>" +
      '<div class="echo-token-row" style="cursor:pointer;" data-open-modal="exchange">' +
      '<div class="echo-token-left"><span class="echo-token-badge spw">S</span><div><div class="echo-token-name">SPW</div><div class="echo-token-sub">Spayway Credit</div></div></div>' +
      '<div class="echo-token-right"><div class="echo-token-bal">' +
      fmt(pointsBal) +
      '</div><div class="echo-token-usd">≈ $' +
      fmt(pointsBal * spwRate) +
      " USDT (@ $" +
      spwRate.toFixed(4) +
      ")</div></div>" +
      "</div>" +
      '<div class="echo-token-row" style="cursor:pointer;" data-nav="savings">' +
      '<div class="echo-token-left"><span class="echo-token-badge jar" style="background:#f59e0b;color:#fff;">🍯</span><div><div class="echo-token-name">Savings Jar</div><div class="echo-token-sub">High-Yield Reserve</div></div></div>' +
      '<div class="echo-token-right"><div class="echo-token-bal">' +
      fmt(savingsBal) +
      '</div><div class="echo-token-usd">≈ $' +
      fmt(savingsBal) +
      " USDT (High-Yield Jar)</div></div>" +
      "</div>" +
      "</div>" +
      '<div class="income-comp-row">' +
      '<div class="income-main-card">' +
      '<div class="income-main-head">' +
      "<h4>Income Composition</h4>" +
      '<div class="echo-mini-tabs">' +
      ["Week", "Month", "All"]
        .map(function (p) {
          return (
            '<button type="button" class="echo-mini-tab' +
            (state.incomePeriod === p ? " active" : "") +
            '" data-income-period="' +
            p +
            '">' +
            p +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      '<div style="font-size:0.75rem;color:var(--muted);">Real-time settlement breakdown (' +
      state.incomePeriod +
      ")</div>" +
      "</div>" +
      '<div class="income-rebate-card warm">' +
      "<span>Recommend purchase rebate</span>" +
      "<strong>" +
      fmt(referralRebate) +
      " USDT</strong>" +
      "</div>" +
      '<div class="income-rebate-card">' +
      "<span>Team activity rebate</span>" +
      '<strong class="green">' +
      fmt(activityRebate) +
      " USDT</strong>" +
      "</div>" +
      "</div>"
    );
  }

  function renderPersonalCenter() {
    var d = state.data;
    var u = d.activeUser;
    var subTabs = [
      "Assets",
      "Account",
      "Membership",
      "Tasks",
      "Order",
      "Download",
      "Refer & Earn"
    ];

    return (
      renderCenterSearchRow() +
      '<h1 class="page-main-title">Personal Center</h1>' +
      '<div class="segmented-tabs cols-7">' +
      subTabs
        .map(function (t) {
          return (
            '<button type="button" class="seg-tab' +
            (state.personalSubTab === t ? " active" : "") +
            '" data-subtab="' +
            t +
            '">' +
            t +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      renderPersonalSubTabContent(u, d)
    );
  }

  function renderStakeCenter() {
    var d = state.data;
    var u = d.activeUser;
    var userContracts = (d.contracts || []).filter(function (c) {
      return c.userId === u.id;
    });
    var activeContract = userContracts.find(function (c) {
      return c.phaseStatus !== "COMPLETED";
    }) || userContracts[0];

    var activeCardHtml = "";
    if (activeContract) {
      var pCents = activeContract.principalCents || 3000;
      var dCents = activeContract.dailyPayoutCents || 125;
      var retCents = activeContract.returnedCapitalCents || 0;
      var profCents = activeContract.dailyProfitEarnedCents || 0;
      var totalCredCents = activeContract.totalDailyCreditedCents || 0;
      var dayElapsed = activeContract.currentDayElapsed || 0;
      var totalDays = activeContract.totalLifecycleDays || 60;
      var capDays = Math.ceil(pCents / dCents) || 25;

      var p1Pct = Math.min(100, Math.round((Math.min(dayElapsed, capDays) / capDays) * 100));
      var p2DaysTotal = Math.max(1, (activeContract.totalInstallments || 60) - capDays);
      var p2Elapsed = Math.max(0, Math.min(dayElapsed - capDays, p2DaysTotal));
      var p2Pct = Math.min(100, Math.round((p2Elapsed / p2DaysTotal) * 100));

      var phaseLabel = "Phase 1: Capital Recovery";
      var phaseBadgeBg = "var(--accent)";
      if (activeContract.phaseStatus === "PHASE_2_DAILY_PROFIT_60") {
        phaseLabel = "Phase 2: Pure Daily Profit";
        phaseBadgeBg = "var(--positive)";
      } else if (activeContract.phaseStatus === "POST_60_ROYALTY_90") {
        phaseLabel = "Phase 3: Days 61–90 Royalty Pool (" + (activeContract.royaltyUnits || 15) + " Units)";
        phaseBadgeBg = "#d97706";
      }

      activeCardHtml =
        '<div class="echo-card" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
        '<div>' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
        '<strong style="font-size:1.02rem;">' + activeContract.packName + '</strong>' +
        '<span class="echo-cat-pill active" style="background:' + phaseBadgeBg + ';color:#fff;font-size:0.7rem;">' + phaseLabel + '</span>' +
        '</div>' +
        '<div style="font-size:0.78rem;color:var(--muted);margin-top:2px;">' +
        'Day ' + dayElapsed + ' of ' + totalDays + ' · Daily Settlement: $' + fmt(dCents / 100) + '/day' +
        '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
        '<div style="font-size:1.05rem;font-weight:700;color:var(--positive);">$' + fmt(totalCredCents / 100) + ' USDT</div>' +
        '<div style="font-size:0.74rem;color:var(--muted);">Total Earned to Date</div>' +
        '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:4px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--muted);">' +
        '<span>Phase 1: Capital Return ($' + fmt(retCents / 100) + ' / $' + fmt(pCents / 100) + ')</span>' +
        '<span>Phase 2: Profit ($' + fmt(profCents / 100) + ')</span>' +
        (totalDays === 90 ? '<span>Phase 3: Royalty Pool</span>' : '') +
        '</div>' +
        '<div class="lifecycle-track">' +
        '<div class="lifecycle-seg phase-1" style="width:' + (p1Pct * (totalDays === 90 ? 0.4 : 0.45)) + '%;"></div>' +
        '<div class="lifecycle-seg phase-2" style="width:' + (p2Pct * (totalDays === 90 ? 0.35 : 0.55)) + '%;"></div>' +
        (totalDays === 90 ? '<div class="lifecycle-seg phase-3" style="width:' + (activeContract.phaseStatus === "POST_60_ROYALTY_90" ? "25%" : "0%") + ';"></div>' : '') +
        '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:4px;">' +
        '<button type="button" class="btn btn-primary" style="flex:1;min-width:180px;" data-advance-contract="' + activeContract.id + '" data-advance-days="1">Claim / Simulate +1 Day Dividend (+$' + fmt(dCents / 100) + ')</button>' +
        '<button type="button" class="btn btn-outline" data-advance-contract="' + activeContract.id + '" data-advance-days="5">Simulate +5 Days</button>' +
        '</div>' +
        '</div>';
    }

    return (
      renderCenterSearchRow() +
      '<div class="echo-section-head">' +
      '<h1 class="page-main-title">Stake &amp; Membership Packs</h1>' +
      '<span style="font-size:0.82rem;color:var(--muted);">Flexible Wallet: <strong>' +
      fmt(userFlexUsdt(u)) +
      " USDT</strong></span>" +
      "</div>" +
      activeCardHtml +
      '<div class="echo-section-head" style="margin-top:12px;"><h3>Available Membership Tiers</h3></div>' +
      '<div class="pack-grid">' +
      (d.packs || [])
        .map(function (p) {
          var priceUsd = (p.priceCents / 100).toFixed(0);
          var dailyCents =
            (p.baseDailyPayoutCents || 125) + (p.boosterDailyPayoutCents || 0);
          var dailyUsd = (dailyCents / 100).toFixed(2);

          var isCurrentActive = activeContract && activeContract.packId === p.id;
          var isUpgrade = activeContract && !isCurrentActive && p.priceCents > (activeContract.principalCents || 0);
          var upgradeDiff = isUpgrade ? ((p.priceCents - activeContract.principalCents) / 100).toFixed(0) : 0;

          var badgeHtml = '<span class="echo-cat-pill active">' + p.totalLifecycleDays + 'D</span>';
          if (isCurrentActive) {
            badgeHtml = '<span class="echo-cat-pill active" style="background:var(--positive);color:#fff;">Active Subscription</span>';
          } else if (isUpgrade) {
            badgeHtml = '<span class="echo-cat-pill" style="border:1px solid var(--accent);color:var(--accent);font-weight:700;">Upgrade Tier</span>';
          }

          var actionBtnHtml = "";
          if (isCurrentActive) {
            actionBtnHtml = '<button type="button" class="btn btn-outline" disabled style="width:100%;opacity:0.65;cursor:not-allowed;">Current Active Tier</button>';
          } else if (isUpgrade) {
            actionBtnHtml = '<button type="button" class="btn btn-primary" style="width:100%;" data-open-pack-confirm="' + p.id + '">Upgrade to ' + p.name + ' (+$' + upgradeDiff + ')</button>';
          } else {
            actionBtnHtml = '<button type="button" class="btn btn-primary" style="width:100%;" data-open-pack-confirm="' + p.id + '">Activate Subscription</button>';
          }

          return (
            '<div class="pack-card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            "<strong>" +
            p.name +
            "</strong>" +
            badgeHtml +
            "</div>" +
            '<div class="pack-price">$' +
            priceUsd +
            ' <span style="font-size:0.78rem;color:var(--muted);">USDT</span></div>' +
            '<div style="font-size:0.8rem;color:var(--muted);">Daily Settlement: <strong style="color:var(--positive);">$' +
            dailyUsd +
            "/day</strong> · Capital back in " +
            p.capitalReturnDays +
            "d</div>" +
            '<div style="margin-top:6px;">' +
            actionBtnHtml +
            "</div>" +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderTeamCenter() {
    var d = state.data;
    var u = d.activeUser;
    var allUsers = d.users || [];
    var gen1 = allUsers.filter(function (x) {
      return x.referredById === u.id;
    });
    var gen1Ids = gen1.map(function (x) {
      return x.id;
    });
    var gen2 = allUsers.filter(function (x) {
      return gen1Ids.indexOf(x.referredById) !== -1;
    });
    var gen2Ids = gen2.map(function (x) {
      return x.id;
    });
    var gen3 = allUsers.filter(function (x) {
      return gen2Ids.indexOf(x.referredById) !== -1;
    });
    var teamAll = gen1
      .map(function (m) {
        return { member: m, gen: "Gen 1 (5%)" };
      })
      .concat(
        gen2.map(function (m) {
          return { member: m, gen: "Gen 2 (2%)" };
        })
      )
      .concat(
        gen3.map(function (m) {
          return { member: m, gen: "Gen 3 (1%)" };
        })
      );

    var inviteLink = window.location.origin + "/auth?mode=register&invite=" + encodeURIComponent(u.referralCode);

    return (
      renderCenterSearchRow() +
      '<h1 class="page-main-title">Team &amp; 3-Generation Network</h1>' +
      '<div class="income-comp-row">' +
      '<div class="income-rebate-card warm"><span>Gen 1 Direct (5% Rebate)</span><strong>' +
      gen1.length +
      " Members</strong></div>" +
      '<div class="income-rebate-card"><span>Gen 2 Tier (2% Rebate)</span><strong>' +
      gen2.length +
      " Members</strong></div>" +
      '<div class="income-rebate-card"><span>Gen 3 Tier (1% Rebate)</span><strong class="green">' +
      gen3.length +
      " Members</strong></div>" +
      "</div>" +
      '<div class="invite-qr-card" style="margin-bottom:14px;">' +
      '<svg class="invite-qr-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="100" height="100" fill="#ffffff" />' +
      '<rect x="8" y="8" width="28" height="28" rx="4" fill="#0f1115" />' +
      '<rect x="14" y="14" width="16" height="16" rx="2" fill="#ffffff" />' +
      '<rect x="18" y="18" width="8" height="8" fill="#0f1115" />' +
      '<rect x="64" y="8" width="28" height="28" rx="4" fill="#0f1115" />' +
      '<rect x="70" y="14" width="16" height="16" rx="2" fill="#ffffff" />' +
      '<rect x="74" y="18" width="8" height="8" fill="#0f1115" />' +
      '<rect x="8" y="64" width="28" height="28" rx="4" fill="#0f1115" />' +
      '<rect x="14" y="70" width="16" height="16" rx="2" fill="#ffffff" />' +
      '<rect x="18" y="74" width="8" height="8" fill="#0f1115" />' +
      '<circle cx="50" cy="50" r="10" fill="#0f1115" />' +
      '<path d="M47 45L53 50L47 55" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="42" y="12" width="6" height="6" fill="#0f1115" />' +
      '<rect x="52" y="20" width="6" height="6" fill="#0f1115" />' +
      '<rect x="42" y="82" width="6" height="6" fill="#0f1115" />' +
      '<rect x="52" y="74" width="6" height="6" fill="#0f1115" />' +
      '<rect x="72" y="52" width="6" height="6" fill="#0f1115" />' +
      '<rect x="80" y="62" width="6" height="6" fill="#0f1115" />' +
      '<rect x="70" y="76" width="6" height="6" fill="#0f1115" />' +
      '<rect x="82" y="84" width="6" height="6" fill="#0f1115" />' +
      '</svg>' +
      '<div style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Your Official Invitation Code</div>' +
      '<div style="font-size:1.3rem;font-weight:800;letter-spacing:0.08em;color:var(--ink);margin-bottom:8px;">' + u.referralCode + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">' +
      '<button type="button" class="btn btn-primary" data-copy-text="' + u.referralCode + '">Copy Code</button>' +
      '<button type="button" class="btn btn-outline" data-copy-text="' + inviteLink + '">Copy Registration URL</button>' +
      '</div>' +
      '<div style="font-size:0.75rem;color:var(--ink-secondary);margin-top:8px;">' +
      '5% Direct Gen 1 · 2% Indirect Gen 2 · 1% Network Gen 3 · Instant Flexible Settlement' +
      '</div>' +
      '</div>' +
      '<div class="echo-card" style="display:flex;flex-direction:column;gap:14px;">' +
      '<div class="echo-section-head" style="margin-bottom:0;"><h3>3-Generation Team Directory (' + teamAll.length + ')</h3></div>' +
      (teamAll.length === 0
        ? '<div class="echo-empty-state">No team members registered yet. Use the downline simulator below to test referral rebates across Gen 1, Gen 2, or Gen 3!</div>'
        : '<div class="echo-token-list">' +
          teamAll
            .map(function (row) {
              var m = row.member;
              return (
                '<div class="echo-token-row">' +
                '<div><div class="echo-token-name">' +
                m.name +
                '</div><div class="echo-token-sub">Code: ' +
                m.referralCode +
                " · " +
                row.gen +
                "</div></div>" +
                '<div class="echo-token-right"><div class="echo-token-bal">$' +
                fmt((m.personalVolumeCents || 0) / 100) +
                ' USDT</div><div class="echo-token-usd">Active Volume</div></div>' +
                "</div>"
              );
            })
            .join("") +
          "</div>") +
      '<form id="registerReferralForm" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;padding-top:12px;border-top:1px solid var(--line);">' +
      '<div class="field" style="flex:1;min-width:160px;"><label>New Downline Member Name</label><input type="text" name="newMemberName" placeholder="e.g. Emeka Nwosu" required /></div>' +
      '<div class="field" style="width:160px;"><label>Generation Level</label><select name="generation"><option value="1">Gen 1 Direct (+5%)</option><option value="2">Gen 2 Tier (+2%)</option><option value="3">Gen 3 Tier (+1%)</option></select></div>' +
      '<div class="field" style="width:150px;"><label>Pack Subscription</label><select name="initialPackId"><option value="pack-30">$30 Starter Pack</option><option value="pack-50">$50 Builder Pack</option><option value="pack-120" selected>$120 Pro Pack</option><option value="pack-350">$350 Executive Pack</option></select></div>' +
      '<button type="submit" class="btn btn-primary" style="height:38px;">Simulate Downline Member</button>' +
      "</form>" +
      "</div>"
    );
  }

  function renderSavingsJarCenter() {
    var u = state.data.activeUser;
    return (
      renderCenterSearchRow() +
      '<h1 class="page-main-title">Savings Jar</h1>' +
      '<div class="echo-card" style="display:flex;flex-direction:column;gap:14px;">' +
      '<div class="echo-token-list">' +
      '<div class="echo-token-row"><div class="echo-token-name">Flexible Wallet Available</div><div class="echo-token-bal">' +
      fmt(userFlexUsdt(u)) +
      " USDT</div></div>" +
      '<div class="echo-token-row"><div class="echo-token-name">Savings Jar Balance</div><div class="echo-token-bal" style="color:var(--positive);">' +
      fmt(state.savingsBalance) +
      " USDT</div></div>" +
      "</div>" +
      '<form id="savingsForm" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div class="field" style="width:180px;"><label>Operation</label><select name="direction"><option value="DEPOSIT_TO_JAR">Deposit (Flexible → Jar)</option><option value="REDEEM_TO_FLEXIBLE">Redeem (Jar → Flexible)</option></select></div>' +
      '<div class="field" style="flex:1;min-width:130px;"><label>Amount (USDT)</label><input type="number" name="amount" min="1" step="1" placeholder="10" required /></div>' +
      '<button type="submit" class="btn btn-primary" style="height:38px;">Execute Transfer</button>' +
      '<button type="button" class="btn btn-outline" id="claimSavingsYieldBtn" style="height:38px;">Claim Daily Yield (+1.5%)</button>' +
      "</form>" +
      "</div>"
    );
  }

  function renderCreatorCenter() {
    return (
      renderCenterSearchRow() +
      '<h1 class="page-main-title">Creator Studio</h1>' +
      '<div class="echo-card">' +
      '<form id="creatorForm" style="display:flex;flex-direction:column;gap:12px;">' +
      '<div class="field"><label>Category</label><select name="category"><option value="Economy">Economy</option><option value="Web3">Web3</option><option value="DeFi">DeFi</option><option value="DePIN">DePIN</option><option value="Technology">Technology</option><option value="Finance">Finance</option></select></div>' +
      '<div class="field"><label>Headline</label><input type="text" name="title" placeholder="Enter article headline..." required /></div>' +
      '<div class="field"><label>Dispatch Content</label><textarea name="excerpt" rows="3" placeholder="Write your community analysis..." required></textarea></div>' +
      '<button type="submit" class="btn btn-primary" style="align-self:flex-start;">Publish Dispatch</button>' +
      "</form>" +
      "</div>"
    );
  }

  function renderCustomerSupportChat() {
    return (
      renderCenterSearchRow() +
      '<h1 class="page-main-title">Customer Support Live Chat</h1>' +
      '<div class="chat-box">' +
      '<div class="chat-header"><strong>Spayway Support Desk</strong><span style="font-size:0.75rem;color:#10b981;">● Online</span></div>' +
      '<div class="chat-messages" id="chatMessages">' +
      state.chatMessages
        .map(function (m) {
          return (
            '<div class="chat-bubble ' +
            m.sender +
            '">' +
            m.text +
            "</div>"
          );
        })
        .join("") +
      "</div>" +
      '<form id="chatForm" class="chat-input-row">' +
      '<input type="text" name="msg" placeholder="Type your message to Customer Support..." required />' +
      '<button type="submit" class="btn btn-primary">Send</button>' +
      "</form>" +
      "</div>"
    );
  }

  function renderSecondaryModuleCenter() {
    var d = state.data;
    var u = d.activeUser;
    var sponsor = (d.users || []).find(function (x) {
      return x.id === u.referredById;
    });

    if (state.nav === "cs") {
      return renderCustomerSupportChat();
    }

    if (state.nav === "milestone") {
      var stageNames = [
        "Stage 1: Verified Member Onboarding",
        "Stage 2: Active Pack Subscriber",
        "Stage 3: First Direct Chapter Referral",
        "Stage 4: Regional Builder ($500 Team Volume)",
        "Stage 5: Chapter Leader ($2,500 Team Volume)",
        "Stage 6: Regional Director ($10,000 Team Volume)",
        "Stage 7: Global Syndicate Partner"
      ];
      var unlockedMap = {};
      (state.milestones || []).forEach(function (m) {
        if (m.isUnlocked) unlockedMap[m.stageNumber] = true;
      });
      return (
        renderCenterSearchRow() +
        '<div class="echo-section-head"><h1 class="page-main-title">Milestone Progression (Stages 1 — 7)</h1><button type="button" class="btn btn-primary" id="unlockMilestoneBtn">Unlock Next Stage (+20 SPW)</button></div>' +
        '<div class="echo-card" style="display:flex;flex-direction:column;gap:14px;">' +
        '<div class="pc-progress-line-wrap" style="border-bottom:none;margin-bottom:0;">' +
        '<div class="pc-progress-track">' +
        [1, 2, 3, 4, 5, 6, 7]
          .map(function (n) {
            return (
              '<span class="pc-progress-dot' +
              (unlockedMap[n] || n === 1 ? " active" : "") +
              '"></span>'
            );
          })
          .join("") +
        "</div></div>" +
        '<div class="echo-token-list">' +
        stageNames
          .map(function (title, idx) {
            var stageNum = idx + 1;
            var isDone = unlockedMap[stageNum] || stageNum === 1;
            return (
              '<div class="echo-token-row">' +
              '<div><div class="echo-token-name">' +
              title +
              '</div><div class="echo-token-sub">Reward: +20 SPW Points &amp; Chapter Badge</div></div>' +
              '<span class="echo-cat-pill' +
              (isDone ? " active" : "") +
              '">' +
              (isDone ? "Unlocked ✓" : "Locked") +
              "</span>" +
              "</div>"
            );
          })
          .join("") +
        "</div>" +
        "</div>"
      );
    }

    if (state.nav === "upline") {
      return (
        renderCenterSearchRow() +
        '<h1 class="page-main-title">Upline Sponsor</h1>' +
        '<div class="echo-card" style="display:flex;flex-direction:column;gap:12px;">' +
        (sponsor
          ? '<div class="echo-token-row"><div><div class="echo-token-name">' +
            sponsor.name +
            '</div><div class="echo-token-sub">Sponsor Code: ' +
            sponsor.referralCode +
            " · Country: " +
            (sponsor.country || "Nigeria") +
            '</div></div><span class="echo-cat-pill active">Verified Upline</span></div>'
          : '<div class="echo-empty-state">Root Chapter Registration</div>') +
        '<div style="display:flex;gap:10px;">' +
        '<button type="button" class="btn btn-primary" data-nav="cs">Contact Chapter Support</button>' +
        '<button type="button" class="btn btn-outline" data-nav="team">View My Downline Team</button>' +
        "</div>" +
        "</div>"
      );
    }

    if (state.nav === "download") {
      state.personalSubTab = "Download";
      return renderPersonalCenter();
    }

    var faqs = d.supportFaqs || [
      { question: "How do I fund or recharge my wallet?", answer: "Click Recharge in Personal Center to add USDT to your Flexible Wallet." },
      { question: "What is the minimum withdrawal?", answer: "Minimum withdrawal is $15 USDT with a 3% gateway fee." }
    ];

    return (
      renderCenterSearchRow() +
      '<h1 class="page-main-title">Support Center</h1>' +
      '<div class="echo-token-list">' +
      faqs
        .map(function (f) {
          return (
            '<div class="echo-token-row"><div><div class="echo-token-name">' +
            f.question +
            '</div><div class="echo-token-sub">' +
            f.answer +
            "</div></div></div>"
          );
        })
        .join("") +
      '<div class="echo-token-row"><div><div class="echo-token-name">Need live assistance?</div><div class="echo-token-sub">Open Customer Support to chat with a support specialist.</div></div><button type="button" class="btn btn-primary" data-nav="cs">Open Chat</button></div>' +
      "</div>"
    );
  }

  function renderRightSidebar() {
    if (state.nav === "personal" || state.nav === "discover") {
      var items =
        state.participationTab === "Like"
          ? state.articles.filter(function (a) {
              return state.likedArticles.indexOf(a.id) !== -1;
            })
          : state.userComments;

      return (
        '<aside class="echo-right">' +
        '<div class="echo-side-head">' +
        "<h3>Your participation</h3>" +
        '<div class="echo-red-pills">' +
        ["Like", "Comment"]
          .map(function (t) {
            return (
              '<button type="button" class="echo-red-pill' +
              (state.participationTab === t ? " active" : "") +
              '" data-part-tab="' +
              t +
              '">' +
              t +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        "</div>" +
        (items.length === 0
          ? '<div class="echo-empty-state">' +
            '<div class="empty-folder-icon">' +
            ICONS.folder +
            "</div>" +
            "<span>No data yet</span>" +
            "</div>"
          : '<div class="echo-rank-list">' +
            items
              .map(function (it) {
                var targetAid = it.id && it.id.indexOf("art-") === 0 ? it.id : it.articleId;
                return (
                  '<div class="echo-rank-card" data-read-article="' +
                  (targetAid || "art-1") +
                  '">' +
                  '<div class="echo-rank-info">' +
                  '<span class="echo-rank-cat">' +
                  (it.category || "Comment") +
                  "</span>" +
                  '<div class="echo-rank-title">' +
                  (it.title || it.articleTitle) +
                  "</div>" +
                  '<div class="echo-rank-meta"><span>' +
                  (it.text ? "💬 " + it.text : "👁 " + (it.views || 1) + " · 👍 " + (it.likes || 1)) +
                  "</span></div>" +
                  "</div>" +
                  '<div class="echo-rank-thumb">SPW</div>' +
                  "</div>"
                );
              })
              .join("") +
            "</div>") +
        "</aside>"
      );
    }

    var sortedRank = state.articles.slice().sort(function (a, b) {
      if (state.rankTab === "Likes") return b.likes - a.likes;
      if (state.rankTab === "Favorites") return (b.favorites || 0) - (a.favorites || 0);
      return b.views - a.views;
    });

    return (
      '<aside class="echo-right">' +
      '<div class="echo-side-head">' +
      "<h3>Article ranking</h3>" +
      '<div class="echo-red-pills">' +
      ["Views", "Likes", "Favorites"]
        .map(function (t) {
          return (
            '<button type="button" class="echo-red-pill' +
            (state.rankTab === t ? " active" : "") +
            '" data-rank-tab="' +
            t +
            '">' +
            t +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      '<div class="echo-rank-list">' +
      sortedRank
        .slice(0, 4)
        .map(function (a) {
          return (
            '<div class="echo-rank-card" data-read-article="' +
            a.id +
            '">' +
            '<div class="echo-rank-info">' +
            '<span class="echo-rank-cat">' +
            a.category +
            "</span>" +
            '<div class="echo-rank-title">' +
            a.title +
            "</div>" +
            '<div class="echo-rank-meta"><span>👁 ' +
            a.views +
            "</span><span>👍 " +
            a.likes +
            "</span><span>☆ " +
            (a.favorites || 0) +
            "</span></div>" +
            "</div>" +
            '<div class="echo-rank-thumb">' +
            a.category.slice(0, 4) +
            "</div>" +
            "</div>"
          );
        })
        .join("") +
      "</div>" +
      "</aside>"
    );
  }

  function renderFloatingDock() {
    return (
      '<div class="floating-dock">' +
      '<button type="button" class="fab-btn primary" data-nav="cs" title="Live Customer Support Chat">' +
      ICONS.cs +
      "</button>" +
      '<button type="button" class="fab-btn" data-nav="creator" title="Publish in Creator Studio">' +
      ICONS.creator +
      "</button>" +
      '<button type="button" class="fab-btn" id="scrollTopBtn" title="Scroll to top">' +
      ICONS.up +
      "</button>" +
      "</div>"
    );
  }

  var DEPOSIT_NETWORKS = {
    "USDT-TRC20": {
      name: "Tether (TRC20)",
      address: "TYDny5TwdSpaywayTreasuryTronVault2026",
      badge: "0% Gas · Fast",
      note: "Send only USDT to this TRC20 address. Settlement in 1-2 minutes (12 blocks)."
    },
    "USDT-BEP20": {
      name: "Tether (BEP20)",
      address: "0x892a0584b4e143377f13f020f12f91572d4e83c7",
      badge: "Low Gas · 15s",
      note: "Send USDT on BNB Smart Chain. Settlement in ~15 seconds (15 blocks)."
    },
    "USDT-ERC20": {
      name: "Tether (ERC20)",
      address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      badge: "Ethereum L1",
      note: "Send USDT on Ethereum Network. Settlement in 3-5 minutes (32 blocks)."
    },
    "BANK_NGN": {
      name: "Direct Bank (NGN)",
      address: "0123456789 (Access Bank · Spayway Treasury Ltd)",
      badge: "Local ₦ · 1:1 Spot",
      note: "Direct Nigerian Naira transfer at verified market oracle spot rate."
    }
  };

  function renderModal() {
    if (!state.modal || !state.data) return "";
    var d = state.data;
    var u = d.activeUser;

    if (state.modal === "article") {
      var art =
        state.articles.find(function (a) {
          return a.id === state.selectedArticleId;
        }) || state.articles[0];
      var isLiked = state.likedArticles.indexOf(art.id) !== -1;
      var isFav = state.favoriteArticles.indexOf(art.id) !== -1;
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" style="max-width:540px;" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><span class="echo-cat-pill active">' +
        art.category +
        '</span><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        '<h3 style="font-size:1.1rem;margin-bottom:8px;">' +
        art.title +
        "</h3>" +
        '<p style="font-size:0.75rem;color:var(--muted);margin-bottom:14px;">By ' +
        art.author +
        " · " +
        art.date +
        "</p>" +
        '<div style="font-size:0.88rem;line-height:1.65;color:var(--ink-secondary);padding:14px;background:var(--bg);border-radius:10px;margin-bottom:14px;">' +
        "<p>" +
        art.excerpt +
        "</p>" +
        '<p style="margin-top:10px;">Verified Spayway chapters coordinate liquidity settlement, transparent isolated contract accounting, and regional member support across connected hubs.</p>' +
        "</div>" +
        '<div style="display:flex;gap:10px;margin-bottom:14px;">' +
        '<button type="button" class="btn ' +
        (isLiked ? "btn-primary" : "btn-outline") +
        '" data-like-article="' +
        art.id +
        '">👍 Like (' +
        art.likes +
        ")</button>" +
        '<button type="button" class="btn ' +
        (isFav ? "btn-primary" : "btn-outline") +
        '" data-fav-article="' +
        art.id +
        '">☆ Favorite (' +
        (art.favorites || 0) +
        ")</button>" +
        "</div>" +
        '<form class="article-comment-form" data-comment-form="' +
        art.id +
        '">' +
        '<input type="text" name="commentText" placeholder="Add your comment to this dispatch..." required />' +
        '<button type="submit" class="btn btn-primary">Post Comment</button>' +
        "</form>" +
        "</div></div>"
      );
    }

    if (state.modal === "notifications") {
      var recentLogs = (d.ledgerLogs || [])
        .filter(function (l) {
          return l.userId === u.id;
        })
        .slice(0, 5);
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><h3>Workspace Notifications</h3><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        (recentLogs.length === 0
          ? '<div class="echo-empty-state" style="padding:24px;">No new ledger alerts yet.</div>'
          : '<div class="echo-token-list">' +
            recentLogs
              .map(function (l) {
                return (
                  '<div class="echo-token-row"><div><div class="echo-token-name">' +
                  l.category +
                  '</div><div class="echo-token-sub">' +
                  l.description +
                  "</div></div></div>"
                );
              })
              .join("") +
            "</div>") +
        "</div></div>"
      );
    }

    if (state.modal === "withdrawalInfo") {
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><h3>Withdrawal Info &amp; Payout Methods</h3><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        (state.withdrawalMethods.length === 0
          ? '<p style="font-size:0.82rem;color:var(--muted);margin-bottom:12px;">No saved payout methods yet. Add your USDT (TRC20/BEP20) or bank account below.</p>'
          : '<div class="echo-token-list" style="margin-bottom:14px;">' +
            state.withdrawalMethods
              .map(function (wm) {
                return (
                  '<div class="echo-token-row"><div><div class="echo-token-name">' +
                  wm.label +
                  '</div><div class="echo-token-sub">' +
                  wm.destination +
                  "</div></div></div>"
                );
              })
              .join("") +
            "</div>") +
        '<form id="saveMethodForm" style="display:flex;flex-direction:column;gap:10px;">' +
        '<div class="field"><label>Method Label</label><input type="text" name="label" placeholder="e.g. Primary USDT-TRC20 Wallet" required /></div>' +
        '<div class="field"><label>Wallet Address or Bank Account</label><input type="text" name="destination" placeholder="TRC20 Address / Bank & Account Number" required /></div>' +
        '<button type="submit" class="btn btn-primary">Save Payout Method</button>' +
        "</form>" +
        "</div></div>"
      );
    }

    if (state.modal === "recharge") {
      var currentNet = DEPOSIT_NETWORKS[state.rechargeNetwork] || DEPOSIT_NETWORKS["USDT-TRC20"];
      var prefillAmt = state.rechargePrefillAmount || 50;
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><h3>Recharge Flexible Wallet</h3><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        '<div class="segmented-tabs cols-4" style="margin-bottom:12px;">' +
        Object.keys(DEPOSIT_NETWORKS).map(function (k) {
          return (
            '<button type="button" class="seg-tab' +
            (state.rechargeNetwork === k ? " active" : "") +
            '" data-recharge-net="' + k + '">' +
            k.replace("USDT-", "") +
            '</button>'
          );
        }).join("") +
        '</div>' +
        '<div style="padding:10px 12px;background:var(--surface-muted);border:1px solid var(--line);border-radius:8px;margin-bottom:12px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
        '<span style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;font-weight:700;">' + currentNet.name + ' Deposit Address</span>' +
        '<span class="echo-cat-pill active" style="font-size:0.7rem;">' + currentNet.badge + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:6px;">' +
        '<input type="text" readonly value="' + currentNet.address + '" style="font-size:0.78rem;font-family:monospace;background:var(--surface);border:1px solid var(--line);padding:6px 8px;border-radius:4px;flex:1;" />' +
        '<button type="button" class="btn btn-outline" style="min-height:36px;font-size:0.78rem;" data-copy-text="' + currentNet.address + '">Copy</button>' +
        '</div>' +
        '<div style="font-size:0.72rem;color:var(--muted);margin-top:6px;">' + currentNet.note + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' +
        [30, 50, 120, 350, 500]
          .map(function (amt) {
            return (
              '<button type="button" class="echo-cat-pill' + (prefillAmt === amt ? " active" : "") + '" data-quick-recharge="' +
              amt +
              '">+$' +
              amt +
              " USDT</button>"
            );
          })
          .join("") +
        "</div>" +
        '<form id="rechargeForm" style="display:flex;flex-direction:column;gap:12px;">' +
        '<div class="field"><label>Recharge Amount (USDT)</label><input type="number" id="rechargeAmountInput" name="amount" min="10" step="5" value="' + prefillAmt + '" required /></div>' +
        '<button type="submit" class="btn btn-primary" id="rechargeSubmitBtn">Confirm Recharge &amp; Simulate Deposit</button>' +
        "</form>" +
        "</div></div>"
      );
    }

    if (state.modal === "withdraw") {
      var defaultDest =
        state.withdrawalMethods.length > 0
          ? state.withdrawalMethods[0].destination
          : "TYDny5TwdSpaywayUserTronWallet2026";
      var availFlex = userFlexUsdt(u);
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><h3>Withdraw Flexible USDT</h3><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        '<p style="font-size:0.82rem;color:var(--muted);margin-bottom:10px;">Available Flexible Wallet: <strong>' +
        fmt(availFlex) +
        ' USDT</strong> (Min $15.00 · 3% Maintenance Fee)</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' +
        [15, 25, 50, 100, Math.floor(availFlex)]
          .filter(function (a, idx, arr) { return a >= 15 && arr.indexOf(a) === idx; })
          .map(function (amt) {
            return (
              '<button type="button" class="echo-cat-pill" data-quick-withdraw="' + amt + '">$' + amt + ' USDT</button>'
            );
          }).join("") +
        '</div>' +
        '<form id="withdrawForm" style="display:flex;flex-direction:column;gap:12px;">' +
        '<div class="field"><label>Amount (USDT)</label><input type="number" id="withdrawAmountInput" name="amount" min="15" step="1" value="20" required /></div>' +
        '<div class="field"><label>Destination Wallet / Account Address</label><input type="text" id="withdrawDestInput" name="dest" value="' +
        defaultDest +
        '" placeholder="TRC20 / BEP20 Address or Bank Account" required /></div>' +
        '<div id="withdrawBreakdownCard" style="padding:10px 12px;background:var(--surface-muted);border:1px solid var(--line);border-radius:8px;font-size:0.8rem;display:flex;flex-direction:column;gap:4px;">' +
        '<div style="display:flex;justify-content:space-between;"><span>Gross Withdrawal:</span><strong id="wdGrossPreview">$20.00 USDT</strong></div>' +
        '<div style="display:flex;justify-content:space-between;color:var(--ink-secondary);"><span>3% Gateway Maintenance Fee:</span><span id="wdFeePreview">-$0.60 USDT</span></div>' +
        '<div style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:4px;margin-top:2px;"><span>Net Amount Received:</span><strong style="color:var(--positive);" id="wdNetPreview">$19.40 USDT</strong></div>' +
        '<div id="wdAlertNote" style="font-size:0.74rem;color:var(--muted);margin-top:4px;">⚡ Instant Automated Processing: TxHash is generated and confirmed upon submission.</div>' +
        '</div>' +
        '<button type="submit" class="btn btn-primary" id="withdrawSubmitBtn">Submit Instant Withdrawal</button>' +
        "</form>" +
        "</div></div>"
      );
    }

    if (state.modal === "receipt") {
      var r = state.lastTxReceipt;
      if (!r) {
        state.modal = null;
        return "";
      }
      var isCredit = r.type === "RECHARGE";
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div style="text-align:center;padding:12px 0 6px;">' +
        '<div style="width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,0.12);color:var(--positive);display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;margin-bottom:8px;">✓</div>' +
        '<h3 style="margin:0 0 4px;">' + r.title + '</h3>' +
        '<span class="echo-cat-pill active" style="background:var(--positive);color:#fff;font-size:0.75rem;">' + r.status + '</span>' +
        '</div>' +
        '<div style="margin:16px 0;padding:12px 14px;background:var(--surface-muted);border:1px solid var(--line);border-radius:8px;font-size:0.84rem;display:flex;flex-direction:column;gap:8px;">' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Net Settled Amount:</span><strong style="font-size:1.05rem;color:' + (isCredit ? "var(--positive)" : "var(--ink)") + ';">' + (isCredit ? "+" : "-") + '$' + fmt(r.netAmount) + ' USDT</strong></div>' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Gross Amount:</span><span>$' + fmt(r.grossAmount) + ' USDT</span></div>' +
        (r.fee > 0 ? '<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Platform Fee (3%):</span><span>-$' + fmt(r.fee) + ' USDT</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Channel / Network:</span><span>' + r.network + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;flex-direction:column;gap:4px;border-top:1px solid var(--line);padding-top:6px;">' +
        '<span style="color:var(--muted);font-size:0.75rem;">Destination Address:</span>' +
        '<div style="font-family:monospace;font-size:0.74rem;word-break:break-all;color:var(--ink);">' + r.destination + '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;flex-direction:column;gap:4px;border-top:1px solid var(--line);padding-top:6px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="color:var(--muted);font-size:0.75rem;">Transaction Hash (TxHash):</span>' +
        '<button type="button" class="btn btn-outline" style="height:26px;padding:0 8px;font-size:0.72rem;" data-copy-text="' + r.txHash + '">Copy Hash</button>' +
        '</div>' +
        '<div style="font-family:monospace;font-size:0.74rem;word-break:break-all;color:var(--accent);">' + r.txHash + '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--muted);">' +
        '<span>Timestamp:</span><span>' + r.time + '</span>' +
        '</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button type="button" class="btn btn-primary" style="flex:1;" data-close-modal="true">Done</button>' +
        '<button type="button" class="btn btn-outline" style="flex:1;" data-view-order-ledger="true">View Order Ledger</button>' +
        '</div>' +
        '</div></div>'
      );
    }

    if (state.modal === "packConfirm") {
      var pack = (d.packs || []).find(function (p) { return p.id === state.selectedPackToBuy; });
      if (!pack) {
        state.modal = null;
        return "";
      }
      var packPrice = pack.priceCents / 100;
      var availFlex = userFlexUsdt(u);
      var isSufficient = availFlex >= packPrice;
      var diffNeeded = Math.max(0, packPrice - availFlex);
      var dailyReturn = ((pack.baseDailyPayoutCents + (pack.boosterDailyPayoutCents || 0)) / 100).toFixed(2);
      var userContracts = (d.contracts || []).filter(function (c) { return c.userId === u.id; });
      var activeContract = userContracts.find(function (c) { return c.phaseStatus !== "COMPLETED"; });
      var isUpgrade = !!activeContract;

      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><h3>' + (isUpgrade ? "Upgrade Subscription" : "Activate Subscription Pack") + '</h3><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        '<div style="padding:12px;background:var(--surface-muted);border:1px solid var(--line);border-radius:8px;margin-bottom:12px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<strong style="font-size:1.05rem;">' + pack.name + '</strong>' +
        '<span class="echo-cat-pill active">$' + packPrice.toFixed(0) + ' USDT</span>' +
        '</div>' +
        '<div style="font-size:0.82rem;color:var(--muted);margin-top:6px;">' +
        'Daily Dividend Settlement: <strong style="color:var(--positive);">$' + dailyReturn + '/day</strong><br>' +
        'Duration: <strong>' + pack.totalLifecycleDays + ' Days</strong> (' + (pack.totalLifecycleDays === 90 ? '60-Day Active + 30-Day Royalty Pool' : 'Full Capital Return + 60-Day Earnings') + ')<br>' +
        'Capital Return Target: <strong>~' + pack.capitalReturnDays + ' Days</strong>' +
        '</div>' +
        '</div>' +
        '<div style="padding:10px 12px;background:var(--surface);border:1px solid var(--line);border-radius:8px;margin-bottom:14px;font-size:0.82rem;display:flex;flex-direction:column;gap:6px;">' +
        '<div style="display:flex;justify-content:space-between;"><span>Flexible Wallet Balance:</span><strong>$' + fmt(availFlex) + ' USDT</strong></div>' +
        '<div style="display:flex;justify-content:space-between;"><span>Required Allocation:</span><strong>$' + fmt(packPrice) + ' USDT</strong></div>' +
        '<div style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:4px;"><span>Balance After Activation:</span><strong style="color:' + (isSufficient ? "var(--positive)" : "var(--negative)") + ';">$' + fmt(Math.max(0, availFlex - packPrice)) + ' USDT</strong></div>' +
        '</div>' +
        (isSufficient
          ? '<div style="display:flex;gap:10px;"><button type="button" class="btn btn-primary" style="flex:1;" data-execute-buy-pack="' + pack.id + '" data-pay-source="INTERNAL_WALLET_0_FEE">Confirm &amp; Activate (0% Fee)</button><button type="button" class="btn btn-outline" data-close-modal="true">Cancel</button></div>'
          : '<div style="display:flex;flex-direction:column;gap:10px;"><div style="font-size:0.8rem;color:var(--negative);padding:6px 10px;background:rgba(239,68,68,0.08);border-radius:6px;">Flexible balance is insufficient by $' + fmt(diffNeeded) + ' USDT.</div><button type="button" class="btn btn-primary" data-open-recharge-diff="' + Math.ceil(diffNeeded) + '">Top Up +$' + Math.ceil(diffNeeded) + ' USDT (Recharge)</button><button type="button" class="btn btn-outline" data-execute-buy-pack="' + pack.id + '" data-pay-source="ONLINE_GATEWAY">Activate via Direct Gateway</button></div>'
        ) +
        '</div></div>'
      );
    }

    if (state.modal === "dividendSuccess") {
      var dRes = state.lastDividendClaim;
      if (!dRes) {
        state.modal = null;
        return "";
      }
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div style="text-align:center;padding:12px 0 6px;">' +
        '<div style="width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,0.12);color:var(--positive);display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;margin-bottom:8px;">💰</div>' +
        '<h3 style="margin:0 0 4px;">Daily Dividend Credited!</h3>' +
        '<span class="echo-cat-pill active" style="background:var(--positive);color:#fff;font-size:0.75rem;">Flexible Wallet Credited</span>' +
        '</div>' +
        '<div style="margin:16px 0;padding:12px 14px;background:var(--surface-muted);border:1px solid var(--line);border-radius:8px;font-size:0.84rem;display:flex;flex-direction:column;gap:8px;">' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Pack Subscription:</span><strong>' + dRes.packName + '</strong></div>' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Amount Credited:</span><strong style="color:var(--positive);font-size:1.05rem;">+$' + fmt(dRes.amount) + ' USDT</strong></div>' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Settlement Progress:</span><span>Day ' + dRes.currentDay + ' of ' + dRes.totalDays + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Current Phase:</span><strong>' + dRes.phase + '</strong></div>' +
        '<div style="font-size:0.74rem;color:var(--muted);border-top:1px solid var(--line);padding-top:6px;">Dividends are credited directly to your Flexible Wallet and are available for immediate withdrawal or reinvestment.</div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary" style="width:100%;" data-close-modal="true">Got it</button>' +
        '</div></div>'
      );
    }

    if (state.modal === "withdrawalHistory") {
      var wds = state.data.userWithdrawals || state.data.withdrawals || [];
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><h3>Withdrawal Settlement History</h3><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        (wds.length === 0
          ? '<div class="echo-empty-state">No withdrawal records on file.</div>'
          : '<div class="echo-token-list" style="max-height:360px;overflow-y:auto;">' +
            wds.map(function (w) {
              var net = (w.netAmountCents || (w.grossAmountCents - (w.platformFeeCents || 0))) / 100;
              var gross = (w.grossAmountCents || 0) / 100;
              var fee = (w.platformFeeCents || 0) / 100;
              var txH = w.txHash || ("0x" + w.id.replace(/[^a-f0-9]/gi, "").padEnd(40, "0").slice(0, 40));
              return (
                '<div class="echo-token-row" style="flex-direction:column;align-items:stretch;gap:6px;padding:10px 12px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<strong style="font-size:0.88rem;color:var(--ink);">Net: $' + fmt(net) + ' USDT</strong>' +
                '<span class="echo-cat-pill active" style="background:var(--positive);color:#fff;font-size:0.7rem;">' + (w.status === "APPROVED_PAID" ? "CONFIRMED" : w.status) + '</span>' +
                '</div>' +
                '<div style="font-size:0.76rem;color:var(--muted);display:flex;justify-content:space-between;">' +
                '<span>Gross: $' + fmt(gross) + ' · Fee: -$' + fmt(fee) + '</span>' +
                '<span>' + new Date(w.createdAt).toLocaleDateString() + '</span>' +
                '</div>' +
                '<div style="font-size:0.74rem;color:var(--ink-secondary);word-break:break-all;">' +
                'Dest: ' + w.destinationDetails +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);padding:4px 6px;border-radius:4px;border:1px solid var(--line);">' +
                '<span style="font-family:monospace;font-size:0.7rem;color:var(--accent);">' + txH.slice(0, 16) + '...' + txH.slice(-8) + '</span>' +
                '<button type="button" class="btn btn-outline" style="height:22px;padding:0 6px;font-size:0.68rem;" data-copy-text="' + txH + '">Copy</button>' +
                '</div>' +
                '</div>'
              );
            }).join("") +
            '</div>'
        ) +
        '<button type="button" class="btn btn-outline" style="width:100%;margin-top:12px;" data-close-modal="true">Close</button>' +
        '</div></div>'
      );
    }

    if (state.modal === "exchange") {
      var mr = (state.data && state.data.marketRates) || {};
      var spwR = Number(mr.spwUsd || 1.054);
      var usdcR = Number(mr.usdcUsdt || 1.0001);
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><h3>Flash Exchange (Real Market Swap)</h3><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;padding:8px 12px;background:var(--surface-muted);border:1px solid var(--line);border-radius:6px;font-size:0.75rem;margin-bottom:12px;">' +
        '<span>SPW/USD: <strong>$' + spwR.toFixed(4) + '</strong></span>' +
        '<span> · </span>' +
        '<span>USDC/USDT: <strong>$' + usdcR.toFixed(4) + '</strong></span>' +
        '</div>' +
        '<form id="exchangeForm" style="display:flex;flex-direction:column;gap:12px;">' +
        '<div class="field"><label>Direction</label><select name="dir" id="exchangeDirSelect">' +
        '<option value="usdt_to_usdc">USDT → USDC (Available: ' +
        fmt(userFlexUsdt(u)) +
        " USDT)</option>" +
        '<option value="usdc_to_usdt">USDC → USDT (Available: ' +
        fmt(state.usdcBalance) +
        " USDC)</option>" +
        '<option value="spw_to_usdt">SPW Points → USDT (Available: ' +
        fmt(u.xpPoints || 0) +
        " SPW)</option>" +
        "</select></div>" +
        '<div class="field"><label>Amount</label><input type="number" name="amount" id="exchangeAmountInput" min="1" step="1" value="10" required /></div>' +
        '<div id="exchangePreviewNote" style="font-size:0.8rem;color:var(--ink-secondary);padding:6px 10px;background:var(--surface-muted);border:1px solid var(--line);border-radius:6px;">Estimated output: <strong>' + (10 / usdcR).toFixed(2) + ' USDC</strong> (@ $' + usdcR.toFixed(4) + ')</div>' +
        '<button type="submit" class="btn btn-primary">Execute Flash Exchange</button>' +
        "</form>" +
        "</div></div>"
      );
    }

    if (state.modal === "transfer") {
      var peers = d.users.filter(function (x) {
        return x.id !== u.id;
      });
      return (
        '<div class="echo-modal-backdrop" data-close-modal="true">' +
        '<div class="echo-modal sheet-enter" onclick="event.stopPropagation()">' +
        '<div class="sheet-handle"></div>' +
        '<div class="echo-modal-head"><h3>P2P Member Transfer (0% Fee)</h3><button type="button" class="btn btn-outline" data-close-modal="true">Close</button></div>' +
        '<form id="transferForm" style="display:flex;flex-direction:column;gap:12px;">' +
        '<div class="field"><label>Select Recipient or Enter Invitation Code</label><select name="toUserId">' +
        peers
          .map(function (p) {
            return (
              '<option value="' +
              p.id +
              '">' +
              p.name +
              " (" +
              p.referralCode +
              ")</option>"
            );
          })
          .join("") +
        "</select></div>" +
        '<div class="field"><label>Amount (USDT)</label><input type="number" name="amount" min="1" step="1" value="10" required /></div>' +
        '<button type="submit" class="btn btn-primary">Send Instant Transfer</button>' +
        "</form>" +
        "</div></div>"
      );
    }

    return "";
  }

  function renderMobileBars() {
    var bottomItems = [
      { id: "home", label: "Home", icon: ICONS.home },
      { id: "discover", label: "Discover", icon: ICONS.discover },
      { id: "stake", label: "Stake", icon: ICONS.stake },
      { id: "team", label: "Team", icon: ICONS.team },
      { id: "personal", label: "Personal", icon: ICONS.personal }
    ];

    var navIdx = -1;
    bottomItems.forEach(function (it, i) {
      if (it.id === state.nav) navIdx = i;
    });
    state.pendingNavIdx = navIdx;

    return (
      '<header class="mobile-topbar">' +
      '<a href="/" class="echo-brand"><img src="/assets/logo-mark.svg" alt="Spayway" /><span>SPAYWAY</span></a>' +
      '<div class="mobile-topbar-right">' +
      '<button type="button" class="mobile-menu-trigger" id="mobileMenuBtn" aria-label="Toggle Menu">' +
      ICONS.menu +
      "</button>" +
      "</div>" +
      "</header>" +
      '<div class="mobile-drawer-backdrop' +
      (state.mobileMenuOpen ? " open" : "") +
      '" id="mobileBackdrop"></div>' +
      '<nav class="mobile-bottom-nav" aria-label="Primary" style="--idx:' +
      (state.lastNavIdx < 0 ? Math.max(0, navIdx) : state.lastNavIdx) +
      ';">' +
      '<span class="mobile-nav-bubble' +
      (navIdx < 0 ? " is-hidden" : "") +
      '" aria-hidden="true"></span>' +
      bottomItems
        .map(function (it) {
          return (
            '<button type="button" class="mobile-tab-btn' +
            (state.nav === it.id ? " active" : "") +
            '" data-nav="' +
            it.id +
            '">' +
            it.icon +
            "<span>" +
            it.label +
            "</span>" +
            "</button>"
          );
        })
        .join("") +
      "</nav>"
    );
  }

  function render() {
    if (!state.data) return;
    var u = state.data.activeUser;
    var centerHtml = "";
    if (state.nav === "home") centerHtml = renderHomeCenter();
    else if (state.nav === "discover") centerHtml = renderDiscoverCenter();
    else if (state.nav === "personal") centerHtml = renderPersonalCenter();
    else if (state.nav === "stake" || state.nav === "member")
      centerHtml = renderStakeCenter();
    else if (state.nav === "team") centerHtml = renderTeamCenter();
    else if (state.nav === "savings") centerHtml = renderSavingsJarCenter();
    else if (state.nav === "creator") centerHtml = renderCreatorCenter();
    else centerHtml = renderSecondaryModuleCenter();

    var navKey = state.nav + "|" + (state.nav === "personal" ? state.personalSubTab : "");
    var viewChanged = navKey !== state.lastNavKey;
    var keepY = viewChanged ? 0 : window.scrollY;

    root.innerHTML =
      renderMobileBars() +
      '<div class="echo-layout" data-nav="' +
      state.nav +
      '">' +
      renderLeftSidebar(u) +
      '<main class="echo-center">' +
      centerHtml +
      "</main>" +
      renderRightSidebar() +
      "</div>" +
      renderFloatingDock() +
      renderModal() +
      (state.toast
        ? '<div class="toast ' +
          (state.toast.isError ? "error" : "") +
          '">' +
          state.toast.msg +
          "</div>"
        : "");

    bindEvents();
    afterRender(viewChanged, keepY);
  }

  function afterRender(viewChanged, keepY) {
    var center = root.querySelector(".echo-center");
    if (center && viewChanged && state.lastNavKey !== "") {
      center.classList.add("view-enter");
    }
    state.lastNavKey = state.nav + "|" + (state.nav === "personal" ? state.personalSubTab : "");
    window.scrollTo(0, keepY);

    var modalEl = root.querySelector(".echo-modal");
    if (modalEl && state.lastModal !== state.modal) {
      modalEl.classList.add("sheet-enter");
      var bd = root.querySelector(".echo-modal-backdrop");
      if (bd) bd.classList.add("fade-enter");
    }
    state.lastModal = state.modal;

    // Sliding bottom-nav bubble: render at the previous slot, then move to the new one
    var navEl = root.querySelector(".mobile-bottom-nav");
    if (navEl) {
      void navEl.offsetWidth;
      var target = state.pendingNavIdx < 0 ? Math.max(0, state.lastNavIdx) : state.pendingNavIdx;
      navEl.style.setProperty("--idx", String(target));
      if (state.pendingNavIdx >= 0) state.lastNavIdx = state.pendingNavIdx;
    }

    // Keep the active sub-tab visible inside the horizontally scrolling tab strip
    var strip = root.querySelector(".segmented-tabs.cols-7");
    var activeTab = strip && strip.querySelector(".seg-tab.active");
    if (strip && activeTab) {
      strip.scrollLeft = Math.max(
        0,
        activeTab.offsetLeft - (strip.clientWidth - activeTab.offsetWidth) / 2
      );
    }

    setupAssetCarousel();
  }

  function countUp(el) {
    var target = Number(el.getAttribute("data-val") || 0);
    if (!isFinite(target)) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = fmt(target);
      return;
    }
    var start = performance.now();
    var dur = 450;
    function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * eased);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }

  function setupAssetCarousel() {
    var track = document.getElementById("assetCarousel");
    if (!track) return;
    var slides = track.querySelectorAll(".pc-metric-col");
    var dots = root.querySelectorAll("[data-slide-dot]");
    function stepWidth() {
      var s0 = slides[0];
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "0") || 0;
      return s0 ? s0.offsetWidth + gap : 1;
    }
    function paintDots(idx) {
      dots.forEach(function (d, i) {
        d.classList.toggle("active", i === idx);
      });
      slides.forEach(function (sl, i) {
        sl.classList.toggle("is-active", i === idx);
      });
    }
    var isCarousel = track.scrollWidth > track.clientWidth + 4;
    if (isCarousel) {
      track.scrollLeft = state.assetSlide * stepWidth();
    }
    paintDots(state.assetSlide);

    var ticking = false;
    track.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var idx = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / stepWidth())));
          if (idx !== state.assetSlide) {
            state.assetSlide = idx;
            paintDots(idx);
            var num = slides[idx].querySelector(".pc-num");
            if (num) countUp(num);
          }
        });
      },
      { passive: true }
    );

    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        var i = Number(d.getAttribute("data-slide-dot"));
        track.scrollTo({ left: i * stepWidth(), behavior: "smooth" });
      });
    });
  }

  var lastScrollY = 0;
  window.addEventListener(
    "scroll",
    function () {
      var y = window.scrollY;
      var delta = y - lastScrollY;
      if (Math.abs(delta) > 6) {
        document.body.classList.toggle("nav-hidden", delta > 0 && y > 120);
        lastScrollY = y;
      }
      document.body.classList.toggle("is-scrolled", y > 360);
    },
    { passive: true }
  );

  function bindEvents() {
    var mobileMenuBtn = document.getElementById("mobileMenuBtn");
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", function () {
        state.mobileMenuOpen = !state.mobileMenuOpen;
        render();
      });
    }

    var mobileBackdrop = document.getElementById("mobileBackdrop");
    if (mobileBackdrop) {
      mobileBackdrop.addEventListener("click", function () {
        state.mobileMenuOpen = false;
        render();
      });
    }

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        try {
          localStorage.removeItem("spayway_token");
          localStorage.removeItem("spayway_user_id");
        } catch (e) {}
        window.location.href = "/auth?mode=signin";
      });
    }

    var toggleChartModeBtn = document.getElementById("toggleChartModeBtn");
    if (toggleChartModeBtn) {
      toggleChartModeBtn.addEventListener("click", function () {
        state.chartMode = state.chartMode === "line" ? "candlestick" : "line";
        render();
      });
    }

    root.querySelectorAll("[data-chart-pair]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.chartPair = btn.getAttribute("data-chart-pair");
        state.selectedCandleIndex = null;
        render();
      });
    });

    root.querySelectorAll("[data-chart-tf]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.chartTimeframe = btn.getAttribute("data-chart-tf");
        state.selectedCandleIndex = null;
        render();
      });
    });

    root.querySelectorAll("[data-inspect-candle]").forEach(function (el) {
      el.addEventListener("click", function () {
        var idx = Number(el.getAttribute("data-inspect-candle"));
        state.selectedCandleIndex = idx;
        render();
      });
    });

    var syncRatesBtn = document.getElementById("syncRatesBtn");
    if (syncRatesBtn) {
      syncRatesBtn.addEventListener("click", function () {
        state.isSyncingRates = true;
        render();
        dispatchAction(
          "SYNC_RATES",
          {},
          "Live exchange rates synced with global treasury feed!"
        ).then(function () {
          state.isSyncingRates = false;
          render();
        });
      });
    }

    var scrollTopBtn = document.getElementById("scrollTopBtn");
    if (scrollTopBtn) {
      scrollTopBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    root.querySelectorAll("[data-switch-user]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetUid = btn.getAttribute("data-switch-user");
        state.activeUserId = targetUid;
        loadState(targetUid, true).then(function () {
          showToast(
            targetUid === "u-test"
              ? "Switched to Test Account (test@spayway.app · 250 USDT)"
              : "Switched to Clean Account (USER-1088554 · 0 USDT)",
            false
          );
        });
      });
    });

    root.querySelectorAll("[data-copy-text]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        copyToClipboard(btn.getAttribute("data-copy-text"), "Copied");
      });
    });

    root.querySelectorAll("[data-read-article]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var aid = btn.getAttribute("data-read-article");
        state.selectedArticleId = aid;
        state.modal = "article";
        dispatchAction("VIEW_ARTICLE", { articleId: aid }, null, true);
      });
    });

    root.querySelectorAll("[data-fav-article]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var aid = btn.getAttribute("data-fav-article");
        dispatchAction(
          "FAVORITE_ARTICLE",
          { articleId: aid },
          "Article favorites updated!",
          state.modal === "article"
        );
      });
    });

    root.querySelectorAll("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.nav = btn.getAttribute("data-nav");
        state.mobileMenuOpen = false;
        render();
      });
    });

    root.querySelectorAll("[data-subtab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.nav = "personal";
        state.personalSubTab = btn.getAttribute("data-subtab");
        state.mobileMenuOpen = false;
        render();
      });
    });

    root.querySelectorAll("[data-home-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.homeFeedTab = btn.getAttribute("data-home-tab");
        render();
      });
    });

    root.querySelectorAll("[data-disc-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.discoverCategory = btn.getAttribute("data-disc-cat");
        render();
      });
    });

    root.querySelectorAll("[data-income-period]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.incomePeriod = btn.getAttribute("data-income-period");
        render();
      });
    });

    root.querySelectorAll("[data-order-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.orderFilter = btn.getAttribute("data-order-filter");
        render();
      });
    });

    root.querySelectorAll("[data-rank-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.rankTab = btn.getAttribute("data-rank-tab");
        render();
      });
    });

    root.querySelectorAll("[data-part-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.participationTab = btn.getAttribute("data-part-tab");
        render();
      });
    });

    root.querySelectorAll("[data-open-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.modal = btn.getAttribute("data-open-modal");
        render();
      });
    });

    root.querySelectorAll("[data-close-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.modal = null;
        render();
      });
    });

    root.querySelectorAll("[data-quick-recharge]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var inp = document.getElementById("rechargeAmountInput");
        if (inp) inp.value = btn.getAttribute("data-quick-recharge");
      });
    });

    root.querySelectorAll("[data-toast]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showToast(btn.getAttribute("data-toast"), false);
      });
    });

    root.querySelectorAll("[data-complete-task]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tid = btn.getAttribute("data-complete-task");
        dispatchAction(
          "COMPLETE_TASK",
          { taskId: tid },
          "Task completed & SPW points credited!"
        );
      });
    });

    root.querySelectorAll("[data-like-article]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var aid = btn.getAttribute("data-like-article");
        dispatchAction(
          "LIKE_ARTICLE",
          { articleId: aid },
          "Participation updated!",
          state.modal === "article"
        );
      });
    });

    root.querySelectorAll("[data-toggle-comment]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var aid = btn.getAttribute("data-toggle-comment");
        state.openCommentId = state.openCommentId === aid ? null : aid;
        render();
      });
    });

    root.querySelectorAll("[data-comment-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var aid = form.getAttribute("data-comment-form");
        var text = form.commentText.value.trim();
        if (!text) return;
        state.openCommentId = null;
        dispatchAction(
          "COMMENT_ARTICLE",
          { articleId: aid, text: text },
          "Comment saved to Your Participation!",
          state.modal === "article"
        );
      });
    });

    root.querySelectorAll("[data-recharge-net]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.rechargeNetwork = btn.getAttribute("data-recharge-net");
        render(false, true);
      });
    });

    root.querySelectorAll("[data-quick-withdraw]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var inp = document.getElementById("withdrawAmountInput");
        if (inp) {
          inp.value = btn.getAttribute("data-quick-withdraw");
          inp.dispatchEvent(new Event("input"));
        }
      });
    });

    root.querySelectorAll("[data-open-pack-confirm]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.selectedPackToBuy = btn.getAttribute("data-open-pack-confirm");
        state.modal = "packConfirm";
        render(false, true);
      });
    });

    root.querySelectorAll("[data-execute-buy-pack]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var packId = btn.getAttribute("data-execute-buy-pack");
        var paySource = btn.getAttribute("data-pay-source") || "INTERNAL_WALLET_0_FEE";
        dispatchAction(
          "PURCHASE_PACK",
          {
            userId: state.activeUserId,
            packId: packId,
            paymentSource: paySource,
            applyProBooster: packId === "pack-120"
          },
          "Subscription pack activated!"
        );
      });
    });

    root.querySelectorAll("[data-open-recharge-diff]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.rechargePrefillAmount = Number(btn.getAttribute("data-open-recharge-diff") || 50);
        state.modal = "recharge";
        render(false, true);
      });
    });

    root.querySelectorAll("[data-view-order-ledger]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.nav = "personal";
        state.personalSubTab = "Order";
        state.orderFilter = "Withdrawals";
        state.modal = null;
        render(true, false);
      });
    });

    root.querySelectorAll("[data-buy-pack]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var packId = btn.getAttribute("data-buy-pack");
        var paySource = btn.getAttribute("data-pay-source") || "ONLINE_GATEWAY";
        dispatchAction(
          "PURCHASE_PACK",
          {
            userId: state.activeUserId,
            packId: packId,
            paymentSource: paySource,
            applyProBooster: packId === "pack-120"
          },
          "Subscription pack activated!"
        );
      });
    });

    root.querySelectorAll("[data-advance-contract]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cid = btn.getAttribute("data-advance-contract");
        var days = Number(btn.getAttribute("data-advance-days") || 1);
        dispatchAction(
          "ADVANCE_INSTALLMENT",
          {
            contractId: cid,
            daysToAdvance: days
          },
          null,
          true
        ).then(function (result) {
          if (result) {
            var uContracts = (state.data && state.data.contracts) || [];
            var ctr = uContracts.find(function (c) { return c.id === cid; }) || uContracts[0];
            if (ctr) {
              var phaseStr = "Phase 1: Capital Recovery";
              if (ctr.phaseStatus === "PHASE_2_DAILY_PROFIT_60") phaseStr = "Phase 2: Pure Daily Profit";
              else if (ctr.phaseStatus === "POST_60_ROYALTY_90") phaseStr = "Phase 3: Days 61–90 Royalty Pool";
              state.lastDividendClaim = {
                packName: ctr.packName,
                amount: ((ctr.dailyPayoutCents * days) / 100),
                currentDay: ctr.currentDayElapsed,
                totalDays: ctr.totalLifecycleDays,
                phase: phaseStr
              };
              state.modal = "dividendSuccess";
              render(false, true);
            }
          }
        });
      });
    });

    var unlockMilestoneBtn = document.getElementById("unlockMilestoneBtn");
    if (unlockMilestoneBtn) {
      unlockMilestoneBtn.addEventListener("click", function () {
        dispatchAction(
          "UNLOCK_MILESTONE",
          {},
          "Next Milestone Stage unlocked (+20 SPW Points)!"
        );
      });
    }

    var claimSavingsYieldBtn = document.getElementById("claimSavingsYieldBtn");
    if (claimSavingsYieldBtn) {
      claimSavingsYieldBtn.addEventListener("click", function () {
        dispatchAction(
          "CLAIM_SAVINGS_YIELD",
          {},
          "Daily Savings Jar yield (+1.5%) credited!"
        );
      });
    }

    var exportStatementBtn = document.getElementById("exportStatementBtn");
    if (exportStatementBtn) {
      exportStatementBtn.addEventListener("click", function () {
        var blob = new Blob([JSON.stringify(state.data, null, 2)], {
          type: "application/json"
        });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "spayway-statement-" + state.activeUserId + ".json";
        a.click();
        showToast("Account statement exported!", false);
      });
    }

    var profileUpdateForm = document.getElementById("profileUpdateForm");
    if (profileUpdateForm) {
      profileUpdateForm.addEventListener("submit", function (e) {
        e.preventDefault();
        dispatchAction(
          "UPDATE_PROFILE",
          {
            name: profileUpdateForm.name.value,
            preferredCurrency: profileUpdateForm.currency.value
          },
          "Account profile updated!"
        );
      });
    }

    var registerReferralForm = document.getElementById("registerReferralForm");
    if (registerReferralForm) {
      registerReferralForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var gen = Number(registerReferralForm.generation ? registerReferralForm.generation.value : 1);
        var packId = registerReferralForm.initialPackId.value;
        var pack = (state.data.packs || []).find(function (p) { return p.id === packId; });
        var packPrice = pack ? (pack.priceCents / 100) : 120;
        var pct = gen === 1 ? 5 : (gen === 2 ? 2 : 1);
        var comm = (packPrice * pct) / 100;

        dispatchAction(
          "REGISTER_REFERRAL",
          {
            sponsorUserId: state.activeUserId,
            newMemberName: registerReferralForm.newMemberName.value,
            country: "Nigeria",
            preferredCurrency: "USDT",
            initialPackId: packId,
            generation: gen
          },
          "New downline registered! Gen " + gen + " (" + pct + "%) rebate of +$" + comm.toFixed(2) + " USDT credited to Flexible Wallet!"
        );
      });
    }

    var saveMethodForm = document.getElementById("saveMethodForm");
    if (saveMethodForm) {
      saveMethodForm.addEventListener("submit", function (e) {
        e.preventDefault();
        dispatchAction(
          "SAVE_WITHDRAWAL_METHOD",
          {
            channel: "CRYPTO_USDT_USDC",
            label: saveMethodForm.label.value,
            destination: saveMethodForm.destination.value
          },
          "Withdrawal method saved!",
          true
        );
      });
    }

    var searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        state.searchQuery = e.target.value;
        render();
        var nextInput = document.getElementById("searchInput");
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(
            nextInput.value.length,
            nextInput.value.length
          );
        }
      });
    }

    var chatForm = document.getElementById("chatForm");
    if (chatForm) {
      chatForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var msg = chatForm.msg.value.trim();
        if (!msg) return;
        state.chatMessages.push({ sender: "user", text: msg });
        state.chatMessages.push({
          sender: "agent",
          text:
            "Thank you! Your message has been logged with our regional support desk (Ticket #SPW-" +
            Math.floor(1000 + Math.random() * 9000) +
            ")."
        });
        dispatchAction("SUBMIT_SUPPORT_TICKET", {
          subject: "Live Chat Inquiry",
          message: msg
        });
      });
    }

    var rechargeForm = document.getElementById("rechargeForm");
    if (rechargeForm) {
      rechargeForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var amt = Number(rechargeForm.amount.value);
        var netKey = state.rechargeNetwork || "USDT-TRC20";
        var currentNet = DEPOSIT_NETWORKS[netKey] || DEPOSIT_NETWORKS["USDT-TRC20"];
        dispatchAction(
          "RECHARGE_WALLET",
          {
            userId: state.activeUserId,
            amountCents: Math.round(amt * 100),
            network: netKey
          },
          null,
          true
        ).then(function (res) {
          if (res) {
            var txHash = (res && res.txHash) || ("0x" + Array.from({ length: 64 }, function () { return Math.floor(Math.random() * 16).toString(16); }).join(""));
            state.lastTxReceipt = {
              type: "RECHARGE",
              title: "Flexible Wallet Recharged",
              network: currentNet.name,
              txHash: txHash,
              grossAmount: amt,
              fee: 0,
              netAmount: amt,
              destination: currentNet.address,
              status: "CONFIRMED (12/12 Network Blocks)",
              time: new Date().toLocaleTimeString()
            };
            state.modal = "receipt";
            render(false, true);
          }
        });
      });
    }

    var exchangeForm = document.getElementById("exchangeForm");
    if (exchangeForm) {
      var dirSelect = document.getElementById("exchangeDirSelect");
      var amtInput = document.getElementById("exchangeAmountInput");
      var previewNote = document.getElementById("exchangePreviewNote");

      function updateExchangePreview() {
        if (!previewNote || !dirSelect || !amtInput) return;
        var amt = Number(amtInput.value || 0);
        var dir = dirSelect.value;
        var mr = (state.data && state.data.marketRates) || {};
        var spwR = Number(mr.spwUsd || 1.054);
        var usdcR = Number(mr.usdcUsdt || 1.0001);
        if (dir === "usdt_to_usdc") {
          var out = amt > 0 ? (amt / usdcR).toFixed(2) : "0.00";
          previewNote.innerHTML =
            "Estimated output: <strong>" +
            out +
            " USDC</strong> (Rate: " +
            usdcR.toFixed(4) +
            ")";
        } else if (dir === "usdc_to_usdt") {
          var out = amt > 0 ? (amt * usdcR).toFixed(2) : "0.00";
          previewNote.innerHTML =
            "Estimated output: <strong>" +
            out +
            " USDT</strong> (Rate: " +
            usdcR.toFixed(4) +
            ")";
        } else if (dir === "spw_to_usdt") {
          var out = amt > 0 ? (amt * spwR).toFixed(2) : "0.00";
          previewNote.innerHTML =
            "Estimated output: <strong>" +
            out +
            " USDT</strong> (Rate: " +
            spwR.toFixed(4) +
            ")";
        }
      }

      if (dirSelect) dirSelect.addEventListener("change", updateExchangePreview);
      if (amtInput) amtInput.addEventListener("input", updateExchangePreview);

      exchangeForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var amt = Number(exchangeForm.amount.value || 0);
        dispatchAction(
          "FLASH_EXCHANGE",
          {
            direction: exchangeForm.dir.value,
            amountCents: Math.round(amt * 100)
          },
          "Flash Exchange completed at real market rate!"
        );
      });
    }

    var withdrawForm = document.getElementById("withdrawForm");
    if (withdrawForm) {
      var wdAmt = document.getElementById("withdrawAmountInput");
      var wdGross = document.getElementById("wdGrossPreview");
      var wdFee = document.getElementById("wdFeePreview");
      var wdNet = document.getElementById("wdNetPreview");
      var wdAlert = document.getElementById("wdAlertNote");
      var wdBtn = document.getElementById("withdrawSubmitBtn");

      function updateWdPreview() {
        if (!wdAmt) return;
        var val = Number(wdAmt.value || 0);
        var fee = Number(((val * 3) / 100).toFixed(2));
        var net = Number(Math.max(0, val - fee).toFixed(2));
        var avail = userFlexUsdt(state.data.activeUser);

        if (wdGross) wdGross.textContent = "$" + val.toFixed(2) + " USDT";
        if (wdFee) wdFee.textContent = "-$" + fee.toFixed(2) + " USDT";
        if (wdNet) wdNet.textContent = "$" + net.toFixed(2) + " USDT";

        if (val < 15) {
          if (wdAlert) {
            wdAlert.textContent = "⚠ Minimum withdrawal amount is $15.00 USD.";
            wdAlert.style.color = "var(--negative)";
          }
          if (wdBtn) wdBtn.disabled = true;
        } else if (val > avail) {
          if (wdAlert) {
            wdAlert.textContent = "⚠ Amount exceeds available flexible wallet balance ($" + fmt(avail) + ").";
            wdAlert.style.color = "var(--negative)";
          }
          if (wdBtn) wdBtn.disabled = true;
        } else {
          if (wdAlert) {
            wdAlert.textContent = "⚡ Instant Automated Processing: TxHash is generated and confirmed upon submission.";
            wdAlert.style.color = "var(--muted)";
          }
          if (wdBtn) wdBtn.disabled = false;
        }
      }

      if (wdAmt) {
        wdAmt.addEventListener("input", updateWdPreview);
        updateWdPreview();
      }

      withdrawForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var amt = Number(withdrawForm.amount.value);
        var dest = withdrawForm.dest.value.trim();
        if (amt < 15) {
          showToast("Minimum withdrawal is $15.00 USDT", true);
          return;
        }
        dispatchAction(
          "WALLET_OUTFLOW",
          {
            userId: state.activeUserId,
            channel: "CRYPTO_USDT_USDC",
            grossAmountCents: Math.round(amt * 100),
            destinationDetails: dest
          },
          null,
          true
        ).then(function (res) {
          if (res) {
            var fee = Number(((amt * 3) / 100).toFixed(2));
            var net = Number((amt - fee).toFixed(2));
            var txHash = (res && res.txHash) || ("0x" + Array.from({ length: 64 }, function () { return Math.floor(Math.random() * 16).toString(16); }).join(""));
            state.lastTxReceipt = {
              type: "WITHDRAWAL",
              title: "Withdrawal Sent & Confirmed",
              network: dest.startsWith("0x") ? "USDT-BEP20 / ERC20" : (dest.startsWith("T") ? "USDT-TRC20" : "Direct Bank Settlement"),
              txHash: txHash,
              grossAmount: amt,
              fee: fee,
              netAmount: net,
              destination: dest,
              status: "APPROVED & PAID (Instant Automated Settlement)",
              time: new Date().toLocaleTimeString()
            };
            state.modal = "receipt";
            render(false, true);
          }
        });
      });
    }

    var transferForm = document.getElementById("transferForm");
    if (transferForm) {
      transferForm.addEventListener("submit", function (e) {
        e.preventDefault();
        dispatchAction(
          "WALLET_OUTFLOW",
          {
            userId: state.activeUserId,
            channel: "P2P_MEMBER_TRANSFER",
            recipientUserId: transferForm.toUserId.value,
            grossAmountCents: Math.round(Number(transferForm.amount.value) * 100),
            destinationDetails: "Internal P2P Transfer"
          },
          "P2P transfer completed!"
        );
      });
    }

    var savingsForm = document.getElementById("savingsForm");
    if (savingsForm) {
      savingsForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var amt = Number(savingsForm.amount.value || 0);
        var dir = savingsForm.direction ? savingsForm.direction.value : "DEPOSIT_TO_JAR";
        dispatchAction(
          "SAVINGS_JAR",
          {
            direction: dir,
            amountCents: Math.round(amt * 100)
          },
          dir === "DEPOSIT_TO_JAR"
            ? "Moved " + amt + " USDT to Savings Jar!"
            : "Redeemed " + amt + " USDT to Flexible Wallet!"
        );
      });
    }

    var creatorForm = document.getElementById("creatorForm");
    if (creatorForm) {
      creatorForm.addEventListener("submit", function (e) {
        e.preventDefault();
        state.nav = "discover";
        dispatchAction(
          "PUBLISH_ARTICLE",
          {
            category: creatorForm.category.value,
            title: creatorForm.title.value,
            excerpt: creatorForm.excerpt.value
          },
          "Article published to Discover feed!"
        );
      });
    }
  }

  loadState();
})();
