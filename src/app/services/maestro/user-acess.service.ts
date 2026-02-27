import { Injectable } from '@angular/core';
import { environment } from '../../core/environment/environment';
import { HttpClient } from '@angular/common/http';
import { CreateCompleteRestaurantDto } from '../../models/maestro/userAccess.model';
import { Observable } from 'rxjs';
import { Empresa } from '../../models/maestro/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class UserAcessService {

  private API_URL = `${environment.apiUrl}/auth`

  constructor(
    private http: HttpClient
  ) { }

  registerCompleteRestaurant(data: CreateCompleteRestaurantDto): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.API_URL}/register-enterprise`, data);
  }
}
