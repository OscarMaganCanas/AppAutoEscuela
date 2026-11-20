/* =========================================================
   app.js — Bootstrap, router y UI helpers
   ========================================================= */

/* ── UI helpers globales ── */
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function showToast(message, type = 'info', duration = 3200) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s';
    setTimeout(() => el.remove(), 260);
  }, duration);
}

function showModal({ title, body, actions = [] }) {
  closeModal();
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <h3>${title}</h3>
      <div class="modal-body">${body}</div>
      <div class="modal-actions"></div>
    </div>
  `;

  const actionsEl = overlay.querySelector('.modal-actions');
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = `btn ${a.cls || 'btn-secondary'}`;
    btn.textContent = a.label;
    btn.addEventListener('click', a.onClick);
    actionsEl.appendChild(btn);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', handleEsc);
  root.appendChild(overlay);
}

function closeModal() {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  document.removeEventListener('keydown', handleEsc);
}

function handleEsc(e) {
  if (e.key === 'Escape') closeModal();
}

/* ── App router ── */
const App = {
  _dataLoaded: false,

  async render() {
    const root = document.getElementById('app');

    if (!Auth.isAuthenticated()) {
      LoginView.render(root);
      return;
    }

    // Carga datos la primera vez tras el login
    if (!this._dataLoaded) {
      root.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;
                    height:100vh;font-family:Inter,sans-serif;color:#64748b;
                    flex-direction:column;gap:12px;">
          <div style="width:32px;height:32px;border:3px solid #e2e8f0;
                      border-top-color:#3b82f6;border-radius:50%;
                      animation:spin 0.7s linear infinite;"></div>
          Cargando datos…
        </div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      `;
      try {
        await Store.load();
        this._dataLoaded = true;
      } catch (err) {
        console.error('Error cargando datos:', err);
        root.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;
                      height:100vh;font-family:Inter,sans-serif;flex-direction:column;gap:12px;">
            <p style="color:#ef4444;">Error al conectar con la base de datos.</p>
            <button onclick="App.render()" class="btn btn-primary">Reintentar</button>
          </div>
        `;
        return;
      }
    }

    const user = Auth.getUser();
    if (!user) {
      await Auth.logout();
      LoginView.render(root);
      return;
    }

    if (user._type === 'student') {
      StudentDashboardView.render(root);
    } else {
      TeacherDashboardView.render(root);
    }
  },

  async start() {
    document.getElementById('app').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;
                  height:100vh;font-family:Inter,sans-serif;color:#64748b;">
        Iniciando…
      </div>
    `;
    try {
      await Auth.init();
      await this.render();
    } catch (err) {
      console.error('Error en App.start():', err);
      document.getElementById('app').innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;
                    height:100vh;font-family:Inter,sans-serif;flex-direction:column;gap:12px;padding:24px;text-align:center;">
          <p style="color:#ef4444;font-weight:600;">Error al iniciar la aplicación</p>
          <p style="color:#64748b;font-size:13px;max-width:480px;">${err.message || err}</p>
          <p style="color:#94a3b8;font-size:12px;">Abre las DevTools (F12 → Console) para más detalles.</p>
          <button onclick="App.start()" style="margin-top:8px;padding:8px 20px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Reintentar</button>
        </div>
      `;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.start());
