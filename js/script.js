/* =====================================================================
   DevClub — Interações
   Ordem: 1) helpers  2) reveal  3) hero canvas (partículas)
          4) contadores  5) tilt 3D  6) parallax cards
          7) timeline fill  8) countdown  9) init
   ===================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Desliga scroll restoration do browser — sempre controlamos manualmente
   (evita reload voltar pra onde estava, ou hash caçado do URL) */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';


/* ---------------------------------------------------------------------
   1. HELPERS
   --------------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const easeOut = t => 1 - Math.pow(1 - t, 3);


/* ---------------------------------------------------------------------
   1.5. INTRO — PRESS START overlay + chuva de código + montagem do hero
   --------------------------------------------------------------------- */
const INTRO_KEY = 'devclub-intro-seen-v1';
const HERO_ASSEMBLE_ORDER = [
  '.hero-proof',
  '.hero-cta',
  '.hero-sub',
  '.hero-title',
  '.hero-badge',
];

function initPressStart() {
  const overlay = $('#pressStart');
  if (!overlay) return;

  const heroEls = HERO_ASSEMBLE_ORDER.map(s => $(s)).filter(Boolean);

  /* Sessão já viu o intro, ou URL pede pra pular (?nointro=1 —
     usado pelo serviço de screenshot)? pula direto */
  if (sessionStorage.getItem(INTRO_KEY) || location.search.includes('nointro')) {
    overlay.remove();
    return;
  }

  /* Intro vai aparecer: garante que a página começa no TOPO,
     limpa hash sobrado da URL (senão browser pula pra âncora) */
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  window.scrollTo(0, 0);

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    sessionStorage.setItem(INTRO_KEY, '1');

    /* Marca hero pra montar bottom-up ANTES do overlay sair
       (overlay ainda cobre, então usuário não vê o "sumir") */
    heroEls.forEach(el => el.classList.add('to-assemble'));

    if (REDUCED) {
      /* prefers-reduced-motion: só fade do overlay, sem rain */
      overlay.classList.add('is-leaving');
      setTimeout(() => {
        overlay.remove();
        heroEls.forEach(el => el.classList.add('is-assembled'));
      }, 500);
      return;
    }

    /* Overlay some enquanto os blocos de código caem nos seus lugares */
    overlay.classList.add('is-leaving');
    setTimeout(() => overlay.remove(), 500);

    startCodeMorph(heroEls);
  };

  document.addEventListener('keydown', dismiss);
  overlay.addEventListener('click', dismiss);
  overlay.addEventListener('touchstart', dismiss, { passive: true });
}

function startCodeMorph(heroEls) {
  const morph = document.createElement('div');
  morph.className = 'code-morph';
  morph.setAttribute('aria-hidden', 'true');

  /* Backdrop escuro — clareia um degrau a cada bloco que pousa */
  const bg = document.createElement('div');
  bg.className = 'code-morph-bg';
  morph.appendChild(bg);
  document.body.appendChild(morph);

  /* Snippet correspondente a cada elemento, na MESMA ordem de
     HERO_ASSEMBLE_ORDER: proof, cta, sub(lede), title, badge */
  const snippets = [
    '<span class="p">&lt;</span><span class="t">div</span> <span class="a">class</span><span class="p">=</span><span class="s">"hero-proof"</span><span class="p">&gt;</span>+42.300 alunos<span class="p">&lt;/</span><span class="t">div</span><span class="p">&gt;</span>',
    '<span class="p">&lt;</span><span class="t">a</span> <span class="a">href</span><span class="p">=</span><span class="s">"#formacoes"</span> <span class="a">class</span><span class="p">=</span><span class="s">"btn"</span><span class="p">&gt;</span>Ver formações →<span class="p">&lt;/</span><span class="t">a</span><span class="p">&gt;</span>',
    '<span class="p">&lt;</span><span class="t">p</span> <span class="a">class</span><span class="p">=</span><span class="s">"lede"</span><span class="p">&gt;</span>Do primeiro Hello World ao primeiro emprego.<span class="p">&lt;/</span><span class="t">p</span><span class="p">&gt;</span>',
    '<span class="p">&lt;</span><span class="t">h1</span> <span class="a">class</span><span class="p">=</span><span class="s">"hero-title"</span><span class="p">&gt;</span>A escola que forma programador de verdade.<span class="p">&lt;/</span><span class="t">h1</span><span class="p">&gt;</span>',
    '<span class="p">&lt;</span><span class="t">div</span> <span class="a">class</span><span class="p">=</span><span class="s">"hero-badge"</span><span class="p">&gt;</span>origem em 2000<span class="p">&lt;/</span><span class="t">div</span><span class="p">&gt;</span>',
  ];

  const FALL = 550;      /* duração da queda */
  const STAGGER = 300;   /* intervalo entre blocos */
  const MORPH = 260;     /* crossfade bloco → elemento real */
  const vw = window.innerWidth;
  const N = heroEls.length;

  heroEls.forEach((el, i) => {
    const line = document.createElement('div');
    line.className = 'morph-line';
    line.innerHTML = snippets[i] || snippets[snippets.length - 1];
    line.style.transform = 'translateY(-120vh)';   /* fora da tela, em cima */
    morph.appendChild(line);

    const t0 = 30 + i * STAGGER;
    /* posiciona no lugar exato do elemento REAL medido na hora da queda
       (protege contra shift de layout por fonte carregando no meio) */
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const w = Math.min(line.offsetWidth, vw * 0.92);
      line.style.left = clamp(rect.left, 8, Math.max(8, vw - w - 8)) + 'px';
      line.style.top  = clamp(rect.top, 8, window.innerHeight - 48) + 'px';
      void line.offsetWidth;   /* commita posição antes de animar a queda */
      line.style.transform = 'translateY(0)';
    }, t0);
    /* pousa: elemento real materializa, bloco evapora, fundo clareia */
    setTimeout(() => {
      el.classList.add('is-assembled');
      line.classList.add('out');
      bg.style.opacity = String(Math.max(0, 1 - (i + 1) / N));
    }, t0 + FALL);
    setTimeout(() => line.remove(), t0 + FALL + MORPH + 200);
  });

  /* Encerramento + safety net (garante hero visível de qualquer jeito) */
  const TOTAL = 30 + (N - 1) * STAGGER + FALL + MORPH + 450;
  setTimeout(() => {
    heroEls.forEach(el => el.classList.add('is-assembled'));
    morph.remove();
  }, TOTAL);
}


/* ---------------------------------------------------------------------
   2. REVEAL (fade + slide ao entrar na viewport)
   --------------------------------------------------------------------- */
function initReveal() {
  const els = $$('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
}


/* ---------------------------------------------------------------------
   3. HERO — fade do conteúdo conforme rola (Spline atrás continua)
   --------------------------------------------------------------------- */
function initHeroFade() {
  const content = $('#heroContent');
  if (!content) return;
  const MAX = 400;
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const opacity = clamp(1 - y / MAX, 0, 1);
    content.style.opacity = opacity.toFixed(3);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}


/* ---------------------------------------------------------------------
   3.5. HERO CUBES — campo de cubos isométricos em canvas 2D puro
        (autoral, zero dependências — substitui a cena Spline)
   --------------------------------------------------------------------- */
function initHeroCubes() {
  const canvas = $('#heroCubes');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const hero = canvas.closest('.hero') || canvas.parentElement;

  const GRID = 5;                                   /* 5x5 cubos */
  const ACCENTS = ['198,255,61', '79,224,255', '139,108,255']; /* lime, ciano, violeta */
  const accent = [];
  for (let n = 0; n < GRID * GRID; n++) {
    const r = Math.random();
    accent.push(r > 0.88 ? 1 : r > 0.78 ? 2 : 0);   /* maioria lime */
  }

  let W = 0, H = 0, spacing = 0, cubeW = 0, cubeH = 0, cx = 0, cy = 0;
  const mouse = { x: -1e4, y: -1e4 };
  let offX = 0, offY = 0;                            /* deslocamento do drag */
  let dragging = false, dsx = 0, dsy = 0, dox = 0, doy = 0;
  let inView = true;

  function resize() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    /* cluster ocupa ~46% da largura, ancorado à direita do centro
       (em telas estreitas centraliza e encolhe) */
    const span = Math.min(W * 0.46, 620);
    spacing = span / GRID;
    cubeW = spacing * 0.86;
    cubeH = cubeW * 0.62;
    cx = W > 720 ? W * 0.66 : W * 0.5;
    cy = H * 0.5;
  }

  /* um cubo isométrico: topo losango + 2 faces verticais + arestas neon */
  function drawCube(x, y, lift, ener, acc) {
    const w = cubeW / 2, h = cubeW / 4, ch = cubeH;
    const yy = y - lift;
    const col = ACCENTS[acc];

    /* topo */
    ctx.beginPath();
    ctx.moveTo(x, yy - h); ctx.lineTo(x + w, yy);
    ctx.lineTo(x, yy + h); ctx.lineTo(x - w, yy);
    ctx.closePath();
    ctx.fillStyle = `rgba(${col},${0.08 + ener * 0.30})`;
    ctx.fill();

    /* face esquerda (mais escura) */
    ctx.beginPath();
    ctx.moveTo(x - w, yy); ctx.lineTo(x, yy + h);
    ctx.lineTo(x, yy + h + ch); ctx.lineTo(x - w, yy + ch);
    ctx.closePath();
    ctx.fillStyle = `rgba(5,6,10,${0.85})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${col},${0.10 + ener * 0.25})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    /* face direita (meio-tom) */
    ctx.beginPath();
    ctx.moveTo(x + w, yy); ctx.lineTo(x, yy + h);
    ctx.lineTo(x, yy + h + ch); ctx.lineTo(x + w, yy + ch);
    ctx.closePath();
    ctx.fillStyle = `rgba(10,13,19,${0.9})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${col},${0.14 + ener * 0.30})`;
    ctx.stroke();

    /* arestas do topo com glow proporcional à energia */
    ctx.beginPath();
    ctx.moveTo(x, yy - h); ctx.lineTo(x + w, yy);
    ctx.lineTo(x, yy + h); ctx.lineTo(x - w, yy);
    ctx.closePath();
    ctx.strokeStyle = `rgba(${col},${0.35 + ener * 0.65})`;
    ctx.lineWidth = 1.5;
    if (ener > 0.25) {
      ctx.shadowColor = `rgba(${col},0.9)`;
      ctx.shadowBlur = 18 * ener;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function frame(now) {
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);

    /* decaimento em mola do drag quando solto */
    if (!dragging) { offX *= 0.92; offY *= 0.92; }
    /* parallax sutil com a posição do mouse */
    const px = mouse.x > -1e3 ? (mouse.x - W / 2) * 0.02 : 0;
    const ox = cx + offX + px;
    const oy = cy + offY;

    /* chão: brilho radial lime sob o cluster */
    const floorY = oy + (GRID * spacing) / 4 + cubeH * 1.4;
    const g = ctx.createRadialGradient(ox, floorY, 0, ox, floorY, spacing * GRID * 0.7);
    g.addColorStop(0, 'rgba(198,255,61,0.10)');
    g.addColorStop(1, 'rgba(198,255,61,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* pinta de trás pra frente (painter's algorithm: i+j crescente) */
    for (let s = 0; s <= (GRID - 1) * 2; s++) {
      for (let i = 0; i <= s; i++) {
        const j = s - i;
        if (i >= GRID || j >= GRID) continue;

        const x = ox + (i - j) * (spacing / 2) * 1.15;
        const y = oy + (i + j - (GRID - 1)) * (spacing / 4) * 1.15;

        /* onda atravessando o campo */
        const wave = (Math.sin(t * 1.4 + (i + j) * 0.55) + 1) * 7;
        /* ripple: cubos perto do cursor sobem e acendem */
        const dx = x - mouse.x, dy = y - mouse.y;
        const sig = cubeW * 1.4;
        const boost = Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
        const lift = wave + boost * 26;
        const ener = clamp(wave / 28 + boost, 0, 1);

        drawCube(x, y, lift, ener, accent[i * GRID + j]);
      }
    }
  }

  /* interação: ripple segue o mouse mesmo sobre o texto do hero */
  hero.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = mouse.y = -1e4; });

  /* drag: arrasta o campo, solta e ele volta em mola */
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; dsx = e.clientX; dsy = e.clientY; dox = offX; doy = offY;
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    offX = clamp(dox + (e.clientX - dsx) * 0.9, -140, 140);
    offY = clamp(doy + (e.clientY - dsy) * 0.9, -100, 100);
  });
  const endDrag = () => { dragging = false; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /* pausa quando o hero sai da viewport ou a aba fica oculta */
  new IntersectionObserver((en) => { inView = en[0].isIntersecting; }, { threshold: 0 })
    .observe(hero);

  window.addEventListener('resize', resize);
  resize();

  /* primeiro frame síncrono: canvas já nasce pintado */
  frame(0);
  if (REDUCED) return;     /* reduced-motion: fica no frame estático */

  (function loop(now) {
    if (inView && !document.hidden) frame(now || 0);
    requestAnimationFrame(loop);
  })(0);
}


/* ---------------------------------------------------------------------
   4. CONTADORES ANIMADOS + live-tick nos que têm [data-live]
   --------------------------------------------------------------------- */
function initCounters() {
  const nodes = $$('[data-count]');
  if (!nodes.length) return;

  const format = (n, target) => {
    /* preserva formato "42.300" ou "89%" */
    const raw = target.dataset.count;
    const suffix = target.dataset.suffix || '';
    if (raw.includes('.')) {
      return Math.floor(n).toLocaleString('pt-BR') + suffix;
    }
    return Math.floor(n) + suffix;
  };

  /* Depois da animação inicial, contadores com [data-live] seguem
     tickando +1 a cada ~8s enquanto a página está ativa */
  const LIVE_INTERVAL_MS = 8000;
  const startLiveTick = (el) => {
    let current = parseFloat(el.dataset.count.replace(/\./g, ''));
    if (!Number.isFinite(current)) return;
    setInterval(() => {
      if (document.hidden) return;   // pausa se a aba está em background
      current += 1;
      el.dataset.count = String(current);
      el.textContent = format(current, el);
      el.classList.remove('just-ticked');
      /* força reflow pra re-disparar animação */
      void el.offsetWidth;
      el.classList.add('just-ticked');
    }, LIVE_INTERVAL_MS);
  };

  const animate = (el) => {
    const target = parseFloat(el.dataset.count.replace(/\./g, ''));
    if (!Number.isFinite(target)) return;
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const v = target * easeOut(t);
      el.textContent = format(v, el);
      if (t < 1) requestAnimationFrame(tick);
      else if (el.hasAttribute('data-live')) startLiveTick(el);
    }
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  nodes.forEach(el => io.observe(el));
}


/* ---------------------------------------------------------------------
   5. TILT 3D nos cards (pkg, log, tutor, step)
   --------------------------------------------------------------------- */
function initTilt() {
  if (REDUCED) return;
  /* skip pkg-cards que estão dentro do CardStack — o stack tem transform próprio */
  const targets = $$('.pkg-card, .log-card, .tutor-card, .step-card')
    .filter(el => !el.closest('.cs-card'));

  targets.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((y - cy) / cy) * -6;   // rotate X
      const ry = ((x - cx) / cx) * 8;    // rotate Y
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}


/* ---------------------------------------------------------------------
   6. PARALLAX SUAVE nos section-heads
   --------------------------------------------------------------------- */
function initParallax() {
  if (REDUCED) return;
  const heads = $$('.section-head');
  const onScroll = () => {
    const vh = window.innerHeight;
    heads.forEach(h => {
      const rect = h.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const t = (rect.top - vh) / vh; // -1 (fora, embaixo) → 0 (topo)
      h.style.transform = `translateY(${clamp(t * -20, -20, 20)}px)`;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}


/* ---------------------------------------------------------------------
   7. TIMELINE — linha se preenche no scroll + marcadores acendem
   --------------------------------------------------------------------- */
function initTimeline() {
  const line = $('.timeline');
  if (!line) return;
  const items = $$('.tl-item', line);
  const onScroll = () => {
    const rect = line.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = vh * 0.75;
    const end = vh * 0.25;
    const total = rect.height;
    let filled = clamp(start - rect.top, 0, total);
    if (rect.top < end) filled = clamp(end - rect.top + (vh - end), 0, total);
    const pct = clamp((filled / total) * 100, 0, 100);
    line.style.setProperty('--fill', pct + '%');

    /* acende marcadores conforme a linha passa */
    items.forEach(it => {
      const ir = it.getBoundingClientRect();
      if (ir.top < vh * 0.6) it.classList.add('is-lit');
      else it.classList.remove('is-lit');
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}


/* ---------------------------------------------------------------------
   8. COUNTDOWN da próxima turma
   --------------------------------------------------------------------- */
function initCountdown() {
  const box = $('#countdown');
  if (!box) return;

  /* alvo: próxima segunda-feira mais 14 dias, 20:00 local */
  const target = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (8 - d.getDay()) % 7 + 14);
    d.setHours(20, 0, 0, 0);
    return d;
  })();

  const dEl = $('[data-cd="d"]', box);
  const hEl = $('[data-cd="h"]', box);
  const mEl = $('[data-cd="m"]', box);
  const sEl = $('[data-cd="s"]', box);

  const pad = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');

  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = '00';
      return;
    }
    const d = diff / 86400000;
    const h = (diff / 3600000) % 24;
    const m = (diff / 60000) % 60;
    const s = (diff / 1000) % 60;
    dEl.textContent = pad(d);
    hEl.textContent = pad(h);
    mEl.textContent = pad(m);
    sEl.textContent = pad(s);
  }
  tick();
  setInterval(tick, 1000);
}


/* ---------------------------------------------------------------------
   9. CARDSTACK — leque 3D de formações, hover controla card ativo
   --------------------------------------------------------------------- */
function initCardStack() {
  const root = $('#formacoesStack');
  if (!root) return;
  const stage = $('.cardstack-stage', root);
  const cards = $$('.cs-card', root);
  const dots = $$('.cs-dot', root);
  const len = cards.length;
  if (len === 0) return;

  /* config (mesmos defaults do componente React) */
  const CFG = {
    maxVisible: 7,
    overlap: 0.5,
    spreadDeg: 42,
    depthPx: 130,
    tiltXDeg: 10,
    activeLiftPx: 22,
    activeScale: 1.03,
    inactiveScale: 0.92,
    autoMs: 3500,           // 0 = desliga auto-advance
  };

  const cardWidth = () => {
    const el = cards[0];
    return el ? el.getBoundingClientRect().width : 460;
  };

  let active = 0;
  let hovering = false;
  let autoTimer = null;
  let lastHoverT = 0;

  /* menor deslocamento com wrap (loop) */
  const signedOffset = (i, act) => {
    const raw = i - act;
    const alt = raw > 0 ? raw - len : raw + len;
    return Math.abs(alt) < Math.abs(raw) ? alt : raw;
  };

  const setActive = (idx) => {
    active = ((idx % len) + len) % len;
    layout();
    dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
    cards.forEach((c, i) => {
      c.classList.toggle('is-active', i === active);
      c.setAttribute('aria-selected', i === active ? 'true' : 'false');
    });
  };

  const layout = () => {
    const w = cardWidth();
    const maxOff = Math.max(0, Math.floor(CFG.maxVisible / 2));
    const spacing = Math.max(10, Math.round(w * (1 - CFG.overlap)));
    const stepDeg = maxOff > 0 ? CFG.spreadDeg / maxOff : 0;

    cards.forEach((card, i) => {
      const off = signedOffset(i, active);
      const abs = Math.abs(off);

      if (abs > maxOff) {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        return;
      }

      const isActive = off === 0;
      const rotateZ = off * stepDeg;
      const rotateX = isActive ? 0 : CFG.tiltXDeg;
      const x = off * spacing;
      const y = abs * 8 + (isActive ? -CFG.activeLiftPx : 0);
      const z = -abs * CFG.depthPx;
      const scale = isActive ? CFG.activeScale : CFG.inactiveScale;

      card.style.transform =
        `translate3d(${x}px, ${y}px, 0) ` +
        `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) ` +
        `translateZ(${z}px) scale(${scale})`;
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
      card.style.zIndex = String(100 - abs);
    });
  };

  /* hover: mouseX na stage escolhe qual card fica ativo */
  const onMove = (e) => {
    hovering = true;
    lastHoverT = performance.now();
    const rect = stage.getBoundingClientRect();
    const xFrac = clamp((e.clientX - rect.left) / rect.width, 0, 0.9999);
    const idx = Math.floor(xFrac * len);
    if (idx !== active) setActive(idx);
  };
  const onLeave = () => { hovering = false; };

  stage.addEventListener('mousemove', onMove);
  stage.addEventListener('mouseleave', onLeave);

  /* click em card ou dot */
  cards.forEach((c, i) => c.addEventListener('click', () => setActive(i)));
  dots.forEach((d, i) => d.addEventListener('click', () => setActive(i)));

  /* teclado (setas quando stage tem foco) */
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(active - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive(active + 1); }
  });

  /* auto-advance quando ninguém está interagindo */
  if (CFG.autoMs > 0 && !REDUCED) {
    autoTimer = setInterval(() => {
      const idleFor = performance.now() - lastHoverT;
      if (!hovering && idleFor > CFG.autoMs) setActive(active + 1);
    }, CFG.autoMs);
  }

  /* re-layout quando janela redimensiona */
  window.addEventListener('resize', () => requestAnimationFrame(layout));

  setActive(0);
}


/* ---------------------------------------------------------------------
   9.5. PROJETOS DOS ALUNOS — carrossel scroll-snap
   --------------------------------------------------------------------- */
function initProjCarousel(){
  const root  = $('#projCarousel');
  if (!root) return;
  const track = $('#projTrack', root);
  const prev  = $('#projPrev',  root);
  const next  = $('#projNext',  root);
  const cards = $$('.proj-card', root);
  if (!cards.length) return;

  const step = () => cards[0].getBoundingClientRect().width + 22; /* card + gap */

  const scrollByCard = (dir) => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    let target = track.scrollLeft + dir * step();
    /* loop: passou do fim volta pro começo e vice-versa */
    if (target > maxScroll + 10) target = 0;
    if (target < -10) target = maxScroll;
    track.scrollTo({ left: target, behavior: 'smooth' });
  };

  prev.addEventListener('click', () => { scrollByCard(-1); resetAuto(); });
  next.addEventListener('click', () => { scrollByCard( 1); resetAuto(); });

  /* setas do teclado quando o track tem foco */
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollByCard(-1); resetAuto(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCard( 1); resetAuto(); }
  });

  /* auto-advance, pausa com mouse em cima ou aba escondida */
  let hovering = false;
  let autoTimer = null;
  const startAuto = () => {
    if (REDUCED) return;
    autoTimer = setInterval(() => {
      if (!hovering && !document.hidden) scrollByCard(1);
    }, 4000);
  };
  const resetAuto = () => {
    if (autoTimer) clearInterval(autoTimer);
    startAuto();
  };
  root.addEventListener('mouseenter', () => { hovering = true; });
  root.addEventListener('mouseleave', () => { hovering = false; });
  startAuto();

  /* Drag-to-scroll: arrasta o carrossel com o cursor do mouse */
  let dragging = false, dragStartX = 0, dragStartScroll = 0;
  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartScroll = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    track.scrollLeft = dragStartScroll - (e.clientX - dragStartX);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');   /* snap volta e acomoda o card */
    resetAuto();
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  /* Centraliza o card da DevClub (flagship) ao carregar */
  const centerFlagship = () => {
    const flag = $('.proj-flagship', track);
    if (!flag) return;
    track.scrollLeft = flag.offsetLeft - (track.clientWidth - flag.clientWidth) / 2;
  };
  centerFlagship();
  setTimeout(centerFlagship, 300);   /* reforço após layout estabilizar */
}


/* ---------------------------------------------------------------------
   10. TUTORES — Circular Animated Testimonials (vanilla port)
       Adaptado de https://codepen.io/Northstrix/pen/QwWoYzZ
   --------------------------------------------------------------------- */
function initTutoresCarousel() {
  const root = $('#tutoresCarousel');
  if (!root) return;

  const imgWrap = $('#tutoresImages', root);
  const nameEl = $('#tutoresName', root);
  const roleEl = $('#tutoresRole', root);
  const quoteEl = $('#tutoresQuote', root);
  const textWrap = $('.testimonials-text', root);
  const prevBtn = $('#tutoresPrev', root);
  const nextBtn = $('#tutoresNext', root);

  /* TODO: trocar por fotos reais dos tutores; quotes são placeholders. */
  const tutores = [
    {
      name: 'Renata Silva', role: 'Tutora de Frontend · na DevClub desde 2015',
      quote: 'Frontend não é só o que se vê — é o que se sente ao usar. Ensino código, mas antes disso ensino empatia com quem vai clicar.',
      src: 'https://i.pinimg.com/1200x/fc/ee/dd/fceeddec120d9dffb8719fbc436ec50f.jpg'
    },
    {
      name: 'Felipe Andrade', role: 'Tutor de Backend · na DevClub desde 2012',
      quote: 'Backend bom é aquele que ninguém percebe funcionando. Meu papel é te ensinar a construir a base invisível que segura tudo em cima.',
      src: 'https://i.pravatar.cc/720?u=devclub'
    },
    {
      name: 'Juliana Prado', role: 'Tutora de Carreira · na DevClub desde 2018',
      quote: 'Sua próxima vaga não depende do seu diploma, depende do seu último projeto. Ajudo você a montar um portfólio que fala por você.',
      src: 'https://i.pinimg.com/736x/5c/ac/4a/5cac4af1edcc833eba2f6d049824285c.jpg'
    },
    {
      name: 'Diego Nunes', role: 'Tutor Fullstack · na DevClub desde 2009',
      quote: 'Do rascunho ao deploy — se não roda em produção, ainda não terminou. Ensino o caminho inteiro, sem pular etapa.',
      src: 'https://img.magnific.com/fotos-gratis/retrato-de-jovem-latino-confiante-sorrindo-e-olhando-em-pe-ao-ar-livre-na-rua-conceito-urbano_58466-15004.jpg?semt=ais_hybrid&w=740&q=80'
    },
    {
      name: 'Ana Beatriz Lima', role: 'Tutora de IA aplicada · na DevClub desde 2021',
      quote: 'IA não substitui programador. Programador que sabe usar IA substitui quem não sabe. Vim ensinar você a estar do lado certo.',
      src: 'https://i.pinimg.com/736x/19/7c/db/197cdb73bdd8bcc9a7bcc8b2b5f89433.jpg'
    },
  ];

  const len = tutores.length;
  let active = 0;
  let autoTimer = null;

  /* Cria as N <img> uma vez, reaproveita depois */
  tutores.forEach((t, i) => {
    const img = document.createElement('img');
    img.src = t.src;
    img.alt = t.name;
    img.loading = 'lazy';
    img.dataset.idx = String(i);
    imgWrap.appendChild(img);
  });
  const imgs = $$('img', imgWrap);

  const layoutImages = () => {
    imgs.forEach((img, i) => {
      const offset = ((i - active) + len) % len;
      const z = len - Math.abs(offset);
      let x, y, rotY, scale;

      if (offset === 0) {
        x = '0%'; y = '0%'; rotY = 0; scale = 1;
      } else if (offset === 1 || offset === -(len - 1)) {
        x = '18%'; y = '-6%'; rotY = -14; scale = 0.86;
      } else {
        x = '-18%'; y = '-6%'; rotY = 14; scale = 0.86;
      }
      img.style.zIndex = String(z);
      img.style.transform =
        `translate3d(${x}, ${y}, 0) ` +
        `rotateY(${rotY}deg) scale(${scale})`;
    });
  };

  const wordWrap = (text) =>
    text.split(' ').map(w => `<span class="word">${w}</span>`).join(' ');

  const applyStagger = () => {
    const words = $$('.word', quoteEl);
    words.forEach((w, i) => { w.style.transitionDelay = (i * 20) + 'ms'; });
    /* trigger reflow, then animate in */
    void quoteEl.offsetWidth;
    quoteEl.classList.add('is-animating');
  };

  const swapText = (t) => {
    textWrap.classList.add('is-swapping');
    setTimeout(() => {
      nameEl.textContent = t.name;
      roleEl.textContent = t.role;
      quoteEl.classList.remove('is-animating');
      quoteEl.innerHTML = wordWrap(t.quote);
      textWrap.classList.remove('is-swapping');
      applyStagger();
    }, 300);
  };

  const update = (dir) => {
    active = ((active + dir) % len + len) % len;
    layoutImages();
    swapText(tutores[active]);
  };

  prevBtn.addEventListener('click', () => { update(-1); resetAuto(); });
  nextBtn.addEventListener('click', () => { update(1); resetAuto(); });

  /* click numa imagem lateral: traz ela pro centro */
  imgWrap.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    const idx = Number(img.dataset.idx);
    const dir = idx > active ? 1 : -1;
    const steps = Math.abs(idx - active);
    for (let s = 0; s < steps; s++) update(dir);
    resetAuto();
  });

  /* Autoplay 5s, pausa no hover */
  const startAuto = () => {
    if (REDUCED) return;
    autoTimer = setInterval(() => update(1), 5000);
  };
  const resetAuto = () => {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    startAuto();
  };
  root.addEventListener('mouseenter', () => {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  });
  root.addEventListener('mouseleave', startAuto);

  /* Setup inicial */
  nameEl.textContent = tutores[0].name;
  roleEl.textContent = tutores[0].role;
  quoteEl.innerHTML = wordWrap(tutores[0].quote);
  layoutImages();
  applyStagger();
  startAuto();
}


/* ---------------------------------------------------------------------
   11. FUNDO ANIMADO (iframe) — esconde controles + parallax fast-scroll
   --------------------------------------------------------------------- */
function initBgFundo() {
  const iframe = $('#bgFundo');
  if (!iframe) return;

  /* 9.1 Esconde o painel de controle interno do fundo.html
         (idempotente: pode chamar várias vezes) */
  const HIDER_ID = 'devclub-bg-hider';
  const hideControls = () => {
    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.head) return false;
      if (doc.getElementById(HIDER_ID)) return true;
      const style = doc.createElement('style');
      style.id = HIDER_ID;
      style.textContent = `
        /* painel de controle Speed/STILL/PNG e badge de canvas */
        [class*="bottom-5"], [class*="bottom-4"], [class*="bottom-3"] {
          display: none !important;
        }
        body, #root, #root > div { background: transparent !important; }
      `;
      doc.head.appendChild(style);
      return true;
    } catch (_) { return false; }
  };

  /* React renderiza depois do load — tenta várias vezes */
  const tryInject = () => {
    hideControls();
    if (iframe.contentDocument && iframe.contentDocument.body) {
      const mo = new MutationObserver(() => hideControls());
      mo.observe(iframe.contentDocument.body, { childList: true, subtree: true });
    }
  };
  iframe.addEventListener('load', () => {
    tryInject();
    setTimeout(tryInject, 300);
    setTimeout(tryInject, 1200);
  });
  if (iframe.contentDocument?.readyState === 'complete') {
    tryInject();
    setTimeout(tryInject, 300);
  }

  /* 9.2 Parallax: fundo se move mais rápido que a página no scroll.
         Iframe fixo tem 260vh de altura em top:-80vh → cobertura garantida
         enquanto y ≤ ~1.6 vp; passa disso, clamp segura o movimento. */
  const FACTOR = 0.5;
  let ticking = false;
  const update = () => {
    const maxY = window.innerHeight * 1.6;
    const y = Math.min(window.scrollY, maxY);
    iframe.style.transform = `translate3d(0, ${(-y * FACTOR).toFixed(1)}px, 0)`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}


/* ---------------------------------------------------------------------
   12. INIT
   --------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initPressStart();       // sempre primeiro — mostra/pula intro antes do resto rodar
  initReveal();
  initHeroCubes();
  initHeroFade();
  initCounters();
  initTilt();
  initParallax();
  initTimeline();
  initCountdown();
  initCardStack();
  initProjCarousel();
  initTutoresCarousel();
  initBgFundo();
});
