(function () {
  const slides = [...document.querySelectorAll('.carousel-slide')];
  const thumbs = [...document.querySelectorAll('.carousel-thumb')];
  const titleEl = document.getElementById('carouselTitle');
  const specEl = document.getElementById('carouselSpec');
  const counterEl = document.getElementById('carouselCounter');
  if (!slides.length) return;
  let index = 0;
  let timer;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle('is-active', j === index));
    thumbs.forEach((t, j) => t.classList.toggle('is-active', j === index));
    const active = slides[index];
    if (titleEl) titleEl.textContent = active.dataset.title || '';
    if (specEl) specEl.textContent = active.dataset.spec || '';
    if (counterEl) counterEl.textContent = pad(index + 1) + ' / ' + pad(slides.length);
  }

  function next() {
    goTo(index + 1);
  }
  function prev() {
    goTo(index - 1);
  }
  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  const nextBtn = document.getElementById('carouselNext');
  const prevBtn = document.getElementById('carouselPrev');
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetTimer(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetTimer(); });
  thumbs.forEach((t) =>
    t.addEventListener('click', () => {
      goTo(Number(t.dataset.index));
      resetTimer();
    })
  );

  const strip = document.getElementById('hardwareScroll');
  if (strip) {
    const step = 296;
    const sp = document.getElementById('stripPrev');
    const sn = document.getElementById('stripNext');
    if (sp) sp.addEventListener('click', () => strip.scrollBy({ left: -step, behavior: 'smooth' }));
    if (sn) sn.addEventListener('click', () => strip.scrollBy({ left: step, behavior: 'smooth' }));
  }

  resetTimer();
})();
