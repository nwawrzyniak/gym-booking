# Trainingsraum Buchungssystem

Ein NodeJS-basiertes Buchungssystem für einen Trainingsraum mit Laufband-Tracking und Rangliste.

## Features

- **Benutzerregistrierung** mit Admin-Bestätigung per E-Mail
- **IP-Blockierung** für unerwünschte Registrierungen
- **Raumbuchung** mit Zeitslot-Verwaltung
- **Training-Tracking** (Dauer und zurückgelegte km)
- **Rangliste** nach gelaufenen Kilometern
- **Responsive Design** für Desktop und Mobile

## Voraussetzungen

- Docker und Docker Compose
- Traefik als Reverse Proxy (bereits konfiguriert)
- SMTP-Server für E-Mail-Versand

## Installation

1. **Projektstruktur erstellen:**

```bash
mkdir gym-booking && cd gym-booking
```

2. **Dateien erstellen:**

Erstelle folgende Verzeichnisstruktur:

```
gym-booking/
├── compose.yml
├── Dockerfile
├── package.json
├── server.js
├── views/
│   ├── index.ejs
│   ├── register.ejs
│   ├── login.ejs
│   ├── dashboard.ejs
│   ├── book.ejs
│   ├── bookings.ejs
│   ├── leaderboard.ejs
│   └── partials/
│       └── nav.ejs
├── public/
│   └── style.css
└── data/  (wird automatisch erstellt)
```

3. **Environment-Variablen konfigurieren:**

Erstelle eine `.env`-Datei mit folgenden Werten:

```yaml
- SMTP_HOST=dein-smtp-server.de
- SMTP_PORT=587
- SMTP_USER=mail@nwawsoft.cloud
- SMTP_PASS=dein-smtp-passwort
- SESSION_SECRET=generiere-einen-langen-zufälligen-string
```

4. **Traefik-Netzwerk erstellen** (falls noch nicht vorhanden):

```bash
docker network create traefik-network
```

5. **Anwendung starten:**

```bash
docker compose up -d
```

6. **Logs prüfen:**

```bash
docker compose logs -f
```

## Verwendung

### Erster Start

1. Öffne `https://gym.nwawsoft.cloud` im Browser
2. Klicke auf "Registrieren"
3. Fülle das Registrierungsformular aus
4. Der Admin erhält eine E-Mail mit folgenden Optionen:
   - **Akzeptieren**: Benutzer wird freigeschaltet
   - **Ablehnen**: Registrierung wird abgelehnt
   - **IP-Adresse blockieren**: IP wird blockiert und Registrierung abgelehnt

### Nach der Freigabe

1. Mit E-Mail und Passwort einloggen
2. Im Dashboard können folgende Aktionen durchgeführt werden:
   - **Raum buchen**: Zeitslot für Training reservieren
   - **Training abschließen**: Tatsächliche Trainingszeit und km eintragen
   - **Rangliste ansehen**: Vergleich mit anderen Nutzern

## Datenstruktur

Alle Daten werden persistent im `./data`-Verzeichnis gespeichert:

- `users.json` - Freigegebene Benutzer
- `pending_users.json` - Wartende Registrierungen
- `bookings.json` - Raumbuchungen
- `training_sessions.json` - Abgeschlossene Trainingseinheiten
- `blocked_ips.json` - Blockierte IP-Adressen

## Wartung

### Logs anzeigen:
```bash
docker compose logs -f gym-app
```

### Container neu starten:
```bash
docker compose restart
```

### Anwendung stoppen:
```bash
docker compose down
```

### Daten sichern:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

## Sicherheitshinweise

- Ändere unbedingt `SESSION_SECRET` in der compose.yml
- Verwende sichere SMTP-Credentials
- Stelle sicher, dass Traefik korrekt konfiguriert ist
- Sichere regelmäßig das `data`-Verzeichnis

## Troubleshooting

### E-Mails werden nicht versendet:
- Prüfe SMTP-Credentials in der compose.yml
- Prüfe Logs: `docker compose logs gym-app`
- Teste SMTP-Verbindung zum Server

### Traefik findet die Anwendung nicht:
- Prüfe ob das Netzwerk `traefik-network` existiert
- Prüfe Traefik-Labels in der compose.yml
- Prüfe Traefik-Logs

### Daten gehen verloren:
- Stelle sicher, dass `./data` als Volume gemountet ist
- Prüfe Dateiberechtigungen im data-Verzeichnis

## Anpassungen

### Domain ändern:
Ersetze in der `compose.yml`:
```yaml
- "traefik.http.routers.gym.rule=Host(`deine-domain.de`)"
```

### Port ändern:
Ändere in der `compose.yml`:
```yaml
- PORT=3000  # <- hier
```

## Support

Bei Problemen oder Fragen erstelle ein Issue im Repository.

## Lizenz

MIT License
