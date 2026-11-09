import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { SessionService } from '../../core/session/session.service';
import { getRoleHome } from '../../core/navigation/role-home';
import { mensajeApi } from '../../core/http/api-error';
import { LoginApiService } from './login-api.service';

export interface LoginFormControls {
  email: FormControl<string>;
  password: FormControl<string>;
}

/** Mensaje que ve la persona según lo que respondió el backend al intentar ingresar. */
export function mensajeLogin(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 429) {
      return 'Demasiados intentos fallidos. Esperá unos minutos y volvé a intentar.';
    }
    if (err.status === 401) {
      return 'Correo o contraseña incorrectos.';
    }
  }
  return mensajeApi(err);
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LoginApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  readonly isDarkMode = signal(false);
  readonly enviando = signal(false);
  readonly errorLogin = signal<string | null>(null);
  /** Aviso previo al login, por ejemplo "Tu sesión venció". */
  readonly aviso = this.session.aviso;

  readonly loginForm: FormGroup<LoginFormControls> = this.fb.group({
    email: this.fb.nonNullable.control('', [Validators.required]),
    password: this.fb.nonNullable.control('', [Validators.required]),
  });

  ngOnInit(): void {
    if (this.session.isAuthenticated()) {
      this.router.navigate([getRoleHome(this.session.rol())]);
      return;
    }
    this.loginForm.valueChanges.subscribe(() => this.errorLogin.set(null));
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('dark-theme');
  }

  toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    this.document.body.classList.toggle('dark-theme', next);
  }

  onSubmit(): void {
    if (this.enviando()) return;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorLogin.set('Ingresá tu correo y tu contraseña.');
      return;
    }

    const raw = this.loginForm.getRawValue();
    this.errorLogin.set(null);
    this.enviando.set(true);

    this.api.login({ email: raw.email.trim(), password: raw.password }).subscribe({
      next: (respuesta) => {
        this.session.iniciarDesdeRespuesta(respuesta);
        this.enviando.set(false);
        this.irAlInicio(respuesta.usuario.rol);
      },
      error: (err: unknown) => {
        this.enviando.set(false);
        this.errorLogin.set(mensajeLogin(err));
      },
    });
  }

  private irAlInicio(rol: Parameters<typeof getRoleHome>[0]): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && returnUrl !== '/login') {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate([getRoleHome(rol)]);
    }
  }
}
