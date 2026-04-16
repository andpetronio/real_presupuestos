<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import {
    Button,
    Navbar,
    NavBrand,
    NavHamburger,
    NavUl,
    NavLi,
    Sidebar,
    SidebarGroup,
    SidebarItem,
    uiHelpers,
    CloseButton,
    Breadcrumb,
    BreadcrumbItem
  } from 'flowbite-svelte';
  import { navItems, type NavItem, type AdminModule } from '$lib/constants/navigation';

  type LayoutData = {
    actorId: string;
    pendingAcceptedCount: number;
    navContext: ReadonlyArray<{
      key: AdminModule;
      href: string;
      label: string;
    }>;
  };

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  const navByKey = new Map(navItems.map((item) => [item.key, item]));
  const resolvedNavItems = $derived(
    data.navContext
      .map((item) => navByKey.get(item.key))
      .filter((item): item is NavItem => Boolean(item)) as ReadonlyArray<NavItem>
  );

  const getPageTitle = (path: string) => {
    const prefixMatch = resolvedNavItems.find((item) => path === item.href || path.startsWith(`${item.href}/`));
    return prefixMatch?.label ?? 'Administración';
  };

  const getBreadcrumbs = (pathname: string) => {
    const crumbs: Array<{ href: string; label: string }> = [
      { href: '/dashboard', label: 'Inicio' }
    ];

    const matchedItem = resolvedNavItems.find((item) => pathname.startsWith(item.href));
    if (matchedItem) {
      if (matchedItem.href !== '/dashboard') {
        crumbs.push({ href: matchedItem.href, label: matchedItem.label });
      }

      const pathParts = pathname.slice(matchedItem.href.length + 1).split('/');
      if (pathParts[0] && pathParts[0] !== 'new' && !pathParts[0].includes('=')) {
        crumbs.push({
          href: matchedItem.href + '/' + pathParts[0],
          label: pathParts[0] === 'preview' ? 'Ver' : pathParts[0] === 'update' ? 'Editar' : pathParts[0]
        });
      }

      if (pathname.includes('/preview/') || pathname.includes('/update/')) {
        const idMatch = pathname.match(/\/(preview|update)\/([^/]+)/);
        if (idMatch) {
          crumbs.push({ href: '#', label: '...' + idMatch[2].slice(0, 4) });
        }
      } else if (pathname.endsWith('/new') || pathParts[0] === 'new') {
        crumbs.push({ href: pathname, label: 'Nuevo' });
      }
    }

    return crumbs;
  };

  const breadcrumbs = $derived(getBreadcrumbs(page.url.pathname));

  const badgeModules = new Set<AdminModule>(['budgets', 'tracking' as AdminModule]);

  const getBadgeCount = (module: AdminModule): number => {
    return badgeModules.has(module) ? data.pendingAcceptedCount : 0;
  };

  const getNavLabel = (item: NavItem): string => {
    const badge = getBadgeCount(item.key);
    return badge > 0 ? `${item.label} (${badge})` : item.label;
  };

  const sidebarUi = uiHelpers();
  let isDesktop = $state(false);

  onMount(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)');

    const syncDesktopState = () => {
      isDesktop = mediaQuery.matches;
      if (mediaQuery.matches) {
        sidebarUi.close();
      }
    };

    syncDesktopState();

    const handleViewportChange = (event: MediaQueryListEvent) => {
      isDesktop = event.matches;
      if (event.matches) {
        sidebarUi.close();
      }
    };

    mediaQuery.addEventListener('change', handleViewportChange);
    return () => {
      mediaQuery.removeEventListener('change', handleViewportChange);
    };
  });

  const closeSidebar = () => {
    sidebarUi.close();
  };

  const desktopSidebarClasses = {
    active:
      'flex items-center group-has-[ul]:ms-6 p-2 text-base font-medium rounded-sm text-white bg-white/20 hover:bg-white/25',
    nonactive:
      'flex items-center group-has-[ul]:ms-6 p-2 text-base font-normal rounded-sm text-white hover:bg-white/10 hover:text-white'
  };
</script>

<div class="flex flex-col h-screen bg-base]">
  <!-- Navbar: logo + logout -->
  <Navbar class="h-16 min-h-16 border-b border-gray-200 bg-white px-4">
    <NavBrand href="/dashboard">
      <span class="self-center text-xl font-semibold whitespace-nowrap text-primary">Presupuestos</span>
    </NavBrand>

    <div class="flex items-center gap-3 md:order-2">
      <NavHamburger class="sm:hidden" onclick={() => !isDesktop && sidebarUi.toggle()} />
      <form method="POST" action="/logout">
        <input type="hidden" name="next" value={page.url.pathname + page.url.search} />
        <Button type="submit" size="sm" color="light">Cerrar sesión</Button>
      </form>
    </div>
  </Navbar>

  <!-- Contenedor: sidebar + content -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar: desktop fixed left, mobile drawer -->
    <div class="hidden sm:block sm:w-72 sm:shrink-0">
      <Sidebar
        alwaysOpen
        breakpoint="sm"
        position="static"
        classes={desktopSidebarClasses}
        class="h-full w-72 border-r border-primary-800 bg-primary-700 p-4 [&>div]:bg-transparent [&>div]:px-0! [&>div]:py-0!"
      >
        <SidebarGroup>
          <span class="mb-4 block px-2 text-lg font-semibold text-white">Menú</span>
          {#each resolvedNavItems as item (item.href)}
            <SidebarItem
              href={item.href}
              label={getNavLabel(item)}
              active={page.url.pathname.startsWith(item.href)}
            >
              {#snippet icon()}
                <item.icon class="me-2.5 h-5 w-5" />
              {/snippet}
            </SidebarItem>
          {/each}
        </SidebarGroup>
      </Sidebar>
    </div>

    <!-- Mobile drawer sidebar -->
    {#if !isDesktop}
      <Sidebar
        isOpen={sidebarUi.isOpen}
        closeSidebar={closeSidebar}
        backdrop
        position="fixed"
        class="fixed inset-y-0 left-0 z-40 h-full w-64 transform transition-transform sm:hidden"
      >
        <CloseButton onclick={closeSidebar} class="absolute inset-e-2.5 top-2.5" />
        <SidebarGroup class="mt-12">
          <span class="mb-4 block px-2 text-lg font-semibold text-primary">Menú</span>
          {#each resolvedNavItems as item (item.href)}
            <SidebarItem href={item.href} label={getNavLabel(item)} active={page.url.pathname.startsWith(item.href)} onclick={closeSidebar}>
              {#snippet icon()}
                <item.icon class="me-2.5 h-5 w-5" />
              {/snippet}
            </SidebarItem>
          {/each}
        </SidebarGroup>
      </Sidebar>
    {/if}

    <!-- Content -->
    <div class="flex-1 overflow-x-auto p-4 md:p-6">
      <!-- Breadcrumb + título -->
      <div class="mb-4">
        <Breadcrumb class="mb-2">
          {#each breadcrumbs as crumb, index (`${crumb.href}-${index}`)}
            <BreadcrumbItem href={crumb.href}>
              {crumb.label}
            </BreadcrumbItem>
          {/each}
        </Breadcrumb>
        <h1 class="text-2xl font-bold text-primary">{getPageTitle(page.url.pathname)}</h1>
      </div>
      {@render children?.()}
    </div>
  </div>
</div>
