document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      if (target.querySelector('#map')) {
        const iframe = target.querySelector('#map');
        if (!iframe.src.includes('loaded')) {
          iframe.src += '&loaded=true';
        }
      }
    }
  });
});

  // Fade-in animations
  const fadeIns = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
  fadeIns.forEach(el => observer.observe(el));

  // Form submission with validation
  const form = document.querySelector('form');
  form.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const phoneRegex = /^\+?\d{10,15}$/;
  if (!name) {
  alert('Пожалуйста, введите ваше имя.');
  return;
}
  if (!phone || !phoneRegex.test(phone)) {
  alert('Пожалуйста, введите корректный номер телефона.');
  return;
}
  alert('Заявка отправлена! Ожидайте звонка.');
  form.reset();
});

  // Testimonials carousel with infinite smooth scrolling
  const wrapper = document.querySelector('.testimonials-wrapper');
  const leftArrow = document.querySelector('.left-arrow');
  const rightArrow = document.querySelector('.right-arrow');
  const itemWidth = document.querySelector('.testimonial-item').offsetWidth;
  let currentPosition = 0;
  const itemCount = wrapper.children.length;

  function updateCarousel() {
  wrapper.style.transform = `translateX(${currentPosition}px)`;
}

  leftArrow.addEventListener('click', () => {
  currentPosition += itemWidth;
  if (currentPosition > 0) {
  currentPosition = -itemWidth * (itemCount - 2);
}
  updateCarousel();
});

  rightArrow.addEventListener('click', () => {
  currentPosition -= itemWidth;
  if (currentPosition < -itemWidth * (itemCount - 2)) {
  currentPosition = 0;
}
  updateCarousel();
});

  // Auto-scroll every 6 seconds
  let autoScroll = setInterval(() => {
  currentPosition -= itemWidth;
  if (currentPosition < -itemWidth * (itemCount - 2)) {
  currentPosition = 0;
}
  updateCarousel();
}, 6000);

  // Pause auto-scroll on hover
  const carousel = document.querySelector('.testimonials-carousel');
  carousel.addEventListener('mouseenter', () => clearInterval(autoScroll));
  carousel.addEventListener('mouseleave', () => {
  autoScroll = setInterval(() => {
    currentPosition -= itemWidth;
    if (currentPosition < -itemWidth * (itemCount - 2)) {
      currentPosition = 0;
    }
    updateCarousel();
  }, 6000);
});
