import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_BRIEF, ROUTINE } from "@/lib/playbook";
import { dayLabel, weekDays, weekLabel } from "@/lib/dates";

export type PlannedTask = {
  assignee: "owner" | "va";
  day: string; // YYYY-MM-DD
  title: string;
  detail: string;
  kind: "post" | "engage" | "outbound" | "partner" | "call" | "build" | "report" | "admin" | "other";
  pillar?: "proof" | "teach" | "lifestyle" | "pov" | "partners" | null;
  channel?: "linkedin" | "instagram" | "email" | "phone" | "site" | "other" | null;
};

export type PlanContext = {
  weekStart: string;
  brief: string | null;
  memo: string | null;
  ownerNotes: string | null;
  lastWeek: {
    weekStart: string;
    metrics: Record<string, number | string> | null;
    done: string[];
    notDone: string[];
  } | null;
  pipeline: { name: string; company: string; kind: string; stage: string; next_step: string; last_touch: string | null }[];
  existingDraft: { assignee: string; day: string; title: string }[];
};

export type GeneratedPlan = {
  summary: string;
  tasks: PlannedTask[];
};

const planTool: Anthropic.Tool = {
  name: "submit_week_plan",
  description: "Submit the week's plan: a short summary and the specific tasks for the owner and the VA.",
  input_schema: {
    type: "object",
    required: ["summary", "tasks"],
    properties: {
      summary: {
        type: "string",
        description: "Three to five sentences: the one thing this week is for, what changed from last week, and the single number to watch. Plain language, no headings.",
      },
      tasks: {
        type: "array",
        minItems: 6,
        maxItems: 30,
        items: {
          type: "object",
          required: ["assignee", "day", "title", "detail", "kind"],
          properties: {
            assignee: { type: "string", enum: ["owner", "va"] },
            day: { type: "string", description: "YYYY-MM-DD within the week" },
            title: { type: "string", description: "Imperative, specific, under 90 characters." },
            detail: {
              type: "string",
              description: "Exactly what to do, with the actual content where it applies: the post's first line and the three points it makes; the names to message; the question to open with. 1 to 5 sentences.",
            },
            kind: { type: "string", enum: ["post", "engage", "outbound", "partner", "call", "build", "report", "admin", "other"] },
            pillar: { type: "string", enum: ["proof", "teach", "lifestyle", "pov", "partners"] },
            channel: { type: "string", enum: ["linkedin", "instagram", "email", "phone", "site", "other"] },
          },
        },
      },
    },
  },
};

function routineText(weekStart: string): string {
  const days = weekDays(weekStart);
  return ROUTINE.map(
    (r) => `- ${r.assignee.toUpperCase()} ${dayLabel(days[r.weekday])}: ${r.title}`,
  ).join("\n");
}

export async function generatePlan(ctx: PlanContext): Promise<GeneratedPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const days = weekDays(ctx.weekStart);

  const system = `You are the marketing and sales operator for a two-person services business. You write the week's plan for the owner (Xavier) and his virtual assistant (the VA). You know the business from the brief. You never invent clients, numbers or results. You are specific: a post task names the post's first line and its points; an outbound task names who and what to say; a build task names the thing. You never add tasks the brief forbids (ads, cold email at volume, website offers, hourly pricing, naming the engineering client alongside funding work).

THE BUSINESS BRIEF
${ctx.brief?.trim() || DEFAULT_BRIEF}

THE STANDING WEEKLY ROUTINE (already on the board every week; do not repeat these as tasks)
${routineText(ctx.weekStart)}

WHAT YOU ADD ON TOP OF THE ROUTINE
- The specifics for each of the four LinkedIn posts and three Instagram pieces: pillar, the first line, the points, the asset needed. Pull from the Sunday memo first; if there is no memo, pick from the pillars' idea bank in the brief.
- The outbound focus: which segment or titles this week, which partner names to message (only names that appear in the pipeline; otherwise describe the type to find), and the two follow-ups that are overdue.
- Anything last week's numbers say should change (one change, not five).
- Xavier's few tasks beyond the routine: a specific coffee or call to book, a proof asset to supply (one screenshot, one photo, one sentence of permission), a reply that is overdue.
- Keep the owner's added tasks to at most 4 for the week, each under 20 minutes. The VA's added tasks: at most 12.
- Every task lands on a specific day in the week ${weekLabel(ctx.weekStart)} (${days[0]} to ${days[6]}).`;

  const lastWeek = ctx.lastWeek
    ? `LAST WEEK (${weekLabel(ctx.lastWeek.weekStart)})
Metrics: ${ctx.lastWeek.metrics ? JSON.stringify(ctx.lastWeek.metrics) : "not filled in"}
Done: ${ctx.lastWeek.done.length ? ctx.lastWeek.done.join("; ") : "nothing marked done"}
Not done: ${ctx.lastWeek.notDone.length ? ctx.lastWeek.notDone.join("; ") : "none"}`
    : "LAST WEEK: no data yet (first week on the board).";

  const pipeline = ctx.pipeline.length
    ? ctx.pipeline
        .map((p) => `- ${p.name} (${p.company || "?"}, ${p.kind}) stage=${p.stage}; next: ${p.next_step || "none"}; last touch ${p.last_touch || "never"}`)
        .join("\n")
    : "- empty";

  const user = `Plan the week of ${weekLabel(ctx.weekStart)}.

SUNDAY MEMO FROM XAVIER
${ctx.memo?.trim() || "(none this week)"}

OWNER'S NOTES ON THIS PLAN (apply these first)
${ctx.ownerNotes?.trim() || "(none)"}

${lastWeek}

PIPELINE (open rows)
${pipeline}

${ctx.existingDraft.length ? `EXISTING DRAFT TASKS (you are replacing these; keep what still makes sense)\n${ctx.existingDraft.map((t) => `- ${t.assignee} ${t.day}: ${t.title}`).join("\n")}` : ""}

Submit the plan with the submit_week_plan tool.`;

  const res = await client.messages.create({
    model,
    max_tokens: 6000,
    system,
    tools: [planTool],
    tool_choice: { type: "tool", name: "submit_week_plan" },
    messages: [{ role: "user", content: user }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("The model returned no plan.");
  const plan = block.input as GeneratedPlan;

  // Keep only tasks that land inside the week.
  const inWeek = new Set(days);
  plan.tasks = (plan.tasks || []).filter((t) => inWeek.has(t.day));
  if (!plan.summary) plan.summary = "";
  return plan;
}
