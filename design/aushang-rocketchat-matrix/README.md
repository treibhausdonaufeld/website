# Aushang: RIP Rocketchat → Matrix/Element

A4-Aushang für den Umstieg vom Rocketchat auf Matrix/Element, November 2026.
Gebaut als Kopie der Vorlage [`../vorlage/aushang-a4.html`](../vorlage/aushang-a4.html):
Farben und Schrift unverändert aus [`../../src/styles/tokens.css`](../../src/styles/tokens.css),
Schrift Kumbh Sans aus [`../vorlage/fonts/`](../vorlage/fonts/), Logo aus [`../logo/`](../logo/).

## Dateien

- `aushang.html` – die Quelle. Im Browser öffnen, „Drucken“ → „Als PDF speichern“:
  Papier A4, Ränder **keine**, Hintergrundgrafiken **an**, Skalierung 100 %.
- `aushang.pdf` – druckfertig, eine Seite (so entstanden).
- Dunkelmodus/Bildschirm: `<html data-theme="dark">` setzen; das Skript tauscht dann
  die Marke auf [`../logo/logo-hell-dunkelmodus.png`](../logo/logo-hell-dunkelmodus.png).

## Inhalt

Hausinterner Aushang (UG IT) für alle Bewohner:innen:

- Warum: Login in unserer Form nur noch in der Enterprise-Version, die kostet; dazu langsame
  Bild-Uploads, beschränkte Push-Benachrichtigungen, Abhängigkeit von einer Firma.
- Was: Matrix als offenes Protokoll, Element als App; Vorteile inklusive Audio- und
  Videoanrufen direkt in der App.
- Fristen: bis 30.11. Rocketchat normal · ab 1.12. Read-only · bis 1.1.2027 lesbar.
- Hilfe: zwei Zeilen – Probleme bei der Umstellung in `#Computer-Hilfe`, Bugs oder fehlende
  Kanäle in `#UG IT` in Matrix.
- Grünes Band mit drei Fächern: **Installiere Matrix** (QR auf den App-Download),
  **Installationsanleitung** (QR auf das Collectives), **Hilfe?** (Installationstreffen
  Sonntag, 22.11., 9:00–12:00, Gemeinschaftsküche).

## Die zwei QR-Codes

1. **App-Download:** <https://element.io/download> – QR-Version 3, 29 Module,
   26 mm Symbol auf 32 mm weißem Feld (0,90 mm pro Modul).
2. **Installationsanleitung im Collectives:**
   <https://wir.treibhausdonaufeld.at/apps/collectives/Treibhausdonaufeld-1/Matrix-Chat-Element-Installation-15276561>
   – QR-Version 7, 45 Module, 26 mm Symbol auf 32 mm Feld (0,58 mm pro Modul).

Beide sind aus dem gerenderten Blatt zurückdekodiert. Wer die QR-Codes neu erzeugen muss:
`qrcode` (Python, `SvgPathImage`, `border=0`), Pfad inline ins Band, weißes Feld und
Ruhezone kommen aus dem CSS (3 mm Padding).

## Aufbau

Kein Footer und kein Adressblock: Der Aushang hängt im Haus, das Kontaktband schließt
die Seite ab.

## Offen

- Kein Matrix-Alias für die Kanäle `#Computer-Hilfe` und `#UG IT` bestätigt, deshalb stehen
  dort nur die Kanalnamen ohne Link.
- Der zweite QR (Collectives) hat 0,58 mm pro Modul – für den Hausdrucker okay, bei
  Plakaten in größerem Format neu skalieren (Feld ≥ 45 mm).
