import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  name?: string;
  verificationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, verificationUrl }: VerificationEmailRequest = await req.json();

    console.log(`Sending verification email to: ${email}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AutoAid <onboarding@resend.dev>",
        to: [email],
        subject: "Verify your AutoAid account",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">AutoAid</h1>
              </div>
              <div style="padding: 40px 32px;">
                <h2 style="color: #18181b; margin: 0 0 16px; font-size: 24px; font-weight: 600;">
                  Welcome${name ? `, ${name}` : ''}!
                </h2>
                <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Thank you for signing up for AutoAid. Please verify your email address to get started.
                </p>
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
                <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
              <div style="background-color: #f4f4f5; padding: 24px 32px; text-align: center;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} AutoAid. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to send verification email' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
