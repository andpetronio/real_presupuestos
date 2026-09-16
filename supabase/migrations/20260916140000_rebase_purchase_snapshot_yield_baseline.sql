-- One-time calibration for snapshots created before yield factors were
-- configured in the raw-material catalogue. Future snapshots remain immutable.
update public.purchase_requirement_snapshots snapshot
set
  yield_factor = rm.yield_factor,
  purchase_quantity = case
    when snapshot.wastage_percentage >= 100 then null
    else snapshot.net_quantity
      / (1 - snapshot.wastage_percentage / 100)
      / rm.yield_factor
  end
from public.raw_materials rm
where rm.id = snapshot.raw_material_id
  and snapshot.yield_factor <> rm.yield_factor;
