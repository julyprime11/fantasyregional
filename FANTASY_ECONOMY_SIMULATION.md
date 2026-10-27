# Simulación de economía Fantasy — fase 2

**Sin acceso a Supabase y sin activación en producción.** El módulo `packages/shared/src/fantasy-economy-simulation.ts` solo trabaja con datos que se le proporcionan en memoria. Ni los tests ni el simulador escriben en tablas.

## Datos reales necesarios

Para ejecutar una simulación auténtica se requiere preparar un conjunto de datos **sin información identificativa de usuarios**, con:

- Plantillas de jugadores por equipo: ID estable, posición, condición de activo.
- Partidos oficiales ordenados por fecha, estado y equipos participantes.
- **Puntos Fantasy globales definitivos de jugador/partido**, los mismos que ya devuelve `getMatchResults` con fase `final` (`row.fantasy?.points`). No calcular de nuevo ni usar las puntuaciones de una liga para establecer precios globales.
- Miembros y alineaciones por liga, con ID de usuario anonimizado, once elegido y total final **tal y como lo calcula** `getFantasyMatchPoints` (incluye bonus del capitán). No exportar votos individuales ni datos sensibles.
- Para jornadas sin XI o con datos pendientes, distinguir claramente `null` de un resultado real de cero.

**No se han obtenido ni simulado resultados de usuarios reales en esta PR.** Los tests contienen únicamente datos artificiales.

## Reglas de la reproducción

1. El primer partido oficial **cerrado** de cada equipo fija precios de apertura a partir de los puntos globales de ese partido.
2. Los saldos de los participantes se inicializan desde el total de su XI presentado en esa primera jornada; si no existe XI válido o puntuación definitiva, parten de 100.000 €.
3. Los siguientes partidos cerrados se procesan cronológicamente: primero se comprueba el coste del XI con precios y saldo **anteriores** al partido; después se actualizan saldo individual y precios globales según las reglas de `fantasy-economy.ts`.
4. Los partidos `scheduled`, `finished` o `voting` no aportan datos a la economía.
5. Los precios son globales por jugador; los saldos son independientes por miembro y liga.
6. Para detectar la posibilidad de formar XI, el algoritmo busca el **XI de menor coste respetando posiciones**: 1 portero, 3–5 defensas, 3–5 centrocampistas, 1–3 delanteros. No basta con sumar los once futbolistas más baratos.

## Resultado del informe

- Precios de salida evolucionados para cada plantilla; coste y formación del XI más barato.
- Equipos que no tienen XI válido, o cuyo XI más barato supera el suelo de 90.000 €.
- Saldo de apertura y saldo final por miembro; existencia de XI asequible con su saldo.
- Número y detalle de alineaciones históricas que **habrían** superado su presupuesto.
- Resumen de incumplimientos y viabilidad económica.

Estas cifras son contrafactuales: **no invalidan** las alineaciones anteriores. La simulación supone que todos los jugadores activos del equipo están disponibles para elegir; si se requiere limitar por convocatoria, habrá que modelarla antes de activar.

## Uso y validación

Desde PowerShell, con la rama de fase 2 seleccionada:

```powershell
npm.cmd run typecheck
npm.cmd run test:fantasy --workspace=@regional-fantasy/shared
npm.cmd run test:fantasy-points --workspace=@regional-fantasy/shared
npm.cmd run test:fantasy-economy --workspace=@regional-fantasy/shared
npm.cmd run test:fantasy-economy-simulation --workspace=@regional-fantasy/shared
```

La función exportada `simulateFantasyEconomy(input)` devolverá el informe al recibir el conjunto de datos. Falta desarrollar un **adaptador de solo lectura** para datos reales, con verificación de permisos y de la disponibilidad de las valoraciones; no se deben añadir claves de servicio ni credenciales al repositorio.

**La economía sigue completamente desactivada en producción.**
