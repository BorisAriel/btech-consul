import { useState } from 'react';
import type { AgentProfile } from '../types/uemoa';

interface AgentAvatarProps {
  agent: AgentProfile;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
};

export function AgentAvatar({ agent, size = 'md' }: AgentAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !agent.avatarUrl) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} rounded-lg bg-[#0F5132]/10 text-[#0F5132] font-semibold flex items-center justify-center shrink-0 border border-[#0F5132]/15`}
        aria-label={agent.name}
      >
        {agent.initials}
      </div>
    );
  }

  return (
    <img
      src={agent.avatarUrl}
      alt={`Portrait de ${agent.name}, ${agent.role}`}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${SIZE_CLASSES[size]} rounded-lg object-cover object-top shrink-0 border border-slate-200 bg-slate-100`}
    />
  );
}
