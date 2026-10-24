-- ============================================================================
-- Tests pgTAP — FASE 1 SaaS: aislamiento multiempresa y roles
-- ============================================================================
-- PRECONDICIONES (obligatorias, léalas antes de ejecutar):
--   1. Ejecutar SOLO en un entorno local o proyecto de pruebas aislado
--      (p. ej. `supabase start` local o un proyecto cloud DE PRUEBAS).
--      NUNCA en la base cloud/producción del proyecto real.
--   2. La migración de Fase 1 (supabase/tests/sql/20261024000001_saas_fase1_multiempresa.sql)
--      debe estar aplicada en esa base de pruebas.
--   3. pgTAP debe estar instalado: CREATE EXTENSION IF NOT EXISTS pgtap;
--      (en Supabase local ya viene disponible con `supabase test db`).
--   4. Este script crea usuarios de prueba en auth.users y datos en public;
--      todo se revierte al final porque va dentro de una transacción con
--      ROLLBACK. Aun así, no lo ejecutes en producción.
--
-- Ejecución recomendada (local):
--   supabase test db   # o: psql <url-local> -f supabase/tests/0001_saas_fase1_rls_test.sql
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(24);

-- ---------------------------------------------------------------------------
-- Fixture: 2 tenants (A y B), usuarios con cada rol, 1 platform_admin
-- ---------------------------------------------------------------------------
-- Usuarios de prueba en auth.users (mínimo indispensable).
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'admin.a@test.local',   crypt('x', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', 'sup.a@test.local',     crypt('x', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-0000000000a3', 'op.a@test.local',      crypt('x', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-0000000000a4', 'consulta.a@test.local',crypt('x', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', 'admin.b@test.local',   crypt('x', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000000099', 'root@test.local',      crypt('x', gen_salt('bf')), now(), '{}', '{}', 'authenticated', 'authenticated', now(), now());

INSERT INTO public.tenants (id, nombre, plan) VALUES
  ('10000000-0000-0000-0000-00000000000a', 'Taller A', 'taller'),
  ('10000000-0000-0000-0000-00000000000b', 'Taller B', 'basico');

INSERT INTO public.platform_admins (user_id)
VALUES ('00000000-0000-0000-0000-000000000099');

INSERT INTO public.memberships (tenant_id, user_id, role, is_primary) VALUES
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 'admin_taller', true),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a2', 'supervisor',   true),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a3', 'operario',     true),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', 'consulta',     true),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', 'admin_taller', true);

INSERT INTO public.profiles (user_id, tenant_id, nombre) VALUES
  ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-00000000000a', 'Admin A'),
  ('00000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-00000000000a', 'Supervisor A'),
  ('00000000-0000-0000-0000-0000000000a3', '10000000-0000-0000-0000-00000000000a', 'Operario A'),
  ('00000000-0000-0000-0000-0000000000a4', '10000000-0000-0000-0000-00000000000a', 'Consulta A'),
  ('00000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-00000000000b', 'Admin B'),
  ('00000000-0000-0000-0000-000000000099', NULL, 'Root');

INSERT INTO public.pieces (id, tenant_id, nombre, created_by) VALUES
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Pieza A1', '00000000-0000-0000-0000-0000000000a1'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'Pieza B1', '00000000-0000-0000-0000-0000000000b1');

INSERT INTO public.machines (id, tenant_id, nombre, created_by) VALUES
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Plegadora A', '00000000-0000-0000-0000-0000000000a1');

-- Helper local del test: simula el JWT de un usuario (como haría PostgREST).
CREATE OR REPLACE FUNCTION test_as(u uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', json_build_object('sub', u::text, 'role', 'authenticated')::text, true);
  SELECT set_config('role', 'authenticated', true);
$$;
CREATE OR REPLACE FUNCTION test_reset() RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', '', true);
  SELECT set_config('role', 'postgres', true);
$$;

-- ---------------------------------------------------------------------------
-- 1. Aislamiento de lectura entre tenants
-- ---------------------------------------------------------------------------
SELECT test_as('00000000-0000-0000-0000-0000000000a1'); -- admin A
SELECT is(
  (SELECT count(*)::int FROM public.pieces), 1,
  'admin A solo ve las piezas de su tenant'
);
SELECT is(
  (SELECT count(*)::int FROM public.pieces WHERE tenant_id = '10000000-0000-0000-0000-00000000000b'), 0,
  'admin A no ve piezas del tenant B'
);

SELECT test_as('00000000-0000-0000-0000-0000000000b1'); -- admin B
SELECT is(
  (SELECT count(*)::int FROM public.pieces WHERE tenant_id = '10000000-0000-0000-0000-00000000000a'), 0,
  'admin B no ve piezas del tenant A'
);

-- ---------------------------------------------------------------------------
-- 2. Inserción con tenant_id ajeno (no se confía en el navegador)
-- ---------------------------------------------------------------------------
SELECT test_as('00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok(
  $$INSERT INTO public.pieces (tenant_id, nombre) VALUES ('10000000-0000-0000-0000-00000000000b', 'Intrusa')$$,
  '42501',
  NULL,
  'admin A no puede insertar una pieza con tenant_id de B'
);
SELECT lives_ok(
  $$INSERT INTO public.pieces (tenant_id, nombre) VALUES ('10000000-0000-0000-0000-00000000000a', 'Pieza A2')$$,
  'admin A sí puede insertar una pieza en su tenant'
);

-- ---------------------------------------------------------------------------
-- 3. Actualización y borrado entre tenants
-- ---------------------------------------------------------------------------
SELECT is(
  (WITH u AS (UPDATE public.pieces SET nombre = 'hackeada' WHERE id = '20000000-0000-0000-0000-00000000000b' RETURNING 1) SELECT count(*)::int FROM u),
  0,
  'admin A no puede actualizar piezas del tenant B (0 filas)'
);
SELECT is(
  (WITH d AS (DELETE FROM public.pieces WHERE id = '20000000-0000-0000-0000-00000000000b' RETURNING 1) SELECT count(*)::int FROM d),
  0,
  'admin A no puede borrar piezas del tenant B (0 filas)'
);

-- ---------------------------------------------------------------------------
-- 4. Operario: lee y crea, pero no borra piezas ni gestiona usuarios
-- ---------------------------------------------------------------------------
SELECT test_as('00000000-0000-0000-0000-0000000000a3'); -- operario A
SELECT is(
  (SELECT count(*)::int FROM public.pieces), 2,
  'operario A lee las piezas de su tenant'
);
SELECT lives_ok(
  $$INSERT INTO public.work_sessions (tenant_id, piece_id, created_by)
    VALUES ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a3')$$,
  'operario A puede registrar una sesión de trabajo'
);
SELECT lives_ok(
  $$INSERT INTO public.incidents (tenant_id, descripcion, created_by)
    VALUES ('10000000-0000-0000-0000-00000000000a', 'Fisura en pliegue', '00000000-0000-0000-0000-0000000000a3')$$,
  'operario A puede registrar una incidencia'
);
SELECT is(
  (WITH d AS (DELETE FROM public.pieces WHERE id = '20000000-0000-0000-0000-00000000000a' RETURNING 1) SELECT count(*)::int FROM d),
  0,
  'operario A NO puede borrar piezas'
);
SELECT throws_ok(
  $$INSERT INTO public.memberships (tenant_id, user_id, role)
    VALUES ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000b1', 'consulta')$$,
  '42501',
  NULL,
  'operario A NO puede gestionar membresías'
);
SELECT is(
  (WITH u AS (UPDATE public.machines SET notas = 'x' WHERE id = '30000000-0000-0000-0000-00000000000a' RETURNING 1) SELECT count(*)::int FROM u),
  0,
  'operario A NO puede editar máquinas'
);

-- ---------------------------------------------------------------------------
-- 5. Consulta: solo lectura
-- ---------------------------------------------------------------------------
SELECT test_as('00000000-0000-0000-0000-0000000000a4'); -- consulta A
SELECT is(
  (SELECT count(*)::int FROM public.pieces), 2,
  'consulta A lee las piezas de su tenant'
);
SELECT throws_ok(
  $$INSERT INTO public.pieces (tenant_id, nombre) VALUES ('10000000-0000-0000-0000-00000000000a', 'No permitida')$$,
  '42501',
  NULL,
  'consulta A NO puede insertar piezas'
);
SELECT throws_ok(
  $$INSERT INTO public.incidents (tenant_id, descripcion) VALUES ('10000000-0000-0000-0000-00000000000a', 'x')$$,
  '42501',
  NULL,
  'consulta A NO puede registrar incidencias'
);

-- ---------------------------------------------------------------------------
-- 6. admin_taller: gestiona máquinas y memberships SOLO de su taller,
--    sin autoelevarse ni crear otros admins ni tocar su propia membresía
-- ---------------------------------------------------------------------------
SELECT test_as('00000000-0000-0000-0000-0000000000a1'); -- admin A
SELECT lives_ok(
  $$INSERT INTO public.machines (tenant_id, nombre) VALUES ('10000000-0000-0000-0000-00000000000a', 'Plegadora A2')$$,
  'admin A puede crear máquinas en su tenant'
);
SELECT throws_ok(
  $$INSERT INTO public.machines (tenant_id, nombre) VALUES ('10000000-0000-0000-0000-00000000000b', 'Intrusa')$$,
  '42501',
  NULL,
  'admin A NO puede crear máquinas en el tenant B'
);
SELECT lives_ok(
  $$INSERT INTO public.memberships (tenant_id, user_id, role)
    VALUES ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000b1', 'consulta')$$,
  'admin A puede añadir una membresía no-admin en su tenant'
);
SELECT throws_ok(
  $$INSERT INTO public.memberships (tenant_id, user_id, role)
    VALUES ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', 'admin_taller')$$,
  '42501',
  NULL,
  'admin A NO puede crear otra membresía admin_taller'
);
SELECT is(
  (WITH u AS (UPDATE public.memberships SET role = 'consulta'
              WHERE tenant_id = '10000000-0000-0000-0000-00000000000a'
                AND user_id = '00000000-0000-0000-0000-0000000000a1' RETURNING 1) SELECT count(*)::int FROM u),
  0,
  'admin A NO puede modificar su propia membresía/rol'
);
SELECT throws_ok(
  $$INSERT INTO public.platform_admins (user_id) VALUES ('00000000-0000-0000-0000-0000000000a1')$$,
  '42501',
  NULL,
  'admin A NO puede crearse superadmin (platform_admins sin policies de escritura)'
);

-- ---------------------------------------------------------------------------
-- 7. platform_admin: acceso global
-- ---------------------------------------------------------------------------
SELECT test_as('00000000-0000-0000-0000-000000000099'); -- root
SELECT is(
  (SELECT count(*)::int FROM public.pieces), 3,
  'platform_admin ve las piezas de todos los tenants'
);
SELECT lives_ok(
  $$INSERT INTO public.tenants (nombre, plan) VALUES ('Taller C', 'pro')$$,
  'platform_admin puede crear tenants'
);

-- ---------------------------------------------------------------------------
-- 8. Protección de campos de propiedad (trigger)
-- ---------------------------------------------------------------------------
SELECT test_as('00000000-0000-0000-0000-0000000000a1');
SELECT throws_ok(
  $$UPDATE public.pieces SET tenant_id = '10000000-0000-0000-0000-00000000000b'
    WHERE id = '20000000-0000-0000-0000-00000000000a'$$,
  'P0001',
  'tenant_id no puede modificarse',
  'el trigger impide mover una pieza a otro tenant'
);

SELECT test_reset();

SELECT * FROM finish();
ROLLBACK;
