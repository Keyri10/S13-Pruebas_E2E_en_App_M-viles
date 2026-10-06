# language: es
Característica: Reservar y atender citas en Lúmina
  Lúmina es un estudio de uñas en la Roma Norte.
  Una cliente reserva un servicio. La nail artist ve esa cita y la mueve de estado.
  El estudio abre de lunes a sábado, de 10:00 a 18:00, hora de Ciudad de México.
  Cada escenario empieza con la agenda de demostración, sin citas creadas durante la prueba anterior.

  Antecedentes:
    Dado que la agenda vuelve al estado de demostración
    Y existen estas cuentas
      | nombre        | correo             | rol          |
      | Ana Gómez     | ana@lumina.app     | cliente      |
      | Lucía Navarro | lucia@lumina.app   | profesional  |
    Y Lucía ofrece "Manicure clásico", "Gel semipermanente", "Nail art" y "Retiro y cuidado"
    Y el primer día hábil a las 10:00 Sofía Ruiz tiene un manicure pendiente
    Y ese mismo día a las 16:00 Camila Ortiz tiene un nail art confirmado
    Y el segundo día hábil a las 13:00 Elena Díaz tiene un retiro pendiente
    Y el tercer día hábil a las 11:00 Ana Gómez tiene un gel pendiente

  @auth @cliente
  Escenario: AUTH-01 La cliente entra con su cuenta de demostración
    Cuando Ana elige "Quiero una cita"
    Entonces ve "Hola, Ana"
    Y permanece en el catálogo de servicios

  @auth @profesional
  Escenario: AUTH-02 La profesional entra a su agenda
    Cuando Lucía elige "Ver mi agenda"
    Entonces ve "Agenda de Lucía"
    Y ve las citas de Sofía, Camila, Elena y Ana

  @auth
  Escenario: AUTH-03 Un correo desconocido no entra
    Cuando alguien escribe "nadie@lumina.app" y pulsa "Entrar"
    Entonces ve "No encontramos una cuenta con ese correo."
    Y sigue en la pantalla de acceso

  @cliente
  Escenario: CLI-01 La cliente consulta el catálogo
    Dado que Ana ha entrado
    Entonces ve "Manicure clásico", "Gel semipermanente", "Nail art" y "Retiro y cuidado"
    Y ve la duración y el precio de cada servicio
    Y ve que Lucía atiende de lunes a sábado, de 10:00 a 18:00

  @cliente
  Escenario: CLI-02 La cliente reserva el primer hueco libre
    Dado que Ana ha entrado
    Cuando abre "Manicure clásico"
    Y elige el primer día hábil
    Y elige las 11:00
    Y confirma la cita
    Entonces ve "Cita reservada"
    Y al abrir "Mis citas" ve ese manicure como "Pendiente"

  @cliente
  Escenario: CLI-03 Un horario ocupado no se puede reservar
    Dado que Ana ha entrado
    Cuando abre "Manicure clásico" en el primer día hábil
    Y toca las 10:00
    Entonces ve "Ese horario ya está ocupado."
    Y "Confirmar cita" permanece desactivado

  @cliente
  Escenario: CLI-04 La cliente consulta sus citas
    Dado que Ana ha entrado
    Cuando abre "Mis citas"
    Entonces ve su "Gel semipermanente" en estado "Pendiente"
    Y no ve las citas de Sofía, Camila ni Elena

  @cliente
  Escenario: CLI-05 La cliente cancela su cita pendiente
    Dado que Ana ha entrado en "Mis citas"
    Cuando cancela su gel pendiente
    Entonces esa cita pasa a "Cancelada"
    Y ya no ofrece "Cancelar cita" para esa reserva

  @profesional
  Escenario: PRO-01 La profesional revisa lo que llega al estudio
    Dado que Lucía ha entrado
    Entonces ve a Sofía Ruiz en "Por confirmar"
    Y ve a Camila Ortiz en "Confirmadas"
    Y ve a Elena Díaz y a Ana Gómez entre las pendientes

  @profesional
  Escenario: PRO-02 La profesional confirma una cita pendiente
    Dado que Lucía ha entrado
    Cuando confirma la cita de Sofía Ruiz
    Entonces esa cita pasa a "Confirmada"
    Y deja de mostrarse en "Por confirmar"

  @profesional
  Escenario: PRO-03 La profesional completa una cita confirmada
    Dado que Lucía ha entrado
    Cuando marca como completada la cita de Camila Ortiz
    Entonces esa cita pasa a "Completada"
    Y aparece en "Historial"

  @profesional
  Escenario: PRO-04 La profesional cancela una cita pendiente
    Dado que Lucía ha entrado
    Cuando cancela la cita de Elena Díaz
    Entonces esa cita pasa a "Cancelada"
    Y aparece en "Historial"
