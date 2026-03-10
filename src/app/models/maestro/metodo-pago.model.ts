export interface MetodoPago {
    id: string,
    nombre: string,
    esEfectivo: boolean,
    empresa: string
}

export type CreateMetodoPagoDto = Omit<MetodoPago, 'id' | 'empresaId' | 'esEfectivo'> & {
    empresaId: string;
};

export type UpdateMetodoPagoDto = Partial<CreateMetodoPagoDto>;