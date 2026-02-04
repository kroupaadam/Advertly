import { NAV_ITEMS, NavItemId } from './constants';

export const isValidNavItem = (id: unknown): id is NavItemId => {
  return typeof id === 'string' && NAV_ITEMS.some(item => item.id === id);
};

export const getNavItem = (id: NavItemId) => {
  return NAV_ITEMS.find(item => item.id === id);
};
