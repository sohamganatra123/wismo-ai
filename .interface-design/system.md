# WISMO interface system

## Direction

WISMO should feel like a calm evidence desk: safe, grounded, and proof-led. The primary human is a solo store owner or support lead who needs to brief an agent, watch it work, and choose how much control to give it.

The onboarding signature is a continuous cobalt evidence line paired with one persistent WISMO status. The line connects the brief, sources, learned voice, proof events, and final control choice; progress reads as agent activity, not a generic checklist or celebration.

## Color and surfaces

- Use receipt paper `#F7F4EA`, deep paper `#ECE5D5`, carbon ink `#171714`, soft graphite `#5B594F`, kraft `#CDAE7D`, quiet rules `#D1C8B6`, and cobalt signal `#2457FF`.
- Store-specific colors belong only inside the voice specimen. They must not recolor the surrounding WISMO interface.
- Depth uses warm surface shifts and quiet one-pixel rules. Avoid generic elevated cards, glass, gradients, harsh borders, and dramatic shadows.
- Inputs are inset with deep paper and use cobalt focus.
- Cobalt carries working, verified, current, and selected meaning. Muted red is reserved for errors; text always carries the state as well.

## Hierarchy and type

- One focal action per step.
- Archivo leads headings, body, and controls. IBM Plex Mono labels progress, status, and evidence.
- Use weight, contrast, and space before adding size or color.
- Large onboarding headings use 56px desktop / 42px mobile, `-0.03em` tracking, `0.06em` word spacing, and balanced wrapping. Supporting copy is 16px with a generous line height.
- No user-facing onboarding text is smaller than 12px.

## Spacing and shape

- Base spacing unit: 8px.
- Desktop onboarding uses a 296px journey rail above 1200px, 264px at tablet widths, and one centered work surface. Below 768px, replace the rail with a compact sticky progress header.
- Controls are at least 44px high; primary inputs are 56px and primary actions are 54px. Onboarding surfaces use square manifest edges unless the content itself calls for a physical circular mark.
- Keep closely related controls tight, then use clear space between sections.

## Reusable patterns

- Primary button: 54px minimum height, 18px horizontal padding, square edge, carbon fill, 14px/750 text, cobalt arrow, scale to .985 on press.
- Guided-setup badge: 24px minimum height, paper fill, cobalt rule, 10px/650 mono uppercase text.
- Step header: 12px mono uppercase eyebrow, 56/42px Archivo heading, 16px supporting copy.
- Evidence surface: paper or deep-paper fill with one quiet rule; no large shadow.
- Live intake appears before sample content. Sample and demo data always use an explicit label and quieter visual weight.
- Interactive controls expose hover, focus, pressed, disabled, working, success, and error states as applicable.
- Journey map: five visible stages—Brief, Evidence, Voice, Proof, Control. Gmail and Shopify share Evidence while retaining separate retry states.
- Manifest state: textual CURRENT / VERIFIED / LOCKED with one cobalt line and square numbered markers.
- Persistent agent status: `Waiting for your brief`, `Waiting for inbox access`, `Checking inbox access`, `Learning from your store`, `Learning your voice`, `Investigating the proof case`, `Needs your decision`, or `Ready for work`.
- All simulated external actions need idle, working, success, and error language. Never imply that a real account connected or a real email was delivered.
- Control choice: native radio rows for Investigate only, Draft for approval (recommended), and Resolve verified cases; the adjacent summary updates immediately and states that the choice can change later.
- Respect reduced motion; ordinary step changes use opacity and no more than 8px vertical travel over roughly 210ms. Agent motion loops only while working.
- Human-attention inbox row: four-column paper surface for customer, reason, recommendation, and deadline; 18px vertical and 20px horizontal padding; 12px radius; deadline uses mono type and carries urgency color.
- Case-review workspace: evidence and history occupy the main column; the manager decision stays in a 340px sticky side column on wide screens and moves below evidence on smaller screens.
- Evidence route: three cloud-soft source cards show customer, Shopify order, and newest tracking in source order; jade marks verified evidence and muted red marks a conflict.
- Decision control: radio-card choices for approve, override, and guidance; override and guidance reveal one inset text area; the single carbon action button disables immediately while recording.
- Sample-action receipt: jade check, explicit `Decision recorded in this sample`, and a second line confirming that no customer or courier message was sent.
- Conversation thread: show stored Gmail messages oldest to newest; customer messages keep a quiet paper rule, while WISMO and founder messages use a cobalt left rule and a slight outbound indent. Every outbound message is labeled as clarification, WISMO reply, or founder reply.
- Founder reply composer: 760px maximum width, deep-paper surface, 168px minimum textarea, 4,000-character limit, and one `Send reply and resolve` action. State plainly that an example is saved only after Gmail confirms the send.
