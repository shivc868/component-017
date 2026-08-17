import "./style.css";
import gsap from "gsap";

export function initTeamSlider(root = document.querySelector(".stage")) {
  if (!root) return null;

  const SLIDES = [
    {
      title: "Julian Reyes",
      role: "Creative Director",
      src: "https://images.unsplash.com/photo-1549068106-b024baf5062d",
    },
    {
      title: "Mara Volkov",
      role: "Art Director",
      src: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91",
    },
    {
      title: "Theo Marchetti",
      role: "Creative Technologist",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    },
    {
      title: "Iris Chen",
      role: "Motion Designer",
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    },
    {
      title: "Dario Mancini",
      role: "3D Artist",
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
    },
    {
      title: "Noa Lindberg",
      role: "Brand Strategist",
      src: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
    },
    {
      title: "Kenji Sato",
      role: "Sound Designer",
      src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce",
    },
    {
      title: "Sana Okafor",
      role: "UX Lead",
      src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    },
    {
      title: "Livia Ferrand",
      role: "Product Designer",
      src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
    },
    {
      title: "Elio Fontaine",
      role: "Frontend Engineer",
      src: "https://images.unsplash.com/photo-1521119989659-a83eee488004",
    },
  ];

  const imgParams = (w) => `?q=80&w=${w}&auto=format&fit=crop`;
  const FALLBACK_GRADIENTS = [
    "linear-gradient(135deg,#ff2d91,#5b2bff)",
    "linear-gradient(135deg,#00e5ff,#7b2bff)",
    "linear-gradient(135deg,#ff7a2d,#ff2d91)",
    "linear-gradient(135deg,#2bff88,#00b3ff)",
  ];

  const N = SLIDES.length;
  const VISIBLE_RANGE = 4.4;
  const AUTOPLAY_DELAY = 2;
  const STEP_DURATION = 1.05;

  const stage = root;
  const slider = root.querySelector(".slider");
  const track = root.querySelector(".slider__track");
  const hudTitle = root.querySelector(".hud__title");
  const hudRole = root.querySelector(".hud__role");
  const cursorEl = root.querySelector(".cursor");
  const hud = root.querySelector(".hud");

  if (!slider || !track || !hudTitle || !hudRole) return null;

  const cards = SLIDES.map((slide, i) => {
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <div class="card__img-wrap">
        <img alt="${slide.title}" draggable="false" />
        <div class="card__shade"></div>
      </div>
    `;
    const img = el.querySelector("img");
    img.addEventListener("error", () => {
      img.remove();
      el.querySelector(".card__img-wrap").style.background =
        FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length];
    });
    track.appendChild(el);
    return {
      el,
      img,
      shade: el.querySelector(".card__shade"),
      index: i,
    };
  });

  {
    const cardW = parseFloat(getComputedStyle(cards[0].el).width) || 300;
    const need = cardW * 1.5 * 1.24 * Math.min(window.devicePixelRatio, 2);
    const width = Math.ceil(need / 100) * 100;
    cards.forEach((card) => {
      card.img.src = SLIDES[card.index].src + imgParams(width);
    });
  }

  const state = {
    current: 0,
    target: 0,
    dragging: false,
    dragStartX: 0,
    dragStartTarget: 0,
    velocity: 0,
    lastDragX: 0,
    lastDragT: 0,
    activeIndex: -1,
    pxPerUnit: 320,
    spacingX: 300,
    spacingY: 120,
  };

  let autoplayTimer = null;

  function resize() {
    const cardW = parseFloat(getComputedStyle(cards[0].el).width) || 300;
    state.spacingX = cardW * 0.86;
    state.spacingY = Math.min(window.innerHeight * 0.14, state.spacingX * 0.46);
    state.pxPerUnit = state.spacingX;
  }
  resize();

  function wrappedDelta(i, pos) {
    let d = (i - pos) % N;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    return d;
  }

  function render() {
    const pos = state.current;

    for (const card of cards) {
      const d = wrappedDelta(card.index, pos);
      const abs = Math.abs(d);

      if (abs > VISIBLE_RANGE) {
        card.el.style.visibility = "hidden";
        continue;
      }
      card.el.style.visibility = "visible";

      const spread =
        Math.sign(d) * (Math.min(abs, 1) * 1.4 + Math.max(abs - 1, 0) * 0.82);

      const x = spread * state.spacingX;
      const y = -spread * state.spacingY;

      const rot = gsap.utils.clamp(-16, 16, d * 7.5);

      const scale = 1.24 - Math.min(abs, 2.4) * 0.19;
      const opacity =
        1 - gsap.utils.clamp(0, 1, (abs - 3.2) / (VISIBLE_RANGE - 3.2));

      gsap.set(card.el, {
        x,
        y,
        rotation: rot,
        scale,
        opacity,
        zIndex: 100 - Math.round(abs * 10),
      });

      if (card.img.isConnected) {
        gsap.set(card.img, { xPercent: -50 - d * 3.5, yPercent: -50 });
      }
      gsap.set(card.shade, { opacity: Math.min(abs * 0.28, 0.66) });

      card.el.classList.toggle("is-active", abs < 0.5);
    }

    updateHud(pos);
  }

  function updateHud(pos) {
    const active = ((Math.round(pos) % N) + N) % N;
    if (active !== state.activeIndex) {
      state.activeIndex = active;
      hudTitle.innerHTML = SLIDES[active].title
        .split("")
        .map((c) =>
          c === " "
            ? `<span class="ch ch--space">&nbsp;</span>`
            : `<span class="ch">${c}</span>`,
        )
        .join("");
      const roleEl = hudRole.querySelector("em");
      if (roleEl) roleEl.textContent = SLIDES[active].role;

      gsap.fromTo(
        hudTitle.querySelectorAll(".ch"),
        { yPercent: 110 },
        { yPercent: 0, duration: 0.7, stagger: 0.028, ease: "power4.out" },
      );
      gsap.fromTo(
        hudRole,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
      );
    }
  }

  function tick(_, deltaMS) {
    const dt = deltaMS / 1000;
    const ease = 1 - Math.pow(state.dragging ? 0.008 : 0.001, dt);
    state.current += (state.target - state.current) * ease;
    render();
  }

  function stopAutoplay() {
    gsap.killTweensOf(state);
    clearTimeout(autoplayTimer);
  }

  function queueAutoplay(delay = AUTOPLAY_DELAY) {
    stopAutoplay();
    autoplayTimer = setTimeout(step, delay * 1000);
  }

  function step() {
    gsap.to(state, {
      target: Math.round(state.target) + 1,
      duration: STEP_DURATION,
      ease: "power3.inOut",
      onComplete: () => queueAutoplay(),
    });
  }

  function onPointerDown(e) {
    slider.setPointerCapture(e.pointerId);
    stopAutoplay();
    state.dragging = true;
    state.dragStartX = e.clientX;
    state.dragStartTarget = state.target;
    state.lastDragX = e.clientX;
    state.lastDragT = performance.now();
    state.velocity = 0;
    stage.classList.add("is-dragging");
  }

  function onPointerMove(e) {
    if (!state.dragging) return;
    const dx = e.clientX - state.dragStartX;
    state.target = state.dragStartTarget - dx / state.pxPerUnit;

    const now = performance.now();
    const dtMs = now - state.lastDragT;
    if (dtMs > 0) {
      const v = -(e.clientX - state.lastDragX) / state.pxPerUnit / (dtMs / 1000);
      state.velocity = state.velocity * 0.7 + v * 0.3;
    }
    state.lastDragX = e.clientX;
    state.lastDragT = now;
  }

  function endDrag() {
    if (!state.dragging) return;
    state.dragging = false;
    stage.classList.remove("is-dragging");

    const thrown = state.target + state.velocity * 0.32;
    const settle = Math.round(thrown);

    gsap.to(state, {
      target: settle,
      duration: gsap.utils.clamp(
        0.6,
        1.4,
        Math.abs(settle - state.target) * 0.35 + 0.6,
      ),
      ease: "power3.out",
      onComplete: () => queueAutoplay(),
    });
  }

  function onKeyDown(e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    stopAutoplay();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    gsap.to(state, {
      target: Math.round(state.target) + dir,
      duration: 0.9,
      ease: "power3.inOut",
      onComplete: () => queueAutoplay(),
    });
  }

  const cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  function onCursorMove(e) {
    cursorPos.x = e.clientX;
    cursorPos.y = e.clientY;
  }

  function cursorTick() {
    gsap.set(cursorEl, { x: cursorPos.x, y: cursorPos.y });
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  window.addEventListener("keydown", onKeyDown);
  slider.addEventListener("pointerdown", onPointerDown);
  slider.addEventListener("pointermove", onPointerMove);
  slider.addEventListener("pointerup", endDrag);
  slider.addEventListener("pointercancel", endDrag);

  gsap.ticker.add(tick);
  if (cursorEl) {
    window.addEventListener("pointermove", onCursorMove);
    gsap.ticker.add(cursorTick);
  }

  queueAutoplay(1.6);

  gsap.from(slider, {
    opacity: 0,
    scale: 0.86,
    duration: 1.4,
    ease: "power3.out",
  });
  if (hud) {
    gsap.from(hud, {
      opacity: 0,
      y: 10,
      duration: 1,
      delay: 0.4,
      ease: "power2.out",
    });
  }

  function destroy() {
    stopAutoplay();
    gsap.ticker.remove(tick);
    gsap.ticker.remove(cursorTick);
    window.removeEventListener("resize", resize);
    window.removeEventListener("orientationchange", resize);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("pointermove", onCursorMove);
    slider.removeEventListener("pointerdown", onPointerDown);
    slider.removeEventListener("pointermove", onPointerMove);
    slider.removeEventListener("pointerup", endDrag);
    slider.removeEventListener("pointercancel", endDrag);
    cards.forEach((card) => card.el.remove());
  }

  return { destroy };
}

initTeamSlider();
