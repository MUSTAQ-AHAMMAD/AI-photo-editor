import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, FolderOpen, Clock, LayoutTemplate,
  Settings, Zap, ChevronLeft, ChevronRight,
  Cpu,
} from 'lucide-react';
import { useAppStore, type SidebarTab } from '../store';

const navItems: { id: SidebarTab; icon: React.ElementType; label: string }[] = [
  { id: 'create', icon: Sparkles, label: 'Create' },
  { id: 'projects', icon: FolderOpen, label: 'Projects' },
  { id: 'history', icon: Clock, label: 'History' },
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const Sidebar: React.FC = () => {
  const { sidebarTab, setSidebarTab, sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 220 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex-shrink-0 flex flex-col h-screen sticky top-0 glass-card rounded-none border-r border-l-0 border-t-0 border-b-0 z-20"
      style={{ borderRadius: 0, borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-teal flex-shrink-0 flex items-center justify-center">
          <Cpu size={16} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-white text-lg tracking-tight"
          >
            Lumina<span className="gradient-text">AI</span>
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = sidebarTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSidebarTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-accent-purple-dim text-accent-purple'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon size={18} className={`flex-shrink-0 ${active ? 'text-accent-purple' : ''}`} />
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {active && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      {!sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-teal/10 border border-accent-purple/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-accent-teal" />
            <span className="text-xs font-semibold text-white">Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-zinc-400 mb-2">Unlimited generations &amp; advanced models</p>
          <button className="w-full py-1.5 rounded-lg text-xs font-semibold text-white btn-glow">
            Upgrade Now
          </button>
        </motion.div>
      )}

      {/* User */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
            U
          </div>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User</p>
              <p className="text-xs text-zinc-500 truncate">Free Plan</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-bg-elevated border border-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-30"
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
