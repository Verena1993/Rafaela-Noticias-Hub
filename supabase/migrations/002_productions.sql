-- ==========================================
-- MIGRACIÓN ETAPA 1: TABLA PRODUCTIONS Y RESTRICCIONES
-- ==========================================

-- 1. Crear tabla productions si no existe
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

-- 2. Actualizar restricciones de estado en proposals y proposal_decisions
-- Remover restricciones viejas
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE public.proposal_decisions DROP CONSTRAINT IF EXISTS proposal_decisions_status_check;

-- Aplicar nuevas restricciones (pendiente, en_revision, rechazada, aprobada)
ALTER TABLE public.proposals ADD CONSTRAINT proposals_status_check 
  CHECK (status IN ('pendiente', 'en_revision', 'rechazada', 'aprobada'));

ALTER TABLE public.proposal_decisions ADD CONSTRAINT proposal_decisions_status_check 
  CHECK (status IN ('pendiente', 'en_revision', 'rechazada', 'aprobada'));

-- 3. Migrar datos existentes de coverages a productions de forma segura
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coverages' AND schemaname = 'public') THEN
    INSERT INTO public.productions (
      id,
      proposal_id,
      title,
      description,
      category_id,
      journalist_id,
      priority,
      production_date,
      production_time,
      location,
      observations,
      multimedia,
      shared_links,
      operational_status
    )
    SELECT 
      c.id,
      c.proposal_id,
      c.title,
      c.description,
      c.category_id,
      NULLIF(c.assignees->>0, '')::UUID,
      'medium',
      CASE WHEN c.date_time LIKE '%T%' THEN SPLIT_PART(c.date_time, 'T', 1)::DATE ELSE NULL END,
      CASE WHEN c.date_time LIKE '%T%' THEN SPLIT_PART(c.date_time, 'T', 2)::TIME ELSE NULL END,
      c.location,
      c.observations,
      c.multimedia,
      c.shared_links,
      CASE c.status 
        WHEN 'pending_confirmation' THEN 'pendiente_planificacion' 
        WHEN 'confirmed' THEN 'programada' 
        WHEN 'in_redaction' THEN 'programada' 
        WHEN 'published' THEN 'finalizada' 
        ELSE 'pendiente_planificacion' 
      END
    FROM public.coverages c
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
