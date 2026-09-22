/* Setzt Design und Erscheinungsbild vor dem ersten Zeichnen - sonst
         blitzt beim Laden kurz das Vorgabedesign auf. Laeuft vor dem Bundle
         und kann dessen Konstanten daher nicht importieren; dass Schluessel
         und Werte hier mit src/lib/appearance.ts uebereinstimmen, prueft
         src/__tests__/appearance.test.ts. */
(function () {
  var wurzel = document.documentElement;
  try {
    var designs = ['everlast', 'eigen', 'uni-freiburg', 'huskynarr'];
    var modi = ['light', 'dark'];
    /* Einstellungen liegen je nach Einwilligung (src/lib/consent.ts)
             im localStorage oder nur im sessionStorage. */
    var lesen = function (schluessel) {
      return localStorage.getItem(schluessel) || sessionStorage.getItem(schluessel);
    };
    var design = lesen('notebook.design');
    var modus = lesen('notebook.mode');
    wurzel.dataset.design = designs.indexOf(design) >= 0 ? design : 'everlast';
    if (modi.indexOf(modus) >= 0) wurzel.dataset.theme = modus;
    else if (modus !== 'system') wurzel.dataset.theme = 'dark';
    var sprache = lesen('notebook.lang');
    if (sprache === 'de' || sprache === 'en') wurzel.lang = sprache;
  } catch {
    wurzel.dataset.design = 'everlast';
    wurzel.dataset.theme = 'dark';
  }
})();
