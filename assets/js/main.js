(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* header */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', scrollY > 10); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobile menu */
  var mb = document.querySelector('.menu-btn'), links = document.getElementById('links');
  mb.addEventListener('click', function () {
    var o = links.classList.toggle('open');
    mb.setAttribute('aria-expanded', o);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('open')) { links.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.focus(); }
  });

  /* hero slideshow with progress bars */
  var slides = document.querySelectorAll('.slide');
  if (slides.length) {
    var bars = document.querySelector('.bars'), cap = document.querySelector('.slide-cap'), cur = 0, timer;
    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Show ' + s.dataset.title);
      b.innerHTML = '<i></i>';
      b.addEventListener('click', function () { show(i); });
      bars.appendChild(b);
    });
    var btns = bars.querySelectorAll('button');
    function show(i) {
      slides[cur].classList.remove('active');
      cur = i;
      slides[cur].classList.add('active');
      btns.forEach(function (b, k) {
        b.classList.remove('on', 'done'); void b.offsetWidth;
        if (k < cur) b.classList.add('done');
      });
      btns[cur].classList.add(reduce ? 'done' : 'on');
      cap.querySelector('small').textContent = slides[cur].dataset.kind;
      cap.querySelector('b').textContent = slides[cur].dataset.title;
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(function () { show((cur + 1) % slides.length); }, 6000);
    }
    show(0);
  }

  /* marquee loop */
  document.querySelectorAll('.marquee ul').forEach(function (u) {
    Array.prototype.slice.call(u.children).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); u.appendChild(c); });
  });

  /* reveal + count up */
  function countUp(el) {
    var end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = null, dur = 1600;
    if (reduce) { el.innerHTML = end + '<em>' + suf + '</em>'; return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.innerHTML = v + '<em>' + suf + '</em>';
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var targets = document.querySelectorAll('.rv, [data-count], .steps');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.dataset.count) countUp(e.target); else e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: .15 });
    targets.forEach(function (t) { io.observe(t); });
  } else targets.forEach(function (t) { t.classList.add('in'); if (t.dataset.count) countUp(t); });

  /* generic filter */
  document.querySelectorAll('.filters').forEach(function (f) {
    var scope = document.querySelector(f.dataset.target);
    var note = document.querySelector(f.dataset.note);
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      f.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      var cat = b.dataset.f, n = 0;
      scope.querySelectorAll('[data-cat]').forEach(function (el) {
        var ok = cat === 'all' || el.dataset.cat.split(' ').indexOf(cat) > -1;
        el.classList.toggle('hide', !ok); if (ok) n++;
      });
      if (note) note.textContent = n + (n === 1 ? ' item' : ' items') + ' shown';
    });
  });

  /* modal helpers */
  var lastFocus;
  function openModal(m) { lastFocus = document.activeElement; m.classList.add('open'); m.removeAttribute('inert'); document.body.style.overflow = 'hidden'; setTimeout(function () { m.querySelector('.x').focus(); }, 40); }
  function closeModal(m) { m.classList.remove('open'); m.setAttribute('inert', ''); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  document.querySelectorAll('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('.x')) closeModal(m); });
  });

  /* product modal */
  var pm = document.getElementById('product-modal');
  if (pm) {
    document.querySelectorAll('.item').forEach(function (it) {
      it.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.click(); } });
      it.addEventListener('click', function () {
        var ph = it.querySelector('.ph').cloneNode(true);
        var cat = ph.querySelector('.cat'); if (cat) cat.remove();
        pm.querySelector('.ph').replaceWith(ph);
        pm.querySelector('small').textContent = it.querySelector('.cat').textContent;
        pm.querySelector('h3').textContent = it.querySelector('h3').textContent;
        pm.querySelector('.desc').textContent = it.dataset.long || it.querySelector('p').textContent;
        pm.querySelector('.fin').innerHTML = it.querySelector('.fin').innerHTML;
        pm.querySelector('.use').textContent = it.dataset.use || '';
        pm.querySelector('.btn').href = 'contact.html';
        openModal(pm);
      });
    });
  }

  /* lightbox */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile')), idx = 0;
    function visible() { return tiles.filter(function (t) { return !t.classList.contains('hide'); }); }
    function render() {
      var v = visible(), t = v[idx];
      lb.querySelector('img').src = t.querySelector('img').src;
      lb.querySelector('img').alt = t.querySelector('b').textContent;
      lb.querySelector('.lb-cap small').textContent = t.querySelector('small').textContent;
      lb.querySelector('.lb-cap span').textContent = t.querySelector('b').textContent;
    }
    tiles.forEach(function (t) {
      t.addEventListener('click', function () { idx = visible().indexOf(t); render(); openModal(lb); });
    });
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); var v = visible(); idx = (idx - 1 + v.length) % v.length; render(); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); var v = visible(); idx = (idx + 1) % v.length; render(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'ArrowLeft') lb.querySelector('.lb-prev').click();
      if (e.key === 'ArrowRight') lb.querySelector('.lb-next').click();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal.open').forEach(closeModal);
  });


  /* location tabs */
  var LOCS = {
    factory: { kind: 'FACTORY', title: 'Samail Industrial City', addr: 'Samail Industrial City, Samail, Al Dakhiliyah, Oman', q: 'Natural Stone Co LLC Samail Industrial City Oman', z: 14 },
    muscat: { kind: 'HEAD OFFICE', title: 'Muscat, Oman', addr: 'P.O. Box 1832, PC 112, Muscat. Tel +000 0000 0000', q: 'Natural Stone Co LLC Muscat Oman', z: 12 },
    uae: { kind: 'UAE', title: 'Dubai, UAE', addr: 'Offices in Dubai, Sharjah and Abu Dhabi. Tel +000 0000 0000', q: 'Natural Stone Trading LLC Dubai', z: 11 }
  };
  var mapBtns = document.querySelectorAll('[data-loc]');
  mapBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var l = LOCS[btn.dataset.loc], card = document.querySelector('.map-card');
      mapBtns.forEach(function (x) { x.setAttribute('aria-selected', x === btn); });
      card.classList.add('swap');
      setTimeout(function () {
        document.getElementById('map-kind').textContent = l.kind;
        document.getElementById('map-title').textContent = l.title;
        document.getElementById('map-addr').textContent = l.addr;
        document.getElementById('map-dir').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(l.q);
        card.classList.remove('swap');
      }, 200);
      var fr = document.getElementById('map-frame');
      fr.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(l.q) + '&z=' + l.z + '&output=embed';
      fr.title = 'Natural Stone ' + l.title + ' on Google Maps';
    });
  });

  /* quote form: static demo (validates, shows a note, sends nothing) */
  var form = document.getElementById('quote');
  if (form) {
    var name = form.querySelector('#q-name');
    name.addEventListener('input', function () { name.setCustomValidity(''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!name.value.trim()) { name.setCustomValidity('Enter your name so our team knows who to contact.'); name.reportValidity(); return; }
      // Portfolio demo: nothing is sent.
      var note = form.querySelector('.form-status');
      if (!note) { note = document.createElement('p'); note.className = 'form-status'; note.setAttribute('role', 'status'); form.appendChild(note); }
      note.textContent = 'Thanks! This is a portfolio demo, so no message was sent.';
      form.reset();
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
