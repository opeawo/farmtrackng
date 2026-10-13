// Client-safe display metadata for market categories, shared by the /markets
// index and the /markets/history page.

import type { ListingCategory } from './units';

export const CATEGORY_ICON: Record<ListingCategory, string> = {
	poultry: '🐔',
	cattle: '🐄',
	goat: '🐐',
	sheep: '🐑',
	pig: '🐷',
	fish: '🐟',
	eggs: '🥚',
	vaccine: '💉',
	feed: '🌾',
	other: '🐾'
};

// Per-livestock series colour so each chart reads as its own series.
export const CATEGORY_COLOR: Record<ListingCategory, string> = {
	poultry: '#e09f3e',
	cattle: '#2d6a4f',
	goat: '#bc6c25',
	sheep: '#6b9080',
	pig: '#cb6c79',
	fish: '#3a7ca5',
	eggs: '#c9a227',
	vaccine: '#7b6ca8',
	feed: '#84a98c',
	other: '#84a98c'
};

export const CATEGORY_LABEL: Record<ListingCategory, string> = {
	poultry: 'Poultry',
	cattle: 'Cattle',
	goat: 'Goat',
	sheep: 'Sheep',
	pig: 'Pig',
	fish: 'Fish',
	eggs: 'Eggs',
	vaccine: 'Vaccines',
	feed: 'Feed',
	other: 'Other'
};
