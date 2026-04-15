import type * as Kit from '@sveltejs/kit';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;
type RouteParams = {  };
type RouteId = '/(app)';
type MaybeWithVoid<T> = {} extends T ? T | void : T;
export type RequiredKeys<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K; }[keyof T];
type OutputDataShape<T> = MaybeWithVoid<Omit<App.PageData, RequiredKeys<T>> & Partial<Pick<App.PageData, keyof T & keyof App.PageData>> & Record<string, any>>
type EnsureDefined<T> = T extends null | undefined ? {} : T;
type OptionalUnion<U extends Record<string, any>, A extends keyof U = U extends U ? keyof U : never> = U extends unknown ? { [P in Exclude<A, keyof U>]?: never } & U : never;
export type Snapshot<T = any> = Kit.Snapshot<T>;
type LayoutRouteId = RouteId | "/(app)/budgets" | "/(app)/budgets/[budget_id]/update" | "/(app)/budgets/[id]/preview" | "/(app)/budgets/new" | "/(app)/dashboard" | "/(app)/dogs" | "/(app)/dogs/[dog_id]/update" | "/(app)/dogs/new" | "/(app)/raw-materials" | "/(app)/raw-materials/[raw_material_id]/update" | "/(app)/raw-materials/new" | "/(app)/recipes" | "/(app)/recipes/[recipe_id]/update" | "/(app)/recipes/new" | "/(app)/settings" | "/(app)/tutors" | "/(app)/tutors/[tutor_id]/update" | "/(app)/tutors/new" | "/(app)/veterinaries" | "/(app)/veterinaries/[veterinary_id]/update" | "/(app)/veterinaries/new"
type LayoutParams = RouteParams & { budget_id?: string; id?: string; dog_id?: string; raw_material_id?: string; recipe_id?: string; tutor_id?: string; veterinary_id?: string }
type LayoutServerParentData = EnsureDefined<import('../$types.js').LayoutServerData>;
type LayoutParentData = EnsureDefined<import('../$types.js').LayoutData>;

export type LayoutServerLoad<OutputData extends OutputDataShape<LayoutServerParentData> = OutputDataShape<LayoutServerParentData>> = Kit.ServerLoad<LayoutParams, LayoutServerParentData, OutputData, LayoutRouteId>;
export type LayoutServerLoadEvent = Parameters<LayoutServerLoad>[0];
export type LayoutServerData = Expand<OptionalUnion<EnsureDefined<Kit.LoadProperties<Awaited<ReturnType<typeof import('./proxy+layout.server.js').load>>>>>>;
export type LayoutData = Expand<Omit<LayoutParentData, keyof LayoutServerData> & EnsureDefined<LayoutServerData>>;
export type LayoutProps = { params: LayoutParams; data: LayoutData; children: import("svelte").Snippet }
export type RequestEvent = Kit.RequestEvent<RouteParams, RouteId>;