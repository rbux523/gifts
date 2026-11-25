(() => {
  // The deployed Function URL is public; database credentials stay on Neon.
  const apiUrl = 'https://br-broad-dawn-bcj38efd-purchases.compute.c-16.us-east-1.aws.neon.tech/';
  if (new URLSearchParams(location.search).get('person') !== 'ryan') return;

  const dialog = document.createElement('dialog');
  dialog.className = 'purchase-dialog';
  dialog.innerHTML = `<form method="dialog"><h2>That’s so nice of you! 🎁</h2><p>Wow that's so nice of you. I'm sure Ryan really appreciates it. Reminder that checking this box alerts others not to buy this for Ryan. Are you sure you're getting this?</p><div class="dialog-actions"><button value="cancel" class="dialog-cancel">No I don't like Ryan THAT much</button><button value="confirm" class="dialog-confirm">Yes of course, I love Ryan</button></div></form>`;
  document.body.append(dialog);
  const uncheckDialog = document.createElement('dialog');
  uncheckDialog.className = 'purchase-dialog';
  uncheckDialog.innerHTML = `<form method="dialog"><h2>Changed your mind?</h2><p>That's alright. I'm sure Ryan still appreciates you. Are you sure you want to uncheck this box? Reminder that this affects everyone on the site so please don't uncheck a box that you didn't originally check.</p><div class="dialog-actions"><button value="cancel" class="dialog-cancel">Cancel</button><button value="confirm" class="dialog-confirm">Yes, uncheck it</button></div></form>`;
  document.body.append(uncheckDialog);
  for (const modal of [dialog, uncheckDialog]) {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'dialog-close';
    close.setAttribute('aria-label', 'Close dialog');
    close.textContent = '×';
    close.addEventListener('click', () => modal.close('cancel'));
    modal.querySelector('form').prepend(close);
    modal.addEventListener('click', event => {
      if (event.target !== modal) return;
      const bounds = modal.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close('cancel');
    });
  }

  let controls = [];
  let current = null;
  let busy = false;
  const keyFor = async url => {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`ryan:${url}`));
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  };
  const purchasedLabel = "Someone (maybe you but it's anonymous) is already getting this gift.";
  const storageKey = key => `wish-list-purchase:${key}`;
  const remembered = key => { try { return localStorage.getItem(storageKey(key)) === 'yes'; } catch { return false; } };
  const remember = (key, selected) => {
    try {
      if (selected) localStorage.setItem(storageKey(key), 'yes');
      else localStorage.removeItem(storageKey(key));
    } catch { /* Purchase status still works when browser storage is unavailable. */ }
  };
  const message = (control, text) => {
    control.label.textContent = control.input.checked
      ? (remembered(control.key) ? "You're purchasing this item for Ryan." : purchasedLabel)
      : "I'm purchasing this item for Ryan";
    control.status.textContent = text === purchasedLabel ? '' : text;
  };
  async function refresh() {
    if (busy || current || !controls.length) return;
    try {
      const response = await fetch(apiUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unavailable');
      const { purchased } = await response.json();
      for (const control of controls) {
        control.input.checked = purchased.includes(control.key);
        if (!control.input.checked) remember(control.key, false);
        control.input.disabled = false;
        message(control, control.input.checked ? purchasedLabel : '');
      }
    } catch {
      for (const control of controls) {
        control.input.disabled = true;
        message(control, 'Purchase status is unavailable. Please try again later.');
      }
    }
  }
  async function update(control, checked) {
    busy = true;
    control.input.disabled = true;
    message(control, 'Saving…');
    try {
      const url = new URL(apiUrl);
      url.searchParams.set('item', control.key);
      const response = await fetch(url, { method: checked ? 'PUT' : 'DELETE' });
      if (response.status === 409) {
        control.input.checked = true;
        remember(control.key, false);
        message(control, purchasedLabel);
      } else if (!response.ok) throw new Error('Could not save');
      else {
        control.input.checked = checked;
        remember(control.key, checked);
        message(control, checked ? purchasedLabel : '');
      }
    } catch {
      message(control, 'Could not save. Please try again.');
    } finally {
      busy = false;
      control.input.disabled = false;
    }
  }
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'confirm' && current) update(current, true);
    current = null;
  });
  uncheckDialog.addEventListener('close', () => {
    if (uncheckDialog.returnValue === 'confirm' && current) update(current, false);
    current = null;
  });
  async function setup() {
    const cards = [...document.querySelectorAll('.item')];
    if (!cards.length || controls.length) return;
    const data = await fetch('data.json').then(response => response.json());
    const items = data.people.find(person => person.slug === 'ryan').items;
    controls = await Promise.all(cards.map(async (card, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'purchase-control';
      wrapper.innerHTML = `<label><input type="checkbox" disabled><span>I'm purchasing this item for Ryan</span></label><p class="purchase-status" aria-live="polite">Loading purchase status…</p>`;
      card.querySelector('.button').after(wrapper);
      const control = { input: wrapper.querySelector('input'), label: wrapper.querySelector('label span'), status: wrapper.querySelector('.purchase-status'), key: await keyFor(items[index].url) };
      control.input.addEventListener('change', () => {
        if (control.input.checked) {
          control.input.checked = false;
          current = control;
          dialog.returnValue = 'cancel';
          dialog.showModal();
        } else {
          control.input.checked = true;
          current = control;
          uncheckDialog.returnValue = 'cancel';
          uncheckDialog.showModal();
        }
      });
      return control;
    }));
    await refresh();
  }
  const observer = new MutationObserver(() => { if (document.querySelector('.item')) { observer.disconnect(); setup().catch(console.error); } });
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
  window.addEventListener('focus', refresh);
  setInterval(refresh, 30000);
})();
