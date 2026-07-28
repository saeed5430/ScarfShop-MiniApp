import { homeSteps } from './home';
import { profileSteps } from './profile';
import { quickBuySteps } from './quick-buy';
import type { PageTour } from '../types';

export const pageTours: PageTour[] = [
  {
    page: 'home',
    steps: homeSteps,
  },
  {
    page: 'profile',
    steps: profileSteps,
  },
  {
    page: 'quickBuy',
    steps: quickBuySteps,
  },
];