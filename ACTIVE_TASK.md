# Active Task

**Task:** AdSense-Neupruefung — Antwort von Google abwarten
**Started:** 2026-08-10
**Status:** WARTEN — Antrag gestellt, nichts weiter zu tun

## Was erledigt ist

Maikel hat den Antrag am 2026-08-10 selbst gestellt. Stand in der
AdSense-Oberflaeche:

```
donum-dei.pages.dev
  ✅ Inhaberschaft der Website bestaetigen
  ✅ Ueberpruefung angefordert
     Uhrzeit der Anfrage: 10. Aug. 2026, 09:12
     "Ihre Website wird von uns ueberprueft. Das dauert in der Regel
      einige Tage. Vereinzelt kann der Vorgang jedoch auch zwei bis
      vier Wochen in Anspruch nehmen."
```

Vorher wurden alle Ursachen der ersten Ablehnung behoben — acht Commits,
alles live und nachgemessen. Details in SESSION_STATE.md.

## Naechster Schritt

Auf die E-Mail von Google warten. Sie kommt an das Konto, dem die
Publisher-ID pub-5000356216672097 gehoert.

**Bei Zusage:** nichts weiter noetig, Anzeigen laufen an.

**Bei erneuter Ablehnung:** den vollstaendigen Mailtext in den Chat geben.
Der entscheidende Teil steht unter „Es wurden Richtlinienverstoesse
gefunden". Danach gezielt pruefen, was Google diesmal nennt — nicht raten.

## Wichtig fuer den naechsten Agenten

**Der AdSense-Antrag laesst sich nicht automatisieren.** Getestet am
2026-08-10 mit angemeldetem Chrome und korrekt gesetzter Erweiterungs-
Freigabe:

```
navigate    -> Navigation to this domain is not allowed
read_page   -> Permission denied for reading pages on this domain
screenshot  -> Permission denied for this action on this domain
```

Die Sperre gilt fuer `adsense.google.com` und liegt auf der Werkzeug-Seite,
nicht an Maikels Einstellungen. `www.google.com/adsense/...` laesst sich
aufrufen, leitet aber sofort auf die gesperrte Domain um.

Also: nicht erneut versuchen. Wenn dort etwas geklickt werden muss, bekommt
Maikel eine Klick-Anleitung — Menue **Websites** → **donum-dei.pages.dev** →
Schaltflaeche **Ueberpruefung beantragen**.
