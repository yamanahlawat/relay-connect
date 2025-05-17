import { Bot, Cloud, Server, Settings2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  href: string;
}

export const settingsNav: SettingsNavItem[] = [
  {
    id: 'general',
    label: 'General',
    icon: Settings2,
    description: 'Configure application wide settings',
    href: '/settings',
  },
  {
    id: 'providers',
    label: 'Providers',
    icon: Cloud,
    description: 'Manage your LLM Providers',
    href: '/settings/providers',
  },
  {
    id: 'models',
    label: 'Models',
    icon: Bot,
    description: 'Configure and select models',
    href: '/settings/models',
  },
  {
    id: 'mcp-servers',
    label: 'MCP Servers',
    icon: Server,
    description: 'Manage Model Context Protocol servers',
    href: '/settings/mcp-servers',
  },
];
