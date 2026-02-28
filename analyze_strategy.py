import sys
import pandas as pd

out = open('C:/Users/siste/AppData/Local/Temp/strategy_data.txt', 'w', encoding='utf-8')

df = pd.read_excel('C:/DesarrolloWeb/reportes_hcd/data07-02_farmacia.xls')

# PARTICULAR: no convertidos
part_all = df[df['tipo'] == 'PARTICULAR']
part_nc  = df[(df['tipo'] == 'PARTICULAR') & (df['can_sinconvert'] > 0)]

total_der   = part_all['can_derivada'].sum()
total_conv  = part_all['can_conversion'].sum()
total_sin   = part_all['can_sinconvert'].sum()
tasa_actual = total_conv / total_der * 100

out.write("=== DATOS BASE PARTICULAR ===\n")
out.write(f"Total derivadas : {total_der}\n")
out.write(f"Convertidas     : {total_conv}\n")
out.write(f"Sin convertir   : {total_sin}\n")
out.write(f"Tasa actual     : {tasa_actual:.1f}%\n\n")

# Precios y margenes promedio
avg_precio = part_nc['precio_venta'].mean()
avg_costo  = part_nc['costo'].mean()
avg_margen = avg_precio - avg_costo
avg_margen_pct = avg_margen / avg_precio * 100

out.write("=== PROMEDIOS PONDERADOS (PARTICULAR no conv.) ===\n")
out.write(f"Precio venta promedio : S/ {avg_precio:.2f}\n")
out.write(f"Costo promedio        : S/ {avg_costo:.2f}\n")
out.write(f"Margen unitario prom. : S/ {avg_margen:.2f}\n")
out.write(f"Margen pct promedio   : {avg_margen_pct:.1f}%\n\n")

# Escenarios de conversion
out.write("=== ESCENARIOS DE MEJORA ===\n")
for lbl, pct in [('Conservador', 0.15), ('Moderado', 0.25), ('Optimista', 0.40)]:
    target_units  = int(total_der * pct)
    adicionales   = max(0, target_units - int(total_conv))
    ingreso_adic  = adicionales * avg_precio
    ganancia_adic = adicionales * avg_margen
    out.write(f"{lbl} ({pct*100:.0f}%): +{adicionales} uds | +S/ {ingreso_adic:.0f} ingreso | +S/ {ganancia_adic:.0f} ganancia\n")
out.write("\n")

# Analisis por producto: candidatos a descuento
by_prod = part_nc.groupby('producto').agg(
    uds_sin      = ('can_sinconvert',   'sum'),
    venta_pot    = ('tot_sinconversion','sum'),
    costo_tot    = ('t_costo_sin_conver','sum'),
    precio_venta = ('precio_venta',     'mean'),
    costo        = ('costo',            'mean'),
    frecuencia   = ('can_sinconvert',   'count')
).reset_index()

by_prod['margen_pct'] = (by_prod['precio_venta'] - by_prod['costo']) / by_prod['precio_venta'] * 100
by_prod['margen_neto'] = by_prod['venta_pot'] - by_prod['costo_tot']

for d in [10, 15, 20]:
    by_prod[f'gan_desc{d}'] = (by_prod['precio_venta']*(1-d/100) - by_prod['costo']) * by_prod['uds_sin']

candidatos = by_prod[
    (by_prod['margen_pct'] > 30) &
    (by_prod['gan_desc20'] > 0)
].sort_values('margen_neto', ascending=False).head(10)

out.write("=== TOP CANDIDATOS A DESCUENTO (margen>30%, rentable con 20% desc) ===\n")
for _, r in candidatos.iterrows():
    out.write(f"{r['producto'][:45]:<45} | uds:{r['uds_sin']:5.0f} | "
              f"margen:{r['margen_pct']:5.1f}% | precio:S/{r['precio_venta']:.2f} | costo:S/{r['costo']:.2f} | "
              f"pot_neto:S/{r['margen_neto']:7.2f} | "
              f"desc10:S/{r['gan_desc10']:7.2f} | desc15:S/{r['gan_desc15']:7.2f} | desc20:S/{r['gan_desc20']:7.2f}\n")
out.write("\n")

# Todos los productos sin filtro para la tabla
out.write("=== TODOS LOS PRODUCTOS PARTICULAR NO CONV (para referencia) ===\n")
all_prod = by_prod.sort_values('margen_neto', ascending=False).head(15)
for _, r in all_prod.iterrows():
    out.write(f"{r['producto'][:45]:<45} | uds:{r['uds_sin']:5.0f} | margen_pct:{r['margen_pct']:5.1f}% | pot_neto:S/{r['margen_neto']:7.2f}\n")
out.write("\n")

# Por medico: particulares sin convertir
by_med = part_nc.groupby('medico').agg(
    der_sin  = ('can_sinconvert',   'sum'),
    venta_pot= ('tot_sinconversion','sum'),
    costo_tot= ('t_costo_sin_conver','sum'),
    n_recetas= ('can_sinconvert',   'count')
).reset_index()
by_med['margen_pot'] = by_med['venta_pot'] - by_med['costo_tot']

part_conv_med = part_all.groupby('medico').agg(
    der_tot = ('can_derivada', 'sum'),
    conv    = ('can_conversion','sum')
).reset_index()
part_conv_med['tasa_conv'] = part_conv_med['conv'] / part_conv_med['der_tot'] * 100

by_med = by_med.merge(part_conv_med, on='medico', how='left')
by_med = by_med.sort_values('margen_pot', ascending=False)

out.write("=== POR MEDICO: PARTICULARES SIN CONVERTIR ===\n")
for _, r in by_med.iterrows():
    out.write(f"{r['medico']:<35} | tasa:{r['tasa_conv']:5.1f}% | uds_sin:{r['der_sin']:5.0f} | "
              f"der_tot:{r['der_tot']:5.0f} | pot_neto:S/{r['margen_pot']:7.2f}\n")
out.write("\n")

# Sin stock en PARTICULAR
part_sinstock = df[(df['tipo'] == 'PARTICULAR') & (df['sto_med'] == 0)]
sin_stock_uds   = part_sinstock['can_sinconvert'].sum()
sin_stock_monto = part_sinstock['tot_sinconversion'].sum()
out.write("=== SIN STOCK EN PARTICULAR ===\n")
out.write(f"Uds sin stock sin vender : {sin_stock_uds:.0f}\n")
out.write(f"Venta pot. sin stock     : S/ {sin_stock_monto:.2f}\n\n")

# Con stock pero sin convertir (razon no es stock)
part_stock_ok = df[(df['tipo'] == 'PARTICULAR') & (df['sto_med'] > 0) & (df['can_sinconvert'] > 0)]
conv_con_stock = part_stock_ok['can_sinconvert'].sum()
out.write(f"Sin convertir CON stock disponible: {conv_con_stock:.0f} uds\n\n")

# Por especialidad
by_esp = part_nc.groupby('especialidad').agg(
    uds_sin  = ('can_sinconvert', 'sum'),
    venta_pot= ('tot_sinconversion','sum'),
    costo_tot= ('t_costo_sin_conver','sum')
).reset_index()
by_esp['margen_pot'] = by_esp['venta_pot'] - by_esp['costo_tot']
by_esp = by_esp.sort_values('margen_pot', ascending=False)

out.write("=== NO CONVERSION PARTICULAR POR ESPECIALIDAD ===\n")
for _, r in by_esp.iterrows():
    out.write(f"{r['especialidad']:<30} | uds:{r['uds_sin']:5.0f} | pot:S/{r['margen_pot']:7.2f}\n")
out.write("\n")

# Rangos de margen para clasificacion
out.write("=== DISTRIBUCION MARGENES (PARTICULAR no conv.) ===\n")
rangos = [(0,20,'Bajo <20%'), (20,40,'Medio 20-40%'), (40,60,'Alto 40-60%'), (60,100,'Muy alto >60%')]
for lo, hi, lbl in rangos:
    mask = (by_prod['margen_pct'] >= lo) & (by_prod['margen_pct'] < hi)
    cnt = mask.sum()
    uds = by_prod.loc[mask, 'uds_sin'].sum()
    out.write(f"{lbl}: {cnt} productos, {uds:.0f} uds sin convertir\n")

out.close()
print("OK")
