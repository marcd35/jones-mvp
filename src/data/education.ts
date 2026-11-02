import type { EducationRules } from '@/types';

// T-01 measured Trade School at 10 classes and about 9.5% of a 12-hour Week
// per class. Q11 approves those course values as replaceable defaults for the
// unobserved Jr. College and deeper courses.
const OBSERVED_CLASSES = 10;
const OBSERVED_CLASS_HOURS = 12 * 0.095;

export const EDUCATION: EducationRules = {
  locationId: 'hi-tech-u',
  enrollmentFee: 50,
  enrollmentFeeDataBasis: 'observed',
  // The design document gives a one-hour course enrollment action. T-01 did
  // not measure it; keep it replaceable as a data default.
  enrollmentTimeHours: 1,
  enrollmentTimeDataBasis: 'approved-default',
  courses: [
    {
      id: 'trade-school',
      name: 'Trade School',
      path: 'technical',
      level: 1,
      classesRequired: OBSERVED_CLASSES,
      classTimeHours: OBSERVED_CLASS_HOURS,
      dataBasis: 'observed',
    },
    {
      id: 'jr-college',
      name: 'Jr. College',
      path: 'college',
      level: 1,
      classesRequired: OBSERVED_CLASSES,
      classTimeHours: OBSERVED_CLASS_HOURS,
      dataBasis: 'approved-default',
    },
    {
      id: 'electronics',
      name: 'Electronics',
      path: 'technical',
      level: 2,
      classesRequired: OBSERVED_CLASSES,
      classTimeHours: OBSERVED_CLASS_HOURS,
      dataBasis: 'approved-default',
    },
    {
      id: 'pre-engineer',
      name: 'Pre-Engineer',
      path: 'technical',
      level: 2,
      classesRequired: OBSERVED_CLASSES,
      classTimeHours: OBSERVED_CLASS_HOURS,
      dataBasis: 'approved-default',
    },
    {
      id: 'business-administration',
      name: 'Bus. Admin',
      path: 'college',
      level: 2,
      classesRequired: OBSERVED_CLASSES,
      classTimeHours: OBSERVED_CLASS_HOURS,
      dataBasis: 'approved-default',
    },
    {
      id: 'academic',
      name: 'Academic',
      path: 'college',
      level: 2,
      classesRequired: OBSERVED_CLASSES,
      classTimeHours: OBSERVED_CLASS_HOURS,
      dataBasis: 'approved-default',
    },
  ],
};
