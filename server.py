#!/usr/bin/env python3
"""
Servidor web para Dashboard Farmacia HCD
─────────────────────────────────────────
Sirve los archivos estáticos del dashboard y expone el endpoint
  GET /data/<nombre_archivo.xls>
que lee archivos desde DATA_DIR (carpeta de red montada en Linux).

Uso:
  python server.py

Acceso desde la red:
  http://<ip-del-servidor>:8000/dashboard_farmacia.html?archivo=esta_fac.xls
"""

import http.server
import socketserver
import os
import urllib.parse
from pathlib import Path
import json
import db

# ── Configuración ──────────────────────────────────────────
PORT     = 8091
HOST     = "0.0.0.0"   # Escucha en todas las interfaces de red
# Directorio de los archivos estáticos (HTML, CSS, JS)
STATIC_DIR = Path(__file__).parent.resolve()
# Carpeta de red con los archivos XLS (montada en Linux)
DATA_DIR   = Path("/mnt/sistemas/sisclin/estadistica")

# ── MIME types adicionales ─────────────────────────────────
EXTRA_MIME = {
    ".xls":  "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    """Handler que sirve estáticos + endpoint /data/."""

    def __init__(self, *args, **kwargs):
        # SimpleHTTPRequestHandler servirá archivos desde STATIC_DIR
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    # ------------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path.startswith("/data/"):
            # Quitar el prefijo "/data/" y decodificar %20, etc.
            raw_name = urllib.parse.unquote(parsed.path[len("/data/"):])
            self._serve_data_file(raw_name)
        elif parsed.path == "/api/datos-postgres":
            self._serve_postgres_data()
        else:
            # Archivos estáticos normales (HTML, CSS, JS, …)
            super().do_GET()

    # ------------------------------------------------------------------
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        
        if parsed.path == "/api/datos-postgres":
            self._serve_postgres_data_post()
        else:
            self._error(404, "Endpoint no encontrado")

    # ------------------------------------------------------------------
    def _serve_data_file(self, filename: str):
        """Sirve un archivo XLS/XLSX desde DATA_DIR."""

        # Seguridad: quedarnos solo con el nombre base (evita path traversal)
        filename = os.path.basename(filename)

        # Solo extensiones permitidas
        ext = Path(filename).suffix.lower()
        if ext not in (".xls", ".xlsx"):
            self._error(400, f"Extensión no permitida: '{ext}'. Solo .xls / .xlsx")
            return

        if not DATA_DIR.exists():
            self._error(503, f"Carpeta de datos no accesible: {DATA_DIR}")
            return

        file_path = DATA_DIR / filename
        if not file_path.exists():
            self._error(404, f"Archivo no encontrado: {filename}")
            return

        try:
            data = file_path.read_bytes()
            mime = EXTRA_MIME.get(ext, "application/octet-stream")
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Content-Disposition",
                             f'attachment; filename="{filename}"')
            # CORS: permite fetch desde cualquier origen en la misma red
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
        except OSError as e:
            self._error(500, str(e))

    # ------------------------------------------------------------------
    def _serve_postgres_data_post(self):
        """Consulta a la base de datos PostgreSQL recibiendo parámetros por POST"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._error(400, "Falta el cuerpo de la petición (body)")
                return
                
            post_data = self.rfile.read(content_length)
            datos_json = json.loads(post_data.decode('utf-8'))
            
            lista_codigos = datos_json.get("codigos", [])
            
            # Llamamos a db.py pasándole la lista de códigos
            datos = db.obtener_historias_por_codigos(lista_codigos)
            
            # Convertimos a JSON (default=str maneja fechas y decimales si los hay)
            body = json.dumps(datos, default=str).encode("utf-8")
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)
        except json.JSONDecodeError:
            self._error(400, "El formato del cuerpo no es JSON válido")
        except Exception as e:
            self._error(500, f"Error al consultar BD: {str(e)}")

    # ------------------------------------------------------------------
    def _error(self, code: int, msg: str):
        body = msg.encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)
        print(f"  [ERROR {code}] {msg}")

    # ------------------------------------------------------------------
    def guess_type(self, path):
        """Añade MIME types extra al resolver archivos estáticos."""
        ext = Path(path).suffix.lower()
        if ext in EXTRA_MIME:
            return EXTRA_MIME[ext]
        return super().guess_type(path)

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} — {fmt % args}")


# ── Arranque ───────────────────────────────────────────────
if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), DashboardHandler) as httpd:
        ip_local = __import__("socket").gethostbyname(__import__("socket").gethostname())
        print("=" * 60)
        print("  Dashboard Farmacia HCD — Servidor iniciado")
        print("=" * 60)
        print(f"  Archivos estáticos : {STATIC_DIR}")
        print(f"  Directorio datos   : {DATA_DIR}")
        print(f"  Puerto             : {PORT}")
        print()
        print(f"  Acceso local  : http://localhost:{PORT}/dashboard_farmacia.html")
        print(f"  Acceso en red : http://{ip_local}:{PORT}/dashboard_farmacia.html")
        print()
        print("  Ejemplo con archivo:")
        print(f"  http://{ip_local}:{PORT}/dashboard_farmacia.html?archivo=esta_fac.xls")
        print()
        print("  Ctrl+C para detener")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Servidor detenido.")
