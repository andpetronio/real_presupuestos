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
  Tag,
  Rows,
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
  | "settings"
  | "wholesalers-dashboard"
  | "wholesalers"
  | "wholesaler-categories"
  | "wholesale-products"
  | "wholesale-assortment"
  | "wholesale-orders";

export type AdminHref =
  | "/dashboard"
  | "/budgets"
  | "/tutors"
  | "/veterinaries"
  | "/dogs"
  | "/recipes"
  | "/raw-materials"
  | "/seguimiento"
  | "/settings"
  | "/mayoristas-dashboard"
  | "/admin-mayoristas"
  | "/mayorista-categories"
  | "/mayorista-products"
  | "/mayorista-assortment"
  | "/mayorista-orders";

type PhosphorIcon = typeof Gauge;

export interface NavItem {
  key: AdminModule;
  href: AdminHref;
  label: string;
  icon: PhosphorIcon;
  group: "Gestión" | "Clientes y producción" | "Mayoristas" | "Sistema";
  internalOnly: true;
}

export const navItems: ReadonlyArray<NavItem> = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: Gauge,
    group: "Gestión",
    internalOnly: true,
  },
  {
    key: "budgets",
    href: "/budgets",
    label: "Presupuestos",
    icon: CurrencyDollar,
    group: "Gestión",
    internalOnly: true,
  },
  {
    key: "tutors",
    href: "/tutors",
    label: "Tutores",
    icon: Users,
    group: "Clientes y producción",
    internalOnly: true,
  },
  {
    key: "veterinaries",
    href: "/veterinaries",
    label: "Veterinarias",
    icon: WarningCircle,
    group: "Clientes y producción",
    internalOnly: true,
  },
  {
    key: "dogs",
    href: "/dogs",
    label: "Perros",
    icon: PawPrint,
    group: "Clientes y producción",
    internalOnly: true,
  },
  {
    key: "recipes",
    href: "/recipes",
    label: "Recetas",
    icon: CookingPot,
    group: "Clientes y producción",
    internalOnly: true,
  },
  {
    key: "raw-materials",
    href: "/raw-materials",
    label: "Materias primas",
    icon: Package,
    group: "Clientes y producción",
    internalOnly: true,
  },
  {
    key: "tracking",
    href: "/seguimiento",
    label: "Seguimiento",
    icon: ChartLine,
    group: "Gestión",
    internalOnly: true,
  },
  {
    key: "settings",
    href: "/settings",
    label: "Configuración",
    icon: Gear,
    group: "Sistema",
    internalOnly: true,
  },
  {
    key: "wholesalers-dashboard",
    href: "/mayoristas-dashboard",
    label: "Dashboard mayoristas",
    icon: ChartLine,
    group: "Mayoristas",
    internalOnly: true,
  },
  {
    key: "wholesalers",
    href: "/admin-mayoristas",
    label: "Mayoristas",
    icon: Users,
    group: "Mayoristas",
    internalOnly: true,
  },
  {
    key: "wholesaler-categories",
    href: "/mayorista-categories",
    label: "Categorías mayoristas",
    icon: Tag,
    group: "Mayoristas",
    internalOnly: true,
  },
  {
    key: "wholesale-products",
    href: "/mayorista-products",
    label: "Productos mayoristas",
    icon: Package,
    group: "Mayoristas",
    internalOnly: true,
  },
  {
    key: "wholesale-assortment",
    href: "/mayorista-assortment",
    label: "Surtido por mayorista",
    icon: Rows,
    group: "Mayoristas",
    internalOnly: true,
  },
  {
    key: "wholesale-orders",
    href: "/mayorista-orders",
    label: "Pedidos mayoristas",
    icon: CurrencyDollar,
    group: "Mayoristas",
    internalOnly: true,
  },
] as const;
