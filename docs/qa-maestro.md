# Guía QA: escenarios de Lúmina con Maestro

Esta guía sirve para ejecutar, a mano o con un agente, los escenarios de `docs/escenarios.feature` contra la app móvil usando [Maestro](https://maestro.mobile.dev).

Cada escenario es independiente. Antes de lanzarlo, la API vuelve al estado de demostración. El flow de Maestro no prepara datos: solo recorre la pantalla.

## Estado de demostración

Al arrancar la API, y cada vez que se llama `POST /dev/reset`, la agenda queda así. Las fechas no están fijas: el primer día hábil es el próximo día de lunes a sábado, hora de Ciudad de México. El domingo no se ofrece.

| Id | Quién | Servicio | Cuándo | Estado |
| --- | --- | --- | --- | --- |
| `apt-sofia-pending` | Sofía Ruiz | Manicure clásico (45 min) | Primer día hábil, 10:00 | Pendiente |
| `apt-camila-confirmed` | Camila Ortiz | Nail art (90 min) | Primer día hábil, 16:00 | Confirmada |
| `apt-elena-pending` | Elena Díaz | Retiro y cuidado (30 min) | Segundo día hábil, 13:00 | Pendiente |
| `apt-ana-pending` | Ana Gómez | Gel semipermanente (70 min) | Tercer día hábil, 11:00 | Pendiente |

Por eso, en manicure del primer día, las 10:00 salen ocupadas y las 11:00 siguen libres: el manicure de Sofía termina a las 10:45. Esa pareja de horarios es el corazón de CLI-02 y CLI-03. No cambies la semilla sin cambiar el Gherkin y los flows.

Cuentas que la app muestra en el acceso:

| Persona | Correo | Rol | Cómo entra el flow |
| --- | --- | --- | --- |
| Ana Gómez | ana@lumina.app | cliente | `demo-client` |
| Lucía Navarro | lucia@lumina.app | profesional | `demo-professional` |

Sofía, Camila y Elena existen para que la agenda de Lucía tenga citas. No tienen tarjeta en el acceso.

## Qué tiene que estar corriendo

1. API en `http://localhost:8787` (`npm start` dentro de `api`).
2. Un build de desarrollo instalado en el emulador o dispositivo, con application id `com.lumina.booking`. Expo Go no sirve: su id es `host.exp.exponent` y estos flows no lo abren.
3. El bundle de la app apuntando a la API. En el emulador de Android el localhost de la máquina es `10.0.2.2`:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://10.0.2.2:8787"
npx expo run:android
```

En un simulador de iOS, `http://localhost:8787` alcanza. La variable se lee al construir el bundle.

Maestro se instala siguiendo https://maestro.mobile.dev/getting-started/installing-maestro. Comprueba con `maestro --version`.

## Reiniciar antes de cada escenario

Desde la raíz del proyecto, con la API ya levantada:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8787/dev/reset
```

Eso borra sesiones y citas creadas durante la prueba anterior, y vuelve a insertar las cuatro citas de la tabla. Si omites el reinicio, CLI-02 puede encontrar las 11:00 ocupadas por una corrida previa y el flow falla aunque la app esté bien.

Para correr los doce flows, cada uno con su reinicio:

```powershell
./scripts/e2e.ps1
```

Un solo escenario:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8787/dev/reset
maestro test maestro/cli-02-reservar.yaml
```

Maestro trata el texto visible como expresión regular. Por eso los flows buscan "45 min" o un `id`, y no el precio `Q280`.

## Cómo leer un flow

Los selectores salen de `testID` en la app. En web ese mismo valor queda en `data-testid`, útil para inspeccionar, pero la corrida oficial es el emulador.

Ejemplo, CLI-03, horario ocupado:

1. `launchApp` con `clearState` abre Lúmina sin sesión previa.
2. `demo-client` entra como Ana.
3. `service-svc-manicure` abre el servicio.
4. `date-0` es el primer día hábil. `slot-1000` es las 10:00.
5. La app no selecciona ese hueco. Muestra "Ese horario ya está ocupado."
6. `confirm-booking` sigue con `enabled: false` porque no hay un hueco elegido.

Si el paso 6 pasa y el aviso se ve, el escenario del Gherkin está cubierto. Si `slot-1000` no aparece, la agenda no está en el estado de demostración o la API no es la que está usando la app.

## Mapa de escenarios

| Escenario | Flow | Qué hace | Resultado que debe verse |
| --- | --- | --- | --- |
| AUTH-01 | `maestro/auth-01-cliente.yaml` | Ana pulsa "Quiero una cita" | "Hola, Ana" y el manicure en catálogo |
| AUTH-02 | `maestro/auth-02-profesional.yaml` | Lucía pulsa "Ver mi agenda" | "Agenda de Lucía" y las cuatro clientas |
| AUTH-03 | `maestro/auth-03-correo-invalido.yaml` | Escribe `nadie@lumina.app` y pulsa Entrar | El aviso de correo desconocido y sigue en el acceso |
| CLI-01 | `maestro/cli-01-catalogo.yaml` | Ana mira el menú | Los cuatro servicios, sus minutos y el horario del estudio |
| CLI-02 | `maestro/cli-02-reservar.yaml` | Manicure, día 0, 11:00, confirmar | "Cita reservada" y el manicure pendiente en Mis citas |
| CLI-03 | `maestro/cli-03-horario-ocupado.yaml` | Manicure, día 0, 10:00 | Aviso de horario ocupado y confirmar desactivado |
| CLI-04 | `maestro/cli-04-mis-citas.yaml` | Abre Mis citas | El gel de Ana pendiente. No aparecen Sofía, Camila ni Elena |
| CLI-05 | `maestro/cli-05-cancelar.yaml` | Cancela `apt-ana-pending` | Estado "Cancelada" y desaparece "Cancelar cita" |
| PRO-01 | `maestro/pro-01-agenda.yaml` | Lucía abre la agenda | Sofía y Elena y Ana por confirmar. Camila confirmada |
| PRO-02 | `maestro/pro-02-confirmar.yaml` | Confirma a Sofía | Su estado pasa a "Confirmada" y se va el botón Confirmar |
| PRO-03 | `maestro/pro-03-completar.yaml` | Completa a Camila | Estado "Completada" dentro de Historial |
| PRO-04 | `maestro/pro-04-cancelar.yaml` | Cancela a Elena | Estado "Cancelada" dentro de Historial |

Los ids estables de la semilla (`apt-sofia-pending`, `svc-manicure`, `slot-1100`, `date-0`) son el contrato entre el Gherkin y Maestro. Una cita nueva, como el manicure de CLI-02, no tiene id fijo: ahí se afirma el texto "Cita reservada" y "Manicure clásico".

## Si un flow falla

- La API no responde: el acceso muestra "No hay conexión con el estudio". Revisa el puerto 8787 y `EXPO_PUBLIC_API_URL`. En Android, `localhost` dentro del emulador no es tu máquina.
- Las 11:00 salen ocupadas en CLI-02: faltó el `POST /dev/reset`, o alguien cambió la semilla.
- Maestro no encuentra `demo-client`: la app instalada no es este proyecto, o el id de aplicación no es `com.lumina.booking`.
- Un texto con `$` o `.` no coincide como esperabas: Maestro usa regex. Afirma por `id` o escapa el carácter.
- El dominio (quién puede confirmar, el choque de horarios, el reinicio) también está cubierto sin emulador por `npm test` dentro de `api`. Eso no reemplaza a Maestro: no abre la app. Sirve para saber si el fallo está en la pantalla o en la API.
