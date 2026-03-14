export interface Portal {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  active: boolean;
}

export const portals: Portal[] = [
  {
    id: 'video-editing',
    name: 'Video Editing',
    description: 'Manage video clip production pipeline',
    icon: 'Film',
    href: '/portal/video-editing',
    color: 'brand',
    active: true,
  },
  {
    id: 'scheduling',
    name: 'Scheduling',
    description: 'Employee schedules and task management',
    icon: 'Calendar',
    href: '/portal/scheduling',
    color: 'emerald',
    active: true,
  },
  {
    id: 'payroll',
    name: 'Payroll',
    description: 'Pay periods, commissions, and payroll management',
    icon: 'DollarSign',
    href: '/portal/payroll',
    color: 'amber',
    active: true,
  },
  {
    id: 'chatting',
    name: 'Chatting',
    description: 'Team messaging (Coming Soon)',
    icon: 'MessageSquare',
    href: '/portal/chatting',
    color: 'purple',
    active: false,
  },
  {
    id: 'client-portal',
    name: 'Client Portal',
    description: 'Client access and delivery (Coming Soon)',
    icon: 'Users',
    href: '/portal/client-portal',
    color: 'rose',
    active: false,
  },
];
