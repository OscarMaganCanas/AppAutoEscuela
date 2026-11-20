# 🚗 Autoescuela Rosales · Gestión de clases prácticas

Aplicación web para que los alumnos de una autoescuela **reserven sus clases prácticas** y los profesores **gestionen su agenda y a sus alumnos**. Sustituye la gestión manual (llamadas, WhatsApp, papel) por un sistema con reglas automáticas que evita solapamientos y reparte las clases según el nivel de cada alumno.

🔗 **Demo:** [autoescuela-rosales.vercel.app](https://autoescuela-rosales.vercel.app) *(usuarios de prueba más abajo)*

<!-- Añade aquí capturas de pantalla:
![Panel del alumno](docs/alumno.png)
![Panel del profesor](docs/profesor.png)
-->

## ✨ Funcionalidades

### 👨‍🎓 Alumno
- Panel con su nivel, cupo semanal disponible y profesor asignado
- Calendario semanal interactivo con las franjas libres, ocupadas y propias
- Reserva y cancelación de clases con confirmación
- Mensajes claros que explican por qué una franja no se puede reservar
- Listado de próximas clases

### 👨‍🏫 Profesor
- Listado de sus alumnos con nivel y número de clases realizadas
- Cambio del nivel de un alumno (Nuevo → Principiante → Prioridad)
- Agenda de próximas clases y resumen del día

## 📏 Reglas de negocio

Cada alumno tiene un **nivel** que determina cuántas clases puede reservar y con cuánta antelación:

| Nivel | Clases / semana | Antelación máxima |
|---|---|---|
| **Nuevo** | 2 | 4 días |
| **Principiante** | 2 | 7 días |
| **Prioridad** (cerca del examen) | 5 | 14 días |

Además, la aplicación valida que:
- Solo se reserve hasta el final de la **semana siguiente**
- Cada alumno tenga siempre el **mismo profesor** y cada franja admita **un único alumno**
- Se permitan como máximo **2 clases al día, y solo si son consecutivas**
- Las cancelaciones se hagan con al menos **24 h de antelación**
- El horario sea de **lunes a sábado**, de 9:00 a 14:00 y de 16:00 a 20:00

Las reservas dobles simultáneas se evitan también en el servidor con una restricción `UNIQUE (teacher_id, date_iso, hour)` en la base de datos.

## 🛠️ Tecnologías

| | |
|---|---|
| **Frontend** | HTML5 · CSS3 · JavaScript (vanilla, sin frameworks) |
| **Backend / BBDD** | [Supabase](https://supabase.com) (PostgreSQL) |
| **Autenticación** | Supabase Auth (email y contraseña) |
| **Seguridad** | Row Level Security (RLS) de PostgreSQL |
| **Despliegue** | Vercel |

## 🗂️ Estructura

```
├── index.html               # Punto de entrada
├── schema.sql               # Tablas, políticas RLS y datos de ejemplo
├── css/styles.css
└── js/
    ├── supabase.js          # Cliente de Supabase
    ├── data.js              # Capa de datos (Store) y reglas por nivel
    ├── auth.js              # Login, sesión y detección del tipo de usuario
    ├── booking.js           # Validaciones de reserva y cancelación
    ├── app.js               # Router y utilidades de UI (toasts, modales)
    └── views/
        ├── login.js
        ├── studentDashboard.js
        └── teacherDashboard.js
```

**Arquitectura:** al iniciar sesión, los datos se cargan una vez en una caché en memoria (`Store`). Las lecturas son síncronas desde esa caché y las escrituras van a Supabase y actualizan la caché. Las reglas de negocio están separadas de la interfaz en `booking.js`.

## 🚀 Ejecutarlo en local

1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. En **SQL Editor**, ejecuta `schema.sql` para crear las tablas y los datos de ejemplo.
3. En **Authentication → Users**, crea los usuarios con los emails de ejemplo y ejecuta el bloque *"Vincular auth"* del final de `schema.sql`.
4. Copia la URL y la *anon key* de tu proyecto (**Settings → API**) en `js/supabase.js`.
5. Abre `index.html` con un servidor local, por ejemplo la extensión *Live Server* de VS Code.

## 🔑 Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Profesor | carlos.mendez@demo.com | `[CONTRASEÑA]` |
| Alumno (Prioridad) | marta.ruiz@demo.com | `[CONTRASEÑA]` |
| Alumno (Nuevo) | ana.castillo@demo.com | `[CONTRASEÑA]` |

## 👤 Autor

**Óscar Magán Cañas** · [GitHub](https://github.com/OscarMaganCanas)
