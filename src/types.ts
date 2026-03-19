export type MessageRole = 'user' | 'assistant';

export type AssistantPayload = {
  reply: string;
  followUp: string;
  suggestedCommands: string[];
};

export type Message = {
  id: number;
  role: MessageRole;
  content: string;
  followUp?: string;
  commands?: string[];
};

export type TerminalLineTone = 'info' | 'command' | 'output' | 'success';

export type TerminalLine = {
  id: number;
  tone: TerminalLineTone;
  content: string;
};

export type Session = {
  id: string;
  title: string;
  host: string;
  environment: string;
  status: 'Connected' | 'Standby' | 'Syncing';
  updatedAt: string;
  messages: Message[];
  terminalLines: TerminalLine[];
};

export type WorkspaceOverview = {
  projectName: string;
  focus: string;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  nextSteps: string[];
};

export type AgentCard = {
  id: string;
  name: string;
  role: string;
  status: 'Ready' | 'Watching' | 'Planning';
};
