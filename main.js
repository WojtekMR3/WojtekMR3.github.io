// Hero video, header state, mobile menu, hero entrance and section reveals.
(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const narrowQuery = window.matchMedia("(max-width: 649.98px)");

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const stage = $(".stage");
  const video = $(".stage__video");
  const top = $(".top");

  // ---------- Hero video ----------
  // The poster stays when motion is reduced or data saver is on.
  // Phones and small tablets get the 720p file.
  const wantsVideo = Boolean(video) && !reduceMotion && !saveData;
  if (wantsVideo) {
    const small = window.matchMedia("(max-width: 900px)").matches;
    video.src = small ? video.dataset.srcSmall : video.dataset.src;
    video.preload = "auto";
    video.play().catch(() => {});
  }

  const videoReady = new Promise((resolve) => {
    if (!wantsVideo || video.readyState >= 2) {
      resolve();
      return;
    }
    video.addEventListener("loadeddata", resolve, { once: true });
    video.addEventListener("error", resolve, { once: true });
  });

  // ---------- Header state + pause the video off screen ----------
  if ("IntersectionObserver" in window) {
    const headerObserver = new IntersectionObserver((entries) => {
      const heroVisible = entries[0].isIntersecting;
      top.classList.toggle("is-scrolled", !heroVisible);
      if (!wantsVideo) return;
      if (heroVisible) video.play().catch(() => {});
      else video.pause();
    }, { rootMargin: "-90px 0px 0px 0px" });
    headerObserver.observe(stage);
  }

  // ---------- Mobile menu ----------
  (function () {
    const menuBtn = $(".menu-btn");
    const nav = document.getElementById("site-nav");
    const navLinks = Array.from(nav.querySelectorAll("a"));

    function isOpen() {
      return nav.classList.contains("is-open");
    }

    function setMenu(open) {
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      if (open) navLinks[0].focus();
    }

    menuBtn.addEventListener("click", function () {
      setMenu(!isOpen());
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (isOpen()) setMenu(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) {
        setMenu(false);
        menuBtn.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (!isOpen()) return;
      if (nav.contains(e.target) || menuBtn.contains(e.target)) return;
      setMenu(false);
    });

    narrowQuery.addEventListener("change", function () {
      if (isOpen()) setMenu(false);
    });
  })();

  // ---------- Entrance ----------
  // Runs once after fonts and the first video frame are ready. The head script's
  // 3.5s failsafe removes .is-intro; if that already happened, nothing animates.
  (function () {
    if (!root.classList.contains("is-intro")) return;

    const EASE = {
      quart: "cubic-bezier(0.25, 1, 0.5, 1)",
      expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      grow: "cubic-bezier(0.45, 0, 0.2, 1)"
    };

    const logo = $(".logo");
    const actions = $(".hero__actions");
    const cta = $(".hero .cta");
    let started = false;

    function reveal() {
      root.classList.remove("is-intro");
    }

    function lift(el, delay, duration, distance, easing) {
      return el.animate(
        [
          { opacity: 0, transform: "translateY(" + distance + "px)" },
          { opacity: 1, transform: "none" }
        ],
        { delay: delay, duration: duration, easing: easing || EASE.expo, fill: "backwards" }
      );
    }

    // One forced repaint so no compositing layer is left behind from the animations.
    function settle() {
      const targets = [logo, actions];
      targets.forEach((el) => el.classList.add("is-repaint"));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          targets.forEach((el) => el.classList.remove("is-repaint"));
        });
      });
    }

    function play() {
      if (started || !root.classList.contains("is-intro")) return;
      started = true;

      if (typeof Element.prototype.animate !== "function") {
        reveal();
        return;
      }

      const narrow = narrowQuery.matches;
      const scale = (cta.offsetHeight / 46) * (narrow ? 0.8 : 1);
      const travel = (px) => Math.round(px * scale);
      const anims = [];

      // Logo, prompt mark, wordmark
      anims.push(logo.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 500, easing: EASE.quart, fill: "backwards" }));

      $$(".logo__mark path").forEach((path, i) => {
        const len = path.getTotalLength();
        const dash = len + " " + (len + 4);
        anims.push(path.animate(
          [
            { strokeDasharray: dash, strokeDashoffset: len + 2 },
            { strokeDasharray: dash, strokeDashoffset: 0 }
          ],
          { delay: 80 + 45 * i, duration: 820, easing: EASE.grow, fill: "backwards" }
        ));
      });

      anims.push($(".logo__name").animate(
        [{ opacity: 0, transform: "scale(0.92)" }, { opacity: 1, transform: "none" }],
        { delay: 420, duration: 650, easing: EASE.expo, fill: "backwards" }
      ));

      // Nav or menu, links, GitHub
      anims.push(lift(narrow ? $(".menu-btn") : $(".nav"), 120, 700, travel(8)));
      if (!narrow) {
        $$(".nav a").forEach((link, i) => {
          anims.push(lift(link, 260 + 45 * i, 700, travel(4)));
        });
      }
      anims.push(lift($(".gh"), 200, 700, travel(8)));

      // Hero copy
      anims.push(lift($(".hero__brand"), 300, 650, travel(10)));

      $$(".line__inner").forEach((line, i) => {
        anims.push(line.animate(
          [{ transform: "translateY(115%)" }, { transform: "none" }],
          { delay: 380 + 90 * i, duration: 1050, easing: EASE.expo, fill: "backwards" }
        ));
      });

      $$(".hero__lede span").forEach((line, i) => {
        anims.push(lift(line, 800 + 60 * i, 800, travel(14)));
      });

      // Actions + cue
      anims.push(lift(cta, 1000, 800, travel(12)));
      anims.push(lift($(".hero .text-link"), 1100, 600, travel(8), EASE.quart));
      anims.push(lift($(".cue"), 1250, 700, travel(-6)));

      reveal();
      Promise.all(anims.map((a) => a.finished)).then(settle, settle);
    }

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.all([fontsReady, videoReady]).then(play);
  })();

  // ---------- Hero captions ----------
  // Swaps the hero copy in step with the scenes of the looping video, using the
  // same masked line slide as the entrance, and moves the copy to the spot each slide
  // names. Slides, start times and spots live in #hero-slides. Without the video
  // (reduced motion, data saver) the first slide stays.
  (function () {
    const data = document.getElementById("hero-slides");
    if (!wantsVideo || !data || typeof Element.prototype.animate !== "function") return;

    let slides;
    try {
      slides = JSON.parse(data.textContent);
    } catch (err) {
      console.error("hero-slides is not valid JSON", err);
      return;
    }
    if (!Array.isArray(slides) || slides.length < 2) return;

    const EASE_IN = "cubic-bezier(0.7, 0, 0.84, 0)";
    const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
    const hero = $(".hero");
    const copy = $(".hero__copy");
    const brand = $(".hero__brand");
    const lines = $$(".hero__title .line__inner");
    const ledes = $$(".hero__lede span");
    const fades = [brand].concat(ledes);
    let current = 0;
    let running = [];
    let drifting = null;

    function slideAt(seconds) {
      let index = 0;
      slides.forEach((slide, i) => {
        if (seconds >= slide.at) index = i;
      });
      return index;
    }

    function fill(slide) {
      brand.textContent = slide.brand;
      lines.forEach((el, i) => { el.textContent = slide.title[i] || ""; });
      ledes.forEach((el, i) => { el.textContent = slide.lede[i] || ""; });
    }

    // "top-right" becomes data-y="top" data-x="right"; anything unknown falls back to bottom-left.
    function place(slide) {
      const parts = String(slide.pos || "").split("-");
      hero.dataset.y = ["top", "middle", "bottom"].includes(parts[0]) ? parts[0] : "bottom";
      hero.dataset.x = ["left", "center", "right"].includes(parts[1]) ? parts[1] : "left";
    }

    // Lines slide through their masks and pull focus (blur to sharp), like a film title.
    function leave() {
      return lines.map((el, i) => el.animate(
        [{ transform: "none", filter: "blur(0)" }, { transform: "translateY(-115%)", filter: "blur(6px)" }],
        { delay: 40 * i, duration: 380, easing: EASE_IN, fill: "forwards" }
      )).concat(fades.map((el) => el.animate(
        [{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(4px)" }],
        { duration: 300, easing: "ease-in", fill: "forwards" }
      )));
    }

    function enter() {
      return lines.map((el, i) => el.animate(
        [{ transform: "translateY(115%)", filter: "blur(10px)" }, { transform: "none", filter: "blur(0)" }],
        { delay: 70 * i, duration: 1000, easing: EASE_OUT, fill: "backwards" }
      )).concat(fades.map((el, i) => el.animate(
        [{ opacity: 0, transform: "translateY(8px)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
        { delay: 150 + 60 * i, duration: 800, easing: EASE_OUT, fill: "backwards" }
      )));
    }

    // While a slide holds, the copy drifts slowly toward the middle of the frame, like a
    // slow camera move. It is cancelled while the copy is hidden, before the next slide.
    function drift() {
      const dx = { left: 18, center: 0, right: -18 }[hero.dataset.x] || 0;
      const dy = dx === 0 ? -10 : 0;
      return copy.animate(
        [{ transform: "none" }, { transform: "translate(" + dx + "px, " + dy + "px)" }],
        { duration: 7000, easing: "cubic-bezier(0.3, 0, 0.4, 1)", fill: "forwards" }
      );
    }

    function show(index) {
      if (index === current || root.classList.contains("is-intro")) return;
      current = index;
      running.forEach((anim) => anim.cancel());
      hero.classList.add("is-moving");
      const out = leave();
      running = out;
      Promise.all(out.map((anim) => anim.finished)).then(() => {
        fill(slides[index]);
        if (drifting) drifting.cancel();
        place(slides[index]);
        hero.classList.remove("is-moving");
        running = enter();
        drifting = drift();
        // The entering animations hold their start frame, so the exit fill can go.
        out.forEach((anim) => anim.cancel());
      }, () => {
        // Cancelled by a newer swap; that swap fills its own slide.
      });
    }

    video.addEventListener("timeupdate", () => show(slideAt(video.currentTime)));
  })();

  // ---------- Section reveals ----------
  (function () {
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const items = $$(".reveal");
    root.classList.add("has-reveal");

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });

    items.forEach((el) => revealObserver.observe(el));
  })();
})();
