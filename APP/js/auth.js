/* =========================================================
   auth.js — Autenticación real con Supabase Auth
   ========================================================= */

const Auth = {
  current: null, // { type: 'student'|'teacher', id }

  async init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await this._resolveUser(session.user);
    }

    // Reaccionar a cambios de sesión (expiración, cierre en otra pestaña)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        this.current = null;
        App._dataLoaded = false;
        App.render();
      }
    });
  },

  /* Determina si el usuario es alumno o profesor buscando en las tablas. */
  async _resolveUser(supabaseUser) {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('auth_user_id', supabaseUser.id)
      .maybeSingle();

    if (teacher) {
      this.current = { type: 'teacher', id: teacher.id };
      return;
    }

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('auth_user_id', supabaseUser.id)
      .maybeSingle();

    if (student) {
      this.current = { type: 'student', id: student.id };
      return;
    }

    // Usuario en auth pero no en nuestras tablas
    this.current = null;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this._resolveUser(data.user);
    if (!this.current) {
      throw new Error('Usuario no encontrado en la plataforma. Contacta con la autoescuela.');
    }
  },

  async logout() {
    await supabase.auth.signOut();
    this.current = null;
    App._dataLoaded = false;
  },

  isAuthenticated() {
    return this.current !== null;
  },

  getUser() {
    if (!this.current) return null;
    if (this.current.type === 'student') {
      return { ...Store.getStudent(this.current.id), _type: 'student' };
    }
    return { ...Store.getTeacher(this.current.id), _type: 'teacher' };
  },
};
