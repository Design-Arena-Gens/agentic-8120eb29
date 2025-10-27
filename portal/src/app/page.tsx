"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AGENT_PROFILES,
  agentDisplayName,
  AgentName,
} from "@/lib/agents";
import {
  AgentMessage,
  DeliverableEntry,
  MissionResult,
  TimelinePhase,
  Workstream,
} from "@/lib/mission";

interface MissionState {
  data: MissionResult | null;
  error: string | null;
  loading: boolean;
}

const focusColors: Record<
  AgentMessage["focus"],
  string
> = {
  alignment: "bg-amber-500/10 text-amber-200 border border-amber-400/30",
  architecture: "bg-sky-500/10 text-sky-200 border border-sky-500/30",
  delivery: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30",
  insight: "bg-purple-500/10 text-purple-200 border border-purple-500/30",
  quality: "bg-rose-500/10 text-rose-200 border border-rose-500/30",
};

const WorkstreamCard = ({ title, stream }: { title: string; stream: Workstream }) => (
  <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 backdrop-blur">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          {title}
        </p>
        <h3 className="mt-1 text-xl font-semibold text-white">
          Lead: {agentDisplayName(stream.owner)}
        </h3>
      </div>
    </div>
    <p className="mt-4 text-sm text-white/70">{stream.summary}</p>
    <div className="mt-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
        Core Goals
      </p>
      <ul className="space-y-2 text-sm text-white/80">
        {stream.goals.map((goal) => (
          <li
            key={goal}
            className="flex items-start gap-2 rounded-xl bg-white/5 p-3"
          >
            <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-white/70" />
            <span>{goal}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="mt-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
        Work Packets
      </p>
      <ul className="space-y-3 text-sm text-white/80">
        {stream.tasks.map((task) => (
          <li key={task.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-semibold text-white">{task.title}</p>
            <p className="mt-1 text-white/70">{task.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
    {children}
  </span>
);

const DeliverableCard = ({ deliverable }: { deliverable: DeliverableEntry }) => (
  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-6 shadow-lg shadow-black/30">
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-lg font-semibold text-white">{deliverable.category}</h4>
      <Pill>{deliverable.summary}</Pill>
    </div>
    <ul className="mt-4 space-y-3 text-sm text-white/80">
      {deliverable.artifacts.map((artifact) => (
        <li key={artifact} className="flex items-start gap-2">
          <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-white/80" />
          <span>{artifact}</span>
        </li>
      ))}
    </ul>
  </div>
);

const TimelineCard = ({ phase }: { phase: TimelinePhase }) => (
  <div className="rounded-3xl border border-white/10 bg-black/30 p-6 ring-1 ring-white/5">
    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
      {phase.duration}
    </p>
    <h4 className="mt-2 text-xl font-semibold text-white">{phase.name}</h4>
    <p className="mt-2 text-sm text-white/70">{phase.goal}</p>
    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
      Owner
    </p>
    <p className="text-sm text-white/80">{agentDisplayName(phase.lead)}</p>
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
        Activities
      </p>
      <ul className="space-y-2 text-sm text-white/75">
        {phase.activities.map((activity) => (
          <li key={activity} className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-white/70" />
            <span>{activity}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
        Exit Criteria
      </p>
      <ul className="space-y-2 text-sm text-emerald-200/80">
        {phase.exitCriteria.map((criterion) => (
          <li key={criterion} className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
            <span>{criterion}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default function Home() {
  const [idea, setIdea] = useState("");
  const [state, setState] = useState<MissionState>({
    data: null,
    error: null,
    loading: false,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idea.trim()) {
      setState({
        data: null,
        error: "Offer the crew a mission brief so they can begin.",
        loading: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Mission failed");
      }

      const payload = (await response.json()) as MissionResult;
      setState({ data: payload, error: null, loading: false });
    } catch (error) {
      setState({
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "We hit a snag while syncing the squad.",
        loading: false,
      });
    }
  };

  const mission = state.data;

  const headline = useMemo(() => {
    if (!mission) return "Agentic Build Portal";
    return mission.missionBrief.codename;
  }, [mission]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_55%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.2),transparent_50%)]" />
      <main className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 sm:px-10 lg:px-12">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Pill>Autonomous squad</Pill>
            <Pill>Front-end & back-end visibility</Pill>
            <Pill>Mission-ready</Pill>
          </div>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            {headline}
          </h1>
          <p className="max-w-3xl text-lg text-white/70">
            Drop an idea, and the architect, data analyst, engineer, product
            manager, and team leader will align, simulate the build, and expose
            how front-end and back-end tracks move in lockstep.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-xl shadow-black/30 backdrop-blur lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="idea"
                className="block text-xs font-semibold uppercase tracking-[0.35em] text-white/60"
              >
                Mission Input
              </label>
              <textarea
                id="idea"
                className="mt-3 h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white shadow-inner shadow-black/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 sm:h-40"
                placeholder="Example: Build a developer portal that lets AI agents compose custom analytics dashboards with real-time data from our SaaS product."
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Agents are ready for your instructions.
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-950 transition hover:shadow-lg hover:shadow-cyan-500/30 focus:outline-none focus:ring-4 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={state.loading}
              >
                {state.loading ? "Synchronizing squad…" : "Launch agents"}
              </button>
            </div>
          </form>
          {state.error && (
            <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {state.error}
            </p>
          )}
        </section>

        <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 backdrop-blur sm:grid-cols-2 lg:grid-cols-5">
          {AGENT_PROFILES.map((agent) => (
            <article
              key={agent.id}
              className="flex h-full flex-col gap-3 rounded-2xl bg-black/30 p-4 shadow-inner shadow-black/40"
            >
              <div
                className={`inline-flex w-fit rounded-full bg-gradient-to-r ${agent.accentColor} px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-950`}
              >
                {agent.title}
              </div>
              <p className="text-sm text-white/80">{agent.mission}</p>
              <div className="mt-auto space-y-1">
                {agent.specialty.map((skill) => (
                  <Pill key={skill}>{skill}</Pill>
                ))}
              </div>
            </article>
          ))}
        </section>

        {state.loading && (
          <section className="rounded-3xl border border-sky-400/30 bg-sky-500/10 p-6 text-white/80 shadow-lg shadow-cyan-500/30 backdrop-blur">
            The squad is aligning on architecture, delivery plan, and test
            coverage. Hold tight…
          </section>
        )}

        {mission && (
          <div className="space-y-12">
            <section className="grid gap-8 rounded-3xl border border-white/10 bg-black/30 p-8 shadow-xl shadow-black/30 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">
                  Mission Brief
                </h2>
                <p className="text-lg text-white/70">
                  {mission.missionBrief.elevatorPitch}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Pill>{mission.missionBrief.targetUsers}</Pill>
                  {mission.missionBrief.guardrails.map((guardrail) => (
                    <Pill key={guardrail}>{guardrail}</Pill>
                  ))}
                </div>
              </div>
              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Success Metrics
                </p>
                <ul className="space-y-3 text-sm text-white/80">
                  {mission.missionBrief.successMetrics.map((metric) => (
                    <li key={metric} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">
                  Agent Conversation
                </h2>
                <Pill>Cross-functional sync</Pill>
              </div>
              <div className="space-y-6">
                {mission.conversation.map((message) => (
                  <article
                    key={message.headline + message.agent}
                    className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-black/50 sm:grid-cols-[200px_1fr]"
                  >
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold text-white">
                        {agentDisplayName(message.agent)}
                      </p>
                      <p
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${focusColors[message.focus]}`}
                      >
                        {message.headline}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-sm text-white/75">{message.message}</p>
                      <ul className="space-y-2 text-sm text-white/80">
                        {message.actions.map((action) => (
                          <li key={action} className="flex items-start gap-2">
                            <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-white/70" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-8 shadow-xl shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">
                  Workstreams
                </h2>
                <Pill>Front-end & back-end visibility</Pill>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                <WorkstreamCard title="Front-End Track" stream={mission.workstreams.frontEnd} />
                <WorkstreamCard title="Back-End Track" stream={mission.workstreams.backEnd} />
                <WorkstreamCard title="Data & Analytics" stream={mission.workstreams.analytics} />
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">Execution Timeline</h2>
                <Pill>Outcome-driven phases</Pill>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {mission.timeline.map((phase) => (
                  <TimelineCard key={phase.name} phase={phase} />
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-black/30 p-8 shadow-xl shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">
                  Testing & Quality Gates
                </h2>
                <Pill>Bug-free deliverables</Pill>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {mission.testing.map((entry) => (
                  <div
                    key={entry.title}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      Owner: {agentDisplayName(entry.owner as AgentName)}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-white">
                      {entry.title}
                    </h4>
                    <p className="mt-3 text-sm text-white/75">{entry.focus}</p>
                    <ul className="mt-4 space-y-2 text-sm text-white/80">
                      {entry.coverage.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">
                  Final Deliverables
                </h2>
                <Pill>Ready to present</Pill>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {mission.deliverables.map((deliverable) => (
                  <DeliverableCard key={deliverable.category} deliverable={deliverable} />
                ))}
              </div>
            </section>

            <section className="grid gap-6 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-emerald-100 shadow-xl shadow-emerald-500/30 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Momentum & Next Steps</h2>
                <ul className="space-y-3 text-sm">
                  {mission.status.nextSteps.map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/80">
                <h3 className="text-lg font-semibold text-white">Risk Radar</h3>
                <ul className="mt-3 space-y-2">
                  {mission.status.risks.map((risk) => (
                    <li key={risk} className="flex items-start gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-rose-300" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-white/70">
                  {mission.status.stakeholderBrief}
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
