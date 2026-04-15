import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { navItems } from '$lib/constants/navigation';

const sanitizeActorId = (value: string | undefined): string | null => {
  if (!value) return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};


export const load: LayoutServerLoad = async ({ locals, url }) => {
  const actorId = sanitizeActorId(locals.user?.id);

  if (!actorId) {
    const next = encodeURIComponent(url.pathname + url.search);
    throw redirect(303, `/?next=${next}`);
  }

  return {
    actorId,
    navContext: navItems
      .filter((item) => item.internalOnly)
      .map(({ key, href, label }) => ({ key, href, label }))
  };
};
