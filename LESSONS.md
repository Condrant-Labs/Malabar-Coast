# Responsive design lessons

- Treat 601–900px as a tablet composition, not a larger phone. Preserve editorial image-and-copy relationships where space allows.
- Fixed navigation requires `scroll-margin-top` on in-page destinations so anchored headings remain visible.
- Primary ordering controls and quantity controls must remain at least 44px at phone and tablet breakpoints.
- Use native scrolling and lighter transform work on touch-first devices; reserve continuous parallax and smooth-wheel interpolation for precise-pointer desktop layouts.
- Verify phone landscape separately. Short viewports need compact navigation even when their CSS width resembles a tablet.

# Discovery and answer-engine lessons

- A cinematic restaurant hero still needs to answer what the business is, where it is and what the visitor can do within the first viewport.
- Preserve the voyage image as brand theatre, then add a real menu image as the immediate food cue instead of replacing the concept wholesale.
- Never invent opening hours, phone numbers, reviews, awards or social profiles for local-business schema; publish them only after the owner verifies them.
- Keep FAQ schema identical to visible FAQ content, with stable anchor IDs and concise 30–50 word answers.
- Drive canonical URLs, sitemap entries and agent files from one site configuration so production-domain changes cannot drift across files.
- CSS background images bypass Next Image optimization; provide a compressed derivative when the background is critical to the intro experience.

# Editorial composition lessons

- Route graphics should connect their visible location labels and remain outside the primary headline channel; decorative geography becomes confusing when its endpoints drift from their captions.
- Use intentional asymmetry: when one editorial card is taller than its neighbors, the resulting lower channel is an effective place for a strong next-step CTA.
- A fixed light navigation system needs a controlled dark backdrop when later sections use pale backgrounds.
- Hide route graphics on compact layouts when their coordinate labels are removed; an unlabeled line adds clutter rather than meaning.

# Loading transition lessons

- A branded intro should use one clear replay contract: mount on every homepage entry and expose an explicit event for same-route logo clicks.
- Smooth handoffs come from spatial continuity, not only opacity; land the intro logo on the real navbar logo before the overlay disappears.
- Keep reduced-motion behavior short and functional even when the standard experience intentionally replays a cinematic loader.

# Restaurant operations lessons

- Keep payment state and fulfilment state operationally distinct: provider webhooks establish financial truth, while staff advance only valid paid-order stages.
- A kitchen board and an accounting report need different density. The board prioritizes due time, quantities and notes; the report prioritizes comparable totals and trends.
- Wide order tables and multi-lane kitchen boards should scroll inside their own regions so the application shell never creates body-level horizontal overflow.
- Staff notes belong behind a narrow database function that can change only the note field; never reuse a general JSON update for order administration.
- Day and month boundaries must follow the restaurant time zone, including daylight-saving offsets, rather than server-local or naive UTC midnight.
- Readiness must verify the database contract version, not merely that one table is reachable; otherwise a partially applied schema can look healthy while administrator actions fail.
- Audit touch targets at the shared shell level as well as on primary buttons. Brand, footer, table-reference and tab links are easy to leave below 44px even when the main flows are responsive.
