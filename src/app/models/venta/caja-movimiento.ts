export type TipoMovimiento = 'INGRESO' | 'EGRESO';

export interface MovimientoCaja {
    cajaId: string;
    tipo: TipoMovimiento;
    monto: number;
    descripcion: string;
    usuarioId: string;
    esEfectivo?: boolean;
}

export interface CreateMovimientoCajaRequest {
    cajaId: string;
    monto: number;
    descripcion: string;
    tipo: TipoMovimiento;
    usuarioId: string;
    esEfectivo?: boolean;
}

export interface MovimientoCajaResponse {
    id: string;
    tipo: TipoMovimiento;
    monto: number;
    descripcion: string;
    fecha: string;
    usuarioNombre: string;
    esEfectivo?: boolean;
}