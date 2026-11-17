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
- Was: Matrix als offenes Protokoll, Element als App; Vorteile in einem Satz.
- Fristen: bis 30.11. Rocketchat normal · ab 1.12. Read-only · bis 1.1.2027 lesbar.
- Zu tun: Element jetzt installieren, Wichtiges in die Collectives oder den neuen Chat kopieren.
- Installationstreffen: Sonntag, 22.11., 9:00–12:00, Gemeinschaftsküche (2. OG).

Der QR-Code im Kontaktband zeigt auf <https://element.io/download> (App-Download).

## Offen

- Die Installationsanleitung liegt im Collectives und hat (noch) keine öffentliche URL –
  im Aushang steht daher nur „Anleitung im Collectives“. Sobald es einen Link gibt:
  QR-Code neu erzeugen und Bandtext auf den Link umstellen.
- Kein Matrix-Alias für den Kanal #Computer-Hilfe bestätigt, deshalb steht dort nur der
  Rocketchat-Kanal.
