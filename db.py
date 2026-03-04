import psycopg2
import psycopg2.extras

# Configuración de la base de datos PostgreSQL
# ¡ATENCIÓN! Cambia estos valores por los reales de tu base de datos
DB_CONFIG = {
    "host": "localhost",
    "port": "5433",
    "dbname": "backend_csr",
    "user": "csr_user",
    "password": "csr_secure_2024"
    # El esquema ('schema') se aplicará en la consulta, no en DB_CONFIG
}

# Nombre de tu esquema
DB_SCHEMA = "sisclin"

def obtener_historias_por_codigos(lista_codigos, fecha_inicio=None, fecha_fin=None):
    """
    Se conecta a PostgreSQL y devuelve los registros de la tabla historias_digitales
    cuyo 'codigo_servicio_medico' coincida con alguno de los códigos proveídos.
    Incluye filtros adicionales para motivo_consulta y rango de fechas.
    """
    if not lista_codigos:
        return []

    try:
        # Establece la conexión
        conn = psycopg2.connect(**DB_CONFIG)
        
        # Cursor que devuelve los resultados como diccionarios (clave=valor)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Primero le decimos a PostgreSQL qué esquema (schema) vamos a usar
        cur.execute(f"SET search_path TO {DB_SCHEMA}")
        
        # Consulta dinámica base
        consulta_base = """
            SELECT codigo_servicio_medico as cod_ser, COUNT(*) as cantidad
            FROM historias_digitales 
            WHERE codigo_servicio_medico IN %s
              AND motivo_consulta IS NOT NULL 
              AND TRIM(motivo_consulta) <> ''
        """
        
        parametros = [tuple(lista_codigos)]
        
        # Agregar condición de fechas si vienen en la petición
        if fecha_inicio and fecha_fin:
            # IMPORTANTE: Si tu columna se llama distinto, cambia 'fecha_atencion' por el nombre real
            consulta_base += " AND fecha_historia_clinica BETWEEN %s AND %s"
            parametros.extend([fecha_inicio, fecha_fin])
            
        consulta_final = consulta_base + " GROUP BY codigo_servicio_medico"
            
        print(f"Ejecutando SQL: {consulta_final}")
        print(f"Con parámetros: {parametros}")
        
        # psycopg2 necesita que los parámetros se pasen como tupla
        cur.execute(consulta_final, tuple(parametros))
        
        # Obtiene todos los resultados
        resultados = cur.fetchall()
        
        # Cierra el cursor y la conexión
        cur.close()
        conn.close()
        
        return resultados
        
    except Exception as e:
        print(f"Error al conectar con PostgreSQL: {e}")
        return {"error": str(e)}
