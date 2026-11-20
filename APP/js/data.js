/* =========================================================
   data.js — Capa de datos con Supabase
   =========================================================
   Modelo (igual que antes):
   - teachers: { id, name, initials, authUserId }
   - students: { id, name, email, role, teacherId,
                  classesTaken, authUserId }
   - bookings: { id, studentId, teacherId, dateISO,
                  hour, createdAt }

   Estrategia: pre-fetch en Store.load() → caché en memoria.
   Las lecturas (get*) son síncronas desde la caché.
   Las escrituras (add/remove/update) son async → Supabase + caché.
   ========================================================= */

const Roles = Object.freeze({
  NUEVO:        'NUEVO',
  PRINCIPIANTE: 'PRINCIPIANTE',
  PRIORIDAD:    'PRIORIDAD',
});

const RoleRules = {
  NUEVO: {
    label: 'Nuevo',
    description: 'Acabas de empezar. Hasta 2 clases por semana, reservables con hasta 4 días de antelación.',
    maxPerWeek: 2,
    maxAdvanceDays: 4,
    canBook: true,
  },
  PRINCIPIANTE: {
    label: 'Principiante',
    description: 'Hasta 2 clases por semana. Reservas con hasta 1 semana de antelación.',
    maxPerWeek: 2,
    maxAdvanceDays: 7,
    canBook: true,
  },
  PRIORIDAD: {
    label: 'Prioridad',
    description: 'Hasta 5 clases por semana. Reservas con hasta 2 semanas de antelación.',
    maxPerWeek: 5,
    maxAdvanceDays: 14,
    canBook: true,
  },
};

const WorkHours = [9, 10, 11, 12, 13, 16, 17, 18, 19];

/* ── Helpers de normalización DB → JS ── */
function normalizeTeacher(t) {
  return {
    id:         t.id,
    name:       t.name,
    initials:   t.initials,
    authUserId: t.auth_user_id,
  };
}
function normalizeStudent(s) {
  return {
    id:           s.id,
    name:         s.name,
    email:        s.email,
    role:         s.role,
    teacherId:    s.teacher_id,
    classesTaken: s.classes_taken,
    authUserId:   s.auth_user_id,
  };
}
function normalizeBooking(b) {
  return {
    id:        b.id,
    studentId: b.student_id,
    teacherId: b.teacher_id,
    dateISO:   b.date_iso,
    hour:      b.hour,
    createdAt: b.created_at,
  };
}

const Store = {
  state: {
    teachers: [],
    students: [],
    bookings: [],
  },

  /* Carga todos los datos desde Supabase a la caché. */
  async load() {
    const [
      { data: teachers, error: et },
      { data: students, error: es },
      { data: bookings, error: eb },
    ] = await Promise.all([
      supabase.from('teachers').select('*'),
      supabase.from('students').select('*'),
      supabase.from('bookings').select('*'),
    ]);

    if (et) throw et;
    if (es) throw es;
    if (eb) throw eb;

    this.state.teachers = (teachers || []).map(normalizeTeacher);
    this.state.students = (students || []).map(normalizeStudent);
    this.state.bookings = (bookings || []).map(normalizeBooking);
  },

  /* ── Lecturas síncronas (desde caché) ── */
  getTeachers()               { return [...this.state.teachers]; },
  getTeacher(id)              { return this.state.teachers.find(t => t.id === id); },
  getStudents()               { return [...this.state.students]; },
  getStudent(id)              { return this.state.students.find(s => s.id === id); },
  getStudentsByTeacher(tid)   { return this.state.students.filter(s => s.teacherId === tid); },
  getBookings()               { return [...this.state.bookings]; },
  getBookingsByStudent(sid)   { return this.state.bookings.filter(b => b.studentId === sid); },
  getBookingsByTeacher(tid)   { return this.state.bookings.filter(b => b.teacherId === tid); },
  getBookingAt(teacherId, dateISO, hour) {
    return this.state.bookings.find(b =>
      b.teacherId === teacherId && b.dateISO === dateISO && b.hour === hour
    );
  },

  /* ── Escrituras async (Supabase + caché) ── */

  async addBooking({ studentId, teacherId, dateISO, hour }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({ student_id: studentId, teacher_id: teacherId, date_iso: dateISO, hour })
      .select()
      .single();

    if (error) throw error;

    const booking = normalizeBooking(data);
    this.state.bookings.push(booking);
    return booking;
  },

  async removeBooking(id) {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) throw error;
    this.state.bookings = this.state.bookings.filter(b => b.id !== id);
  },

  async updateStudentRole(studentId, role) {
    const { error } = await supabase
      .from('students')
      .update({ role })
      .eq('id', studentId);

    if (error) throw error;

    const s = this.getStudent(studentId);
    if (s) s.role = role;
  },
};

/* ===========================
   Helpers de fecha
=========================== */
function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function formatDateES(date) {
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
function formatTime(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function endOfNextWeek(ref = new Date()) {
  const ws = startOfWeek(ref);
  const end = addDays(ws, 13);
  end.setHours(23, 59, 59, 999);
  return end;
}
function daysFromToday(date) {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(date); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 864e5);
}
