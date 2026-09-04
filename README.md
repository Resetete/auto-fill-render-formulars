# KiLa Hildegarten — Formulare

Diese Web-App ermöglicht es Eltern und dem KiLa-Vorstand, wichtige KiLa-Formulare digital auszufüllen und anschließend als PDF herunterzuladen, auszudrucken und zu unterschreiben.

Die App ist als statische Webanwendung aufgebaut und kann über GitHub Pages betrieben werden.

## Funktionen

* Übersicht über die verfügbaren Formulare
* Formulare digital ausfüllen und als PDF generieren
* Unterstützung für ausfüllbare PDF-Formulare (AcroForms)
* Automatische Vorbefüllung von Formularen über einen personalisierten Link
* Abruf der Vorbefüllungsdaten über einen Cloudflare Worker

## Datenschutz

Die PDF-Erstellung erfolgt vollständig im Browser.

Bei der automatischen Vorbefüllung wird lediglich ein personalisierter Token an den Cloudflare Worker übermittelt. Der Worker ruft anhand dieses Tokens die benötigten Daten aus der Verwaltungssoftware ab und gibt nur die für das jeweilige Formular benötigten Informationen an die Web-App zurück.

Die ausgefüllten Formulardaten werden von dieser Web-App nicht gespeichert.

## Technik

* Statische HTML/CSS/JavaScript-Anwendung
* Betrieb über GitHub Pages möglich
* PDF-Erstellung und Bearbeitung vollständig im Browser
* Verwendung von AcroForm-PDF-Vorlagen
* Vorbefüllung von Formularen über einen personalisierten Token
* Cloudflare Worker als Vermittlungsschicht zwischen Web-App und Verwaltungssoftware
* Datenübertragung zur Vorbefüllung erfolgt nur bei Bedarf

## Deployment

Die Anwendung kann direkt als statische Website, beispielsweise über GitHub Pages, bereitgestellt werden.

### Lokale Entwicklung

Für einen lokalen Test kann ein einfacher HTTP-Server verwendet werden:

```bash
python3 -m http.server 8000
```

Anschließend kann die Anwendung beispielsweise unter `http://localhost:8000/vertrag.html` geöffnet werden.

## Hinweise für die Entwicklung

Die PDF-Vorlagen verwenden benannte AcroForm-Felder. Die Feldnamen der PDF-Vorlagen müssen mit den im JavaScript erwarteten Feldnamen übereinstimmen.

Die automatische Vorbefüllung verwendet einen personalisierten Token. Der Token selbst enthält keine Formulardaten, sondern dient zur Zuordnung des Formulars zu einem Datensatz in der angebundenen Verwaltungssoftware.

Interne Konfigurationen, konkrete Datenzuordnungen, Zugangsdaten und Wartungsinformationen sind nicht Bestandteil dieser öffentlichen README.


## License & Credits
Developed by Theresa Mannschatz for Kinderladen Kila Hildegarten e.V. https://theresamannschatz.design © 2026 — All rights reserved.
