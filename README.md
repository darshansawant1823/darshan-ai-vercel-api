# Darshan AI Vercel API

Tiny Vercel backend for the Framer portfolio AI widget.

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
