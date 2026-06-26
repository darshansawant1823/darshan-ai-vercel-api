# Darshan AI Vercel API

Tiny Vercel backend for the Framer portfolio AI widget.

It includes a plug-and-play LLM firewall for API-key safety, cost control, bot abuse, prompt attacks, and output leakage.

## What to upload

Upload this whole folder to GitHub or import it into Vercel:

```txt
darshan-ai-vercel-api/
  api/
    darshan-ai.js
  package.json
  README.md
```

## Vercel setup

1. Create a GitHub repo and upload these files.
2. In Vercel, import that GitHub repo.
3. Go to **Environment Variables**.
4. Add:

```txt
OPENAI_API_KEY=your_openai_key_here
```

Optional:

```txt
OPENAI_MODEL=gpt-4.1-mini
```

5. Redeploy.
6. Use this endpoint in Framer:

```txt
https://your-vercel-project.vercel.app/api/darshan-ai
```

Do not paste your OpenAI key into Framer. Keep it only in Vercel environment variables.

## Firewall controls

The firewall is **on by default**.

To unplug it temporarily, add this Vercel environment variable:

```txt
FIREWALL_ENABLED=false
```

To turn it back on, delete that variable or set:

```txt
FIREWALL_ENABLED=true
```

To temporarily stop all AI calls without removing the widget:

```txt
AI_KILL_SWITCH=true
```

To re-enable AI calls:

```txt
AI_KILL_SWITCH=false
```

## Owner bypass

This is only for you when testing privately through tools such as curl/Postman.

Add a long random token in Vercel:

```txt
OWNER_BYPASS_TOKEN=make_this_a_long_private_random_string
```

Then private test requests can bypass the firewall by sending:

```txt
X-Owner-Token: make_this_a_long_private_random_string
```

Do **not** put `OWNER_BYPASS_TOKEN` in Framer or browser code.

## Recommended production limits

These defaults are already built in:

```txt
MAX_CHAT_CHARS=700
MAX_JD_CHARS=7000
MAX_OUTPUT_TOKENS=650
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=12
DAILY_REQUEST_LIMIT=250
DAILY_TOKEN_ESTIMATE_LIMIT=180000
```

You can override any of them in Vercel Environment Variables.

By default, rate limits use Vercel's in-memory runtime. That is fine for a small portfolio, but it is best-effort because serverless instances do not always share memory.

For stronger persistent limits, create a free Upstash Redis database and add:

```txt
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

When these are present, the firewall tracks request and token-estimate limits across deployments/regions.

For a personal portfolio, stricter settings are safer:

```txt
RATE_LIMIT_MAX=8
DAILY_REQUEST_LIMIT=120
DAILY_TOKEN_ESTIMATE_LIMIT=90000
MAX_OUTPUT_TOKENS=500
```

## Origin allowlist

For Framer editor/desktop testing, the easiest reliable setting is:

```txt
ALLOWED_ORIGINS=*
```

This does not expose your OpenAI key. The key stays server-side in Vercel. The firewall, rate limits, prompt-attack checks, and output filtering still protect the API.

By default, the API allows:

```txt
https://designbydarshan.framer.website
https://*.framer.website
https://darshansawant.com
https://www.darshansawant.com
https://framer.com
https://www.framer.com
https://*.framer.com
https://framerstatic.com
https://app.framerstatic.com
https://*.framerstatic.com
https://framerusercontent.com
https://*.framerusercontent.com
null
```

To customize:

```txt
ALLOWED_ORIGINS=https://your-site.com,https://your-framer-site.framer.website
```

Wildcard entries are supported:

```txt
ALLOWED_ORIGINS=https://*.framer.website,https://framerstatic.com,https://app.framerstatic.com,https://*.framerstatic.com,https://framerusercontent.com,https://*.framerusercontent.com,https://your-site.com,null
```

## What the firewall blocks

- Oversized prompts and job descriptions
- Basic jailbreak and prompt-extraction attempts
- API-key or secret-extraction attempts
- Repeated spam payloads
- Per-IP request bursts
- Per-IP daily usage spikes
- Output that appears to leak hidden prompts, secrets, or environment variables

This is not a replacement for platform billing limits. Also set usage notifications and spend limits in the OpenAI dashboard.
