/* Nextel Connect — client interactions
   Handles: lucide icons, sticky navbar, mobile menu, scroll-reveal, count-up,
   marquee duplication, and the register form validation. */

(function () {
  const ready = (fn) =>
    document.readyState !== 'loading'
      ? fn()
      : document.addEventListener('DOMContentLoaded', fn);

  ready(function () {
    // 1. Render lucide icons
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    // 2. Sticky navbar background on scroll
    const nav = document.querySelector('[data-navbar]');
    if (nav) {
      const onScroll = () => {
        if (window.scrollY > 8) {
          nav.classList.add('bg-white/75', 'backdrop-blur-xl', 'shadow-soft', 'border-b', 'border-black/[0.04]');
          nav.classList.remove('bg-transparent', 'border-transparent');
        } else {
          nav.classList.remove('bg-white/75', 'backdrop-blur-xl', 'shadow-soft', 'border-b', 'border-black/[0.04]');
          nav.classList.add('bg-transparent', 'border-transparent');
        }
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // 3. Mobile menu toggle
    const menuBtn = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (menuBtn && menu) {
      menuBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
      menu.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => menu.classList.add('hidden'))
      );
    }

    // 4. Scroll-reveal (Intersection Observer)
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              const delay = e.target.getAttribute('data-delay') || '0';
              e.target.style.transitionDelay = `${delay}ms`;
              e.target.classList.add('is-shown');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-shown'));
    }

    // 5. CountUp for stats
    const counters = document.querySelectorAll('[data-countup]');
    if ('IntersectionObserver' in window && counters.length) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            cio.unobserve(el);
            const to = parseFloat(el.getAttribute('data-countup')) || 0;
            const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
            const prefix = el.getAttribute('data-prefix') || '';
            const suffix = el.getAttribute('data-suffix') || '';
            const duration = parseInt(el.getAttribute('data-duration') || '1800', 10);
            const start = performance.now();
            const tick = (now) => {
              const p = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              const val = to * eased;
              el.textContent = `${prefix}${val.toFixed(decimals)}${suffix}`;
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => cio.observe(el));
    }

    // 6. Marquee — duplicate track so the animation loops seamlessly
    document.querySelectorAll('[data-marquee-track]').forEach((track) => {
      track.innerHTML = track.innerHTML + track.innerHTML;
    });

    // 7. Footer year
    const y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();

    // 8. Register form validation
    const form = document.querySelector('[data-register-form]');
    if (form) initRegisterForm(form);
  });

  function initRegisterForm(form) {
    const successEl = document.querySelector('[data-register-success]');
    const cardEl = document.querySelector('[data-register-card]');
    const pkgHidden = form.querySelector('input[name="pkg"]');
    const pkgButtons = form.querySelectorAll('[data-pkg]');

    pkgButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        pkgButtons.forEach((b) => b.classList.remove(
          'border-[var(--primary)]', 'bg-gradient-emerald-soft', 'shadow-elegant', '-translate-y-0.5'
        ));
        pkgButtons.forEach((b) => b.classList.add('border-black/10', 'bg-white', 'hover:border-[var(--gold)]'));
        pkgButtons.forEach((b) => b.querySelector('[data-pkg-dot]').classList.remove('bg-[var(--primary)]', 'border-[var(--primary)]'));
        pkgButtons.forEach((b) => b.querySelector('[data-pkg-dot]').classList.add('border-black/15', 'bg-white'));
        pkgButtons.forEach((b) => { const c = b.querySelector('[data-pkg-check]'); if (c) c.classList.add('hidden'); });

        btn.classList.add('border-[var(--primary)]', 'bg-gradient-emerald-soft', 'shadow-elegant', '-translate-y-0.5');
        btn.classList.remove('border-black/10', 'bg-white', 'hover:border-[var(--gold)]');
        const dot = btn.querySelector('[data-pkg-dot]');
        dot.classList.add('bg-[var(--primary)]', 'border-[var(--primary)]');
        dot.classList.remove('border-black/15', 'bg-white');
        const check = btn.querySelector('[data-pkg-check]');
        if (check) check.classList.remove('hidden');

        pkgHidden.value = btn.getAttribute('data-pkg');
        clearError(form, 'pkg');
      });
    });

    form.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => clearError(form, inp.name));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        fullName: form.fullName.value.trim(),
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        pkg: pkgHidden.value,
      };

      const errors = {};
      if (data.fullName.length < 2 || data.fullName.length > 80) errors.fullName = 'Enter your full name';
      if (data.username.length < 3 || data.username.length > 30) errors.username = 'At least 3 characters';
      else if (!/^[a-zA-Z0-9_.]+$/.test(data.username)) errors.username = 'Letters, numbers, _ and . only';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 255) errors.email = 'Invalid email';
      if (data.phone.length < 7 || data.phone.length > 20) errors.phone = 'Enter a valid phone';
      if (data.pkg !== 'small' && data.pkg !== 'big') errors.pkg = 'Select a package';

      if (Object.keys(errors).length) {
        Object.entries(errors).forEach(([k, v]) => showError(form, k, v));
        return;
      }

      // Success — swap the card content
      if (cardEl && successEl) {
        const firstName = data.fullName.split(' ')[0];
        successEl.querySelector('[data-firstname]').textContent = firstName;
        successEl.querySelector('[data-email]').textContent = data.email;
        cardEl.classList.add('hidden');
        successEl.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  function showError(form, name, message) {
    const errEl = form.querySelector(`[data-error="${name}"]`);
    if (errEl) { errEl.textContent = message; errEl.classList.remove('hidden'); }
    const wrap = form.querySelector(`[data-field="${name}"]`);
    if (wrap) {
      wrap.classList.remove('border-black/10', 'focus-within:border-[var(--primary)]');
      wrap.classList.add('border-destructive/60');
    }
  }
  function clearError(form, name) {
    if (!name) return;
    const errEl = form.querySelector(`[data-error="${name}"]`);
    if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
    const wrap = form.querySelector(`[data-field="${name}"]`);
    if (wrap) {
      wrap.classList.add('border-black/10', 'focus-within:border-[var(--primary)]');
      wrap.classList.remove('border-destructive/60');
    }
  }
})();
