(() => {
  const albumsView = document.getElementById('albumsView');
  const albumView = document.getElementById('albumView');
  const albumGrid = document.getElementById('albumGrid');
  const albumsEmptyState = document.getElementById('albumsEmptyState');
  const albumCountEl = document.getElementById('albumCount');
  const backBtn = document.getElementById('backBtn');

  const gallery = document.getElementById('gallery');
  const emptyState = document.getElementById('emptyState');
  const rollNumberEl = document.getElementById('rollNumber');
  const frameCountEl = document.getElementById('frameCount');
  const albumTitleEl = document.getElementById('albumTitle');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const lightbox = document.getElementById('lightbox');
  const lightboxStage = document.getElementById('lightboxStage');
  const lightboxFrameNo = document.getElementById('lightboxFrameNo');
  const lightboxFilename = document.getElementById('lightboxFilename');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'ogv'];
  const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];

  let albums = [];          // normalized albums, each with resolved items
  let currentAlbum = null;  // the album currently being viewed
  let currentFilter = 'all';
  let lightboxIndex = -1;

  const videoIconSVG = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.35)" stroke="#ece7db" stroke-width="1"/>
      <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="#ece7db"/>
    </svg>`;

  function extensionOf(path) {
    const clean = path.split('?')[0];
    const parts = clean.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  function typeFromPath(path) {
    const ext = extensionOf(path);
    if (VIDEO_EXT.includes(ext)) return 'video';
    if (IMAGE_EXT.includes(ext)) return 'image';
    return null;
  }

  function baseName(path) {
    return path.split('/').pop();
  }

  function slugify(title, index) {
    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug || ('album-' + (index + 1));
  }

  function normalizeItems(rawItems) {
    let id = 1;
    return (rawItems || []).map(entry => {
      const isObj = typeof entry === 'object' && entry !== null;
      const file = isObj ? entry.file : entry;
      const caption = isObj && entry.caption ? entry.caption : baseName(file);
      const type = typeFromPath(file);
      if (!type) return null;
      return { id: id++, url: file, type, name: baseName(file), caption };
    }).filter(Boolean);
  }

  function loadAlbums() {
    const list = (typeof ALBUMS !== 'undefined') ? ALBUMS : [];
    albums = list.map((a, i) => {
      const items = normalizeItems(a.items);
      const cover = a.cover || (items[0] ? items[0].url : null);
      const coverType = cover ? typeFromPath(cover) : null;
      return {
        title: a.title || ('Untitled Album ' + (i + 1)),
        slug: slugify(a.title || ('album-' + (i + 1)), i),
        items,
        cover,
        coverType,
      };
    });
  }

  function frameNumber(index) {
    return String(index + 1).padStart(3, '0');
  }

  /* ---------------- Albums (shelf) view ---------------- */

  function renderAlbumShelf() {
    albumGrid.innerHTML = '';
    albumCountEl.textContent = String(albums.length);
    albumsEmptyState.classList.toggle('visible', albums.length === 0);

    albums.forEach((album, i) => {
      const card = document.createElement('div');
      card.className = 'album-card';
      card.style.animationDelay = (i * 0.04) + 's';

      if (album.cover) {
        const el = album.coverType === 'image'
          ? document.createElement('img')
          : document.createElement('video');
        el.src = album.cover;
        if (album.coverType === 'video') {
          el.muted = true;
          el.playsInline = true;
          el.preload = 'metadata';
        }
        el.alt = album.title;
        card.appendChild(el);
      } else {
        const empty = document.createElement('div');
        empty.className = 'album-card-empty';
        empty.textContent = 'NO FRAMES YET';
        card.appendChild(empty);
      }

      const badge = document.createElement('span');
      badge.className = 'album-card-badge';
      badge.textContent = 'Roll ' + String(i + 1).padStart(2, '0');
      card.appendChild(badge);

      const info = document.createElement('div');
      info.className = 'album-card-info';
      info.innerHTML = `
        <span class="album-card-title">${escapeHtml(album.title)}</span>
        <span class="album-card-count">${album.items.length} exposure${album.items.length === 1 ? '' : 's'}</span>
      `;
      card.appendChild(info);

      card.addEventListener('click', () => openAlbum(album.slug));
      albumGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ---------------- Single album view ---------------- */

  function getFiltered() {
    if (!currentAlbum) return [];
    if (currentFilter === 'all') return currentAlbum.items;
    return currentAlbum.items.filter(m => m.type === currentFilter);
  }

  function renderAlbum() {
    if (!currentAlbum) return;
    albumTitleEl.textContent = currentAlbum.title;
    rollNumberEl.textContent = String(albums.indexOf(currentAlbum) + 1).padStart(2, '0');
    frameCountEl.textContent = currentAlbum.items.length;

    const filtered = getFiltered();
    gallery.innerHTML = '';
    emptyState.classList.toggle('visible', currentAlbum.items.length === 0);

    filtered.forEach((item, i) => {
      const frame = document.createElement('div');
      frame.className = 'frame';
      frame.style.animationDelay = (i * 0.03) + 's';

      const mediaEl = item.type === 'image'
        ? document.createElement('img')
        : document.createElement('video');
      mediaEl.src = item.url;
      mediaEl.loading = 'lazy';
      if (item.type === 'video') {
        mediaEl.muted = true;
        mediaEl.playsInline = true;
        mediaEl.preload = 'metadata';
      }
      mediaEl.alt = item.caption;
      frame.appendChild(mediaEl);

      if (item.type === 'video') {
        const icon = document.createElement('div');
        icon.className = 'frame-video-icon';
        icon.innerHTML = videoIconSVG;
        frame.appendChild(icon);
      }

      const num = document.createElement('span');
      num.className = 'frame-number';
      num.textContent = 'No. ' + frameNumber(i);
      frame.appendChild(num);

      const badge = document.createElement('span');
      badge.className = 'frame-badge';
      badge.textContent = item.type === 'image' ? 'Still' : 'Motion';
      frame.appendChild(badge);

      const caption = document.createElement('span');
      caption.className = 'frame-caption';
      caption.textContent = item.caption;
      frame.appendChild(caption);

      frame.addEventListener('click', () => openLightbox(i));
      gallery.appendChild(frame);
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderAlbum();
    });
  });

  /* ---------------- View switching / routing ---------------- */

  function showAlbumsView() {
    currentAlbum = null;
    albumView.hidden = true;
    albumsView.hidden = false;
    window.scrollTo(0, 0);
  }

  function showAlbumView(album) {
    currentAlbum = album;
    currentFilter = 'all';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    albumsView.hidden = true;
    albumView.hidden = false;
    renderAlbum();
    window.scrollTo(0, 0);
  }

  function openAlbum(slug) {
    window.location.hash = 'album/' + slug;
  }

  function handleRoute() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash.startsWith('album/')) {
      const slug = hash.slice('album/'.length);
      const album = albums.find(a => a.slug === slug);
      if (album) {
        showAlbumView(album);
        return;
      }
    }
    showAlbumsView();
  }

  backBtn.addEventListener('click', () => {
    window.location.hash = '';
  });

  window.addEventListener('hashchange', handleRoute);

  /* ---------------- Lightbox ---------------- */

  function openLightbox(index) {
    lightboxIndex = index;
    renderLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxStage.innerHTML = '';
  }

  function renderLightbox() {
    const filtered = getFiltered();
    if (!filtered.length) { closeLightbox(); return; }
    lightboxIndex = (lightboxIndex + filtered.length) % filtered.length;
    const item = filtered[lightboxIndex];

    lightboxStage.innerHTML = '';
    const el = item.type === 'image'
      ? document.createElement('img')
      : document.createElement('video');
    el.src = item.url;
    if (item.type === 'video') {
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
    }
    el.alt = item.caption;
    lightboxStage.appendChild(el);

    lightboxFrameNo.textContent = 'FRAME ' + frameNumber(lightboxIndex);
    lightboxFilename.textContent = item.caption;
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => { lightboxIndex--; renderLightbox(); });
  lightboxNext.addEventListener('click', () => { lightboxIndex++; renderLightbox(); });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('open')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') { lightboxIndex--; renderLightbox(); }
      if (e.key === 'ArrowRight') { lightboxIndex++; renderLightbox(); }
      return;
    }
    if (e.key === 'Escape' && !albumView.hidden) {
      window.location.hash = '';
    }
  });

  /* ---------------- Init ---------------- */

  loadAlbums();
  renderAlbumShelf();
  handleRoute();
})();
