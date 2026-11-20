/* =========================================================
   views/studentDashboard.js — Dashboard del alumno
   ========================================================= */
const StudentDashboardView = {
  state: { weekStart: null },

  init() {
    if (!this.state.weekStart) {
      this.state.weekStart = startOfWeek(new Date());
    }
  },

  render(root) {
    this.init();
    const student = Auth.getUser();
    const teacher = Store.getTeacher(student.teacherId);
    const rules = RoleRules[student.role];
    const upcoming = Booking.upcomingForStudent(student.id);
    const weekCount = Booking.classesInWeek(student.id, this.state.weekStart);

    root.innerHTML = `
      ${this.renderTopbar(student)}
      <main class="container">
        ${this.renderWelcome(student, teacher, rules, weekCount, upcoming.length)}

        <div class="grid grid-main" style="margin-top:20px;">
          <div>
            ${this.renderCalendar(student)}
          </div>
          <div>
            ${this.renderBookingsList(upcoming)}
            ${this.renderRules(rules, student)}
          </div>
        </div>
      </main>
      <footer class="footer">Autoescuela Rosales · Plataforma de reservas</footer>
    `;

    this.bind(root, student);
  },

  renderTopbar(student) {
    const initials = student.name.split(' ').map(n => n[0]).slice(0, 2).join('');
    return `
      <header class="topbar">
        <div class="brand">
          <img class="brand-logo-img" src="assets/logo.gif" alt="Autoescuela Rosales" />
          <div class="brand-text">
            <div class="name">Reservas de clases prácticas</div>
            <div class="sub">Panel del alumno</div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="user-chip">
            <div class="avatar">${initials}</div>
            <div class="info">
              <strong>${student.name}</strong>
              <span>Alumno/a</span>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="logoutBtn">Salir</button>
        </div>
      </header>
    `;
  },

  renderWelcome(student, teacher, rules, weekCount, totalUpcoming) {
    const teacherInitials = teacher ? teacher.initials : '';
    const quotaPct = rules.maxPerWeek ? Math.min(100, (weekCount / rules.maxPerWeek) * 100) : 0;
    const quotaFull = rules.maxPerWeek && weekCount >= rules.maxPerWeek;

    return `
      <section class="welcome-card">
        <div class="badge ${student.role}" style="background:rgba(255,255,255,0.2);color:white;">${rules.label}</div>
        <h2>Hola, ${student.name.split(' ')[0]}</h2>
        <div class="greeting">${this.getGreetingMessage(student, rules)}</div>
        <div class="welcome-stats">
          <div class="welcome-stat">
            <div class="label">Clases reservadas</div>
            <div class="value">${totalUpcoming}</div>
          </div>
          <div class="welcome-stat">
            <div class="label">Esta semana</div>
            <div class="value">${weekCount} / ${rules.maxPerWeek || '—'}</div>
          </div>
          <div class="welcome-stat">
            <div class="label">Clases completadas</div>
            <div class="value">${student.classesTaken}</div>
          </div>
        </div>
      </section>

      <div class="grid grid-2" style="margin-top:20px;">
        <div class="card">
          <div class="card-head">
            <div>
              <h3>Tu profesor asignado</h3>
              <div class="desc">Siempre realizarás tus prácticas con el mismo profesor.</div>
            </div>
          </div>
          <div class="teacher-card">
            <div class="ta">${teacherInitials}</div>
            <div>
              <div class="tname">${teacher ? teacher.name : '—'}</div>
              <div class="tsub">Profesor titular</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head">
            <div>
              <h3>Cupo semanal</h3>
              <div class="desc">Tu rol determina cuántas clases puedes reservar.</div>
            </div>
          </div>
          <div style="font-size:13px;color:var(--text-soft);">${weekCount} de ${rules.maxPerWeek || '—'} clases usadas esta semana</div>
          <div class="quota-bar ${quotaFull ? 'full' : ''}"><div style="width:${quotaPct}%;"></div></div>
        </div>
      </div>
    `;
  },

  getGreetingMessage(student, rules) {
    if (student.role === Roles.NUEVO) return 'Bienvenido/a. Ya puedes reservar tus primeras clases prácticas.';
    if (student.role === Roles.PRIORIDAD) return '¡Tienes prioridad! Estás cerca del examen, reserva con más antelación.';
    return 'Reserva tus próximas clases prácticas respetando tu cupo semanal.';
  },

  renderCalendar(student) {
    const ws = this.state.weekStart;
    const we = addDays(ws, 5); // L-S
    const weekLabel = `${ws.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${we.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 6; i++) {
      days.push(addDays(ws, i));
    }
    const dowNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const headerCells = days.map((d, i) => {
      const isToday = isSameDay(d, today);
      return `<div class="head-cell ${isToday ? 'today' : ''} day-col-${i + 1}">
        <span class="dow">${dowNames[i]}</span>
        <span class="dom">${d.getDate()}</span>
      </div>`;
    }).join('');

    const rows = WorkHours.map(hour => {
      const cells = days.map((d, i) => this.renderSlot(student, d, hour, i)).join('');
      return `<div class="hour-cell">${formatTime(hour)}</div>${cells}`;
    }).join('');

    return `
      <div class="card">
        <div class="cal-toolbar">
          <div>
            <h3 style="margin:0;font-size:16px;">Reservar clase</h3>
            <div class="week-label" style="font-size:13px;color:var(--text-soft);margin-top:4px;">${weekLabel}</div>
          </div>
          <div class="nav">
            <button id="prevWeek" title="Semana anterior">‹</button>
            <button id="todayWeek" title="Hoy" class="btn btn-secondary btn-sm">Hoy</button>
            <button id="nextWeek" title="Semana siguiente">›</button>
          </div>
        </div>
        <div class="calendar">
          <div class="corner"></div>
          ${headerCells}
          ${rows}
        </div>
        <div style="display:flex;gap:18px;margin-top:14px;font-size:12px;color:var(--text-soft);flex-wrap:wrap;">
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--success-light);border:1px solid var(--success);margin-right:6px;vertical-align:middle;"></span> Tu reserva</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#f1f5f9;border:1px solid var(--border);margin-right:6px;vertical-align:middle;"></span> Ocupado</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--primary-light);border:1px solid var(--primary);margin-right:6px;vertical-align:middle;"></span> Disponible</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 3px,#e2e8f0 3px,#e2e8f0 6px);margin-right:6px;vertical-align:middle;"></span> Fuera de plazo</span>
        </div>
      </div>
    `;
  },

  renderSlot(student, date, hour, dayIdx) {
    const dateISO = toISODate(date);
    const slotDate = new Date(date); slotDate.setHours(hour, 0, 0, 0);
    const now = new Date();
    const isPast = slotDate < now;
    const existing = Store.getBookingAt(student.teacherId, dateISO, hour);
    const rules = RoleRules[student.role];

    let cls = 'slot day-col-' + (dayIdx + 1);
    let inner = '';
    let disabled = '';
    let title = '';
    const dataAttrs = `data-date="${dateISO}" data-hour="${hour}"`;

    if (isPast) {
      cls += ' past';
      disabled = 'disabled';
      inner = '—';
    } else if (existing && existing.studentId === student.id) {
      cls += ' mine';
      inner = '✓ Mi clase';
    } else if (existing) {
      cls += ' others';
      disabled = 'disabled';
      inner = 'Ocupado';
    } else if (slotDate > endOfNextWeek(now)) {
      cls += ' unavailable';
      disabled = 'disabled';
      title = 'Solo se pueden reservar clases hasta el final de la semana siguiente';
    } else if (daysFromToday(slotDate) > rules.maxAdvanceDays) {
      cls += ' unavailable';
      disabled = 'disabled';
      title = `Tu rol permite reservar hasta ${rules.maxAdvanceDays} días de antelación`;
    } else {
      cls += ' available';
      inner = 'Reservar';
    }

    return `<div class="${cls}">
      <button class="slot-btn" ${disabled} ${title ? `title="${title}"` : ''} ${dataAttrs}>${inner}</button>
    </div>`;
  },

  renderBookingsList(upcoming) {
    if (upcoming.length === 0) {
      return `
        <div class="card">
          <div class="card-head"><div><h3>Próximas clases</h3></div></div>
          <div class="empty-state">No tienes clases reservadas todavía. Selecciona una franja disponible en el calendario.</div>
        </div>
      `;
    }

    const items = upcoming.map(b => {
      const date = parseISODate(b.dateISO);
      const teacher = Store.getTeacher(b.teacherId);
      return `
        <div class="booking-item">
          <div class="info">
            <div class="date">${capitalize(formatDateES(date))}</div>
            <div class="time">${formatTime(b.hour)} – ${formatTime(b.hour + 1)}</div>
            <div class="teacher">Con ${teacher ? teacher.name : '—'}</div>
          </div>
          <button class="btn btn-danger btn-sm" data-cancel="${b.id}">Cancelar</button>
        </div>
      `;
    }).join('');

    return `
      <div class="card">
        <div class="card-head">
          <div>
            <h3>Próximas clases</h3>
            <div class="desc">${upcoming.length} reserva${upcoming.length === 1 ? '' : 's'} confirmada${upcoming.length === 1 ? '' : 's'}.</div>
          </div>
        </div>
        ${items}
      </div>
    `;
  },

  renderRules(rules, student) {
    const items = [];
    items.push(`Hasta <strong>${rules.maxPerWeek}</strong> clases por semana.`);
    items.push(`Puedes reservar con hasta <strong>${rules.maxAdvanceDays} días</strong> de antelación.`);
    items.push('Reservas limitadas a <strong>esta semana y la siguiente</strong>.');
    items.push('Hasta <strong>2 clases el mismo día</strong>, pero deben ser consecutivas (anterior o siguiente a la ya reservada).');
    items.push('Las cancelaciones requieren <strong>24 h</strong> de antelación.');

    return `
      <div class="card" style="margin-top:20px;">
        <div class="card-head">
          <div>
            <h3>Tu rol: <span class="badge ${student.role}" style="margin-left:6px;">${rules.label}</span></h3>
            <div class="desc">${rules.description}</div>
          </div>
        </div>
        <ul class="rules-list">
          ${items.map(t => `<li><span class="icon">i</span><span>${t}</span></li>`).join('')}
        </ul>
      </div>
    `;
  },

  bind(root, student) {
    root.querySelector('#logoutBtn').addEventListener('click', async () => {
      await Auth.logout();
      App.render();
    });

    root.querySelector('#prevWeek').addEventListener('click', () => {
      this.state.weekStart = addDays(this.state.weekStart, -7);
      this.render(root);
    });
    root.querySelector('#nextWeek').addEventListener('click', () => {
      this.state.weekStart = addDays(this.state.weekStart, 7);
      this.render(root);
    });
    root.querySelector('#todayWeek').addEventListener('click', () => {
      this.state.weekStart = startOfWeek(new Date());
      this.render(root);
    });

    root.querySelectorAll('.slot.available .slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateISO = btn.dataset.date;
        const hour = Number(btn.dataset.hour);
        this.openBookingModal(student, dateISO, hour, root);
      });
    });

    root.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.cancel;
        this.openCancelModal(id, root);
      });
    });
  },

  openBookingModal(student, dateISO, hour, root) {
    const date = parseISODate(dateISO);
    const teacher = Store.getTeacher(student.teacherId);
    const check = Booking.canBook(student, dateISO, hour);

    const slotDate = parseISODate(dateISO);
    slotDate.setHours(hour, 0, 0, 0);
    const hoursAhead = (slotDate - new Date()) / 36e5;
    const within24h = check.ok && hoursAhead < 24;

    showModal({
      title: within24h ? 'Confirmar reserva · sin opción a cancelar' : 'Confirmar reserva',
      body: `
        <p>Vas a reservar la siguiente clase práctica:</p>
        <div class="modal-summary">
          <div class="row"><span class="k">Día</span><span class="v">${capitalize(formatDateES(date))}</span></div>
          <div class="row"><span class="k">Hora</span><span class="v">${formatTime(hour)} – ${formatTime(hour + 1)}</span></div>
          <div class="row"><span class="k">Profesor</span><span class="v">${teacher.name}</span></div>
          <div class="row"><span class="k">Duración</span><span class="v">1 hora</span></div>
        </div>
        ${!check.ok ? `<div style="background:var(--danger-light);color:var(--danger);padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:10px;">${check.reason}</div>` : ''}
        ${within24h ? `
          <div style="background:var(--warning-light);color:var(--warning);padding:12px 14px;border-radius:8px;font-size:13px;margin-bottom:10px;border-left:3px solid var(--warning);">
            <strong>Atención:</strong> esta clase empieza en menos de 24 h. Si la reservas, <strong>no podrás cancelarla</strong>, ya que las cancelaciones requieren al menos 24 h de antelación.
          </div>
        ` : ''}
      `,
      actions: [
        { label: 'Cancelar', cls: 'btn-secondary', onClick: closeModal },
        ...(check.ok ? [{
          label: within24h ? 'Aceptar y reservar' : 'Confirmar reserva',
          cls: within24h ? 'btn-accent' : 'btn-primary',
          onClick: async () => {
            const result = await Booking.book(student, dateISO, hour);
            closeModal();
            if (result.ok) {
              showToast('Reserva confirmada correctamente.', 'success');
              this.render(root);
            } else {
              showToast(result.reason, 'error');
            }
          }
        }] : [])
      ],
    });
  },

  openCancelModal(bookingId, root) {
    const b = Store.getBookings().find(x => x.id === bookingId);
    if (!b) return;
    const date = parseISODate(b.dateISO);

    showModal({
      title: '¿Cancelar reserva?',
      body: `
        <p>Vas a cancelar la siguiente clase:</p>
        <div class="modal-summary">
          <div class="row"><span class="k">Día</span><span class="v">${capitalize(formatDateES(date))}</span></div>
          <div class="row"><span class="k">Hora</span><span class="v">${formatTime(b.hour)}</span></div>
        </div>
        <p style="font-size:13px;color:var(--text-soft);">Recuerda: las cancelaciones requieren al menos 24 h de antelación.</p>
      `,
      actions: [
        { label: 'Volver', cls: 'btn-secondary', onClick: closeModal },
        {
          label: 'Cancelar reserva',
          cls: 'btn-danger',
          onClick: async () => {
            const r = await Booking.cancel(bookingId);
            closeModal();
            if (r.ok) {
              showToast('Reserva cancelada.', 'info');
              this.render(root);
            } else {
              showToast(r.reason, 'error');
            }
          }
        }
      ],
    });
  },
};
