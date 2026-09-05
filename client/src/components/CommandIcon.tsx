import React from 'react';

interface CommandIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

/**
 * CommandIcon - Component to display SVG icons from sprite
 * 
 * Usage:
 * <CommandIcon name="play" size={24} color="currentColor" />
 * <CommandIcon name="pause" className="text-purple-500" />
 */
export const CommandIcon: React.FC<CommandIconProps> = ({ 
  name, 
  className = '', 
  size = 24,
  color = 'currentColor'
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      style={{ color }}
      aria-hidden="true"
    >
      <use href={`/command-icons.svg#icon-${name}`} />
    </svg>
  );
};

/**
 * Available icon names:
 * 
 * Music: play, pause, stop, skip, previous, loop, shuffle, volume, queue, lyrics
 * Moderation: ban, kick, mute, warn, timeout, lock, unlock, slowmode, purge
 * Ticket: ticket, bug, question, suggestion
 * Utility: settings, help, ping, stats, avatar
 * Fun: dice, 8ball, joke, meme
 * Economy: coin, shop, trophy, gift
 * Status: online, offline, loading, success, error, warning
 */

export default CommandIcon;
