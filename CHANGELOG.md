# Changelog

## [0.2.0](https://github.com/Huskynarr/Notebook/compare/v0.1.0...v0.2.0) (2026-09-19)


### Neu

* **api:** HTTP-Schnittstelle und Beispiel-Notebook ([7ff7816](https://github.com/Huskynarr/Notebook/commit/7ff7816796d35f7888d529119c94fa0e3f776a8d))
* **api:** Webseiten und Endpunkte als Quellen abrufen, Antwortsprache waehlbar ([bfb9d25](https://github.com/Huskynarr/Notebook/commit/bfb9d2561ad6475c82425558d3710b48fddd0c1b))
* **api:** Zugang mit festem Benutzerpaar absichern ([bec0851](https://github.com/Huskynarr/Notebook/commit/bec08512f2b45e0593d0bbc81de65a6510b1d7a0))
* **db:** lokale Persistenz mit SQLite und lexikalischem Volltextindex ([d1f9bb0](https://github.com/Huskynarr/Notebook/commit/d1f9bb03bfdb1aab9a451cdf61f6322f935b8c92))
* **rag:** Abschnitte lexikalisch ueber BM25 abrufen ([d154d25](https://github.com/Huskynarr/Notebook/commit/d154d2516ed89f1ade2151941882bb340bc6ab0d))
* **rag:** Belege serverseitig gegen abgerufene Abschnitte validieren ([0dc0c8d](https://github.com/Huskynarr/Notebook/commit/0dc0c8d66bc8cae6473e17ed5b755dba8f022448))
* **rag:** Modellanbindung ueber OpenAI-kompatible Schnittstelle ([a50e115](https://github.com/Huskynarr/Notebook/commit/a50e115a852f3591b4045f51b472a96790d8d5db))
* **rag:** Quellen offsettreu in belegfaehige Abschnitte zerlegen ([588695c](https://github.com/Huskynarr/Notebook/commit/588695c97f742ea46a713f0fa28f8236b04d8097))
* **web:** Belege anklickbar machen und im Original hervorheben ([6213dd6](https://github.com/Huskynarr/Notebook/commit/6213dd62fabe9ff3ef3ba50d5fa81032846a0fcd))
* **web:** Demo ohne Server statt entwerteter Vorschau ([6086f19](https://github.com/Huskynarr/Notebook/commit/6086f195ae3c515c53bbef3df2e6da0fe67f4575))
* **web:** Design in den Einstellungen umschaltbar machen ([05bba9f](https://github.com/Huskynarr/Notebook/commit/05bba9f317514189b32b231b740806b99f433314))
* **web:** Design-Tokens und Bedienelemente nach Spezifikation umsetzen ([b881efe](https://github.com/Huskynarr/Notebook/commit/b881efe1326d4ae29b9433b0bbc3c09bed27c601))
* **web:** Dreispalten-Arbeitsbereich mit dem vollstaendigen Hauptablauf ([44b3121](https://github.com/Huskynarr/Notebook/commit/44b31219bed4161ed0f191989d83646da6c5a280))
* **web:** Einfuehrung beim ersten Start mit Sprach- und Designwahl ([e9352c5](https://github.com/Huskynarr/Notebook/commit/e9352c50c1558e60b388339601b35c001d3f4b09))
* **web:** Einstellungen nach Einwilligung speichern - dauerhaft nur mit Zustimmung ([e01b6df](https://github.com/Huskynarr/Notebook/commit/e01b6dfb5f86a29b1fbfe33812c7985b5777bd22))
* **web:** Einwilligungsbanner beim ersten Start, Datenschutz in den Einstellungen ([e0b0a95](https://github.com/Huskynarr/Notebook/commit/e0b0a957c947319e2c8a6d1f56027de687d4acdd))
* **web:** Oberflaeche zweisprachig, Teilen, Adressquellen, Trenner und neuer Kopfbereich ([df29102](https://github.com/Huskynarr/Notebook/commit/df29102ab9f9e622ff5026f78fdc11b340aa7c75))
* **web:** Spaltenbreiten per Trenner verschiebbar ([1965334](https://github.com/Huskynarr/Notebook/commit/19653342daa1030d4de11ea5e38cf7c2fa9811ad))
* **web:** Teilen-Menue mit Export als Markdown, Word, PDF und PNG ([d2bc941](https://github.com/Huskynarr/Notebook/commit/d2bc941cd7d4bb302b2a583a568766ff91df9047))
* **web:** typisierten API-Client mit Schemapruefung anbinden ([66beafb](https://github.com/Huskynarr/Notebook/commit/66beafb1e17b03a3b7b1ecffb4b39f6b3af15922))
* **web:** Uebersetzungen de/en mit typisierten Schluesseln ([ad40378](https://github.com/Huskynarr/Notebook/commit/ad403781592fa10b82701196aa4fcc77afe78e6e))
* **web:** Vorschau ohne Backend fuer die Ausgabe auf GitHub Pages ([4b8cabb](https://github.com/Huskynarr/Notebook/commit/4b8cabb9492bc7c79b73dc6801ee63c13460910a))


### Behoben

* **api:** Parameter-Properties entfernen, damit der Server ueberhaupt startet ([656283f](https://github.com/Huskynarr/Notebook/commit/656283fdeb9c72797f8b5412aab83a1804454e2c))
* **api:** PATCH und DELETE im CORS-Preflight erlauben ([9ae8457](https://github.com/Huskynarr/Notebook/commit/9ae8457e17435447b573f1aab632aa4149d2a99b))
* **e2e:** Server an 127.0.0.1 binden und Bereitschaft dort pruefen, Datenbank je Lauf frisch ([5605fe1](https://github.com/Huskynarr/Notebook/commit/5605fe192928e1f3935fc057536cbb67b35d1681))
* Umlaute in allen sichtbaren Texten ([4232ee2](https://github.com/Huskynarr/Notebook/commit/4232ee22cf886d0f355ce8907b3de2d625b3cd93))
* **web:** Auswahl nicht mehr von einem spaeten Erstabruf ueberschreiben lassen ([4a19b11](https://github.com/Huskynarr/Notebook/commit/4a19b118106b248d6b4363756a7e61a9afbe7e34))
* **web:** Kopfleiste laeuft auf schmalen Bildschirmen aus dem Bild ([0bc7ac9](https://github.com/Huskynarr/Notebook/commit/0bc7ac936e82633f318fa196ecee906efe35f430))
* **web:** Quellenauswahl sofort umstellen statt auf den Server zu warten ([297d5d0](https://github.com/Huskynarr/Notebook/commit/297d5d0ecbe8dc58c3f4f8717596597d341c8d59))
* **web:** Wettlauf beim schnellen Umschalten der Quellenauswahl beseitigen ([b010563](https://github.com/Huskynarr/Notebook/commit/b01056370a9eecc232e5d6b5b4158658bba69fa5))
