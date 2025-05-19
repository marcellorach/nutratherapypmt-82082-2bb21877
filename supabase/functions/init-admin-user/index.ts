
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
    console.log('Iniciando função de inicialização do administrador')
    
    const email = 'mrachlyn@gmail.com'
    const password = 'nutra12'
    const firstName = 'Admin'
    const lastName = 'NutraTherapy'
    
    // Verificar se o usuário já existe através do email
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail(email)
    
    if (getUserError) {
      console.log('Erro ao verificar usuário existente:', getUserError)
      throw getUserError
    }
    
    console.log('Resultado da verificação do usuário:', existingUser ? 'Usuário encontrado' : 'Usuário não encontrado')
    
    // Se o usuário não existir, cria-o
    if (!existingUser?.user) {
      console.log('Criando novo usuário administrador')
      
      // Cria o usuário com confirmação de email ativada
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
        console.log('Erro ao criar usuário:', createError)
        throw createError
      }
      
      console.log('Usuário criado com sucesso:', user?.user?.id)
      
      if (user?.user) {
        // Adiciona a função de administrador
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.user.id,
            role: 'admin',
          })
        
        if (roleError) {
          console.log('Erro ao adicionar função de administrador:', roleError)
          throw roleError
        }
        
        console.log('Função de administrador adicionada com sucesso')
        
        return new Response(
          JSON.stringify({ success: true, message: 'Usuário administrador criado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    } else {
      // Usuário já existe, vamos verificar se tem o papel de administrador
      console.log('Usuário já existe, verificando papel de administrador')
      
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', existingUser.user.id)
        .eq('role', 'admin')
      
      if (rolesError) {
        console.log('Erro ao verificar papel de administrador:', rolesError)
        throw rolesError
      }
      
      // Se o usuário não tiver o papel de administrador, adicionamos
      if (!roles || roles.length === 0) {
        console.log('Adicionando papel de administrador para usuário existente')
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: existingUser.user.id,
            role: 'admin',
          })
        
        if (roleError) {
          console.log('Erro ao adicionar função de administrador para usuário existente:', roleError)
          throw roleError
        }
        
        console.log('Função de administrador adicionada com sucesso para usuário existente')
      } else {
        console.log('Usuário já possui papel de administrador')
      }
      
      // Atualizar a senha do usuário para garantir que seja a correta
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.user.id,
        { password }
      )
      
      if (updateError) {
        console.log('Erro ao atualizar senha:', updateError)
        throw updateError
      }
      
      console.log('Senha atualizada com sucesso')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário administrador já existe e foi atualizado', 
          user: existingUser.user.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    return new Response(
      JSON.stringify({ success: false, message: 'Falha ao criar usuário administrador' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
    
  } catch (error) {
    console.error('Erro na função de inicialização do administrador:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
