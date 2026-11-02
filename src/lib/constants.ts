import { Location, Job } from '@/types';

export const STARTING_MONEY = 60;
export const MAX_TIME = 12; // Hours per week
export const TRAVEL_COST = 1; // Hours to move between locations
export const FOOD_COST = 15;
export const RENT_COST = 100;
export const TUITION_COST = 100; // Cost per class
export const WIN_MONEY = 500; // Cash needed to win
export const RENT_INTERVAL = 4; // Weeks between rent payments
export const MEAL_HOURS = 1; // Time spent buying and eating a meal
export const CLASS_HOURS = 4; // Time spent in one class
export const STARVATION_TIME_PENALTY = 4; // Hours lost the week after skipping food
export const WORK_SHIFTS = [4, 8]; // Shift lengths offered, in hours
export const WIN_JOB_ID = 'shift-manager'; // Must hold this job to win

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
    id: 'fry-cook',
    title: 'Fry Cook',
    wage: 6,
    locationId: 'burger',
    educationRequired: 0,
  },
  {
    id: 'shift-manager',
    title: 'Shift Manager',
    wage: 15,
    locationId: 'burger',
    educationRequired: 1,
  },
];
