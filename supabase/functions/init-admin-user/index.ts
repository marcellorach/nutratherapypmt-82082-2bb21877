
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Lidar com requisições CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Verificar se é uma solicitação autorizada
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    const email = 'mrachlyn@gmail.com'
    const password = 'nutra12'
    const firstName = 'Admin'
    const lastName = 'NutraTherapy'
    
    // Verifica se o usuário já existe
    const { data: existingUsers, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', (await supabase.auth.admin.getUserByEmail(email)).data?.user?.id ?? '')
    
    if (searchError) {
      throw searchError
    }
    
    // Se o usuário não existir, cria-o
    if (!existingUsers || existingUsers.length === 0) {
      // Cria o usuário
      const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      })
      
      if (createError) {
        throw createError
      }
      
      if (user?.user) {
        // Adiciona a função de administrador
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.user.id,
            role: 'admin',
          })
        
        if (roleError) {
          throw roleError
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Usuário administrador criado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    } else {
      // Usuário já existe
      return new Response(
        JSON.stringify({ success: true, message: 'Usuário administrador já existe' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    return new Response(
      JSON.stringify({ success: false, message: 'Falha ao criar usuário administrador' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
