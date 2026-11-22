(function () {
  'use strict';

  function configure(image, original, sizes, lazy = true) {
    const url = new URL(original, document.baseURI);
    const key = url.origin === location.origin ? url.pathname.slice(1) : url.href;
    const options = (window.HF_CATALOG_PHOTO_MAP?.[key] || []).filter(([width]) => lazy || width >= 480);
    if (image.getAttribute('src') === original) return;
    image.removeAttribute('src');
    image.removeAttribute('srcset');
    image.loading = lazy ? 'lazy' : 'eager';
    image.decoding = 'async';
    if (options?.length) {
      image.sizes = sizes;
      image.addEventListener('error', fallbackToOriginal);
      image.srcset = options.map(([width, id]) => `/images/previews/${width}/${id}.webp ${width}w`).join(', ');
    }
    image.src = original;
  }

  function fallbackToOriginal(event) {
    const image = event.target;
    if (!image.srcset || image.currentSrc === image.src) return;
    event.stopImmediatePropagation();
    image.removeAttribute('srcset');
  }

  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-catalog-preview')) {
      fallbackToOriginal(event);
    }
  }, true);

  let viewer;
  let fullPhoto;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-catalog-full]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
    event.preventDefault();
    if (!viewer) {
      viewer = document.createElement('dialog');
      viewer.className = 'catalog-full-photo';
      viewer.setAttribute('aria-label', 'Увеличенная фотография товара');
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = '×';
      close.setAttribute('aria-label', 'Закрыть фотографию');
      fullPhoto = document.createElement('img');
      viewer.append(close, fullPhoto);
      document.body.appendChild(viewer);
      close.addEventListener('click', () => viewer.close());
      viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
      viewer.addEventListener('close', () => fullPhoto.removeAttribute('src'));
    }
    fullPhoto.alt = link.querySelector('img')?.alt || '';
    fullPhoto.src = link.href;
    viewer.showModal();
  });

  window.HFCatalogPhotos = {configure};
})();
