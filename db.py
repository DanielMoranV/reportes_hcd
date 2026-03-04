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

def obtener_historias_por_codigos(lista_codigos):
    """
    Se conecta a PostgreSQL y devuelve los registros de la tabla historias_digitales
    cuyo 'codigo_servicio_medico' coincida con alguno de los códigos proveídos.
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
        
        # Consulta dinámica usando la cláusula IN
        consulta = "SELECT * FROM historias_digitales WHERE codigo_servicio_medico IN %s"
        
        # psycopg2 necesita que la lista sea una tupla para la cláusula IN
        cur.execute(consulta, (tuple(lista_codigos),))
        
        # Obtiene todos los resultados
        resultados = cur.fetchall()
        
        # Cierra el cursor y la conexión
        cur.close()
        conn.close()
        
        return resultados
        
    except Exception as e:
        print(f"Error al conectar con PostgreSQL: {e}")
        return {"error": str(e)}
