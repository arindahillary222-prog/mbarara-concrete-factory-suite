# SMALLBIZ AUTOMATION GUIDE LANDING PAGE

Professional landing/profile page for Hillary Arindamukama's Gumroad business:

- Product: SmallBiz Automation Guide
- Gumroad product URL: https://arindahill.gumroad.com/l/smallbiz-automation-guide
- Public Netlify page: deploy `index.html`
- Gumroad custom profile page: upload/publish `profile.html`

## Files

- `profile.html` - self-contained Gumroad-safe profile page with inline CSS and JavaScript.
- `index.html` - same design for Netlify hosting.
- `docs/PROMOTION_PLAYBOOK.md` - practical promotion and sales plan.

## Gumroad Notes

The page uses:

- `data-gumroad-field="name"`
- `data-gumroad-field="bio"`
- `script#gumroad-data`

It does not use external images or media. Product cards are rendered from Gumroad's injected JSON when available, with a fallback card for the SmallBiz Automation Guide.

If the real Gumroad CLI is installed and authenticated later, run:

```bash
gumroad user page preview ./profile.html --json --no-input --non-interactive
gumroad user page publish ./profile.html --json --no-input --non-interactive
gumroad user page url --json --jq '.profile.landing_url' --no-input --non-interactive
```

The `gumroad` command was not available on this laptop at creation time.
