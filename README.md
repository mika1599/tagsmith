# Tagsmith

An Etsy listing generator: paste a rough product description, get back an
SEO-ready title, 13 tags, and a description — formatted to paste straight
into Etsy's listing editor.

Free tier: 3 listings/month (tracked in the browser). Paid: $12/mo unlimited
via a Stripe Payment Link (no backend billing code needed for launch).

---

## 1. Get an Anthropic API key (5 min)

1. Go to https://console.anthropic.com and sign up / log in.
2. Add a small amount of credit (a few dollars covers hundreds of listing generations).
3. Go to **API Keys** → **Create Key**. Copy it — you'll need it in step 3.

## 2. Create your Stripe Payment Link (10 min) — optional for day one

1. Go to https://dashboard.stripe.com, sign up if needed.
2. Products → **Add product** → name it "Tagsmith Unlimited", price **$12.00/month**, recurring.
3. Once created, click **Create payment link**.
4. Under the link's settings, set the **after payment** redirect to:
   `https://YOUR-DOMAIN.vercel.app/?unlocked=1`
   (You'll know your real Vercel URL after step 4 below — you can come back and edit this.)
5. Copy the payment link URL (looks like `https://buy.stripe.com/xxxx`).

You can skip this on day one and launch free-only — add it once you have users asking to pay.

## 3. Push this project to GitHub

If you don't already have a GitHub account, make one at https://github.com (free).

```bash
cd tagsmith
git init
git add .
git commit -m "Tagsmith launch"
```

Then create a new empty repo on GitHub and follow its instructions to push
(`git remote add origin ...`, `git push -u origin main`).

## 4. Deploy to Vercel (free)

1. Go to https://vercel.com and sign up with your GitHub account.
2. Click **Add New → Project**, pick your `tagsmith` repo, click **Import**.
3. Before deploying, expand **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` = the key from step 1
   - `NEXT_PUBLIC_STRIPE_LINK` = the payment link from step 2 (skip if not set up yet)
4. Click **Deploy**. In ~1 minute you'll get a live URL like `tagsmith.vercel.app`.

That's it — the app is live and real customers can use it.

## 5. (Optional) Custom domain

In the Vercel project → **Settings → Domains**, you can attach a domain you
buy from Namecheap or similar (~$12/year) instead of the free `.vercel.app`
subdomain.

---

## How the free tier actually works (read this)

The 3-listings/month limit is tracked in the visitor's own browser
(`localStorage`), not on a server. That means:

- It's enough to stop casual overuse and nudge people toward paying.
- A determined person could clear their browser storage to reset it. That's
  fine for launch — you're optimizing for getting your first paying
  customers fast, not for airtight enforcement. Revisit this once you have
  real usage (add a database + login, e.g. with Supabase, once it's worth
  the extra day of work).

## Editing the AI prompt / output format

The instructions that control what the AI writes live in
`app/api/generate/route.js` in the `SYSTEM_PROMPT` constant. Tweak that text
any time you want different tag style, description length, tone, etc. —
no other code changes needed.
