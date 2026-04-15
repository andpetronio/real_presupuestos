
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/(app)" | "/" | "/budget-response" | "/budget-response/[token]" | "/(app)/budgets" | "/(app)/budgets/new" | "/(app)/budgets/[id]" | "/(app)/budgets/[budget_id]" | "/(app)/budgets/[id]/preview" | "/(app)/budgets/[budget_id]/update" | "/(app)/dashboard" | "/(app)/dogs" | "/(app)/dogs/new" | "/(app)/dogs/[dog_id]" | "/(app)/dogs/[dog_id]/update" | "/logout" | "/(app)/raw-materials" | "/(app)/raw-materials/new" | "/(app)/raw-materials/[raw_material_id]" | "/(app)/raw-materials/[raw_material_id]/update" | "/(app)/recipes" | "/(app)/recipes/new" | "/(app)/recipes/[recipe_id]" | "/(app)/recipes/[recipe_id]/update" | "/(app)/settings" | "/(app)/tutors" | "/(app)/tutors/new" | "/(app)/tutors/[tutor_id]" | "/(app)/tutors/[tutor_id]/update" | "/(app)/veterinaries" | "/(app)/veterinaries/new" | "/(app)/veterinaries/[veterinary_id]" | "/(app)/veterinaries/[veterinary_id]/update";
		RouteParams(): {
			"/budget-response/[token]": { token: string };
			"/(app)/budgets/[id]": { id: string };
			"/(app)/budgets/[budget_id]": { budget_id: string };
			"/(app)/budgets/[id]/preview": { id: string };
			"/(app)/budgets/[budget_id]/update": { budget_id: string };
			"/(app)/dogs/[dog_id]": { dog_id: string };
			"/(app)/dogs/[dog_id]/update": { dog_id: string };
			"/(app)/raw-materials/[raw_material_id]": { raw_material_id: string };
			"/(app)/raw-materials/[raw_material_id]/update": { raw_material_id: string };
			"/(app)/recipes/[recipe_id]": { recipe_id: string };
			"/(app)/recipes/[recipe_id]/update": { recipe_id: string };
			"/(app)/tutors/[tutor_id]": { tutor_id: string };
			"/(app)/tutors/[tutor_id]/update": { tutor_id: string };
			"/(app)/veterinaries/[veterinary_id]": { veterinary_id: string };
			"/(app)/veterinaries/[veterinary_id]/update": { veterinary_id: string }
		};
		LayoutParams(): {
			"/(app)": { id?: string; budget_id?: string; dog_id?: string; raw_material_id?: string; recipe_id?: string; tutor_id?: string; veterinary_id?: string };
			"/": { token?: string; id?: string; budget_id?: string; dog_id?: string; raw_material_id?: string; recipe_id?: string; tutor_id?: string; veterinary_id?: string };
			"/budget-response": { token?: string };
			"/budget-response/[token]": { token: string };
			"/(app)/budgets": { id?: string; budget_id?: string };
			"/(app)/budgets/new": Record<string, never>;
			"/(app)/budgets/[id]": { id: string };
			"/(app)/budgets/[budget_id]": { budget_id: string };
			"/(app)/budgets/[id]/preview": { id: string };
			"/(app)/budgets/[budget_id]/update": { budget_id: string };
			"/(app)/dashboard": Record<string, never>;
			"/(app)/dogs": { dog_id?: string };
			"/(app)/dogs/new": Record<string, never>;
			"/(app)/dogs/[dog_id]": { dog_id: string };
			"/(app)/dogs/[dog_id]/update": { dog_id: string };
			"/logout": Record<string, never>;
			"/(app)/raw-materials": { raw_material_id?: string };
			"/(app)/raw-materials/new": Record<string, never>;
			"/(app)/raw-materials/[raw_material_id]": { raw_material_id: string };
			"/(app)/raw-materials/[raw_material_id]/update": { raw_material_id: string };
			"/(app)/recipes": { recipe_id?: string };
			"/(app)/recipes/new": Record<string, never>;
			"/(app)/recipes/[recipe_id]": { recipe_id: string };
			"/(app)/recipes/[recipe_id]/update": { recipe_id: string };
			"/(app)/settings": Record<string, never>;
			"/(app)/tutors": { tutor_id?: string };
			"/(app)/tutors/new": Record<string, never>;
			"/(app)/tutors/[tutor_id]": { tutor_id: string };
			"/(app)/tutors/[tutor_id]/update": { tutor_id: string };
			"/(app)/veterinaries": { veterinary_id?: string };
			"/(app)/veterinaries/new": Record<string, never>;
			"/(app)/veterinaries/[veterinary_id]": { veterinary_id: string };
			"/(app)/veterinaries/[veterinary_id]/update": { veterinary_id: string }
		};
		Pathname(): "/" | `/budget-response/${string}` & {} | "/budgets" | "/budgets/new" | `/budgets/${string}/preview` & {} | `/budgets/${string}/update` & {} | "/dashboard" | "/dogs" | "/dogs/new" | `/dogs/${string}/update` & {} | "/logout" | "/raw-materials" | "/raw-materials/new" | `/raw-materials/${string}/update` & {} | "/recipes" | "/recipes/new" | `/recipes/${string}/update` & {} | "/settings" | "/tutors" | "/tutors/new" | `/tutors/${string}/update` & {} | "/veterinaries" | "/veterinaries/new" | `/veterinaries/${string}/update` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}