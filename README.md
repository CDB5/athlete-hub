# Athlete Hub

Athlete Hub is een mobiele sportagenda en trainingslogboek voor sporters. Plan sessies, houd sets en persoonlijke records bij, en volg voeding, herstel en sprongtests. Het optionele tienwekenprogramma **Vertical Jump** is gericht op sprongkracht voor volleybal.

**[Open de live webapp](https://cdb5.github.io/athlete-hub/)**

![Dashboard van Athlete Hub met een geplande sessie en snelle invoer](screenshots/athlete-hub.jpg)

## Gebruiken

- Open op je telefoon en kies **Installeer Athlete Hub** voor de stappen op jouw toestel.
- Het programma zet de nulmeting automatisch op de eerste maandag en de eindtest op woensdag in de taperweek. Op die dagen kun je het protocol via **Info** lezen en je resultaat invoeren.
- **Over mij** bevat je profiel, lengte, gewicht en sprongmetingen met hun geschiedenis. De voedingsstartdoelen onder **Voeding** kun je afstemmen op je herstel en gewichtstrend.
- De app slaat je gegevens lokaal op in IndexedDB. Via **Meer → Instellingen** kun je een JSON-back-up downloaden, terugzetten of je invoer wissen.
- Ga je naar een ander toestel of een ander webadres? Exporteer eerst een back-up op het oude toestel of adres en importeer ze daarna op het nieuwe.
- Meld bugs of suggesties via [GitHub Issues](https://github.com/CDB5/athlete-hub/issues). Houd persoonlijke gegevens en back-ups privé.

## Publiceren

GitHub Pages serveert de hoofdmap van `main`. De app gebruikt relatieve bestandspaden zodat ze ook onder `/athlete-hub/` werkt. De service worker bewaart HTML, CSS, JavaScript en pictogrammen voor offline heropenen. Barcodezoekopdrachten en de eerste download van OCR-bestanden vereisen internet.
