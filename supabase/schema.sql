-- ==========================================
-- ESTRUCTURA DE TABLA PROFILES Y TRIGGERS
-- Ejecutar en el SQL Editor de tu Dashboard de Supabase
-- ==========================================

-- 1. Crear la tabla profiles en el esquema public
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'editor')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  telefono TEXT
);

-- 2. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes si las hay (para re-ejecución limpia)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;

-- 4. Crear políticas RLS
-- Permitir que cualquiera vea los perfiles (necesario para accesos rápidos en login)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Permitir que cada usuario edite su propio perfil (nombre, etc.)
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Permitir control total a administradores activos
CREATE POLICY "Admins can do everything on profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  )
);

-- 5. Disparador de sincronización de perfiles
-- Se ejecuta automáticamente tras cada registro en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email, rol, activo, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'name', 'Nuevo Usuario'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'rol', 'editor'),
    TRUE,
    COALESCE(new.created_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    rol = EXCLUDED.rol;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- ESTRUCTURA DE TABLA COVERAGES (ALTER TABLE)
-- Ejecutar en el SQL Editor de tu Dashboard de Supabase
-- ==========================================

-- Añadir las columnas faltantes una a una de forma segura
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS date_time TEXT NOT NULL DEFAULT '';
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS assignees JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS multimedia JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS shared_links JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS publications JSONB NOT NULL DEFAULT '{"portal": {"status": "pending"}, "facebook": {"status": "pending"}, "instagram": {"status": "pending"}, "youtube": {"status": "pending"}}'::jsonb;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS activities JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS programs JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS formats JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS logistics_info TEXT;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Asegurar que RLS esté habilitado y aplicar las políticas
ALTER TABLE public.coverages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coverages are viewable by authenticated users" ON public.coverages;
DROP POLICY IF EXISTS "Coverages can be inserted by authenticated users" ON public.coverages;
DROP POLICY IF EXISTS "Coverages can be updated by authenticated users" ON public.coverages;
DROP POLICY IF EXISTS "Coverages can be deleted by authenticated users" ON public.coverages;

CREATE POLICY "Coverages are viewable by authenticated users" ON public.coverages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coverages can be inserted by authenticated users" ON public.coverages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Coverages can be updated by authenticated users" ON public.coverages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Coverages can be deleted by authenticated users" ON public.coverages FOR DELETE TO authenticated USING (true);


-- ==========================================
-- ELIMINACIÓN DE USUARIOS (RPC SECURE)
-- ==========================================

CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id UUID)
RETURNS VOID AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Obtener el rol del usuario que realiza la llamada
  SELECT rol INTO caller_role FROM public.profiles WHERE id = auth.uid() AND activo = true;

  -- Validar que el ejecutor sea un administrador activo
  IF caller_role <> 'admin' OR caller_role IS NULL THEN
    RAISE EXCEPTION 'Solo los administradores activos pueden eliminar usuarios.';
  END IF;

  -- Eliminar de auth.users (cascada automática a public.profiles)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- ESTRUCTURA DE TABLA CATEGORIES Y MIGRACIONES
-- ==========================================

-- 1. Crear tabla categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT 'Folder',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#3b82f6';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'Folder';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Agregar category_id a coverages
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para categories
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON public.categories;
DROP POLICY IF EXISTS "Categories can be inserted by admins" ON public.categories;
DROP POLICY IF EXISTS "Categories can be updated by admins" ON public.categories;
DROP POLICY IF EXISTS "Categories can be deleted by admins" ON public.categories;

CREATE POLICY "Categories are viewable by authenticated users" 
ON public.categories FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Categories can be inserted by admins" 
ON public.categories FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  )
);

CREATE POLICY "Categories can be updated by admins" 
ON public.categories FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  )
);

CREATE POLICY "Categories can be deleted by admins" 
ON public.categories FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  )
);


-- ==========================================
-- ESTRUCTURA DEL MÓDULO PROPUESTAS (ETAPA 4.1)
-- ==========================================

-- 1. Tablas de catálogo generales
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.source_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en catálogos
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_types ENABLE ROW LEVEL SECURITY;

-- 2. Sembrado de catálogos con valores iniciales
INSERT INTO public.programs (name) VALUES
  ('Bien Despiertos'),
  ('Noticiero Mañana'),
  ('Noticiero Tarde'),
  ('Digital')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.formats (name) VALUES
  ('Telefónica'),
  ('Videollamada'),
  ('Presencial'),
  ('Móvil'),
  ('Grabada'),
  ('Vivo redes')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.source_types (name) VALUES
  ('WhatsApp'),
  ('Prensa'),
  ('Web'),
  ('Radar'),
  ('Otro')
ON CONFLICT (name) DO NOTHING;

-- 3. Tabla proposals (Propuestas)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number INT GENERATED BY DEFAULT AS IDENTITY UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  date_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'requiere_cambios')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  source_type_id UUID REFERENCES public.source_types(id) ON DELETE SET NULL,
  source_name TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- 4. Tabla proposal_decisions (Auditoría de estados)
CREATE TABLE IF NOT EXISTS public.proposal_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  decider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'requiere_cambios')),
  note TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proposal_decisions ENABLE ROW LEVEL SECURITY;

-- 5. Tablas puente N:M para asignados, programas y formatos
CREATE TABLE IF NOT EXISTS public.proposal_assignments (
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (proposal_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.proposal_programs (
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (proposal_id, program_id)
);

CREATE TABLE IF NOT EXISTS public.proposal_formats (
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  format_id UUID REFERENCES public.formats(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (proposal_id, format_id)
);

ALTER TABLE public.proposal_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_formats ENABLE ROW LEVEL SECURITY;

-- 6. Tabla proposal_comments (Comentarios de propuestas)
CREATE TABLE IF NOT EXISTS public.proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;

-- 7. Tablas globales polimórficas (media y shared_links)
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('photo', 'video', 'audio', 'document')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  coverage_id UUID REFERENCES public.coverages(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_target CHECK (
    (coverage_id IS NOT NULL AND proposal_id IS NULL) OR 
    (proposal_id IS NOT NULL AND coverage_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  comments TEXT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  coverage_id UUID REFERENCES public.coverages(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  CONSTRAINT fk_links_target CHECK (
    (coverage_id IS NOT NULL AND proposal_id IS NULL) OR 
    (proposal_id IS NOT NULL AND coverage_id IS NULL)
  )
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- 8. Relación con Coberturas
ALTER TABLE public.coverages ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL UNIQUE;

-- 9. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_proposals_author ON public.proposals(author_id);
CREATE INDEX IF NOT EXISTS idx_proposals_category ON public.proposals(category_id);
CREATE INDEX IF NOT EXISTS idx_proposals_source_type ON public.proposals(source_type_id);
CREATE INDEX IF NOT EXISTS idx_proposals_active ON public.proposals(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposal_decisions_proposal ON public.proposal_decisions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_assignments_profile ON public.proposal_assignments(profile_id);
CREATE INDEX IF NOT EXISTS idx_proposal_programs_prog ON public.proposal_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_proposal_formats_form ON public.proposal_formats(format_id);
CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal ON public.proposal_comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_media_proposal ON public.media(proposal_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_proposal ON public.shared_links(proposal_id);

-- 10. Políticas RLS
DROP POLICY IF EXISTS "Authenticated users can do all on programs" ON public.programs;
DROP POLICY IF EXISTS "Authenticated users can do all on formats" ON public.formats;
DROP POLICY IF EXISTS "Authenticated users can do all on source_types" ON public.source_types;
DROP POLICY IF EXISTS "Authenticated users can do all on proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can do all on decisions" ON public.proposal_decisions;
DROP POLICY IF EXISTS "Authenticated users can do all on assignments" ON public.proposal_assignments;
DROP POLICY IF EXISTS "Authenticated users can do all on proposal_programs" ON public.proposal_programs;
DROP POLICY IF EXISTS "Authenticated users can do all on proposal_formats" ON public.proposal_formats;
DROP POLICY IF EXISTS "Authenticated users can do all on comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Authenticated users can do all on media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can do all on shared links" ON public.shared_links;

CREATE POLICY "Authenticated users can do all on programs" ON public.programs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on formats" ON public.formats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on source_types" ON public.source_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on proposals" ON public.proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on decisions" ON public.proposal_decisions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on assignments" ON public.proposal_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on proposal_programs" ON public.proposal_programs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on proposal_formats" ON public.proposal_formats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on comments" ON public.proposal_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on media" ON public.media FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do all on shared links" ON public.shared_links FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ==========================================
-- ESTRUCTURA DE TABLA PROPOSAL_MEDIA (ETAPA 4.4)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.proposal_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proposal_media ENABLE ROW LEVEL SECURITY;

-- Select/All Policies
DROP POLICY IF EXISTS "Authenticated users can do all on proposal_media" ON public.proposal_media;
CREATE POLICY "Authenticated users can do all on proposal_media" 
ON public.proposal_media FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_proposal_media_proposal ON public.proposal_media(proposal_id);


-- ==========================================
-- ACTUALIZACIÓN DE RESTRICCIONES DE ESTADO (ETAPA 1 MIGRACIÓN)
-- ==========================================

-- Drop old status constraints
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE public.proposal_decisions DROP CONSTRAINT IF EXISTS proposal_decisions_status_check;

-- Add updated constraints (pendiente, en_revision, rechazada, aprobada)
ALTER TABLE public.proposals ADD CONSTRAINT proposals_status_check 
  CHECK (status IN ('pendiente', 'en_revision', 'rechazada', 'aprobada'));

ALTER TABLE public.proposal_decisions ADD CONSTRAINT proposal_decisions_status_check 
  CHECK (status IN ('pendiente', 'en_revision', 'rechazada', 'aprobada'));


-- ==========================================
-- ESTRUCTURA DE TABLA PRODUCTIONS (ETAPA 1 MIGRACIÓN)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID UNIQUE REFERENCES public.proposals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  journalist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  photographer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cameraman_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  media_outlets JSONB DEFAULT '[]'::jsonb,
  format_id UUID REFERENCES public.formats(id) ON DELETE SET NULL,
  priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  production_date DATE,
  production_time TIME,
  location TEXT,
  observations TEXT,
  multimedia JSONB DEFAULT '[]'::jsonb,
  shared_links JSONB DEFAULT '[]'::jsonb,
  operational_status VARCHAR(50) CHECK (operational_status IN ('pendiente_planificacion', 'programada', 'finalizada', 'suspendida')) DEFAULT 'pendiente_planificacion',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para productions
DROP POLICY IF EXISTS "Authenticated users can do all on productions" ON public.productions;
CREATE POLICY "Authenticated users can do all on productions" 
ON public.productions FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_productions_proposal ON public.productions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_productions_journalist ON public.productions(journalist_id);
CREATE INDEX IF NOT EXISTS idx_productions_date ON public.productions(production_date);




