export type Cliente = {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
};

export type Perro = {
  id: string;
  cliente_id: string;
  nombre: string;
  raza: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  peso_kg: number | null;
  tamano: string | null;
  numero_chip: string | null;
  foto_url: string | null;
  vacunas_al_dia: boolean | null;
  esterilizado: boolean | null;
  alergias: string | null;
  medicacion: string | null;
  alimentacion: string | null;
  observaciones: string | null;
  created_at: string;
};

export type Servicio = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo_unidad_cobro: string | null;
  activo: boolean;
};

export type TarifaGeneral = {
  id: string;
  servicio_id: string;
  nombre_tarifa: string | null;
  precio_base: number;
  moneda: string;
  activa: boolean;
  vigencia_desde: string | null;
  vigencia_hasta: string | null;
  observaciones: string | null;
  created_at: string;
};

export type Reserva = {
  id: string;
  cliente_id: string;
  servicio_id: string;
  estado: string;
  fecha_llegada: string | null;
  hora_estimada_llegada: string | null;
  fecha_salida: string | null;
  hora_estimada_salida: string | null;
  checkin_real_at: string | null;
  checkout_real_at: string | null;
  numero_noches: number | null;
  origen_tarifa: string | null;
  tarifa_aplicada: number | null;
  subtotal: number | null;
  total_descuentos: number | null;
  total_recargos: number | null;
  total_final: number | null;
  numero_festivos_detectados: number | null;
  observaciones: string | null;
  created_at: string;
};
