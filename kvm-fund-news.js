(() => {
  const section = document.querySelector('#fund-news');
  if (!section) return;
  const slides = Array.from(section.querySelectorAll('[data-fund-slide]'));
  const counter = section.querySelector('[data-fund-count]');
  let active = 0;
  const show = index => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== active; });
    counter.textContent = `${active + 1} / ${slides.length}`;
  };
  section.querySelector('[data-fund-prev]').addEventListener('click', () => show(active - 1));
  section.querySelector('[data-fund-next]').addEventListener('click', () => show(active + 1));
})();
