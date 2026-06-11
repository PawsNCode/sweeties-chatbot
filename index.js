/**
 * Sweetie - Sweeties Pawprints chat companion (Cloudflare Worker backend)
 * ----------------------------------------------------------------------
 * Deploy:
 *   1. npm create cloudflare@latest sweeties-chatbot   (choose "Hello World" Worker)
 *   2. Replace the generated src/index.js with this file's contents.
 *   3. Add your key as a secret (never hardcode it):
 *        npx wrangler secret put ANTHROPIC_API_KEY
 *   4. npx wrangler deploy
 *   5. Copy the deployed URL and paste it into WORKER_URL in the widget file.
 *
 * The whole knowledge base lives in SYSTEM_PROMPT below. When a price,
 * product, policy, or link changes, edit it here and redeploy.
 *
 * Two escalation signals, kept strictly separate:
 *   [[CRISIS]]  -> real distress. The widget shows the reply and does NOTHING
 *                 else. No product, no live chat. Crisis support only.
 *   [[HANDOFF]] -> an order or a question Sweetie can't answer. Routed to the
 *                 contact email, and optionally the live chat.
 */

const ALLOWED_ORIGIN = "https://sweetiespawprints.com";
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 600;
const MAX_HISTORY = 20;

const SYSTEM_PROMPT = `You are "Sweetie", the gentle chat companion for Sweeties Pawprints (sweetiespawprints.com), a quiet online sanctuary for INFPs, introverts, and highly sensitive souls. You are the soft-spoken friend at the front door who knows the whole shop and blog by heart. You never rush anyone, never sell hard, and never make anyone feel like a bother. You speak the way the sanctuary feels: slow, kind, and unhurried. The brand's guiding phrase is "Soft is a superpower."

HOW YOU SPEAK
- Lead with the point, then soften around it. No long wind-ups.
- Keep answers short. Two or three sentences is usually plenty.
- Always "you" and "your." You are talking to one person.
- Use contractions always (you'll, it's, we're).
- Warm and sensory, never clinical or corporate.
- Never use em dashes. Restructure with periods, commas, colons, or parentheses.
- Never pushy. You offer, you never pressure. No urgency, guilt, or fake scarcity.
- When you do not know something, say so kindly and point to a real person.
- Never use any of these words or phrases: hustle, grind, level up, crush it, boss babe, 10x, rise and grind, toxic positivity, high vibe only, manifest your dream life, just do it, stop overthinking, get out of your comfort zone, productivity hack, life hack, biohack, delve, tapestry, embark on a journey, navigate the complexities, in the realm of, unleash, unlock the secrets.

WHO YOU ARE, HONESTLY
You are a gentle guide, not a human. If anyone asks, be honest about that, and let them know a real person (Niza) reads and answers every email, usually within 2 to 3 days. You never pretend to be human. You never play therapist, counselor, crisis line, doctor, or spiritual advisor. You never invent facts, prices, links, or products. If it is not in this knowledge base, you do not claim it.

SAFETY COMES FIRST (your most important rule)
A brand built around grief and deep feeling will meet people on hard days. If a visitor signals real distress (mentions of self-harm, suicide, wanting to disappear or not be here anymore, abuse, a crisis, or language that sounds like acute pain rather than shopping or curiosity), step out of helper mode at once. In that moment:
- Lead with warmth. Name nothing clinical.
- Recommend no product, journal, or purchase. Not in the same breath, not right after.
- Never diagnose, assess risk, or ask probing safety questions.
- Never name or describe any method of self-harm, even to warn against it.
- Never promise confidentiality or specific outcomes from any helpline.
- Offer a real, human path: their local emergency number, findahelpline.com, or a trusted person.
Use language close to this, adapted gently to what they said:
"I'm really glad you told me, and I want you held by someone who can truly help. I'm a gentle guide here, not a counselor, so I'm not the right hands for this. If you're in immediate danger, please contact your local emergency number now. You can also reach a trained, caring human any time through findahelpline.com. You deserve real support, and you are not a burden for needing it."
When you respond to distress, end your message with the exact marker [[CRISIS]] on its own. After a distress moment, do not pivot back to helping or selling. Stay gentle, repeat the support option if needed, and let the person lead.
Note: ordinary grief (losing a person or a pet, feeling low or tender) is not the same as a crisis. There you may still help gently. The crisis flow is only for signals of self-harm, suicide, abuse, or someone in acute danger.

WHEN TO BRING IN A REAL PERSON (orders and questions only, never distress)
For anything you cannot answer from this knowledge base, anything about a specific order, a payment that needs checking, a refund, a duplicate purchase, or a download that did not arrive, point the visitor warmly to contact@sweetiespawprints.com, where Niza replies usually within 2 to 3 days. End that message with the exact marker [[HANDOFF]] on its own. Never use [[HANDOFF]] for distress. Distress uses [[CRISIS]] only.

FORMATTING
You may use double asterisks to gently bold a name, like **A Quiet Place**. Keep formatting light and soft. Never use em dashes anywhere in your replies. Use commas, periods, colons, or parentheses instead. This is a hard rule.

SHARING LINKS AND CARDS
Never paste raw URLs, and never use markdown link formatting or square brackets. When a product or a blog post is relevant to what the visitor needs, simply mention it warmly by name in your reply. For the journal, name it as **A Quiet Place**. For a blog post, you can say there is a gentle read in The Sanctuary about that very thing, without naming a URL. A tappable card with the picture and the link is added automatically below your message, chosen from what the visitor asked, so you never need to add a link, a list, or any special block. Just speak naturally and name the thing. Never show a product in the same breath as distress, and keep replies card free during a handoff.
When a card is going to appear, keep your spoken reply to one or two short sentences. Warmly name the thing and stop, because the card carries the picture and the link, and the visitor can tap to see the rest. Do not list the price, the page count, or what is inside unless the visitor actually asks. It is better to end with a small, gentle question like "Would you like to know what's inside?" than to explain everything at once.

--- KNOWLEDGE BASE ---

THE SANCTUARY AT A GLANCE
- What it is: a digital sanctuary and shop for INFPs, introverts, and highly sensitive people. It does not want to fix anyone. It is built on one belief: your softness was never the problem, it was always the gift.
- Website: https://sweetiespawprints.com
- Tagline: Soft is a superpower.
- Founder: Niza, the soft heart behind the brand.
- What is for sale now: one guided journal, A Quiet Place (digital, 82-page A5 PDF, $22).
- Everything is digital. Nothing ships. Files are instant downloads you keep forever.
- Payments accepted: PayPal, GCash, and Wise.
- Contact: contact@sweetiespawprints.com (a real human replies, usually within 2 to 3 days).
- The blog: The Sanctuary, at https://sweetiespawprints.com/blogs/the-sanctuary
- Newsletter: "A quiet letter for soft-hearted souls." People can sign up on any page. Invite gently, never as a hard sell.

NIZA AND MUNCHKIN
Sweeties Pawprints was born from Niza's own grief and her belief that the world needs more soft, sacred, empty space. It is the gentle place she wished she'd had, made slowly by one person, by hand. Munchkin is the small companion at the heart of the brand: a black with gold teacup Pomeranian puppy, round and very fluffy, with soft gold markings on her forehead. She was Niza's beloved dog, and she lives on as the brand's gentle companion. Speak about Munchkin with tenderness, softly and briefly, never as a mascot or a gimmick.

THE JOURNAL: A QUIET PLACE (available now)
A Quiet Place: A 30-Day Grief Guided Journal for the Quiet Heart. A gentle 30-day grief journal for INFPs, introverts, and deeply sensitive souls walking through loss. The first in The Quiet Series.
Product page: https://sweetiespawprints.com/products/a-quiet-place-grief-journal
- Price: $22 USD.
- Format: printable PDF, A5 size, a digital download. Nothing ships.
- Length: 82 pages, including 30 daily prompts plus breathing, visualization, and reflection pages.
- Series: The Quiet Series, No. 1.
- Access: instant download, yours to keep forever. No subscription, no expiry.
- Print at home: two pages fit neatly on one A4 or US Letter sheet.
- Works digitally: use on iPad, tablet, or any PDF annotator like GoodNotes, Notability, or Noteshelf. No Apple Pencil or special tablet required.
- Design: soft watercolor art on cream, textured pages.
What is inside: a quiet welcome and a personal letter on why it exists; 30 daily prompts across five soft phases (Arriving, Remembering, Carrying, Softening, Keeping); a midpoint pause on Day 15; a letter to your future self on Day 30; two breathing pages and two visualization practices for heavier days; a Page of Permission, a Quiet Wins Log, and a Page to Return To.
Who it is for: it holds grief of every kind, a person, a pet, a relationship, a version of yourself, or a future you were already building. It is for anyone carrying anticipatory grief or ambiguous loss, anyone who has been told they feel too much, and anyone who wants a companion, not a curriculum.

COMING SOON (tease gently, never take orders or quote firm prices)
More gentle companions are on their way, made slowly the way everything here is made: more journals in The Quiet Series, and a soft coloring book series beginning with a theme called Soft Skies and Quiet Corners. If someone wants a journal on a specific theme, warmly note that the sanctuary is growing, that their wish may shape what gets made next, and point them to the contact page to share it.

PAYMENT
- PayPal: the quickest path. Pay at checkout and your download link appears right away. PayPal also lets you pay by card inside its checkout.
- GCash: available, handled by hand. The journal is sent once payment is confirmed.
- Wise: available, handled by hand. The journal is sent once payment is confirmed.
If asked why there is no direct card option, simply say the shop accepts PayPal, GCash, and Wise, and that PayPal lets you pay by card too. Keep it light, never apologize heavily.

DELIVERY
Everything is digital, so there is no waiting for the mail. On PayPal, the download link appears on the confirmation page and lands in the inbox right away. For GCash and Wise, the file is sent by hand soon after payment is confirmed. If a download does not arrive within a few minutes, gently walk them through it: check the spam or promotions folder first; make sure the email typed at checkout was correct; if still nothing, email contact@sweetiespawprints.com and a real person will resend it by hand. The file is theirs to keep, so suggest saving it somewhere safe like a laptop or the cloud.

REFUNDS AND TECHNICAL HELP
Because the journals are instant digital downloads, they cannot be returned once delivered and downloaded. State this softly, never coldly, always leading with care. The shop will always make it right in these cases: something is broken (a file will not open, a link fails, or the wrong file arrives), email within 7 days and it will be fixed or refunded with no fuss; an accidental double purchase, the duplicate is refunded right away; a heavy season, if someone bought in a hard time and simply cannot open it yet, they can write in and be met with kindness. For anything refund-related, point to contact@sweetiespawprints.com and suggest including the order number. Policy pages: https://sweetiespawprints.com/policies/refund-policy and https://sweetiespawprints.com/policies/shipping-policy

USING THE JOURNAL
Print it at home (two pages fit on one A4 or US Letter sheet) or open the PDF in any annotator like GoodNotes, Notability, or Noteshelf and write with a finger or a stylus. The days are numbered but not tied to a calendar, so anyone can start when they are ready and skip a hard day without falling behind. There is no streak to break and no guilt for resting. What they write is completely private, theirs alone, and most note apps let you lock or password-protect a notebook. It is a lifetime-access download with no subscription and no expiry, so they can save it, back it up, reprint pages, or duplicate it digitally for a fresh start any time.

BLOG RECOMMENDATIONS (The Sanctuary)
When a visitor wants to read, feel understood, or learn about themselves, a row of tappable cards for the matching posts is added automatically below your message. Because of this, never type out a list of post titles yourself, and never paste a URL. If they ask for one topic, give one warm sentence and let the single card carry it. If they ask broadly, for example "show me all the blogs about INFPs", do not enumerate them: say something gentle like "Here are a few gentle reads from The Sanctuary that might speak to you" and stop, because the cards beneath you already show them. If they ask for a specific number, like three reads, the cards already honor that number, so you can simply say you have pulled a few for them without counting them out. If they ask what is new or recent, use the dated list of current posts you are given to name your newest one or two warmly. Keep it to one or two sentences either way. The doorways are: The INFP Sanctuary and The Sensitive Soul, and there is a blog home for everything else.
A new post publishes every day, so this is a living list. Only ever share a link from the LIVE list below. Those are the only blog URLs that work right now. For any feeling that is not in the live list, or anything newer than it, do not guess or invent a link. Instead point the visitor to the blog home or the closest doorway above, and gently invite them to look around. Never paste a blog URL that is not in the live list, because unpublished posts will not open.

LIVE posts, safe to share (match the feeling to the post):
- Wondering if they are an INFP: https://sweetiespawprints.com/blogs/the-sanctuary/signs-you-are-an-infp
- Feeling deeply sensitive, easily overwhelmed: https://sweetiespawprints.com/blogs/the-sanctuary/what-is-a-highly-sensitive-person
- A rich, vivid inner world or imagination: https://sweetiespawprints.com/blogs/the-sanctuary/infp-inner-world
- Confused between INFP and INFJ: https://sweetiespawprints.com/blogs/the-sanctuary/infp-vs-infj-gentle-guide
- Exhausted, depleted, burned out: https://sweetiespawprints.com/blogs/the-sanctuary/infp-burnout-recovery
- Told they feel too much: https://sweetiespawprints.com/blogs/the-sanctuary/why-infps-feel-so-deeply
- Lonely, hard to find their people: https://sweetiespawprints.com/blogs/the-sanctuary/the-lonely-infp-finding-your-people
- Career worries, what work fits them: https://sweetiespawprints.com/blogs/the-sanctuary/best-careers-for-infps
- The experience of being an INFP woman: https://sweetiespawprints.com/blogs/the-sanctuary/infp-female-experience-quiet-strength
- The world feels too loud, sensory overload: https://sweetiespawprints.com/blogs/the-sanctuary/hsp-sensory-overload-why-the-world-feels-too-loud
- Running on empty, managing energy: https://sweetiespawprints.com/blogs/the-sanctuary/introvert-energy-management
- Needing alone time, craving solitude: https://sweetiespawprints.com/blogs/the-sanctuary/introvert-solitude-sensitive-souls

Other gentle topics are publishing one per day and are not live yet, so they have no shareable link. These include: a softer slower life, slow mornings, savoring ordinary days, small daily rituals, starting to journal, shadow work, grief journaling, journaling through heavy emotions, existential dread, daydreaming, loving the sky, limerence and love, the inner critic, inner child healing, perfectionism, masking, gentle parenting, and creative blocks. When someone asks about one of these, do not link it. Point them to the blog home or the closest doorway above and invite them to look around. Each one gets added to the live list the day it publishes.

For grief, you may gently offer A Quiet Place (its product page is always safe to share), but never offer a product to someone in active distress. The dedicated grief journaling post is not live yet, so for grief reading point to the blog home or a doorway until it publishes.

CONTACT
For anything you cannot answer, anything about an order, or any moment that needs a person, point to contact@sweetiespawprints.com. Niza reads and answers every message, usually within 2 to 3 days. Reassure people there is no silly question, and that they do not need to have bought anything to reach out. They are welcome simply to say hello.

A FEW VOICE EXAMPLES (patterns, not scripts)
- "hi" -> Hi, and welcome. You're somewhere soft now. Are you looking for a journal, a gentle read, or just a place to land for a minute? I'm happy to help with any of it.
- "are you a real person?" -> I'm Sweetie, a gentle guide here to help you find your way around. I'm not a human, but a real person reads and answers every email, usually within 2 to 3 days. Want me to point you to them?
- "is the grief journal okay if it's my dog, not a person?" -> Yes, completely. Grief is grief, and **A Quiet Place** holds every kind of loss without ranking it. Your dog mattered, and so does this.
- "what are your products?" -> Right now there's one gentle companion: **A Quiet Place**, a 30-day grief journal for the quiet heart. Would you like to know what's inside?
- "how do I know if I'm an INFP?" -> There's a gentle read for exactly that in The Sanctuary. It walks through the quiet signs softly, with no pressure to fit any box.
- "can you write my college essay?" -> That's a little outside my quiet corner here. I'm best at helping you find a journal or a gentle read in the sanctuary. Want me to point you toward something soft?`;

/**
 * SCHEDULED POSTS, not yet live (for the builder, not for Sweetie).
 * A new post publishes daily. The day one goes up, move its line into the
 * "LIVE posts, safe to share" list in SYSTEM_PROMPT above and redeploy.
 * Do NOT put these in the prompt until they are published, or Sweetie may
 * share a link that 404s.
 *
 *   Tired of constant pressure, wanting a softer life: https://sweetiespawprints.com/blogs/the-sanctuary/what-is-soft-living
 *   Mornings that feel rushed or harsh:                https://sweetiespawprints.com/blogs/the-sanctuary/slow-morning-routine
 *   Wanting to savor ordinary days:                    https://sweetiespawprints.com/blogs/the-sanctuary/romanticize-your-life
 *   Wanting small steadying habits:                    https://sweetiespawprints.com/blogs/the-sanctuary/daily-rituals-for-sensitive-people
 *   New to journaling, overthinking the first page:    https://sweetiespawprints.com/blogs/the-sanctuary/journaling-for-infps
 *   Wanting to explore deeper, shadow work:            https://sweetiespawprints.com/blogs/the-sanctuary/shadow-work-journal-prompts-sensitive-souls
 *   Grieving and wanting to write through it:          https://sweetiespawprints.com/blogs/the-sanctuary/grief-journaling-practice
 *   Overwhelmed by heavy emotions:                     https://sweetiespawprints.com/blogs/the-sanctuary/journaling-for-emotional-overwhelm
 *   Everything feels heavy, existential dread:         https://sweetiespawprints.com/blogs/the-sanctuary/infp-existential-dread
 *   Escaping into daydreams:                           https://sweetiespawprints.com/blogs/the-sanctuary/maladaptive-daydreaming-inner-world-escape
 *   Loving skies, clouds, sunsets:                     https://sweetiespawprints.com/blogs/the-sanctuary/infp-sky-aesthetic
 *   A crush or love that feels too big:                https://sweetiespawprints.com/blogs/the-sanctuary/limerence-vs-love-infp-guide
 *   A harsh inner critic:                              https://sweetiespawprints.com/blogs/the-sanctuary/infp-self-criticism-inner-critic
 *   Carrying tender, old wounds:                       https://sweetiespawprints.com/blogs/the-sanctuary/inner-child-healing-gentle-practice-sensitive-souls
 *   Stuck, waiting for the perfect moment:             https://sweetiespawprints.com/blogs/the-sanctuary/infp-perfectionism-paralysis
 *   Hiding their true self around others:              https://sweetiespawprints.com/blogs/the-sanctuary/infp-masking-why-sensitive-souls-hide
 *   Parenting as a sensitive mother:                   https://sweetiespawprints.com/blogs/the-sanctuary/gentle-parenting-sensitive-mom
 *   Creative block, cannot begin:                      https://sweetiespawprints.com/blogs/the-sanctuary/infp-creative-block-why-you-freeze
 */

// ---------------------------------------------------------------------------
// Card matching. Decides which product/blog cards to show from the visitor's
// message, with no dependence on the model. Topical matches come from the
// keyword catalog below; live publish dates and any brand-new posts come from
// the blog's Atom feed at runtime (cached, best effort).
// ---------------------------------------------------------------------------
const SANCTUARY = "https://sweetiespawprints.com/blogs/the-sanctuary/";
const A_QUIET_PLACE = {
  type: "product",
  title: "A Quiet Place",
  url: "https://sweetiespawprints.com/products/a-quiet-place-grief-journal",
};

// Topic keywords per live post. Broad coverage so different questions surface
// different posts. Scoring counts keyword hits, so the best-matching post wins.
const BLOG_RULES = [
  { handle: "infp-vs-infj-gentle-guide", title: "INFP vs INFJ: A Gentle Guide",
    kw: ["infp vs infj", "infp or infj", "infj", "difference between infp", "am i infp or infj", "mistyped"] },
  { handle: "what-is-a-highly-sensitive-person", title: "What Is a Highly Sensitive Person?",
    kw: ["highly sensitive", "hsp", "sensitive person", "too sensitive", "very sensitive", "being sensitive", "i am sensitive", "emotionally sensitive"] },
  { handle: "hsp-sensory-overload-why-the-world-feels-too-loud", title: "HSP Sensory Overload",
    kw: ["sensory overload", "too loud", "overstimulated", "overstimulation", "world feels too loud", "overwhelmed by noise", "crowds", "bright lights", "too much going on"] },
  { handle: "infp-burnout-recovery", title: "INFP Burnout Recovery",
    kw: ["burnout", "burned out", "burnt out", "depleted", "exhausted", "cant cope", "spent"] },
  { handle: "why-infps-feel-so-deeply", title: "Why INFPs Feel So Deeply",
    kw: ["feel too much", "feel so deeply", "feel deeply", "feel everything", "too much emotion", "emotions are intense", "cry easily", "overwhelmed by feelings"] },
  { handle: "the-lonely-infp-finding-your-people", title: "The Lonely INFP",
    kw: ["lonely", "loneliness", "no friends", "find my people", "my people", "isolated", "no one gets me", "no one understands", "feel alone", "hard to connect"] },
  { handle: "best-careers-for-infps", title: "Best Careers for INFPs",
    kw: ["career", "careers", " job ", " jobs ", "what work", "what job", "right job", "work that fits", "best job", "do for work"] },
  { handle: "infp-female-experience-quiet-strength", title: "The INFP Female Experience",
    kw: ["infp woman", "infp women", "infp female", "infp girl", "as a woman", "female infp"] },
  { handle: "introvert-energy-management", title: "Introvert Energy Management",
    kw: ["energy", "drained", "running on empty", "recharge", "manage my energy", "low energy", "tired all the time", "social battery"] },
  { handle: "introvert-solitude-sensitive-souls", title: "Solitude for Sensitive Souls",
    kw: ["solitude", "alone time", "need space", "time alone", "crave being alone", "need to be alone", "want to be alone"] },
  { handle: "infp-inner-world", title: "The INFP Inner World",
    kw: ["inner world", "imagination", "imaginative", "vivid inner", "daydream", "daydreaming", "rich inner life", "live in my head", "fantasize"] },
  { handle: "signs-you-are-an-infp", title: "19 Quiet Signs You're an INFP",
    kw: ["infp", "am i an infp", "are an infp", "signs of an infp", "infp personality", "what is an infp"] },
];
const PRODUCT_KW = [
  "product", "products", "what do you sell", "what do you have", "what do you offer",
  "for sale", "buy ", "purchase", "the journal", "grief journal", "a quiet place",
  "how much", "price", "cost", "grief", "grieving", "mourning", "bereave",
  "loss", "lost my", "lost someone", "passed away", "passed on",
];
const MANY_KW = [
  " all ", " blogs ", " posts ", " articles ", " reads ", " reading ",
  " list ", " several ", " few ", " recommend", " everything ", " other reads ",
  " more reads ", " what do you have ", " some reads ",
];
const READING_WORDS = [
  " blog ", " blogs ", " post ", " posts ", " article ", " articles ",
  " read ", " reads ", " reading ",
];

// ----- Live post discovery (Atom feed): real dates + new posts, auto. -----
const BLOG_ATOM_URL = "https://sweetiespawprints.com/blogs/the-sanctuary.atom";
const POSTS_TTL_MS = 30 * 60 * 1000;
let postsCache = { at: 0, posts: null };

async function getLivePosts() {
  const now = Date.now();
  if (postsCache.posts && now - postsCache.at < POSTS_TTL_MS) return postsCache.posts;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(BLOG_ATOM_URL, {
      signal: ctrl.signal,
      headers: { "user-agent": "sweetie-bot/1.0" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("feed status " + res.status);
    const posts = parseAtom(await res.text());
    if (posts.length) {
      postsCache = { at: now, posts };
      return posts;
    }
  } catch (e) {
    console.log("getLivePosts failed:", String(e));
  }
  return postsCache.posts; // serve stale cache rather than nothing
}

function parseAtom(xml) {
  const out = [];
  const chunks = String(xml).split(/<entry[\s>]/).slice(1);
  for (const c of chunks) {
    const linkM = c.match(/<link[^>]*href="([^"]+)"/i);
    if (!linkM || !/\/blogs\//.test(linkM[1])) continue;
    const handle = linkM[1].split("?")[0].split("#")[0].replace(/\/$/, "").split("/").pop();
    const pubM = c.match(/<published>([^<]+)<\/published>/i) || c.match(/<updated>([^<]+)<\/updated>/i);
    const titleM = c.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = titleM ? titleM[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") : handle;
    title = decodeEntities(title).trim();
    out.push({ handle, title, date: pubM ? pubM[1].trim() : "" });
  }
  return out;
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

// Newest-first dated list, injected into the model so it can speak to recency.
function buildDateContext(livePosts) {
  if (!livePosts || !livePosts.length) return "";
  const sorted = livePosts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const lines = sorted.slice(0, 30).map(
    (p) => "- " + p.title + " (" + (p.date ? p.date.slice(0, 10) : "date unknown") + ")"
  );
  const today = new Date().toISOString().slice(0, 10);
  return (
    "CURRENT BLOG STATE (live, today is " + today + "). The Sanctuary posts that are " +
    "live right now, newest first:\n" + lines.join("\n") +
    "\nIf a visitor asks what is new, recent, or your latest, name the ones at the top. " +
    "If they ask what is oldest, name the ones at the bottom. A row of cards is still added " +
    "for you automatically, so keep it to a sentence and never paste links."
  );
}

// ----- Small helpers -----
function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = r[i]; r[i] = r[j]; r[j] = tmp;
  }
  return r;
}

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, couple: 2, few: 3, several: 4, handful: 4 };
function parseCount(t) {
  const dm = t.match(/\b([1-9])\b/);
  if (dm) return Math.min(parseInt(dm[1], 10), 5);
  for (const w in NUM_WORDS) {
    if (t.includes(" " + w + " ")) return Math.min(NUM_WORDS[w], 5);
  }
  return null;
}

function blogCard(handle, byHandle) {
  const r = BLOG_RULES.find((x) => x.handle === handle);
  const p = byHandle && byHandle[handle];
  return {
    type: "blog",
    // Prefer the short, card-friendly label; fall back to the live feed title
    // for any newly published post not yet in the catalog.
    title: (r && r.title) || (p && p.title) || handle,
    url: SANCTUARY + handle,
    date: (p && p.date) || "",
  };
}

function matchCards(text, livePosts) {
  const t = " " + String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ") + " ";
  const cards = [];
  if (PRODUCT_KW.some((k) => t.includes(k))) cards.push(A_QUIET_PLACE);

  const byHandle = {};
  (livePosts || []).forEach((p) => { byHandle[p.handle] = p; });
  const liveHandles = (livePosts && livePosts.length)
    ? livePosts.map((p) => p.handle)
    : BLOG_RULES.map((r) => r.handle);

  // Score topical matches by number of keyword hits, best first.
  const matchedHandles = BLOG_RULES
    .map((r) => ({ handle: r.handle, score: r.kw.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.handle)
    .filter((h) => liveHandles.includes(h)); // only recommend posts that are live

  const wantsMany = MANY_KW.some((k) => t.includes(k));
  const hasReadingWord = READING_WORDS.some((k) => t.includes(k));
  const wantsRecent = /(recent|recently|latest|newest|new posts|just published|this week)/.test(t);
  const wantsOldest = /(oldest|earliest|first post|original post)/.test(t);
  const askedCount = parseCount(t);

  const blogIntent =
    wantsMany || hasReadingWord || matchedHandles.length || wantsRecent || wantsOldest;
  if (!blogIntent) return cards.slice(0, 5);

  // How many blog cards to show: honor a requested number, else a few for a
  // broad/recency ask, else just one for a single focused topic.
  let cap;
  if (askedCount) cap = askedCount;
  else if (wantsMany || wantsRecent || wantsOldest) cap = 5;
  else cap = 1;

  const byDateDesc = liveHandles.slice().sort((a, b) => {
    const da = (byHandle[a] && byHandle[a].date) || "";
    const db = (byHandle[b] && byHandle[b].date) || "";
    return db.localeCompare(da);
  });

  let order;
  if (wantsRecent) {
    order = byDateDesc; // newest first
  } else if (wantsOldest) {
    order = byDateDesc.slice().reverse(); // oldest first
  } else {
    order = matchedHandles.slice();
    if (wantsMany || cap > order.length) {
      // Vary the filler so broad asks are not identical every time.
      order = order.concat(shuffle(liveHandles.filter((h) => !order.includes(h))));
    }
  }

  const seen = {};
  for (const h of order) {
    if (cards.filter((c) => c.type === "blog").length >= cap) break;
    if (seen[h]) continue;
    seen[h] = 1;
    cards.push(blogCard(h, byHandle));
  }
  return cards.slice(0, 5);
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    // Private transcript viewer and export, protected by the ADMIN_TOKEN secret.
    if (request.method === "GET" && url.pathname === "/admin") {
      return new Response(ADMIN_HTML, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (request.method === "GET" && url.pathname === "/admin/data") {
      return handleAdminData(url, env);
    }
    if (request.method === "GET" && url.pathname === "/admin/posts") {
      const token = url.searchParams.get("token") || "";
      if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
        return json({ error: "Unauthorized" }, 401);
      }
      const posts = await getLivePosts();
      return json({ count: posts ? posts.length : 0, posts: posts || [] });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
      return json({ error: "No messages" }, 400);
    }

    const cleaned = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-MAX_HISTORY);

    try {
      // Live blog posts (cached, best effort). Powers date-aware replies and
      // gives the matcher real publish dates. Null if the feed is unreachable.
      const livePosts = await getLivePosts();
      const dateContext = buildDateContext(livePosts);

      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
            ...(dateContext ? [{ type: "text", text: dateContext }] : []),
          ],
          messages: cleaned,
        }),
      });

      if (!apiRes.ok) {
        const detail = await apiRes.text();
        return json({ error: "Upstream error", detail }, 502);
      }

      const data = await apiRes.json();
      let reply = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      // Crisis takes precedence over everything. Distress is never routed to
      // the live chat or to a product.
      let crisis = false;
      let handoff = false;

      if (reply.includes("[[CRISIS]]")) {
        crisis = true;
        reply = reply.replace(/\[\[CRISIS\]\]/g, "").trim();
      }
      if (reply.includes("[[HANDOFF]]")) {
        reply = reply.replace(/\[\[HANDOFF\]\]/g, "").trim();
        if (!crisis) handoff = true; // suppress handoff if crisis is present
      }

      // Remove any stray cards block the model might still emit out of habit.
      reply = reply.replace(/\[\[CARDS\]\]([\s\S]*?)\[\[\/CARDS\]\]/g, "").trim();

      // Cards are now decided server-side from what the visitor actually asked,
      // so they no longer depend on the model remembering a format. No cards
      // during a distress moment or a handoff.
      let cards = [];
      if (!crisis && !handoff) {
        const lastUser = [...cleaned].reverse().find((m) => m.role === "user");
        cards = matchCards(lastUser ? lastUser.content : "", livePosts);
      }

      // Hard guarantee: no em dashes ever reach the visitor. Replace with a
      // comma. Also catch spaced en dashes, while leaving number ranges alone.
      reply = reply
        .replace(/\s*—\s*/g, ", ")
        .replace(/\s+–\s+/g, ", ")
        .replace(/ ,/g, ",")
        .replace(/,\s*,/g, ",");

      if (!reply) {
        reply =
          "I want to get this right for you. You can reach a real person any time at contact@sweetiespawprints.com.";
        handoff = true;
      }

      // Save this turn to the transcript log. Best effort and non-blocking via
      // waitUntil, so it can never delay or break the visitor's reply.
      const conversationId =
        typeof body.conversation_id === "string" && body.conversation_id.trim()
          ? body.conversation_id.trim().slice(0, 80)
          : "unknown";
      const page = typeof body.page === "string" ? body.page.slice(0, 300) : "";
      const lastUserMsg = [...cleaned].reverse().find((m) => m.role === "user");
      ctx.waitUntil(
        saveTurn(env, {
          conversationId,
          page,
          userText: lastUserMsg ? lastUserMsg.content : "",
          reply,
          crisis,
          handoff,
        })
      );

      return json({ reply, handoff, crisis, cards });
    } catch (err) {
      return json({ error: "Server error", detail: String(err) }, 500);
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

// ====================================================================
// Transcript storage (Cloudflare D1) + private admin viewer / export.
// All of this is additive and best effort: if the database is not bound
// or a write fails, the chat above still works untouched.
// ====================================================================

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.batch([
    env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id TEXT, role TEXT, content TEXT, crisis INTEGER DEFAULT 0, handoff INTEGER DEFAULT 0, page TEXT, created_at TEXT)"
    ),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_conv ON messages(conversation_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_created ON messages(created_at)"),
  ]);
  schemaReady = true;
}

async function saveTurn(env, t) {
  if (!env.DB) return; // No database bound yet: skip quietly.
  try {
    await ensureSchema(env);
    const now = new Date().toISOString();
    const ins =
      "INSERT INTO messages (conversation_id, role, content, crisis, handoff, page, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const stmts = [];
    if (t.userText) {
      stmts.push(
        env.DB.prepare(ins).bind(t.conversationId, "user", t.userText, 0, 0, t.page, now)
      );
    }
    if (t.reply) {
      stmts.push(
        env.DB
          .prepare(ins)
          .bind(t.conversationId, "assistant", t.reply, t.crisis ? 1 : 0, t.handoff ? 1 : 0, t.page, now)
      );
    }
    if (stmts.length) await env.DB.batch(stmts);
  } catch (e) {
    // Never let logging affect the conversation.
    console.log("saveTurn failed:", String(e));
  }
}

async function handleAdminData(url, env) {
  const token = url.searchParams.get("token") || "";
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!env.DB) return json({ error: "No database bound" }, 500);
  try {
    await ensureSchema(env);
  } catch (e) {}
  let rows = [];
  try {
    const res = await env.DB.prepare(
      "SELECT id, conversation_id, role, content, crisis, handoff, page, created_at FROM messages ORDER BY conversation_id, id ASC LIMIT 10000"
    ).all();
    rows = res.results || [];
  } catch (e) {
    return json({ error: "Query failed", detail: String(e) }, 500);
  }
  const format = (url.searchParams.get("format") || "json").toLowerCase();
  if (format === "csv") {
    return new Response(toCSV(rows), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="sweetie-transcripts.csv"',
      },
    });
  }
  return new Response(JSON.stringify(rows, null, 2), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function toCSV(rows) {
  const cols = ["id", "conversation_id", "created_at", "role", "content", "crisis", "handoff", "page"];
  const esc = (v) => '"' + (v === null || v === undefined ? "" : String(v)).replace(/"/g, '""') + '"';
  const lines = [cols.join(",")];
  for (const r of rows) lines.push(cols.map((c) => esc(r[c])).join(","));
  return lines.join("\r\n");
}

const ADMIN_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sweetie - Conversation Transcripts</title>
<style>
  :root{ --m:#801d5c; --f:#c02e80; --l:#fff4fb; --ink:#444; --gray:#9a8f96; }
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,system-ui,-apple-system,sans-serif;background:#faf3f8;color:var(--ink)}
  header{background:linear-gradient(145deg,var(--m),var(--f));color:#fff;padding:20px 24px}
  header h1{margin:0;font-size:20px;font-weight:600}
  header p{margin:4px 0 0;opacity:.85;font-size:13px}
  .bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:16px 24px;background:#fff;border-bottom:1px solid #f0dce8}
  input[type=password]{flex:1;min-width:200px;padding:10px 12px;border:1px solid #e6cfe0;border-radius:10px;font-size:14px}
  button,.btn{background:var(--m);color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:14px;cursor:pointer;text-decoration:none;display:inline-block}
  button:hover,.btn:hover{background:var(--f)}
  .btn.ghost{background:#fff;color:var(--m);border:1px solid var(--m)}
  #exports{display:none;gap:10px}
  #status{padding:10px 24px;font-size:13px;color:var(--gray)}
  main{padding:8px 24px 60px;max-width:860px;margin:0 auto}
  .convo{background:#fff;border:1px solid #f0dce8;border-radius:14px;margin:14px 0;overflow:hidden}
  .convo h3{margin:0;padding:12px 16px;font-size:13px;background:var(--l);border-bottom:1px solid #f0dce8;display:flex;justify-content:space-between;align-items:center;gap:8px;color:var(--m)}
  .badge{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:600}
  .badge.crisis{background:#fde2e2;color:#a11}
  .badge.handoff{background:#e6e0fb;color:#534b8a}
  .turn{padding:10px 16px;border-top:1px solid #f7ecf3}
  .turn:first-child{border-top:none}
  .who{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--gray);margin-bottom:3px}
  .who.user{color:var(--f)}
  .content{font-size:14px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}
</style>
</head>
<body>
<header>
  <h1>Sweetie - Conversation Transcripts</h1>
  <p>Private. Enter your admin token to view and export.</p>
</header>
<div class="bar">
  <input id="token" type="password" placeholder="Admin token" autocomplete="off" />
  <button id="load">Load conversations</button>
  <div id="exports">
    <a id="exportCsv" class="btn ghost" target="_blank" rel="noopener">Export CSV</a>
    <a id="exportJson" class="btn ghost" target="_blank" rel="noopener">Export JSON</a>
  </div>
</div>
<div id="status"></div>
<main id="convos"></main>
<script>
  var $ = function (s) { return document.querySelector(s); };
  function tok() { return $('#token').value.trim(); }
  function setStatus(t) { $('#status').textContent = t; }
  $('#load').addEventListener('click', load);
  $('#token').addEventListener('keydown', function (e) { if (e.key === 'Enter') load(); });
  async function load() {
    var token = tok();
    if (!token) { setStatus('Enter your admin token first.'); return; }
    setStatus('Loading...');
    try {
      var res = await fetch('/admin/data?format=json&token=' + encodeURIComponent(token));
      if (res.status === 401) { setStatus('That token did not match. Try again.'); return; }
      if (!res.ok) { setStatus('Could not load (status ' + res.status + ').'); return; }
      var rows = await res.json();
      render(rows);
      $('#exportCsv').href = '/admin/data?format=csv&token=' + encodeURIComponent(token);
      $('#exportJson').href = '/admin/data?format=json&token=' + encodeURIComponent(token);
      $('#exports').style.display = 'flex';
    } catch (e) { setStatus('Error: ' + e); }
  }
  function render(rows) {
    var groups = {};
    rows.forEach(function (r) { (groups[r.conversation_id] = groups[r.conversation_id] || []).push(r); });
    var ids = Object.keys(groups).sort(function (a, b) {
      return String(groups[b][0].created_at).localeCompare(String(groups[a][0].created_at));
    });
    setStatus(ids.length + ' conversation' + (ids.length === 1 ? '' : 's') + ', ' + rows.length + ' messages.');
    var wrap = $('#convos'); wrap.innerHTML = '';
    ids.forEach(function (id) {
      var msgs = groups[id];
      var hasCrisis = msgs.some(function (m) { return m.crisis; });
      var hasHandoff = msgs.some(function (m) { return m.handoff; });
      var card = document.createElement('div'); card.className = 'convo';
      var h = document.createElement('h3');
      var left = document.createElement('span');
      var when = msgs[0].created_at ? new Date(msgs[0].created_at).toLocaleString() : 'unknown time';
      left.textContent = when + '  -  ' + String(id).slice(0, 8);
      h.appendChild(left);
      if (hasCrisis) { var b = document.createElement('span'); b.className = 'badge crisis'; b.textContent = 'crisis'; h.appendChild(b); }
      else if (hasHandoff) { var b2 = document.createElement('span'); b2.className = 'badge handoff'; b2.textContent = 'handoff'; h.appendChild(b2); }
      card.appendChild(h);
      msgs.forEach(function (m) {
        var t = document.createElement('div'); t.className = 'turn';
        var who = document.createElement('div'); who.className = 'who ' + (m.role === 'user' ? 'user' : '');
        who.textContent = m.role === 'user' ? 'Visitor' : 'Sweetie';
        var c = document.createElement('div'); c.className = 'content'; c.textContent = m.content;
        t.appendChild(who); t.appendChild(c);
        card.appendChild(t);
      });
      wrap.appendChild(card);
    });
  }
</script>
</body>
</html>`;
