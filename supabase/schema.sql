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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes si las hay (para re-ejecución limpia)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;

-- 4. Crear políticas RLS
-- Permitir que cualquier usuario autenticado vea los perfiles de todos (necesario para ver asignatarios, autores de comentarios, etc.)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
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

