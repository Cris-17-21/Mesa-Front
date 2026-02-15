export interface AbrirCajaDto {
    montoApertura: number;
    sucursalId: string;
    usuarioId: string;
}

export interface CajaResumenDto {
    // --- Metadatos ---
    id: string;
    estado: string;
    fechaApertura: string;
    fechaCierre: string;
    usuarioNombre: string;

    // --- Bloque 1: Flujo de Dinero ---
    montoInicial: number; // Base
    totalIngresosCajaChica: number; // Entradas manuales (no ventas)
    totalEgresosCajaChica: number; // Gastos

    // --- Bloque 2: Ventas (Calculadas desde Pedidos) ---
    totalVentasEfectivo: number;
    totalVentasTarjeta: number;
    totalVentasOtros: number; // Yape, Plin, Transferencia
    totalVentasGlobal: number; // La suma de todo lo vendido

    // --- Bloque 3: Arqueo (La prueba de fuego) ---
    saldoEsperadoEnCaja: number; // (Inicial + VentasEfectivo + Ingresos) - Egresos
    saldoRealEnCaja: number; // Lo que contó el cajero al cerrar
    diferencia: number;
}

export interface CajaTurnoDto {
    id: string;
    estado: string; // "ABIERTO" o "CERRADO"
    fechaApertura: string;
    fechaCierre: string;
    usuarioNombre: string;
    montoInicial: number;
    diferencia: number;
}

export interface CerrarCajaDto {
    id: string;
    efectivoReal: number;
    tarjetaReal: number;
    comentario: string;
}
