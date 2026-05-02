export type WholesaleOrderStatus =
  | "received"
  | "in_preparation"
  | "ready"
  | "delivered"
  | "paid";

export type WholesalePaymentMethod =
  | "cash"
  | "transfer"
  | "mercadopago"
  | "other";

export type WholesaleOrderItemView = {
  id: string;
  order_id?: string;
  quantity: number;
  prepared_quantity: number;
  unit_price_ars_snapshot: number;
  line_total_ars_snapshot: number;
  product_name_snapshot: string;
  presentation_snapshot: string;
};

export type WholesaleOrderListRow = {
  id: string;
  status: WholesaleOrderStatus;
  statusLabel: string;
  wholesalerName: string;
  total_units: number;
  total_ars: number;
  notes?: string | null;
  placed_at: string;
  expected_delivery_at: string;
  ready_at?: string | null;
  paid_at?: string | null;
  payment_method?: WholesalePaymentMethod | null;
  isOverdue: boolean;
  daysToDelivery: number;
};

export type WholesaleOrderDetailView = WholesaleOrderListRow & {
  delivered_at?: string | null;
  paid_at?: string | null;
  items: ReadonlyArray<WholesaleOrderItemView>;
};

export type WholesaleOrdersPageDataViewModel = {
  orders: ReadonlyArray<WholesaleOrderListRow>;
  tableState: "idle" | "success" | "error" | "empty";
  tableMessage: { title: string; detail: string } | null;
  pagination: { page: number; totalPages: number; total: number };
  filters: { search: string; status: string };
  sort: {
    sortBy:
      | "wholesaler"
      | "placed_at"
      | "expected_delivery_at"
      | "status"
      | "total_units"
      | "total_ars";
    sortDir: "asc" | "desc";
  };
};
