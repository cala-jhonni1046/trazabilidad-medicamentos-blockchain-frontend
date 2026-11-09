import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsuariosApiService } from './usuarios-api.service';

describe('UsuariosApiService', () => {
  let api: UsuariosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UsuariosApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista usuarios con GET /api/usuarios', () => {
    api.listar().subscribe((r) => expect(r.length).toBe(1));
    const req = http.expectOne('/api/usuarios');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, email: 'a@medichain.demo', rol: 'ANMAT', activo: true }]);
  });

  it('crea un usuario con POST y solo email, rol y activo', () => {
    api.crear({ email: 'a@medichain.demo', rol: 'ANMAT', activo: true }).subscribe();
    const req = http.expectOne('/api/usuarios');
    expect(req.request.method).toBe('POST');
    expect(Object.keys(req.request.body as object).sort()).toEqual(['activo', 'email', 'rol']);
    req.flush({ id: 2, email: 'a@medichain.demo', rol: 'ANMAT', activo: true });
  });

  it('activa, desactiva y elimina con los verbos del contrato', () => {
    api.activar(5).subscribe();
    expect(http.expectOne('/api/usuarios/5/activar').request.method).toBe('PATCH');
    api.desactivar(5).subscribe();
    expect(http.expectOne('/api/usuarios/5/desactivar').request.method).toBe('PATCH');
    api.eliminar(5).subscribe();
    expect(http.expectOne('/api/usuarios/5').request.method).toBe('DELETE');
  });

  it('cambia la contraseña con PUT reenviando email, rol y organización', () => {
    api
      .cambiarPassword(
        { id: 7, email: 'lab@medichain.demo', rol: 'LABORATORIO', activo: true, organizacionId: 10 },
        'NuevaClave1',
      )
      .subscribe();
    const req = http.expectOne('/api/usuarios/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      email: 'lab@medichain.demo',
      rol: 'LABORATORIO',
      password: 'NuevaClave1',
      organizacionId: 10,
    });
  });

  it('al cambiar la contraseña de un usuario sin organización no envía organizacionId', () => {
    api.cambiarPassword({ id: 2, email: 'i@medichain.demo', rol: 'ANMAT', activo: true }, 'NuevaClave1').subscribe();
    expect(http.expectOne('/api/usuarios/2').request.body).toEqual({
      email: 'i@medichain.demo',
      rol: 'ANMAT',
      password: 'NuevaClave1',
    });
  });
});
