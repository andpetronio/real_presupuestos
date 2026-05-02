import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
  clearWholesalerSessionCookie,
  readWholesalerSessionTokenHash,
} from '$lib/server/wholesale/session';

type PortalOrdersPayload = {
  ok: boolean;
  error_code?: string;
  wholesaler?: { id: string; name: string };
  orders?: Array<{
    id: string;
    status: 'received' | 'in_preparation' | 'ready' | 'delivered' | 'paid';
    total_units: number;
    total_ars: number;
    notes: string | null;
    placed_at: string;
    expected_delivery_at: string;
    ready_at: string | null;
    delivered_at: string | null;
    paid_at: string | null;
    payment_method: 'cash' | 'transfer' | 'mercadopago' | 'other' | null;
    items: Array<{
      id: string;
      quantity: number;
      unit_price_ars_snapshot: number;
      line_total_ars_snapshot: number;
      product_name_snapshot: string;
      presentation_snapshot: string;
    }>;
  }>;
};

const allowedStatuses = new Set([
  'all',
  'received',
  'in_preparation',
  'ready',
  'delivered',
  'paid',
]);

export const load: PageServerLoad = async ({ cookies, locals, url }) => {
  const tokenHash = readWholesalerSessionTokenHash(cookies);
  if (!tokenHash) {
    clearWholesalerSessionCookie(cookies);
    throw redirect(303, '/mayoristas/login');
  }

  const statusRaw = (url.searchParams.get('status')?.trim() ?? 'all').toLowerCase();
  const status = allowedStatuses.has(statusRaw) ? statusRaw : 'all';

  const { data, error } = await locals.supabase.rpc('wholesale_get_portal_orders', {
    p_session_token_hash: tokenHash,
    p_status: status,
  });

  if (error || !data || !(data as PortalOrdersPayload).ok) {
    clearWholesalerSessionCookie(cookies);
    throw redirect(303, '/mayoristas/login');
  }

  const payload = data as PortalOrdersPayload;

  return {
    wholesaler: payload.wholesaler ?? { id: '', name: 'Mayorista' },
    currentStatus: status,
    orders: payload.orders ?? [],
  };
};
