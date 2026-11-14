/* ==========================================================================
   Raghavendra Patne — portfolio interactions
   Vanilla JS, no dependencies. Every feature degrades gracefully.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hasIO = "IntersectionObserver" in window;

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /* ----------------------------------------------------------------------
     Header: glass state, scroll progress, hide-on-scroll
     ---------------------------------------------------------------------- */

  var header = $("[data-header]");
  var progress = $("[data-progress]");
  var lastScrollY = window.scrollY;
  var headerFrame = null;

  function updateHeader() {
    headerFrame = null;
    if (!header) return;

    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 16);

    if (progress) {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = height > 0 ? clamp(y / height, 0, 1) : 0;
      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }

    var menuOpen = document.body.classList.contains("is-locked");
    if (!menuOpen && y > 620 && y > lastScrollY + 4) {
      header.classList.add("is-hidden");
    } else if (y < lastScrollY - 4 || y < 120) {
      header.classList.remove("is-hidden");
    }

    lastScrollY = y;
  }

  function requestHeaderUpdate() {
    if (headerFrame === null) {
      headerFrame = window.requestAnimationFrame(updateHeader);
    }
  }

  window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
  window.addEventListener("resize", requestHeaderUpdate, { passive: true });
  updateHeader();

  if (header) {
    header.addEventListener("mouseenter", function () {
      header.classList.remove("is-hidden");
    });
  }

  /* ----------------------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------------------- */

  var menuBtn = $("[data-menu-btn]");
  var menu = $("[data-menu]");
  var menuCloseTimer = null;
  var lastFocused = null;

  function menuIsOpen() {
    return !!menu && menu.classList.contains("is-open");
  }

  function openMenu() {
    if (!menu || !menuBtn) return;
    window.clearTimeout(menuCloseTimer);
    lastFocused = document.activeElement;
    menu.hidden = false;
    document.body.classList.add("is-locked");
    menuBtn.setAttribute("aria-expanded", "true");
    header && header.classList.remove("is-hidden");
    window.requestAnimationFrame(function () {
      menu.classList.add("is-open");
      var first = $("a", menu);
      if (first) first.focus({ preventScroll: true });
    });
  }

  function closeMenu(returnFocus) {
    if (!menu || !menuBtn) return;
    menu.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
    menuCloseTimer = window.setTimeout(function () {
      if (!menu.classList.contains("is-open")) menu.hidden = true;
    }, 380);
    if (returnFocus !== false) {
      var target = lastFocused && document.contains(lastFocused) ? lastFocused : menuBtn;
      if (target) target.focus({ preventScroll: true });
    }
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      if (menuIsOpen()) closeMenu();
      else openMenu();
    });

    $$("a", menu).forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!menuIsOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;

      var focusables = $$("a[href], button:not([disabled])", menu).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1120 && menuIsOpen()) closeMenu(false);
    });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */

  var revealItems = $$("[data-reveal]");

  if (revealItems.length) {
    if (!hasIO || prefersReducedMotion.matches) {
      revealItems.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
      );
      revealItems.forEach(function (el) {
        revealObserver.observe(el);
      });
    }
  }

  /* ----------------------------------------------------------------------
     Navigation pill + scroll spy
     ---------------------------------------------------------------------- */

  var nav = $(".nav-desktop");
  var navLinks = $$(".nav-link");
  var navPill = $(".nav-pill");
  var activeNavLink = null;

  function movePill(link) {
    if (!navPill || !link) return;
    var left = link.offsetLeft;
    var width = link.offsetWidth;
    navPill.style.width = width + "px";
    navPill.style.transform = "translateX(" + (left - 4) + "px)";
    navPill.style.opacity = "1";
  }

  function hidePill() {
    if (!navPill) return;
    if (activeNavLink) {
      movePill(activeNavLink);
    } else {
      navPill.style.opacity = "0";
    }
  }

  function setActiveNav(link) {
    navLinks.forEach(function (item) {
      var isActive = item === link;
      item.classList.toggle("is-active", isActive);
      if (isActive) item.setAttribute("aria-current", "location");
      else item.removeAttribute("aria-current");
    });
    activeNavLink = link;
    movePill(link);
  }

  if (nav && navLinks.length) {
    navLinks.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        movePill(link);
      });
    });

    nav.addEventListener("mouseleave", hidePill);

    window.addEventListener("resize", function () {
      if (activeNavLink) movePill(activeNavLink);
    });

    var spySections = navLinks
      .map(function (link) {
        var id = link.getAttribute("href");
        return id && id.charAt(0) === "#" ? document.getElementById(id.slice(1)) : null;
      })
      .filter(Boolean);

    if (hasIO && spySections.length) {
      var spyObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var link = navLinks.filter(function (item) {
              return item.getAttribute("href") === "#" + entry.target.id;
            })[0];
            if (link) setActiveNav(link);
          });
        },
        { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
      );
      spySections.forEach(function (section) {
        spyObserver.observe(section);
      });
    }
  }

  /* ----------------------------------------------------------------------
     Project filtering
     ---------------------------------------------------------------------- */

  var filterButtons = $$("[data-filter]");
  var projects = $$("[data-project]");
  var projectCount = $("[data-project-count]");
  var showcase = $("[data-featured]");
  var grid = $("[data-grid]");

  function applyFilter(category) {
    var visible = 0;

    projects.forEach(function (project) {
      var categories = (project.getAttribute("data-category") || "").split(/\s+/);
      var show = category === "all" || categories.indexOf(category) !== -1;
      project.classList.toggle("is-hidden", !show);
      if (show) visible += 1;
    });

    if (projectCount) projectCount.textContent = String(visible).padStart(2, "0");

    filterButtons.forEach(function (button) {
      var active = button.getAttribute("data-filter") === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (showcase) {
      var featuredVisible = $$("[data-project]", showcase).some(function (project) {
        return !project.classList.contains("is-hidden");
      });
      showcase.classList.toggle("is-empty", !featuredVisible);
    }

    if (grid) {
      var cardsVisible = $$("[data-project]", grid).some(function (project) {
        return !project.classList.contains("is-hidden");
      });
      grid.classList.toggle("is-empty", !cardsVisible);
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-filter") || "all");
    });
  });

  /* ----------------------------------------------------------------------
     Skills tabs
     ---------------------------------------------------------------------- */

  var skillTabs = $$("[data-skill-tab]");

  function activateSkillTab(tab, focus) {
    if (!tab) return;
    var panelId = tab.getAttribute("aria-controls");
    var panel = panelId ? document.getElementById(panelId) : null;

    skillTabs.forEach(function (item) {
      var selected = item === tab;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-selected", selected ? "true" : "false");
      item.setAttribute("tabindex", selected ? "0" : "-1");
      var controlled = document.getElementById(item.getAttribute("aria-controls"));
      if (controlled) {
        controlled.classList.toggle("is-active", selected);
        controlled.hidden = !selected;
      }
    });

    if (panel && focus) panel.focus({ preventScroll: true });
  }

  skillTabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activateSkillTab(tab, false);
    });

    tab.addEventListener("keydown", function (event) {
      var target = null;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        target = skillTabs[(index + 1) % skillTabs.length];
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        target = skillTabs[(index - 1 + skillTabs.length) % skillTabs.length];
      } else if (event.key === "Home") {
        target = skillTabs[0];
      } else if (event.key === "End") {
        target = skillTabs[skillTabs.length - 1];
      }

      if (target) {
        event.preventDefault();
        activateSkillTab(target, false);
        target.focus();
      }
    });
  });

  /* ----------------------------------------------------------------------
     Copy email
     ---------------------------------------------------------------------- */

  var copyButton = $("[data-copy-email]");
  var copyLabel = $("[data-copy-label]");
  var copyStatus = $("[data-copy-status]");
  var copyResetTimer = null;
  var email = "raghavendrapatne836@gmail.com";

  function legacyCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    field.remove();
    return ok;
  }

  function showCopyState(message) {
    if (copyLabel) copyLabel.textContent = "Copied";
    if (copyStatus) copyStatus.textContent = message;
    if (copyButton) copyButton.classList.add("is-copied");
    window.clearTimeout(copyResetTimer);
    copyResetTimer = window.setTimeout(function () {
      if (copyLabel) copyLabel.textContent = "Copy";
      if (copyStatus) copyStatus.textContent = "";
      if (copyButton) copyButton.classList.remove("is-copied");
    }, 2200);
  }

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(email)
          .then(function () {
            showCopyState("Email address copied to your clipboard.");
          })
          .catch(function () {
            showCopyState(
              legacyCopy(email)
                ? "Email address copied to your clipboard."
                : "Copy failed. The address is " + email
            );
          });
      } else {
        showCopyState(
          legacyCopy(email)
            ? "Email address copied to your clipboard."
            : "Copy failed. The address is " + email
        );
      }
    });
  }

  /* ----------------------------------------------------------------------
     Contact form (mailto composition, no backend)
     ---------------------------------------------------------------------- */

  var contactForm = $("[data-contact-form]");
  var formStatus = $("[data-form-status]");

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      var data = new FormData(contactForm);
      var name = String(data.get("name") || "").trim();
      var sender = String(data.get("email") || "").trim();
      var message = String(data.get("message") || "").trim();

      var subject = "Portfolio enquiry" + (name ? " from " + name : "");
      var body = [];
      body.push("Name: " + name);
      body.push("Email: " + sender);
      body.push("");
      body.push(message);
      body.push("");
      body.push("— sent from raghavendrapatne portfolio");

      var href =
        "mailto:" +
        email +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body.join("\n"));

      if (formStatus) {
        formStatus.textContent = "Opening your email app with the message filled in…";
      }

      window.location.href = href;
    });
  }

  /* ----------------------------------------------------------------------
     Footer clock
     ---------------------------------------------------------------------- */

  var yearEl = $("[data-year]");
  var clockEl = $("[data-clock]");

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var timeFormatter = null;
  try {
    timeFormatter = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Kolkata"
    });
  } catch (error) {
    timeFormatter = null;
  }

  function updateClock() {
    if (!clockEl) return;
    var now = new Date();
    clockEl.textContent = timeFormatter
      ? timeFormatter.format(now)
      : String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  }

  updateClock();
  window.setInterval(updateClock, 30000);

  /* ----------------------------------------------------------------------
     Pointer spotlight on project media
     ---------------------------------------------------------------------- */

  $$(".project").forEach(function (project) {
    var media = $(".project-media", project);
    if (!media) return;

    project.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch") return;
      var rect = media.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width) * 100;
      var y = ((event.clientY - rect.top) / rect.height) * 100;
      media.style.setProperty("--mx", x.toFixed(2) + "%");
      media.style.setProperty("--my", y.toFixed(2) + "%");
    });
  });

  /* ----------------------------------------------------------------------
     Generative flow field canvas
     ---------------------------------------------------------------------- */

  var artCard = $(".art-card");
  var canvas = $("[data-flow-canvas]");

  if (artCard && canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var width = 0;
    var height = 0;
    var dpr = 1;
    var particles = [];
    var animationId = null;
    var canvasVisible = true;
    var pointer = { x: -9999, y: -9999, active: false };
    var time = 0;
    var reduceMotion = prefersReducedMotion.matches;

    var palette = [
      "rgba(200, 249, 78, 0.55)",
      "rgba(200, 249, 78, 0.32)",
      "rgba(241, 241, 235, 0.22)",
      "rgba(200, 249, 78, 0.18)"
    ];

    function createParticle(randomLife) {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        px: 0,
        py: 0,
        speed: 0.35 + Math.random() * 0.95,
        color: palette[Math.floor(Math.random() * palette.length)],
        width: Math.random() > 0.9 ? 1.3 : 0.7,
        life: randomLife ? Math.random() * 260 : 0,
        maxLife: 160 + Math.random() * 280
      };
    }

    function resizeCanvas() {
      var rect = artCard.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      var total = width < 380 ? 260 : 420;
      if (reduceMotion) total = 190;
      particles = [];
      for (var i = 0; i < total; i += 1) {
        particles.push(createParticle(!reduceMotion));
      }

      if (reduceMotion) drawStaticField();
    }

    function fieldAngle(x, y) {
      var n =
        Math.sin(x * 0.0082 + time * 0.00042) +
        Math.sin(y * 0.0065 - time * 0.00031) +
        Math.sin((x + y) * 0.0048 + time * 0.00024) +
        Math.sin(Math.sqrt((x - width / 2) * (x - width / 2) + (y - height / 2) * (y - height / 2)) * 0.014 - time * 0.0005);
      return n * 0.92;
    }

    function drawStaticField() {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < particles.length; i += 1) {
        var p = particles[i];
        var angle = fieldAngle(p.x, p.y);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(angle) * 14, p.y + Math.sin(angle) * 14);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = p.width;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function step() {
      animationId = null;
      if (!canvasVisible || document.hidden || reduceMotion) return;

      time += 16;

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.055)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      for (var i = 0; i < particles.length; i += 1) {
        var p = particles[i];
        var angle = fieldAngle(p.x, p.y);

        if (pointer.active) {
          var dx = pointer.x - p.x;
          var dy = pointer.y - p.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 170 && dist > 0.5) {
            var pull = (1 - dist / 170) * 1.9;
            angle = angle * (1 - pull * 0.55) + (Math.atan2(dy, dx) + Math.PI / 2) * pull * 0.55;
          }
        }

        p.px = p.x;
        p.py = p.y;
        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;
        p.life += 1;

        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;
        if (p.y < -12) p.y = height + 12;
        if (p.y > height + 12) p.y = -12;

        if (p.life > p.maxLife) {
          particles[i] = createParticle(false);
          continue;
        }

        var fadeIn = Math.min(p.life / 40, 1);
        var fadeOut = Math.min((p.maxLife - p.life) / 50, 1);
        ctx.globalAlpha = clamp(fadeIn * fadeOut, 0, 1) * 0.9;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animationId = window.requestAnimationFrame(step);
    }

    function startCanvas() {
      if (reduceMotion) {
        drawStaticField();
        return;
      }
      if (animationId === null && canvasVisible) {
        animationId = window.requestAnimationFrame(step);
      }
    }

    function stopCanvas() {
      if (animationId !== null) {
        window.cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    artCard.addEventListener("pointermove", function (event) {
      var rect = artCard.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    });

    artCard.addEventListener("pointerleave", function () {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    });

    var resizeTimer = null;
    if ("ResizeObserver" in window) {
      var canvasResizeObserver = new ResizeObserver(function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
          stopCanvas();
          resizeCanvas();
          startCanvas();
        }, 100);
      });
      canvasResizeObserver.observe(artCard);
    } else {
      window.addEventListener("resize", function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
          stopCanvas();
          resizeCanvas();
          startCanvas();
        }, 150);
      });
    }

    if (hasIO) {
      var artObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            canvasVisible = entry.isIntersecting;
            if (canvasVisible) startCanvas();
            else stopCanvas();
          });
        },
        { threshold: 0.05 }
      );
      artObserver.observe(artCard);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopCanvas();
      else if (canvasVisible) startCanvas();
    });

    if (typeof prefersReducedMotion.addEventListener === "function") {
      prefersReducedMotion.addEventListener("change", function (event) {
        reduceMotion = event.matches;
        stopCanvas();
        resizeCanvas();
        startCanvas();
      });
    }

    resizeCanvas();
    startCanvas();
  }
})();
