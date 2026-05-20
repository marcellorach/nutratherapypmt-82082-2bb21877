import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, password, role = "admin" } = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Try to find existing user
    const { data: list } = await admin.auth.admin.listUsers();
    let user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (user) {
      const upd = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
      if (upd.error) throw upd.error;
      user = upd.data.user;
    } else {
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error) throw created.error;
      user = created.data.user;
    }

    if (user) {
      await admin.from("user_roles").upsert(
        { user_id: user.id, role },
        { onConflict: "user_id,role" },
      );
      await admin.from("profiles").upsert(
        { user_id: user.id, full_name: email },
        { onConflict: "user_id" },
      );
    }

    return new Response(JSON.stringify({ ok: true, user_id: user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});