# Lúmina

App para reservar citas en un estudio de uñas y para que la nail artist atienda esa agenda.

- Cliente: Ana Gómez elige servicio, día y hora.
- Profesional: Lucía Navarro confirma, completa o cancela.
- API: Hono, SQLite, Zod y Effect.
- Escenarios: `docs/escenarios.feature`.
- Cómo probarlos con Maestro: `docs/qa-maestro.md`.
- Cada escenario con su captura: `artifacts/escenarios.html`.
- Lectura técnica: `artifacts/tecnico.html`.

## Arranque

```powershell
cd api
npm install
npm start
```

En otra terminal:

```powershell
cd mobile
npm install
npx expo start --web
```

La app web habla con `http://localhost:8787`. En el emulador Android usa `EXPO_PUBLIC_API_URL=http://10.0.2.2:8787` antes de levantar Expo.

## Pruebas

```powershell
cd api
npm test
```

Los flujos de Maestro están en `maestro/`. La corrida completa, con reinicio de la agenda antes de cada escenario, es `./scripts/e2e.ps1` desde la raíz. Hace falta un build con id `com.lumina.booking` y Maestro instalado. El detalle está en la guía QA.
