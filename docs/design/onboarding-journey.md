# WISMO Simulated Onboarding Journey

## Outcome

A solo store owner or support manager creates a WISMO account, connects a simulated Gmail inbox, connects a simulated Shopify store, sees WISMO infer the store's voice and visual character, reviews that profile, runs a simulated end-to-end WISMO test against a Shopify test order, and explicitly turns on automatic replies for “Where is my order?” emails.

This phase does not call Gmail or Shopify. It models the states and handoff points that real OAuth connections will replace later. The test-email step must say `Simulation` and must never claim an email was delivered outside the product.

## Confirmed decisions

- Replace the current `/connect` placeholder.
- Support both solo store owners and support managers.
- Create a WISMO account with email and password before connecting services.
- Connect Gmail first; any Google account is accepted in the simulation.
- Connect Shopify second by entering the store URL and approving a simulated app connection.
- Infer voice from both public storefront copy and theme styling.
- Let the user review and edit the inferred profile.
- Make the inferred profile the onboarding “aha” moment.
- Require a test using a Shopify test order before launch.
- Simulate sending a real test email into the connected inbox; do not perform real delivery in this phase.
- Launch automatic replies only for “Where is my order?” requests.
- Save progress locally and resume after refresh.

## Journey

1. **Account** — name, work email, password, and clear local-simulation notice.
2. **Gmail** — simulated Google permission screen, connected-address confirmation, and permissions summary.
3. **Shopify** — store-domain input, simulated app approval, connection confirmation.
4. **Your voice** — a short analysis state resolves into a storefront specimen: extracted colors, detected voice traits, example greeting, and editable response guidance. This is the emotional high point.
5. **Test WISMO** — select a seeded Shopify test order, send a simulated WISMO-status email, then watch the inbox question, source checks, and drafted answer resolve in order.
6. **Go live** — show the exact automation boundary, require explicit confirmation, then mark WISMO active for WISMO questions only.

Each completed connection remains visible in a quiet journey rail. Users can go back without losing later data; changing the Shopify store invalidates the voice analysis and test, while changing Gmail invalidates only the test.

## Design direction

**Human:** A store owner or support lead who wants the setup to feel safe, quick, and grounded in their existing store rather than a generic AI wizard.

**Task:** Connect the two sources WISMO needs, verify that it sounds like the store, prove one complete answer, and make a conscious launch decision.

**Feel:** A calm setup room becoming recognizably theirs.

**Domain:** inbox, storefront, order record, tracking event, reply voice, proof run, safety boundary, launch switch.

**Color world:** WISMO porcelain, carbon, graphite, amber working light, jade verified state, plus a small controlled area using the simulated store colors only in the voice specimen.

**Signature:** After Shopify connects, WISMO assembles a “voice fingerprint” from storefront copy and theme styling. The generic setup surface becomes a small, editable customer-reply specimen in the store's own character.

**Rejecting:** generic numbered wizard → connected system map; confetti completion → proof-based launch receipt; a list of AI adjectives → editable customer-response specimen.

## Interface rules

- Desktop uses a 280px journey rail and one primary work surface. Mobile turns the rail into a compact progress header.
- One focal action per step; secondary actions remain visually quiet.
- Use existing Manrope, Inter, IBM Plex Mono, porcelain, carbon, amber, and jade tokens.
- Use subtle layered shadows already present in the product; no new glass or gradient style.
- Use an 8px spacing base. Controls are at least 48px tall, with small/medium/large radii of 8/12/20px.
- Animate step content with opacity and at most 12px of movement, 180–240ms. Respect reduced motion.
- Every simulated external action has idle, working, success, and error states.
- Password fields expose show/hide controls and validation. Errors are text, not color alone.
- The final launch control states exactly: `Automatically reply to “Where is my order?” emails`.

## Seeded simulation data

- Gmail: the account email entered in Step 1.
- Shopify store: `northstar-goods.myshopify.com` as the example format.
- Store profile: `Northstar Goods`, ink `#17312B`, canvas `#F4EFE5`, accent `#D77A45`, voice traits `Warm`, `Direct`, `Reassuring`.
- Test order: `#TEST-4921`, customer `Amina M.`, courier status `Delivery attempted · 11:00`, next action `Another attempt tomorrow`.
- Test reply: `Hi Amina — the courier tried to deliver your parcel this morning and will try again tomorrow. You don’t need to do anything right now.`

## Acceptance checks

- Refresh resumes the latest completed step and restores non-sensitive fields; never store the password.
- Account cannot complete with an invalid email or fewer than 10 password characters.
- Gmail must be connected before Shopify can start.
- Shopify must be connected before voice analysis appears.
- The test cannot run until the voice profile is accepted.
- Launch cannot activate until the simulated test reaches `reply prepared`.
- Changing Gmail clears test status. Changing Shopify clears voice acceptance and test status.
- Keyboard-only, 200% zoom, reduced-motion, 1440px, 768px, and 390px layouts remain usable.

