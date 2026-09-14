import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// One-off provisioning of the audit account. The password is never passed in or
// returned: it is read from the AUDIT_ACCOUNT_PASSWORD project secret.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const email = "mrachlyn+auditoria@gmail.com";
    const password = Deno.env.get("AUDIT_ACCOUNT_PASSWORD");
    if (!password) throw new Error("AUDIT_ACCOUNT_PASSWORD not set");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: list } = await admin.auth.admin.listUsers();
    let user = list?.users?.find((u) => u.email?.toLowerCase() === email);

    if (user) {
      const upd = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
      if (upd.error) throw upd.error;
      user = upd.data.user;
    } else {
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error) throw created.error;
      user = created.data.user;
    }

    await admin.from("user_roles").upsert(
      { user_id: user!.id, role: "admin" },
      { onConflict: "user_id,role" },
    );

    return new Response(JSON.stringify({ ok: true, user_id: user?.id, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
