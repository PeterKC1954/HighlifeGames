(function () {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, dpr = Math.max(1, window.devicePixelRatio || 1);

  const BLOB_COUNT = 6;
  const COLORS = ["#abd40a", "#33a1fd", "#d02f7c", "#fcab10", "#abd40a", "#33a1fd"];
  let blobs = [];

  function init() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    blobs = [];
    for (let i = 0; i < BLOB_COUNT; i++) {
      blobs.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 200 + Math.random() * 250,
        color: COLORS[i % COLORS.length],
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  let time = 0;

  function draw() {
    time += 0.005;

    ctx.clearRect(0, 0, W, H);

    for (const b of blobs) {
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < -b.r) b.x = W + b.r;
      if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r;
      if (b.y > H + b.r) b.y = -b.r;

      const wobble = Math.sin(time + b.phase) * 30;
      const r = Math.max(50, b.r + wobble);

      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      const hex = b.color;
      const rR = parseInt(hex.slice(1, 3), 16);
      const gR = parseInt(hex.slice(3, 5), 16);
      const bR = parseInt(hex.slice(5, 7), 16);
      grad.addColorStop(0, `rgba(${rR},${gR},${bR},0.08)`);
      grad.addColorStop(0.5, `rgba(${rR},${gR},${bR},0.03)`);
      grad.addColorStop(1, `rgba(${rR},${gR},${bR},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", init);
  init();
  draw();
})();
