# Active Task

**Task:** AdSense-Neupruefung beantragen
**Started:** 2026-08-10
**Status:** BLOCKIERT — wartet auf Browser-Freigabe durch Maikel

## Fortschritt

- ✅ Ablehnungsgrund geklaert: „Richtlinienverstoesse — Minderwertige Inhalte"
- ✅ Alle inhaltlichen Ursachen behoben und live (7 Commits, siehe SESSION_STATE.md)
- ✅ Sicherheitsproblem auf den Symptomseiten behoben (Giftpflanzen entfernt)
- ✅ Haustier-Giftigkeit der 32 Zimmerpflanzen an der ASPCA geprueft
- ⏳ Antrag stellen — blockiert

## ENDERGEBNIS 2026-08-10, 14:05 — der Agent kann das NICHT uebernehmen

Nicht weiter probieren. Die AdSense-Oberflaeche liegt auf
`adsense.google.com`, und die Browser-Werkzeuge lehnen diese Domain ab:

```
navigate    -> Navigation to this domain is not allowed
read_page   -> Permission denied for reading pages on this domain
screenshot  -> Permission denied for this action on this domain
```

Das liegt NICHT an Maikels Einstellungen. Er hat die Chrome-Erweiterung
korrekt auf „Auf adsense.google.com" gestellt und war angemeldet — die
Sperre sitzt auf der Werkzeug-Seite. `www.google.com/adsense/...` laesst
sich zwar aufrufen, leitet aber sofort auf `adsense.google.com` um.

**Der Antrag muss von Maikel selbst geklickt werden.** Anleitung unten.
Kuenftige Sitzungen sollen dafuer keine Zeit mehr aufwenden.

### Anleitung fuer Maikel

1. AdSense oeffnen, links im Menue auf **Websites**
2. In der Liste **donum-dei.pages.dev** anklicken
3. Schaltflaeche **Ueberpruefung beantragen** (je nach Ansicht auch
   „Zur Ueberpruefung einreichen" oder „Erneut einreichen")
4. Bestaetigen — danach steht dort „Wird ueberprueft"

Antwort kommt per E-Mail, in der Regel nach einigen Tagen bis zwei Wochen.
Bei erneuter Ablehnung: den vollstaendigen Mailtext in den Chat geben, der
Grund steht unter „Es wurden Richtlinienverstoesse gefunden".

## Frueherer Blocker-Stand (13:50)

Zwei Dinge fehlen, beide kann nur Maikel erledigen:

**1. Chrome ist nicht bei AdSense angemeldet.**
Der geoeffnete Tab ist auf die Anmeldeseite umgeleitet worden:

```
https://adsense.google.com/adsense/login?continue=...pub-5000356216672097/sites
```

Maikel muss sich mit dem Google-Konto anmelden, dem die Publisher-ID
**pub-5000356216672097** gehoert (steht so in `public/ads.txt`).
Vermutlich `jpeter00995@gmail.com` — dasselbe Konto wie bei Cloudflare und
in der Search Console.

**Der Agent meldet sich NICHT selbst an und gibt keine Passwoerter ein.**

**2. Die Chrome-Erweiterung hat keine Freigabe fuer die Google-Domains.**

```
Permission denied for reading pages on this domain
```

Nach der Anmeldung im Tab oben rechts auf das Claude-Symbol klicken und
den Zugriff auf die Seite erlauben. Das gilt pro Domain — es kann sein,
dass sowohl `google.com` als auch `adsense.google.com` freigegeben werden
muessen.

## Current Step

Sobald die Freigabe steht:
1. Tab auslesen, Website `donum-dei.pages.dev` suchen
2. „Ueberpruefung beantragen" finden
3. **Maikel zeigen, was auf dem Bildschirm steht — dann erst klicken**
4. Ergebnis melden

Kommt ein Anmeldefenster: anhalten. Passwoerter niemals selbst eingeben.
