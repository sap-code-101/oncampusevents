// import { createClient } from "https://esm.sh/@supabase/supabase-js@2"



// const getDomain = (email: string) => {
//   return '@' + email.substring(email.lastIndexOf('@') + 1)
// }

// Deno.serve(async (req: any) => {
//   const corsHeaders = {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//   }
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders })
//   }

//   try {
//     // 1. VERIFY THE HOOK SECRET
//     const authHookSecret = Deno.env.get('AUTH-HOOK-SECRET')
//     const authHeader = req.headers.get('Authorization')
//     if (!authHeader || authHeader !== `Bearer ${authHookSecret}`) {
//       throw new Error('Unauthorized: Invalid hook secret')
//     }

//     const { record: user } = await req.json()
//     const userDomain = getDomain(user.email)

//     const supabaseAdmin = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     )

//     const { data: school, error: schoolError } = await supabaseAdmin
//       .from('school')
//       .select('id')
//       .eq('email_suffix', userDomain)
//       .single()

//     if (schoolError || !school) {
//       throw new Error(`Your email domain "${userDomain}" is not supported.`)
//     }

//     return new Response(JSON.stringify({}), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     })
//   } catch (error: any) {
//     return new Response(
//       JSON.stringify({ error: error.message }),
//       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
//     )
//   }
// })



let createClient: typeof import("@supabase/supabase-js").createClient;

if (typeof Deno !== "undefined") {
  // Running on Supabase (Deno deploy)
  ({ createClient } = await import("npm:@supabase/supabase-js@2"));
} else {
  // Running locally with Bun/Node
  ({ createClient } = await import("@supabase/supabase-js"));
}

const getDomain = (email: string) =>
  "@" + email.substring(email.lastIndexOf("@") + 1);

const handler = async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHookSecret =
      (typeof Deno !== "undefined"
        ? Deno.env.get("AUTH-HOOK-SECRET")
        : process.env.AUTH_HOOK_SECRET) ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || authHeader !== `Bearer ${authHookSecret}`) {

      return new Response(
        JSON.stringify({ error: `Unauthorized: Invalid hook secret, ${authHeader}    space    ${authHookSecret}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const { record: user } = await req.json();
    const userDomain = getDomain(user.email);

    const supabaseAdmin = createClient(
      (typeof Deno !== "undefined"
        ? Deno.env.get("SUPABASE_URL")
        : process.env.SUPABASE_URL) ?? "",
      (typeof Deno !== "undefined"
        ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        : process.env.SUPABASE_SERVICE_ROLE_KEY) ?? "",
    );

    const { data: school, error } = await supabaseAdmin
      .from("school")
      .select("id")
      .eq("email_suffix", userDomain)
      .single();

    if (error || !school) {
      return new Response(
        JSON.stringify({
          error: `Your email domain "${userDomain}" is not supported.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 },
      );
    }

    return new Response(
      JSON.stringify({ success: true, schoolId: school.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

// Run on Deno (Supabase) or Bun (local)
if (typeof Deno !== "undefined" && Deno.serve) {
  Deno.serve(handler);
} else {
  Bun.serve({ port: 54321, fetch: handler });
}
