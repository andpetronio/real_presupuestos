<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { Button } from 'flowbite-svelte';
  import { ListIcon } from 'phosphor-svelte';
  import PageHeader from '$lib/components/admin/PageHeader.svelte';
  import SidebarSection from '$lib/components/admin/SidebarSection.svelte';
  import { navItems, type AdminModule, type NavItem } from '$lib/constants/navigation';

  type LayoutData = {
    actorId: string;
    pendingAcceptedCount: number;
    navContext: ReadonlyArray<{ key: AdminModule; href: string; label: string }>;
  };
  type NavGroup = NavItem['group'];

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
  let isMobileMenuOpen = $state(false);
  let isCollapsed = $state(false);

  const navByKey = new Map(navItems.map((item) => [item.key, item]));
  const groupOrder: ReadonlyArray<NavGroup> = ['Gestión', 'Clientes y producción', 'Mayoristas', 'Sistema'];
  const resolvedNavItems = $derived(
    data.navContext.map((item) => navByKey.get(item.key)).filter((item): item is NavItem => Boolean(item)) as ReadonlyArray<NavItem>,
  );
  const navGroups = $derived(groupOrder.map((label) => ({ label, items: resolvedNavItems.filter((item) => item.group === label) })).filter((group) => group.items.length > 0));

  const getPageTitle = (path: string) => resolvedNavItems.find((item) => path === item.href || path.startsWith(`${item.href}/`))?.label ?? 'Administración';
  const getBreadcrumbs = (pathname: string) => {
    const crumbs: Array<{ href: string; label: string }> = [{ href: '/dashboard', label: 'Inicio' }];
    const matched = resolvedNavItems.find((item) => pathname.startsWith(item.href));
    if (!matched) return crumbs;
    if (matched.href !== '/dashboard') crumbs.push({ href: matched.href, label: matched.label });

    const pathParts = pathname.slice(matched.href.length + 1).split('/');
    if (pathParts[0] && pathParts[0] !== 'new' && !pathParts[0].includes('=')) {
      crumbs.push({
        href: `${matched.href}/${pathParts[0]}`,
        label: pathParts[0] === 'preview' ? 'Ver' : pathParts[0] === 'update' ? 'Editar' : pathParts[0],
      });
    }

    if (pathname.includes('/preview/') || pathname.includes('/update/')) {
      const idMatch = pathname.match(/\/(preview|update)\/([^/]+)/);
      if (idMatch) crumbs.push({ href: '#', label: `...${idMatch[2].slice(0, 4)}` });
    } else if (pathname.endsWith('/new') || pathParts[0] === 'new') {
      crumbs.push({ href: pathname, label: 'Nuevo' });
    }
    return crumbs;
  };
  const breadcrumbs = $derived(getBreadcrumbs(page.url.pathname));
  const badgeModules = new Set<AdminModule>(['budgets', 'tracking']);
  const getBadgeCount = (module: AdminModule) => (badgeModules.has(module) ? data.pendingAcceptedCount : 0);
  const isActive = (item: NavItem) => page.url.pathname === item.href || page.url.pathname.startsWith(`${item.href}/`);

  const toggleCollapse = () => {
    isCollapsed = !isCollapsed;
    localStorage.setItem('real-admin-sidebar-collapsed', String(isCollapsed));
  };
  const closeMobileMenu = () => { isMobileMenuOpen = false; };
  onMount(() => { isCollapsed = localStorage.getItem('real-admin-sidebar-collapsed') === 'true'; });
</script>

{#snippet navigation(collapsed: boolean, onNavigate?: () => void)}
  <nav aria-label="Módulos administrativos" class="min-h-0 flex-1 overflow-y-auto px-2 py-3">
    {#each navGroups as group (group.label)}
      <SidebarSection label={group.label} {collapsed}>
        {#each group.items as item (item.href)}
          {@const badgeCount = getBadgeCount(item.key)}
          <li>
            <a href={item.href} aria-current={isActive(item) ? 'page' : undefined} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined} onclick={onNavigate} class:nav-item-active={isActive(item)} class="relative group flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 {collapsed ? 'justify-center px-2' : ''}">
              <item.icon size={18} weight={isActive(item) ? 'fill' : 'regular'} aria-hidden="true" class="shrink-0" />
              {#if !collapsed}
                <span class="min-w-0 flex-1 truncate">{item.label}</span>
                {#if badgeCount > 0}<span class="rounded-full bg-primary-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-primary-800">{badgeCount}</span>{/if}
              {:else if badgeCount > 0}
                <span class="absolute sr-only"> ({badgeCount} pendientes)</span>
              {/if}
            </a>
          </li>
        {/each}
      </SidebarSection>
    {/each}
  </nav>
{/snippet}

<div class="min-h-screen bg-gray-50 text-gray-900 lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
  <aside class="hidden h-screen shrink-0 border-r border-gray-200 bg-white lg:sticky lg:top-0 lg:flex lg:flex-col {isCollapsed ? 'lg:w-20' : 'lg:w-64'}">
    <div class="flex h-16 items-center border-b border-gray-100 px-4 {isCollapsed ? 'justify-center' : 'justify-between'}">
      <a href="/dashboard" class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"><img src="/logo.png" alt="Real, Amor en cada bocado" class="h-8 w-auto" loading="eager" decoding="async" /></a>
      {#if !isCollapsed}<button type="button" onclick={toggleCollapse} class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" aria-label="Contraer navegación"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,1,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z" /></svg></button>{/if}
    </div>
    {@render navigation(isCollapsed)}
    {#if isCollapsed}<button type="button" onclick={toggleCollapse} class="m-2 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" aria-label="Expandir navegación" title="Expandir navegación"><ListIcon size={19} aria-hidden="true" /></button>{/if}
  </aside>

  {#if isMobileMenuOpen}
    <div class="fixed inset-0 z-50 lg:hidden">
      <button type="button" class="absolute inset-0 bg-gray-900/30" aria-label="Cerrar menú de navegación" onclick={closeMobileMenu}></button>
      <aside class="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl" aria-label="Navegación interna">
        <div class="flex h-16 items-center justify-between border-b border-gray-100 px-4"><a href="/dashboard" onclick={closeMobileMenu}><img src="/logo.png" alt="Real, Amor en cada bocado" class="h-8 w-auto" /></a><button type="button" onclick={closeMobileMenu} class="rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">Cerrar</button></div>
        {@render navigation(false, closeMobileMenu)}
      </aside>
    </div>
  {/if}

  <div class="min-w-0">
    <header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-5">
      <button type="button" onclick={() => (isMobileMenuOpen = true)} class="rounded-md p-2 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden" aria-label="Abrir menú de navegación"><ListIcon size={21} aria-hidden="true" /></button>
      <span class="text-sm font-medium text-gray-500 lg:hidden">Real</span>
      <div class="ml-auto"><form method="POST" action="/logout"><input type="hidden" name="next" value={page.url.pathname + page.url.search} /><Button type="submit" size="xs" color="light">Cerrar sesión</Button></form></div>
    </header>
    <main id="main-content" class="min-w-0 p-4 sm:p-5 lg:p-6"><PageHeader title={getPageTitle(page.url.pathname)} {breadcrumbs} />{@render children?.()}</main>
  </div>
</div>

<style>
  :global(.nav-item-active) { background: var(--color-primary-50); color: var(--color-primary-800); box-shadow: inset 2px 0 0 var(--color-primary-600); }
</style>
