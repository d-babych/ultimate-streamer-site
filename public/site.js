(function () {
  // Scroll reveal: elements with .reveal fade in once they are near the viewport.
  // A page can also list extra CSS selectors in <body data-reveal-selectors="...">;
  // those elements get the .reveal class here, so the content stays visible without JS.
  function initReveal() {
    const extra = document.body.getAttribute('data-reveal-selectors');
    if (extra) document.querySelectorAll(extra).forEach((el) => el.classList.add('reveal'));

    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!els.length) return;

    function check() {
      const vh = window.innerHeight;
      els.forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add('is-visible');
      });
    }

    check();
    window.addEventListener('scroll', check, { passive: true });
  }

  // FAQ accordion: <div class="faq-list" data-accordion="single"> keeps only one answer open.
  // A URL hash like /page.html#faq-q-2 opens that question.
  function initFaq() {
    document.querySelectorAll('.faq-list').forEach((root) => {
      const single = root.getAttribute('data-accordion') === 'single';
      const items = Array.from(root.querySelectorAll('.faq-item'));

      const setItem = (item, open) => {
        const btn = item.querySelector('.faq-q');
        const panel = item.querySelector('.faq-a');
        if (!btn || !panel) return;
        item.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open));
        panel.style.height = open ? panel.scrollHeight + 'px' : '0px';
      };

      items.forEach((item) => {
        setItem(item, false);
        const btn = item.querySelector('.faq-q');
        if (!btn) return;
        btn.addEventListener('click', () => {
          const open = !item.classList.contains('open');
          if (open && single) items.forEach((other) => { if (other !== item) setItem(other, false); });
          setItem(item, open);
        });
      });

      const hash = window.location.hash.slice(1);
      if (hash) {
        const btn = document.getElementById(hash);
        if (btn && btn.classList.contains('faq-q') && root.contains(btn)) btn.click();
      }
    });
  }

  // Home page hero: the brand word is typed out and replaced by the next word from
  // <h1 data-typing-brand data-words="Ultimate|Basketball|..."> (the words are written in the page's language).
  function initTyping() {
    const brand = document.querySelector('[data-typing-brand]');
    const typingWord = brand && brand.querySelector('[data-typing-word]');
    const words = ((brand && brand.getAttribute('data-words')) || '').split('|').filter(Boolean);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!typingWord || words.length < 2 || reducedMotion.matches) return;

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

  initReveal();
  initFaq();
  initTyping();
})();
