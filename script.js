const ranks = [
  { key: '2', value: 2 },
  { key: '3', value: 3 },
  { key: '4', value: 4 },
  { key: '5', value: 5 },
  { key: '6', value: 6 },
  { key: '7', value: 7 },
  { key: '8', value: 8 },
  { key: '9', value: 9 },
  { key: '10', value: 10 },
  { key: 'J', value: 11 },
  { key: 'Q', value: 12 },
  { key: 'K', value: 13 },
  { key: 'A', value: 14 },
];

const suits = [
  { key: '♠', color: '#1f1f27', name: 'spades' },
  { key: '♥', color: '#d12c4b', name: 'hearts' },
  { key: '♦', color: '#d12c4b', name: 'diamonds' },
  { key: '♣', color: '#1f1f27', name: 'clubs' },
];

function buildDeck() {
  const deck = [];
  for (const r of ranks) {
    for (const s of suits) {
      deck.push({ rank: r.key, value: r.value, suit: s.key, color: s.color, suitName: s.name });
    }
  }
  return deck;
}

function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

function select(el) { return document.querySelector(el); }

const state = {
  deck: [],
  player1Score: 0,
  player2Score: 0,
  isAnimating: false,
};

const el = {
  p1Card: null,
  p2Card: null,
  p1Score: null,
  p2Score: null,
  drawBtn: null,
  resetBtn: null,
  resultText: null,
  confettiCanvas: null,
  ctx: null,
};

function initRefs() {
  el.p1Card = select('#cardP1');
  el.p2Card = select('#cardP2');
  el.p1Score = select('#player1Score .score');
  el.p2Score = select('#player2Score .score');
  el.drawBtn = select('#drawBtn');
  el.resetBtn = select('#resetBtn');
  el.resultText = select('#resultText');
  el.confettiCanvas = select('#confettiCanvas');
  el.ctx = el.confettiCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  el.confettiCanvas.width = Math.floor(window.innerWidth * dpr);
  el.confettiCanvas.height = Math.floor(window.innerHeight * dpr);
  el.confettiCanvas.style.width = `${window.innerWidth}px`;
  el.confettiCanvas.style.height = `${window.innerHeight}px`;
  el.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initGame() {
  state.deck = shuffle(buildDeck());
  state.player1Score = 0;
  state.player2Score = 0;
  updateScores();
  setResult('Press Draw to begin');
  resetCard(el.p1Card);
  resetCard(el.p2Card);
}

function resetCard(cardEl) {
  cardEl.classList.remove('flipped', 'win', 'lose', 'tie');
}

function updateScores() {
  el.p1Score.textContent = String(state.player1Score);
  el.p2Score.textContent = String(state.player2Score);
}

function setResult(text) {
  el.resultText.textContent = text;
}

function updateCardFace(cardEl, card) {
  const rankEls = cardEl.querySelectorAll('.rank, .big-rank');
  const suitEls = cardEl.querySelectorAll('.suit, .big-suit');
  rankEls.forEach(n => { n.textContent = card.rank; n.style.color = card.color; });
  suitEls.forEach(n => { n.textContent = card.suit; n.style.color = card.color; });
}

function drawRound() {
  if (state.isAnimating) return;
  state.isAnimating = true;
  el.drawBtn.disabled = true;

  if (state.deck.length < 2) {
    state.deck = shuffle(buildDeck());
  }

  const p1 = state.deck.pop();
  const p2 = state.deck.pop();

  // Prepare cards
  [el.p1Card, el.p2Card].forEach(c => c.classList.remove('win', 'lose', 'tie'));
  updateCardFace(el.p1Card, p1);
  updateCardFace(el.p2Card, p2);

  // Flip animation with slight delay between players
  setTimeout(() => el.p1Card.classList.add('flipped'), 50);
  setTimeout(() => el.p2Card.classList.add('flipped'), 200);

  // Decide winner after flip completes
  const FLIP_MS = 750;
  setTimeout(() => {
    const result = compareCards(p1, p2);
    if (result === 0) {
      el.p1Card.classList.add('tie');
      el.p2Card.classList.add('tie');
      setResult('Tie! Same rank');
    } else if (result > 0) {
      state.player1Score += 1;
      el.p1Card.classList.add('win');
      el.p2Card.classList.add('lose');
      setResult(`Player 1 wins! ${p1.rank}${p1.suit} beats ${p2.rank}${p2.suit}`);
      burstConfetti('left');
    } else {
      state.player2Score += 1;
      el.p2Card.classList.add('win');
      el.p1Card.classList.add('lose');
      setResult(`Player 2 wins! ${p2.rank}${p2.suit} beats ${p1.rank}${p1.suit}`);
      burstConfetti('right');
    }
    updateScores();
    state.isAnimating = false;
    el.drawBtn.disabled = false;
  }, FLIP_MS + 220);
}

function compareCards(a, b) {
  if (a.value === b.value) return 0;
  return a.value > b.value ? 1 : -1;
}

function resetGame() {
  initGame();
}

function setupInteractions() {
  el.drawBtn.addEventListener('click', drawRound);
  el.resetBtn.addEventListener('click', resetGame);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') resetGame();
    if (e.key === ' ' || e.key.toLowerCase() === 'd') {
      e.preventDefault();
      drawRound();
    }
  });
}

// Confetti implementation
let confettiAnim = null;
function burstConfetti(side = 'center') {
  const particleCount = 180;
  const colors = ['#7c5cff', '#ff5c9a', '#27e1a7', '#ffd166', '#7df9ff'];
  const particles = [];

  const { innerWidth: w, innerHeight: h } = window;
  const xStart = side === 'left' ? w * 0.25 : side === 'right' ? w * 0.75 : w * 0.5;
  const yStart = h * 0.25;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * Math.PI) - Math.PI / 2; // spread left/right
    const speed = 6 + Math.random() * 6;
    particles.push({
      x: xStart + (Math.random() * 40 - 20),
      y: yStart + (Math.random() * 20 - 10),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 2),
      g: 0.18 + Math.random() * 0.12,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      r: Math.random() * Math.PI,
      rv: (Math.random() * 0.2 - 0.1),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
    });
  }

  const durationMs = 1600;
  const start = performance.now();
  cancelAnimationFrame(confettiAnim);

  function frame(now) {
    const dt = Math.min(32, now - (frame.last || now));
    frame.last = now;
    const elapsed = now - start;

    el.ctx.clearRect(0, 0, el.confettiCanvas.width, el.confettiCanvas.height);

    for (const p of particles) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.rv;
      // fade out towards the end
      if (elapsed > durationMs * 0.6) {
        const t = (elapsed - durationMs * 0.6) / (durationMs * 0.4);
        p.alpha = Math.max(0, 1 - t);
      }

      el.ctx.save();
      el.ctx.globalAlpha = p.alpha;
      el.ctx.translate(p.x, p.y);
      el.ctx.rotate(p.r);
      el.ctx.fillStyle = p.color;
      el.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      el.ctx.restore();
    }

    if (elapsed < durationMs) {
      confettiAnim = requestAnimationFrame(frame);
    } else {
      el.ctx.clearRect(0, 0, el.confettiCanvas.width, el.confettiCanvas.height);
    }
  }

  confettiAnim = requestAnimationFrame(frame);
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  initRefs();
  setupInteractions();
  initGame();
});