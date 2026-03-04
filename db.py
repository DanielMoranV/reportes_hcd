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

def obtener_datos_ejemplo():
    """
    Se conecta a PostgreSQL, ejecuta una consulta y devuelve los resultados
    como una lista de diccionarios.
    """
    try:
        # Establece la conexión
        conn = psycopg2.connect(**DB_CONFIG)
        
        # Cursor que devuelve los resultados como diccionarios (clave=valor)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Primero le decimos a PostgreSQL qué esquema (schema) vamos a usar
        cur.execute(f"SET search_path TO {DB_SCHEMA}")
        
        # Consulta de ejemplo: cámbiala por la tabla real que necesitas consultar
        consulta = "SELECT * FROM historias_digitales LIMIT 10"
        cur.execute(consulta)
        
        # Obtiene todos los resultados
        resultados = cur.fetchall()
        
        # Cierra el cursor y la conexión
        cur.close()
        conn.close()
        
        return resultados
        
    except Exception as e:
        print(f"Error al conectar con PostgreSQL: {e}")
        return {"error": str(e)}
