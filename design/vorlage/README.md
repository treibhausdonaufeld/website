# Vorlage: Aushänge & weitere Designs

Verbindliche Grundlage für alles, was außerhalb der Website gestaltet wird – Aushänge
im Stiegenhaus, Plakate fürs Viertel, Flyer, Social-Motive, Beschilderung.

**Farben und Schrift werden nicht neu erfunden.** Sie kommen aus dem Markenblatt
[`../canvas/Marke.dc.html`](../canvas/Marke.dc.html) und den Tokens in
[`../../src/styles/tokens.css`](../../src/styles/tokens.css). Die Palette und die
Regeln stehen in [`../README.md`](../README.md#farben).

## Dateien

- `aushang-a4.html` – A4-Hochformat (210 × 297 mm), druckfertig, ein Blatt.
- `fonts/kumbh-sans-latin-wght-normal.woff2`, `fonts/kumbh-sans-latin-ext-wght-normal.woff2`
  – Kumbh Sans als Variable Font, selbst gehostet, damit die Datei offline funktioniert.
- `fonts/KumbhSans-OFL.txt` – Lizenz (SIL Open Font License 1.1).

## So entsteht ein Aushang

1. `aushang-a4.html` kopieren, z. B. nach `design/<thema>/aushang.html`, damit die
   Vorlage unverändert bleibt.
2. Platzhalter ersetzen: alles in `[eckigen Klammern]` und alles, was
   `<mark class="todo">prüfen</mark>` trägt. Keine Zahl und keinen Termin erfinden –
   offene Angaben bleiben markiert und werden nachgefragt.
3. Im Browser öffnen, „Drucken“ → „Als PDF speichern“: Papier A4, Ränder **keine**,
   Hintergrundgrafiken **an**, Skalierung 100 %.
4. Am PDF prüfen: eine Seite, nichts abgeschnitten, Schrift eingebettet.

## Regeln, die im Template schon greifen

- **Schrift:** nur Kumbh Sans. Überschriften ExtraBold 800, Fließtext Regular 400
  und nie unter 16 px bzw. 10 pt auf Papier.
- **Grün `#5D7A10`** für Logo, Links, Icons und das Kontaktband „Sag hallo“ –
  sonst nie als große Fläche, nie auf Sand.
- **Holunder `#4A2C7A`** für Buttons und Hervorhebungen, immer mit weißer Schrift.
- **Holunderblüte `#ECE6F4`** nur als Fläche, darauf immer dunkle Schrift.
- **Papier `#FAF8F3`** als Grund, **Sand `#F0ECE2`** für ruhige Abschnitte,
  **Tinte `#1E1C19`** für Text, **Stein `#5F5A50`** für Nebentext.
- Großflächige Volltonflächen sparsam – Aushänge hängen oft auf grauem Papier und
  sollen auch mit dem Hausdrucker lesbar bleiben.

## Varianten

- **Bildschirm/Dunkelmodus:** `<html data-theme="dark">` setzen – dieselben Tokens,
  hellgrünes Logo (`../logo/logo-hell-dunkelmodus.png`) statt des grünen.
- **Querformat oder andere Formate:** nur `@page { size: … }` und die Maße von
  `.sheet` ändern, nicht die Farben und Schriftgrößen-Logik.
- **Ohne Logo-Datei:** die Bildmarke allein liegt als Vektor in
  [`../logo/bildmarke.svg`](../logo/bildmarke.svg).

## Grenzen der Vorlage

- Der QR-Platzhalter ist bewusst leer (gestrichelt). Erst ersetzen, wenn ein echter
  Link feststeht – kein QR-Code auf eine Seite, die es noch nicht gibt.
- Keine Fotos einbetten, solange die Bildrechte nicht geklärt sind; gestrichelte
  Flächen wie in den Entwürfen sind der ehrliche Platzhalter.
