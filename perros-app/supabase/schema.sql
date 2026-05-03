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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists perros (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
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
  cliente_id uuid not null references clientes(id) on delete cascade,
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
  cliente_id uuid not null references clientes(id) on delete cascade,
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
  perro_id uuid not null references perros(id) on delete cascade,
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
  cliente_id uuid not null references clientes(id) on delete cascade,
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
