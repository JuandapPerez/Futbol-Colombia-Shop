/*
  script.js
  Interacciones (solo JS puro):
  - WhatsApp dinámico (mensaje prellenado por combo)
  - Scroll reveal
  - Carrusel automático de testimonios + dots + pausa al hover
  - Countdown (fecha ajustable)
  - Parallax suave en hero
  - Confeti (canvas)
*/

(() => {
  "use strict";

  // ==============================
  // Configuración
  // ==============================

  // WhatsApp oficial (solicitado):
  const WHATSAPP_PHONE = "573112655979";

  // 2) Inicio del Mundial 2026: 11 de junio de 2026
  const WORLD_CUP_TARGET = new Date("2026-06-11T00:00:00-05:00");

  // Mensaje base (el detalle final se arma con el formulario en el modal)
  const BASE_GREETING = "Hola, quiero comprar";

  // ==============================
  // Utilidades
  // ==============================

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function format2(n) {
    return String(n).padStart(2, "0");
  }

  function buildWhatsAppUrl(message) {
    const text = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_PHONE}?text=${text}`;
  }

  // ==============================
  // Modal + formulario (nuevo flujo de compra)
  // ==============================

  function initOrderModal() {
    const modal = $("#orderModal");
    const form = $("#orderForm");
    const errorBox = $("#formError");
    if (!modal || !form || !errorBox) return;

    const comboSel = form.elements.namedItem("combo");
    const sizesHost = $("#sizesHost", form);
    const sizesLabel = $("#sizesLabel", form);
    const sizesHint = $("#sizesHint", form);
    const celular = form.elements.namedItem("celular");
    const nombres = form.elements.namedItem("nombres");
    const apellidos = form.elements.namedItem("apellidos");
    const direccion = form.elements.namedItem("direccion");
    const barrio = form.elements.namedItem("barrio");
    const detalle = form.elements.namedItem("detalle");
    const ciudad = form.elements.namedItem("ciudad");

    if (!comboSel || !celular || !nombres || !apellidos || !direccion || !barrio || !detalle || !ciudad || !sizesHost || !sizesLabel || !sizesHint) return;

    const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

    function getSizeCount(comboValue) {
      const n = Number(String(comboValue || "").trim());
      if (n === 2) return 2;
      if (n === 3) return 3;
      return 1;
    }

    function renderSizeSelect(index, valueToKeep = "") {
      const sel = document.createElement("select");
      sel.className = "field__control";
      sel.name = `talla${index}`;
      sel.required = true;
      sel.setAttribute("aria-label", `Talla ${index}`);

      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "Selecciona…";
      sel.appendChild(opt0);

      for (const s of SIZE_OPTIONS) {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        sel.appendChild(opt);
      }

      if (valueToKeep) sel.value = valueToKeep;
      return sel;
    }

    function updateSizes() {
      const count = getSizeCount(comboSel.value);
      const prev = $$("select", sizesHost).map((s) => String(s.value || ""));

      sizesHost.innerHTML = "";
      for (let i = 1; i <= count; i++) {
        sizesHost.appendChild(renderSizeSelect(i, prev[i - 1] || ""));
      }

      sizesLabel.textContent = count === 1 ? "Talla" : "Tallas";
      sizesHint.textContent = `Selecciona ${count} talla${count === 1 ? "" : "s"}.`;
    }

    function showError(message) {
      errorBox.textContent = message;
      errorBox.classList.add("is-on");
    }

    function clearError() {
      errorBox.textContent = "";
      errorBox.classList.remove("is-on");
    }

    function open(prefillCombo = "") {
      clearError();
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      if (prefillCombo) {
        comboSel.value = String(prefillCombo);
      }

      updateSizes();

      // Enfocar el primer campo
      window.setTimeout(() => {
        comboSel.focus();
      }, 50);
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    // Delegación: botones que abren el modal
    for (const btn of $$('[data-open-modal="true"]')) {
      btn.addEventListener("click", () => {
        btn.classList.add("is-clicked");
        window.setTimeout(() => btn.classList.remove("is-clicked"), 450);
        const pre = btn.getAttribute("data-prefill-combo") || "";
        open(pre);
      });
    }

    // Cierre (backdrop, botón X)
    for (const el of $$('[data-close-modal="true"]', modal)) {
      el.addEventListener("click", close);
    }

    // Escape
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });

    comboSel.addEventListener("change", updateSizes);
    updateSizes();

    function normalizePhone(raw) {
      // Dejar solo dígitos. Si pegan +57/57, conservamos los últimos 10.
      let digits = String(raw || "").replace(/\D+/g, "");
      if (digits.length > 10) digits = digits.slice(-10);
      return digits;
    }

    function required(value) {
      return String(value || "").trim().length > 0;
    }

    // En vivo: solo dígitos + máximo 10
    celular.addEventListener("input", () => {
      const normalized = normalizePhone(celular.value);
      if (celular.value !== normalized) celular.value = normalized;
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearError();

      const combo = String(comboSel.value || "").trim();
      const sizeCount = getSizeCount(combo);
      const tallas = [];
      for (let i = 1; i <= sizeCount; i++) {
        const el = form.elements.namedItem(`talla${i}`);
        const v = String(el && "value" in el ? el.value : "").trim();
        tallas.push(v);
      }
      const phone = normalizePhone(celular.value);
      const name = String(nombres.value || "").trim();
      const last = String(apellidos.value || "").trim();
      const addr = String(direccion.value || "").trim();
      const hood = String(barrio.value || "").trim();
      const more = String(detalle.value || "").trim();
      const city = String(ciudad.value || "").trim();

      if (!required(combo)) return showError("Selecciona un combo (1, 2 o 3).");
      for (let i = 0; i < tallas.length; i++) {
        if (!required(tallas[i])) {
          const n = i + 1;
          return showError(sizeCount === 1 ? "Selecciona tu talla." : `Selecciona la talla ${n} (de ${sizeCount}).`);
        }
      }
      if (!required(phone) || phone.length !== 10) return showError("Ingresa un número de celular válido (10 dígitos).");
      if (!required(name)) return showError("Ingresa tus nombres.");
      if (!required(last)) return showError("Ingresa tus apellidos.");
      if (!required(addr)) return showError("Ingresa tu dirección completa.");
      if (!required(hood)) return showError("Ingresa tu barrio.");
      if (!required(more)) return showError("Completa casa/apto, número y conjunto.");
      if (!required(city)) return showError("Ingresa tu departamento/ciudad.");

      const tallaLine =
        tallas.length === 1
          ? `talla ${tallas[0]}`
          : `tallas ${tallas.join(" + ")}`;

      const plain =
        `${BASE_GREETING} Combo ${combo} (${tallaLine}).\n\n` +
        `Datos:\n` +
        `- Nombre: ${name} ${last}\n` +
        `- Celular: ${phone}\n` +
        `- Dirección: ${addr}\n` +
        `- Barrio: ${hood}\n` +
        `- Detalle: ${more}\n` +
        `- Dpto/Ciudad: ${city}\n\n` +
        `Gracias.`;

      const url = buildWhatsAppUrl(plain);
      window.open(url, "_blank", "noopener,noreferrer");
      close();
    });
  }

  // ==============================
  // Scroll reveal
  // ==============================

  function initReveal() {
    const items = $$('[data-reveal]');

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function animateCount(el) {
      const target = Number(el.getAttribute("data-count"));
      if (!Number.isFinite(target) || target <= 0) return;

      // Evitar re-ejecución
      if (el.getAttribute("data-counted") === "true") return;
      el.setAttribute("data-counted", "true");

      if (reduceMotion) {
        el.textContent = String(target);
        return;
      }

      const start = 0;
      const duration = 900;
      const t0 = performance.now();

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function frame(now) {
        const p = Math.min(1, (now - t0) / duration);
        const value = Math.round(start + (target - start) * easeOutCubic(p));
        el.textContent = String(value);
        if (p < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    // Si no hay soporte, mostramos todo.
    if (!("IntersectionObserver" in window)) {
      for (const el of items) el.classList.add("is-visible");
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");

            // Si dentro del bloque hay números con data-count, animarlos
            const counters = $$('[data-count]', entry.target);
            for (const c of counters) animateCount(c);

            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    for (const el of items) obs.observe(el);
  }

  // ==============================
  // Countdown
  // ==============================

  function initCountdown() {
    const daysEl = $("#cd-days");
    const hoursEl = $("#cd-hours");
    const minsEl = $("#cd-mins");
    const secsEl = $("#cd-secs");

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    function tick() {
      const now = new Date();
      const diff = WORLD_CUP_TARGET.getTime() - now.getTime();

      if (diff <= 0) {
        daysEl.textContent = "00";
        hoursEl.textContent = "00";
        minsEl.textContent = "00";
        secsEl.textContent = "00";
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = Math.floor(totalSeconds % 60);

      daysEl.textContent = String(days);
      hoursEl.textContent = format2(hours);
      minsEl.textContent = format2(mins);
      secsEl.textContent = format2(secs);
    }

    tick();
    window.setInterval(tick, 1000);
  }

  // ==============================
  // Carrusel testimonios
  // ==============================

  function createStars() {
    const wrap = document.createElement("div");
    wrap.className = "stars";
    wrap.setAttribute("aria-label", "5 estrellas");

    for (let i = 0; i < 5; i++) {
      const s = document.createElement("span");
      s.className = "star";
      s.setAttribute("aria-hidden", "true");
      wrap.appendChild(s);
    }

    return wrap;
  }

  function initCarousel() {
    const track = $("#carouselTrack");
    const dotsWrap = $("#dots");
    const prevBtn = $("#prevBtn");
    const nextBtn = $("#nextBtn");
    const root = $(".carousel");

    if (!track || !dotsWrap || !prevBtn || !nextBtn || !root) return;

    // Testimonios simulados (fotos simuladas: avatares con inicial)
    const data = [
      {
        name: "Camila Rojas",
        meta: "Bogotá",
        text: "La camiseta se siente premium y el color amarillo es brutal. La caja de regalo quedó espectacular.",
      },
      {
        name: "Juan Sebastián Pérez",
        meta: "Medellín",
        text: "Pedí el combo 2 y llegó rápido. Excelente atención por WhatsApp y la calidad top.",
      },
      {
        name: "Valentina Gómez",
        meta: "Cali",
        text: "Me encantó el estilo deportivo, se ve como publicidad de marca grande. Recomendadísima.",
      },
      {
        name: "Andrés Torres",
        meta: "Barranquilla",
        text: "Compré para regalar y fue un hit. Se nota el detalle y el acabado.",
      },
    ];

    // Render
    track.innerHTML = "";
    dotsWrap.innerHTML = "";

    const slides = data.map((t) => {
      const card = document.createElement("article");
      card.className = "testimonial";

      const top = document.createElement("div");
      top.className = "testimonial__top";

      const person = document.createElement("div");
      person.className = "person";

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = t.name.trim().slice(0, 1).toUpperCase();
      avatar.setAttribute("aria-hidden", "true");

      const info = document.createElement("div");
      const name = document.createElement("div");
      name.className = "person__name";
      name.textContent = t.name;
      const meta = document.createElement("div");
      meta.className = "person__meta";
      meta.textContent = t.meta;

      info.appendChild(name);
      info.appendChild(meta);

      person.appendChild(avatar);
      person.appendChild(info);

      top.appendChild(person);
      top.appendChild(createStars());

      const text = document.createElement("p");
      text.className = "testimonial__text";
      text.textContent = t.text;

      card.appendChild(top);
      card.appendChild(text);

      track.appendChild(card);
      return card;
    });

    let index = 0;
    let timer = null;
    let isPaused = false;

    function updateDots() {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const d = document.createElement("button");
        d.className = "dot";
        d.type = "button";
        d.setAttribute("aria-label", `Ir al testimonio ${i + 1}`);
        d.setAttribute("aria-current", i === index ? "true" : "false");
        d.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(d);
      });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(${-index * 100}%)`;
      updateDots();
    }

    function next() {
      goTo(index + 1);
    }

    function prev() {
      goTo(index - 1);
    }

    function start() {
      stop();
      timer = window.setInterval(() => {
        if (!isPaused) next();
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    prevBtn.addEventListener("click", () => {
      prev();
      start();
    });

    nextBtn.addEventListener("click", () => {
      next();
      start();
    });

    root.addEventListener("mouseenter", () => (isPaused = true));
    root.addEventListener("mouseleave", () => (isPaused = false));

    // Touch swipe (simple)
    let startX = null;
    root.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length === 0) return;
      startX = e.touches[0].clientX;
    }, { passive: true });

    root.addEventListener("touchend", (e) => {
      if (startX == null) return;
      const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : startX;
      const dx = endX - startX;
      startX = null;

      if (Math.abs(dx) > 40) {
        if (dx < 0) next();
        else prev();
        start();
      }
    });

    goTo(0);
    start();

    // Accesibilidad: flechas
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    });
  }

  // ==============================
  // Parallax (hero)
  // ==============================

  function initParallax() {
    const hero = $(".hero");
    if (!hero) return;

    // Usamos una variable CSS para mover el fondo.
    function onScroll() {
      const rect = hero.getBoundingClientRect();
      // Solo cuando está cerca del viewport
      const progress = clamp(1 - rect.top / Math.max(1, window.innerHeight), 0, 1);
      const y = Math.round(progress * 18); // px
      hero.style.setProperty("--parallax", `${y}px`);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ==============================
  // Confeti (canvas)
  // ==============================

  function initConfetti() {
    const canvas = $("#confetti");
    const btn = $("#confettiBtn");
    const cta = $("#finalCta");

    if (!canvas || !btn) return;

    const ctx = canvas.getContext("2d");
    let raf = null;
    let particles = [];

    function resize() {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(count = 110) {
      const colors = [
        "rgba(247, 209, 23, 0.95)",
        "rgba(11, 44, 107, 0.95)",
        "rgba(200, 30, 42, 0.95)",
        "rgba(255, 255, 255, 0.85)",
      ];

      const w = window.innerWidth;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: w * 0.5 + (Math.random() - 0.5) * 120,
          y: -10 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 5.2,
          vy: 2.2 + Math.random() * 4.4,
          size: 5 + Math.random() * 7,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.25,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          ttl: 220 + Math.random() * 110,
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles = particles.filter((p) => p.life < p.ttl && p.y < window.innerHeight + 30);

      for (const p of particles) {
        p.life += 1;
        p.vy += 0.03; // gravedad
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.66);
        ctx.restore();
      }

      if (particles.length > 0) {
        raf = window.requestAnimationFrame(step);
      } else {
        canvas.classList.remove("is-on");
        raf = null;
      }
    }

    function fire() {
      resize();
      canvas.classList.add("is-on");
      spawn(120);
      if (!raf) raf = window.requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    btn.addEventListener("click", fire);

    // Bonus: al hacer click en el CTA final, celebramos también.
    if (cta) cta.addEventListener("click", fire);
  }

  // ==============================
  // Init
  // ==============================

  document.addEventListener("DOMContentLoaded", () => {
    initOrderModal();
    initReveal();
    initCountdown();
    initCarousel();
    initParallax();
    initConfetti();
  });
})();
