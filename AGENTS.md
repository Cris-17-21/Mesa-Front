# AGENTS.md - Restaurant Frontend

## Project Overview
Angular 19 restaurant management frontend using PrimeNG, standalone components, signals, and RxJS. Targets restaurant POS, inventory, and purchasing modules.

---

## Commands

### Development
```bash
npm start              # Start dev server
npm run watch          # Build with watch mode
```

### Build
```bash
npm run build          # Production build
npm run build -- --configuration development  # Dev build
```

### Testing
```bash
npm test               # Run all tests (Karma + Jasmine)
ng test --include='**/specific-file.spec.ts'  # Run single test
ng test --watch=false  # Run tests once (CI mode)
```

---

## TypeScript Configuration
- **Strict mode enabled** - all strict checks enforced
- **Target**: ES2022, **Module**: ES2022
- **noImplicitReturns**: true, **noFallthroughCasesInSwitch**: true
- **isolatedModules**: true, **noPropertyAccessFromIndexSignature**: true

---

## Code Style Guidelines

### General Rules
- Use **standalone components** (Angular 19 standard)
- Use **signals** for state (`signal()`, `computed()`, `effect()`)
- Use **inject()** for dependency injection
- Enable **strict templates**
- Avoid `any` - use proper typing

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase + Component suffix | `MesaComponent` |
| Services | PascalCase + Service suffix | `MesaService` |
| Models/Interfaces | PascalCase | `Mesa`, `CreateMesaDto` |
| Directives | PascalCase + Directive suffix | `HasPermissionDirective` |
| Guards | PascalCase + Guard suffix | `AuthGuard` |
| Files | kebab-case | `mesa.service.ts` |
| Variables | camelCase | `mesas`, `pisoSeleccionado` |
| Signals | camelCase | `mesas = signal<Mesa[]>([])` |

### Import Order (strict)
```typescript
// 1. Angular core
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// 2. Third-party (PrimeNG, SweetAlert2)
import { TooltipModule } from 'primeng/tooltip';
import Swal from 'sweetalert2';
// 3. App services
import { MesaService } from '../../../services/maestro/mesa.service';
// 4. App models
import { Mesa } from '../../../models/maestro/mesa.model';
// 5. App components
import { ModalMesaComponent } from './modal-mesa/modal-mesa.component';
```

### Component Structure
```typescript
@Component({
  selector: 'app-name',
  standalone: true,
  imports: [CommonModule, TooltipModule, FormsModule],
  templateUrl: './name.component.html',
  styleUrls: ['./name.component.css']
})
export class NameComponent implements OnInit {
  private service = inject(ServiceName);
  items = signal<Item[]>([]);
  filteredItems = computed(() => this.items());
  displayModal = false;

  get someValue(): string { return 'value'; }

  ngOnInit(): void { this.loadData(); }

  onSearch(event: Event): void { }

  private loadData(): void {
    this.service.getData().subscribe({
      next: (data) => this.items.set(data),
      error: (err) => {
        console.error('Error:', err);
        Swal.fire({ title: 'Error', text: 'Failed', icon: 'error' });
      }
    });
  }
}
```

### Service Structure
```typescript
@Injectable({ providedIn: 'root' })
export class ServiceName {
  private API_URL = `${environment.apiUrl}/resource`;

  constructor(private http: HttpClient) { }

  getData(): Observable<Type[]> {
    return this.http.get<Type[]>(this.API_URL);
  }
}
```

### Model Structure
```typescript
export interface Entity {
  id: string;
  name: string;
}

export type CreateEntityDto = Omit<Entity, 'id'>;
export type UpdateEntityDto = Partial<CreateEntityDto>;
```

### Error Handling
- Use `.subscribe({ next: ..., error: ... })` pattern
- Use SweetAlert2 (`Swal`) for user-facing errors
- Log errors to console for debugging

### Template Guidelines
- Use `*ngIf` with `else` for conditionals
- Use `*ngFor` with trackBy for lists
- Use Safe Navigation Operator (`?.`)
- Use `[disabled]` and `(click)` for bindings

### HTTP Patterns
- Use `HttpClient` with proper typing
- Use `environment.apiUrl` for API base
- Return `Observable<T>` from service methods

### Permissions
- Use `HasPermissionDirective` for permission-based UI
- Guard routes with `AuthGuard` and `PermissionGuard`

### File Organization
```
src/app/
├── core/auth/          # Auth service, guards, interceptors
├── core/directives/    # Shared directives
├── core/environment/   # Environment config
├── models/maestro/     # TypeScript interfaces
├── models/venta/
├── models/compra/
├── services/maestro/   # API services
├── services/venta/
└── pages/              # Feature pages
    ├── auth/
    ├── config/
    ├── maestro/
    ├── venta/
    └── compras/
```

---

## Environment
- Node.js: Check `package.json`
- API URL: `src/app/core/environment/environment.ts`
