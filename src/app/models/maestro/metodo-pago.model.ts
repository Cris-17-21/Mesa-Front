export interface MetodoPago {
    id: string,
    nombre: string,
    esEfectivo: boolean,
    requiereReferencia: boolean,
    codigoSunat: string,
    isActive: boolean,
    empresaId: string
}

export type CreateMetodoPagoDto = Omit<MetodoPago, 'id' | 'isActive'>;

export type UpdateMetodoPagoDto = Partial<CreateMetodoPagoDto>;