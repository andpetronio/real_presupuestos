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
  Rows
} from '$lib/icons/phosphor';

export type AdminModule =
  | 'dashboard'
  | 'budgets'
  | 'tutors'
  | 'veterinaries'
  | 'dogs'
  | 'recipes'
  | 'raw-materials'
  | 'tracking'
  | 'settings'
  | 'wholesalers-dashboard'
  | 'wholesalers'
  | 'wholesaler-categories'
  | 'wholesale-products'
  | 'wholesale-assortment'
  | 'wholesale-orders';

export type AdminHref =
  | '/dashboard'
  | '/budgets'
  | '/tutors'
  | '/veterinaries'
  | '/dogs'
  | '/recipes'
  | '/raw-materials'
  | '/seguimiento'
  | '/settings'
  | '/mayoristas-dashboard'
  | '/admin-mayoristas'
  | '/mayorista-categories'
  | '/mayorista-products'
  | '/mayorista-assortment'
  | '/mayorista-orders';

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
    key: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: Gauge,
    internalOnly: true,
  },
  {
    key: 'budgets',
    href: '/budgets',
    label: 'Presupuestos',
    icon: CurrencyDollar,
    internalOnly: true,
  },
  {
    key: 'tutors',
    href: '/tutors',
    label: 'Tutores',
    icon: Users,
    internalOnly: true,
  },
  {
    key: 'veterinaries',
    href: '/veterinaries',
    label: 'Veterinarias',
    icon: WarningCircle,
    internalOnly: true,
  },
  {
    key: 'dogs',
    href: '/dogs',
    label: 'Perros',
    icon: PawPrint,
    internalOnly: true,
  },
  {
    key: 'recipes',
    href: '/recipes',
    label: 'Recetas',
    icon: CookingPot,
    internalOnly: true,
  },
  {
    key: 'raw-materials',
    href: '/raw-materials',
    label: 'Materias primas',
    icon: Package,
    internalOnly: true,
  },
  {
    key: 'tracking',
    href: '/seguimiento',
    label: 'Seguimiento',
    icon: ChartLine,
    internalOnly: true,
  },
  {
    key: 'settings',
    href: '/settings',
    label: 'Configuración',
    icon: Gear,
    internalOnly: true,
  },
  {
    key: 'wholesalers-dashboard',
    href: '/mayoristas-dashboard',
    label: 'Dashboard mayoristas',
    icon: ChartLine,
    internalOnly: true,
  },
  {
    key: 'wholesalers',
    href: '/admin-mayoristas',
    label: 'Mayoristas',
    icon: Users,
    internalOnly: true,
  },
  {
    key: 'wholesaler-categories',
    href: '/mayorista-categories',
    label: 'Categorías mayoristas',
    icon: Tag,
    internalOnly: true,
  },
  {
    key: 'wholesale-products',
    href: '/mayorista-products',
    label: 'Productos mayoristas',
    icon: Package,
    internalOnly: true,
  },
  {
    key: 'wholesale-assortment',
    href: '/mayorista-assortment',
    label: 'Surtido por mayorista',
    icon: Rows,
    internalOnly: true,
  },
  {
    key: 'wholesale-orders',
    href: '/mayorista-orders',
    label: 'Pedidos mayoristas',
    icon: CurrencyDollar,
    internalOnly: true,
  },
] as const;
