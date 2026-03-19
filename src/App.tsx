import { FormEvent, useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AgentCard, AssistantPayload, Message, Session, TerminalLine, WorkspaceOverview } from './types';

const aiAgents: AgentCard[] = [
  { id: 'planner', name: 'Planner', role: 'Breaks work into milestones and execution steps.', status: 'Planning' },
  { id: 'repo-reader', name: 'Repo Reader', role: 'Summarizes files, diffs, and current repository context.', status: 'Ready' },
  { id: 'command-runner', name: 'Command Runner', role: 'Stages safe shell actions and validates the workflow.', status: 'Watching' },
];

const quickAgentPrompts = [
  'Scan this environment like an Xshell session and summarize the next task.',
  'Plan the next backend integration milestone.',
  'Explain what the terminal activity implies for the repository.',
  'Draft a concise operator handoff note.',
];

const initialAssistantMessage: Message = {
  id: 1,
  role: 'assistant',
  content:
    'TermAI is ready. Use the shell workspace to inspect terminal activity while the AI sidebar plans, reviews, and stages next steps.',
  followUp: 'Pick a connection or ask the agent to turn the current shell activity into a plan.',
  commands: ['ls -la', 'git status', 'termai summarize .'],
};

function makeTerminalLines(lines: string[]): TerminalLine[] {
  return lines.map((content, index) => ({
    id: Date.now() + index,
    tone: index === 0 ? 'info' : index === 1 ? 'command' : 'output',
    content,
  }));
}

const starterSessions: Session[] = [
  {
    id: 'prod-api',
    title: 'prod-api.internal',
    host: '10.24.8.12',
    environment: 'Production',
    status: 'Connected',
    updatedAt: 'Just now',
    messages: [initialAssistantMessage],
    terminalLines: makeTerminalLines([
      '[session] attached to prod-api.internal as devops',
      '$ systemctl status termai-agent',
      'termai-agent.service active (running) — repository sync healthy',
      '$ git status --short',
      'working tree clean',
    ]),
  },
  {
    id: 'staging-web',
    title: 'staging-web.internal',
    host: '10.24.16.44',
    environment: 'Staging',
    status: 'Syncing',
    updatedAt: '5m ago',
    messages: [
      {
        id: 2,
        role: 'assistant',
        content: 'Staging is a good place to rehearse the desktop workflow before wiring in a real provider.',
        followUp: 'Validate the terminal panel, then let the agent sidebar propose the next rollout tasks.',
        commands: ['npm run build', 'npm run test:e2e'],
      },
    ],
    terminalLines: makeTerminalLines([
      '[session] attached to staging-web.internal as release-bot',
      '$ npm run build',
      'vite build complete — bundle ready for desktop packaging',
      '$ npm run test:e2e',
      'playwright smoke test passed',
    ]),
  },
  {
    id: 'local-dev',
    title: 'localhost:dev-container',
    host: '/workspace/TermAI',
    environment: 'Local',
    status: 'Standby',
    updatedAt: '12m ago',
    messages: [
      {
        id: 3,
        role: 'assistant',
        content: 'Local development is where the Xshell-inspired layout and AI sidebar can be iterated quickly.',
        followUp: 'Keep the shell focused on terminal activity and the right sidebar focused on agent coordination.',
        commands: ['cargo fmt', 'git diff --stat'],
      },
    ],
    terminalLines: makeTerminalLines([
      '[session] attached to local-dev container',
      '$ cargo fmt --all --check',
      'formatting clean',
      '$ git diff --stat',
      'frontend shell layout updated',
    ]),
  },
];

const fallbackOverview: WorkspaceOverview = {
  projectName: 'TermAI',
  focus: 'Xshell-inspired desktop workspace',
  summary:
    'A three-column desktop shell that pairs connection management with a terminal-centric main workspace and an AI agent control rail.',
  metrics: [
    { label: 'Mode', value: 'Desktop shell' },
    { label: 'Primary view', value: 'Terminal' },
    { label: 'Assistant', value: 'Agent sidebar' },
  ],
  nextSteps: ['Connect a real shell session', 'Persist terminal history', 'Wire AI actions into executable tools'],
};

function createSession(index: number): Session {
  return {
    id: `workspace-${Date.now()}`,
    title: `new-host-${index}.internal`,
    host: `10.24.99.${index}`,
    environment: 'Sandbox',
    status: 'Standby',
    updatedAt: 'Just now',
    messages: [
      {
        ...initialAssistantMessage,
        id: Date.now(),
        content: 'New shell workspace created. Connect a host, review terminal output, and ask the agent sidebar to plan the next action.',
      },
    ],
    terminalLines: makeTerminalLines([
      `[session] created sandbox workspace #${index}`,
      '$ echo "waiting for first command"',
      'waiting for first command',
    ]),
  };
}

export default function App() {
  const [sessions, setSessions] = useState(starterSessions);
  const [activeSession, setActiveSession] = useState(starterSessions[0]?.id ?? '');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [shellCommand, setShellCommand] = useState('git status');
  const [status, setStatus] = useState('Bootstrapping workspace…');
  const [overview, setOverview] = useState<WorkspaceOverview>(fallbackOverview);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === activeSession) ?? sessions[0],
    [activeSession, sessions],
  );

  const taskChecklist = useMemo(
    () => overview.nextSteps.map((title, index) => ({ title, state: index === 0 ? 'active' : 'queued' })),
    [overview.nextSteps],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceOverview() {
      try {
        const data = await invoke<WorkspaceOverview>('get_workspace_overview');
        if (!isMounted) return;
        setOverview({
          ...data,
          focus: 'Xshell-inspired desktop workspace',
          summary:
            'A three-column desktop shell that pairs connection management with a terminal-first center panel and an AI agent sidebar.',
        });
        setStatus('Workspace ready');
      } catch (error) {
        if (!isMounted) return;
        setOverview(fallbackOverview);
        setStatus('Using local fallback workspace data');
        console.error(error);
      } finally {
        if (isMounted) {
          setIsLoadingOverview(false);
        }
      }
    }

    void loadWorkspaceOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateSession(sessionId: string, updater: (session: Session) => Session) {
    setSessions((existing) => existing.map((session) => (session.id === sessionId ? updater(session) : session)));
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isSending || !currentSession) return;

    const sessionId = currentSession.id;
    const userMessage: Message = { id: Date.now(), role: 'user', content: trimmed };

    updateSession(sessionId, (session) => ({
      ...session,
      updatedAt: 'Just now',
      messages: [...session.messages, userMessage],
      terminalLines: [
        ...session.terminalLines,
        { id: Date.now() + 2, tone: 'info', content: `[agent] analyzing request: ${trimmed}` },
      ],
    }));

    setAgentPrompt('');
    setStatus('Agent is reasoning about the current shell state…');
    setIsSending(true);

    try {
      const response = await invoke<AssistantPayload>('run_assistant', {
        prompt: trimmed,
        sessionTitle: currentSession.title,
        projectFocus: overview.focus,
      });

      updateSession(sessionId, (session) => ({
        ...session,
        updatedAt: 'Just now',
        messages: [
          ...session.messages,
          {
            id: Date.now() + 3,
            role: 'assistant',
            content: response.reply,
            followUp: response.followUp,
            commands: response.suggestedCommands,
          },
        ],
        terminalLines: [
          ...session.terminalLines,
          { id: Date.now() + 4, tone: 'success', content: '[agent] plan updated and command recommendations staged' },
          ...response.suggestedCommands.slice(0, 2).map((command, index) => ({
            id: Date.now() + 5 + index,
            tone: 'command' as const,
            content: `$ ${command}`,
          })),
        ],
      }));
      setShellCommand(response.suggestedCommands[0] ?? shellCommand);
      setStatus('Agent response ready');
    } catch (error) {
      updateSession(sessionId, (session) => ({
        ...session,
        updatedAt: 'Just now',
        messages: [
          ...session.messages,
          {
            id: Date.now() + 3,
            role: 'assistant',
            content: `Something went wrong: ${String(error)}`,
          },
        ],
        terminalLines: [
          ...session.terminalLines,
          { id: Date.now() + 4, tone: 'output', content: `[agent] error: ${String(error)}` },
        ],
      }));
      setStatus('Agent response failed');
    } finally {
      setIsSending(false);
    }
  }

  async function handleAgentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(agentPrompt);
  }

  function handleCreateSession() {
    const nextSession = createSession(sessions.length + 1);
    setSessions((existing) => [nextSession, ...existing]);
    setActiveSession(nextSession.id);
    setStatus('New shell workspace created');
  }

  function handleRunShellCommand(command: string) {
    if (!currentSession || !command.trim()) return;

    const trimmed = command.trim();
    updateSession(currentSession.id, (session) => ({
      ...session,
      updatedAt: 'Just now',
      terminalLines: [
        ...session.terminalLines,
        { id: Date.now(), tone: 'command', content: `$ ${trimmed}` },
        {
          id: Date.now() + 1,
          tone: 'output',
          content: trimmed.includes('git')
            ? 'simulated terminal output: repository status refreshed'
            : 'simulated terminal output: command queued for execution preview',
        },
      ],
    }));
    setStatus(`Shell command staged: ${trimmed}`);
    setShellCommand('');
  }

  const suggestedCommands =
    currentSession?.messages
      .slice()
      .reverse()
      .find((message) => message.commands?.length)?.commands ?? [];

  return (
    <div className="app-shell app-shell--xshell">
      <aside className="connection-sidebar">
        <div>
          <div className="brand-card">
            <span className="brand-badge">Xshell-inspired desktop</span>
            <h1>TermAI</h1>
            <p>Manage shell workspaces on the left, terminal activity in the center, and AI agent orchestration on the right.</p>
          </div>

          <section className="sidebar-section">
            <div className="section-title-row">
              <h2>Connections</h2>
              <button className="ghost-button" type="button" onClick={handleCreateSession}>
                New host
              </button>
            </div>
            <div className="connection-list">
              {sessions.map((session) => (
                <button
                  className={`connection-card ${session.id === currentSession?.id ? 'active' : ''}`}
                  key={session.id}
                  type="button"
                  onClick={() => setActiveSession(session.id)}
                >
                  <div>
                    <strong>{session.title}</strong>
                    <span>{session.host}</span>
                  </div>
                  <div className="connection-meta">
                    <span className="pill">{session.environment}</span>
                    <small>{session.status}</small>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="sidebar-section">
          <h2>Workspace status</h2>
          <div className="status-card">
            <span className="status-dot" />
            <div>
              <strong>{status}</strong>
              <p>{overview.summary}</p>
            </div>
          </div>
        </section>
      </aside>

      <main className="shell-main">
        <header className="shell-header">
          <div>
            <p className="eyebrow">Terminal workspace</p>
            <h2>{currentSession?.title ?? 'Loading workspace'}</h2>
          </div>
          <div className="shell-toolbar">
            <span className="tab-pill active">Shell</span>
            <span className="tab-pill">Logs</span>
            <span className="tab-pill">Transfer</span>
          </div>
        </header>

        <section className="workspace-summary-bar">
          <div className="workspace-summary-copy">
            <p className="eyebrow">Current focus</p>
            <h3>{overview.focus}</h3>
            <p>{isLoadingOverview ? 'Loading workspace context…' : overview.summary}</p>
          </div>
          <div className="metric-grid">
            {overview.metrics.map((metric) => (
              <div className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="terminal-panel">
          <div className="terminal-header">
            <div>
              <p className="eyebrow">Live shell</p>
              <h3>{currentSession?.host}</h3>
            </div>
            <div className="header-actions">
              <button className="secondary-button" type="button" onClick={() => handleRunShellCommand('git status')}>
                Refresh shell
              </button>
              <button className="primary-button" type="button" onClick={() => handleRunShellCommand('npm run test:e2e')}>
                Run smoke test
              </button>
            </div>
          </div>

          <div className="terminal-window" aria-label="Terminal workspace">
            {currentSession?.terminalLines.map((line) => (
              <div className={`terminal-line ${line.tone}`} key={line.id}>
                <span className="terminal-prefix">
                  {line.tone === 'command' ? '❯' : line.tone === 'success' ? '✓' : '•'}
                </span>
                <code>{line.content}</code>
              </div>
            ))}
          </div>

          <form
            className="shell-composer"
            onSubmit={(event) => {
              event.preventDefault();
              handleRunShellCommand(shellCommand);
            }}
          >
            <input
              value={shellCommand}
              onChange={(event) => setShellCommand(event.target.value)}
              placeholder="Run a simulated shell command..."
            />
            <button className="primary-button" type="submit">
              Queue command
            </button>
          </form>
        </section>

        <section className="command-deck">
          <div className="section-title-row">
            <h2>Suggested commands</h2>
            <button className="ghost-button" type="button" onClick={() => void sendMessage('Review the latest shell output and recommend next actions')}>
              Sync with agent
            </button>
          </div>
          <div className="command-chip-row command-chip-row--large">
            {suggestedCommands.map((command) => (
              <button key={command} className="command-chip command-chip--interactive" type="button" onClick={() => setShellCommand(command)}>
                {command}
              </button>
            ))}
          </div>
        </section>
      </main>

      <aside className="agent-sidebar">
        <section className="agent-panel">
          <div className="card-heading-row">
            <div>
              <p className="eyebrow">AI Agents</p>
              <h3>Sidecar coordination</h3>
            </div>
            <span className="pill">{isSending ? 'Thinking…' : 'Ready'}</span>
          </div>

          <div className="agent-roster">
            {aiAgents.map((agent) => (
              <article className="agent-card" key={agent.id}>
                <div>
                  <strong>{agent.name}</strong>
                  <p>{agent.role}</p>
                </div>
                <span className="agent-status">{agent.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="agent-panel">
          <p className="eyebrow">Task checklist</p>
          <ul className="task-list">
            {taskChecklist.map((task) => (
              <li key={task.title}>
                <span className={`task-dot ${task.state}`} />
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.state === 'active' ? 'Active focus' : 'Queued next'}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="agent-panel conversation-panel conversation-panel--sidebar">
          <div className="section-title-row">
            <h2>Agent thread</h2>
            <button className="ghost-button" type="button" onClick={() => void sendMessage('Summarize the active connection in one paragraph')}>
              Summarize
            </button>
          </div>
          <div className="messages messages--sidebar">
            {currentSession?.messages.map((message) => (
              <article key={message.id} className={`message ${message.role}`}>
                <span className="message-role">{message.role === 'assistant' ? 'Agent' : 'Operator'}</span>
                <p>{message.content}</p>
                {message.followUp ? <p className="message-follow-up">Next: {message.followUp}</p> : null}
                {message.commands?.length ? (
                  <div className="command-chip-row">
                    {message.commands.map((command) => (
                      <code key={command} className="command-chip">
                        {command}
                      </code>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="agent-panel">
          <p className="eyebrow">Agent prompt</p>
          <div className="quick-actions-grid quick-actions-grid--sidebar">
            {quickAgentPrompts.map((item) => (
              <button key={item} type="button" className="quick-action" onClick={() => void sendMessage(item)}>
                {item}
              </button>
            ))}
          </div>
          <form className="composer" onSubmit={handleAgentSubmit}>
            <textarea
              value={agentPrompt}
              onChange={(event) => setAgentPrompt(event.target.value)}
              placeholder="Ask the AI sidecar to interpret shell output, propose a plan, or stage the next command…"
              rows={4}
            />
            <div className="composer-footer">
              <p>Agent context is synchronized with the active shell workspace.</p>
              <button className="primary-button" disabled={isSending} type="submit">
                {isSending ? 'Sending…' : 'Ask agent'}
              </button>
            </div>
          </form>
        </section>
      </aside>
    </div>
  );
}
