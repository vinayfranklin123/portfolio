const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const accent = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#C8102E';

function setupScroll() {
  const progress = document.getElementById('vf-progress');
  const tl = document.getElementById('vf-timeline');
  const fill = document.getElementById('vf-timeline-fill');
  const onScroll = () => {
    const h = document.documentElement;
    if (progress) progress.style.transform = 'scaleX(' + h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) + ')';
    if (tl && fill) {
      const r = tl.getBoundingClientRect();
      const prog = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / r.height));
      fill.style.height = (prog * 100) + '%';
      tl.querySelectorAll('[data-tldot]').forEach((dot) => {
        const lit = dot.getBoundingClientRect().top - r.top < prog * r.height;
        dot.style.background = lit ? 'var(--accent)' : '#FAF4E8';
        dot.style.borderColor = lit ? '#191410' : 'rgba(25,20,16,.25)';
      });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function setupWords() {
  document.querySelectorAll('[data-word]').forEach((w) => {
    w.addEventListener('mouseenter', () => { w.style.transform = 'translateY(-6px) rotate(' + (Math.random() * 6 - 3) + 'deg)'; });
    w.addEventListener('mouseleave', () => { w.style.transform = 'translateY(0) rotate(0)'; });
  });
}

function setupReveal() {
  if (reducedMotion) return;
  const els = Array.from(document.querySelectorAll('[data-reveal]'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = e.target.dataset.origTf || 'translateY(0)';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el, i) => {
    const tf = getComputedStyle(el).transform;
    el.dataset.origTf = tf !== 'none' ? tf : 'translateY(0)';
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity .7s ease ' + (i % 3) * 0.08 + 's, transform .7s cubic-bezier(.22,.61,.36,1) ' + (i % 3) * 0.08 + 's';
    io.observe(el);
  });
}

function setupBall() {
  const ball = document.getElementById('vf-ball');
  const hero = document.getElementById('top');
  if (!ball || !hero || reducedMotion) return;
  let x = ball.offsetLeft, y = 0, vx = 0, vy = 0, rot = 0, vr = 0;
  const size = 56, ground = 12;
  ball.addEventListener('click', (e) => {
    const r = ball.getBoundingClientRect();
    const dx = (r.left + r.width / 2) - e.clientX;
    vx += dx * 0.35 + (Math.random() * 4 - 2);
    vy -= 14 + Math.random() * 8;
    vr += (Math.random() * 30 - 15);
  });
  const tick = () => {
    const W = hero.offsetWidth, H = hero.offsetHeight;
    if (!W || !H) { requestAnimationFrame(tick); return; }
    vy += 0.55; x += vx; y += vy; rot += vr;
    vx *= 0.995; vr *= 0.99;
    const floor = H - ground - size;
    if (y > floor) { y = floor; vy *= -0.55; vx *= 0.92; if (Math.abs(vy) < 1.2) vy = 0; }
    if (x < 0) { x = 0; vx *= -0.7; }
    if (x > W - size) { x = W - size; vx *= -0.7; }
    if (y < -200) { y = -200; vy = Math.abs(vy) * 0.5; }
    ball.style.left = x + 'px';
    ball.style.bottom = 'auto';
    ball.style.top = y + 'px';
    ball.style.transform = 'rotate(' + rot + 'deg)';
    requestAnimationFrame(tick);
  };
  y = hero.offsetHeight - ground - size;
  tick();
}

function setupStickers() {
  const stickers = Array.from(document.querySelectorAll('[data-sticker]'));
  const secrets = Array.from(document.querySelectorAll('[data-secret]'));
  stickers.forEach((s, idx) => {
    let sx, sy, ox, oy, startX, startY, dragging = false, moved = 0;
    s.addEventListener('pointerdown', (e) => {
      dragging = true; s.setPointerCapture(e.pointerId);
      const r = s.getBoundingClientRect();
      const pr = s.parentElement.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      sx = pr.left; sy = pr.top;
      startX = e.clientX; startY = e.clientY;
      s.style.cursor = 'grabbing'; s.style.zIndex = 20;
    });
    s.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      s.style.left = (e.clientX - sx - ox) + 'px';
      s.style.top = (e.clientY - sy - oy) + 'px';
      s.style.right = 'auto';
      moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (moved > 70 && secrets[idx]) secrets[idx].style.opacity = '1';
    });
    s.addEventListener('pointerup', () => {
      dragging = false; s.style.cursor = 'grab';
      if (moved > 70 && s.hasAttribute('data-dare') && !s.dataset.done) {
        s.dataset.done = '1';
        s.textContent = 'ok you passed the vibe check';
        s.style.background = '#FFD84D';
      }
    });
  });
}

function setupScribble() {
  const cv = document.getElementById('vf-scribble');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const w = cv.offsetWidth;
  if (cv.width !== w * 2) { cv.width = w * 2; cv.height = 520; ctx.scale(2, 2); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  let drawing = false, lx = 0, ly = 0;
  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.addEventListener('pointerdown', (e) => { drawing = true; [lx, ly] = pos(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const [nx, ny] = pos(e);
    ctx.strokeStyle = accent(); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(nx, ny); ctx.stroke();
    lx = nx; ly = ny;
  });
  cv.addEventListener('pointerup', () => { drawing = false; });
  const clear = document.getElementById('vf-clear');
  if (clear) clear.addEventListener('click', () => ctx.clearRect(0, 0, cv.width, cv.height));
}

function setupTerminal() {
  const el = document.getElementById('vf-term');
  if (!el) return;
  const lines = [
    ['$ deliver webhook axis_v3 txn=8f3a91c2', '#E8E2D6'],
    ['← 502 Bad Gateway', '#FF8A80'],
    ['↻ retry 1/5 · backoff 2s · idempotency_key ok', '#B5AB9E'],
    ['← 502 Bad Gateway', '#FF8A80'],
    ['↻ retry 2/5 · backoff 4s', '#B5AB9E'],
    ['← 200 OK · delivered in 6.2s ✓', '#7CE38B'],
    ['$ dlq status → 0 pending', '#E8E2D6']
  ];
  if (reducedMotion) {
    lines.forEach((l) => {
      const s = document.createElement('div');
      s.textContent = l[0]; s.style.color = l[1];
      el.appendChild(s);
    });
    return;
  }
  let li = 0, ci = 0;
  const spans = [];
  const type = () => {
    if (li >= lines.length) {
      setTimeout(() => { el.innerHTML = ''; spans.length = 0; li = 0; ci = 0; type(); }, 3500);
      return;
    }
    if (ci === 0) {
      const s = document.createElement('div');
      s.style.color = lines[li][1];
      el.appendChild(s); spans.push(s);
    }
    ci++;
    spans[li].textContent = lines[li][0].slice(0, ci);
    if (ci >= lines[li][0].length) { li++; ci = 0; setTimeout(type, 260); }
    else setTimeout(type, 14 + Math.random() * 20);
  };
  type();
}

setupScroll();
setupWords();
setupReveal();
setupBall();
setupStickers();
setupScribble();
setupTerminal();
