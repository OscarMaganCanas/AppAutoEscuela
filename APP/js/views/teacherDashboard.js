/* =========================================================
   views/teacherDashboard.js — Dashboard del profesor
   ========================================================= */
const TeacherDashboardView = {
  state: { weekStart: null },

  init() {
    if (!this.state.weekStart) {
      this.state.weekStart = startOfWeek(new Date());
    }
  },

  render(root) {
    this.init();
    const teacher = Auth.getUser();
    const myStudents = Store.getStudentsByTeacher(teacher.id);
    const upcoming = Booking.upcomingForTeacher(teacher.id);
    const todayISO = toISODate(new Date());
    const todayClasses = upcoming.filter(b => b.dateISO === todayISO);

    root.innerHTML = `
      ${this.renderTopbar(teacher)}
      <main class="container">
        ${this.renderHero(teacher, myStudents, upcoming, todayClasses)}

        <div class="grid grid-main" style="margin-top:20px;">
          <div>
            ${this.renderStudents(myStudents)}
            ${this.renderSchedule(teacher, upcoming)}
          </div>
          <div>
            ${this.renderToday(todayClasses)}
            ${this.renderTips()}
          </div>
        </div>
      </main>
      <footer class="footer">Autoescuela Rosales · Plataforma de reservas</footer>
    `;

    this.bind(root, teacher);
  },

  renderTopbar(teacher) {
    return `
      <header class="topbar">
        <div class="brand">
          <img class="brand-logo-img" src="assets/logo.gif" alt="Autoescuela Rosales" />
          <div class="brand-text">
            <div class="name">Reservas de clases prácticas</div>
            <div class="sub">Panel del profesor</div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="user-chip">
            <div class="avatar">${teacher.initials}</div>
            <div class="info">
              <strong>${teacher.name}</strong>
              <span>Profesor/a</span>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="logoutBtn">Salir</button>
        </div>
      </header>
    `;
  },

  renderHero(teacher, students, upcoming, todayClasses) {
    const byRole = students.reduce((acc, s) => { acc[s.role] = (acc[s.role] || 0) + 1; return acc; }, {});

    return `
      <section class="welcome-card">
        <div class="badge" style="background:rgba(255,255,255,0.2);color:white;">Profesor</div>
        <h2>Buenos días, ${teacher.name.split(' ')[0]}</h2>
        <div class="greeting">${todayClasses.length === 0 ? 'No tienes clases programadas para hoy.' : `Tienes ${todayClasses.length} clase${todayClasses.length === 1 ? '' : 's'} hoy.`}</div>
        <div class="welcome-stats">
          <div class="welcome-stat">
            <div class="label">Alumnos asignados</div>
            <div class="value">${students.length}</div>
          </div>
          <div class="welcome-stat">
            <div class="label">Clases próximas</div>
            <div class="value">${upcoming.length}</div>
          </div>
          <div class="welcome-stat">
            <div class="label">En examen</div>
            <div class="value">${byRole.PRIORIDAD || 0}</div>
          </div>
          <div class="welcome-stat">
            <div class="label">Nuevos</div>
            <div class="value">${byRole.NUEVO || 0}</div>
          </div>
        </div>
      </section>
    `;
  },

  renderStudents(students) {
    if (students.length === 0) {
      return `<div class="card"><div class="empty-state">No tienes alumnos asignados.</div></div>`;
    }

    const rows = students.map(s => {
      const initials = s.name.split(' ').map(n => n[0]).slice(0, 2).join('');
      const rules = RoleRules[s.role];
      return `
        <div class="student-row">
          <div class="avatar">${initials}</div>
          <div>
            <div class="name">${s.name}</div>
            <div class="meta">${s.email}</div>
          </div>
          <span class="classes-count">${s.classesTaken} clases</span>
          <span class="badge ${s.role}">${rules.label}</span>
          <button class="btn btn-secondary btn-sm" data-change-role="${s.id}">Cambiar rol</button>
        </div>
      `;
    }).join('');

    return `
      <div class="card">
        <div class="card-head">
          <div>
            <h3>Mis alumnos</h3>
            <div class="desc">Gestiona el rol de cada alumno: <strong>Libre</strong>, <strong>Principiante</strong> o <strong>Prioridad</strong>.</div>
          </div>
        </div>
        ${rows}
      </div>
    `;
  },

  renderSchedule(teacher, upcoming) {
    if (upcoming.length === 0) {
      return `
        <div class="card" style="margin-top:20px;">
          <div class="card-head"><div><h3>Agenda próxima</h3></div></div>
          <div class="empty-state">No hay clases programadas.</div>
        </div>
      `;
    }

    const items = upcoming.slice(0, 10).map(b => {
      const date = parseISODate(b.dateISO);
      const student = Store.getStudent(b.studentId);
      const rules = RoleRules[student.role];
      return `
        <div class="booking-item">
          <div class="info">
            <div class="date">${capitalize(formatDateES(date))} · ${formatTime(b.hour)}</div>
            <div class="time">${student.name}</div>
            <div class="teacher"><span class="badge ${student.role}" style="font-size:10px;">${rules.label}</span></div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card" style="margin-top:20px;">
        <div class="card-head">
          <div>
            <h3>Agenda próxima</h3>
            <div class="desc">${upcoming.length} clase${upcoming.length === 1 ? '' : 's'} programada${upcoming.length === 1 ? '' : 's'}.</div>
          </div>
        </div>
        ${items}
      </div>
    `;
  },

  renderToday(todayClasses) {
    if (todayClasses.length === 0) {
      return `
        <div class="card">
          <div class="card-head"><div><h3>Hoy</h3></div></div>
          <div class="empty-state">No tienes clases hoy. ¡Día libre!</div>
        </div>
      `;
    }
    const items = todayClasses.map(b => {
      const student = Store.getStudent(b.studentId);
      return `
        <div class="booking-item">
          <div class="info">
            <div class="date">${formatTime(b.hour)} – ${formatTime(b.hour + 1)}</div>
            <div class="time">${student.name}</div>
          </div>
        </div>
      `;
    }).join('');
    return `
      <div class="card">
        <div class="card-head"><div><h3>Hoy</h3><div class="desc">${todayClasses.length} clase${todayClasses.length === 1 ? '' : 's'}.</div></div></div>
        ${items}
      </div>
    `;
  },

  renderTips() {
    return `
      <div class="card" style="margin-top:20px;">
        <div class="card-head"><div><h3>Cómo funcionan los roles</h3></div></div>
        <ul class="rules-list">
          <li><span class="icon">N</span><span><strong>Nuevo</strong>: recién matriculado. 2 clases/semana, hasta 4 días de antelación.</span></li>
          <li><span class="icon">P</span><span><strong>Principiante</strong>: 2 clases/semana, hasta 1 semana de antelación.</span></li>
          <li><span class="icon">!</span><span><strong>Prioridad</strong>: cerca del examen. 5 clases/semana, hasta 2 semanas de antelación.</span></li>
        </ul>
      </div>
    `;
  },

  bind(root, teacher) {
    root.querySelector('#logoutBtn').addEventListener('click', async () => {
      await Auth.logout();
      App.render();
    });

    root.querySelectorAll('[data-change-role]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openRoleModal(btn.dataset.changeRole, root);
      });
    });
  },

  openRoleModal(studentId, root) {
    const student = Store.getStudent(studentId);
    if (!student) return;

    const options = Object.keys(RoleRules).map(r => `
      <label style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;${student.role === r ? 'background:var(--primary-light);border-color:var(--primary);' : ''}">
        <input type="radio" name="role" value="${r}" ${student.role === r ? 'checked' : ''} style="margin-top:2px;" />
        <div>
          <div style="font-weight:600;"><span class="badge ${r}">${RoleRules[r].label}</span></div>
          <div style="font-size:12px;color:var(--text-soft);margin-top:4px;">${RoleRules[r].description}</div>
        </div>
      </label>
    `).join('');

    showModal({
      title: `Cambiar rol de ${student.name}`,
      body: `
        <p>Actualiza el nivel del alumno. Esto modifica sus permisos para reservar.</p>
        <div id="roleOptions">${options}</div>
      `,
      actions: [
        { label: 'Cancelar', cls: 'btn-secondary', onClick: closeModal },
        {
          label: 'Guardar cambios',
          cls: 'btn-primary',
          onClick: async () => {
            const selected = document.querySelector('input[name="role"]:checked');
            if (!selected) return;
            const newRole = selected.value;
            if (newRole !== student.role) {
              await Store.updateStudentRole(student.id, newRole);
              showToast(`Rol actualizado a ${RoleRules[newRole].label}.`, 'success');
            }
            closeModal();
            this.render(root);
          }
        }
      ],
    });
  },
};
