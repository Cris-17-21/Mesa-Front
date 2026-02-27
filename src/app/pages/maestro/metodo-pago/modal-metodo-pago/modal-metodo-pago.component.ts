import { Component, inject, OnChanges, OnInit, signal } from '@angular/core';
import Swal from 'sweetalert2';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MetodoPagoService } from '../../../../services/maestro/metodo-pago.service';

@Component({
  selector: 'app-modal-metodo-pago',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './modal-metodo-pago.component.html',
  styleUrl: './modal-metodo-pago.component.css'
})
export class ModalMetodoPagoComponent implements OnInit, OnChanges {

  private fb = inject(FormBuilder);
  private metodoPagoService = inject(MetodoPagoService);

  metodoPagoForm: FormGroup;
  loading = signal(false);

  constructor() {
    this.metodoPagoForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      moduleId: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  ngOnChanges(): void {
    throw new Error('Method not implemented.');
  }
}
