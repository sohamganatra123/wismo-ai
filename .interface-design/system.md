# WISMO interface system

## Direction

WISMO should feel like a calm operations room: safe, grounded, and proof-led. The primary human is a solo store owner or support lead who needs to trust an automated reply before switching it on.

The onboarding signature is the store voice fingerprint: WISMO turns storefront copy, colors, and tone into an editable customer-reply specimen. Product progress should be shown as connected evidence, not celebration.

## Color and surfaces

- Use the existing porcelain canvas, paper surfaces, carbon text, graphite/slate supporting text, amber working state, and jade verified state.
- Store-specific colors belong only inside the voice specimen. They must not recolor the surrounding WISMO interface.
- Depth uses subtle layered shadows with a quiet one-pixel ring. Avoid glass, gradients, harsh borders, and dramatic elevation.
- Inputs are inset using the existing cloud-soft family and become amber only for focus.

## Hierarchy and type

- One focal action per step.
- Manrope leads headings, Inter carries body and controls, and IBM Plex Mono labels progress, status, and evidence.
- Use weight, contrast, and space before adding size or color.
- Large onboarding headings use tight tracking and balanced wrapping. Supporting copy stays around 15px with a generous line height.

## Spacing and shape

- Base spacing unit: 8px.
- Desktop onboarding uses a 280px journey rail and one centered work surface. Below 700px, replace the rail with a compact sticky progress header.
- Controls are at least 48px high. Radius scale: 8px controls, 12px compact surfaces, 16–20px focal surfaces.
- Keep closely related controls tight, then use clear space between sections.

## Reusable patterns

- Primary button: 52px minimum height, 18px horizontal padding, 9px radius, carbon fill, 13px/750 text, amber arrow, scale to .98 on press.
- Simulation badge: 22px minimum height, amber-soft fill, 6px radius, 9px/700 mono uppercase text.
- Step header: 10px mono uppercase eyebrow, 38–64px Manrope heading, 15px supporting copy.
- Elevated task card: paper fill, 16px radius, quiet ring plus two soft shadow layers.
- Verified step marker: 18px jade circle with a white check. Current step marker uses amber.
- All simulated external actions need idle, working, success, and error language. Never imply that a real account connected or a real email was delivered.
- Respect reduced motion; ordinary step changes use opacity and no more than 12px vertical travel over roughly 220ms.
- Human-attention inbox row: four-column paper surface for customer, reason, recommendation, and deadline; 18px vertical and 20px horizontal padding; 12px radius; deadline uses mono type and carries urgency color.
- Case-review workspace: evidence and history occupy the main column; the manager decision stays in a 340px sticky side column on wide screens and moves below evidence on smaller screens.
- Evidence route: three cloud-soft source cards show customer, Shopify order, and newest tracking in source order; jade marks verified evidence and muted red marks a conflict.
- Decision control: radio-card choices for approve, override, and guidance; override and guidance reveal one inset text area; the single carbon action button disables immediately while recording.
- Sample-action receipt: jade check, explicit `Decision recorded in this sample`, and a second line confirming that no customer or courier message was sent.
