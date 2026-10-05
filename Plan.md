# Plan.md — Dashboard de Precursores Regulares

App web (responsive + instalable como PWA) para que el secretario de la congregación vea y gestione la actividad de los precursores regulares durante el año de servicio (septiembre–agosto). Pensada para que **cualquier secretario** pueda usarla, con o sin Excel, y para compartir la vista con otros responsables en **solo lectura**.

---

## 1. Objetivo

- Ver de un vistazo quién **cumplió la meta**, quién llegó al **mínimo**, quién está **cerca** y quién está **por debajo**.
- Medir el **ritmo** de cada precursor (¿va bien, un poco atrasado o necesita ayuda?) según el mes de referencia, para ofrecer ayuda a tiempo.
- Ver la **actividad mensual** en gráficos.
- **Dar de alta, editar y actualizar** precursores, horas y créditos sin depender de importar un Excel.
- Dar acceso de **solo lectura** a otros responsables (p. ej. comité de servicio, coordinador del cuerpo de ancianos).
- Usarla cómodamente en computadora, tableta y teléfono, con datos en línea.
- Consultar y cargar **años de servicio anteriores** para ver cómo han estado los precursores a lo largo del tiempo.

> **Alcance de la herramienta:** es una herramienta de análisis y seguimiento para el secretario. No reemplaza los registros oficiales (S-21, S-4) ni JW Hub, que las instrucciones indican como lo preferible para gestionar la información de los precursores regulares. Debe poder exportar datos para facilitar el traspaso a esos registros.

## 2. Reglas de negocio

| Regla | Detalle |
|---|---|
| Año de servicio | Septiembre a agosto (12 meses). Mes 1 = septiembre, mes 12 = agosto. |
| Meta mensual base | 50 horas (configurable). |
| **Meta anual prorrateada** | `meta = 50 × (meses desde el mes de inicio hasta agosto, ambos inclusive)`, con tope de 600. Se puede ajustar manualmente por precursor. |
| Mínimo para continuar | 560 h para quien hace el año completo. Para quien empieza a mitad de año se asume **proporcional** (`meta_prorrateada × 560/600`). Configurable. |
| **Crédito: asignaciones aprobadas** | Socorro, LDC, servicio voluntario, otras. **Tienen tope por mes:** horas reales + este crédito ≤ 55. Lo sobrante no se cuenta ni se acumula. |
| **Crédito: escuelas** | Escuelas y clases teocráticas para precursores. **Se cuentan completas**, aunque el mes pase de 55 h. |
| Crédito sin horas de predicación | Como en el Excel actual, el crédito de **asignaciones** solo se aplica si el precursor tiene **al menos 1 h de predicación** en el mes (ajuste `require_hours_for_credit`, activado por defecto; confirmado por el secretario y coherente con la indicación de dedicar algún tiempo a la predicación todos los meses). El crédito de escuelas no depende de esto. |
| Total del mes | `horas_reales + crédito_asignaciones_aplicado + crédito_escuelas` |
| Total anual | Suma de los meses desde el inicio del precursor. |
| Restantes | `restantes = max(0, meta − total)` |
| Revisión anual (≈1 de marzo) | Si el promedio mensual (con créditos) es menor de 50 h, marcar para que los superintendentes ofrezcan ayuda. |
| Precursor de salud delicada | Arreglo aprobado por los ancianos: **sin meta fija de horas**. Ver sección 2.4. |

### 2.1 Cómo se aplican los créditos (ejemplos)

| Horas reales | Crédito asignaciones | Crédito escuelas | Se suma | Total del mes |
|---|---|---|---|---|
| 40 | 30 | 0 | 15 (llega a 55) | **55** |
| 40 | 0 | 30 | 30 (completas) | **70** |
| 40 | 30 | 20 | 15 + 20 | **75** |
| 55 | 10 | 0 | 0 (ya está en 55) | **55** |
| 0 | 10 | 0 | 0 (sin horas de predicación, según el ajuste por defecto) | **0** |
| 60 | 10 | 0 | 0 (las horas reales nunca se recortan) | **60** |

### 2.2 Meta prorrateada según el mes de inicio

| Inicio | Meses | Meta |
|---|---|---|
| Septiembre | 12 | 600 |
| Octubre | 11 | 550 |
| Noviembre | 10 | 500 |
| Diciembre | 9 | 450 |
| **Enero** | **8** | **400** |
| Febrero | 7 | 350 |
| Marzo | 6 | 300 |
| Abril | 5 | 250 |
| Mayo | 4 | 200 |
| Junio | 3 | 150 |
| Julio | 2 | 100 |
| Agosto | 1 | 50 |

Los meses anteriores al inicio se muestran como "—" y **no cuentan** para el ritmo ni el promedio.

### 2.3 Medidor de ritmo ("¿va bien?")

**Mes de referencia:** por defecto, el mes del **último informe registrado** en la congregación (alternativa: el mes actual del calendario). Se puede cambiar con un selector.

```
meses_transcurridos = meses desde mes_inicio hasta mes_referencia (inclusive)
esperado_a_la_fecha = 50 × meses_transcurridos
acumulado           = total (horas + créditos aplicados) hasta mes_referencia
diferencia          = acumulado − esperado_a_la_fecha      # horas de adelanto/atraso
ritmo_%             = acumulado / esperado_a_la_fecha
ritmo_necesario     = restantes / meses_que_faltan         # h/mes para llegar a la meta
```

| Estado del medidor | Regla por defecto (configurable) |
|---|---|
| 🟢 **Va bien** | `ritmo_% ≥ 100%` |
| 🟡 **Un poco atrasado** | `80% ≤ ritmo_% < 100%` |
| 🔴 **Necesita ayuda** | `ritmo_% < 80%` o `ritmo_necesario` irrealista (p. ej. > 70 h/mes) |
| ⚪ **Sin informe** | no tiene informe en el mes de referencia |

Visualización: medidor tipo semicírculo o barra con marca de "esperado a la fecha", más una frase clara, p. ej. *"Lleva 20 h de atraso; necesita 58 h/mes en los 4 meses que quedan."*

**Sugerencias de ayuda** (texto editable, según el estado):
- Hacer juntos un horario práctico y **ponerlo por escrito**.
- Reunirse con el superintendente de servicio y el de grupo para entender sus circunstancias y por qué le cuesta alcanzar la meta mensual.
- Evaluar si es realista esperar que cumpla el requisito anual y, si no, que el comité de servicio decida con equilibrio.
- Recordar el crédito de horas por asignaciones aprobadas y escuelas.
- Registrar la fecha de la conversación en una nota privada.

### 2.4 Precursor de salud delicada (sin meta fija)

- Campo `pioneer_type = salud_delicada`. Para estos precursores:
  - No se calcula meta, restantes ni medidor contra 50 h.
  - Estado propio: **"Salud delicada — sirve según sus posibilidades"**, mostrando solo sus horas y gráfico.
  - Requisitos informativos (mostrados en el alta): mayor de 50 años, al menos 15 años como precursor, desea seguir siéndolo; aprobado por el cuerpo de ancianos, anotado en el S-21 y sin necesidad de notificar a la sucursal.
  - Campo opcional: fecha de aprobación.
- **Minimización de datos:** solo se guarda la marca del arreglo, **nunca detalles médicos**.

### 2.5 Revisiones que piden las instrucciones

- **Revisión de marzo (≈1 de marzo):** el secretario y el superintendente de servicio ven la actividad y el crédito de los precursores regulares. A quien no informa habitualmente un promedio de **50 h mensuales** (con créditos), el superintendente de servicio y el de grupo se reúnen con él para ofrecerle ayuda, entender sus circunstancias y evaluar si es realista que cumpla el requisito anual.
- **Fin del año de servicio:** quien llega a **560 h o más** (horas + créditos) puede seguir siendo precursor. Quien no llega lo evalúa el Comité de Servicio de la Congregación con equilibrio y buen juicio: cuánto tiempo lleva en el servicio de tiempo completo, si conviene que deje de ser precursor hasta que cambien sus circunstancias, qué es lo mejor para la persona y a la vez mantener las normas elevadas del servicio.
- **Atender los casos cuanto antes** evita que el precursor minimice la necesidad de cumplir. Por eso el medidor y las alertas funcionan desde los primeros meses, no solo en marzo.
- La app **prepara la información**; las decisiones las toman las personas responsables. No decide ni recomienda que alguien deje el precursorado.

## 3. Alcance

**MVP**
- Inicio de sesión y roles (secretario / lector).
- **Alta de precursor con onboarding** (sección 4.1).
- Dashboard, lista y detalle con medidor de ritmo.
- Captura de horas y **créditos por tipo** (asignación / escuela).
- Invitación de usuarios de **solo lectura**.
- Selector de **año de servicio** (con años anteriores), carga de años pasados, cierre de año y mes de referencia.
- Historial por precursor a lo largo de los años.
- **Revisión de marzo y de fin de año** (lista imprimible/PDF para el comité).
- Bloqueo de mes enviado y bitácora de cambios.
- Importar Excel (opcional) y exportar a Excel/PDF (sirve también como copia de seguridad).

**Después**
- Comparativas entre grupos y años.
- Alertas de "sin informe del mes".
- Seguimiento de ayudas ofrecidas.
- Modo oscuro.
- Fecha de fin para quien deja de ser precursor a mitad de año.
- Rol intermedio de "editor" (p. ej. secretario ayudante).
- Asistente de nombramientos: lista de requisitos para ser nombrado precursor regular (seis meses completos de bautizado, ser cristiano ejemplar, vida organizada para las 600 h, espera de seis meses si dejó de servir, sin readmisión ni ayuda de los ancianos por pecado grave en el último año, sin restricciones).

## 4. Pantallas

### 4.1 Alta de precursor (onboarding paso a paso)

1. **Datos básicos:** nombre, apellidos, grupo.
2. **Tipo de precursor:** Regular · Salud delicada.
3. **Situación en este año de servicio:**
   - *Ya era precursor desde el inicio del año* → inicio en septiembre.
   - *Es nuevo este año* → elegir **mes de inicio**.
4. **Meta calculada:** se muestra la meta prorrateada (p. ej. "Inicia en enero → 400 h, 8 meses") con opción de **ajustarla manualmente**. Para salud delicada se omite.
5. **Horas de los meses ya trabajados:** cuadrícula sencilla con un campo por mes desde su inicio hasta el mes de referencia (septiembre, octubre, noviembre…): **horas** y **cursos bíblicos**, con botón "Agregar crédito" por mes. Los meses previos al inicio quedan deshabilitados. Se puede saltar y completar luego, o **pegar desde el portapapeles** una fila copiada de otra hoja de cálculo.
6. **Resumen y guardar.**

Un paso por pantalla, botones grandes, progreso visible. La primera vez que se usa la app, un onboarding de la congregación pide nombre, número de grupos y metas (valores por defecto 600/560/55/50), y ofrece **empezar vacío** o **importar Excel**.

### 4.2 Dashboard
- Tarjetas: total de precursores, # cumplidos, # en mínimo, # cerca, # en riesgo, # que necesitan ayuda, promedio de horas.
- Gráfico de distribución por estado y de actividad total por mes.
- Listas "Más cerca de la meta" y **"Necesitan ayuda"**.

### 4.3 Lista de precursores
- Tabla en escritorio, tarjetas en teléfono.
- Búsqueda, filtros (grupo, estado, medidor, tipo) y orden.
- Barra de progreso hacia la meta con marca de "esperado a la fecha" y chip de ritmo.

### 4.4 Detalle del precursor
- Medidor de ritmo, total, meta prorrateada, restantes y ritmo necesario.
- Gráfico mensual (horas reales + crédito de asignaciones + crédito de escuelas, apilados) con línea de 50 h.
- Tabla editable de los meses con **horas reales**, **crédito de asignaciones** (ingresado → aplicado), **crédito de escuelas** (completo) y cursos bíblicos.
- Sugerencias de ayuda y notas privadas (solo secretario).

### 4.5 Agregar crédito
Botón **"Agregar crédito"** en el mes del precursor:
1. Elegir **tipo**:
   - **Asignación aprobada** (con tope de 55): Socorro · LDC · Servicio voluntario · Otra.
   - **Escuela** (cuenta completa).
2. Ingresar horas (y nota opcional).
3. Vista previa: *"Se sumarán 15 de 30 h (tope de 55 h al mes)"* o *"Se suman las 30 h completas (escuela)"*. Si el mes no tiene horas de predicación, avisar: *"Sin horas de predicación este mes: el crédito de asignaciones no se aplica"*. Para escuelas que abarcan días de meses distintos, permitir **dividir las horas entre dos meses**, como indican las instrucciones.

Se pueden agregar varios créditos en un mismo mes.

### 4.6 Captura rápida de mes
Elegir mes → lista de precursores activos para llenar en secuencia (horas, crédito por tipo, cursos).

### 4.7 Usuarios y accesos (solo secretario)
- Invitar por correo con rol **Lector** (comité de servicio, coordinador, etc.), ver la lista de usuarios y revocar acceso.
- Los lectores ven dashboard, lista y detalle, pero **no pueden editar** ni ven las notas privadas.

### 4.8 Importar / Exportar y Ajustes
Importar `.xlsx` en el formato actual del secretario, con **vista previa** antes de confirmar:
- Hoja **Información de Precursores Reg.**: grupo, nombres, apellidos, horas por mes y requisito de cada precursor (600, 400…).
- Hojas **mensuales**: horas y cursos bíblicos de los precursores regulares.
- **Crédito:** el crédito ingresado entra como "asignación"; si el crédito aplicado en el Excel es **mayor** que el que daría la regla del tope, la diferencia se propone como "escuela" (revisable en la vista previa).
- Hoja de contactos: solo nombre, grupo, tipo de precursor e inicio del precursorado (para calcular la meta).
- **No se importan** teléfonos, correos, fechas de nacimiento ni la columna de notas.
- Se puede importar un Excel de **otro año de servicio** al año seleccionado.

También exportar a Excel/PDF. Ajustes: año de servicio, metas, umbrales del medidor, grupos.

### 4.9 Años de servicio

- **Selector de año** en el menú de usuario (y visible en el encabezado): lista los años disponibles con el actual marcado. El año actual se calcula por fecha (del 1 de septiembre al 31 de agosto).
- **Años anteriores:** misma interfaz, en lectura para todos. Por defecto el mes de referencia es agosto y se muestra el **resultado final del año**: Cumplió · Llegó al mínimo · No alcanzó.
- **Cargar un año anterior** (solo secretario): "Agregar año de servicio" → elegir etiqueta (p. ej. 2024-2025) → llenar con la misma cuadrícula de captura por mes, o importar el Excel de ese año. Los precursores de ese año que ya no están se marcan como inactivos.
- **Cerrar año:** bloquea las ediciones de ese año (se puede reabrir con confirmación).
- **Iniciar nuevo año** (cada septiembre): botón que crea el año siguiente y copia los precursores activos con inicio en septiembre y su tipo; el secretario ajusta altas y bajas.
- **Historial por precursor:** pestaña con el total de cada año frente a su meta y el resultado final, para ver de un vistazo si ha estado bien o mal con el tiempo.
- Los lectores pueden cambiar de año y ver el historial, sin editar.

### 4.10 Revisión de marzo y de fin de año

- **Recordatorio** en el dashboard desde mediados de febrero: *"Se acerca la revisión de marzo"*.
- **Revisión de marzo:** lista de precursores con promedio menor de 50 h (con créditos), con su meta, acumulado, ritmo necesario y las sugerencias de ayuda. Casillas para marcar *"Reunión realizada"* con fecha, y nota privada.
- **Revisión de fin de año:** lista de quienes no llegaron al mínimo (560 h o su equivalente prorrateado) con su total, tiempo como precursor y notas, para que el Comité de Servicio decida.
- **Exportar a PDF/imprimir** cada lista para llevarla a la reunión (solo secretario; los lectores la ven en pantalla).
- Los casos de salud delicada no aparecen como "atrasados" en estas listas.

## 5. Modelo de datos (Firestore)

Todo cuelga de la congregación, con **multi-congregación** desde el inicio:

```
congregations/{congId}
  name, monthly_goal (50), full_year_goal (600), full_year_minimum (560),
  monthly_cap (55), require_hours_for_credit (true), near_threshold (40),
  pace_ok_pct (100), pace_late_pct (80), pace_unrealistic_hours (70),
  reference_month_mode ("last_report" | "calendar")

  members/{uid}              role: "secretary" | "viewer", email, displayName
  invites/{emailLower}       role, invitedBy, createdAt

  pioneers/{pioneerId}       first_name, last_name, group_number, active, pioneer_since (opcional)
  serviceYears/{yearId}      label ("2025-2026"), start_date, end_date, closed (bool)

  pioneerYears/{pioneerId}_{yearId}
    pioneer_type ("regular" | "salud_delicada"),
    start_month (1-12, 1 = septiembre),
    goal_override (nullable), approval_date (nullable),
    s21_noted (bool, solo salud delicada: aprobación anotada en el S-21)

  reports/{pioneerId}_{yearId}_{month}
    preaching_hours, bible_studies (opcional)

  creditEntries/{entryId}
    pioneerId, yearId, month (1-12),
    kind ("asignacion" | "escuela"),
    subtype ("socorro" | "ldc" | "servicio_voluntario" | "otra" | null),
    hours, note

  privateNotes/{pioneerId}   solo secretario
  monthStatus/{yearId}_{month}   sent (bool): mes enviado, bloquea la edición
  reviews/{pioneerId}_{yearId}   march_meeting_date, year_end_review_date (el contenido va en privateNotes)
  auditLog/{entryId}         uid, action, entity, before, after, at  (solo secretario)
```

Si un precursor no tiene `pioneerYears` en un año determinado, significa que no era precursor regular en ese año (el historial lo muestra como tal).

Totales, créditos aplicados, estados y medidor se **calculan en el cliente** con funciones puras (no se guardan), así hay una sola fuente de verdad.

## 6. Lógica de cálculo (pseudocódigo)

```
# por mes
assign_entered = sum(creditEntries kind="asignacion")
school_hours   = sum(creditEntries kind="escuela")            # completas
assign_applied = 0 if (require_hours_for_credit and preaching_hours == 0)
                 else min(assign_entered, max(0, monthly_cap - preaching_hours))
month_total    = preaching_hours + assign_applied + school_hours

# por precursor y año
months_in_year = 12 - start_month + 1
goal           = goal_override ?? min(full_year_goal, monthly_goal * months_in_year)
minimum        = goal * full_year_minimum / full_year_goal    # proporcional
total          = sum(month_total)                             # solo meses >= start_month
remaining      = max(0, goal - total)

status =
  "cumplido"  if total >= goal
  "minimo"    if total >= minimum
  "cerca"     if minimum - total <= near_threshold
  "riesgo"    otherwise
# salud_delicada: sin meta ni status de cumplimiento

# ritmo
elapsed     = ref_month - start_month + 1        # si < 1, "aún no inicia"
expected    = monthly_goal * elapsed
pace_pct    = total_to_ref / expected
months_left = 12 - ref_month
needed_pace = remaining / months_left            # si months_left = 0, solo mostrar restantes

meter =
  "sin_informe"  if no report in ref_month
  "va_bien"      if pace_pct >= pace_ok_pct
  "atrasado"     if pace_pct >= pace_late_pct
  "ayuda"        otherwise or needed_pace > pace_unrealistic_hours
```

## 7. Stack recomendado

- **Frontend:** Vite + React + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Gráficos:** Recharts (medidor con SVG propio o gráfico radial)
- **Backend:** **Firebase**
  - **Authentication** (correo con enlace o Google).
  - **Cloud Firestore** con persistencia offline (útil para la PWA).
  - **Security Rules** para roles y aislamiento por congregación (sección 10).
  - **Firebase Hosting** para publicar la app en línea.
  - Se busca funcionar en el plan gratuito (sin Cloud Functions); las invitaciones se resuelven con reglas (ver abajo).
- **Excel:** SheetJS
- **PWA:** `vite-plugin-pwa`

**Flujo de invitación sin Cloud Functions:** el secretario crea `invites/{email}` con el rol; cuando esa persona inicia sesión con ese correo, la app crea su `members/{uid}` y las reglas lo permiten solo si existe la invitación correspondiente y el rol coincide.

## 8. Diseño (minimalista y elegante)

- Fondo claro neutro (y modo oscuro), espacio en blanco, tarjetas con bordes suaves y sombras sutiles.
- Tipografía sans-serif legible (Inter o similar).
- Paleta de acento sobria; colores de estado consistentes, **siempre con texto/icono**:
  - Cumplido: verde · Mínimo: azul · Cerca: ámbar · Riesgo: rojo.
  - Medidor: verde (va bien) · ámbar (atrasado) · rojo (necesita ayuda) · gris (sin informe).
- Mobile-first: navegación inferior en teléfono, barra lateral en escritorio; botones táctiles grandes; tablas que se vuelven tarjetas.
- Los lectores ven la misma interfaz sin botones de edición.
- Tono amable en los mensajes de ayuda (enfocados en apoyar, no en señalar).
- Accesibilidad: contraste AA, teclado, etiquetas en formularios.
- Validaciones amables: avisar de horas atípicas (p. ej. más de 200 en un mes), duplicados y meses anteriores al inicio, sin bloquear.
- Guardado automático en la captura y opción de **deshacer** tras guardar.
- Cambios recientes visibles ("actualizado por … el …") gracias a la bitácora.
- Informes imprimibles y PDF con formato limpio.
- Textos en español, con la estructura lista para otros idiomas; usar el vocabulario habitual de la organización.

## 9. Pruebas de cálculo

| Caso | Datos | Resultado esperado |
|---|---|---|
| Tope de asignaciones | 40 h reales + 30 h asignación | Se suman 15; total del mes 55 |
| Escuela completa | 40 h reales + 30 h escuela | Se suman 30; total del mes 70 |
| Mixto | 40 reales + 30 asignación + 20 escuela | 40 + 15 + 20 = 75 |
| Mes ya en 55 | 55 reales + 10 asignación | Aplicado 0; total 55 |
| Horas reales altas | 60 reales + 10 asignación | Aplicado 0; total 60 |
| Sin horas de predicación | 0 reales + 10 asignación | Aplicado 0 (con `require_hours_for_credit`); 0 reales + 10 escuela → 10 |
| Año anterior | Seleccionar 2024-2025 | Se muestra el resultado final del año y el historial del precursor |
| Cierre de año | Año cerrado, secretario intenta editar | Bloqueado hasta reabrir |
| Nuevo año | "Iniciar nuevo año" | Copia precursores activos con inicio en septiembre |
| Importar Excel | Crédito aplicado mayor que la regla del tope | Diferencia propuesta como "escuela" |
| Mes enviado | Marcar un mes como enviado | Se bloquea la edición de ese mes hasta reabrirlo |
| Escuela dividida | 30 h de escuela que abarcan dos meses, repartidas 20/10 | Cada mes suma sus horas completas |
| Revisión de marzo | Promedio de 45 h al 1 de marzo | Aparece en la lista de revisión con sugerencias |
| Fin de año | Total de 540 h con meta de 600 | Aparece en la revisión de fin de año (bajo el mínimo de 560) |
| Inicio en septiembre | Año completo | Meta 600 |
| Inicio en enero | 8 meses | Meta 400 |
| Inicio en febrero | 7 meses | Meta 350 |
| Ritmo | Inicio enero, referencia marzo, 120 h acumuladas | Esperado 150; 80% → "atrasado"; −30 h |
| Salud delicada | Cualquier cantidad de horas | Sin meta ni medidor; estado propio |
| Totales del Excel | Precursor con 524 h + 160 h de crédito aplicado | 684, cumplido |
| Totales del Excel | 574 h + 6 h | 580, mínimo, faltan 20 |
| Totales del Excel | 413 h + 177 h | 590, mínimo, faltan 10 |
| Permisos | Lector intenta escribir en Firestore | Rechazado por las reglas |
| Aislamiento | Usuario de otra congregación intenta leer | Rechazado por las reglas |

Nota: en el Excel actual el secretario reemplaza la fórmula del tope en las horas de escuela para que sumen completas, así que sus totales son la referencia correcta. Tras importar, la app debe **coincidir con el Excel** para todos los precursores.

## 10. Privacidad y seguridad

Son datos personales de miembros de la congregación:

- Acceso solo con inicio de sesión; sin páginas públicas ni indexación.
- **Security Rules de Firestore**, ejemplo de intención:
  ```
  // lectura: cualquier miembro de la congregación
  allow read: if isMember(congId);
  // escritura: solo secretario
  allow write: if isSecretary(congId);
  // privateNotes: lectura y escritura solo secretario
  ```
- Roles: **secretario** (todo) y **lector** (solo lectura, sin notas privadas). Cada secretario administra únicamente los datos de su congregación.
- Revocar un acceso debe ser inmediato; registrar quién fue invitado y cuándo.
- Activar **App Check** y HTTPS (por defecto en Firebase Hosting).
- Copias de seguridad: exportación periódica a Excel desde la app; opción de exportar/borrar todos los datos.
- Sin datos médicos: solo la marca de "salud delicada". Las notas son privadas y opcionales.
- **Bitácora de cambios** (quién modificó qué y cuándo), visible solo para el secretario.
- **Minimización al importar:** no se traen teléfonos, correos, fechas de nacimiento ni notas de las hojas del Excel (algunas notas pueden contener situaciones personales).
- Revisar las indicaciones vigentes de la organización sobre el manejo de datos personales antes de ponerla en uso.

## 11. Fases de trabajo en Antigravity

1. **Base del proyecto:** Vite + React + TS + Tailwind + shadcn/ui, rutas, layout responsive y tema.
2. **Lógica de cálculo:** funciones puras de la sección 6 con pruebas unitarias de la sección 9 (antes de conectar la base de datos).
3. **Firebase:** proyecto, Authentication, Firestore con el modelo de la sección 5, Security Rules y emulador local para probarlas.
4. **Alta con onboarding** de precursor y onboarding inicial de la congregación.
5. **Lista y detalle** con barra de progreso, medidor de ritmo y gráfico mensual.
6. **Créditos por tipo** (asignación / escuela) y captura rápida mensual, con bloqueo de mes enviado y bitácora de cambios.
7. **Dashboard** con resumen y listas "Necesitan ayuda" / "Más cerca de la meta", y pantalla de **revisión de marzo y de fin de año**.
8. **Usuarios y accesos y años de servicio:** invitaciones, rol de lector, selector de año, carga de años anteriores, cierre de año, nuevo año e historial por precursor.
9. **Importar/exportar Excel** (formato actual, hojas mensuales y de precursores) con vista previa y propuesta de créditos de escuela.
10. **PWA, pulido visual y accesibilidad;** probar en teléfono, tableta y escritorio.
11. **Despliegue en Firebase Hosting** y revisión final de reglas.

Pedir al agente que al final de cada fase ejecute las pruebas y muestre capturas en las tres resoluciones.

## 12. Criterios de aceptación

- [ ] Los totales coinciden con las pruebas de la sección 9 y con el Excel actual.
- [ ] Las horas de escuela se suman completas y el resto de créditos respeta el tope de 55 h por mes.
- [ ] Al agregar crédito se elige el tipo y se ve la vista previa de lo que se suma.
- [ ] Un precursor nuevo se da de alta en menos de un minuto desde el teléfono, con su meta prorrateada correcta.
- [ ] El medidor muestra claramente quién va bien, quién está atrasado y quién necesita ayuda.
- [ ] El precursor de salud delicada no tiene meta ni se marca como atrasado.
- [ ] Se puede cambiar de año de servicio desde el menú de usuario y ver los años anteriores con su resultado final.
- [ ] El secretario puede cargar un año anterior a mano o importando el Excel de ese año.
- [ ] Se puede dar de alta un precursor sin Excel con nombre, grupo y horas de cada mes trabajado.
- [ ] El secretario puede invitar y revocar usuarios de solo lectura, y estos no pueden modificar datos.
- [ ] El crédito de asignaciones no se aplica en meses sin horas de predicación y la app lo avisa.
- [ ] La revisión de marzo y la de fin de año se generan y se imprimen con un clic.
- [ ] Un mes enviado queda bloqueado y todos los cambios quedan en la bitácora.
- [ ] Funciona bien en teléfono, tableta y escritorio, con datos en línea.
- [ ] Solo se accede con inicio de sesión.
