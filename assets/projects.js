// Projects carousel. Touch swiping is native scrolling with snap points;
// this adds mouse dragging, arrows, the name tabs, keyboard keys and links to #project-id.
(function () {
  var track = document.querySelector(".carousel-track");
  if (!track) return;
  var root = track.closest(".carousel");
  var section = track.closest("section");
  var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
  var controls = section.querySelector(".carousel-controls");
  var arrows = section.querySelectorAll(".carousel-arrow");
  var currentEl = section.querySelector(".carousel-current");
  var tabsEl = section.querySelector(".carousel-tabs");
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var index = 0;

  root.classList.add("js-carousel");
  section.querySelector(".carousel-total").textContent = slides.length;
  controls.hidden = false;
  tabsEl.hidden = false;

  var tabs = slides.map(function (slide, i) {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", (i + 1) + " of " + slides.length);
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = slide.dataset.title || slide.querySelector("h3").textContent;
    b.addEventListener("click", function () { go(i); });
    tabsEl.appendChild(b);
    return b;
  });

  function offsetOf(i) {
    // Where the track has to scroll for slide i to sit at its snap point
    var max = track.scrollWidth - track.clientWidth;
    return Math.min(slides[i].offsetLeft - slides[0].offsetLeft, max);
  }

  function nearest() {
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < slides.length; i++) {
      var d = Math.abs(offsetOf(i) - track.scrollLeft);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  function fitHeight() {
    track.style.height = slides[index].offsetHeight + "px";
  }

  function update(i) {
    index = i;
    slides.forEach(function (s, j) {
      s.classList.toggle("active", j === i);
    });
    tabs.forEach(function (t, j) { t.setAttribute("aria-current", j === i ? "true" : "false"); });
    // On phones the tabs row scrolls; keep the current tab in view
    if (tabsEl.scrollWidth > tabsEl.clientWidth) {
      var smooth = root.classList.contains("ready") && !reduceMotion;
      tabsEl.scrollTo({ left: tabs[i].offsetLeft - tabsEl.offsetLeft - 16, behavior: smooth ? "smooth" : "auto" });
    }
    currentEl.textContent = i + 1;
    arrows[0].disabled = i === 0;
    arrows[1].disabled = i === slides.length - 1;
    fitHeight();
  }

  function go(i, instant) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: offsetOf(i), behavior: instant || reduceMotion ? "auto" : "smooth" });
    update(i);
  }

  // Keep the counter and tabs in sync with native scrolling (touch, trackpad)
  var ticking = false;
  track.addEventListener("scroll", function () {
    if (ticking || dragging) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var i = nearest();
      if (i !== index) update(i);
    });
  }, { passive: true });

  arrows.forEach(function (a) {
    a.addEventListener("click", function () { go(index + Number(a.dataset.dir)); });
  });

  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
  });

  // Mouse dragging. Touch and pen already scroll natively.
  var dragging = false, moved = false, startX = 0, startScroll = 0, startIndex = 0, startTime = 0;

  track.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    startIndex = index;
    startTime = performance.now();
  });

  window.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      track.classList.add("dragging");
    }
    if (moved) track.scrollLeft = startScroll - dx;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    if (!moved) return;
    var dx = e.clientX - startX;
    var fast = Math.abs(dx) / (performance.now() - startTime) > 0.4;
    var far = Math.abs(dx) > slides[0].offsetWidth * 0.2;
    var target = startIndex;
    if (dx < 0 && (fast || far)) target = startIndex + 1;
    else if (dx > 0 && (fast || far)) target = startIndex - 1;
    go(target);
    // Turn snapping back on once the scroll animation has settled
    var restore = function () { track.classList.remove("dragging"); };
    if ("onscrollend" in window) track.addEventListener("scrollend", restore, { once: true });
    setTimeout(restore, 600);
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // A drag that ends on a link must not open it, and a click on the peeking
  // slide brings it forward instead of following a link in it
  track.addEventListener("click", function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
    var i = slides.indexOf(e.target.closest(".slide"));
    if (i >= 0 && i !== index) { e.preventDefault(); e.stopPropagation(); go(i); }
  }, true);
  track.addEventListener("dragstart", function (e) { e.preventDefault(); });

  // Bring a focused link in an off-screen slide into view
  track.addEventListener("focusin", function (e) {
    var slide = e.target.closest && e.target.closest(".slide");
    if (slide) {
      var i = slides.indexOf(slide);
      if (i !== index) go(i);
    }
  });

  // Links to #nordic-ai-cup etc. open that slide
  function slideForHash(hash) {
    if (!hash || hash.length < 2) return -1;
    var el = document.getElementById(decodeURIComponent(hash.slice(1)));
    return slides.indexOf(el);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href*='#']");
    if (!a || a.pathname !== location.pathname) return;
    var i = slideForHash(a.hash);
    if (i < 0) return;
    e.preventDefault();
    history.pushState(null, "", a.hash);
    // Instant, because two smooth scrolls at once cancel each other in Chrome
    go(i, true);
    section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  function openFromHash() {
    var i = slideForHash(location.hash);
    if (i < 0) return;
    go(i, true);
    section.scrollIntoView();
  }
  window.addEventListener("hashchange", openFromHash);

  // Slide heights change as fonts load and the window resizes
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () {
      track.scrollLeft = offsetOf(index);
      fitHeight();
    });
    slides.forEach(function (s) { ro.observe(s); });
  } else {
    window.addEventListener("resize", function () { go(index, true); });
  }

  update(0);
  openFromHash();
  // The browser's own jump to the #fragment can land after this script ran
  window.addEventListener("load", openFromHash);
  // Animate height changes only after the first layout has settled
  setTimeout(function () { root.classList.add("ready"); }, 300);
})();
