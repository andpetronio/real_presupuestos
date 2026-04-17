import {
  Gauge,
  CurrencyDollar,
  Users,
  PawPrint,
  CookingPot,
  Package,
  Gear,
  WarningCircle,
  ChartLine,
} from "$lib/icons/phosphor";

export type AdminModule =
  | "dashboard"
  | "budgets"
  | "tutors"
  | "veterinaries"
  | "dogs"
  | "recipes"
  | "raw-materials"
  | "tracking"
  | "settings";

export type AdminHref =
  | "/dashboard"
  | "/budgets"
  | "/tutors"
  | "/veterinaries"
  | "/dogs"
  | "/recipes"
  | "/raw-materials"
  | "/seguimiento"
  | "/settings";

type PhosphorIcon = typeof Gauge;

export interface NavItem {
  key: AdminModule;
  href: AdminHref;
  label: string;
  icon: PhosphorIcon;
  internalOnly: true;
}

export const navItems: ReadonlyArray<NavItem> = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: Gauge,
    internalOnly: true,
  },
  {
    key: "budgets",
    href: "/budgets",
    label: "Presupuestos",
    icon: CurrencyDollar,
    internalOnly: true,
  },
  {
    key: "tutors",
    href: "/tutors",
    label: "Tutores",
    icon: Users,
    internalOnly: true,
  },
  {
    key: "veterinaries",
    href: "/veterinaries",
    label: "Veterinarias",
    icon: WarningCircle,
    internalOnly: true,
  },
  {
    key: "dogs",
    href: "/dogs",
    label: "Perros",
    icon: PawPrint,
    internalOnly: true,
  },
  {
    key: "recipes",
    href: "/recipes",
    label: "Recetas",
    icon: CookingPot,
    internalOnly: true,
  },
  {
    key: "raw-materials",
    href: "/raw-materials",
    label: "Materias primas",
    icon: Package,
    internalOnly: true,
  },
  {
    key: "tracking",
    href: "/seguimiento",
    label: "Seguimiento",
    icon: ChartLine,
    internalOnly: true,
  },
  {
    key: "settings",
    href: "/settings",
    label: "Configuración",
    icon: Gear,
    internalOnly: true,
  },
] as const;
