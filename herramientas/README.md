# Respaldo de las APIs de la NASA

El sitio usa cuatro servicios de la NASA. Si alguno no responde, las páginas
cargan automáticamente el **respaldo local** de la carpeta `RESPALDO/` y muestran
un aviso naranja de **"Modo respaldo"** para que se sepa de dónde vienen los datos.

| API | Archivo del respaldo | Contenido |
|---|---|---|
| Tierra (EPIC) | `RESPALDO/tierra/datos.json` | ~600 imágenes de la Tierra agrupadas por fecha |
| Marte | `RESPALDO/marte/datos.json` | ~600 fotos de rovers agrupadas por sol |
| Asteroides (NeoWs) | `RESPALDO/asteroides/datos.json` | 52 semanas de asteroides agrupados por fecha |
| Biblioteca | `RESPALDO/biblioteca/datos.json` | ~100 resultados por cada uno de los 8 temas |

Todos los datos son **reales** y fueron descargados de servicios públicos de la NASA.
Las imágenes se guardan reducidas (600 px) para que el repositorio no pese demasiado.
Cada carpeta tiene `datos.json` (la API) y `datos.js` (lo mismo, para poder abrir
la página con doble clic).

## Cómo actualizar el respaldo

**Opción 1: GitHub (recomendada).** En el repositorio, entra a *Actions* →
*Respaldo NASA* → *Run workflow*. GitHub descarga todo y lo sube a la rama.

**Opción 2: en tu computador.**

```bash
pip install pillow
python herramientas/descargar_respaldo.py
```

Opciones: `--cantidad 600` (Tierra y Marte), `--por-tema 100` (Biblioteca),
`--semanas 52` (Asteroides), `--solo tierra marte` (solo algunas APIs).

## Orden en que se busca cada dato

1. La API real de la NASA.
2. Solo Marte: la API comunitaria `rovers.nebulum.one`, porque la API oficial de
   fotos de Marte fue retirada (con un aviso de fuente alternativa).
3. El respaldo local de `RESPALDO/` (aviso naranja de "Modo respaldo").
4. Si tampoco hay respaldo, el mensaje de "fuera de servicio" de siempre.
