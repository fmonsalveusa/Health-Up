-- ============================================================
-- HEALTH UP · Migración: precisión de pesos y concentración
-- Corre esto en Supabase → SQL Editor → New Query → Run
-- ============================================================
-- Los pesos se guardaban en kg con 1 decimal (0.1 kg ≈ 0.22 lbs), así que
-- 185.3 lbs se leía como 185.4. Con 2 decimales el error es < 0.03 lbs.

alter table public.weight_logs alter column weight type numeric(6,2);
alter table public.profiles alter column current_weight type numeric(6,2);
alter table public.profiles alter column target_weight type numeric(6,2);

-- mg por unidad con más decimales (14.47 / 82 = 0.17646...)
alter table public.dosing_orders alter column concentration_mg_per_unit type numeric(10,6);
