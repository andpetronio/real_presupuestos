export type WholesaleOrderStatus = "pending" | "delivered" | "paid";

export type WholesaleOrderItemView = {
  id: string;
  order_id?: string;
  quantity: number;
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
    sortBy: "wholesaler" | "placed_at" | "status" | "total_units" | "total_ars";
    sortDir: "asc" | "desc";
  };
};
