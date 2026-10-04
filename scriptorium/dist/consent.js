/**
 * consent.js - GDPR consent bar + privacy modal for myscriptorium.cz (game + About page)
 * Google Consent Mode v2 (advanced). The default "denied" state is set by the inline
 * snippet in <head> BEFORE GTM; this file handles UI, storage and consent updates.
 * Same model as blog.myscriptorium.cz and fajrum.cz.
 *
 * localStorage key: scriptorium_consent = "granted" | "denied"   (unchanged, existing players keep their choice)
 * Language: GameState.settings.language (game) or <html lang> (About page)
 *
 * API (window.ScrConsent):
 *   openBar()        show the first-visit bar
 *   openModal()      show the privacy modal (status + Decline / Accept)
 *   decided()        true if the player has chosen
 *   state()          "granted" | "denied" | null
 *   label(lang)      localized status text
 *   onDecision(fn)   callback after every choice (granted: boolean)
 * Set window.SCR_CONSENT_MANUAL = true BEFORE this script to disable the automatic bar
 * (the game shows it itself after the language picker).
 */
(function () {
  var KEY = "scriptorium_consent";
  var listeners = [];
  var CSS = "\n" +
"#sc-bar{position:fixed;left:50%;bottom:calc(8px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:calc(100% - 16px);max-width:600px;z-index:10001;display:none;background:linear-gradient(145deg,#f4e4c1,#e8d5a3 60%,#e2c990);color:#3a2a14;border:2px solid #8b5e34;border-radius:6px;box-shadow:0 6px 28px rgba(0,0,0,.55);font-family:'Crimson Text','Palatino Linotype','Book Antiqua',Georgia,serif;padding:12px 14px;text-align:left;}\n" +
"#sc-bar.sc-on{display:block;animation:scIn .3s ease;}\n" +
"@keyframes scIn{from{opacity:0;transform:translate(-50%,12px);}to{opacity:1;transform:translate(-50%,0);}}\n" +
".sc-inner{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}\n" +
".sc-text{flex:1 1 280px;font-size:14px;line-height:1.5;}\n" +
".sc-title{display:block;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#8b5e34;font-weight:700;margin-bottom:3px;}\n" +
".sc-text a,.sc-box a{color:#8b5e34;font-weight:700;text-decoration:underline;cursor:pointer;}\n" +
".sc-actions{display:flex;gap:8px;flex:0 0 auto;}\n" +
".sc-btn{min-width:108px;padding:8px 14px;border-radius:4px;border:1px solid #8b5e34;background:linear-gradient(180deg,#f4e4c1,#dcc690);color:#3a2a14;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;}\n" +
".sc-btn:hover{filter:brightness(1.05);}\n" +
".sc-btn.sc-accept{background:linear-gradient(180deg,#8b5e34,#6b4520);color:#f0deb8;border-color:#4a3015;}\n" +
"@media (max-width:520px){.sc-actions{flex:1 1 100%;}.sc-btn{flex:1;min-width:0;}}\n" +
"#sc-modal{position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:16px;}\n" +
"#sc-modal.sc-on{display:flex;}\n" +
".sc-box{background:linear-gradient(145deg,#f4e4c1,#e8d5a3);color:#3a2a14;border:2px solid #8b5e34;border-radius:6px;max-width:480px;width:100%;max-height:85vh;overflow:auto;padding:18px;text-align:left;font-family:'Crimson Text','Palatino Linotype','Book Antiqua',Georgia,serif;box-shadow:0 6px 32px rgba(0,0,0,.5);}\n" +
".sc-box h3{font-size:18px;margin:0 0 10px;color:#3a2a14;}\n" +
".sc-box p{font-size:14.5px;line-height:1.55;margin:0 0 8px;}\n" +
".sc-box .sc-actions{margin-top:12px;justify-content:flex-end;flex-wrap:wrap;}\n" +
".sc-status{font-size:13px;color:#8b5e34;font-style:italic;border-top:1px solid rgba(42,26,10,.15);padding-top:8px;margin-top:4px;}\n";

  var TX = {
    cs: {
      title: "📜 Měření návštěvnosti",
      text: "Scriptorium používá Google Analytics a Microsoft Clarity, aby věděl, jak se hra hraje (odemykané technologie, délka hraní, postup). Žádné reklamní cookies, žádná osobní data k prodeji.",
      more: "Více info", deny: "Odmítám", accept: "Souhlasím", close: "✕ Zavřít",
      mTitle: "🍪 Soukromí a měření",
      m1: "Scriptorium měří návštěvnost a chování ve hře pomocí Google Analytics 4 a Microsoft Clarity (obojí přes Google Tag Manager). Zajímá nás jen to, jak se hra hraje: kolik lidí ji spustí, jak dlouho hrají, které technologie odemykají a kde se zastaví.",
      m2: "Nepoužíváme reklamní cookies ani remarketing a žádná osobní data neprodáváme ani nesdílíme s dalšími stranami. Google Analytics 4 neukládá IP adresy.",
      m3: "Dokud souhlas nedáte, neukládají se žádné analytické cookies - Google dostává pouze anonymní signály bez cookies (Google Consent Mode v2).",
      m4: "Volbu můžete kdykoli změnit ve hře v Nastavení → Soukromí a cookies, v okně pod ❓ v záhlaví, nebo odkazem 🍪 Cookies v patičce stránky O hře. Globální odhlášení: <a href=\"https://tools.google.com/dlpage/gaoptout\" target=\"_blank\" rel=\"noopener\">doplněk Google Analytics Opt-out</a>.",
      m5: "Provozovatel: Ember PA · <a href=\"https://ember-pa.cz/\" target=\"_blank\" rel=\"noopener\">ember-pa.cz</a>",
      st: "Aktuální volba", sG: "souhlas udělen", sD: "odmítnuto", sN: "zatím nerozhodnuto"
    },
    en: {
      title: "📜 Analytics",
      text: "Scriptorium uses Google Analytics and Microsoft Clarity to learn how the game is played (unlocked technologies, session length, progress). No advertising cookies, no personal data sold.",
      more: "More info", deny: "Decline", accept: "Accept", close: "✕ Close",
      mTitle: "🍪 Privacy & analytics",
      m1: "Scriptorium measures traffic and in-game behaviour with Google Analytics 4 and Microsoft Clarity (both via Google Tag Manager). We only want to know how the game is played: how many people start it, how long they play, which technologies they unlock and where they get stuck.",
      m2: "We use no advertising cookies or remarketing, and no personal data is sold or shared with third parties. Google Analytics 4 does not store IP addresses.",
      m3: "Until you consent, no analytics cookies are stored - Google only receives anonymous cookieless signals (Google Consent Mode v2).",
      m4: "You can change your choice at any time in the game under Settings → Privacy & cookies, in the window behind the ❓ in the header, or via the 🍪 Cookies link in the footer of the About page. Global opt-out: <a href=\"https://tools.google.com/dlpage/gaoptout\" target=\"_blank\" rel=\"noopener\">Google Analytics Opt-out add-on</a>.",
      m5: "Operator: Ember PA · <a href=\"https://ember-pa.cz/\" target=\"_blank\" rel=\"noopener\">ember-pa.cz</a>",
      st: "Current choice", sG: "accepted", sD: "declined", sN: "not decided yet"
    }
  };
  var bar = null, modal = null, lastFocus = null;

  function curLang() {
    try { if (typeof GameState !== "undefined" && GameState && GameState.settings && GameState.settings.language) { return GameState.settings.language === "en" ? "en" : "cs"; } } catch (e) {}
    return (document.documentElement.lang || "cs").toLowerCase().indexOf("en") === 0 ? "en" : "cs";
  }
  function getSaved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function state() { var s = getSaved(); return (s === "granted" || s === "denied") ? s : null; }
  function decided() { return state() !== null; }
  function label(l) { var t = TX[l === "en" ? "en" : "cs"], s = getSaved(); return s === "granted" ? t.sG : (s === "denied" ? t.sD : t.sN); }

  function clearCookies() {
    try {
      var host = location.hostname, parts = host.split("."), root = parts.length > 1 ? "." + parts.slice(-2).join(".") : host;
      document.cookie.split(";").forEach(function (c) {
        var n = c.split("=")[0].trim();
        if (n.indexOf("_ga") === 0 || n.indexOf("_gid") === 0 || n.indexOf("_gat") === 0 || n === "_clck" || n === "_clsk" || n === "CLID" || n === "SM") {
          var exp = "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = n + exp;
          document.cookie = n + exp + ";domain=" + host;
          document.cookie = n + exp + ";domain=" + root;
        }
      });
    } catch (e) {}
  }
  function pushConsent(granted) {
    var v = granted ? "granted" : "denied";
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") { window.gtag = function () { window.dataLayer.push(arguments); }; }
    window.gtag("consent", "update", { analytics_storage: v, functionality_storage: v });
    window.dataLayer.push({ event: "consent_update", consent_analytics: v });
    try {
      if (typeof window.clarity === "function") {
        window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: v });
        if (!granted) { window.clarity("consent", false); }
      }
    } catch (e) {}
  }
  function injectCss() {
    if (document.getElementById("sc-style")) return;
    var s = document.createElement("style"); s.id = "sc-style"; s.textContent = CSS; document.head.appendChild(s);
  }
  function fillBar() {
    var t = TX[curLang()];
    bar.innerHTML = '<div class="sc-inner"><div class="sc-text"><span class="sc-title">' + t.title + '</span>' + t.text +
      ' <a href="#" class="sc-more">' + t.more + '</a></div><div class="sc-actions">' +
      '<button type="button" class="sc-btn sc-deny">' + t.deny + '</button>' +
      '<button type="button" class="sc-btn sc-accept">' + t.accept + '</button></div></div>';
    bar.querySelector(".sc-more").addEventListener("click", function (e) { e.preventDefault(); openModal(); });
    bar.querySelector(".sc-deny").addEventListener("click", function () { setConsent(false); });
    bar.querySelector(".sc-accept").addEventListener("click", function () { setConsent(true); });
  }
  function fillModal() {
    var t = TX[curLang()];
    modal.innerHTML = '<div class="sc-box" role="dialog" aria-modal="true" aria-labelledby="sc-mt"><h3 id="sc-mt">' + t.mTitle + '</h3>' +
      '<p>' + t.m1 + '</p><p>' + t.m2 + '</p><p>' + t.m3 + '</p><p>' + t.m4 + '</p><p>' + t.m5 + '</p>' +
      '<div class="sc-status">' + t.st + ': <strong>' + label(curLang()) + '</strong></div>' +
      '<div class="sc-actions"><button type="button" class="sc-btn sc-close">' + t.close + '</button>' +
      '<button type="button" class="sc-btn sc-deny">' + t.deny + '</button>' +
      '<button type="button" class="sc-btn sc-accept">' + t.accept + '</button></div></div>';
    modal.querySelector(".sc-close").addEventListener("click", closeModal);
    modal.querySelector(".sc-deny").addEventListener("click", function () { setConsent(false); });
    modal.querySelector(".sc-accept").addEventListener("click", function () { setConsent(true); });
  }
  function openBar() {
    injectCss();
    if (!bar) { bar = document.createElement("div"); bar.id = "sc-bar"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Cookies"); document.body.appendChild(bar); }
    fillBar(); bar.classList.add("sc-on");
  }
  function closeBar() { if (bar) bar.classList.remove("sc-on"); }
  function openModal() {
    injectCss();
    lastFocus = document.activeElement;
    if (!modal) {
      modal = document.createElement("div"); modal.id = "sc-modal";
      modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
      document.body.appendChild(modal);
    }
    fillModal(); modal.classList.add("sc-on");
    var b = modal.querySelector(".sc-accept"); if (b) b.focus();
  }
  function closeModal() {
    if (modal) modal.classList.remove("sc-on");
    try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) {}
  }
  function setConsent(granted) {
    try { localStorage.setItem(KEY, granted ? "granted" : "denied"); } catch (e) {}
    pushConsent(granted);
    if (!granted) clearCookies();
    closeBar(); closeModal();
    listeners.slice().forEach(function (fn) { try { fn(granted); } catch (e) {} });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && modal.classList.contains("sc-on")) closeModal();
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("[data-consent-open]") : null;
    if (a) { e.preventDefault(); openModal(); }
  });

  window.ScrConsent = {
    openBar: openBar, openModal: openModal, closeModal: closeModal,
    decided: decided, state: state, label: label,
    onDecision: function (fn) { if (typeof fn === "function") listeners.push(fn); }
  };

  function init() { if (!window.SCR_CONSENT_MANUAL && !decided()) openBar(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
