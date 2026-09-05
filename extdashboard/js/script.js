(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Persistent light / dark mode ---------------- */
  var themeButtons = document.querySelectorAll("[data-theme-toggle]");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var systemTheme = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function getStoredTheme(){
    try { return localStorage.getItem("crossnotes-theme"); } catch (error) { return null; }
  }

  function setStoredTheme(theme){
    try { localStorage.setItem("crossnotes-theme", theme); } catch (error) { /* private browsing can disable storage */ }
  }

  function applyTheme(theme){
    var isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    themeButtons.forEach(function(button){
      button.setAttribute("aria-pressed", isDark ? "true" : "false");
      button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      var label = button.querySelector(".theme-toggle__label");
      if(label) label.textContent = isDark ? "Light mode" : "Dark mode";
    });
    if(themeMeta) themeMeta.setAttribute("content", isDark ? "#171a2a" : "#f4f1ff");
  }

  applyTheme(document.documentElement.dataset.theme || (systemTheme && systemTheme.matches ? "dark" : "light"));
  themeButtons.forEach(function(button){
    button.addEventListener("click", function(){
      var nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      setStoredTheme(nextTheme);
      applyTheme(nextTheme);
    });
  });
  if(systemTheme){
    systemTheme.addEventListener("change", function(event){
      if(!getStoredTheme()) applyTheme(event.matches ? "dark" : "light");
    });
  }

  var yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  var nav = document.getElementById("nav");
  function onScroll(){ if(nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  var hamburger = document.getElementById("hamburger");
  var navLinks = document.getElementById("navLinks");
  if(hamburger && navLinks){
    hamburger.addEventListener("click", function(){
      var open = navLinks.classList.toggle("open");
      hamburger.classList.toggle("open", open);
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click", function(){
        navLinks.classList.remove("open");
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window && !reduceMotion){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:.14});
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  }else{
    revealEls.forEach(function(el){ el.classList.add("in-view"); });
  }

  var counters = document.querySelectorAll(".stat__num");
  function animateCounter(el){
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if(reduceMotion){ el.textContent = target.toLocaleString("en-IN") + suffix; return; }
    var start = null;
    function step(timestamp){
      if(start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / 1200, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString("en-IN") + suffix;
      if(progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if("IntersectionObserver" in window){
    var counterObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ animateCounter(entry.target); counterObserver.unobserve(entry.target); }
      });
    }, {threshold:.55});
    counters.forEach(function(el){ counterObserver.observe(el); });
  }else counters.forEach(animateCounter);

  document.querySelectorAll(".faq-item__q").forEach(function(button){
    button.addEventListener("click", function(){
      var item = button.closest(".faq-item");
      var isOpen = item.getAttribute("data-open") === "true";
      document.querySelectorAll(".faq-item").forEach(function(other){
        other.setAttribute("data-open", "false");
        var otherButton = other.querySelector(".faq-item__q");
        if(otherButton) otherButton.setAttribute("aria-expanded", "false");
      });
      if(!isOpen){
        item.setAttribute("data-open", "true");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  var confettiColors = ["#8c63ff", "#a4e86f", "#ffb183", "#ffe08b", "#a8d9ef"];
  function burstConfetti(x,y){
    if(reduceMotion) return;
    for(var i=0;i<24;i++){
      var piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.background = confettiColors[i % confettiColors.length];
      piece.style.left = x + "px"; piece.style.top = y + "px";
      document.body.appendChild(piece);
      var angle = Math.random() * Math.PI * 2;
      var distance = 70 + Math.random() * 130;
      var dx = Math.cos(angle) * distance;
      var dy = Math.sin(angle) * distance - 50;
      var rotate = Math.random() * 720 - 360;
      var animation = piece.animate([
        {transform:"translate(0,0) rotate(0deg)",opacity:1},
        {transform:"translate("+dx+"px,"+(dy+250)+"px) rotate("+rotate+"deg)",opacity:0}
      ], {duration:700 + Math.random()*450,easing:"cubic-bezier(.25,.8,.25,1)"});
      animation.onfinish = function(){ piece.remove(); };
    }
  }
  ["ctaHero","ctaFinal"].forEach(function(id){
    var link = document.getElementById(id);
    if(link) link.addEventListener("click", function(){
      var rect = link.getBoundingClientRect();
      burstConfetti(rect.left + rect.width/2, rect.top + rect.height/2);
    });
  });

  var FIRESTORE_PROJECT_ID = "crossnotes-6767";
  var LEADERBOARD_PATH = "leaderboard";
  var avatarPalette = ["#74b7dc","#e5b73b","#f08b56","#a4d57d","#8c63ff","#c276e6"];
  function fsValue(value){
    if(!value) return null;
    if(value.stringValue !== undefined) return value.stringValue;
    if(value.integerValue !== undefined) return parseInt(value.integerValue,10);
    if(value.doubleValue !== undefined) return value.doubleValue;
    if(value.timestampValue !== undefined) return value.timestampValue;
    return null;
  }
  function fsDocToPerson(doc){
    var person = {id:doc.name.split("/").pop()};
    Object.keys(doc.fields || {}).forEach(function(key){ person[key] = fsValue(doc.fields[key]); });
    return person;
  }
  function initials(name){
    if(!name) return "??";
    var parts = String(name).trim().split(/\s+/);
    return ((parts[0] || "")[0] + (parts.length > 1 ? (parts[parts.length-1] || "")[0] : "")).toUpperCase();
  }
  function colorFor(id){
    var hash = 0;
    for(var i=0;i<id.length;i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return avatarPalette[Math.abs(hash) % avatarPalette.length];
  }
  function escapeHTML(value){
    var div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }
  function timeAgo(iso){
    if(!iso) return "";
    var mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if(mins < 1) return "just now";
    if(mins < 60) return mins + "m ago";
    var hrs = Math.floor(mins/60);
    if(hrs < 24) return hrs + "h ago";
    return Math.floor(hrs/24) + "d ago";
  }
  function avatarHTML(person){
    var color = colorFor(person.id);
    var label = initials(person.displayName);
    if(person.photoURL){
      return '<span class="podium__avatar" style="--c:'+color+'"><img class="podium__avatar-img" src="'+escapeHTML(person.photoURL)+'" alt="" referrerpolicy="no-referrer"><span class="podium__avatar-fallback">'+label+'</span></span>';
    }
    return '<span class="podium__avatar" style="--c:'+color+'">'+label+'</span>';
  }
  function podiumColumn(person, rank){
    if(!person) return "";
    var crown = rank === 1 ? '<span class="podium__crown">1</span>' : "";
    return '<div class="podium__col podium__col--'+rank+'">'+crown+avatarHTML(person)+'<p class="podium__name">'+escapeHTML(person.displayName || "Anonymous studier")+'</p><p class="podium__xp">'+(person.xp || 0).toLocaleString("en-IN")+' XP</p><div class="podium__block">'+rank+'</div></div>';
  }
  function attachAvatarFallbacks(container){
    container.querySelectorAll(".podium__avatar-img").forEach(function(img){
      img.addEventListener("error", function(){
        var avatar = img.closest(".podium__avatar");
        if(avatar) avatar.classList.add("podium__avatar--broken");
      });
      if(img.complete && img.naturalWidth === 0){
        var avatar = img.closest(".podium__avatar");
        if(avatar) avatar.classList.add("podium__avatar--broken");
      }
    });
  }
  function renderLeaderboard(people){
    var podium = document.getElementById("podium");
    var meta = document.getElementById("podiumMeta");
    if(!podium || !people.length) return;
    var top3 = people.slice(0,3);
    var order = top3.length >= 3 ? [2,1,3] : top3.length === 2 ? [2,1] : [1];
    podium.innerHTML = order.map(function(rank){ return podiumColumn(top3[rank-1],rank); }).join("");
    attachAvatarFallbacks(podium);
    var mostRecent = people.reduce(function(latest, person){
      if(!person.updatedAt) return latest;
      if(!latest || new Date(person.updatedAt) > new Date(latest)) return person.updatedAt;
      return latest;
    }, null);
    if(meta){ meta.innerHTML = '<span class="live-dot"></span> '+people.length.toLocaleString("en-IN")+' student'+(people.length === 1 ? " is" : "s are")+' on the live leaderboard'+(mostRecent ? " · Updated " + timeAgo(mostRecent) : "")+'.'; }
  }
  function loadLeaderboard(){
    var podium = document.getElementById("podium");
    if(!podium) return;
    var url = "https://firestore.googleapis.com/v1/projects/"+FIRESTORE_PROJECT_ID+"/databases/(default)/documents/"+LEADERBOARD_PATH+"?pageSize=100";
    fetch(url).then(function(response){ if(!response.ok) throw new Error("HTTP "+response.status); return response.json(); }).then(function(data){
      var people = (data.documents || []).map(fsDocToPerson).sort(function(a,b){ return (b.xp || 0) - (a.xp || 0); });
      if(people.length) renderLeaderboard(people);
    }).catch(function(error){ console.info("CrossNotes leaderboard is using the preview state.", error.message); });
  }
  loadLeaderboard();
})();
