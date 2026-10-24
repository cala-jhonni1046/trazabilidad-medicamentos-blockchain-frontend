export interface MedicamentoDto {
  id: number;
  nombre: string;
  principioActivo: string;
  requiereCadenaFrio: boolean;
}

export interface MedicamentoRequest {
  nombre: string;
  principioActivo: string;
  requiereCadenaFrio: boolean;
}
