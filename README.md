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

1. **Repository klonen:**

```bash
git clone https://github.com/nwawrzyniak/gym-booking.git
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

Erstelle eine `.env`-Datei. Hier ist eine Beispiel-`.env`:

```yaml
# Application Settings
NODE_ENV=production
PORT=3000
PROTOCOL=https
SESSION_SECRET=there-should-be-a-very-long-and-very-random-string-here
DOMAIN=gym.example.com

# Email Configuration
ADMIN_EMAIL=mail@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=mail@example.com
SMTP_PASS=YourSMTPPassword

# Traefik Configuration
TRAEFIK_ENABLE=true
TRAEFIK_ENTRYPOINTS=websecure
TRAEFIK_TLS=true
TRAEFIK_PORT=3000
```

4. **Traefik-Netzwerk erstellen** (falls noch nicht vorhanden):

```bash
docker network create traefik-network
```

5. **Anwendung starten:**

```bash
docker compose up -d --build
```

6. **Logs prüfen:**

```bash
docker compose logs -f
```

## Verwendung

### Erster Start

1. Öffne `https://gym.example.com` im Browser
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
docker compose down --remove-orphans
```

### Daten sichern:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

## Sicherheitshinweise

- Verwende ein sicheres `SESSION_SECRET` in der `.env`
- Verwende sichere SMTP-Credentials
- Stelle sicher, dass Traefik korrekt konfiguriert ist
- Sichere regelmäßig das `data`-Verzeichnis

## Troubleshooting

### E-Mails werden nicht versendet:
- Prüfe SMTP-Credentials in der `.env`
- Prüfe Logs: `docker compose logs gym-app`
- Teste SMTP-Verbindung zum Server

### Traefik findet die Anwendung nicht:
- Prüfe ob das Netzwerk `traefik-network` existiert
- Prüfe den Abschnitt "Traefik Configuration" in der `.env`
- Prüfe die Traefik-Logs

### Daten gehen verloren:
- Stelle sicher, dass `./data` als Volume gemountet ist
- Prüfe Dateiberechtigungen im data-Verzeichnis

## Anpassungen

## Support

Bei Problemen oder Fragen erstelle ein Issue im Repository.

## Lizenz

MIT License
