import { Location, Job } from '@/types';

export const MAX_TIME = 12; // Hours per week
export const TRAVEL_COST = 1; // Hours to move between locations
export const FOOD_COST = 15;
export const RENT_COST = 100;

export const LOCATIONS: Location[] = [
  {
    id: 'apt',
    name: 'My Apartment',
    type: 'housing',
    description: 'Home sweet home. Rent is due every 4 weeks.',
  },
  {
    id: 'burger',
    name: 'Monolith Burgers',
    type: 'work',
    description: 'Flipping burgers for minimum wage.',
  },
  {
    id: 'store',
    name: 'Z-Mart',
    type: 'store',
    description: 'Buy food to survive.',
  },
  {
    id: 'uni',
    name: 'Hi-Tech U',
    type: 'education',
    description: 'Get a degree to earn more money.',
  },
];

export const JOBS: Job[] = [
  {
    id: 'janitor',
    title: 'Fry Cook',
    wage: 6,
    locationId: 'burger',
    educationRequired: 0,
  },
  {
    id: 'manager',
    title: 'Shift Manager',
    wage: 15,
    locationId: 'burger',
    educationRequired: 1,
  },
];
