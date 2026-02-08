
-- Criar tabela de solicitações de acesso
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as solicitações
CREATE POLICY "Admins can view all access requests"
ON public.access_requests FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins podem atualizar solicitações (aprovar/rejeitar)
CREATE POLICY "Admins can update access requests"
ON public.access_requests FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Usuários podem ver apenas sua própria solicitação
CREATE POLICY "Users can view own access request"
ON public.access_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Qualquer autenticado pode inserir (criar solicitação)
CREATE POLICY "Authenticated users can insert access request"
ON public.access_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Função para contar solicitações pendentes (apenas admins)
CREATE OR REPLACE FUNCTION public.count_pending_access_requests()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.access_requests
  WHERE status = 'pending';
$$;

-- Função para aprovar solicitação de acesso (cria role 'user')
CREATE OR REPLACE FUNCTION public.approve_access_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_user_id UUID;
  req_email TEXT;
  req_full_name TEXT;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve access requests';
  END IF;

  -- Buscar dados da solicitação
  SELECT user_id, email, full_name INTO req_user_id, req_email, req_full_name
  FROM public.access_requests
  WHERE id = request_id AND status = 'pending';

  IF req_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Atualizar status da solicitação
  UPDATE public.access_requests
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = request_id;

  -- Adicionar role 'user' se não existir
  INSERT INTO public.user_roles (user_id, role)
  VALUES (req_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Criar perfil se não existir
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (req_user_id, req_full_name)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Índices para performance
CREATE INDEX idx_access_requests_status ON public.access_requests(status);
CREATE INDEX idx_access_requests_user_id ON public.access_requests(user_id);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_requests;
