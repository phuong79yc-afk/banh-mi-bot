import { memo } from 'react';
import { Server, Users, Command } from 'lucide-react';
import GlassCard from './GlassCard';

interface BotStatsWidgetProps {
  servers: number;
  users: number;
  commands: number;
}

const BotStatsWidget = memo(({ servers, users, commands }: BotStatsWidgetProps) => {
  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        📊 Bot Statistics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Servers */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
          <div className="p-3 rounded-full bg-blue-500/20">
            <Server className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Servers</p>
            <p className="text-2xl font-bold">{servers.toLocaleString()}</p>
          </div>
        </div>

        {/* Users */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
          <div className="p-3 rounded-full bg-purple-500/20">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Users</p>
            <p className="text-2xl font-bold">{users.toLocaleString()}</p>
          </div>
        </div>

        {/* Commands */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
          <div className="p-3 rounded-full bg-pink-500/20">
            <Command className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Commands</p>
            <p className="text-2xl font-bold">{commands}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
});

BotStatsWidget.displayName = 'BotStatsWidget';

export default BotStatsWidget;
