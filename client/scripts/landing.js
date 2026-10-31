(function () {
  var menuBtn = document.getElementById("menuBtn");
  var navLinks = document.getElementById("navLinks");
  if (menuBtn && navLinks) {
    function setMenu(open) {
      navLinks.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    menuBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!navLinks.classList.contains("open"));
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("click", function (e) {
      if (
        navLinks.classList.contains("open") &&
        !navLinks.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) {
        setMenu(false);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) setMenu(false);
    });
  }

  var MODULES = {
    personal: {
      tag: "MODULE 01 · PERSONAL CENTER",
      title: "Personal Center & Multi-Wallet Hub",
      desc: "Manage your Flexible Wallet, Points Wallet, and Savings Jar from a unified workspace. Execute instant Recharge, Withdraw, Flash Exchange, and P2P Member Transfers with zero pre-filled clutter.",
      points: [
        "Sub-tabs for Assets, Account, Membership, Tasks, Order, Download & Refer",
        "Instant Recharge, Withdraw, Flash Exchange, and P2P Member Transfer",
        "Real-time Flexible Asset List (USDC, USDT, SPW) and Income Composition"
      ],
      preview:
        '<div class="mock-bar"><span class="mock-pill active">Assets</span><span class="mock-pill">Account</span><span class="mock-pill">Membership</span><span class="mock-pill">Tasks</span><span class="mock-pill">Order</span></div>' +
        '<div class="mock-dark-card"><div class="mock-dark-top"><span>Total Assets</span><strong>0 USDT</strong></div><div class="mock-dark-sub"><span>Points Wallet: 0 USDT</span><span>Flexible Wallet: 0 USDT</span><span>Savings Jar: 0 USDT</span></div></div>' +
        '<div class="mock-actions"><span>Recharge</span><span>Withdraw</span><span>Flash Exchange</span><span>Transfer</span></div>'
    },
    discover: {
      tag: "MODULE 02 · DISCOVER & CREATOR",
      title: "Discover Feed, Article Ranking & Creator Studio",
      desc: "Read verified community dispatches across Economy, Technology, Finance, and Society, or publish your own field insights in the Creator studio. Your Likes and Comments update your participation log in real time.",
      points: [
        "Filter live community articles by Economy, Technology, Finance, or Society",
        "Interactive Like and Comment tracking inside Your Participation panel",
        "Publish original articles and updates directly from the Creator tab"
      ],
      preview:
        '<div class="mock-bar"><span class="mock-pill active">All</span><span class="mock-pill">Economy</span><span class="mock-pill">Technology</span><span class="mock-pill">Finance</span></div>' +
        '<div class="mock-dark-card"><div class="mock-dark-top"><span>Featured Community Dispatch</span><strong>Verified</strong></div><div class="mock-dark-sub"><span>Regional Trade Corridor Settlement Guide</span><span>Interactive Likes &amp; Comments</span></div></div>' +
        '<div class="mock-actions"><span>Like Article</span><span>Post Comment</span><span>Creator Studio</span><span>Article Ranking</span></div>'
    },
    team: {
      tag: "MODULE 03 · TEAM & MILESTONES",
      title: "Team Directory, Upline Contact & 7-Stage Milestone Track",
      desc: "Coordinate directly with your sponsor in the Upline module, organize regional chapters in the Team directory, and track verified community milestones across a 7-stage progression bar.",
      points: [
        "7-node visual Milestone progression tracker inside Personal Center",
        "Direct Upline mentor card and regional Team organization view",
        "Dedicated Refer & Earn invitation code and link sharing tools"
      ],
      preview:
        '<div class="mock-bar"><span class="mock-pill active">Team</span><span class="mock-pill">Milestone</span><span class="mock-pill">Upline</span><span class="mock-pill">Refer &amp; Earn</span></div>' +
        '<div class="mock-dark-card"><div class="mock-dark-top"><span>Milestone Progress</span><strong>Stage 1 — 7</strong></div><div class="mock-dark-sub"><span>Direct Team: 0 Members</span><span>Active Chapter: Verified</span></div></div>' +
        '<div class="mock-actions"><span>Team View</span><span>Milestone Map</span><span>Upline Info</span><span>Copy Invite</span></div>'
    },
    offline: {
      tag: "MODULE 04 · OFFLINE & SUPPORT",
      title: "Support Center, Savings Jar & Regional Operations",
      desc: "Access step-by-step operational guides in the Support Center, allocate flexible balances into the Savings Jar, or open a live ticket with Customer Support for regional hub assistance.",
      points: [
        "Searchable Support Center FAQ and live Customer Support desk",
        "Savings Jar (Piggy Bank) allocation and redemption controls",
        "Mobile-ready workspace with instant bottom-bar navigation"
      ],
      preview:
        '<div class="mock-bar"><span class="mock-pill active">Support Center</span><span class="mock-pill">Customer Support</span><span class="mock-pill">Savings Jar</span><span class="mock-pill">Download</span></div>' +
        '<div class="mock-dark-card"><div class="mock-dark-top"><span>Regional Support Desk</span><strong>Online 24/7</strong></div><div class="mock-dark-sub"><span>Savings Jar Balance: 0 USDT</span><span>Support Response: Instant</span></div></div>' +
        '<div class="mock-actions"><span>Help Guides</span><span>Live Support</span><span>Savings Jar</span><span>Mobile App</span></div>'
    }
  };

  var explorerTabs = document.getElementById("explorerTabs");
  if (explorerTabs) {
    var modTag = document.getElementById("modTag");
    var modTitle = document.getElementById("modTitle");
    var modDesc = document.getElementById("modDesc");
    var modPoints = document.getElementById("modPoints");
    var modPreview = document.getElementById("modPreview");

    explorerTabs.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-mod]");
      if (!btn) return;
      var key = btn.getAttribute("data-mod");
      var data = MODULES[key];
      if (!data) return;

      explorerTabs.querySelectorAll(".explorer-tab").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });

      if (modTag) modTag.textContent = data.tag;
      if (modTitle) modTitle.textContent = data.title;
      if (modDesc) modDesc.textContent = data.desc;
      if (modPoints) {
        modPoints.innerHTML = data.points
          .map(function (p) {
            return "<li>" + p + "</li>";
          })
          .join("");
      }
      if (modPreview) {
        modPreview.innerHTML = data.preview;
      }
    });
  }
})();
