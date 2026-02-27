import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ModalEmpresaComponent } from './modal-empresa.component';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RoleService } from '../../../../services/config/role.service';
import { ConsultaService } from '../../../../services/auxiliar/consulta.service';
import { provideRouter } from '@angular/router';

describe('ModalEmpresaComponent', () => {
    let component: ModalEmpresaComponent;
    let fixture: ComponentFixture<ModalEmpresaComponent>;

    // Mocks de servicios
    const mockRoleService = {
        getAllRoles: () => of([{ id: 'ROLE-123', name: 'ADMIN_RESTAURANTE' }])
    };

    const mockConsultaService = {
        consultaRuc: jasmine.createSpy('consultaRuc').and.returnValue(of({ razon_social: 'TEST SA', direccion: 'CALLE TEST' })),
        consultaDni: jasmine.createSpy('consultaDni').and.returnValue(of({ first_name: 'JUAN', first_last_name: 'PEREZ', second_last_name: 'SOTO' }))
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ModalEmpresaComponent, ReactiveFormsModule],
            providers: [
                { provide: RoleService, useValue: mockRoleService },
                { provide: ConsultaService, useValue: mockConsultaService },
                // AÑADE ESTO:
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ModalEmpresaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // --- LOS TESTS DE QA ---

    it('debería inicializar el formulario con valores por defecto', () => {
        expect(component.wizardForm.get('sucursal.nombre')?.value).toBe('Sede Principal');
        expect(component.wizardForm.get('user.tipoDocumento')?.value).toBe('DNI');
    });

    it('debería validar que el RUC tenga exactamente 11 dígitos', () => {
        const rucControl = component.wizardForm.get('empresa.ruc');
        rucControl?.setValue('123');
        expect(rucControl?.valid).toBeFalse();

        rucControl?.setValue('20123456789');
        expect(rucControl?.valid).toBeTrue();
    });

    it('debería transformar los nombres a MAYÚSCULAS antes de emitir (Regla de Oro)', () => {
        spyOn(component.onComplete, 'emit');

        // Llenamos datos mínimos en minúsculas
        component.wizardForm.patchValue({
            empresa: { ruc: '20123456789', razonSocial: 'mi empresa sa', direccionFiscal: 'jr test', email: 'e@e.com', telefono: '999999999' },
            sucursal: { nombre: 'Sede', direccion: 'Dir', telefono: '999999999' },
            user: { username: 'admin', password: 'password', role: 'ID', nombres: 'juan', apellidoPaterno: 'perez', apellidoMaterno: 'soto', numeroDocumento: '12345678', telefono: '987654321', email: 'j@j.com' }
        });

        component.saveAll();

        // Verificamos que el objeto emitido tenga las mayúsculas aplicadas por nuestra función formatDataToUppercase
        const emittedData = (component.onComplete.emit as jasmine.Spy).calls.mostRecent().args[0].data;

        expect(emittedData.empresa.razonSocial).toBe('MI EMPRESA SA');
        expect(emittedData.user.nombres).toBe('JUAN');
    });

    it('debería bloquear el avance al siguiente paso si el grupo actual es inválido', () => {
        component.currentStep.set(0);
        component.wizardForm.get('empresa.ruc')?.setValue('123'); // Inválido

        component.nextStep();

        expect(component.currentStep()).toBe(0); // No avanzó
    });

    it('debería autocompletar datos de empresa al consultar RUC exitosamente', fakeAsync(() => {
        component.wizardForm.get('empresa.ruc')?.setValue('20123456789');
        component.consultarRuc();

        tick(); // Simula el paso del tiempo para el observable

        expect(component.wizardForm.get('empresa.razonSocial')?.value).toBe('TEST SA');
        expect(component.searchingRuc()).toBeFalse();
    }));
});