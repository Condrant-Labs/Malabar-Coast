# Malabar Coast CMS

The repository contains two independent applications:

- the repository root — the Next.js website
- `studio` — the standalone Sanity Studio

The Studio is not embedded in the website. The website reads published content from Sanity and falls back to checked-in content when Sanity is unavailable or not configured.

## Local environment

Keep these values in the root `.env.local` only:

```text
NEXT_PUBLIC_SANITY_PROJECT_ID=x3srlrl4
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_server_only_token
NEXT_PUBLIC_SANITY_STUDIO_URL=https://malabar-coast.sanity.studio
```

The API token must never use a `NEXT_PUBLIC_` prefix. The token used for the initial import needs content Editor permission. Schema deployment also needs `sanity.project/deploySchema` permission.

## Run locally

From the repository root:

```text
npm run dev
npm run dev:studio
```

The commands run separately. By default the website uses port 3000 and the local Studio uses port 3333. The protected `/admin/content` page opens the deployed standalone Studio at `https://malabar-coast.sanity.studio`.

## Publish the content model and initial content

1. Deploy the Studio schema from `studio` with `sanity schema deploy`.
2. Run `npm run sanity:seed` from the repository root.
3. Open Studio, review the dietary and allergen fields marked **Needs restaurant confirmation**, and publish corrections.

The seed is idempotent: it updates imported records by category slug, legacy menu key, page key or question instead of creating duplicates. Menu items created directly in Studio use their stable Sanity document ID and do not need a legacy key.

## Promotions and offers

- Create one **Promotion or offer** document per poster.
- Add accessible poster text, a title and the public offer details; use the start/end dates for automatic scheduling.
- Keep the status **Active** for a live promotion. **Paused** hides it without deleting it.
- Enable **Show in the homepage popup** when it should appear in the homepage carousel.
- All active promotions appear on `/offers`. One active popup poster is shown on its own; multiple active posters become a carousel.

## Menu safety rules

- Alcoholic drink prices are deliberately empty and hidden.
- Alcoholic drinks cannot be added to online orders.
- Online-orderable items require a numeric price.
- Checkout reads the current CMS price on the server, with the checked-in menu used only when Sanity cannot be reached.
- Newly created Studio dishes are supported automatically; they no longer depend on the original import key.
- Vegan, gluten-free and allergen claims are not published until the restaurant confirms recipes and cross-contact handling.
