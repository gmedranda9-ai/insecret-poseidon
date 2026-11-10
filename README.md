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

## Contrato con el backend (RPC de Supabase)
- `create_draw(p_group, p_organizer, p_event_date, p_budget, p_message, p_participants, p_exclusions, p_contact, p_marketing)` → `{organizer_token, group_token}`
- `organizer_status(p_token)` → participantes con `ref, name, token, opened, claimed` (el organizador nunca ve emparejamientos)
- `reset_participant(p_org_token, p_ref)` → rota el token y borra el PIN de esa persona
- `group_info(p_group_token)` → nombres del grupo y quién ya entró
- `group_enter(p_group_token, p_ref, p_pin)` → `{token}`; la primera vez fija el PIN, luego lo verifica (bloqueo a los 5 intentos)
- `reveal_assignment(p_token)` → amigo secreto de esa persona + lista de deseos de él/ella; marca el enlace como abierto
- `save_wish(p_token, p_wish)` → cada participante guarda su propia lista de deseos

## Acceso del organizador (v4)
- `create_draw` recibe además `p_phone` y `p_org_pin` (6 dígitos, se guarda cifrado con bcrypt).
- `org_recover(p_phone, p_pin)` devuelve los sorteos vigentes de ese WhatsApp+PIN. 5 fallos = bloqueo de 15 min por número.
- `group_enter` devuelve `opened` y `reveal_assignment` devuelve `was_opened`, para entrar directo a la tarjeta si ya abrió el regalo.
- El navegador solo recuerda los sorteos como comodidad (`insecret_org`); la página de inicio siempre abre el asistente.

## Privacidad del organizador (v5)
- Se eliminó `organizer_links`: ya no hay enlaces individuales; todos usan el mismo enlace de grupo + su PIN.
- `reset_participant` incrementa `reset_count` y la tarjeta del participante muestra un aviso si su acceso fue reiniciado.
- `purge_expired` también borra grupos abandonados (creados hace más de 30 días y sin ninguna apertura).

## v9 · Portada con dos puertas

- `/` es la portada: dos tarjetas animadas, **Amigo secreto** (`/amigo-secreto/`) e **Invitaciones interactivas** (`/invitacion/`).
- El sorteo vive ahora en `/amigo-secreto/`. Los enlaces viejos del sorteo en la raíz (`?g=`, `?o=`, `?t=`, `?demo=`) redirigen solos (`js/landing.js`).
- `/amigo-secreto/?r=1` abre directo la pantalla "Ya soy organizador" (la portada muestra el contador de sorteos guardados en el dispositivo).

## v10 · Estructura final de páginas

- `/` portada Poseidón (logo grande, quién es Poseidón, 2 puertas).
- `/amigo-secreto/` solo el sorteo (sin invitaciones, con botón "‹ Inicio").
- `/invitaciones/` página de venta: qué puede llevar, 5 ocasiones + "otra ocasión", botón de WhatsApp.
- `/invitacion/?t=navidad|fin|boda|cumple|cita` el ejemplo interactivo de cada ocasión.

## v11 · Rehacer y eliminar sorteo

- Panel del organizador: «Rehacer el sorteo» (prellena el formulario con los nombres; el sorteo viejo sigue vivo hasta crear el nuevo y entonces se borra) y «Eliminar este sorteo» (borra todo, sin deshacer).
- RPC `org_delete(p_org_token)` y `organizer_status` ahora devuelve `message`.

## v12 · Generador de invitaciones (modo asistido)
- `/admin/` (privado, noindex): login con clave de administrador (hash bcrypt en `insecret.admin_cfg`; 5 fallos = bloqueo 15 min). Lista, crea, edita y elimina invitaciones; versión empresa (logo, color, firma); genera enlace de invitación, enlace del panel del anfitrión y mensaje listo para WhatsApp.
- Clave: se crea una sola vez en el SQL Editor de Supabase con `select insecret.set_admin_key('...');` (mín. 10 caracteres). Nunca se pega en el chat ni en el código.
- `/invitacion/?i=slug[&para=Nombre]`: invitación real. `/anfitrion/?h=TOKEN`: panel con respuestas, resumen para WhatsApp y enlaces personalizados.
- Las invitaciones y respuestas se borran 7 días después del evento (pg_cron).

## v13 · Paquete Empresa (correos con Brevo)
- Admin → «📧 Paquete Empresa»: se pega nombre y correo de cada colaborador; se hace el sorteo en el servidor (`public.admin_company_draw`, requiere la clave de administrador) y la Edge Function `send-company` envía a cada persona un correo con dos botones (invitación con `?para=` y amigo secreto con su enlace privado `?t=`).
- Los correos no se guardan. Remitente `no-reply@poseidonmk.com`, respuestas a `soporte@poseidonmk.com`. Requiere el secreto `BREVO_API_KEY` en Supabase.
- Los envíos fallidos se pueden reintentar sin repetir el sorteo.

## v14 · Correo oscuro, ejemplos en dos columnas
- Correo de Paquete Empresa: banner navideño/fin de año, botones dorados, pie con Poseidón (Edge Function `send-company` v5). La vista previa del admin refleja el mismo diseño.
- Invitaciones: modo paso a paso (botones), luces, adornos y gorro; estilo corporativo oscuro (`?corp=1`). `/invitaciones/` muestra individuales (izquierda) y empresariales (derecha).
