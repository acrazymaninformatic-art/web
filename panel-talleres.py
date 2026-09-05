#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor local para el Panel de Gestión de Talleres de Eva Vidal Nutrición.
Permite editar talleres de forma visual y subirlos automáticamente a GitHub / Cloudflare.
"""

import os
import sys
import json
import subprocess
import webbrowser
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

TALLERES_JSON = os.path.join(BASE_DIR, "talleres.json")
TALLERES_JS = os.path.join(BASE_DIR, "talleres-config.js")

class TalleresHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Evitar cache en la API y panel
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/talleres":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            if os.path.exists(TALLERES_JSON):
                with open(TALLERES_JSON, "r", encoding="utf-8") as f:
                    data = f.read()
            else:
                data = "[]"
            self.wfile.write(data.encode("utf-8"))
            return

        # Redirigir la raíz al panel
        if parsed.path == "/" or parsed.path == "":
            self.send_response(302)
            self.send_header("Location", "/panel-talleres.html")
            self.end_headers()
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/talleres":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            
            try:
                payload = json.loads(body)
                talleres_data = payload.get("talleres", [])

                # 1. Guardar talleres.json con formato bonito
                with open(TALLERES_JSON, "w", encoding="utf-8") as f:
                    json.dump(talleres_data, f, ensure_ascii=False, indent=2)

                # 2. Guardar talleres-config.js para la web
                js_content = "// Archivo de datos para la web pública\n"
                js_content += "// Generado y actualizado automáticamente desde el Panel de Gestión de Talleres\n"
                js_content += "window.TALLERES = " + json.dumps(talleres_data, ensure_ascii=False, indent=2) + ";\n"
                with open(TALLERES_JS, "w", encoding="utf-8") as f:
                    f.write(js_content)

                # 3. Git commit y push automático
                git_log = []
                
                # git add
                r_add = subprocess.run(
                    ["git", "add", "talleres.json", "talleres-config.js"],
                    cwd=BASE_DIR, capture_output=True, text=True
                )
                git_log.append(f"add: {r_add.returncode}")

                # git commit
                r_commit = subprocess.run(
                    ["git", "commit", "-m", "Actualizar talleres desde panel de control"],
                    cwd=BASE_DIR, capture_output=True, text=True
                )
                git_log.append(f"commit: {r_commit.returncode} -> {r_commit.stdout.strip()}")

                # git push
                r_push = subprocess.run(
                    ["git", "push", "origin", "main"],
                    cwd=BASE_DIR, capture_output=True, text=True
                )
                git_log.append(f"push: {r_push.returncode} -> {r_push.stderr.strip() or r_push.stdout.strip()}")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                resp = {
                    "success": True,
                    "message": "Talleres guardados y subidos a la web correctamente.",
                    "git_status": git_log
                }
                self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))

            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                resp = {"success": False, "message": f"Error: {str(e)}"}
                self.wfile.write(json.dumps(resp, ensure_ascii=False).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

def open_browser(port):
    time.sleep(1)
    url = f"http://localhost:{port}/panel-talleres.html"
    print(f"\n=======================================================")
    print(f"  PANEL DE TALLERES - EVA VIDAL NUTRICION")
    print(f"  Abriendo en tu navegador: {url}")
    print(f"  (Deja esta ventana abierta mientras hagas cambios)")
    print(f"=======================================================\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass

def main():
    port = 8000
    while port < 8020:
        try:
            server = HTTPServer(("127.0.0.1", port), TalleresHandler)
            break
        except OSError:
            port += 1

    threading.Thread(target=open_browser, args=(port,), daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor cerrado correctamente.")

if __name__ == "__main__":
    main()
