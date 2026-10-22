# Pixel Jam Quest

Build a polished, responsive event website for "Google Cloud Study Jams" hosted by GDG on Campus at IARE. This is a visual-first, long-scrolling single-page landing site with an old-school computer / pixel-art aesthetic, warm cream + charcoal palette, and restrained Google colors (blue, red, yellow, green). It must feel art-directed and bespoke, not like a generic SaaS template.

DESIGN DIRECTION
- Warm cream paper background, charcoal text, subtle grain/scanline texture used sparingly, crisp 1px borders, pixel-inspired decorative motifs, small status labels, terminal/window chrome, and a deliberate grid.
- Use a readable modern sans for body text and a pixel/mono display font only for accents/headings. Keep readability high.
- Main hero: large editorial headline "YOUR CLOUD ERA STARTS HERE." with "Google Cloud Study Jams" clearly identified, GDG on Campus at IARE organizer label, a retro desktop/CRT-inspired illustration made from CSS and/or lightweight SVG shapes, blinking terminal cursor, pixel cloud icons, and clear primary CTA "Explore the Jams" plus secondary "Register". Do not use a random stock-photo hero.
- Add a tiny fake boot sequence / loading intro only if it is skippable and does not block content; avoid annoying full-screen loaders.
- Google colors should be accents, not a giant Google logo. Do not imply official Google endorsement beyond the event context. Do not invent event dates, venue, registration URLs, confirmed rewards, certificates, speakers, or learning content. Mark unknown details as editable placeholders such as "[Add event date]" and make CTA links easy to replace.

SCROLL / MOTION
- Create an immersive scroll narrative with 2–3 standout moments: a pinned/scroll-driven "booting into the cloud" section that transitions from desktop terminal to a cloud dashboard; parallax pixel clouds/background grids; reveal-on-scroll content; subtle hover states and animated terminal prompt. Use CSS transforms and IntersectionObserver or a lightweight motion library if already available. Prefer performant transforms/opacity, no heavy WebGL.
- Respect prefers-reduced-motion, ensure animations don't hide content, and keep mobile scroll natural (disable pinned scenes or simplify on small screens). No horizontal overflow.

PAGE SECTIONS
1. Sticky compact navigation with pixel-dot/cloud mark, event title, anchor links (About, Learning, FAQ), and a registration CTA.
2. Hero with compelling visual and CTA.
3. About section explaining Study Jams in clear, concise terms: hands-on guided learning around Google Cloud; frame specific paths/content as edition-dependent.
4. Pinned scroll story: "From curious to cloud-ready" with 3 visual states: Explore, Build, Share; status indicators and a terminal-style progress line.
5. Learning / missions cards, phrased as sample editable tracks (Cloud Foundations, Build with Google Cloud, Community Challenge) and explicitly easy to change to match actual curriculum; do not claim these are official tracks.
6. Event details strip/cards: Date, Venue/Mode, Registration deadline with placeholder values, visually tidy and not falsely filled in.
7. "How it works" steps: Register, Follow the learning path, Complete hands-on labs, Share progress (edit to match organizers' process).
8. FAQ accordion with useful questions: Who can join? Is prior experience required? What do I need? How do labs work? Are certificates/rewards available? Answer the last with a clear caveat that it depends on the current edition and organizer confirmation.
9. Final CTA with pixel cloud / terminal motif.
10. Footer naming GDG on Campus at IARE, with editable social links placeholders and a concise note that event details are subject to organizer confirmation.

FUNCTIONALITY
- All nav links scroll to sections, CTAs navigate to a configurable registration URL placeholder (use a single clearly named constant/config at top, default "#" and avoid dead external links), FAQ accordion works accessibly, mobile menu works, motion is responsive and reduced-motion aware.
- Strong responsive layout for mobile, tablet, desktop; semantic HTML, keyboard focus styles, accessible contrast, aria labels where needed.
- Include tasteful pixel-art elements made from CSS/SVG, not emoji spam. Use the project's existing stack and components. Make the first viewport immediately impressive and ensure section hierarchy and spacing are strong.
- No backend/database/auth needed for this first version. Make event copy and links easy to edit in one obvious config/data section.
- After building, check for TypeScript/build errors if tools permit and fix obvious issues.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
