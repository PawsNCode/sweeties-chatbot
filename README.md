# sweeties-chatbot

Backend for Sweetie, the Sweeties Pawprints chat companion. A Cloudflare Worker
that calls Claude with the store's knowledge base.

- Code: `src/index.js`
- Config: `wrangler.toml`
- Deploys automatically on push via Cloudflare Workers Builds.

## The API key is never in this repo

It is stored as an encrypted secret on the Worker in Cloudflare:
**Worker > Settings > Variables and Secrets > add `ANTHROPIC_API_KEY`**.

## Editing the knowledge base

Edit the `SYSTEM_PROMPT` in `src/index.js`, commit, and push. Cloudflare redeploys.
When a scheduled blog post publishes, move its line from the reference comment
block at the top of `src/index.js` into the LIVE list in the system prompt.
