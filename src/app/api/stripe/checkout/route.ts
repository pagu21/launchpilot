import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      mode: "demo",
      message:
        "Stripe non configurato. Aggiungi STRIPE_SECRET_KEY e STRIPE_PRICE_ID.",
      requestedPlan: body.plan ?? "monthly",
    });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
