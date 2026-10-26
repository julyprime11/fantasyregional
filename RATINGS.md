# Valoraciones de partido y MVP

La fuente de verdad de la valoración está en `packages/shared/src/ratings.ts`.
La conversión de la valoración a puntos Fantasy está en
`packages/shared/src/fantasy-points.ts`.

## Valoración humana

La nota final del jugador es exclusivamente humana.

Las estadísticas reales del partido (minutos, goles, asistencias, tarjetas,
portería a cero, etc.) no modifican esta valoración. Esas acciones ya tienen su
propia puntuación dentro del sistema Fantasy y mezclarlas de nuevo dentro de la
nota produciría una doble influencia sobre los puntos.

Los votos se agrupan por colectivo antes de ponderarlos:

| Grupo | Roles internos | Peso |
| --- | --- | ---: |
| Jugadores | `player` y `jugador` solo por compatibilidad con votos históricos | 20 % |
| Directiva | `directiva` | 30 % |
| Cuerpo técnico | `entrenador`, `cuerpo_tecnico` | 50 % |

Primero se calcula la media de cada grupo. Después se combinan las medias de los
grupos con los pesos 20/30/50.

Ejemplo:

- media jugadores: 6
- media directiva: 8
- media cuerpo técnico: 10

`valoración = 6 × 0.20 + 8 × 0.30 + 10 × 0.50 = 8.60`

Si un grupo no tiene votos, su peso se redistribuye proporcionalmente entre los
grupos que sí han votado. Por ejemplo, si solo votan jugadores y directiva, los
pesos aplicados pasan de 20/30 a 40/60.

`RatingConfig` expone:

- `minimumVotes`
- `groupWeights`

`DEFAULT_RATING_CONFIG` utiliza un mínimo de 1 voto y los pesos 20/30/50.
Los pesos configurados deben ser valores finitos y mayores que cero.

El rol `jugador` no tiene permiso para crear votos nuevos. Se reconoce dentro del
grupo de jugadores únicamente para no perder votos históricos que ya puedan estar
almacenados con ese valor.

## Estados

- Partido en `voting`: resultados provisionales.
- Partido en `closed`: resultados finales.
- Otros estados: no hay resultados de valoración disponibles.
- Un jugador con 0 minutos devuelve `no_minutes`.
- Si no alcanza `minimumVotes`, devuelve `insufficient_votes`.
- Notas fuera de 0–10 o datos numéricos inválidos devuelven `invalid_data`.

La valoración final conserva sus decimales. El redondeo estándar se utiliza
únicamente cuando la nota se transforma en puntos Fantasy.

`statistical_score` permanece en el resultado por compatibilidad con consumidores
anteriores, pero su valor actual es siempre `null` y no interviene en ningún
cálculo.

## MVP

El MVP se decide exclusivamente con la valoración humana final sin redondear.

Si varios jugadores tienen exactamente la misma valoración máxima, el MVP es
compartido. Los IDs solo se utilizan para ordenar el resultado de forma
determinista.

Cada MVP recibe un bonus Fantasy de **+2 puntos**. El valor está centralizado en
`FANTASY_MVP_POINTS`.

## Conversión de nota a puntos Fantasy

La valoración funciona como un modificador del rendimiento, no como la principal
fuente de puntos de una jornada.

La nota se redondea al entero más cercano y después se aplica:

| Nota redondeada | Puntos Fantasy |
| --- | ---: |
| 0–2 | -2 |
| 3–4 | -1 |
| 5 | 0 |
| 6–7 | +2 |
| 8–9 | +3 |
| 10 | +4 |

Antes del primer ajuste, el sistema daba:

- 0–1: -2
- 2–3: -1
- 4–5: 0
- 6: +2
- 7: +3
- 8–9: +4
- 10: +5
- MVP: +3

El ajuste reduce el peso de las votaciones para que minutos, goles, asistencias,
portería a cero y tarjetas tengan más influencia relativa en la puntuación Fantasy.

## Tests

Desde la raíz del repositorio:

`npm.cmd run test:ratings --workspace=@regional-fantasy/shared`

`npm.cmd run test:fantasy-points --workspace=@regional-fantasy/shared`

Y antes de cerrar el cambio:

`npm.cmd run typecheck`

`minutesCoefficient` se mantiene únicamente por compatibilidad con imports
anteriores. Ya no participa en la valoración ni en los puntos Fantasy.
