# Bend Planner Pro SaaS — Fase 1: esquema multiempresa (solo backend)

Esta fase añade **únicamente** el esquema de base de datos multiempresa con
aislamiento por RLS. **No** cambia el frontend ni su almacenamiento local
(Dexie/SQLite): la app sigue funcionando exactamente igual.

## Archivos

| Archivo | Contenido |
|---|---|
| `supabase/tests/sql/20261024000001_saas_fase1_multiempresa.sql` | Migración versionada: tablas, enums, funciones, GRANTs, índices, triggers y policies RLS. |
| `supabase/tests/0001_saas_fase1_rls_test.sql` | Tests pgTAP de aislamiento (taller A vs B) y de roles. |
| `docs/saas-fase1.md` | Este documento. |

> **Por qué la migración no está en `supabase/migrations/`:** en este proyecto
> esa carpeta está gestionada por la plataforma y cualquier archivo allí se
> aplica contra la base cloud. Esta fase prohíbe ejecutar DDL en cloud, así
> que el SQL vive versionado bajo `supabase/tests/sql/` hasta que se decida
> aplicarlo.

## Qué crea la migración

- **Tablas:** `tenants`, `platform_admins`, `memberships`, `profiles`,
  `machines`, `pieces`, `bends`, `templates`, `work_sessions`, `incidents`.
- **Enums:** `tenant_status` (activo/suspendido/cancelado), `tenant_plan`
  (basico/taller/pro/personalizado), `member_role`
  (admin_taller/supervisor/operario/consulta), `member_status`
  (activo/suspendido).
- **Funciones `SECURITY DEFINER`** con `search_path` fijo:
  `get_user_tenant_ids()`, `is_platform_admin()`, `current_user_tenant_id()`,
  `current_user_tenant_role()`. `EXECUTE` revocado a `public`/`anon` y
  concedido solo a `authenticated`.
- **RLS habilitado en las 10 tablas**, con policies explícitas
  SELECT/INSERT/UPDATE/DELETE `TO authenticated`.
- **Índices** en `tenant_id` y claves de relación.
- **Trigger `updated_at`** en `pieces` y `bends`.
- **Trigger `protect_ownership_fields`** en las tablas con campos de
  propiedad: impide modificar `tenant_id`, `user_id` y `created_by` en un
  UPDATE. *Motivo:* RLS por sí sola no puede impedir que un usuario con
  permiso de UPDATE mueva una fila a otro tenant o cambie su autoría; es la
  excepción mínima y deliberada a "solo RLS".

## Reglas de acceso (resumen)

| Rol | Permisos |
|---|---|
| `platform_admin` (allowlist `platform_admins`, independiente de tenants) | Acceso global; único que gestiona `tenants`. |
| `admin_taller` | Gestiona máquinas y membresías **solo de su taller**. No puede crear otros `admin_taller`, ni modificar/borrar su propia membresía, ni crear superadmins. |
| `supervisor` | Edita piezas/plantillas y ve los datos de su taller. |
| `operario` | Lee piezas, crea piezas/pliegues, ejecuta sesiones de trabajo y registra incidencias. **No** borra piezas ni gestiona usuarios. |
| `consulta` | Solo lectura dentro de su tenant. |

El `tenant_id` **nunca se confía al navegador**: toda policy valida que el
tenant de la fila esté entre los del usuario autenticado. No se usa
`service_role` desde el cliente.

## Cómo aplicar la migración (local o proyecto de pruebas)

**Nunca en la base cloud/producción del proyecto real sin revisión.**

### Opción A — Supabase local (recomendada)

```bash
supabase start
psql "$SUPABASE_LOCAL_DB_URL" -f supabase/tests/sql/20261024000001_saas_fase1_multiempresa.sql
```

(o copia el contenido del `.sql` en el SQL Editor de tu instancia local).

### Opción B — Proyecto cloud DE PRUEBAS (vacío y separado)

1. Crea un proyecto nuevo, distinto del de producción.
2. Pega el contenido de la migración en su SQL Editor y ejecútalo.
3. Verifica: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';`
   — las 10 tablas deben tener `rowsecurity = true`.

## Cómo ejecutar los tests

Precondiciones: la migración aplicada y pgTAP disponible. El script crea
usuarios y datos de prueba **dentro de una transacción con ROLLBACK**, así que
no deja residuo; aun así, ejecútalo solo en local/test.

```bash
# Local con CLI:
supabase test db

# O directamente:
psql "$SUPABASE_LOCAL_DB_URL" -f supabase/tests/0001_saas_fase1_rls_test.sql
```

Los tests cubren: lectura/inserción/actualización/borrado entre taller A y B,
operario sin borrado de piezas ni gestión de usuarios, consulta solo lectura,
admin_taller limitado a su taller y sin autoelevación, acceso global del
platform_admin y el trigger de protección de campos de propiedad.

## Alta del primer platform_admin (segura)

`platform_admins` no tiene policies de escritura: nadie puede autoelevarse
desde la API. El primer superadmin se da de alta **manualmente** desde el SQL
Editor (sesión autenticada/privada, rol con privilegios):

```sql
-- Sustituye el UUID por el id real del usuario en auth.users
INSERT INTO public.platform_admins (user_id)
VALUES ('<uuid-del-usuario>');
```

A partir de ahí, ese usuario ya puede gestionar tenants desde la API.

## Variables de entorno (sin secretos)

El frontend usa solo la clave pública (anon/publishable), protegida por RLS:

- `VITE_SUPABASE_URL` — URL pública del proyecto.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — clave pública anon.

Ambas ya están en `.env` (no las modifiques ni añadas claves nuevas). La clave
`service_role` **nunca** va en el cliente.

## Advertencias

- **No ejecutes la migración ni los tests en producción sin revisión.**
- Las policies de `tenants` y `memberships` son las más sensibles: revísalas
  antes de cualquier cambio futuro.
- Si un requisito futuro no pueda garantizarse solo con RLS, añade trigger/RPC
  mínimo y documenta el motivo (como se hizo con `protect_ownership_fields`).
