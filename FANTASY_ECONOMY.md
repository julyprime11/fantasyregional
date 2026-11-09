# Economía Fantasy — diseño de fase 1

**Estado: prototipo de reglas, sin activación en producción.** No se han añadido tablas, RLS, pantallas ni validaciones al endpoint actual. El XI existente funciona como antes.

Los importes son **euros ficticios del juego**, sin dinero real, transferencias, compras ni venta de jugadores. Los cálculos utilizan euros enteros, sin céntimos.

## Modelo elegido

- Sin mercado de compra/venta: cada jornada se seleccionan 11 jugadores del equipo de la liga bajo un presupuesto.
- Presupuesto por **usuario y liga**, independiente de otras ligas. Comienza con **100.000 €** en la primera jornada que adopte la economía.
- **Precios globales por jugador**: iguales en todas las ligas. Se calculan con puntos Fantasy globales de jugador/partido, nunca por puntos de una liga.
- El usuario no paga por alinear: el saldo en euros ficticios es un **límite de coste** que no se consume. El próximo XI se puede rehacer.
- No se cambian ni los puntos Fantasy ni las reglas de votación, permisos, capitán o bloqueo de XI.

## Precios de apertura: primera jornada oficial

Los futbolistas **ya arrancan con precios distintos** usando sus puntos Fantasy globales definitivos de la **primera jornada oficial**. No se aplicará sobre esa misma jornada una segunda subida o bajada: quedaría contabilizada dos veces.

| Puntos Fantasy del primer partido | Precio inicial |
|---|---:|
| Sin puntuación definitiva | 8.000 € |
| 0 o menos | 5.000 € |
| Más de 0 hasta 3 | 7.000 € |
| Más de 3 hasta 5 | 9.000 € |
| Más de 5 hasta 7 | 11.000 € |
| Más de 7 hasta 9 | 13.000 € |
| Más de 9 | 15.000 € |

La selección del partido debe ser cronológica, por jugador, utilizando solo partidos oficiales cerrados. Es obligatorio distinguir los jugadores que no participaron de quienes puntuaron cero o negativo. **Antes de activar, simularemos con datos reales** para garantizar al menos un XI válido por equipo bajo presupuesto.

## Ajuste de precio tras cada jornada definitiva

Se toma la puntuación Fantasy definitiva del futbolista y la **media de los jugadores puntuados de su mismo equipo/partido**:

| Diferencia respecto de la media | Movimiento |
|---|---:|
| +4 o más | +2.000 € |
| +2 a menos de +4 | +1.000 € |
| Entre -2 y +2 (sin incluir los extremos) | Sin cambio |
| -2 a más de -4 | -1.000 € |
| -4 o menos | -2.000 € |

- Precio mínimo: **4.000 €**, máximo: **18.000 €**.
- Sin puntuación válida, el precio permanece sin cambios.
- Los precios deben actualizarse **una sola vez por partido cerrado**, de forma atómica y reproducible.
- La siguiente jornada debe usar una **instantánea de precios** congelada antes de abrir la preparación de XI. Los precios posteriores no alteran la validez de alineaciones anteriores.

## Saldo de los usuarios: también se puede perder

Cada usuario dispone inicialmente de **100.000 €** en cada liga, con un mínimo de **90.000 €** y un máximo de **120.000 €**. El saldo sigue siendo un límite de selección, no una cantidad que se gaste por alinear.

Tras cerrar las votaciones de una jornada, usamos el **total de puntos Fantasy del XI existente** (incluido cualquier bonus de capitán que ya forme parte de ese total), sin cambiar la fórmula:

| Puntos del XI en la jornada | Ajuste del saldo |
|---|---:|
| Menos de 65 | −2.000 € |
| 65–69 | −1.000 € |
| 70–74 | 0 € |
| 75–79 | +1.000 € |
| 80 o más | +2.000 € |

**Jornada 1 oficial:** el saldo de apertura se calcula usando los puntos definitivos de la alineación de esa jornada, una sola vez. Por ejemplo, 75 puntos ⇒ 101.000 € de saldo al comenzar la economía. Si no existía un XI presentado o no hay puntos definitivos, se mantiene en 100.000 € (no se inventa un resultado de cero).

A partir de la segunda jornada, se actualiza con cada partido definitivamente cerrado. Se registra de forma idempotente una única operación por **liga + usuario + partido**, sin permitir que los recálculos o reintentos abonen o descuenten saldo más de una vez. Las jornadas históricas anteriores al inicio de la economía **no cambiarán sus alineaciones ni sus puntuaciones**.

Es imprescindible verificar con datos reales las distribuciones de puntos antes de fijar definitivamente estos umbrales. Los límites evitan pérdidas que hagan inviable competir y subidas demasiado grandes que hagan inalcanzable al líder.

## Validación de un XI

La validación de presupuesto es **adicional** a `validateFantasyLineup` (11 jugadores, posiciones, duplicados). El coste debe ser menor o igual al presupuesto disponible. El servidor debe obtener los precios **desde la instantánea almacenada**, nunca aceptar precios enviados por el navegador. Las comprobaciones deben hacerse de nuevo en el backend incluso si el frontend deshabilita botones.

La futura persistencia debe impedir escrituras parciales o duplicadas cuando dos peticiones intenten guardar el mismo XI; un procedimiento transaccional en PostgreSQL es preferible a varias escrituras independientes.

## Activación gradual (pendiente de desarrollo)

1. Simular **la primera jornada oficial** y varias jornadas posteriores para precios, costes y variaciones positivas/negativas de saldo, sin escribir en tablas reales.
2. Validar que existe al menos un XI posible por equipo y jornada; calibrar presupuesto/precios con esas cifras.
3. Crear migraciones con precios globales, snapshots por partido y presupuesto por usuario/liga con historial de movimientos e idempotencia.
4. Introducir validación del presupuesto exclusivamente para nuevas jornadas, detrás de un flag de activación; no invalidar alineaciones ni resultados anteriores.
5. Mostrar saldo, coste del XI y precios en Mi XI. Prueba de permisos y concurrencia; `npm.cmd run typecheck`, `npm.cmd run test:fantasy`, `npm.cmd run test:fantasy-points`, `npm.cmd run test:fantasy-economy --workspace=@regional-fantasy/shared`.

Estas cifras son **parámetros iniciales propuestos**, no una economía calibrada con datos reales.
