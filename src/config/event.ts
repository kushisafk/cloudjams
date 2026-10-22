// ============================================================
// EDIT EVENT DETAILS HERE — all copy & links live in this file.
// ============================================================

/** Registration route or external URL. */
export const REGISTRATION_URL: string = "/register";

/** Toggle whether registration is currently open. */
export const REGISTRATION_OPEN = true;

export const EVENT = {
  name: "Google Cloud Study Jams",
  learning: "Google Skills hands-on labs",
  access: "Google Skills credits for participants",
  organizer: "GDG on Campus at IARE",
  date: "[Add event date]",
  venue: "[Add venue / online mode]",
  deadline: "10th Nov 2026",
};

/** EXAMPLE missions — edit once organizers confirm the actual curriculum. */
export const TRACKS = [
  { id: "CLOUD 01", title: "Cloud Foundations", level: "EASY", icon: "cloud", body: "Get comfortable with core cloud concepts and the Google Cloud console." },
  { id: "CLOUD 02", title: "Build with Google Cloud", level: "NORMAL", icon: "chip", body: "Guided hands-on labs where you deploy and experiment with real services." },
  { id: "BONUS", title: "Community Challenge", level: "CO-OP", icon: "star", body: "Learn alongside peers, compare progress and help each other finish." },
] as const;

export const STEPS = [
  { title: "Register", body: "Sign up through the official registration link before 10th Nov 2026." },
  { title: "Follow the learning path", body: "Get access to the path for this edition and work through it at your pace." },
  { title: "Complete hands-on labs", body: "Work in real cloud environments through guided, step-by-step labs." },
  { title: "Earn badges & certificate", body: "Earn Google Cloud Skill Badges on completing labs and unlock your certificate (requirements shared later)." },
];

export const FAQS = [
  { q: "Who can join?", a: "Students interested in cloud computing are welcome. Eligibility for this edition will be confirmed by GDG on Campus at IARE." },
  { q: "Is prior experience required?", a: "No. Study Jams are designed as guided learning, so beginners can follow along. Some familiarity with basic computing helps." },
  { q: "What do I need?", a: "A laptop, a stable internet connection, and a Google account. Any additional requirements will be shared by organizers." },
  { q: "How do labs work?", a: "Labs give you temporary access to real cloud environments with step-by-step instructions, so you can practice without setting up your own billing." },
  { q: "Are certificates or rewards available?", a: "Yes! You will earn Google Cloud Skill Badges on completing hands-on labs, and a certificate will be provided (specific completion requirements for the certificate will be shared later)." },
];

export const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/gdgc.iare/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/gdgciare/home/" },
  { label: "GDG Community", href: "https://gdg.community.dev/gdg-on-campus-institute-of-aeronautical-engineering-hyderabad-india/" },
];
