// particles-bg.js
(function(){
  // Crea el canvas de fondo
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-bg-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = 0;
  canvas.style.pointerEvents = 'none';
  canvas.style.background = '#12232e';
  document.body.insertBefore(canvas, document.body.firstChild);

  // Ajusta tamaño al redimensionar
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Configuración de partículas
  const NUM = 60;
  const particles = [];
  for(let i=0; i<NUM; i++) {
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: 1.2 + Math.random()*2.5,
      dx: (Math.random()-0.5)*0.5,
      dy: (Math.random()-0.5)*0.5,
      o: 0.2 + Math.random()*0.4
    });
  }

  function draw() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const p of particles) {
      ctx.globalAlpha = p.o;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 2*Math.PI);
      ctx.fillStyle = '#00eaff';
      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1.0;
  }

  function animate() {
    for(const p of particles) {
      p.x += p.dx;
      p.y += p.dy;
      if(p.x<0||p.x>canvas.width) p.dx*=-1;
      if(p.y<0||p.y>canvas.height) p.dy*=-1;
    }
    draw();
    requestAnimationFrame(animate);
  }
  animate();
})();
