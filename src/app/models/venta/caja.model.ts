// ================================================================
// APERTURA DE CAJA
// ================================================================

export interface AbrirCajaDto {
    efectivoApertura: number;  // Billetes/monedas en caja al abrir turno
    virtualApertura: number;   // Saldo en pasarela/POS al abrir (puede ser 0)
    sucursalId: string;
    usuarioId: string;
}

// ================================================================
// RESUMEN/ARQUEO DE CAJA
// ================================================================

export interface CajaResumenDto {
    // --- Metadatos ---
    id: string;
    estado: string;
    fechaApertura: string;
    fechaCierre: string;
    usuarioNombre: string;

    // --- Bloque 1: Flujo de Dinero ---
    montoInicial: number;              // Base (efectivo apertura)
    totalIngresosCajaChica: number;    // Entradas manuales (no ventas)
    totalEgresosCajaChica: number;     // Gastos

    // --- Bloque 2: Ventas (Calculadas desde Pedidos) ---
    totalVentasEfectivo: number;
    totalVentasTarjeta: number;
    totalVentasOtros: number;          // Yape, Plin, Transferencia
    totalVentasGlobal: number;         // La suma de todo lo vendido

    // --- Bloque 3: Arqueo (La prueba de fuego) ---
    saldoEsperadoEnCaja: number;       // (Inicial + VentasEfectivo + Ingresos) - Egresos
    saldoRealEnCaja: number;           // Lo que contó el cajero al cerrar
    diferencia: number;
}

// ================================================================
// LISTADO DE TURNOS
// ================================================================

export interface CajaTurnoDto {
    id: string;
    estado: string;            // "ABIERTO" o "CERRADO"
    fechaApertura: string;
    fechaCierre: string;
    usuarioNombre: string;
    montoInicial: number;
    diferencia: number;
}

// ================================================================
// CIERRE DE CAJA — Alineado con el nuevo backend
// ================================================================

export interface CerrarCajaDto {
    id: string;
    efectivoCierreReal: number;      // Efectivo físico contado por el cajero
    virtualCierreReal: number;       // Saldo virtual contado (POS/pasarela)
    efectivoCierreEsperado: number;  // Lo que el sistema esperaba en efectivo
    virtualCierreEsperado: number;   // Lo que el sistema esperaba en virtual
    comentario: string;              // Observaciones (obligatorio si hay diferencia)
}
