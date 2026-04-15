export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25')
];

export const server_loads = [2];

export const dictionary = {
		"/": [~3],
		"/budget-response/[token]": [~25],
		"/(app)/budgets": [~4,[2]],
		"/(app)/budgets/new": [~7,[2]],
		"/(app)/budgets/[id]/preview": [~6,[2]],
		"/(app)/budgets/[budget_id]/update": [~5,[2]],
		"/(app)/dashboard": [~8,[2]],
		"/(app)/dogs": [~9,[2]],
		"/(app)/dogs/new": [~11,[2]],
		"/(app)/dogs/[dog_id]/update": [~10,[2]],
		"/(app)/raw-materials": [~12,[2]],
		"/(app)/raw-materials/new": [~14,[2]],
		"/(app)/raw-materials/[raw_material_id]/update": [~13,[2]],
		"/(app)/recipes": [~15,[2]],
		"/(app)/recipes/new": [~17,[2]],
		"/(app)/recipes/[recipe_id]/update": [~16,[2]],
		"/(app)/settings": [~18,[2]],
		"/(app)/tutors": [~19,[2]],
		"/(app)/tutors/new": [~21,[2]],
		"/(app)/tutors/[tutor_id]/update": [~20,[2]],
		"/(app)/veterinaries": [~22,[2]],
		"/(app)/veterinaries/new": [~24,[2]],
		"/(app)/veterinaries/[veterinary_id]/update": [~23,[2]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';