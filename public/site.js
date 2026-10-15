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

  initReveal();
  initFaq();
})();
