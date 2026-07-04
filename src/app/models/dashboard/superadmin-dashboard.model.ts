export interface EmpresaUserStats {
  id: string;
  ruc: string;
  razonSocial: string;
  email: string;
  telefono: string;
  cantidadUsuarios: number;
  cantidadSucursales: number;
}

export interface SuperAdminDashboard {
  totalEmpresas: number;
  empresasActivas: number;
  empresasInactivas: number;
  totalSucursales: number;
  totalUsuarios: number;
  empresasStats: EmpresaUserStats[];
}
