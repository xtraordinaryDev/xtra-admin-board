/**
 * The business, in the words the AI plans from.
 * The brief below is the default; the owner can edit it on /settings and the
 * saved version wins. The routine is fixed code: it is the weekly formula that
 * always runs, and the AI only adds the specifics on top.
 */

export const DEFAULT_BRIEF = `X-traordinary Development LLC (Xavier Thurman, Minneapolis and Miami) is the development team for companies that don't have one. We build custom, AI-native software for mid-sized companies (200 to 2,000 people) in non-tech industries (engineering and construction, agriculture and co-ops, manufacturing, distribution, professional services) that have an IT leader but no developers, inside the Microsoft and Azure environment they already pay for.

Buyer: IT Director, CIO, COO or CFO. Not small businesses, not startups, never website buyers. We do not run ads or cold email at volume.

Offers: (1) a two-week AI-Native Assessment and first build, $15K to $25K fixed, the qualifier and the call to action everywhere; (2) a retained development function (Run / Build / Advise), $10K to $20K a month, 12-month term; (3) fixed-price projects $30K to $50K. Never hourly, never discounted.

Proof we lead with: the entire development function for a 1,000-person Midwest engineering firm (never name the client alongside its funding or proposal work); internal applications for CHS Inc. and U.S. Bank; three shipped products of our own (GridLink, Nouri, FundStart AI). Nothing built for the engineering firm's funding team is ever sold to another engineering firm.

How clients come: partner introductions (managed IT providers / MSPs, fractional CIO firms, Microsoft and ERP partners), CIO rooms (SIM Minnesota, MnTech), introductions from current clients and former colleagues, an inbound AI-Native Readiness Scorecard, and proof that works on its own (case studies, one LinkedIn post a weekday, one talk a quarter). Yearly funnel: 40 partner messages, 15 coffees, 5 partner agreements, 12 introductions, 9 first calls, 4 assessments, 2 retained clients.

Content: five pillars by monthly share: Proof 35%, Teach the buyer 25%, Founder and lifestyle 20%, Point of view 10%, Partners 10%. LinkedIn (Xavier's profile) is 60% of effort, Instagram 20% (lifestyle with one line of work in every post), the company page 10%, Shorts/TikTok reposts 10%. Voice: plain, specific, first person, numbers not adjectives, one idea per post, link in the first comment, every post ends with a next step. Banned: "websites", "$399", "small business", "affordable", "unlock", "transform", "cutting-edge", "synergy", "game-changer", "leverage", "AI-powered", robot images, emoji.

People: Xavier has about 90 minutes a week for marketing plus one partner coffee and one first call per introduction; he is at ~60 billable hours a week (CHS 40, SEH 20), so his tasks must be few and specific. The VA has 10 to 15 hours a week and owns drafting, design, scheduling, replies, list building, outbound from Xavier's LinkedIn account (manual, 15 requests a day), booking, the Friday report, and the monthly memo email.`;

export type RoutineItem = {
  assignee: "owner" | "va";
  weekday: number; // 0 = Monday ... 6 = Sunday
  title: string;
  detail: string;
  kind: "post" | "engage" | "outbound" | "partner" | "call" | "build" | "report" | "admin" | "other";
  pillar?: "proof" | "teach" | "lifestyle" | "pov" | "partners";
  channel?: "linkedin" | "instagram" | "email" | "phone" | "site" | "other";
};

/** The standing weekly formula. Runs every week whether or not the AI adds anything. */
export const ROUTINE: RoutineItem[] = [
  // Owner
  { assignee: "owner", weekday: 0, title: "Approve this week's drafts (10 min)", detail: "Approve, edit or kill the four LinkedIn drafts and three Instagram pieces the VA sent Sunday night.", kind: "admin" },
  { assignee: "owner", weekday: 0, title: "Reply to any buyer or partner comments and DMs", detail: "Anything from an IT leader, COO, CFO or MSP owner gets a personal reply within 24 hours. The VA flags them.", kind: "engage", channel: "linkedin" },
  { assignee: "owner", weekday: 1, title: "Partner coffee (booked by the VA)", detail: "Three questions: how often do clients ask you to build something; which three clients run the most on spreadsheets; refer, resell or co-sell? Leave with one name and a follow-up date.", kind: "partner", channel: "phone" },
  { assignee: "owner", weekday: 2, title: "Reply to buyer or partner DMs", detail: "Goal of every reply: a 30-minute call or a coffee, booked through the calendar link.", kind: "engage", channel: "linkedin" },
  { assignee: "owner", weekday: 3, title: "Answer the VA's hand-offs", detail: "Any conversation the VA started that got a reply is yours from here. Same-day answer.", kind: "engage", channel: "linkedin" },
  { assignee: "owner", weekday: 4, title: "Read the Friday report (5 min)", detail: "Coffees held and assessments sold are the two numbers that matter. One change per month, never five.", kind: "report" },
  { assignee: "owner", weekday: 6, title: "Record the Sunday memo (10 min) and the 60-second video", detail: "Voice memo or five bullets: what you built, what a client asked, what annoyed you, where you were (one photo), what's coming. Film one 60-second phone video on one idea.", kind: "build" },

  // VA
  { assignee: "va", weekday: 0, title: "Post: Proof (LinkedIn, 7:30 a.m. CT)", detail: "Screenshot or screen recording with the story. Link in the first comment within one minute. Repost to the company page this afternoon with one new sentence.", kind: "post", pillar: "proof", channel: "linkedin" },
  { assignee: "va", weekday: 0, title: "Story: what we're shipping this week", detail: "One Instagram story from the Sunday memo.", kind: "post", pillar: "proof", channel: "instagram" },
  { assignee: "va", weekday: 0, title: "Outbound: 15 connection requests with notes", detail: "From Xavier's LinkedIn, manually. Buyer and partner notes are in the Lead Generation System, section 2. Log each in Pipeline.", kind: "outbound", channel: "linkedin" },
  { assignee: "va", weekday: 1, title: "Engage: 15 minutes of comments on 10 target posts", detail: "IT leaders, MSP owners, target companies. Use the Tuesday comment prompts. Never on competitors' posts. Flag any buyer reply for Xavier.", kind: "engage", channel: "linkedin" },
  { assignee: "va", weekday: 1, title: "Outbound: 15 requests + first messages to new connections", detail: "First message three days after acceptance: one question, no pitch. Second message at day 7 only if no reply.", kind: "outbound", channel: "linkedin" },
  { assignee: "va", weekday: 2, title: "Post: Teach (LinkedIn carousel or text, 7:30 a.m. CT)", detail: "One idea a CFO could repeat. Ends with a question. Scorecard link in the first comment. Repost to the company page.", kind: "post", pillar: "teach", channel: "linkedin" },
  { assignee: "va", weekday: 2, title: "Reel: the 60-second video (Instagram)", detail: "Captioned, vertical. Same file goes to LinkedIn, Shorts and TikTok.", kind: "post", pillar: "teach", channel: "instagram" },
  { assignee: "va", weekday: 2, title: "Outbound: 15 requests + follow-ups due", detail: "Day-7 follow-ups and any partner message replies.", kind: "outbound", channel: "linkedin" },
  { assignee: "va", weekday: 3, title: "Post: Lifestyle (LinkedIn + Instagram)", detail: "The phone photo from the Sunday memo with the one-line work tie-in. Two-city builder, the craft, or the people. Nothing salesy.", kind: "post", pillar: "lifestyle", channel: "linkedin" },
  { assignee: "va", weekday: 3, title: "Partner messages: four for the week, from Xavier's account", detail: "MSPs, fractional CIOs, Microsoft and ERP partners. Message and five-day follow-up are in the Business Plan, section 6. Book coffees on Xavier's calendar.", kind: "partner", channel: "linkedin" },
  { assignee: "va", weekday: 3, title: "Outbound: 15 requests", detail: "Keep the week's count at 75.", kind: "outbound", channel: "linkedin" },
  { assignee: "va", weekday: 4, title: "Post: Point of view or Partners (alternating weeks)", detail: "Plain text, strong first line, calm tone. Partners weeks: the coffee recap, generous, no pitch.", kind: "post", pillar: "pov", channel: "linkedin" },
  { assignee: "va", weekday: 4, title: "Repost the reel to YouTube Shorts and TikTok; story recap", detail: "", kind: "post", pillar: "lifestyle", channel: "other" },
  { assignee: "va", weekday: 4, title: "Outbound: 15 requests; pipeline cleanup", detail: "Every row in Pipeline has a stage, a last touch and a next step.", kind: "outbound", channel: "linkedin" },
  { assignee: "va", weekday: 4, title: "Friday report by 3 p.m.", detail: "Fill the Metrics page for this week from Metricool, LinkedIn analytics and Pipeline, with one line of commentary.", kind: "report" },
  { assignee: "va", weekday: 6, title: "Draft next week from the Sunday memo (by 9 p.m.)", detail: "Four LinkedIn drafts, three Instagram pieces, each tagged with its pillar, in one message for Monday approval. No memo: pull from the idea bank and say which you used.", kind: "build" },
];

export const PILLAR_LABEL: Record<string, string> = {
  proof: "Proof",
  teach: "Teach",
  lifestyle: "Lifestyle",
  pov: "Point of view",
  partners: "Partners",
};

export const KIND_LABEL: Record<string, string> = {
  post: "Post",
  engage: "Engage",
  outbound: "Outbound",
  partner: "Partner",
  call: "Call",
  build: "Build",
  report: "Report",
  admin: "Admin",
  other: "Other",
};

export const STAGE_LABEL: Record<string, string> = {
  new: "New",
  connected: "Connected",
  conversation: "In conversation",
  coffee_booked: "Coffee booked",
  call_booked: "Call booked",
  proposal_sent: "Proposal sent",
  assessment_signed: "Assessment signed",
  retained: "Retained",
  lost: "Lost",
};

export const METRIC_FIELDS: { key: string; label: string; weeklyTarget: string }[] = [
  { key: "posts_linkedin", label: "LinkedIn posts", weeklyTarget: "4" },
  { key: "posts_instagram", label: "Instagram posts", weeklyTarget: "3" },
  { key: "impressions", label: "LinkedIn impressions", weeklyTarget: "3,000" },
  { key: "profile_views", label: "Profile views (target titles)", weeklyTarget: "40" },
  { key: "requests_sent", label: "Connection requests sent", weeklyTarget: "75" },
  { key: "requests_accepted", label: "Requests accepted", weeklyTarget: "25" },
  { key: "conversations", label: "Conversations started", weeklyTarget: "5" },
  { key: "scorecard_completions", label: "Scorecard completions", weeklyTarget: "3" },
  { key: "scorecard_fits", label: "Scorecard fits (70+)", weeklyTarget: "1" },
  { key: "coffees", label: "Partner coffees held", weeklyTarget: "1" },
  { key: "first_calls", label: "First calls held", weeklyTarget: "0.5" },
  { key: "proposals_sent", label: "Assessment proposals sent", weeklyTarget: "" },
  { key: "assessments_signed", label: "Assessments signed", weeklyTarget: "" },
  { key: "newsletter_subs", label: "Newsletter list (total)", weeklyTarget: "+10" },
];
