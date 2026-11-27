# Accounts en SQL voor Athlete Hub

De website blijft op GitHub Pages. Supabase levert PostgreSQL, de Data API, Auth en één serverfunctie voor aanmelden met een gebruikersnaam. De frontend bevat uitsluitend een publieke project-URL en **publishable key**. Een secret key, service-role key, databasewachtwoord of beheertoken hoort nooit in de website of GitHub.

## 1. Project maken

Maak in je eigen Supabase-account een project `athlete-hub`, bij voorkeur in een Europese regio. Bewaar het databasewachtwoord zelf. Laat de Data API aan. Automatische API-toegang voor nieuwe tabellen mag uit; het onderstaande script geeft expliciet de benodigde rechten. Automatische RLS mag aan; het script schakelt RLS ook zelf in.

## 2. SQL uitvoeren

Open **SQL Editor → New query**. Kopieer het volledige bestand [202611270001_accounts.sql](migrations/202611270001_accounts.sql), inclusief `begin` en `commit`, en voer het één keer uit. Gebruik een nieuw, aan Athlete Hub gewijd project. Het script maakt tabellen, views, policies en functies en is geen herhaald uitvoerbaar importbestand. Controleer na uitvoering in Table Editor of `profiles` en `athlete_records` bestaan.

Bij een SQL-fout wordt de transactie teruggedraaid. Voer het script niet opnieuw uit nadat het al succesvol is uitgevoerd; toekomstige wijzigingen krijgen een nieuwe migratie.

## 3. Aanmelden en bevestigingsmail instellen

Ga naar **Authentication → URL Configuration**:

- **Site URL:** `https://cdb5.github.io/athlete-hub/`
- Voeg dezelfde volledige URL toe aan de toegestane redirect URLs.
- Voor een lokale test voeg je ook je exacte localhost-URL toe, bijvoorbeeld `http://localhost:8000/`.

Laat bij de e-mailprovider **Confirm email** aanstaan en stel een minimale wachtwoordlengte van 12 tekens in. Bij registratie verzamelt Athlete Hub een gebruikersnaam, e-mail en wachtwoord. Het wachtwoord wordt door Supabase Auth verwerkt; de app heeft geen eigen wachtwoordtabel. Gebruikersnamen worden in kleine letters opgeslagen en zijn uniek.

De app is alleen toegankelijk na aanmelding met een bevestigd e-mailadres. Er is geen gastmodus. De navigatie en formulieren voor trainings- en voedingsgegevens blijven afgesloten zonder dit account. Na registratie verschijnt een pop-up met de bevestigingsstappen, een resend-knop met wachttijd en een knop om naar aanmelden terug te gaan. Fouten bij aanmelden, registratie, wachtwoordherstel en het opnieuw sturen van een mail worden als rode alerts getoond.

**Mailbezorging:** de ingebouwde Supabase-maildienst is bedoeld voor eerste tests met geautoriseerde teamadressen. Voor registratie en wachtwoordherstel voor andere gebruikers moet je een eigen SMTP-provider koppelen via **Authentication → SMTP Settings**. Zonder die instelling kan de code correct zijn terwijl bevestigingsmails naar andere personen geweigerd worden. Schakel e-mailbevestiging niet uit om dat te omzeilen. [Officiële SMTP-uitleg](https://supabase.com/docs/guides/auth/auth-smtp).

## 4. Serverfunctie voor gebruikersnamen

Supabase Auth ondersteunt van zichzelf wachtwoorden met een e-mail of telefoonnummer. De functie `username-login` zoekt een gebruikersnaam uitsluitend op de server op en laat Auth vervolgens het wachtwoord verifiëren. De browser krijgt geen publiek e-mailzoekregister.

Open **Edge Functions** en maak via de editor een functie met de exacte naam `username-login`. Vervang de voorbeeldcode door [functions/username-login/index.ts](functions/username-login/index.ts) en deploy de functie. Zet bij deze functie **Verify JWT** uit: een nog niet aangemelde gebruiker heeft nog geen sessietoken. Het bestand `config.toml` bevat dezelfde instelling voor gebruik met de CLI.

De functie gebruikt de door Supabase beschikbaar gestelde serverkeys. Nieuwe projecten gebruiken `SUPABASE_SECRET_KEYS`; de legacy service-role-variabele wordt ook ondersteund. Als je project een afwijkende configuratie heeft, kun je een serverkey als `ATHLETE_SECRET_KEY` instellen via **Edge Functions → Secrets**. Plak die sleutel uitsluitend daar.

Het toegestane website-origin is standaard `https://cdb5.github.io`. Voor een eigen domein of lokale tests stel je de functie-secret `ALLOWED_ORIGINS` in, bijvoorbeeld:

```text
https://cdb5.github.io,http://localhost:8000
```

Een origin bevat een protocol, host en eventueel poort, geen pad zoals `/athlete-hub/`. Deze CORS-instelling vervangt de controle van het wachtwoord en de databankregels niet. De functie begrenst aanmeldpogingen per IP en gebruikersnaamcombinatie; Supabase Auth behoudt daarnaast zijn eigen limieten. Aanmelden met e-mail werkt via de gewone Auth-API.

## 5. Website koppelen

Open in het project de **Connect**-dialoog of **Settings → API Keys**. Neem de project-URL en de **publishable key** (`sb_publishable_...`) over in `cloud-config.js`:

```javascript
window.ATHLETE_CLOUD_CONFIG = {
  url: 'https://JOUW-PROJECT.supabase.co',
  publishableKey: 'sb_publishable_JOUW-PUBLIEKE-SLEUTEL',
};
```

Deze publieke sleutel mag met de site mee naar GitHub. De toegang tot persoonlijke gegevens wordt afgeschermd door aangemelde sessies en Row Level Security. [Officiële uitleg over sleutels](https://supabase.com/docs/guides/api/api-keys).

Publiceer daarna zelf de sitebestanden via GitHub. Open **Meer → Account en synchronisatie**, registreer je eigen account, bevestig je e-mail en meld je aan. Kies **Lokale gegevens toevoegen** als je de eerdere gegevens van dit toestel in je account wilt overnemen. Op je gsm meld je je aan met hetzelfde account. Je kunt de gesynchroniseerde aantallen en eventuele verschillen op het accountscherm controleren.

## Datamodel en SQL leren

Er wordt één database gebruikt met een `user_id` op iedere gegevensrij. Een aparte fysieke database per gebruiker is hiervoor niet nodig.

| Onderdeel | Functie |
| --- | --- |
| `auth.users` | Accounts en authenticatie, beheerd door Supabase Auth |
| `public.profiles` | Eén unieke gebruikersnaam per account; `id` verwijst naar `auth.users.id` |
| `public.athlete_records` | Een rij per product, maaltijd, set, recept, meting of instelling |
| `public.my_products` | SQL-view van bewaarde producten met direct bruikbare kolommen |
| `public.my_meals` | SQL-view van maaltijden met berekende kcal en eiwit per ingevoerde portie |
| `public.my_training_sets` | SQL-view van trainingssets |
| `public.athlete_login_limits` | Technische tellers voor de serverfunctie; niet leesbaar door gebruikers |

De primaire sleutel van een record is `(user_id, collection, scope, id)`. `collection` is het soort item, `scope` bijvoorbeeld een datum en `id` het vaste item-ID. De inhoud staat in PostgreSQL `JSONB`, zodat de bestaande dagboeken en nieuwe soorten metingen zonder gegevensverlies meekunnen. Dit is een flexibele eerste versie; de views geven gewone SQL-kolommen. Later kunnen onderdelen naar verder genormaliseerde tabellen worden omgezet.

De SQL Editor draait als beheerder en kan meer zien dan een gewone appgebruiker. Onderstaande voorbeelden tonen daarom een filter op gebruikersnaam. Een appgebruiker krijgt via RLS uitsluitend zijn eigen rijen.

Producten van één account:

```sql
select p.name, p.brand, p.kcal_per_100, p.protein_per_100
from public.my_products p
join public.profiles u on u.id = p.user_id
where u.username = 'jouw_gebruikersnaam'
order by p.name;
```

Dagtotalen van voeding, met `JOIN`, `SUM` en `GROUP BY`:

```sql
select m.day, sum(m.kcal) as kcal, sum(m.protein) as eiwit
from public.my_meals m
join public.profiles u on u.id = m.user_id
where u.username = 'jouw_gebruikersnaam'
group by m.day
order by m.day desc;
```

Het actieve programma staat als apart instellingsrecord:

```sql
select u.username, r.value ->> 'start' as startdatum,
       r.value ->> 'enabled' as actief
from public.athlete_records r
join public.profiles u on u.id = r.user_id
where r.collection = 'meta' and r.id = 'program' and not r.deleted;
```

## Synchronisatie en beheer

- Een wijziging wordt eerst atomisch in de lokale accountcache en outbox opgeslagen. Daarna verstuurt de app haar naar PostgreSQL. De status geeft aan of er nog wijzigingen wachten.
- Ieder account heeft een eigen IndexedDB-databank op het toestel. Zonder aanmelding zijn de apponderdelen afgesloten en wordt geen gastlogboek getoond. Een oorspronkelijke lokale databank uit een vorige versie blijft bewaard en kan na aanmelding op verzoek worden overgenomen.
- Een `version` en `mutation_id` voorkomen stilzwijgend overschrijven bij wijzigingen aan hetzelfde item en maken het veilig een request opnieuw te sturen. Bij een verschil kies je de lokale of online versie. Losse items van verschillende toestellen kunnen samenkomen.
- Verwijderingen blijven als technische markeringen bestaan zodat een oud offline toestel geen verwijderde gegevens terugzet. Een back-up terugzetten of trainingsgegevens wissen in een account wordt ook naar andere toestellen gesynchroniseerd.
- De app synchroniseert na invoer, bij opnieuw openen/focus, na het terugkeren van internet en ongeveer iedere 30 seconden wanneer ze zichtbaar is. **Nu synchroniseren** start het direct. Een offline invoer is pas op andere toestellen beschikbaar nadat ze is verzonden.
- Afmelden verwijdert de lokale accountcache niet; niet-verzonden invoer blijft daarin bewaard. Gebruik op een gedeelde computer een eigen browserprofiel. Een cache is geen afzonderlijk versleutelde kluis.
- Voor volledige accountverwijdering verwijdert de projectbeheerder de betreffende gebruiker in **Authentication → Users**. De foreign keys verwijderen de bijbehorende accountrecords via `on delete cascade`. Dit is een definitieve beheerdersactie, geen stap bij het instellen van de site.

De website bevat het vastgepinde Supabase JS SDK 2.119.2 met de MIT-licentie onder `vendor/supabase`. De SQL-isolatie en versiecontroles zijn lokaal getest op PostgreSQL via PGlite; de browserflow is getest met de echte SDK en een synthetische API. Registratie, echte mailbezorging en de gedeployde Edge Function moeten na het aansluiten nog op jouw project worden geverifieerd.
