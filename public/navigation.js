(function () {
  const nav = document.querySelector('[data-site-nav]');
  if (!nav) return;

  const toggle = nav.querySelector('[data-nav-toggle]');
  const roots = Array.from(nav.querySelectorAll('[data-nav-root]'));
  const items = roots.map((root) => root.closest('.page-nav__item')).filter(Boolean);
  const tapQuery = window.matchMedia('(max-width: 980px), (hover: none), (pointer: coarse)');

  function closeSubmenus(except) {
    items.forEach((item) => {
      if (item === except) return;
      item.classList.remove('is-open');
      const button = item.querySelector('[data-nav-root]');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    closeSubmenus();
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      document.body.classList.toggle('nav-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) closeSubmenus();
    });
  }

  roots.forEach((root) => {
    root.addEventListener('click', () => {
      if (!tapQuery.matches) return;
      const item = root.closest('.page-nav__item');
      const isOpen = item.classList.toggle('is-open');
      root.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) closeSubmenus(item);
    });
  });

  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('.page-nav__submenu a') || event.target.closest('.page-nav__store')) {
      closeMenu();
    }
  });

  tapQuery.addEventListener('change', () => {
    closeMenu();
  });

  const typingWord = document.querySelector('[data-typing-brand] [data-typing-word]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const words = ['Ultimate', 'Basketball', 'Soccer', 'Padel', 'Football', 'Tennis', 'Hockey'];

  if (typingWord && !reducedMotion.matches) {
    const typeDelay = 95;
    const deleteDelay = 55;
    const holdDelay = 1400;

    const wait = (delay) => new Promise((resolve) => {
      window.setTimeout(resolve, delay);
    });

    const setWord = async (word) => {
      while (typingWord.textContent.length < word.length) {
        typingWord.textContent = word.slice(0, typingWord.textContent.length + 1);
        await wait(typeDelay);
      }
    };

    const deleteWord = async () => {
      while (typingWord.textContent.length > 0) {
        typingWord.textContent = typingWord.textContent.slice(0, -1);
        await wait(deleteDelay);
      }
    };

    (async () => {
      let index = 0;

      while (true) {
        await wait(holdDelay);
        await deleteWord();
        index = (index + 1) % words.length;
        await setWord(words[index]);
      }
    })();
  }
})();
