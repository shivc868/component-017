import "./style.css";
import gsap from "gsap";

/* ------------------------------------------------------------------ data */

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

const IMG_PARAMS = "?q=80&w=900&auto=format&fit=crop";
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg,#ff2d91,#5b2bff)",
  "linear-gradient(135deg,#00e5ff,#7b2bff)",
  "linear-gradient(135deg,#ff7a2d,#ff2d91)",
  "linear-gradient(135deg,#2bff88,#00b3ff)",
];

const N = SLIDES.length;
const VISIBLE_RANGE = 4.4; // how many card-units away a card is still rendered
const AUTOPLAY_DELAY = 2; // seconds between steps
const STEP_DURATION = 1.05; // seconds a single autoplay step takes

/* ------------------------------------------------------------------ dom */

const stage = document.querySelector(".stage");
const slider = document.getElementById("slider");
const track = document.getElementById("track");
const hudTitle = document.getElementById("hudTitle");
const hudRole = document.getElementById("hudRole");
const cursorEl = document.getElementById("cursor");

const cards = SLIDES.map((slide, i) => {
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <div class="card__img-wrap">
      <img src="${slide.src}${IMG_PARAMS}" alt="${slide.title}" draggable="false" />
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

/* ------------------------------------------------------------------ state */

const state = {
  current: 0, // rendered position (card units)
  target: 0, // where we're heading
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStartTarget: 0,
  velocity: 0, // card units / second, for release inertia
  lastDragX: 0,
  lastDragT: 0,
  activeIndex: -1,
  pxPerUnit: 320, // set in resize()
  spacingX: 300,
  spacingY: 120,
};

let autoplayTween = null;
let autoplayTimer = null;

/* ------------------------------------------------------------------ layout */

function resize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // spacing below the card width so neighbouring cards still overlap, with more air
  state.spacingX = Math.min(vw * 0.175, 270);
  state.spacingY = Math.min(vh * 0.14, state.spacingX * 0.46);
  state.pxPerUnit = state.spacingX; // drag conversion
}
window.addEventListener("resize", resize);
resize();

/** shortest wrapped distance from the current position to card i */
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

    // non-linear spacing: the first step away from center gets extra room
    // (the hero card breathes), further steps compress so side cards overlap
    const spread =
      Math.sign(d) * (Math.min(abs, 1) * 1.4 + Math.max(abs - 1, 0) * 0.82);

    // diagonal path: right = up, like the reference
    const x = spread * state.spacingX;
    const y = -spread * state.spacingY;

    // rotation grows with distance from center, capped so far cards don't spin
    const rot = gsap.utils.clamp(-16, 16, d * 7.5);

    // center card is the hero
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

    // parallax inside the frame + dim as it leaves center
    if (card.img.isConnected) {
      // ±3.5%/unit stays inside the 150% bleed even at the visibility edge (4.4 * 3.5 = 15.4 < 16.6)
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
    // split the name into letters for a staggered rise
    hudTitle.innerHTML = SLIDES[active].title
      .split("")
      .map((c) =>
        c === " "
          ? `<span class="ch ch--space">&nbsp;</span>`
          : `<span class="ch">${c}</span>`,
      )
      .join("");
    hudRole.querySelector("em").textContent = SLIDES[active].role;

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

/* ------------------------------------------------------------------ ticker */

gsap.ticker.add((_, deltaMS) => {
  const dt = deltaMS / 1000;
  // critically-damped chase: framerate-independent smoothing.
  // softer while dragging so cards glide behind the pointer instead of sticking to it
  const ease = 1 - Math.pow(state.dragging ? 0.008 : 0.001, dt);
  state.current += (state.target - state.current) * ease;
  render();
});

/* ------------------------------------------------------------------ autoplay */

function stopAutoplay() {
  gsap.killTweensOf(state); // autoplay step, inertia settle, wheel snap
  autoplayTween = null;
  clearTimeout(autoplayTimer);
}

function queueAutoplay(delay = AUTOPLAY_DELAY) {
  stopAutoplay();
  autoplayTimer = setTimeout(step, delay * 1000);
}

function step() {
  autoplayTween = gsap.to(state, {
    target: Math.round(state.target) + 1,
    duration: STEP_DURATION,
    ease: "power3.inOut",
    onComplete: () => queueAutoplay(),
  });
}

queueAutoplay(1.6);

/* ------------------------------------------------------------------ drag */

slider.addEventListener("pointerdown", (e) => {
  slider.setPointerCapture(e.pointerId);
  stopAutoplay();
  state.dragging = true;
  state.dragStartX = e.clientX;
  state.dragStartTarget = state.target;
  state.lastDragX = e.clientX;
  state.lastDragT = performance.now();
  state.velocity = 0;
  stage.classList.add("is-dragging");
});

slider.addEventListener("pointermove", (e) => {
  if (!state.dragging) return;
  const dx = e.clientX - state.dragStartX;
  // dragging right pulls earlier cards into view
  state.target = state.dragStartTarget - dx / state.pxPerUnit;

  const now = performance.now();
  const dtMs = now - state.lastDragT;
  if (dtMs > 0) {
    const v = -(e.clientX - state.lastDragX) / state.pxPerUnit / (dtMs / 1000);
    state.velocity = state.velocity * 0.7 + v * 0.3; // smooth the sample
  }
  state.lastDragX = e.clientX;
  state.lastDragT = now;
});

function endDrag() {
  if (!state.dragging) return;
  state.dragging = false;
  stage.classList.remove("is-dragging");

  // inertia: project the throw, then settle on the nearest card
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

slider.addEventListener("pointerup", endDrag);
slider.addEventListener("pointercancel", endDrag);

/* ------------------------------------------------------------------ keyboard */

window.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  stopAutoplay();
  const dir = e.key === "ArrowRight" ? 1 : -1;
  gsap.to(state, {
    target: Math.round(state.target) + dir,
    duration: 0.9,
    ease: "power3.inOut",
    onComplete: () => queueAutoplay(),
  });
});

/* ------------------------------------------------------------------ cursor */

const cursorPos = { x: innerWidth / 2, y: innerHeight / 2 };
window.addEventListener("pointermove", (e) => {
  cursorPos.x = e.clientX;
  cursorPos.y = e.clientY;
});
gsap.ticker.add(() => {
  gsap.set(cursorEl, {
    x: cursorPos.x,
    y: cursorPos.y,
  });
});

/* ------------------------------------------------------------------ intro */

// animate the container (the ticker owns per-card transforms every frame)
gsap.from(slider, {
  opacity: 0,
  scale: 0.86,
  duration: 1.4,
  ease: "power3.out",
});
gsap.from(".hud", {
  opacity: 0,
  y: 10,
  duration: 1,
  delay: 0.4,
  ease: "power2.out",
});
