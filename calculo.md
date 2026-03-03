Para corroborar manualmente, seguí estos pasos en tu Excel. Asumo que la columna tipo contiene "PARTICULAR" (o similar con "PAR").

--- Paso 1 — Obtener los totales base (solo PAR)

En celdas auxiliares, calculá:

┌────────────┬───────────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────┐
│ Variable │ Fórmula Excel │ Descripción │
├────────────┼───────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
│ parDeriv │ =SUMIF(tipo*col,"\_PAR*",can*derivada_col) │ Total unidades derivadas PAR │
├────────────┼───────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
│ parConv │ =SUMIF(tipo_col,"\_PAR*",can*conversion_col) │ Total unidades convertidas PAR │
├────────────┼───────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
│ sinConv │ =parDeriv - parConv │ Unidades sin convertir PAR │
├────────────┼───────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
│ parRevNR │ =SUMIF(tipo_col,"\_PAR*",tot_sinconversion_col) │ Ingreso potencial no realizado │
├────────────┼───────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────┤
│ parVentaNR │ =SUMPRODUCT((tipo_col="PARTICULAR")\*(tot_sinconversion_col - t_costo_sin_conver_col)) │ Ganancia neta no realizada │
└────────────┴───────────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────┘

---

Paso 2 — Precio promedio por unidad

precioPorUnd = parRevNR / sinConv
margenNetoPorUnd = parVentaNR / sinConv

---

Paso 3 — Calcular cada escenario

La lógica es: "si logramos que el X% de todas las derivaciones PAR se conviertan, ¿cuántas unidades adicionales vendemos?"

┌───────────┬──────────────────────────────┬───────────────────────────────┬───────────────────────────┬───────────────────────────────┐
│ Escenario │ nuevasConv │ deltaConv │ Ingreso adicional │ Ganancia adicional │
├───────────┼──────────────────────────────┼───────────────────────────────┼───────────────────────────┼───────────────────────────────┤
│ 15% │ =REDONDEAR(parDeriv*0.15, 0) │ =MAX(0, nuevasConv − parConv) │ =deltaConv * precioPorUnd │ =deltaConv * margenNetoPorUnd │
├───────────┼──────────────────────────────┼───────────────────────────────┼───────────────────────────┼───────────────────────────────┤
│ 25% │ =REDONDEAR(parDeriv*0.25, 0) │ ídem │ ídem │ ídem │
├───────────┼──────────────────────────────┼───────────────────────────────┼───────────────────────────┼───────────────────────────────┤
│ 40% │ =REDONDEAR(parDeriv\*0.40, 0) │ ídem │ ídem │ ídem │
└───────────┴──────────────────────────────┴───────────────────────────────┴───────────────────────────┴───────────────────────────────┘

Aclaración clave: el porcentaje (15%, 25%, 40%) es la tasa objetivo total sobre parDeriv, no un incremento relativo sobre la tasa actual. Si hoy tenés  
 3.1% de conversión y el objetivo es 15%, el delta es (parDeriv×0.15) − parConv.

---

Verificación rápida con números reales

Basado en lo que mostraba el dashboard antes de las correcciones (para orientarte en magnitudes):

- parDeriv ≈ 2022 unidades
- parConv ≈ 63 unidades
- sinConv ≈ 1959 unidades
- parRevNR / sinConv = precio por unidad

Si los números de tu Excel dan distinto a los del dashboard, el punto de discrepancia estará en uno de esos 5 valores del Paso 1 — comparalos uno por  
 uno para identificar dónde diverge.
