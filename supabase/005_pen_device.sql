-- ============================================================
-- HEALTH UP · Migración: plumas de una dosis (ej. Zepbound)
-- Corre esto en Supabase → SQL Editor → New Query → Run
-- ============================================================
-- device = 'syringe' → vial + jeringa, dosis en unidades (vial_units = unidades del vial)
-- device = 'pen'     → pluma autoinyectora de una dosis, dosis fija en mg
--                      (start_mg = dosis; vial_units = plumas en la caja)

alter table public.dosing_orders
  add column if not exists device text not null default 'syringe'
  check (device in ('syringe', 'pen'));
