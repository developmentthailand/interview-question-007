import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  code: string;
  createdAtUtc: string;
}

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }

  create(code: string): Observable<Product> {
    return this.http.post<Product>('/api/products', { code });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/products/${id}`);
  }
}
