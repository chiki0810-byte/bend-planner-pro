-- ============================================================================
-- Bend Planner Pro SaaS — FASE 1: esquema multiempresa y aislamiento por RLS
-- ============================================================================
-- NOTA DE UBICACIÓN: este archivo es la migración versionada de Fase 1. Vive
-- bajo supabase/tests/sql/ (y no bajo supabase/migrations/) porque en este
-- proyecto la carpeta supabase/migrations/ está gestionada por la plataforma y
-- todo archivo allí se aplica contra la base cloud, lo que esta fase prohíbe
-- expresamente. Para aplicarla en local/test, copia el contenido tal cual al
-- SQL Editor o síguela con `supabase db reset` en un proyecto local (ver
-- docs/saas-fase1.md). NO la ejecutes en la base cloud/producción.
--
-- Alcance: SOLO esquema. No migra datos del almacenamiento local (Dexie/SQLite).
-- Diseño de seguridad:
--   * tenant_id nunca se confía al navegador: toda policy valida la pertenencia
--     del usuario al tenant mediante funciones SECURITY DEFINER.
--   * No se usa service_role desde el cliente.
--   * Los campos de propiedad (tenant_id, user_id, created_by) quedan
--     protegidos por trigger contra cambios no autorizados en UPDATE.
--   * platform_admins es una allowlist separada: el superadmin global no
--     depende de pertenecer a ningún tenant.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tipos enumerados
-- ---------------------------------------------------------------------------
CREATE TYPE public.tenant_status AS ENUM ('activo', 'suspendido', 'cancelado');
CREATE TYPE public.tenant_plan AS ENUM ('basico', 'taller', 'pro', 'personalizado');
CREATE TYPE public.member_role AS ENUM ('admin_taller', 'supervisor', 'operario', 'consulta');
CREATE TYPE public.member_status AS ENUM ('activo', 'suspendido');

-- ---------------------------------------------------------------------------
-- 2. Funciones auxiliares SECURITY DEFINER (search_path fijo, sin recursión)
-- ---------------------------------------------------------------------------
-- Todas leen tablas con RLS activado; al ser SECURITY DEFINER se ejecutan con
-- los permisos del propietario y no disparan las policies de la tabla leída,
-- evitando la recursión infinita de memberships -> memberships.

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.memberships
  WHERE user_id = auth.uid()
    AND status = 'activo';
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_tenant_role()
RETURNS public.member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.memberships
  WHERE user_id = auth.uid()
    AND tenant_id = public.current_user_tenant_id()
    AND status = 'activo'
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 3. Tablas
-- ---------------------------------------------------------------------------

-- 3.1 tenants: una fila por empresa/taller. Solo platform_admins la gestiona.
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  status public.tenant_status NOT NULL DEFAULT 'activo',
  plan public.tenant_plan NOT NULL DEFAULT 'basico',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2 platform_admins: allowlist de superadministradores globales.
--    PK = user_id (referencia a auth.users). Sin columnas editables por el
--    usuario; el alta/baja se hace solo desde SQL Editor autenticado/privado.
CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.3 memberships: pertenencia usuario<->tenant con rol y estado.
--    Un usuario puede tener varias membresías, pero solo una marcada como
--    principal (is_primary); la principal define su tenant activo.
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'operario',
  status public.member_status NOT NULL DEFAULT 'activo',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- Un usuario solo puede tener UNA membresía principal.
CREATE UNIQUE INDEX memberships_one_primary_per_user
  ON public.memberships (user_id)
  WHERE is_primary;

-- 3.4 profiles: datos visibles del usuario + su tenant principal.
--    user_id referencia auth.users con ON DELETE CASCADE (excepción permitida
--    para profiles). tenant_id debe coincidir con una membresía activa.
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  nombre text NOT NULL DEFAULT '',
  telefono text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.5 machines: máquinas del taller (plegadoras, etc.).
CREATE TABLE public.machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'plegadora',
  capacidad_ton numeric,
  longitud_max_mm numeric,
  notas text,
  activa boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.6 pieces: piezas de chapa guardadas.
CREATE TABLE public.pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  material text,
  espesor_mm numeric,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.7 bends: pliegues de una pieza (hija de pieces).
CREATE TABLE public.bends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  piece_id uuid NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  angulo_deg numeric,
  radio_interior_mm numeric,
  k_factor numeric,
  longitud_mm numeric,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.8 templates: plantillas reutilizables de piezas.
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.9 work_sessions: sesiones de trabajo (ejecución de piezas en máquina).
CREATE TABLE public.work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  piece_id uuid REFERENCES public.pieces(id) ON DELETE SET NULL,
  machine_id uuid REFERENCES public.machines(id) ON DELETE SET NULL,
  iniciada_at timestamptz NOT NULL DEFAULT now(),
  finalizada_at timestamptz,
  notas text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.10 incidents: incidencias registradas durante el trabajo.
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  work_session_id uuid REFERENCES public.work_sessions(id) ON DELETE SET NULL,
  piece_id uuid REFERENCES public.pieces(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  gravedad text NOT NULL DEFAULT 'media',
  resuelta boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. GRANTs (obligatorios: la Data API no concede privilegios por defecto)
-- ---------------------------------------------------------------------------
-- Ninguna tabla es de lectura anónima: todo pasa por authenticated + RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pieces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bends TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;

GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.platform_admins TO service_role;
GRANT ALL ON public.memberships TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.machines TO service_role;
GRANT ALL ON public.pieces TO service_role;
GRANT ALL ON public.bends TO service_role;
GRANT ALL ON public.templates TO service_role;
GRANT ALL ON public.work_sessions TO service_role;
GRANT ALL ON public.incidents TO service_role;

-- Funciones auxiliares: solo authenticated puede ejecutarlas.
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_ids() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_tenant_id() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_tenant_role() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_role() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Índices en tenant_id y claves de relación
-- ---------------------------------------------------------------------------
CREATE INDEX memberships_tenant_id_idx ON public.memberships (tenant_id);
CREATE INDEX memberships_user_id_idx ON public.memberships (user_id);
CREATE INDEX profiles_tenant_id_idx ON public.profiles (tenant_id);
CREATE INDEX machines_tenant_id_idx ON public.machines (tenant_id);
CREATE INDEX pieces_tenant_id_idx ON public.pieces (tenant_id);
CREATE INDEX pieces_created_by_idx ON public.pieces (created_by);
CREATE INDEX bends_tenant_id_idx ON public.bends (tenant_id);
CREATE INDEX bends_piece_id_idx ON public.bends (piece_id);
CREATE INDEX templates_tenant_id_idx ON public.templates (tenant_id);
CREATE INDEX work_sessions_tenant_id_idx ON public.work_sessions (tenant_id);
CREATE INDEX work_sessions_piece_id_idx ON public.work_sessions (piece_id);
CREATE INDEX work_sessions_machine_id_idx ON public.work_sessions (machine_id);
CREATE INDEX incidents_tenant_id_idx ON public.incidents (tenant_id);
CREATE INDEX incidents_work_session_id_idx ON public.incidents (work_session_id);

-- ---------------------------------------------------------------------------
-- 6. Trigger updated_at (pieces y bends, según especificación)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pieces_set_updated_at
  BEFORE UPDATE ON public.pieces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER bends_set_updated_at
  BEFORE UPDATE ON public.bends
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Trigger de protección de campos de propiedad
-- ---------------------------------------------------------------------------
-- RLS por sí sola NO puede impedir que un usuario con permiso de UPDATE cambie
-- tenant_id / user_id / created_by de una fila a la que tiene acceso (p. ej.
-- mover una pieza a otro tenant o apropiarse de autoría). Este trigger es el
-- mecanismo mínimo que lo garantiza: rechaza cualquier UPDATE que modifique
-- esos campos. Se documenta como excepción deliberada a "solo RLS".
CREATE OR REPLACE FUNCTION public.protect_ownership_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'tenant_id no puede modificarse';
  END IF;
  IF TG_TABLE_NAME IN ('memberships', 'platform_admins', 'profiles') THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'user_id no puede modificarse';
    END IF;
  END IF;
  IF TG_TABLE_NAME IN ('machines', 'pieces', 'bends', 'templates', 'work_sessions', 'incidents') THEN
    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'created_by no puede modificarse';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER memberships_protect_ownership
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.protect_ownership_fields();

CREATE TRIGGER profiles_protect_ownership
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_ownership_fields();

CREATE TRIGGER machines_protect_ownership
  BEFORE UPDATE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.protect_ownership_fields();

CREATE TRIGGER pieces_protect_ownership
  BEFORE UPDATE ON public.pieces
  FOR EACH ROW EXECUTE FUNCTION public.protect_ownership_fields();

CREATE TRIGGER bends_protect_ownership
  BEFORE UPDATE ON public.bends
  FOR EACH ROW EXECUTE FUNCTION public.protect_ownership_fields();

CREATE TRIGGER templates_protect_ownership
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.protect_ownership_fields();

CREATE TRIGGER work_sessions_protect_ownership
  BEFORE UPDATE ON public.work_sessions
  FOR EACH ROW EXECUTE FUNCTION public.protect_ownership_fields();

CREATE TRIGGER incidents_protect_ownership
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.protect_ownership_fields();

-- ---------------------------------------------------------------------------
-- 8. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- 8.1 tenants: lectura para miembros del tenant; gestión solo platform_admins.
CREATE POLICY tenants_select ON public.tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_tenant_ids()) OR public.is_platform_admin());

CREATE POLICY tenants_insert ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY tenants_update ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY tenants_delete ON public.tenants
  FOR DELETE TO authenticated
  USING (public.is_platform_admin());

-- 8.2 platform_admins: cada usuario solo ve si él mismo es admin; la escritura
--     queda cerrada por RLS (sin policies de escritura) y se realiza solo con
--     service_role / SQL Editor. Así nadie puede autoelevarse desde la API.
CREATE POLICY platform_admins_select ON public.platform_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 8.3 memberships:
--   SELECT: ves tus propias membresías y las de tus tenants.
--   INSERT: admin_taller del tenant destino (o platform_admin). El rol que se
--     asigna nunca puede ser admin_taller salvo que lo asigne un
--     platform_admin, para impedir que un admin_taller cree otros admins.
--   UPDATE: admin_taller del tenant (o platform_admin), pero un admin_taller
--     NO puede modificar su propia membresía ni elevar roles a admin_taller.
--   DELETE: admin_taller del tenant (o platform_admin), nunca la propia.
CREATE POLICY memberships_select ON public.memberships
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT public.get_user_tenant_ids())
    OR public.is_platform_admin()
  );

CREATE POLICY memberships_insert ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.current_user_tenant_role() = 'admin_taller'
      AND role <> 'admin_taller'
    )
  );

CREATE POLICY memberships_update ON public.memberships
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.current_user_tenant_role() = 'admin_taller'
      AND user_id <> auth.uid()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.current_user_tenant_role() = 'admin_taller'
      AND user_id <> auth.uid()
      AND role <> 'admin_taller'
    )
  );

CREATE POLICY memberships_delete ON public.memberships
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.current_user_tenant_role() = 'admin_taller'
      AND user_id <> auth.uid()
    )
  );

-- 8.4 profiles: lectura dentro del tenant; cada usuario edita solo su perfil
--     (nombre/teléfono). tenant_id queda protegido por el trigger de
--     propiedad; el INSERT exige que el tenant declarado sea uno donde el
--     usuario tiene membresía activa (no se confía en el valor del navegador).
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT public.get_user_tenant_ids())
    OR public.is_platform_admin()
  );

CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR tenant_id IN (SELECT public.get_user_tenant_ids()))
  );

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_platform_admin());

-- 8.5 machines: lectura para todo miembro del tenant; escritura solo
--     admin_taller del tenant (o platform_admin).
CREATE POLICY machines_select ON public.machines
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()) OR public.is_platform_admin());

CREATE POLICY machines_insert ON public.machines
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  );

CREATE POLICY machines_update ON public.machines
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  );

CREATE POLICY machines_delete ON public.machines
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  );

-- 8.6 pieces: lectura para todos los roles del tenant; inserción para
--     admin_taller/supervisor/operario; edición admin_taller/supervisor;
--     borrado solo admin_taller (operario NO).
CREATE POLICY pieces_select ON public.pieces
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()) OR public.is_platform_admin());

CREATE POLICY pieces_insert ON public.pieces
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor', 'operario'))
  );

CREATE POLICY pieces_update ON public.pieces
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
  );

CREATE POLICY pieces_delete ON public.pieces
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  );

-- 8.7 bends: mismas reglas que pieces (hija de pieces).
CREATE POLICY bends_select ON public.bends
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()) OR public.is_platform_admin());

CREATE POLICY bends_insert ON public.bends
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor', 'operario'))
  );

CREATE POLICY bends_update ON public.bends
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
  );

CREATE POLICY bends_delete ON public.bends
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  );

-- 8.8 templates: lectura para todos; escritura admin_taller/supervisor;
--     borrado admin_taller.
CREATE POLICY templates_select ON public.templates
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()) OR public.is_platform_admin());

CREATE POLICY templates_insert ON public.templates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
  );

CREATE POLICY templates_update ON public.templates
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
  );

CREATE POLICY templates_delete ON public.templates
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  );

-- 8.9 work_sessions: lectura para todos; operario puede crear y cerrar las
--     suyas; admin_taller/supervisor gestionan todas las del tenant.
CREATE POLICY work_sessions_select ON public.work_sessions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()) OR public.is_platform_admin());

CREATE POLICY work_sessions_insert ON public.work_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor', 'operario'))
  );

CREATE POLICY work_sessions_update ON public.work_sessions
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
    OR created_by = auth.uid()
  );

CREATE POLICY work_sessions_delete ON public.work_sessions
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  );

-- 8.10 incidents: lectura para todos; operario puede registrar y editar las
--      suyas; admin_taller/supervisor gestionan todas; borrado admin_taller.
CREATE POLICY incidents_select ON public.incidents
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()) OR public.is_platform_admin());

CREATE POLICY incidents_insert ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor', 'operario'))
  );

CREATE POLICY incidents_update ON public.incidents
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() IN ('admin_taller', 'supervisor'))
    OR created_by = auth.uid()
  );

CREATE POLICY incidents_delete ON public.incidents
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin()
    OR (tenant_id IN (SELECT public.get_user_tenant_ids()) AND public.current_user_tenant_role() = 'admin_taller')
  );
