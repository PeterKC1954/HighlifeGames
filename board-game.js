(function () {
  const canvas = document.getElementById("board-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, cx = 0, cy = 0, radius = 0;
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  const SQUARES = 20;
  const SQUARE_TYPES = ["company", "asset", "bonus", "event", "start", "company", "asset", "company", "bonus", "asset", "company", "event", "asset", "company", "bonus", "asset", "company", "event", "asset", "company"];
  const TYPE_COLORS = {
    company: "#abd40a",
    asset: "#33a1fd",
    bonus: "#fcab10",
    event: "#d02f7c",
    start: "#fff",
  };
  const TYPE_LABELS = {
    company: "🏢",
    asset: "📦",
    bonus: "🎁",
    event: "⚡",
    start: "🏁",
  };

  let tokenPos = 0;
  let tokenTarget = 0;
  let tokenAnimating = false;
  let diceValue = 0;
  let diceRolling = false;
  let particles = [];
  let hoveredSquare = -1;
  let mouseX = -1, mouseY = -1;
  let time = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H / 2;
    radius = Math.min(W, H) * 0.36;
  }

  function getSquarePos(i) {
    const angle = (i / SQUARES) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      angle,
    };
  }

  function getSquareSize() {
    return Math.max(18, radius * 0.13);
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.5 + Math.random() * 2.5;
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        color,
        size: 1 + Math.random() * 3,
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBoard() {
    const size = getSquareSize();

    // Outer glow ring
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.3);
    grad.addColorStop(0, "rgba(171,212,10,0)");
    grad.addColorStop(0.7, "rgba(171,212,10,0.04)");
    grad.addColorStop(1, "rgba(171,212,10,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Connection lines between squares
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= SQUARES; i++) {
      const pos = getSquarePos(i % SQUARES);
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
    ctx.restore();

    // Inner circle
    ctx.save();
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.65);
    innerGrad.addColorStop(0, "rgba(30,51,68,0.4)");
    innerGrad.addColorStop(1, "rgba(15,25,35,0)");
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pulsing inner ring
    ctx.save();
    const pulse = 0.5 + Math.sin(time * 0.002) * 0.2;
    ctx.strokeStyle = `rgba(171,212,10,${pulse * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55 + Math.sin(time * 0.003) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw squares
    for (let i = 0; i < SQUARES; i++) {
      const pos = getSquarePos(i);
      const type = SQUARE_TYPES[i];
      const color = TYPE_COLORS[type] || "#8ba3b8";
      const isHovered = i === hoveredSquare;
      const isToken = Math.round(tokenPos) === i;

      const s = isHovered ? size * 1.25 : size;

      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Glow
      if (isHovered || isToken) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 8;
        ctx.shadowColor = color + "40";
      }

      // Square background
      ctx.fillStyle = isHovered ? color + "30" : "rgba(15,25,35,0.85)";
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      roundRect(ctx, -s, -s, s * 2, s * 2, 6);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.shadowBlur = 0;
      ctx.font = `${s * 0.9}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(TYPE_LABELS[type] || "■", 0, 0);

      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawToken() {
    const i = tokenPos % SQUARES;
    const pos = getSquarePos(Math.floor(i));
    const nextPos = getSquarePos((Math.floor(i) + 1) % SQUARES);
    const frac = i - Math.floor(i);
    const x = pos.x + (nextPos.x - pos.x) * frac;
    const y = pos.y + (nextPos.y - pos.y) * frac;

    const size = getSquareSize() * 0.55;
    const bob = Math.sin(time * 0.005) * 2;

    ctx.save();
    ctx.translate(x, y + bob);

    // Glow
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#abd40a";

    // Token body
    const tokenGrad = ctx.createRadialGradient(0, -size * 0.3, 0, 0, 0, size);
    tokenGrad.addColorStop(0, "#d4f04a");
    tokenGrad.addColorStop(1, "#abd40a");
    ctx.fillStyle = tokenGrad;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Token border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner highlight
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(-size * 0.25, -size * 0.25, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Trail particles
    if (tokenAnimating && Math.random() < 0.3) {
      spawnParticles(x, y, "#abd40a", 2);
    }
  }

  function drawDice() {
    const size = Math.min(W, H) * 0.06;
    const dx = cx;
    const dy = cy;
    const rotAngle = diceRolling ? time * 0.015 : 0;

    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rotAngle);

    // Dice shadow
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(0,0,0,0.5)";

    // Dice body
    const diceGrad = ctx.createLinearGradient(-size, -size, size, size);
    diceGrad.addColorStop(0, "#1e3344");
    diceGrad.addColorStop(1, "#16242f");
    ctx.fillStyle = diceGrad;
    ctx.strokeStyle = diceValue > 0 ? "#abd40a" : "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    roundRect(ctx, -size, -size, size * 2, size * 2, size * 0.2);
    ctx.fill();
    ctx.stroke();

    // Dice value
    ctx.shadowBlur = 0;
    if (diceRolling) {
      const flicker = Math.floor(time * 0.02) % 6 + 1;
      ctx.font = `bold ${size * 1.1}px "Bebas Neue", sans-serif`;
      ctx.fillStyle = "#abd40a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(flicker, 0, 0);
    } else if (diceValue > 0) {
      ctx.font = `bold ${size * 1.1}px "Bebas Neue", sans-serif`;
      ctx.fillStyle = "#abd40a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(diceValue, 0, 0);
    } else {
      ctx.font = `${size * 0.5}px sans-serif`;
      ctx.fillStyle = "#8ba3b8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎲", 0, 0);
    }

    ctx.restore();
  }

  function drawCenterText() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (diceValue > 0 && !diceRolling && !tokenAnimating) {
      const pos = getSquarePos(Math.round(tokenPos) % SQUARES);
      const type = SQUARE_TYPES[Math.round(tokenPos) % SQUARES];
      const labels = {
        company: "Company Square!",
        asset: "Asset Item!",
        bonus: "Bonus Drop!",
        event: "Event Square!",
        start: "Start!",
      };
      ctx.font = `bold ${Math.min(W, H) * 0.035}px "Bebas Neue", sans-serif`;
      ctx.fillStyle = TYPE_COLORS[type] || "#fff";
      ctx.fillText(labels[type] || "", cx, cy - radius * 0.25);

      ctx.font = `${Math.min(W, H) * 0.02}px "Sora", sans-serif`;
      ctx.fillStyle = "#8ba3b8";
      const subs = {
        company: "Answer a sponsored question to earn HECUs",
        asset: "Collect an asset for your agency",
        bonus: "Pick up a free reward",
        event: "Something unexpected happens!",
        start: "Back to the beginning",
      };
      ctx.fillText(subs[type] || "", cx, cy - radius * 0.25 + 24);
    }

    ctx.restore();
  }

  function animate() {
    time = performance.now();

    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    bgGrad.addColorStop(0, "rgba(22,36,47,0.6)");
    bgGrad.addColorStop(1, "rgba(15,25,35,0)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Ambient floating particles
    if (Math.random() < 0.05) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.5);
      spawnParticles(cx + Math.cos(a) * r, cy + Math.sin(a) * r, "rgba(171,212,10,0.3)", 1);
    }

    updateParticles();
    drawBoard();
    drawParticles();
    drawToken();
    drawDice();
    drawCenterText();

    // Token animation
    if (tokenAnimating) {
      const diff = tokenTarget - tokenPos;
      if (Math.abs(diff) < 0.02) {
        tokenPos = tokenTarget;
        tokenAnimating = false;
        const landedSquare = Math.round(tokenPos) % SQUARES;
        const pos = getSquarePos(landedSquare);
        const type = SQUARE_TYPES[landedSquare];
        spawnParticles(pos.x, pos.y, TYPE_COLORS[type], 15);
      } else {
        tokenPos += diff * 0.08;
      }
    }

    requestAnimationFrame(animate);
  }

  function rollDice() {
    if (diceRolling || tokenAnimating) return;
    diceRolling = true;
    diceValue = 0;

    setTimeout(() => {
      diceValue = Math.floor(Math.random() * 6) + 1;
      diceRolling = false;
      tokenTarget = tokenPos + diceValue;
      tokenAnimating = true;
      const infoEl = document.getElementById("board-info");
      if (infoEl) {
        infoEl.textContent = `Rolled a ${diceValue}! Moving ${diceValue} spaces…`;
      }
    }, 1200);
  }

  // Mouse interaction
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    hoveredSquare = -1;
    const size = getSquareSize();
    for (let i = 0; i < SQUARES; i++) {
      const pos = getSquarePos(i);
      const dx = mouseX - pos.x;
      const dy = mouseY - pos.y;
      if (dx * dx + dy * dy < size * size * 1.5) {
        hoveredSquare = i;
        canvas.style.cursor = "pointer";
        const infoEl = document.getElementById("board-info");
        if (infoEl && !tokenAnimating && !diceRolling) {
          const type = SQUARE_TYPES[i];
          const labels = {
            company: "Company Square — answer a sponsored question",
            asset: "Asset Item — collect for your agency",
            bonus: "Bonus Drop — free reward",
            event: "Event Square — unexpected twist",
            start: "Start/Finish line",
          };
          infoEl.textContent = labels[type] || "";
        }
        break;
      }
    }
    if (hoveredSquare === -1) {
      canvas.style.cursor = "default";
      const infoEl = document.getElementById("board-info");
      if (infoEl && !tokenAnimating && !diceRolling && diceValue === 0) {
        infoEl.textContent = "Click the dice or press Roll to play";
      }
    }
  });

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const diceSize = Math.min(W, H) * 0.06;
    const dx = mx - cx;
    const dy = my - cy;
    if (dx * dx + dy * dy < diceSize * diceSize * 2.5) {
      rollDice();
    }
  });

  // Roll button
  const rollBtn = document.getElementById("board-roll-btn");
  if (rollBtn) rollBtn.addEventListener("click", rollDice);

  // Init
  window.addEventListener("resize", resize);
  resize();
  animate();
})();
