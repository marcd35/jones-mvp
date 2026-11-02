import type { Job, Location } from '@/types';

export const LOCATIONS: Location[] = [
  {
    id: 'le-security',
    name: 'Le Security',
    type: 'other',
    description: 'Closed in this version.',
    closed: true,
  },
  {
    id: 'rent-office',
    name: 'Rent Office',
    type: 'other',
    description: 'Pay rent, ask for more time, or clear an unpaid balance.',
  },
  {
    id: 'low-cost-housing',
    name: 'Low-cost housing',
    type: 'housing',
    description: 'Home sweet home. Rent is due every 4 weeks.',
  },
  {
    id: 'pawn-shop',
    name: 'Pawn shop',
    type: 'other',
    description: 'Closed in this version.',
    closed: true,
  },
  {
    id: 'z-mart',
    name: 'Z-Mart',
    type: 'store',
    description: 'Household goods. Coming soon.',
  },
  {
    id: 'monolith-burger',
    name: 'Monolith Burger',
    type: 'work',
    description: 'Flipping burgers for minimum wage. Fries to eat, too.',
  },
  {
    id: 'qt-clothing',
    name: 'QT Clothing',
    type: 'other',
    description: 'Clothes for work and for show.',
  },
  {
    id: 'socket-city',
    name: 'Socket City',
    type: 'other',
    description: 'Electronics and appliances.',
  },
  {
    id: 'hi-tech-u',
    name: 'Hi-Tech U',
    type: 'education',
    description: 'Get a degree to earn more money.',
  },
  {
    id: 'employment-office',
    name: 'Employment Office',
    type: 'employment',
    description: 'Find a better job.',
  },
  {
    id: 'factory',
    name: 'Factory',
    type: 'other',
    description: 'Hard work for better pay.',
  },
  {
    id: 'bank',
    name: 'Bank',
    type: 'other',
    description: 'Closed in this version.',
    closed: true,
  },
  {
    id: 'blacks-market',
    name: "Black's Market",
    type: 'other',
    description: 'Food in bulk and the weekly newspaper.',
  },
];

// Location ids used by saves made before the 5x5 Board, for migration.
export const LEGACY_LOCATION_IDS: Record<string, string> = {
  apt: 'low-cost-housing',
  burger: 'monolith-burger',
  store: 'z-mart',
  uni: 'hi-tech-u',
};

// DEC-022, DEC-026: a Work action pays wage x shiftHours and costs
// workTimeHours of Time (about 10% of a 12-hour Week).
export const JOBS: Job[] = [
  {
    id: 'cook',
    title: 'Cook',
    wage: 4,
    locationId: 'monolith-burger',
    educationRequired: 0,
    shiftHours: 8,
    workTimeHours: 1.2,
    clothingRequired: 'casual',
  },
  {
    id: 'shift-manager',
    title: 'Shift Manager',
    wage: 15,
    locationId: 'monolith-burger',
    educationRequired: 1,
    shiftHours: 8,
    workTimeHours: 1.2,
    clothingRequired: 'casual',
  },
];
