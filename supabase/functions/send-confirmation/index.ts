import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, displayName } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ confirmation_code: code })
      .eq("email", email);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to store code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Highlife Games <noreply@highlifegames.co.uk>",
        to: [email],
        subject: "Your Highlife Games confirmation code",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0f1923; color: #fff; border-radius: 16px; padding: 40px 32px;">
            <h1 style="color: #abd40a; font-size: 28px; margin: 0 0 16px;">Highlife Games</h1>
            <p style="color: #8ba3b8; font-size: 16px; margin: 0 0 24px;">Hi ${displayName || "there"},</p>
            <p style="color: #fff; font-size: 16px; margin: 0 0 24px;">Here's your confirmation code:</p>
            <div style="text-align: center; background: #1e3344; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #abd40a;">${code}</span>
            </div>
            <p style="color: #8ba3b8; font-size: 14px; margin: 0;">Enter this code to confirm your account. If you didn't create an account, you can ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.text();
      return new Response(JSON.stringify({ error: "Failed to send email: " + err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
