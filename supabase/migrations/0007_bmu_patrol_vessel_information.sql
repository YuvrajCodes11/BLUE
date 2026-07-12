alter table public.bmu_patrol_reports
  add column if not exists patrol_vessel_name_jina_la_chombo text,
  add column if not exists vessel_type_aina_ya_chombo_material_length text,
  add column if not exists vessel_engine_horsepower_hp_nguvu_ya_engine text;
