
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
    
    // Procurar o usuário pelo email diretamente, sem usar getUserByEmail
    const { data: existingUsers, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    
    if (searchError) {
      console.log('Erro ao procurar usuário existente:', searchError)
    }
    
    let userId = null
    
    // Se o usuário não existir pelos perfis, verificar na autenticação
    if (!existingUsers) {
      const { data: authUserData, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.log('Erro ao listar usuários:', authError)
        throw authError
      }
      
      const existingUser = authUserData.users.find(user => user.email === email)
      
      if (existingUser) {
        userId = existingUser.id
        console.log('Usuário encontrado na autenticação:', userId)
      } else {
        console.log('Usuário não encontrado, criando novo usuário')
        
        // Cria o usuário com confirmação de email ativada
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
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
        
        console.log('Usuário criado com sucesso:', newUser?.user?.id)
        
        if (newUser?.user) {
          userId = newUser.user.id
        }
      }
    } else {
      userId = existingUsers.id
      console.log('Usuário já existe no perfil:', userId)
      
      // Atualizar a senha do usuário para garantir que seja a correta
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      )
      
      if (updateError) {
        console.log('Erro ao atualizar senha:', updateError)
        throw updateError
      }
      
      console.log('Senha atualizada com sucesso')
    }
    
    if (userId) {
      // Verificar se o usuário já tem o papel de administrador
      const { data: adminRoles, error: adminRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
      
      if (adminRolesError) {
        console.log('Erro ao verificar papel de administrador:', adminRolesError)
        throw adminRolesError
      }
      
      // Se o usuário não tiver o papel de administrador, adicionamos
      if (!adminRoles || adminRoles.length === 0) {
        console.log('Adicionando papel de administrador para usuário')
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin',
          })
        
        if (roleError) {
          console.log('Erro ao adicionar função de administrador:', roleError)
          throw roleError
        }
        
        console.log('Função de administrador adicionada com sucesso')
      } else {
        console.log('Usuário já possui papel de administrador')
      }
      
      // Verificar se o usuário já tem o papel de veterinário
      const { data: vetRoles, error: vetRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'veterinarian')
      
      if (vetRolesError) {
        console.log('Erro ao verificar papel de veterinário:', vetRolesError)
        throw vetRolesError
      }
      
      // Se o usuário não tiver o papel de veterinário, adicionamos
      if (!vetRoles || vetRoles.length === 0) {
        console.log('Adicionando papel de veterinário para usuário')
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'veterinarian',
          })
        
        if (roleError) {
          console.log('Erro ao adicionar função de veterinário:', roleError)
          throw roleError
        }
        
        console.log('Função de veterinário adicionada com sucesso')
      } else {
        console.log('Usuário já possui papel de veterinário')
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário administrador configurado com sucesso', 
          user: userId 
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
