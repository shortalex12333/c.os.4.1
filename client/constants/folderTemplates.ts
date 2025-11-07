// Role-based folder templates for yacht crew
export const ROLE_FOLDER_TEMPLATES = {
  captain: [
    'Navigation & Weather',
    'Port Operations',
    'Crew Management',
    'Current Projects',
    'General Research'
  ],
  engineer: [
    'Engine Systems',
    'Parts & Suppliers',
    'Maintenance Schedules',
    'Current Projects',
    'General Research'
  ],
  steward: [
    'Guest Services',
    'Provisioning',
    'Service Standards',
    'Current Projects',
    'General Research'
  ],
  chef: [
    'Kitchen Equipment',
    'Food Suppliers',
    'Menu Planning',
    'Current Projects',
    'General Research'
  ],
  bosun: [
    'Deck Equipment',
    'Marine Supplies',
    'Cleaning & Maintenance',
    'Current Projects',
    'General Research'
  ],
  // Default fallback
  default: [
    'Equipment Issues',
    'Vendor Communications',
    'Safety & Procedures',
    'Current Projects',
    'General Research'
  ]
};

export type CrewRole = keyof typeof ROLE_FOLDER_TEMPLATES;

export function getFolderTemplatesForRole(role: CrewRole | string): string[] {
  return ROLE_FOLDER_TEMPLATES[role as CrewRole] || ROLE_FOLDER_TEMPLATES.default;
}

// Helper to detect role from email domain or manual selection
export function detectUserRole(email: string): CrewRole {
  // Simple detection - can be enhanced later
  if (email.includes('captain') || email.includes('master')) return 'captain';
  if (email.includes('engineer') || email.includes('eng')) return 'engineer';
  if (email.includes('steward') || email.includes('service')) return 'steward';
  if (email.includes('chef') || email.includes('cook')) return 'chef';
  if (email.includes('bosun') || email.includes('deck')) return 'bosun';
  return 'default';
}