import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { SessionService } from '../../core/session/session.service';
import { PortalComponent } from './portal.component';

describe('PortalComponent: salida de la sesión', () => {
  beforeEach(async () => {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PortalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations()],
    }).compileComponents();
  });

  it('sin sesión ofrece el acceso del personal autorizado', () => {
    const fixture = TestBed.createComponent(PortalComponent);
    fixture.detectChanges();
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain('Soy personal autorizado');
    expect(txt).not.toContain('Cerrar sesión');
  });

  it('con sesión de paciente muestra Cerrar sesión, la cierra y vuelve al login', () => {
    const session = TestBed.inject(SessionService);
    session.iniciarSesion({ id: 6, email: 'paciente@medichain.demo', rol: 'PACIENTE', activo: true });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PortalComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Cerrar sesión');
    expect(el.textContent).not.toContain('Soy personal autorizado');
    (Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Cerrar sesión')) as HTMLButtonElement).click();
    expect(session.isAuthenticated()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});
