# PDF No-Black Color Changer

Browserbasierte Web-App zum Ersetzen schwarzer und sehr dunkler Pixel in PDFs durch dunkle Ersatzfarben. Die Verarbeitung läuft lokal im Browser. Normale Nutzer brauchen kein Python und keine Kommandozeile.

## Was macht das Tool?

- Rendert jede PDF-Seite im Browser mit PDF.js
- Liest die Pixel über Canvas/ImageData aus
- Ersetzt schwarze, fast schwarze und dunkelgraue Bereiche durch dunkle Ersatzfarben
- Exportiert die bearbeiteten Seiten wieder als rasterisierte PDF mit pdf-lib

## Für wen ist das gedacht?

- Für normale Nutzer, die eine PDF optisch ohne reines Schwarz ausgeben möchten
- Für Anwender, die keine Python-Installation möchten
- Für einfache lokale Nutzung ohne Server und ohne Build-System

## Nutzung

1. `index.html` im Browser öffnen
2. PDF auswählen oder per Drag & Drop ablegen
3. Modus und Einstellungen wählen
4. Auf `PDF umwandeln` klicken
5. Die neue PDF mit `Umgewandelte PDF herunterladen` speichern

Wenn dein Browser lokale `file://`-Skripte oder WebAssembly blockiert, öffne die Seite über einen kleinen lokalen Webserver im Projektordner:

```bash
python3 -m http.server 4173
```

Dann im Browser `http://127.0.0.1:4173/index.html` aufrufen.

## Wichtige Hinweise

- Höhere Qualitätsstufen erzeugen größere Dateien und brauchen mehr Zeit
- Die Ausgabe ist rasterisiert, daher ist Text nach der Umwandlung meist nicht mehr als echter PDF-Text auswählbar
- Das Tool verändert RGB-Farben optisch im PDF
- Es kann nicht garantieren, dass jeder Druckertreiber wirklich keine schwarze Patrone nutzt, weil Druckertreiber und Farbmanagement Farben intern neu mischen können

## No-Black-Modus

Der Spezialmodus `Drucker hat keine schwarze Farbe - alles außer Schwarz verwenden` ersetzt dunkle Inhalte deutlich aggressiver. Er ist für eine optische Annäherung gedacht, nicht für eine technische Garantie auf Tintenkanal-Ebene.

## Entwickler-Hinweis

- Die Farblogik basiert auf dem ursprünglichen Python-Prototyp `pdf-color-changer.py`
- Die Hauptbedienung ist jetzt vollständig browserbasiert
- Eine Python-CLI kann optional als ergänzende Variante bestehen bleiben
- Pyodide wäre für Experimente mit Python im Browser möglich, ist hier aber bewusst **nicht** die Hauptlösung

## Dateien

- `index.html`
- `style.css`
- `app.js`
- `README.md`

Optional kann `lib/` lokale Bibliotheksdateien enthalten, damit die Seite ohne Server direkt aus dem Dateisystem läuft.
