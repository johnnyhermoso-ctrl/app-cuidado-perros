export type Cliente = {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
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
  caracter: string | null;
  observaciones: string | null;
  created_at: string;
};
