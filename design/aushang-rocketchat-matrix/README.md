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

- Warum: Login in unserer Form nur noch in der Enterprise-Version, die viel kostet.
- Was: Matrix als offenes Protokoll, Element als App; Vorteile inklusive Audio- und
  Videoanrufen direkt in der App – darum die Bitte, die App zu installieren.
- Fristen: bis 30.11. Rocketchat normal · ab 1.12. Read-only · bis 1.1.2027 lesbar.
- Hilfe: ein Satz – bei Problemen im Kanal `#Computer-Hilfe` fragen.
- Installationstreffen: Sonntag, 22.11., 9:00–12:00, Gemeinschaftsküche (2. OG).

Der QR-Code im Kontaktband zeigt auf die Installationsanleitung im Collectives:
<https://wir.treibhausdonaufeld.at/apps/collectives/Treibhausdonaufeld-1/Matrix-Chat-Element-Installation-15276561>
(QR-Version 7, 45 Module, 30 mm Symbol auf 36 mm weißem Feld – Module 0,67 mm).

## Aufbau

Kein Footer und kein Adressblock: Der Aushang hängt im Haus, das Kontaktband schließt
die Seite ab.

## Offen

- Kein Matrix-Alias für den Kanal `#Computer-Hilfe` bestätigt, deshalb steht dort nur der
  Kanalname ohne Link.
