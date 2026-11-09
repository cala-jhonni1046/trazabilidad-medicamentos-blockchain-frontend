import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { SessionService } from '../session/session.service';

const PUBLICAS = ['/api/auth/login', '/api/public/', '/api/consulta-publica/'];

/** Rutas de /api que no llevan token: login, portal público y alta pública de reportes. */
export function esRutaPublica(url: string, metodo: string): boolean {
  const ruta = url.split('?')[0];
  if (PUBLICAS.some((p) => ruta === p || ruta.startsWith(p))) return true;
  return metodo === 'POST' && ruta === '/api/reportes-ciudadanos';
}

/**
 * Agrega Authorization: Bearer a los pedidos a /api. Ante 401 cierra la sesión y vuelve al login;
 * ante 403 avisa que falta permiso sin cerrar la sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const esApi = req.url.startsWith('/api/');
  const publica = esApi && esRutaPublica(req.url, req.method);
  const token = session.token();

  const salida = esApi && !publica && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(salida).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && esApi && !publica) {
        if (err.status === 401 && session.isAuthenticated()) {
          const returnUrl = router.url && !router.url.startsWith('/login') ? router.url : undefined;
          session.cerrarSesion('Tu sesión venció. Ingresá de nuevo.');
          router.navigate(['/login'], returnUrl ? { queryParams: { returnUrl } } : {});
        } else if (err.status === 403) {
          snackBar.open('No tenés permiso para esta acción.', 'Cerrar', { duration: 5000 });
        }
      }
      return throwError(() => err);
    }),
  );
};
