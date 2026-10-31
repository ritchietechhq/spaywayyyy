(function () {
  var COUNTRIES = [
    ["Nigeria", "+234", "NG"],
    ["Ghana", "+233", "GH"],
    ["Côte d'Ivoire", "+225", "CI"],
    ["Senegal", "+221", "SN"],
    ["Cameroon", "+237", "CM"],
    ["Benin", "+229", "BJ"],
    ["Togo", "+228", "TG"],
    ["Kenya", "+254", "KE"],
    ["South Africa", "+27", "ZA"],
    ["United Kingdom", "+44", "GB"],
    ["United States", "+1", "US"],
    ["Canada", "+1", "CA"],
    ["United Arab Emirates", "+971", "AE"],
    ["Afghanistan", "+93", "AF"],
    ["Albania", "+355", "AL"],
    ["Algeria", "+213", "DZ"],
    ["Andorra", "+376", "AD"],
    ["Angola", "+244", "AO"],
    ["Antigua & Barbuda", "+1-268", "AG"],
    ["Argentina", "+54", "AR"],
    ["Armenia", "+374", "AM"],
    ["Australia", "+61", "AU"],
    ["Austria", "+43", "AT"],
    ["Azerbaijan", "+994", "AZ"],
    ["Bahamas", "+1-242", "BS"],
    ["Bahrain", "+973", "BH"],
    ["Bangladesh", "+880", "BD"],
    ["Barbados", "+1-246", "BB"],
    ["Belarus", "+375", "BY"],
    ["Belgium", "+32", "BE"],
    ["Belize", "+501", "BZ"],
    ["Bermuda", "+1-441", "BM"],
    ["Bhutan", "+975", "BT"],
    ["Bolivia", "+591", "BO"],
    ["Bosnia & Herzegovina", "+387", "BA"],
    ["Botswana", "+267", "BW"],
    ["Brazil", "+55", "BR"],
    ["Brunei", "+673", "BN"],
    ["Bulgaria", "+359", "BG"],
    ["Burkina Faso", "+226", "BF"],
    ["Burundi", "+257", "BI"],
    ["Cambodia", "+855", "KH"],
    ["Cape Verde", "+238", "CV"],
    ["Central African Republic", "+236", "CF"],
    ["Chad", "+235", "TD"],
    ["Chile", "+56", "CL"],
    ["China", "+86", "CN"],
    ["Colombia", "+57", "CO"],
    ["Comoros", "+269", "KM"],
    ["Congo (Brazzaville)", "+242", "CG"],
    ["Congo (DRC)", "+243", "CD"],
    ["Costa Rica", "+506", "CR"],
    ["Croatia", "+385", "HR"],
    ["Cuba", "+53", "CU"],
    ["Cyprus", "+357", "CY"],
    ["Czech Republic", "+420", "CZ"],
    ["Denmark", "+45", "DK"],
    ["Djibouti", "+253", "DJ"],
    ["Dominica", "+1-767", "DM"],
    ["Dominican Republic", "+1-809", "DO"],
    ["Ecuador", "+593", "EC"],
    ["Egypt", "+20", "EG"],
    ["El Salvador", "+503", "SV"],
    ["Equatorial Guinea", "+240", "GQ"],
    ["Eritrea", "+291", "ER"],
    ["Estonia", "+372", "EE"],
    ["Eswatini", "+268", "SZ"],
    ["Ethiopia", "+251", "ET"],
    ["Fiji", "+679", "FJ"],
    ["Finland", "+358", "FI"],
    ["France", "+33", "FR"],
    ["Gabon", "+241", "GA"],
    ["Gambia", "+220", "GM"],
    ["Georgia", "+995", "GE"],
    ["Germany", "+49", "DE"],
    ["Greece", "+30", "GR"],
    ["Grenada", "+1-473", "GD"],
    ["Guatemala", "+502", "GT"],
    ["Guinea", "+224", "GN"],
    ["Guinea-Bissau", "+245", "GW"],
    ["Guyana", "+592", "GY"],
    ["Haiti", "+509", "HT"],
    ["Honduras", "+504", "HN"],
    ["Hong Kong", "+852", "HK"],
    ["Hungary", "+36", "HU"],
    ["Iceland", "+354", "IS"],
    ["India", "+91", "IN"],
    ["Indonesia", "+62", "ID"],
    ["Iran", "+98", "IR"],
    ["Iraq", "+964", "IQ"],
    ["Ireland", "+353", "IE"],
    ["Israel", "+972", "IL"],
    ["Italy", "+39", "IT"],
    ["Jamaica", "+1-876", "JM"],
    ["Japan", "+81", "JP"],
    ["Jordan", "+962", "JO"],
    ["Kazakhstan", "+7", "KZ"],
    ["Kiribati", "+686", "KI"],
    ["Kuwait", "+965", "KW"],
    ["Kyrgyzstan", "+996", "KG"],
    ["Laos", "+856", "LA"],
    ["Latvia", "+371", "LV"],
    ["Lebanon", "+961", "LB"],
    ["Lesotho", "+266", "LS"],
    ["Liberia", "+231", "LR"],
    ["Libya", "+218", "LY"],
    ["Liechtenstein", "+423", "LI"],
    ["Lithuania", "+370", "LT"],
    ["Luxembourg", "+352", "LU"],
    ["Macau", "+853", "MO"],
    ["Madagascar", "+261", "MG"],
    ["Malawi", "+265", "MW"],
    ["Malaysia", "+60", "MY"],
    ["Maldives", "+960", "MV"],
    ["Mali", "+223", "ML"],
    ["Malta", "+356", "MT"],
    ["Mauritania", "+222", "MR"],
    ["Mauritius", "+230", "MU"],
    ["Mexico", "+52", "MX"],
    ["Moldova", "+373", "MD"],
    ["Monaco", "+377", "MC"],
    ["Mongolia", "+976", "MN"],
    ["Montenegro", "+382", "ME"],
    ["Morocco", "+212", "MA"],
    ["Mozambique", "+258", "MZ"],
    ["Myanmar", "+95", "MM"],
    ["Namibia", "+264", "NA"],
    ["Nepal", "+977", "NP"],
    ["Netherlands", "+31", "NL"],
    ["New Zealand", "+64", "NZ"],
    ["Nicaragua", "+505", "NI"],
    ["Niger", "+227", "NE"],
    ["North Macedonia", "+389", "MK"],
    ["Norway", "+47", "NO"],
    ["Oman", "+968", "OM"],
    ["Pakistan", "+92", "PK"],
    ["Panama", "+507", "PA"],
    ["Papua New Guinea", "+675", "PG"],
    ["Paraguay", "+595", "PY"],
    ["Peru", "+51", "PE"],
    ["Philippines", "+63", "PH"],
    ["Poland", "+48", "PL"],
    ["Portugal", "+351", "PT"],
    ["Qatar", "+974", "QA"],
    ["Romania", "+40", "RO"],
    ["Russia", "+7", "RU"],
    ["Rwanda", "+250", "RW"],
    ["Saudi Arabia", "+966", "SA"],
    ["Serbia", "+381", "RS"],
    ["Seychelles", "+248", "SC"],
    ["Sierra Leone", "+232", "SL"],
    ["Singapore", "+65", "SG"],
    ["Slovakia", "+421", "SK"],
    ["Slovenia", "+386", "SI"],
    ["Somalia", "+252", "SO"],
    ["South Korea", "+82", "KR"],
    ["South Sudan", "+211", "SS"],
    ["Spain", "+34", "ES"],
    ["Sri Lanka", "+94", "LK"],
    ["Sudan", "+249", "SD"],
    ["Suriname", "+597", "SR"],
    ["Sweden", "+46", "SE"],
    ["Switzerland", "+41", "CH"],
    ["Syria", "+963", "SY"],
    ["Taiwan", "+886", "TW"],
    ["Tajikistan", "+992", "TJ"],
    ["Tanzania", "+255", "TZ"],
    ["Thailand", "+66", "TH"],
    ["Trinidad & Tobago", "+1-868", "TT"],
    ["Tunisia", "+216", "TN"],
    ["Turkey", "+90", "TR"],
    ["Turkmenistan", "+993", "TM"],
    ["Uganda", "+256", "UG"],
    ["Ukraine", "+380", "UA"],
    ["Uruguay", "+598", "UY"],
    ["Uzbekistan", "+998", "UZ"],
    ["Venezuela", "+58", "VE"],
    ["Vietnam", "+84", "VN"],
    ["Yemen", "+967", "YE"],
    ["Zambia", "+260", "ZM"],
    ["Zimbabwe", "+263", "ZW"]
  ];

  var params = new URLSearchParams(window.location.search);
  var mode = params.get("mode") === "signin" ? "signin" : "register";
  var method = "phone";
  var activeCaptcha = "";

  var tabRegister = document.getElementById("tabRegister");
  var tabSignin = document.getElementById("tabSignin");
  var authTitle = document.getElementById("authTitle");
  var authSubtitle = document.getElementById("authSubtitle");
  var methodSwitch = document.getElementById("methodSwitch");
  var phoneGroup = document.getElementById("phoneGroup");
  var emailGroup = document.getElementById("emailGroup");
  var countrySearch = document.getElementById("countrySearch");
  var countrySelect = document.getElementById("countryCodeSelect");
  var confirmPwGroup = document.getElementById("confirmPwGroup");
  var inviteGroup = document.getElementById("inviteGroup");
  var inviteInput = document.getElementById("inviteInput");
  var submitBtn = document.getElementById("submitBtn");
  var footSwitchWrap = document.getElementById("footSwitchWrap");
  var authAlert = document.getElementById("authAlert");
  var captchaCanvas = document.getElementById("captchaCanvas");
  var refreshCaptchaBtn = document.getElementById("refreshCaptchaBtn");
  var authForm = document.getElementById("authForm");

  if (inviteInput && (params.get("ref") || params.get("invite"))) {
    inviteInput.value = params.get("ref") || params.get("invite") || "";
  }

  function populateCountries(filterText) {
    var q = (filterText || "").trim().toLowerCase();
    var list = COUNTRIES.filter(function (c) {
      if (!q) return true;
      return (
        c[0].toLowerCase().indexOf(q) !== -1 ||
        c[1].toLowerCase().indexOf(q) !== -1 ||
        c[2].toLowerCase().indexOf(q) !== -1
      );
    });

    countrySelect.innerHTML = list
      .map(function (c) {
        return (
          '<option value="' +
          c[1] +
          '" data-country="' +
          c[0] +
          '">' +
          c[2] +
          " · " +
          c[0] +
          " (" +
          c[1] +
          ")</option>"
        );
      })
      .join("");
  }

  function generateCaptcha() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var code = "";
    for (var i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    activeCaptcha = code;
    if (!captchaCanvas) return;
    captchaCanvas.setAttribute("data-code", code);

    var ctx = captchaCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#111113";
    ctx.fillRect(0, 0, captchaCanvas.width, captchaCanvas.height);

    // Subtle security lines
    for (var l = 0; l < 4; l++) {
      ctx.strokeStyle = l % 2 === 0 ? "#e11d48" : "#3f3f46";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 30, Math.random() * 40);
      ctx.lineTo(90 + Math.random() * 36, Math.random() * 40);
      ctx.stroke();
    }

    // Draw characters
    ctx.font = "bold 20px monospace";
    ctx.textBaseline = "middle";
    for (var j = 0; j < code.length; j++) {
      ctx.save();
      var x = 18 + j * 22;
      var y = 20 + (Math.random() * 6 - 3);
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.28);
      ctx.fillStyle = j % 2 === 0 ? "#ffffff" : "#fda4af";
      ctx.fillText(code.charAt(j), 0, 0);
      ctx.restore();
    }
  }

  var submitLabelEl = submitBtn.querySelector(".btn-label");
  var idleLabel = "";

  function setSubmitLabel(text) {
    idleLabel = text;
    if (submitLabelEl && !submitBtn.disabled) submitLabelEl.textContent = text;
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle("is-loading", on);
    submitBtn.setAttribute("aria-busy", on ? "true" : "false");
    if (submitLabelEl) {
      submitLabelEl.textContent = on
        ? mode === "register"
          ? "Creating account..."
          : "Signing in..."
        : idleLabel;
    }
  }

  function showAlert(msg, type) {
    authAlert.textContent = msg;
    authAlert.className = "auth-alert " + (type || "error");
  }

  function clearAlert() {
    authAlert.textContent = "";
    authAlert.className = "auth-alert";
  }

  function updateModeUI() {
    clearAlert();
    var isReg = mode === "register";
    tabRegister.classList.toggle("active", isReg);
    tabSignin.classList.toggle("active", !isReg);

    authTitle.textContent = isReg
      ? "Create Member Account"
      : "Sign In to Spayway";
    authSubtitle.textContent = isReg
      ? "Register with your phone number or email address, password, verification code, and invitation code."
      : "Enter your registered phone number or email address and password.";

    confirmPwGroup.style.display = isReg ? "flex" : "none";
    inviteGroup.style.display = isReg ? "flex" : "none";
    setSubmitLabel(isReg ? "Register Account" : "Sign In to Workspace");

    footSwitchWrap.innerHTML = isReg
      ? 'Already have an account? <button type="button" id="footSwitchBtn">Sign In</button>'
      : 'Need a new account? <button type="button" id="footSwitchBtn">Register</button>';

    var footBtn = document.getElementById("footSwitchBtn");
    if (footBtn) {
      footBtn.addEventListener("click", function () {
        mode = isReg ? "signin" : "register";
        updateModeUI();
      });
    }
  }

  function updateMethodUI() {
    clearAlert();
    var isPhone = method === "phone";
    methodSwitch.querySelectorAll(".method-pill").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-method") === method);
    });
    phoneGroup.style.display = isPhone ? "flex" : "none";
    emailGroup.style.display = isPhone ? "none" : "flex";
  }

  tabRegister.addEventListener("click", function () {
    mode = "register";
    updateModeUI();
  });

  tabSignin.addEventListener("click", function () {
    mode = "signin";
    updateModeUI();
  });

  methodSwitch.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-method]");
    if (!btn) return;
    method = btn.getAttribute("data-method");
    updateMethodUI();
  });

  if (countrySearch) {
    countrySearch.addEventListener("input", function (e) {
      populateCountries(e.target.value);
    });
  }

  document.querySelectorAll("[data-toggle-pw]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetId = btn.getAttribute("data-toggle-pw");
      var input = document.getElementById(targetId);
      if (!input) return;
      var isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      btn.classList.toggle("is-visible", isPw);
      btn.setAttribute("aria-pressed", String(isPw));
      btn.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
    });
  });

  if (refreshCaptchaBtn) {
    refreshCaptchaBtn.addEventListener("click", generateCaptcha);
  }
  if (captchaCanvas) {
    captchaCanvas.addEventListener("click", generateCaptcha);
  }

  var quickTestLoginBtn = document.getElementById("quickTestLoginBtn");
  if (quickTestLoginBtn) {
    quickTestLoginBtn.addEventListener("click", function () {
      mode = "signin";
      method = "email";
      updateModeUI();
      updateMethodUI();
      document.getElementById("emailInput").value = "test@spayway.app";
      document.getElementById("passwordInput").value = "Spayway123!";
      document.getElementById("captchaInput").value = activeCaptcha;
      showAlert(
        "Test Account filled (test@spayway.app / Spayway123!). Click 'Sign In to Workspace' below!",
        "success"
      );
    });
  }

  authForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearAlert();

    var dialCode = countrySelect.value || "+234";
    var selectedOpt = countrySelect.options[countrySelect.selectedIndex];
    var countryName = selectedOpt
      ? selectedOpt.getAttribute("data-country")
      : "Nigeria";
    var phoneVal = document.getElementById("phoneInput").value.trim();
    var emailVal = document.getElementById("emailInput").value.trim();
    var pwVal = document.getElementById("passwordInput").value;
    var confirmPwVal = document.getElementById("confirmPasswordInput").value;
    var captchaVal = document
      .getElementById("captchaInput")
      .value.trim()
      .toUpperCase();
    var inviteVal = document.getElementById("inviteInput").value.trim();

    if (method === "phone" && !phoneVal) {
      showAlert("Please enter your phone number.", "error");
      return;
    }
    if (method === "email" && (!emailVal || emailVal.indexOf("@") === -1)) {
      showAlert("Please enter a valid email address.", "error");
      return;
    }
    if (!pwVal || pwVal.length < 6) {
      showAlert("Password must be at least 6 characters.", "error");
      return;
    }
    if (mode === "register" && pwVal !== confirmPwVal) {
      showAlert("Password and Confirm Password do not match.", "error");
      return;
    }
    if (mode === "register" && !inviteVal) {
      showAlert(
        "Invitation Code is required to register (e.g. SPAYWAY or 1000001).",
        "error"
      );
      return;
    }
    if (!captchaVal || captchaVal !== activeCaptcha) {
      showAlert(
        "Verification code does not match. Please enter the 5-character code shown.",
        "error"
      );
      generateCaptcha();
      return;
    }

    setLoading(true);
    var keepLoading = false;
    try {
      var actionName =
        mode === "register" ? "CREATE_ACCOUNT" : "LOGIN_ACCOUNT";
      var payload =
        mode === "register"
          ? {
              phone: method === "phone" ? phoneVal : "",
              email: method === "email" ? emailVal : "",
              countryCode: dialCode,
              countryName: countryName,
              password: pwVal,
              invitationCode: inviteVal
            }
          : {
              identifier: method === "phone" ? phoneVal : emailVal,
              countryCode: dialCode,
              password: pwVal
            };

      var res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionName,
          payload: payload
        })
      });

      var json = await res.json();
      if (!res.ok || json.error || json.ok === false) {
        showAlert(json.error || "Authentication failed.", "error");
        return;
      }

      var user = json.result || (json.state && json.state.activeUser);
      if (user && user.id) {
        try {
          localStorage.setItem("spayway_user_id", user.id);
          if (json.token) {
            localStorage.setItem("spayway_token", json.token);
          }
        } catch (err) {}
        showAlert(
          mode === "register"
            ? "Account created! Redirecting to your workspace..."
            : "Signed in! Redirecting to your workspace...",
          "success"
        );
        keepLoading = true;
        setTimeout(function () {
          window.location.href =
            "/app?userId=" + encodeURIComponent(user.id) + "&tab=personal";
        }, 400);
      }
    } catch (err) {
      showAlert(err.message || "Network error occurred.", "error");
    } finally {
      if (!keepLoading) setLoading(false);
    }
  });

  populateCountries("");
  generateCaptcha();
  updateModeUI();
  updateMethodUI();
})();
