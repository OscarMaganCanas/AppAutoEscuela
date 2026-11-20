/* =========================================================
   views/login.js — Login con email y contraseña (Supabase Auth)
   ========================================================= */
const LoginView = {
  render(root) {
    root.innerHTML = `
      <div class="login-bg">
        <div class="login-card">
          <aside class="login-hero">
            <div class="logo-wrap"><img class="logo-img" src="assets/logo.gif" alt="Autoescuela Rosales" /></div>
            <div>
              <h1>Gestión de clases prácticas</h1>
              <p>Reserva, organiza y aprueba a la primera. Plataforma oficial de la autoescuela.</p>
              <div class="pill-row">
                <span class="pill">📅 Reservas en 1 clic</span>
                <span class="pill">🎯 Prioridad para exámenes</span>
                <span class="pill">👤 Profesor asignado</span>
              </div>
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);">
              © ${new Date().getFullYear()} Autoescuela Rosales
            </div>
          </aside>

          <section class="login-form">
            <h2>Acceder a la plataforma</h2>
            <p class="lead">Introduce tus datos para continuar.</p>

            <form id="loginForm" novalidate>
              <div class="field">
                <label for="email">Correo electrónico</label>
                <input
                  type="email"
                  id="email"
                  placeholder="tu@correo.com"
                  required
                  autocomplete="email"
                />
              </div>
              <div class="field">
                <label for="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                />
              </div>

              <div
                id="loginError"
                style="display:none;background:var(--danger-light);color:var(--danger);
                       padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:12px;"
              ></div>

              <button type="submit" class="btn btn-primary btn-block" id="submitBtn">
                Entrar →
              </button>
            </form>
          </section>
        </div>
      </div>
    `;

    root.querySelector('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email   = root.querySelector('#email').value.trim();
      const password = root.querySelector('#password').value;
      const btn     = root.querySelector('#submitBtn');
      const errEl   = root.querySelector('#loginError');

      btn.disabled    = true;
      btn.textContent = 'Entrando…';
      errEl.style.display = 'none';

      try {
        await Auth.login(email, password);
        await App.render();
      } catch (err) {
        errEl.textContent = err.message || 'Correo o contraseña incorrectos.';
        errEl.style.display = 'block';
        btn.disabled    = false;
        btn.textContent = 'Entrar →';
      }
    });
  },
};
