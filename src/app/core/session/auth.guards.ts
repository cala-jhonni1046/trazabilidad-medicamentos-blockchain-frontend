import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService, RolUsuario } from './session.service';
import { getRoleHome } from '../navigation/role-home';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export function roleGuard(allowedRoles: RolUsuario[]): CanActivateFn {
  return (_route, _state) => {
    const session = inject(SessionService);
    const router = inject(Router);

    if (!session.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const rol = session.rol();
    if (rol && allowedRoles.includes(rol)) {
      return true;
    }

    // Rol no autorizado: redirige al inicio del rol
    return router.createUrlTree([getRoleHome(rol)]);
  };
}
