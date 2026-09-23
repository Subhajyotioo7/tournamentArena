# Tournament Arena - Design System

This document defines the visual and interaction standards for Tournament
Arena. It is based on the existing React/Tailwind interface and should guide
new screens, components, and design updates.

## Design principles

### Competitive, clear, and trustworthy

- Make the next tournament action obvious: browse, view details, register,
  join a room, add money, or review a result.
- Use strong hierarchy for tournament name, game, entry fee, payout, slots,
  and participation status.
- Treat money, identity verification, approvals, and results as high-trust
  workflows. Show clear status, confirmation, and error feedback.
- Use energetic accents for competition without sacrificing readability or
  operational clarity.

### Consistent and focused

- Prefer existing components and established Tailwind patterns over one-off
  visual treatments.
- Use one primary action per content region whenever possible.
- Keep cards, forms, tables, modals, and status labels visually consistent.
- Use whitespace and grouping to reduce cognitive load; do not fill every
  available area with decoration.

### Responsive and accessible

- Design mobile-first and verify key flows at narrow viewport widths.
- Keep touch targets large enough to use comfortably; do not rely on hover to
  reveal essential information.
- Use semantic headings, labels, buttons, links, and landmark regions.
- Preserve visible keyboard focus and use sufficient color contrast.
- Pair color with text, icons, or shape for statuses; color alone must not
  communicate meaning.
- Respect reduced-motion preferences and keep animation purposeful.

## Color palette

The interface uses a light neutral foundation with domain-specific accent
colors. Tailwind utility classes are the current implementation approach.

### Foundation colors

| Role | Current usage | Reference |
| --- | --- | --- |
| Page background | App and page surfaces | `bg-gray-100`, `bg-gray-50` |
| Primary surface | Cards, navbar, forms | `bg-white` |
| Primary text | Headings and important values | `text-gray-900`, `text-gray-950` |
| Secondary text | Labels and supporting copy | `text-gray-500`, `text-gray-600`, `text-gray-700` |
| Borders | Card, form, table, and divider boundaries | `border-gray-100`, `border-gray-200`, `border-gray-300` |
| Dark surface | Live room chat and high-contrast areas | `bg-gray-900`, `bg-gray-800` |

### Semantic colors

| Intent | Color direction | Examples |
| --- | --- | --- |
| Primary action | Amber/yellow | `#facc15`, `#eab308`, `text-amber-700` |
| Brand/navigation accent | Amber | `#d97706` |
| Success/approved | Green/emerald | `text-emerald-600`, `bg-emerald-50`, `bg-green-700` |
| Informational | Blue | `text-blue-600`, `text-blue-700` |
| Financial emphasis | Purple/blue | `from-purple-600 to-blue-600` |
| Warning/pending | Yellow/amber | `bg-yellow-100`, `text-yellow-800` |
| Destructive/error | Red/orange | `bg-red-600`, `text-orange-500` |

Use semantic colors consistently:

- Green indicates success, approval, completion, or a confirmed payment.
- Yellow/amber indicates an active action, pending state, or competitive
  emphasis.
- Blue indicates information, links, or neutral progress.
- Red indicates a destructive action, rejection, or a blocking error.
- Gray indicates inactive, secondary, or unavailable content.

### Game themes

Tournament cards may use a game-specific header gradient while keeping the
content area readable:

| Game/theme | Gradient direction | Supporting accent |
| --- | --- | --- |
| FIFA | Green to emerald | Emerald text and soft emerald surface |
| BGMI | Zinc gray | Zinc text and soft zinc surface |
| Free Fire | Amber to orange | Amber text and soft amber surface |
| Other/default | Slate gray | Slate text and soft slate surface |

Game gradients are for identity and visual distinction, not for conveying
status. Status must still use the semantic colors above.

## Typography

### Font family

- Use **Inter Variable** as the primary font through the existing
  `@fontsource-variable/inter` package.
- Keep the `font-sans` and `font-heading` theme aliases so typography remains
  centrally configurable.
- Use system fallbacks only when the bundled font cannot load.

### Type hierarchy

| Use | Recommended treatment |
| --- | --- |
| Page title | `text-2xl` to `text-4xl`, bold or black weight |
| Section heading | `text-xl` to `text-2xl`, bold |
| Card title | `text-lg` to `text-2xl`, bold |
| Key metric | `text-2xl` to `text-4xl`, bold or black |
| Body copy | `text-sm` to `text-base`, regular |
| Supporting copy | `text-xs` to `text-sm`, gray |
| Compact label | `text-[10px]` to `text-xs`, bold, uppercase, tracked |
| Navigation | `text-sm`, medium weight |

Guidelines:

- Use sentence case for normal UI copy.
- Use uppercase and letter spacing only for compact labels, categories, and
  status metadata.
- Use `leading-6` or equivalent comfortable line height for longer explanatory
  text.
- Avoid using font weight as the only distinction between two states.
- Format currency and numeric tournament values consistently and make the
  currency symbol visible.

## Layout and spacing

- Use a centered content container with responsive horizontal padding, such as
  `max-w-7xl px-4 sm:px-6 lg:px-8`.
- Use a consistent spacing rhythm based on Tailwind spacing utilities.
- Group related values in cards or bordered sections instead of relying on
  dense text.
- Use two-column or grid layouts for metrics when the viewport allows it, and
  stack them on mobile.
- Keep sticky navigation above page content with a clear bottom border.
- Use responsive breakpoints to change layout, not to hide essential actions.

## UI components

### Navigation

- Use a white sticky navbar with a subtle gray bottom border.
- Keep the Tournament Arena brand and trophy icon visible.
- Use concise navigation labels: Tournaments, Wallet, My Rooms, Create Team,
  Profile, and Admin where authorized.
- Use a compact mobile menu below the navbar; close it after navigation.
- Highlight interaction through amber hover text or the existing button
  treatment.

### Buttons and actions

- Use the shared button components and variants before creating a custom
  button.
- Primary actions use a filled amber/yellow or context-appropriate brand
  treatment with strong contrast.
- Secondary actions use outline or neutral treatments.
- Destructive actions use red and require clear, specific labels.
- Buttons must show disabled, loading, hover, focus, and error states where
  applicable.
- Action labels should describe the result: `View Tournament`, `Add Money`,
  `Join Room`, `Approve`, or `Withdraw`.

### Tournament cards

- Use a game-themed gradient header for recognition.
- Show game, active state, tournament name, payout, entry fee, mode, and slots
  in a predictable order.
- Use white card content with rounded corners, a subtle shadow, and generous
  internal padding.
- Keep the primary card action full-width on smaller screens.
- Show prize distribution in a visually distinct but restrained amber-tinted
  section.

### Cards and panels

- Use white surfaces over a gray page background.
- Use rounded corners consistently: `rounded-lg`, `rounded-xl`, or
  `rounded-2xl` based on component size.
- Use borders for structure and shadows for elevation; do not combine heavy
  borders and heavy shadows without a clear reason.
- Use gradients only for high-value emphasis such as game headers and wallet
  summaries.

### Forms

- Place a visible label above every input.
- Use clear border, focus-ring, invalid, disabled, and helper-text states.
- Keep related fields together and explain required information near the field.
- Validate on the backend and reflect field-level errors in the UI.
- Use appropriate input types for amounts, email addresses, passwords, and
  game IDs.
- Never display secrets or payment credentials in form values or errors.

### Wallet and financial UI

- Use the purple-to-blue gradient wallet summary for the primary balance
  surface, with white text and clear currency formatting.
- Separate balance, add-money, withdrawal, and transaction-history actions.
- Show pending, successful, failed, and rejected payment states with both
  semantic color and text.
- Make transaction amount, timestamp, status, and reference easy to scan.
- Use confirmation messaging before irreversible withdrawal or payout actions.

### Status badges

- Keep badges compact, rounded, and readable at a glance.
- Use labels such as Active, Pending, Approved, Rejected, Completed, and Failed.
- Use a semantic background/text pairing, for example:
  `bg-yellow-100 text-yellow-800` for pending and
  `bg-emerald-50 text-emerald-700` for approved.
- Do not use a color-only dot without an accessible text label.

### Modals and dialogs

- Use a backdrop, centered panel, and responsive padding.
- Keep the title and purpose clear at the top.
- Place the primary and cancel actions together and keep destructive actions
  visually distinct.
- Trap focus where the component library supports it and close safely with
  Escape when appropriate.
- Do not use a modal for content that requires frequent comparison or
  navigation.

### Live room chat

- Use the existing dark chat panel to distinguish realtime communication from
  administrative content.
- Make sender, timestamp, message content, connection state, and input action
  clear.
- Use distinct but readable message treatments for normal, system, and error
  messages.
- Show reconnecting or unavailable states and keep persisted message history
  accessible after a WebSocket interruption.

### My Rooms

- Use a responsive card grid for the room list; keep status, player capacity,
  available slots, payment state, entry fee, prize pool, and start countdown
  scannable.
- Use game-theme gradients only for room identity. Use text labels and icons
  for `OPEN`, `FULL`, `STARTED`, and `COMPLETED` states.
- Open room details in a scrollable responsive dialog. Participants receive
  participant, message, and result tabs; managers may receive the expanded
  participant/chat/payout layout.
- Keep admin announcements in an amber notice panel above room content so
  operational messages are visible before chat.
- Treat team removal as destructive: use a confirmation dialog and state
  clearly that paid entry amounts are not refunded.
- Display winner rank, participant, and prize amount together. Confirm payout
  success and never imply a payout occurred until the backend response succeeds.

### Tables and admin panels

- Use clear column headings, compact row spacing, and readable status badges.
- Keep high-value identifiers and actions visible without excessive horizontal
  scrolling.
- On mobile, allow horizontal scrolling or switch to stacked records; do not
  truncate critical payment, participant, or approval information.
- Confirm administrative mutations and show the resulting state immediately.

### Loading, empty, and error states

- Use skeletons or restrained spinners for loading, such as the existing
  pulse and spinner patterns.
- Explain empty states and provide the next useful action where one exists.
- Use an alert icon, concise title, and actionable message for blocking errors.
- Preserve the page structure while loading to reduce layout shift.

## Motion and interaction

- Use short transitions for hover, focus, menu, and card elevation changes.
- Keep animation subtle and purposeful; avoid decorative motion in payment,
  authentication, and administration flows.
- Use the existing fade-in and card-lift patterns consistently.
- Respect `prefers-reduced-motion` and never make an animated interaction the
  only way to understand a state change.

## Design review checklist

Before shipping a visual change:

- Does the screen follow the existing light, responsive visual language?
- Is the primary action obvious and accessible?
- Are typography, spacing, radius, border, and shadow choices consistent?
- Are statuses understandable without color alone?
- Does the UI work for mobile, keyboard, and reduced-motion users?
- Are loading, empty, success, and error states covered?
- Does financial, identity, or admin content receive appropriate trust and
  confirmation treatment?