/* =========================================================
   booking.js — Reglas de negocio y validaciones de reserva
   ========================================================= */

const Booking = {
  /**
   * Comprueba si un alumno puede reservar una clase a (dateISO, hour).
   * Devuelve { ok: bool, reason?: string }.
   * Síncrono — lee desde la caché del Store.
   */
  canBook(student, dateISO, hour) {
    const rules = RoleRules[student.role];
    if (!rules.canBook) {
      return { ok: false, reason: 'Tu rol actual no permite reservar todavía.' };
    }

    const slotDate = parseISODate(dateISO);
    slotDate.setHours(hour, 0, 0, 0);
    const now = new Date();

    if (slotDate < now) {
      return { ok: false, reason: 'No puedes reservar una clase en el pasado.' };
    }
    if (slotDate.getDay() === 0) {
      return { ok: false, reason: 'Los domingos no se imparten clases prácticas.' };
    }

    const globalCap = endOfNextWeek(now);
    if (slotDate > globalCap) {
      return { ok: false, reason: 'Solo se pueden reservar clases hasta el final de la semana siguiente.' };
    }

    if (rules.maxAdvanceDays != null) {
      const daysAhead = daysFromToday(slotDate);
      if (daysAhead > rules.maxAdvanceDays) {
        return { ok: false, reason: `Con tu rol (${rules.label}) puedes reservar hasta ${rules.maxAdvanceDays} días de antelación.` };
      }
    }

    const existing = Store.getBookingAt(student.teacherId, dateISO, hour);
    if (existing) {
      if (existing.studentId === student.id) {
        return { ok: false, reason: 'Ya tienes esta clase reservada.' };
      }
      return { ok: false, reason: 'Esta franja ya está ocupada por otro alumno.' };
    }

    const sameDay = Store.getBookingsByStudent(student.id).filter(b => b.dateISO === dateISO);
    if (sameDay.length >= 2) {
      return { ok: false, reason: 'Ya tienes 2 clases reservadas ese día (máximo permitido).' };
    }
    if (sameDay.length === 1) {
      const existingHour = sameDay[0].hour;
      if (Math.abs(existingHour - hour) !== 1) {
        return { ok: false, reason: 'Si reservas 2 clases el mismo día deben ser consecutivas (la franja anterior o la siguiente a tu clase).' };
      }
    }

    const weekStart = startOfWeek(slotDate);
    const weekEnd = addDays(weekStart, 6);
    const inWeek = Store.getBookingsByStudent(student.id).filter(b => {
      const d = parseISODate(b.dateISO);
      return d >= weekStart && d <= weekEnd;
    });
    if (inWeek.length >= rules.maxPerWeek) {
      return { ok: false, reason: `Has alcanzado tu límite semanal (${rules.maxPerWeek} clases). Cancela una reserva para liberar la franja.` };
    }

    return { ok: true };
  },

  /** Reserva una clase. Async — escribe en Supabase. */
  async book(student, dateISO, hour) {
    const check = this.canBook(student, dateISO, hour);
    if (!check.ok) return check;

    try {
      const booking = await Store.addBooking({
        studentId: student.id,
        teacherId: student.teacherId,
        dateISO,
        hour,
      });
      return { ok: true, booking };
    } catch (err) {
      console.error('Error al reservar:', err);
      // El constraint UNIQUE del servidor evita reservas dobles concurrentes
      if (err.code === '23505') {
        return { ok: false, reason: 'Esa franja acaba de ser reservada por otro alumno. Elige otra.' };
      }
      return { ok: false, reason: 'Error al guardar la reserva. Inténtalo de nuevo.' };
    }
  },

  /** Cancela una reserva. Async — borra en Supabase. */
  async cancel(bookingId) {
    const b = Store.getBookings().find(x => x.id === bookingId);
    if (!b) return { ok: false, reason: 'Reserva no encontrada.' };

    const slotDate = parseISODate(b.dateISO);
    slotDate.setHours(b.hour, 0, 0, 0);
    const hoursAhead = (slotDate - new Date()) / 36e5;
    if (hoursAhead < 24) {
      return { ok: false, reason: 'Las cancelaciones requieren al menos 24 h de antelación.' };
    }

    try {
      await Store.removeBooking(bookingId);
      return { ok: true };
    } catch (err) {
      console.error('Error al cancelar:', err);
      return { ok: false, reason: 'Error al cancelar la reserva. Inténtalo de nuevo.' };
    }
  },

  /** Cuenta clases reservadas del alumno en la semana de `refDate`. */
  classesInWeek(studentId, refDate) {
    const ws = startOfWeek(refDate);
    const we = addDays(ws, 6);
    return Store.getBookingsByStudent(studentId).filter(b => {
      const d = parseISODate(b.dateISO);
      return d >= ws && d <= we;
    }).length;
  },

  /** Próximas reservas (futuras) de un alumno ordenadas. */
  upcomingForStudent(studentId) {
    const now = new Date();
    return Store.getBookingsByStudent(studentId)
      .filter(b => {
        const d = parseISODate(b.dateISO);
        d.setHours(b.hour, 0, 0, 0);
        return d >= now;
      })
      .sort((a, b) => {
        if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? -1 : 1;
        return a.hour - b.hour;
      });
  },

  /** Próximas reservas de un profesor. */
  upcomingForTeacher(teacherId) {
    const now = new Date();
    return Store.getBookingsByTeacher(teacherId)
      .filter(b => {
        const d = parseISODate(b.dateISO);
        d.setHours(b.hour, 0, 0, 0);
        return d >= now;
      })
      .sort((a, b) => {
        if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? -1 : 1;
        return a.hour - b.hour;
      });
  },
};
