# Economía Fantasy — diseño de fase 1

**Estado: prototipo de reglas, sin activación en producción.** No se han añadido tablas, RLS, pantallas ni validaciones al endpoint actual. El XI existente funciona como antes.

## Modelo elegido

- Sin mercado de compra/venta: cada jornada se seleccionan 11 jugadores del equipo de la liga bajo un presupuesto.
- Presupuesto por **usuario y liga**, independiente de otras ligas. Comienza con **100 créditos** en la primera jornada que adopte la economía.
- **Precios globales por jugador**: iguales en todas las ligas. Se calculan con puntos Fantasy globales de jugador/partido, nunca por puntos de una liga.
- El usuario no paga por alinear: los créditos son un **límite de coste** que no se consume. El próximo XI se puede rehacer.
- No se cambian ni los puntos Fantasy ni las reglas de votación, permisos, capitán o bloqueo de XI.

## Precios iniciales (primer día de activación)

El cálculo utiliza hasta las últimas **3 puntuaciones definitivas** de cada jugador, ordenadas por partido. Los partidos sin puntuación válida no cuentan.

| Media Fantasy histórica | Precio inicial |
|---|---:|
| Sin histórico | 8 |
| Hasta 0 | 5 |
| Más de 0 y hasta 3 | 7 |
| Más de 3 y hasta 5 | 9 |
| Más de 5 y hasta 7 | 11 |
| Más de 7 y hasta 9 | 13 |
| Más de 9 | 15 |

Si los precios iniciales generan equipos imposibles de alinear por menos de 100 créditos (en especial plantillas pequeñas), se necesitará un análisis previo con datos reales y calibración **antes** de activar el sistema.

## Ajuste de precio tras cada jornada definitiva

Se toma la puntuación Fantasy definitiva del futbolista y la **media de los jugadores puntuados de su mismo equipo/partido**:

| Diferencia respecto de la media | Movimiento |
|---|---:|
| +4 o más | +2 |
| +2 a menos de +4 | +1 |
| Entre -2 y +2 (sin incluir los extremos) | 0 |
| -2 a más de -4 | -1 |
| -4 o menos | -2 |

- Precio mínimo: **4**, máximo: **18** créditos.
- Sin puntuación válida, el precio permanece sin cambios.
- Los precios deben actualizarse **una sola vez por partido cerrado**, de forma atómica y reproducible.
- La siguiente jornada debe usar una **instantánea de precios** congelada antes de abrir la preparación de XI. Los precios posteriores no alteran la validez de alineaciones anteriores.

## Evolución del presupuesto

Presupuesto inicial **100**; máximo absoluto **120**.

Al cerrar la jornada de cada usuario y liga:
- 0 a 19 puntos: +0 créditos.
- 20 a 39 puntos: +1 crédito.
- 40 o más: +2 créditos (límite de incremento por jornada).
- Una puntuación negativa no resta presupuesto; una jornada pendiente tampoco suma.
- Se debe registrar una única concesión por **liga + usuario + partido**. Un XI ausente no recibe una bonificación por error.
- La misma puntuación global puede alimentar varias ligas, pero el presupuesto de cada usuario **no se comparte** entre ligas.

Este límite es deliberadamente pequeño para limitar el efecto acumulativo de los primeros clasificados.

## Validación de un XI

La validación de presupuesto es **adicional** a `validateFantasyLineup` (11 jugadores, posiciones, duplicados). El coste debe ser menor o igual al presupuesto disponible. El servidor debe obtener los precios **desde la instantánea almacenada**, nunca aceptar precios enviados por el navegador. Las comprobaciones deben hacerse de nuevo en el backend incluso si el frontend deshabilita botones.

La futura persistencia debe impedir escrituras parciales o duplicadas cuando dos peticiones intenten guardar el mismo XI; un procedimiento transaccional en PostgreSQL es preferible a varias escrituras independientes.

## Activación gradual (pendiente de desarrollo)

1. Simular precios y costes con datos de partidos definitivos de producción **sin escribir en tablas reales**.
2. Validar que existe al menos un XI posible por equipo y jornada; calibrar presupuesto/precios con esas cifras.
3. Crear migraciones con precios globales, snapshots por partido y presupuesto por usuario/liga con historial de movimientos e idempotencia.
4. Introducir validación del presupuesto exclusivamente para nuevas jornadas, detrás de un flag de activación; no invalidar alineaciones ni resultados anteriores.
5. Mostrar saldo, coste del XI y precios en Mi XI. Prueba de permisos y concurrencia; `npm.cmd run typecheck`, `npm.cmd run test:fantasy`, `npm.cmd run test:fantasy-points`, `npm.cmd run test:fantasy-economy --workspace=@regional-fantasy/shared`.

Estas cifras son **parámetros iniciales propuestos**, no una economía calibrada con datos reales.
