# InSecret Poseidón

Sorteador de amigo secreto navideño de **Poseidón**. Sitio estático (HTML/CSS/JS, sin build) pensado para móvil.

- Sitio: https://insecret.poseidonmk.com
- Sorteo: lo hace el **servidor** (funciones RPC de Supabase), nunca la página.
- Base de datos: proyecto Supabase **separado** del resto de Poseidón, con RLS en todas las tablas.

## Estructura
- `index.html` · una sola página con las vistas (asistente, panel del organizador, revelación)
- `css/styles.css`, `js/app.js` (interfaz), `js/api.js` (capa de datos), `js/fx.js` (nieve, confeti, tarjeta PNG)
- `config.js` · URL y clave *publishable* de Supabase (públicas por diseño). **Nunca** pongas `service_role` aquí.
- `CNAME` · dominio personalizado para GitHub Pages

## Vista previa local
`python3 -m http.server 8000` y abre `http://localhost:8000/?demo=1` (modo demo: todo queda en tu navegador, solo para ver el diseño).

## Contrato con el backend (RPC)
- `create_draw(p_group, p_organizer, p_event_date, p_budget, p_message, p_participants, p_exclusions, p_contact, p_marketing)`
- `organizer_status(p_token)` · solo devuelve quién abrió su enlace
- `reveal_assignment(p_token)` · devuelve el emparejamiento de **esa** persona y marca el enlace como abierto
