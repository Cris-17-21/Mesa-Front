import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../core/environment/environment';
import { SuperAdminDashboard } from '../../models/dashboard/superadmin-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private API_URL = `${environment.apiUrl}/dashboard/superadmin`;

  constructor(private http: HttpClient) {}

  getSuperAdminData(): Observable<SuperAdminDashboard> {
    return this.http.get<SuperAdminDashboard>(this.API_URL);
  }
}
