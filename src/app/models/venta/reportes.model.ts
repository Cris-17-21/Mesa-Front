export interface VentaDiariaDto {
  fecha: string;
  total: number;
  cantidadPedidos: number;
}

export interface SalesSummaryDto {
  totalVentas: number;
  promedioTicket: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalYape: number;
  totalPlin: number;
  totalOtros: number;
  ventasDiarias: VentaDiariaDto[];
}

export interface MenuRankingDto {
  nombrePlato: string;
  cantidad: number;
  ingresos: number;
}

export interface CajaAuditDto {
  cajaTurnoId: string;
  sucursalNombre: string;
  usuarioNombre: string;
  fechaApertura: string;
  fechaCierre: string;
  montoInicial: number;
  ingresosCajaChica: number;
  egresosCajaChica: number;
  saldoEsperado: number;
  saldoReal: number;
  diferencia: number;
  estado: string;
}

export interface ProductoBajoStockDto {
  productoId: number;
  nombreProducto: string;
  sucursalNombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
}

export interface StockCriticalDto {
  valoracionTotalInventario: number;
  productosBajoStock: ProductoBajoStockDto[];
}

export interface WaiterPerformanceDto {
  waiterNombre: string;
  cantidadPedidos: number;
  totalVendido: number;
}
