create extension if not exists pgcrypto;

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellidos text,
  telefono text,
  email text,
  direccion text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  notas text,
  requiere_factura boolean default false,
  nif_cif text,
  razon_social text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists perros (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  nombre text not null,
  raza text,
  fecha_nacimiento date,
  sexo text,
  peso_kg numeric(6,2),
  tamano text,
  numero_chip text,
  foto_url text,
  vacunas_al_dia boolean default false,
  esterilizado boolean default false,
  alergias text,
  medicacion text,
  alimentacion text,
  caracter text,
  sociable_perros boolean,
  sociable_personas boolean,
  sociable_ninos boolean,
  observaciones text,
  activo boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  tipo_unidad_cobro text,
  activo boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tarifas_generales (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references servicios(id) on delete cascade,
  nombre_tarifa text,
  precio_base numeric(10,2) not null,
  moneda text default 'EUR',
  activa boolean default true,
  vigencia_desde date,
  vigencia_hasta date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tarifas_especiales_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  servicio_id uuid not null references servicios(id) on delete cascade,
  precio_especial numeric(10,2) not null,
  moneda text default 'EUR',
  vigencia_desde date,
  vigencia_hasta date,
  motivo text,
  activa boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  servicio_id uuid not null references servicios(id) on delete restrict,
  estado text not null default 'pendiente',
  fecha_llegada date,
  hora_estimada_llegada time,
  fecha_salida date,
  hora_estimada_salida time,
  checkin_real_at timestamptz,
  checkout_real_at timestamptz,
  observaciones text,
  origen_tarifa text,
  tarifa_aplicada numeric(10,2),
  numero_noches integer default 0,
  aplica_recargo_guarderia boolean default false,
  numero_guarderias_recargo integer default 0,
  numero_festivos_detectados integer default 0,
  sugerir_descuento_larga_estancia boolean default false,
  sugerir_descuento_segundo_perro boolean default false,
  sobreocupacion_autorizada boolean default false,
  subtotal numeric(10,2) default 0,
  total_descuentos numeric(10,2) default 0,
  total_recargos numeric(10,2) default 0,
  total_final numeric(10,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reserva_perros (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  perro_id uuid not null references perros(id) on delete restrict,
  orden_en_reserva integer,
  observaciones text,
  created_at timestamptz not null default now(),
  unique (reserva_id, perro_id)
);

create table if not exists ajustes_reserva (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  tipo text not null,
  concepto text not null,
  modo text default 'manual',
  importe numeric(10,2) not null,
  cantidad integer default 1,
  descripcion text,
  created_at timestamptz not null default now()
);

create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  fecha_pago date not null default current_date,
  importe numeric(10,2) not null,
  metodo_pago text,
  estado text default 'confirmado',
  referencia text,
  observaciones text,
  created_at timestamptz not null default now()
);

create table if not exists festivos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  nombre text not null,
  ambito text,
  municipio text,
  comunidad_autonoma text,
  activo boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists configuracion (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  valor text,
  descripcion text,
  updated_at timestamptz not null default now()
);

create table if not exists notas_reserva (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  tipo text,
  nota text not null,
  created_at timestamptz not null default now()
);

create table if not exists series_recurrentes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  servicio_id uuid not null references servicios(id) on delete restrict,
  fecha_inicio date not null,
  fecha_fin date,
  frecuencia text not null,
  dias_semana text,
  hora_inicio_estimada time,
  hora_fin_estimada time,
  excluir_festivos boolean default false,
  activa boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ocurrencias_recurrentes (
  id uuid primary key default gen_random_uuid(),
  serie_id uuid not null references series_recurrentes(id) on delete cascade,
  fecha date not null,
  estado text default 'programada',
  hora_inicio_estimada time,
  hora_fin_estimada time,
  importe numeric(10,2),
  cancelada boolean default false,
  modificada_individualmente boolean default false,
  notas text,
  created_at timestamptz not null default now(),
  unique (serie_id, fecha)
);

insert into servicios (codigo, nombre, descripcion, tipo_unidad_cobro)
values
  ('alojamiento', 'Alojamiento nocturno', 'Servicio por noche cerrada', 'por_noche'),
  ('guarderia', 'Guardería', 'Servicio de día', 'por_dia'),
  ('paseo', 'Paseo', 'Paseo del perro', 'por_servicio'),
  ('visita_domicilio', 'Visita a domicilio', 'Atención en domicilio', 'por_servicio'),
  ('recogida_entrega', 'Recogida / entrega', 'Transporte del perro', 'por_trayecto'),
  ('medicacion', 'Administración de medicación', 'Extra de medicación', 'por_servicio'),
  ('peluqueria', 'Peluquería', 'Servicio de peluquería', 'por_servicio')
on conflict (codigo) do nothing;

insert into configuracion (clave, valor, descripcion)
values
  ('capacidad_maxima_alojamiento', '5', 'Número máximo de perros alojados'),
  ('permitir_sobreocupacion', 'true', 'Permitir o no sobreocupación manual'),
  ('margen_cortesia_horas', '2', 'Margen de cortesía para check-out en alojamiento'),
  ('sugerir_descuento_larga_estancia_desde_noches', '15', 'Sugerencia de larga estancia'),
  ('ciudad_festivos', 'Madrid', 'Ciudad de referencia para festivos')
on conflict (clave) do nothing;

-- También actualiza de forma segura proyectos creados con una versión anterior.
alter table clientes add column if not exists activo boolean not null default true;
alter table perros drop constraint if exists perros_cliente_id_fkey;
alter table perros add constraint perros_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete restrict;
alter table tarifas_especiales_cliente drop constraint if exists tarifas_especiales_cliente_cliente_id_fkey;
alter table tarifas_especiales_cliente add constraint tarifas_especiales_cliente_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete restrict;
alter table reservas drop constraint if exists reservas_cliente_id_fkey;
alter table reservas add constraint reservas_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete restrict;
alter table reserva_perros drop constraint if exists reserva_perros_perro_id_fkey;
alter table reserva_perros add constraint reserva_perros_perro_id_fkey foreign key (perro_id) references perros(id) on delete restrict;
alter table series_recurrentes drop constraint if exists series_recurrentes_cliente_id_fkey;
alter table series_recurrentes add constraint series_recurrentes_cliente_id_fkey foreign key (cliente_id) references clientes(id) on delete restrict;

alter table reservas drop constraint if exists reservas_estado_check;
alter table reservas add constraint reservas_estado_check check (estado in ('borrador', 'pendiente', 'confirmada', 'en_curso', 'finalizada', 'cancelada'));
alter table reservas drop constraint if exists reservas_fechas_check;
alter table reservas add constraint reservas_fechas_check check (fecha_salida is null or fecha_llegada is null or fecha_salida > fecha_llegada);
alter table pagos drop constraint if exists pagos_importe_positivo_check;
alter table pagos add constraint pagos_importe_positivo_check check (importe > 0);
alter table servicios drop constraint if exists servicios_unidad_cobro_check;
alter table servicios add constraint servicios_unidad_cobro_check check (
  tipo_unidad_cobro in ('por_noche', 'por_dia', 'por_servicio', 'por_trayecto')
);
alter table tarifas_generales drop constraint if exists tarifas_generales_precio_check;
alter table tarifas_generales add constraint tarifas_generales_precio_check check (precio_base >= 0);
alter table tarifas_generales drop constraint if exists tarifas_generales_vigencia_check;
alter table tarifas_generales add constraint tarifas_generales_vigencia_check check (
  vigencia_hasta is null or vigencia_desde is null or vigencia_hasta >= vigencia_desde
);

-- Acceso interno: solo usuarios autenticados pueden operar con los datos.
alter table clientes enable row level security;
alter table perros enable row level security;
alter table servicios enable row level security;
alter table tarifas_generales enable row level security;
alter table tarifas_especiales_cliente enable row level security;
alter table reservas enable row level security;
alter table reserva_perros enable row level security;
alter table ajustes_reserva enable row level security;
alter table pagos enable row level security;
alter table festivos enable row level security;
alter table configuracion enable row level security;
alter table notas_reserva enable row level security;
alter table series_recurrentes enable row level security;
alter table ocurrencias_recurrentes enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'clientes', 'perros', 'servicios', 'tarifas_generales',
    'tarifas_especiales_cliente', 'reservas', 'reserva_perros',
    'ajustes_reserva', 'pagos', 'festivos', 'configuracion',
    'notas_reserva', 'series_recurrentes', 'ocurrencias_recurrentes'
  ]
  loop
    execute format('drop policy if exists authenticated_access on %I', table_name);
    execute format(
      'create policy authenticated_access on %I for all to authenticated using (true) with check (true)',
      table_name
    );
  end loop;
end $$;

-- El bucket es privado y limita formato y tamaño de las fotografías.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dog-photos', 'dog-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists dog_photos_authenticated_select on storage.objects;
create policy dog_photos_authenticated_select on storage.objects
for select to authenticated using (bucket_id = 'dog-photos');

drop policy if exists dog_photos_authenticated_insert on storage.objects;
create policy dog_photos_authenticated_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists dog_photos_authenticated_delete on storage.objects;
create policy dog_photos_authenticated_delete on storage.objects
for delete to authenticated
using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Crea una reserva y sus perros de forma atómica.
create or replace function crear_reserva(
  p_cliente_id uuid,
  p_servicio_id uuid,
  p_perro_ids uuid[],
  p_estado text,
  p_fecha_llegada date,
  p_hora_estimada_llegada time,
  p_fecha_salida date default null,
  p_hora_estimada_salida time default null,
  p_observaciones text default null,
  p_numero_noches integer default 0
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_reserva_id uuid;
  valid_dogs integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Es necesario iniciar sesión.';
  end if;
  if p_estado not in ('borrador', 'pendiente', 'confirmada', 'en_curso') then
    raise exception 'Estado de reserva no permitido.';
  end if;
  if p_fecha_llegada is null or p_hora_estimada_llegada is null then
    raise exception 'La fecha y la hora de llegada son obligatorias.';
  end if;
  if p_fecha_salida is not null and p_fecha_salida <= p_fecha_llegada then
    raise exception 'La fecha de salida debe ser posterior a la fecha de llegada.';
  end if;
  if coalesce(cardinality(p_perro_ids), 0) = 0 then
    raise exception 'La reserva debe incluir al menos un perro.';
  end if;
  if not exists (select 1 from public.clientes where id = p_cliente_id and activo) then
    raise exception 'El cliente no existe o está desactivado.';
  end if;
  if not exists (select 1 from public.servicios where id = p_servicio_id and activo) then
    raise exception 'El servicio no existe o está desactivado.';
  end if;

  select count(*) into valid_dogs
  from public.perros
  where id = any(p_perro_ids) and cliente_id = p_cliente_id and activo;
  if valid_dogs <> cardinality(p_perro_ids) then
    raise exception 'Todos los perros deben estar activos y pertenecer al cliente.';
  end if;

  insert into public.reservas (
    cliente_id, servicio_id, estado, fecha_llegada, hora_estimada_llegada,
    fecha_salida, hora_estimada_salida, observaciones, numero_noches,
    sugerir_descuento_larga_estancia, sugerir_descuento_segundo_perro
  ) values (
    p_cliente_id, p_servicio_id, p_estado, p_fecha_llegada, p_hora_estimada_llegada,
    p_fecha_salida, p_hora_estimada_salida, nullif(trim(p_observaciones), ''),
    greatest(p_numero_noches, 0), p_numero_noches >= 15, cardinality(p_perro_ids) > 1
  ) returning id into new_reserva_id;

  insert into public.reserva_perros (reserva_id, perro_id, orden_en_reserva)
  select new_reserva_id, dog_id, dog_order::integer
  from unnest(p_perro_ids) with ordinality as dogs(dog_id, dog_order);
  return new_reserva_id;
end;
$$;

revoke all on function crear_reserva(uuid, uuid, uuid[], text, date, time, date, time, text, integer) from public;
grant execute on function crear_reserva(uuid, uuid, uuid[], text, date, time, date, time, text, integer) to authenticated;
