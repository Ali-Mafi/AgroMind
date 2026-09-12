import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: "ali.mafi.1384@gmail.com",
    subject: "AgroMind Email Test",
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>AgroMind</h2>
        <p>This is a transactional email test.</p>
      </div>
    `,
  });

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json({ data });
}