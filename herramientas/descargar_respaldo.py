#!/usr/bin/env python3
"""
Descarga un RESPALDO local de las APIs de la NASA que usa el Observatorio Nacional.

Crea, dentro de la carpeta RESPALDO/, una "API propia" en archivos JSON con datos
REALES de la NASA (nada inventado) y copias reducidas de las imágenes:

    RESPALDO/tierra/datos.json      Imágenes EPIC de la Tierra, agrupadas por fecha
    RESPALDO/marte/datos.json       Fotos de los rovers de Marte, agrupadas por sol
    RESPALDO/asteroides/datos.json  Asteroides cercanos (NeoWs), agrupados por fecha
    RESPALDO/biblioteca/datos.json  Resultados de la biblioteca de imágenes por tema

Cada carpeta tiene además datos.js (el mismo contenido, para que la página funcione
aunque se abra con doble clic) e img/ con las imágenes.

Uso:
    pip install pillow
    python herramientas/descargar_respaldo.py              # todo, ~600 por API
    python herramientas/descargar_respaldo.py --solo tierra marte --cantidad 300
"""
import argparse
import datetime as dt
import io
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

try:
    from PIL import Image
except ImportError:  # se puede ejecutar sin Pillow, pero las imágenes quedan en tamaño original
    Image = None

API_KEY = os.environ.get("NASA_API_KEY", "ls42GTOyJCrx4nmx9cmxEJDsJWycYlW6UNh90kWa")
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "RESPALDO")
AGENTE = "ObservatorioNacional-Respaldo/1.0 (proyecto universitario)"

TEMAS_BIBLIOTECA = ["mars", "moon", "earth", "sun", "jupiter", "galaxy", "astronaut", "telescope"]


# ----------------------------------------------------------------- utilidades
def log(*partes):
    print(*partes, flush=True)


def obtener(url, intentos=3, timeout=40):
    """Descarga bytes de una URL con reintentos."""
    ultimo = None
    for i in range(intentos):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            ultimo = e
            if e.code in (400, 404):
                break
            time.sleep(2 * (i + 1))
        except Exception as e:  # noqa: BLE001 - red inestable, timeouts, etc.
            ultimo = e
            time.sleep(2 * (i + 1))
    raise RuntimeError(f"No se pudo descargar {url}: {ultimo}")


def obtener_json(url):
    return json.loads(obtener(url).decode("utf-8"))


def guardar_imagen(url, destino, ancho_max=640, ancho_min=0):
    """Descarga una imagen, la reduce y la guarda como JPG. Devuelve True si quedó guardada."""
    if os.path.exists(destino):
        return True
    try:
        datos = obtener(url, intentos=2)
    except RuntimeError as e:
        log("   ⚠", e)
        return False
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    if Image is None:
        with open(destino, "wb") as f:
            f.write(datos)
        return True
    try:
        img = Image.open(io.BytesIO(datos))
        if img.width < ancho_min:
            return False
        img = img.convert("RGB")
        if img.width > ancho_max:
            img = img.resize((ancho_max, round(img.height * ancho_max / img.width)))
        img.save(destino, "JPEG", quality=78, optimize=True)
        return True
    except Exception as e:  # noqa: BLE001 - archivo que no es imagen, etc.
        log("   ⚠ imagen inválida", url, e)
        return False


def escribir(nombre, contenido):
    """Escribe datos.json (la API) y datos.js (para abrir la página con doble clic)."""
    carpeta = os.path.join(RAIZ, nombre)
    os.makedirs(carpeta, exist_ok=True)
    texto = json.dumps(contenido, ensure_ascii=False, indent=1)
    with open(os.path.join(carpeta, "datos.json"), "w", encoding="utf-8") as f:
        f.write(texto)
    with open(os.path.join(carpeta, "datos.js"), "w", encoding="utf-8") as f:
        f.write("// Generado por herramientas/descargar_respaldo.py - mismo contenido que datos.json\n")
        f.write("window.RESPALDO = window.RESPALDO || {};\n")
        f.write(f"window.RESPALDO[{json.dumps(nombre)}] = {texto};\n")
    log(f"✔ {nombre}: guardado {contenido.get('total', 0)} registros")


def cabecera(fuente, descripcion):
    return {
        "proyecto": "Observatorio Nacional - respaldo local de APIs de la NASA",
        "descripcion": descripcion,
        "fuente": fuente,
        "generado": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "nota": "Datos reales descargados de servicios públicos de la NASA. Las imágenes están reducidas.",
    }


# ----------------------------------------------------------------- TIERRA (EPIC)
def respaldo_tierra(cantidad):
    log("\n🌍 Tierra (EPIC)")
    base = "https://epic.gsfc.nasa.gov"
    fechas = {}
    total = 0
    try:
        disponibles = obtener_json(f"{base}/api/natural/all")
        lista = sorted({(d["date"] if isinstance(d, dict) else str(d))[:10] for d in disponibles}, reverse=True)
        log(f"   {len(lista)} fechas disponibles; la más reciente {lista[0] if lista else '-'}")
        # Se reparten las fechas a lo largo del tiempo para tener variedad (una cada ~15 días)
        elegidas, ultima = [], None
        for f in lista:
            if ultima is None or (dt.date.fromisoformat(ultima) - dt.date.fromisoformat(f)).days >= 15:
                elegidas.append(f)
                ultima = f
        # Si con las fechas espaciadas no alcanza, se completa con las demás fechas
        elegidas += [f for f in lista if f not in set(elegidas)]
        for fecha in elegidas:
            if total >= cantidad:
                break
            try:
                items = obtener_json(f"{base}/api/natural/date/{fecha}")
            except RuntimeError as e:
                log("   ⚠", e)
                continue
            anio, mes, dia = fecha.split("-")
            registros = []
            for it in items:
                if total >= cantidad:
                    break
                nombre = it["image"]
                url = f"{base}/archive/natural/{anio}/{mes}/{dia}/jpg/{nombre}.jpg"
                local = f"tierra/img/{nombre}.jpg"
                if guardar_imagen(url, os.path.join(RAIZ, local), ancho_max=600):
                    registros.append({
                        "image": nombre,
                        "date": it.get("date"),
                        "caption": it.get("caption", ""),
                        "centroid_coordinates": it.get("centroid_coordinates"),
                        "url_original": url,
                        "imagen_local": local,
                    })
                    total += 1
            if registros:
                fechas[fecha] = registros
                log(f"   {fecha}: {len(registros)} imágenes (total {total})")
        fuente = "https://epic.gsfc.nasa.gov/api/natural"
    except RuntimeError as e:
        log("   ✖ EPIC no respondió:", e)
        log("   → Se usa la biblioteca de imágenes de la NASA (búsqueda 'earth from space')")
        fechas, total = respaldo_desde_biblioteca("earth from space DSCOVR EPIC", "tierra", cantidad)
        fuente = "https://images-api.nasa.gov/search?q=earth from space"
    datos = cabecera(fuente, "Imágenes de la Tierra completa agrupadas por fecha (AAAA-MM-DD).")
    datos.update({"total": total, "fechas": fechas})
    escribir("tierra", datos)


# ----------------------------------------------------------------- MARTE
def fotos_marte_sol(sol):
    """Prueba varias fuentes reales de fotos de rovers. Devuelve (fuente, lista normalizada)."""
    fuentes = [
        ("api.nasa.gov mars-photos",
         f"https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol={sol}&api_key={API_KEY}"),
        ("rovers.nebulum.one (reemplazo comunitario)",
         f"https://rovers.nebulum.one/api/v1/rovers/curiosity/photos?sol={sol}"),
    ]
    for nombre, url in fuentes:
        try:
            datos = obtener_json(url)
            fotos = datos.get("photos") if isinstance(datos, dict) else None
            if fotos:
                return nombre, [{
                    "id": f.get("id"),
                    "sol": f.get("sol", sol),
                    "earth_date": f.get("earth_date"),
                    "camera": (f.get("camera") or {}).get("full_name") or (f.get("camera") or {}).get("name"),
                    "rover": (f.get("rover") or {}).get("name", "Curiosity"),
                    "img_src": f.get("img_src"),
                } for f in fotos if f.get("img_src")]
        except (RuntimeError, ValueError, AttributeError):
            pass
    # Feed de imágenes crudas del sitio de la misión
    try:
        datos = obtener_json(f"https://mars.nasa.gov/rss/api/?feed=raw_images&category=msl&feedtype=json&sol={sol}")
        imgs = datos.get("images", []) if isinstance(datos, dict) else []
        lista = [{
            "id": i.get("imageid"),
            "sol": i.get("sol", sol),
            "earth_date": (i.get("date_taken") or "")[:10],
            "camera": i.get("instrument"),
            "rover": "Curiosity",
            "img_src": i.get("https_url") or i.get("url"),
        } for i in imgs if (i.get("https_url") or i.get("url"))]
        if lista:
            return "mars.nasa.gov raw_images", lista
    except (RuntimeError, ValueError, AttributeError):
        pass
    return None, []


def respaldo_marte(cantidad, por_sol=8):
    log("\n🔴 Marte")
    soles, total, fuente_usada = {}, 0, None
    sol, fallos_seguidos = 1000, 0
    while total < cantidad and sol < 4500 and fallos_seguidos < 8:
        fuente, fotos = fotos_marte_sol(sol)
        if not fotos:
            fallos_seguidos += 1
            sol += 7
            continue
        fallos_seguidos = 0
        fuente_usada = fuente_usada or fuente
        # Variedad: como máximo 2 fotos por cámara en cada sol
        por_camara, elegidas = {}, []
        for f in fotos:
            if por_camara.get(f["camera"], 0) < 2:
                por_camara[f["camera"]] = por_camara.get(f["camera"], 0) + 1
                elegidas.append(f)
        registros = []
        for i, f in enumerate(elegidas):
            if len(registros) >= por_sol or total >= cantidad:
                break
            local = f"marte/img/sol{sol}_{i}.jpg"
            if guardar_imagen(f["img_src"], os.path.join(RAIZ, local), ancho_max=600, ancho_min=200):
                f["imagen_local"] = local
                registros.append(f)
                total += 1
        if registros:
            soles[str(sol)] = registros
            log(f"   sol {sol}: {len(registros)} fotos (total {total}) [{fuente}]")
        sol += 7

    sin_sol = []
    if total == 0:
        log("   ✖ Ninguna API de rovers respondió → se usa la biblioteca de imágenes de la NASA")
        fechas, total = respaldo_desde_biblioteca("curiosity rover mars surface", "marte", cantidad)
        sin_sol = [r for lista in fechas.values() for r in lista]
        fuente_usada = "https://images-api.nasa.gov/search?q=curiosity rover"

    datos = cabecera(fuente_usada, "Fotos de rovers de Marte agrupadas por sol (día marciano).")
    datos.update({"total": total, "soles": soles, "sin_sol": sin_sol})
    escribir("marte", datos)


# ----------------------------------------------------------------- ASTEROIDES (NeoWs)
def respaldo_asteroides(semanas):
    log("\n☄️ Asteroides (NeoWs)")
    hoy = dt.date.today()
    inicio = hoy - dt.timedelta(weeks=semanas // 2)
    fechas, total = {}, 0
    for s in range(semanas):
        a = inicio + dt.timedelta(weeks=s)
        b = a + dt.timedelta(days=6)
        url = (f"https://api.nasa.gov/neo/rest/v1/feed?start_date={a}&end_date={b}&api_key={API_KEY}")
        try:
            datos = obtener_json(url)
        except RuntimeError as e:
            log("   ⚠", e)
            continue
        for fecha, objetos in datos.get("near_earth_objects", {}).items():
            lista = []
            for o in objetos:
                ca = (o.get("close_approach_data") or [{}])[0]
                diam = o["estimated_diameter"]["meters"]
                lista.append({
                    "id": o.get("id"),
                    "nombre": o.get("name"),
                    "magnitud": o.get("absolute_magnitude_h"),
                    "diametroMin": f"{diam['estimated_diameter_min']:.2f}",
                    "diametroMax": f"{diam['estimated_diameter_max']:.2f}",
                    "peligroso": o.get("is_potentially_hazardous_asteroid"),
                    "fechaAcercamiento": ca.get("close_approach_date_full") or ca.get("close_approach_date"),
                    "distanciaKm": f"{float(ca.get('miss_distance', {}).get('kilometers', 0)):.0f}",
                    "velocidadKph": f"{float(ca.get('relative_velocity', {}).get('kilometers_per_hour', 0)):.0f}",
                    "url_jpl": o.get("nasa_jpl_url"),
                })
            fechas[fecha] = lista
            total += len(lista)
        log(f"   semana {a} a {b}: total acumulado {total}")
        time.sleep(0.5)
    datos = cabecera("https://api.nasa.gov/neo/rest/v1/feed", "Asteroides cercanos a la Tierra agrupados por fecha de acercamiento.")
    datos.update({"total": total, "desde": str(inicio), "hasta": str(inicio + dt.timedelta(weeks=semanas) - dt.timedelta(days=1)), "fechas": dict(sorted(fechas.items()))})
    escribir("asteroides", datos)


# ----------------------------------------------------------------- BIBLIOTECA
def buscar_biblioteca(consulta, maximo):
    """Devuelve resultados normalizados de images-api.nasa.gov (varias páginas)."""
    resultados, pagina = [], 1
    while len(resultados) < maximo and pagina <= 10:
        q = urllib.parse.quote(consulta)
        datos = obtener_json(f"https://images-api.nasa.gov/search?q={q}&media_type=image,video&page={pagina}")
        items = datos.get("collection", {}).get("items", [])
        if not items:
            break
        for it in items:
            d = (it.get("data") or [{}])[0]
            links = it.get("links") or []
            preview = next((l.get("href") for l in links if l.get("rel") == "preview"), links[0].get("href") if links else None)
            if not preview or d.get("media_type") not in ("image", "video"):
                continue
            item = {
                "nasa_id": d.get("nasa_id"),
                "tipo": "imagen" if d.get("media_type") == "image" else "video",
                "titulo": d.get("title") or "Sin título",
                "descripcion": (d.get("description") or "Sin descripción")[:600],
                "fecha": (d.get("date_created") or "")[:10],
                "centro": d.get("center"),
                "url": preview,
            }
            if item["tipo"] == "video" and it.get("href"):
                base = it["href"].replace("collection.json", "")
                carpeta = [p for p in base.split("/") if p][-1]
                item["url_video"] = f"{base}{carpeta}~orig.mp4"
            resultados.append(item)
            if len(resultados) >= maximo:
                break
        pagina += 1
    return resultados


def respaldo_desde_biblioteca(consulta, carpeta, cantidad):
    """Plan B para Tierra/Marte: imágenes reales de la biblioteca de la NASA, agrupadas por fecha."""
    fechas, total = {}, 0
    for item in buscar_biblioteca(consulta, cantidad * 2):
        if total >= cantidad or item["tipo"] != "imagen":
            continue
        local = f"{carpeta}/img/{item['nasa_id']}.jpg".replace(" ", "_")
        if guardar_imagen(item["url"], os.path.join(RAIZ, local), ancho_max=600):
            item["imagen_local"] = local
            fechas.setdefault(item["fecha"] or "sin-fecha", []).append(item)
            total += 1
    return fechas, total


def respaldo_biblioteca(por_tema):
    log("\n📚 Biblioteca")
    temas, total = {}, 0
    for tema in TEMAS_BIBLIOTECA:
        try:
            items = buscar_biblioteca(tema, por_tema)
        except RuntimeError as e:
            log("   ⚠", tema, e)
            continue
        for item in items:
            local = f"biblioteca/img/{tema}/{item['nasa_id']}.jpg".replace(" ", "_")
            if guardar_imagen(item["url"], os.path.join(RAIZ, local), ancho_max=480):
                item["imagen_local"] = local
        temas[tema] = items
        total += len(items)
        log(f"   {tema}: {len(items)} resultados")
    datos = cabecera("https://images-api.nasa.gov/search", "Resultados de la biblioteca de imágenes y videos de la NASA por tema.")
    datos.update({"total": total, "temas": temas})
    escribir("biblioteca", datos)


# ----------------------------------------------------------------- principal
def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--cantidad", type=int, default=600, help="imágenes por API para Tierra y Marte (por defecto 600)")
    p.add_argument("--por-tema", type=int, default=100, help="resultados por tema en Biblioteca (por defecto 100)")
    p.add_argument("--semanas", type=int, default=52, help="semanas de asteroides (por defecto 52)")
    p.add_argument("--solo", nargs="*", choices=["tierra", "marte", "asteroides", "biblioteca"])
    a = p.parse_args()
    if Image is None:
        log("ℹ Pillow no está instalado: las imágenes se guardarán sin reducir (pip install pillow)")
    tareas = a.solo or ["tierra", "marte", "asteroides", "biblioteca"]
    errores = []
    for t in tareas:
        try:
            {"tierra": lambda: respaldo_tierra(a.cantidad),
             "marte": lambda: respaldo_marte(a.cantidad),
             "asteroides": lambda: respaldo_asteroides(a.semanas),
             "biblioteca": lambda: respaldo_biblioteca(a.por_tema)}[t]()
        except Exception as e:  # noqa: BLE001 - que un fallo no detenga las demás APIs
            log(f"✖ {t} falló: {e}")
            errores.append(t)
    if errores:
        log("\nTerminó con errores en:", ", ".join(errores))
        sys.exit(1 if len(errores) == len(tareas) else 0)


if __name__ == "__main__":
    main()
