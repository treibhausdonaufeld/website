# Sicherheit und Staging – Härtungskonzept

Stand: 18. November 2026 · erstellt auf Anfrage von Fabian Helm

## Kurzfassung

Die Seite ist funktional in einem guten Zustand: CSP mit `default-src 'self'`, HSTS, `nosniff`,
`frame-ancestors 'none'`, Admin-Bereich hinter Authentik, Gast-Chat rendert ausschließlich über
`textContent`, Migrationen laufen beim Start. Die **Prozess- und Zugriffsebene** ist dagegen
deutlich weicher als der Code: das `main`-Repository hat keinen Schutz, der Deploy-Zugang ist ein
Personal Access Token mit `admin: true`, ausgeliefert wird ein mutabler `:latest`-Tag, und ein
Branch-Push erzeugt heute gar kein Image – Staging ist damit nicht nur konzeptionell, sondern
technisch noch nicht möglich.

Zwei Maßnahmen tragen den größten Teil des Risikos:

1. **Ruleset auf `main`** (PR-Pflicht, Pflicht-Checks, kein Force-Push, kein Bypass) – siehe
   `deploy/github-ruleset-main.json`, fertig zum Absetzen.
2. **PAT ohne `admin`** – oder besser eine GitHub App mit kurzlebigem Token pro Lauf.

Danach, in dieser Reihenfolge: Image per Digest pinnen und signieren, npm-Gates verschärfen,
Fail-open-Defaults in `compose.yaml` umdrehen, Secrets außerhalb der Reichweite des Agenten
ablegen. Das Staging-Konzept (Abschnitt 4) baut auf Schritt 1 auf, weil ohne geschützten
Default-Branch jede Staging-Abnahme umgehbar bleibt.

## 1. Befunde

Alle Befunde am 18.11.2026 gemessen, nicht abgeleitet. Die Prüfbefehle stehen in Abschnitt 7,
damit sich jeder Befund nachprüfen lässt.

### F1 – Personal Access Token mit Admin-Rechten (hoch)

`GET /repos/treibhausdonaufeld/website` mit dem Token aus dem Profil-`.env` liefert
`permissions: {admin: true, maintain: true, push: true, …}`. Der Token liegt im Klartext in
`/opt/data/profiles/website-agent/.env` (mode 600, Eigentümer `hermes`, also für den Agenten
lesbar). Mit `admin: true` umfasst er nicht nur Code, sondern auch Workflows, Repository-Secrets,
Rulesets und das Löschen des Repos. Er ist der Generalschlüssel – jeder Weg, der Code im
Agenten-Kontext ausführt, hat damit Vollzugriff.

### F2 – `main` ist praktisch ungeschützt (hoch)

`GET /repos/…/rulesets` → `200` mit leerer Liste `[]`, es existiert also kein Ruleset. Die
klassische Branch-Protection ist mit diesem Token nicht lesbar (`403 Resource not accessible by
personal access token`, es fehlt `Administration: read`).

Passend dazu die Historie: in den letzten 50 Commits auf `origin/main` sind nur 13 Merge-Commits.
Es wurde also wiederholt direkt auf `main` gepusht („add design", „update website bot name",
„Compose: Image-Name korrigiert", „Website-Chat: bei Antworten aus Matrix nur den Vornamen
zeigen"). Ein Schutz, der in der Praxis nicht greift, ist kein Schutz.

### F3 – Ausgeliefert wird ein mutabler Tag ohne Prüfung (hoch)

`compose.yaml:10` → `image: ghcr.io/treibhausdonaufeld/website:latest`. `:latest` ist kein
Versprechen, sondern ein Zeiger: wer das ghcr-Package beschreiben kann (F1 kann es), bestimmt ohne
einen einzigen Commit, was `docker compose pull` auf dem Server holt. Es gibt keinen Digest-Pin und
keine Signaturprüfung; der Deploy-Schritt ist die einzige Kontrolle und die ist menschlich.

### F4 – Ein Branch-Push baut heute kein Image (blockiert Staging)

`.github/workflows/container.yml` triggert auf `push: branches: [main]` und `pull_request`. Im
`container`-Job ist `push: ${{ github.event_name != 'pull_request' }}`, PR-Builds werden also
gebaut, aber **nicht** in die Registry geschoben. Folge: `type=ref,event=branch` erzeugt
ausschließlich `main`, und von jedem Nicht-`main`-Branch existiert kein abrufbares Image. Ohne
Trigger-Änderung gibt es kein Staging, das etwas anderes zeigen könnte als `main`.

### F5 – Der Agent kann seine eigene Allowlist erweitern (hoch)

`MATRIX_ALLOWED_USERS` (drei Haus-Adressen), `MATRIX_ALLOWED_ROOMS` (dieser Raum) und
`MATRIX_REQUIRE_MENTION=true` stehen in derselben Datei, die der Agent schreiben darf: `.env`
gehört `uid 1000 (hermes)`, `test -w` bestätigt Schreibbarkeit. Laut Hermes-Referenz wird die
Allowlist **pro Nachricht** neu gelesen – eine geänderte Zeile wäre ohne Gateway-Neustart ab der
nächsten Nachricht wirksam. Die Trennung „nur dieser Raum" ist damit eine Eigenschaft des
Verhaltens, nicht der Rechte. Das ist die ehrlichste Einzelaussage dieses Konzepts: der Agent
hält sich an die Grenze, aber er könnte sie selbst verschieben.

### F6 – Profiltrennung ist keine Dateisystemgrenze (mittel)

`/opt/data/.env` (Default-Profil, mode 600, Eigentümer `hermes`) ist für denselben Unix-User
lesbar, also auch für dieses Profil. Profile isolieren Zustand, nicht Dateizugriff. Wer im Agenten
Code ausführen kann, liest die Secrets aller Profile desselben Users – nicht nur die eigenen.

### F7 – Fail-open-Defaults in `compose.yaml` (mittel)

`DEV_ADMIN_LOGIN` defaultet auf `true` und `SESSION_SECRET`/`HMAC_SECRET` auf
`lokal-nur-zum-testen-…`. In Produktion greift Authentik – von außen geprüft: `/admin/login`
leitet auf `auth.treibhausdonaufeld.at` um, der Entwicklungs-Login ist also aus. Das ist eine
Konfiguration, die von einer vorhandenen `.env` abhängt: geht die Datei verloren oder wird ein
Service ohne `env_file` gestartet, kommt der Container mit offenem Admin-Login und öffentlich
bekanntem Session-Secret hoch, und niemand merkt es, weil die Seite normal aussieht. Der Default
muss in Richtung „zu" zeigen.

### F8 – `/health` ist öffentlich und gesprächig (niedrig)

`GET /health` liefert ohne Anmeldung `matrix.userId` (`@website:treibhausdonaufeld.at`),
`mail.configured`, `db.ok`. Kein Secret, aber Recon: bestätigt Bot-Konto, Mailanbindung und
Datenbankzustand. Für Monitoring braucht es nur `ok`.

### F9 – Prompt-Injection über den Gast-Chat (mittel)

Der Website-Chat schreibt Gastnachrichten in einen `world_readable` Matrix-Raum. Das Rendering ist
sauber (`body.textContent = m.text`, kein `innerHTML`), XSS ist dort also nicht der Weg. Die
offene Fläche ist eine andere: sobald solche Texte in einen Agenten-Kontext gelangen, sind sie
Anweisungen von außen. Heute liest kein Automatismus diesen Raum – das muss so bleiben und
aufgeschrieben sein, damit es niemand „praktisch" findet.

### F10 – Renovate merged Minor und Patch automatisch (mittel)

`renovate.json` setzt `automerge: true` für `minor`/`patch` (nicht für `0.x`), und `npm ci` führt
Install-Scripts aus (die CI braucht `npm install-scripts approve` für `esbuild` und
`better-sqlite3`). Ein kompromittiertes Paket kann damit ohne menschliche Sicht in `main` landen
und – über den `container`-Job mit `packages: write` – als Image in der Registry. Kombiniert mit
F2 ist das ein vollständiger Pfad von „Paket übernommen" zu „Code läuft auf der Website", ohne
dass je ein verdächtiger Diff gelesen wird.

### F11 – `npm audit` meldet 18 Schwachstellen, 11 davon im Produktions-Image (mittel)

`npm ci` in einem frischen Baum meldet `18 vulnerabilities (4 moderate, 14 high)`, davon bleiben
mit `--omit=dev` noch 11 high. Alle laufen über dieselbe Kette: `picomatch` (ReDoS durch
wiederholte Extglobs) über `fdir`/`tinyglobby`/`anymatch` bis hinauf zu `astro` und `vite`.
`astro` steht in `dependencies` und wird deshalb mit `npm prune --omit=dev` **nicht** aus dem
Image entfernt, obwohl die Laufzeit nur `dist/` und `server.mjs` braucht.

Einordnung, damit daraus keine Panik wird: `picomatch` ist ein Glob-Matcher im Build-Pfad. Ein
ReDoS braucht ein angreifergesteuertes Glob-Muster; in dieser Anwendung ist keines von außen
erreichbar. Der Befund ist damit ein Hygiene- und Lieferketten-Thema, kein offener Exploit – aber
er zeigt, dass das Image mehr enthält, als es braucht, und dass `npm audit fix --force` (Vorschlag:
`astro` 6, ein Major-Sprung) keine Option ist.

## 2. Maßnahmen

Priorität: **P0** = diese Woche, **P1** = diesen Monat, **P2** = bei Gelegenheit.

| Nr. | Maßnahme | Adressiert | Aufwand |
| --- | --- | --- | --- |
| M1 | Ruleset auf `main` aktivieren | F2, F10 | 10 Minuten |
| M2 | PAT entziehen, Rechte auf Contents + Pull requests (write) reduzieren; Ziel: GitHub App | F1, F6 | 1–2 Stunden |
| M3 | Image per Digest pinnen, in der CI signieren, auf dem Server verifizieren | F3 | halber Tag |
| M4 | npm-Gates: `npm audit` sichtbar machen, neue Dependencies nur mit Review, Renovate-Automerge auf `patch` begrenzen, Image von Build-Abhängigkeiten befreien | F10, F11 | 1–2 Stunden |
| M5 | Fail-closed-Defaults in `compose.yaml` | F7 | 15 Minuten |
| M6 | `.env` außerhalb der Schreibreichweite des Agenten (Owner `root`, mode `640`) | F5 | 15 Minuten, Plattformfrage |
| M7 | `/health` auf das Nötige kürzen, Details hinter Auth | F8 | 30 Minuten |
| M8 | Staging mit Abnahme-Gate (Abschnitt 4) | F2, F4, F10 | 1 Tag |
| M9 | Secret-Hygiene: `.env.bak*`-Dateien konsolidieren, `SESSION_SECRET` rotieren, Admin-Session-TTL prüfen | F7 | 30 Minuten |

### M1 – Ruleset auf `main`

`deploy/github-ruleset-main.json` ist der fertige Payload:

```bash
set -a; . /opt/data/profiles/website-agent/.env; set +a
curl -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/treibhausdonaufeld/website/rulesets \
  --data @deploy/github-ruleset-main.json
```

Enthalten: Löschen und Force-Push verboten, lineare Historie, PR-Pflicht mit einer Freigabe,
Pflicht-Checks `test` und `container` (die Check-Namen des bestehenden Workflows), keine
Bypass-Actors – auch Admins sind gebunden.

**Betriebliche Konsequenz, die vorher entschieden werden muss:** GitHub erlaubt keine
Selbstfreigabe. Wer eine PR selbst aufmacht, braucht eine zweite Person. Ist das dauerhaft nicht
gegeben, ist die realistische Variante `required_approving_review_count: 0` bei gleichen
Pflicht-Checks plus einer verbindlichen Staging-Abnahme als PR-Kommentar (Abschnitt 4.6). Das ist
schwächer als Vier-Augen, aber stärker als heute – und ehrlicher als ein Gate, das man umgeht,
sobald es eilt.

### M2 – Token verkleinern

Neuen fine-grained PAT anlegen: nur `treibhausdonaufeld/website`, Repository permissions
`Contents: Read and write` + `Pull requests: Read and write`, nichts aus `Administration`,
`Actions` oder `Secrets`, Ablauf 90 Tage. Der alte Token wird entzogen, nachdem der neue in
`.env` steht und ein Test-Push gelaufen ist.

Mittelfristig besser: GitHub App mit Installation auf genau diesem Repo. Der Agent holt dann pro
Lauf ein Token mit einer Stunde Laufzeit, und im Repo existiert kein langlebiges Geheimnis, das
man stehlen kann.

### M3 – Digest pinnen und signieren

In der CI signieren (keyless, ohne Schlüsselverwaltung):

```yaml
# container-Job, nach build-push-action
permissions:
  contents: read
  packages: write
  id-token: write        # für keyless cosign
steps:
  - uses: sigstore/cosign-installer@v3
  - run: cosign sign --yes ghcr.io/${{ github.repository }}@${{ steps.build.outputs.digest }}
```

Auf dem Server vor dem Ausrollen verifizieren, dann per Digest starten:

```bash
DIGEST=$(docker buildx imagetools inspect ghcr.io/treibhausdonaufeld/website:latest \
  --format '{{json .Manifest.Digest}}' | tr -d '"')
cosign verify ghcr.io/treibhausdonaufeld/website@$DIGEST \
  --certificate-identity-regexp 'https://github.com/treibhausdonaufeld/website/.*' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

`compose.yaml` bekommt `image: ghcr.io/treibhausdonaufeld/website@${IMAGE_DIGEST}` – der
ausgerollte Stand ist damit eine Zeichenkette, die man aufschreiben und zurückrollen kann, statt
eines Zeigers, der sich unter der Hand bewegt.

### M4 – Abhängigkeiten und Image

Drei kleine Schritte statt eines großen:

1. **Sichtbar machen:** `npm audit --omit=dev --audit-level=critical` als eigener CI-Schritt, der
   die Ausgabe in den Job-Log schreibt und nur bei `critical` fehlschlägt. Ein rotes Gate auf
   `high` wäre heute dauerhaft rot (F11) und würde nach zwei Wochen ignoriert – das ist der
   schlechtere Zustand als ein sichtbarer Bericht.
2. **Automerge eingrenzen:** in `renovate.json` `"matchUpdateTypes": ["patch"]` statt
   `["minor", "patch"]`. Minor-Updates laufen weiter automatisch als PR, aber ein Mensch sieht
   sie einmal an, bevor sie in `main` landen.
3. **Image ausdünnen:** prüfen, ob `astro` zur Laufzeit gebraucht wird. Wenn nicht, gehört es in
   `devDependencies`, dann verschwindet die Hälfte der Audit-Funde mit dem `prune`. Das ist eine
   Änderung mit Build-Risiko und gehört in einen eigenen PR mit vollem Gate-Lauf, nicht in diesen.

### M5 – Fail-closed-Defaults

In `compose.yaml` die Defaults umdrehen: `DEV_ADMIN_LOGIN: ${DEV_ADMIN_LOGIN:-false}` und die
beiden Secrets ohne Default, sodass der Container ohne gesetzte Werte gar nicht erst startet
(`SESSION_SECRET: ${SESSION_SECRET:?SESSION_SECRET fehlt}`). Der Entwicklungsbetrieb setzt die
Werte weiterhin in seiner `.env` – der Unterschied ist nur, wohin der Fehler zeigt.

### M6 – `.env` außerhalb der Agenten-Reichweite

Wenn die Plattform es zulässt: `.env` auf `root:hermes 640` und `config.yaml` gleich mit. Dann ist
F5 keine Selbstverpflichtung mehr, sondern eine Sperre. Nach dem Umbau prüfen, dass der Gateway
weiter lesen kann (`systemctl status` bzw. Log auf „permission denied" achten) – ein falsch
gesetztes Recht legt den Bot still, und das fällt erst auf, wenn jemand schreibt.

## 3. Was ausdrücklich nicht Teil des Konzepts ist

- **Keine Selbstverwaltung der Allowlist durch den Agenten.** Wer Nachrichten schicken darf, wird
  von einem Menschen in der `.env` geändert. Der Agent schlägt vor, er schreibt nicht.
- **Kein „Sicherheitsmodus" als Prompt-Text.** Eine Anweisung im Systemprompt ist keine Kontrolle;
  die Kontrollen in diesem Dokument sind Rechte, Gates und Signaturen.
- **Keine Kopie der Produktionsdatenbank nach Staging.** Begründung in 4.4.

## 4. Staging-Konzept

### 4.1 Zielbild

Drei Stufen, jede mit einer anderen Frage:

- **PR-Preview (flüchtig):** „Sieht die Änderung aus wie gedacht?" – ein Cloudflare-Tunnel auf den
  Build des Branches, Minuten Lebensdauer, keine Daten. Wird bereits so gemacht.
- **Staging (dauerhaft):** „Verhält sich die Anwendung richtig?" – erreichbar unter
  `staging.treibhausdonaufeld.at`, gebaut aus dem Branch, mit echter Datenbank, echtem
  Migrationslauf, echter Anmeldung. Hier wird abgenommen.
- **Produktion:** „Was die Leute sehen." – nur Commits, die auf `main` liegen, ausgerollt als
  signierter Digest.

Der Ablauf ist damit: Branch-Push → Image → Staging → **Abnahme durch einen Menschen** → Merge
nach `main` → Image mit Digest → Produktion zieht. Der Merge ist das Gate, Staging ist die
Begründung dafür.

### 4.2 Die eine Voraussetzung, die heute fehlt

Solange `main` ungeschützt ist (F2), ist jedes Staging-Theater: der Weg daran vorbei ist ein
`git push`. Deshalb M1 zuerst, dann Staging. Zusätzlich muss der CI-Trigger geändert werden (F4),
sonst existiert kein Image zum Ausrollen:

```yaml
on:
  push:
    branches: ['**']      # jeder Branch baut ein Image
    tags: ['v*']
  pull_request:
  workflow_dispatch:
```

und die Tags im `metadata-action` so, dass ein Stand eindeutig benannt ist:

```yaml
tags: |
  type=sha,format=long,prefix=sha-     # unveränderlich, ein Commit = ein Tag
  type=raw,value=staging,enable=${{ github.ref != 'refs/heads/main' }}
  type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
  type=semver,pattern={{version}}
```

`:staging` ist der bewegliche Zeiger für den Staging-Slot, `sha-<voll>` der unveränderliche
Beleg. Welcher Commit läuft, steht im Image-Label `org.opencontainers.image.revision` – dieselbe
Auskunft, die auch bei der Produktionsdiagnose hilft.

### 4.3 `compose.staging.yaml` (Vorschlag, noch nicht ausgerollt)

Eigenes Projekt, eigenes Volume, eigene Ports, eigenes Secret-Set, **kein** Litestream:

```yaml
# docker compose -p treibhaus-staging -f compose.staging.yaml up -d
services:
  web:
    image: ghcr.io/treibhausdonaufeld/website:staging
    restart: unless-stopped
    ports: ["4322:4321"]
    environment:
      PUBLIC_URL: https://staging.treibhausdonaufeld.at
      DATABASE_PATH: /data/treibhaus.db
      DEV_ADMIN_LOGIN: "true"          # nur hinter Basic Auth, siehe Caddy
      SESSION_SECRET: ${STAGING_SESSION_SECRET:?fehlt}
      HMAC_SECRET: ${STAGING_HMAC_SECRET:?fehlt}
      HALLO_CHAT: "false"              # kein Matrix-Bot, kein Gast-Chat nach außen
      # SMTP bewusst nicht gesetzt: Mails landen im Log (docker compose logs web)
    volumes: [staging_data:/data]
    labels:
      com.centurylinklabs.watchtower.enable: "true"

  caddy:
    image: caddy:2.10
    restart: unless-stopped
    ports: ["8080:80", "8443:443"]     # nicht 80/443: die gehören der Produktion
    environment:
      STAGING_ADDRESS: staging.treibhausdonaufeld.at
    volumes:
      - ./deploy/Caddyfile.staging:/etc/caddy/Caddyfile:ro
      - ./deploy/staging.htpasswd:/etc/caddy/staging.htpasswd:ro
      - staging_caddy:/data
    depends_on: [web]

  watchtower:
    image: containrrr/watchtower:1.7.1
    restart: unless-stopped
    command: --label-enable --interval 60 --cleanup
    volumes: [/var/run/docker.sock:/var/run/docker.sock]
    environment:
      DOCKER_API_VERSION: "1.41"

volumes:
  staging_data:
  staging_caddy:
```

`deploy/Caddyfile.staging` – Basic Auth, `noindex`, und die Weiterleitung von `www`:

```
{$STAGING_ADDRESS} {
	encode zstd gzip
	basic_auth {
		treibhaus {$2a$14$…}   # htpasswd -B -C 14, ein Konto für die Raum-AG
	}
	header {
		X-Robots-Tag "noindex, nofollow, noarchive"
		Strict-Transport-Security "max-age=300"
		-Server
	}
	reverse_proxy web:4321
}
```

Drei Punkte sind hier Absicht:

- **`DEV_ADMIN_LOGIN: "true"`** ist auf Staging richtig, weil die e2e-Suite sich über den
  Entwicklungs-Login anmeldet (`/admin/login` → „Anmelden") und Admin-Flows nur so testbar sind.
  Genau deshalb steht davor Basic Auth: der Login ist erreichbar, aber nicht für das offene Netz.
- **Eigene Secrets** statt der Produktionswerte. Ein Staging-Kompromiss darf keine
  Produktionssession fälschen können.
- **Kein Litestream, kein Matrix-Bot, kein SMTP.** Staging darf weder in den Produktions-Bucket
  schreiben noch im Haus chatten noch Mails an echte Adressen schicken.

### 4.4 Daten: leer starten, nicht kopieren

Staging startet mit einem leeren Volume; die Migrationen laufen beim Start (`src/lib/db/index.ts`),
danach legt der Boot die Räume, die Nachtruhe und den Samstagstreff an. Das ist derselbe Zustand
wie bei einem frischen Produktionsstart und damit die richtige Grundlage für Tests.

Die Produktions-SQLite darf **nicht** kopiert werden: sie enthält Buchungen mit Namen, Kontakten
und dem Gast-Chat-Verlauf. Diese Daten haben auf einem Testsystem nichts zu suchen, auch nicht
„nur kurz". Wenn ein Lauf mit realistischer Datenmenge nötig ist, dann mit einem anonymisierten
Dump (Namen und Kontakte ersetzt, Chat-Texte verworfen) – und der wird ausdrücklich als eigenes
Skript gepflegt, nicht ad hoc gezogen.

Praktisch: das Staging-Volume wird bei jedem Ausrollen zurückgesetzt
(`docker compose -p treibhaus-staging down -v`), damit die e2e-Läufe deterministisch bleiben und
Testbuchungen sich nicht über Wochen ansammeln.

### 4.5 Ausrollen ohne eingehenden Zugang

Der Server hat keinen SSH-Zugang aus der CI, und das soll so bleiben. Watchtower auf dem
Staging-Stack löst das pull-basiert: Branch-Push → CI schiebt `:staging` → Watchtower zieht
innerhalb einer Minute, weil nur die Staging-`web`-Instanz das Label trägt
(`--label-enable`). Produktion bleibt bewusst manuell: dort ist der Moment des Ausrollens eine
Entscheidung, kein Nebeneffekt.

Wenn das zu indirekt ist, ist die Alternative ein selbstgehosteter Runner auf dem Server, der auf
`workflow_run` reagiert und `docker compose -p treibhaus-staging pull web && up -d` ausführt. Das
ist expliziter, kostet aber einen dauerhaft laufenden Runner und damit eine weitere
Angriffsfläche.

### 4.6 Abnahme

Nach dem Ausrollen auf Staging, vor dem Merge:

1. **Automatisch:** `npm run test:e2e` läuft in der CI bereits gegen den lokalen Build. Zusätzlich
   ein schlanker Smoke-Test gegen die Staging-URL – eigene Config ohne `webServer`,
   `baseURL: process.env.STAGING_URL`:

   ```ts
   // playwright.staging.config.ts
   import { defineConfig } from '@playwright/test';
   export default defineConfig({
     testDir: './tests/e2e',
     testMatch: /staging-smoke\.spec\.ts/,
     use: { baseURL: process.env.STAGING_URL!, trace: 'off' },
   });
   ```

   Der Smoke-Test prüft `/`, `/ueber-uns`, `/wohnen`, `/en/`, `/buchen`, `/termine`, `/health`
   (Status 200, keine Serverfehler), dass `/_astro/*.css` ausgeliefert wird und dass die geänderte
   Seite die geänderte Zeichenkette enthält. Er prüft **nicht** Buchungslogik – die deckt die
   lokale Suite ab, und Staging soll nicht bei jedem Branch-Push Buchungen anlegen.
2. **Menschlich:** die geänderte Seite auf Staging ansehen (Link im PR-Kommentar), Dunkelmodus und
   Mobilbreite mitprüfen, und das Ergebnis als Kommentar festhalten: „auf Staging geprüft:
   <was>, <Datum>, <URL>". Der PR-Template-Text erzwingt diesen Satz nicht, aber die Freigabe
   ohne ihn ist eine bewusste Entscheidung.

Erst danach Merge. Bei `required_approving_review_count: 1` ist das die Freigabe einer zweiten
Person; in der Solo-Variante (M1) ist es der dokumentierte Eigencheck plus grüne Checks.

### 4.7 Rückweg

- **Code:** alten `sha-<voll>`-Tag ausrollen (`IMAGE_DIGEST` aus der Deploy-Historie setzen,
  `up -d`). Zehn Sekunden, keine Repo-Änderung.
- **Datenbank:** Migrationen sind vorwärtsgerichtet, es gibt keine Down-Migrationen. Ein
  Schema-Rollback heißt deshalb: Backup einspielen. Genau dafür läuft Litestream in Produktion –
  und genau deshalb gehört ein Migrationsschritt auf Staging, bevor er Produktion sieht.
- **Notfall:** `:latest` bleibt als Zeiger bestehen, aber der ausgerollte Digest steht in der
  Compose-Datei. Wer zurückrollt, ändert eine Zeile, nicht den Tag.

### 4.8 Checkliste für die Inbetriebnahme

1. M1 aktiv (Ruleset), sonst ist der Rest optional.
2. CI-Trigger erweitert, Tags wie in 4.2 – nach einem Test-Push prüfen, ob `sha-<voll>` und
   `:staging` in der Registry liegen.
3. DNS: `staging.treibhausdonaufeld.at` auf den Server, TLS über Caddy.
4. `deploy/staging.htpasswd` erzeugen (`htpasswd -B -C 14`), Datei nicht ins Repo.
5. `docker compose -p treibhaus-staging -f compose.staging.yaml up -d`, dann
   `curl -sI https://staging.treibhausdonaufeld.at/` → `401` ohne Anmeldung ist das erwartete
   Ergebnis, nicht 200.
6. `/health` auf Staging prüfen: `db.ok` true, `matrix.ok` false (so gewollt).
7. Smoke-Test gegen die URL laufen lassen, Ergebnis im PR.
8. Nach einer Woche: prüfen, ob Staging tatsächlich benutzt wurde. Wenn nicht, ist es teurer
   Ballast als Nutzen und gehört abgeschafft statt mitgeschleppt.

## 5. Reihenfolge

- **Woche 1 (P0):** M1 Ruleset, M2 Token, M5 Fail-closed-Defaults. Danach ist „niemand kommt an
  `main` vorbei" wahr, und der Deploy-Zugang ist kein Generalschlüssel mehr.
- **Woche 2 (P1):** M8 Staging inklusive CI-Trigger und Smoke-Test. Das ist der Punkt, an dem
  Änderungen zum ersten Mal vor dem Merge irgendwo laufen.
- **Woche 3 (P1):** M3 Digest und Signatur, M4 npm-Gates. Damit ist der Weg „Paket übernommen →
  Code auf der Website" nicht mehr still.
- **Laufend (P2):** M6 `.env`-Rechte, M7 `/health`, M9 Secret-Hygiene.

## 6. Offene Punkte, die nur der Betreiber entscheiden kann

1. **Ist die klassische Branch-Protection aktiv?** Mit dem vorhandenen Token nicht lesbar
   (`403`). Prüfen unter *Settings → Branches* in der GitHub-Oberfläche. Wenn dort etwas steht,
   das kein Ruleset ist: migrieren, nicht parallel pflegen.
2. **Wer ist die zweite Person für Freigaben?** Ohne sie ist M1 in der Solo-Variante.
3. **Wo läuft Staging?** Auf demselben Host (Ports 8080/8443, wie oben skizziert) oder auf einem
   zweiten Server. Derselbe Host ist billiger; ein zweiter ist die einzige Variante, in der ein
   Fehler auf Staging nicht die Produktion mitnehmen kann.
4. **Renovate-Automerge:** auf `patch` begrenzen oder ganz auf „PR ohne Automerge" stellen? Die
   Automatik ist bequem und war bisher unauffällig, aber sie ist der Pfad aus F10.
5. **Wie lange sollen Images aufbewahrt werden?** Für Rollbacks braucht es die letzten N Digests;
   die Registry hat ein Speicherlimit, das niemand aktuell beobachtet.

## 7. Prüfbefehle

```bash
# F1 – Rechte des Tokens
set -a; . /opt/data/profiles/website-agent/.env; set +a
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/treibhausdonaufeld/website | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['permissions'])"

# F2 – Rulesets (leere Liste = keiner vorhanden)
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/treibhausdonaufeld/website/rulesets

# F2 – Historie: direkte Pushes vs. Merge-Commits
git log --oneline -50 origin/main | grep -c 'Merge pull request'

# F3 / F4 – Tags und Trigger
grep -n 'image:' compose.yaml
grep -nA3 '^on:' .github/workflows/container.yml

# F5 / F6 – Schreib- und Leserechte des Agenten
id; test -w "$HERMES_HOME/.env" && echo schreibbar
cut -d= -f1 "$HERMES_HOME/.env" | grep -v '^#' | sort

# F7 – ist der Entwicklungs-Login in Produktion aus?
curl -s -o /dev/null -w '%{http_code} %{url_effective}\n' -L https://neu.treibhausdonaufeld.at/admin/login

# F8 – was /health verrät
curl -s https://neu.treibhausdonaufeld.at/health

# Nach M1 – Schutz nachweislich aktiv
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/treibhausdonaufeld/website/rulesets \
  | python3 -c "import sys,json;print([r['name'] for r in json.load(sys.stdin)])"
```
