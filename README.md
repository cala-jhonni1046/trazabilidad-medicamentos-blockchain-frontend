# 🏥 MediChain - Plataforma Operativa de Trazabilidad e Inmutabilidad

Este repositorio contiene el prototipo funcional (Frontend/Maqueta Interactiva) del sistema de trazabilidad de medicamentos apoyado en tecnología Blockchain y Telemetría IoT.

🔗 **Ver Prototipo en Vivo (Netlify):** zingy-pony-a70463.netlify.app

---

## 📋 Instrucciones para Probar el Prototipo

El sistema está diseñado basándose en un diagrama de clases estructurado por roles. Para evaluar el ciclo de vida completo de un medicamento, en la pantalla de inicio (Login) selecciona los diferentes roles en el siguiente orden lógico:

### 1. Rol: SUPERADMIN (Sede Central)
* **Crear Usuarios y Roles:** Simula el alta de nuevas entidades (Laboratorios, Logísticas, Farmacias) en la red blockchain asignándoles sus respectivos CUITs.
* **Crear Cadena Trazable:** Genera un nuevo trinomio comercial (Enlace CUIT) vinculando a un Laboratorio, un Transporte y una Farmacia. Al crearlo, se dispara una notificación al Inspector ANMAT designado.
* **Alta de Inspectores:** Registra a los fiscalizadores que tendrán poder de firma digital.

### 2. Rol: ANMAT (Autoridad Sanitaria)
* **Solicitudes Pendientes:** Aquí el inspector recibe y aprueba las cadenas trazables (Enlace CUIT) creadas previamente por el SuperAdmin o los laboratorios.
* **Panel de Cuarentenas:** Dashboard donde los lotes que rompen la cadena de frío (reportados por sensores IoT) se bloquean automáticamente. El inspector tiene la potestad de auditar y "Liberar" o "Mantener" la cuarentena.
* **Auditoría Global:** Permite auditar la inmutabilidad criptográfica de lotes enteros o códigos QR individuales escaneados por los pacientes.

### 3. Rol: LABORATORIO (Fabricante)
* **Crear Lote y Enlazar CUITs:** Emite un nuevo lote masivo (ej. Insulina), definiendo la temperatura exigida (ej. 2°C a 8°C), y lo despacha asignando la patente del camión. Esto genera automáticamente los IDs únicos (QR) para cada caja.

### 4. Rol: DISTRIBUIDOR (Logística)
* **Verificar QR Bulto:** Simula el momento en que el transportista asume la custodia legal de la carga, estampando la fecha y hora en el sistema.
* **Mapa GPS Telemetría:** Permite visualizar cómo los sensores IoT de la flota transmiten coordenadas y lecturas térmicas en tiempo real al backend.

### 5. Rol: FARMACIA (Recepción y Venta)
* **Recepcionar Carga:** La farmacia escanea el lote al llegar. Si el lote está en "Cuarentena" por falla térmica en ruta, el sistema bloquea su ingreso al inventario.
* **Dispensar / Venta por DNI:** Simula la venta unitaria de una caja, vinculando el QR del medicamento al DNI del paciente, cerrando su ciclo útil para evitar reventas.

### 6. Rol: PACIENTE (Portal Ciudadano)
* **Verificar Autenticidad:** Permite a un consumidor final ingresar el código QR de su caja. Si todo es correcto, se le muestra la garantía de cadena de frío. Si el lote fue inmovilizado, salta una alerta roja.
* **Reportes Ciudadanos:** Formulario directo para que el paciente denuncie cajas dañadas o sospechas de falsificación, lo cual impacta directamente en el panel de la ANMAT.
