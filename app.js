// Anthropometrische Daten und Formeln
const DATEN = {
  durchschnittswerte: {
    maenner: {
      koerpergroesse_cm: 180,
      schrittlaenge_prozent: 45.5,
      schulterbreite_cm: 46.3,
      armlaenge_prozent: 44.5,
      gewicht_kg: 78
    },
    frauen: {
      koerpergroesse_cm: 167,
      schrittlaenge_prozent: 45.0,
      schulterbreite_cm: 37.0,
      armlaenge_prozent: 43.5,
      gewicht_kg: 64
    },
    divers: {
      koerpergroesse_cm: 173.5,
      schrittlaenge_prozent: 45.25,
      schulterbreite_cm: 41.65,
      armlaenge_prozent: 44.0,
      gewicht_kg: 71
    }
  },
  formeln: {
    schrittlaenge_aus_koerpergroesse: {
      maenner: 0.455,
      frauen: 0.450,
      divers: 0.4525
    },
    schulterbreite_aus_koerpergroesse: {
      maenner: 0.257,
      frauen: 0.221,
      divers: 0.239
    },
    sattelhoehenberechnung: {
      standard: 0.885,
      cargo_bike: 0.875,
      komfort: 0.875,
      transporter2: 0.875
    },
    lenkerhoehe_relativ_sattel: {
      rennrad: -6,
      cargo_bike: 3,
      city_bike: 2,
      trekking: 0,
      transporter2: 3
    }
  },
  fahrradtypen: {
    transporter2: {
      name: "Riese & Müller Transporter2 85 vario",
      beschreibung: "E-Lastenrad mit universeller Rahmengröße",
      sattelfaktor: 0.875,
      lenkerhoehe: 3,
      specs: {
        "Oberrohrlänge": "64-71 cm",
        "Radstand": "205 cm", 
        "Tretlagerhöhe": "28 cm",
        "Oberrohrhöhe": "58,7 cm",
        "Überstandshöhe": "58,7 cm",
        "Lenkkopfwinkel": "72°",
        "Sitzrohrwinkel": "72°",
        "Vorbau": "Satori, 60 mm, +/-17°",
        "Sattelstütze": "JD-SP66, Alu, 34,9 x 400mm",
        "Körpergrößenbereich": "1,50 m – 2,00 m"
      }
    },
    cargo_bike: {
      name: "Cargo-Bike / E-Lastenrad",
      beschreibung: "Aufrechte, komfortable Sitzposition",
      sattelfaktor: 0.875,
      lenkerhoehe: 3
    },
    city_bike: {
      name: "City-Bike / Hollandrad", 
      beschreibung: "Entspannte, aufrechte Haltung",
      sattelfaktor: 0.875,
      lenkerhoehe: 2
    },
    trekking: {
      name: "Trekking-Bike",
      beschreibung: "Sportlich-komfortable Position",
      sattelfaktor: 0.885,
      lenkerhoehe: 0
    },
    rennrad: {
      name: "Rennrad",
      beschreibung: "Aerodynamische, sportliche Haltung",
      sattelfaktor: 0.885,
      lenkerhoehe: -6
    }
  },
  quellen: [
    "Hügi-Methode (Schrittlänge × 0,885) - mehrfach validiert",
    "DIN 33402 - Deutsche Körpermaße-Norm",
    "PMC Studien zu Fahrrad-Biomechanik und Ergonomie",
    "ADAC Fahrrad-Ergonomie Leitfaden",
    "Riese & Müller Bedienungsanleitung",
    "Anthropometrische Daten deutsche Bevölkerung"
  ],
  ki_prompts: {
    base_prompt: "Überprüfe diese Fahrrad-Ergonomie-Berechnung und validiere die Formeln. Verwende Code falls sinnvoll. Eingabedaten: ",
    perplexity_url: "https://www.perplexity.ai/",
    chatgpt_url: "https://chat.openai.com/",
    claude_url: "https://claude.ai/"
  }
};

class FahrradErgonomieRechner {
  constructor() {
    this.form = document.getElementById('inputForm');
    this.resultsSection = document.getElementById('resultsSection');
    this.estimationNotice = document.getElementById('estimationNotice');
    this.modelSpecs = document.getElementById('modelSpecs');
    
    this.inputs = {
      geschlecht: document.getElementById('geschlecht'),
      fahrradtyp: document.getElementById('fahrradtyp'),
      koerpergroesse: document.getElementById('koerpergroesse'),
      schrittlaenge: document.getElementById('schrittlaenge'),
      schulterbreite: document.getElementById('schulterbreite'),
      gewicht: document.getElementById('gewicht')
    };

    this.outputs = {
      sattelhoehe: document.getElementById('sattelhoehe'),
      lenkerhoehe: document.getElementById('lenkerhoehe'),
      lenkerbreite: document.getElementById('lenkerbreite'),
      selectedBikeType: document.getElementById('selectedBikeType')
    };

    this.currentCalculation = null;
    this.initEventListeners();
  }

  initEventListeners() {
    // Event Listener für alle Eingabefelder
    Object.values(this.inputs).forEach(input => {
      input.addEventListener('input', () => this.berechneEinstellungen());
      input.addEventListener('change', () => this.berechneEinstellungen());
    });

    // Custom Link Button
    document.getElementById('addCustomLink').addEventListener('click', () => {
      this.addCustomLink();
    });
  }

  berechneEinstellungen() {
    const werte = this.sammelEingabewerte();
    
    // Überprüfe ob Mindestangaben vorhanden sind
    if (!werte.fahrradtyp || !werte.koerpergroesse) {
      this.versteckeErgebnisse();
      return;
    }

    // Schätze fehlende Werte
    const vervollstaendigteWerte = this.schaetzeFehlendeWerte(werte);
    
    // Berechne Einstellungen
    const einstellungen = this.berechneAllePunkte(vervollstaendigteWerte);
    
    // Speichere aktuelle Berechnung für KI-Links
    this.currentCalculation = {
      eingabe: vervollstaendigteWerte,
      ergebnis: einstellungen
    };
    
    // Zeige Ergebnisse
    this.zeigeErgebnisse(einstellungen, vervollstaendigteWerte);
    
    // Zeige Schätzungshinweis falls nötig
    this.zeigeSchaetzungshinweis(werte, vervollstaendigteWerte);
    
    // Zeige/verstecke Modell-Specs
    this.zeigeModellSpecs(werte.fahrradtyp);
    
    // Aktualisiere Diagramm-Labels
    this.aktualisiereDigrammLabels(einstellungen);
    
    // Aktualisiere KI-Links
    this.aktualisiereKILinks();
    
    // Scrolle zu Ergebnissen wenn alle Pflichtfelder ausgefüllt
    if (this.sindPflichtfelderAusgefuellt(werte)) {
      this.scrolleZuErgebnissen();
    }
  }

  sammelEingabewerte() {
    return {
      geschlecht: this.inputs.geschlecht.value || 'divers', // Default zu divers wenn nicht gewählt
      fahrradtyp: this.inputs.fahrradtyp.value,
      koerpergroesse: parseFloat(this.inputs.koerpergroesse.value) || null,
      schrittlaenge: parseFloat(this.inputs.schrittlaenge.value) || null,
      schulterbreite: parseFloat(this.inputs.schulterbreite.value) || null,
      gewicht: parseFloat(this.inputs.gewicht.value) || null
    };
  }

  schaetzeFehlendeWerte(werte) {
    const geschlechtsDaten = DATEN.durchschnittswerte[werte.geschlecht];
    const formeln = DATEN.formeln;
    
    const geschaetzt = { ...werte };
    geschaetzt.geschaetzteWerte = [];

    // Schätze Schrittlänge falls fehlend
    if (!geschaetzt.schrittlaenge && geschaetzt.koerpergroesse) {
      geschaetzt.schrittlaenge = geschaetzt.koerpergroesse * formeln.schrittlaenge_aus_koerpergroesse[werte.geschlecht];
      geschaetzt.geschaetzteWerte.push('Schrittlänge');
    }

    // Schätze Schulterbreite falls fehlend
    if (!geschaetzt.schulterbreite && geschaetzt.koerpergroesse) {
      geschaetzt.schulterbreite = geschaetzt.koerpergroesse * formeln.schulterbreite_aus_koerpergroesse[werte.geschlecht];
      geschaetzt.geschaetzteWerte.push('Schulterbreite');
    }

    // Schätze Gewicht falls fehlend (für Komfort-Empfehlungen)
    if (!geschaetzt.gewicht) {
      const skalierung = geschaetzt.koerpergroesse / geschlechtsDaten.koerpergroesse_cm;
      geschaetzt.gewicht = geschlechtsDaten.gewicht_kg * Math.pow(skalierung, 2.5);
      geschaetzt.geschaetzteWerte.push('Körpergewicht');
    }

    return geschaetzt;
  }

  berechneAllePunkte(werte) {
    const fahrradtyp = DATEN.fahrradtypen[werte.fahrradtyp];
    
    // Sattelhöhe berechnen
    const sattelfaktor = fahrradtyp.sattelfaktor;
    const sattelhoehe = Math.round(werte.schrittlaenge * sattelfaktor * 10) / 10;
    
    // Lenkerhöhe berechnen (relativ zur Sattelhöhe)
    const lenkerhoehe = fahrradtyp.lenkerhoehe;
    const absoluteLenkerhoehe = sattelhoehe + lenkerhoehe;
    
    // Lenkerbreite basierend auf Schulterbreite
    const lenkerbreite = Math.round(werte.schulterbreite);

    return {
      sattelhoehe: sattelhoehe,
      lenkerhoehe: lenkerhoehe,
      absoluteLenkerhoehe: absoluteLenkerhoehe,
      lenkerbreite: lenkerbreite
    };
  }

  zeigeErgebnisse(einstellungen, werte) {
    this.outputs.sattelhoehe.textContent = `${einstellungen.sattelhoehe} cm`;
    
    if (einstellungen.lenkerhoehe >= 0) {
      this.outputs.lenkerhoehe.textContent = `+${einstellungen.lenkerhoehe} cm`;
    } else {
      this.outputs.lenkerhoehe.textContent = `${einstellungen.lenkerhoehe} cm`;
    }
    
    this.outputs.lenkerbreite.textContent = `${einstellungen.lenkerbreite} cm`;
    
    // Zeige gewählten Fahrradtyp
    const fahrradtyp = DATEN.fahrradtypen[werte.fahrradtyp];
    this.outputs.selectedBikeType.textContent = fahrradtyp.name;
    
    // Zeige Ergebnisse-Sektion
    this.resultsSection.classList.remove('hidden');
  }

  zeigeSchaetzungshinweis(urspruenglicheWerte, vervollstaendigteWerte) {
    if (vervollstaendigteWerte.geschaetzteWerte && vervollstaendigteWerte.geschaetzteWerte.length > 0) {
      this.estimationNotice.classList.remove('hidden');
    } else {
      this.estimationNotice.classList.add('hidden');
    }
  }

  zeigeModellSpecs(fahrradtyp) {
    if (fahrradtyp === 'transporter2') {
      const specs = DATEN.fahrradtypen.transporter2.specs;
      const specsContent = document.getElementById('specsContent');
      
      let specsHtml = '<div class="specs-grid">';
      Object.entries(specs).forEach(([key, value]) => {
        specsHtml += `
          <div class="spec-item">
            <span class="spec-label">${key}:</span>
            <span class="spec-value">${value}</span>
          </div>
        `;
      });
      specsHtml += '</div>';
      
      specsContent.innerHTML = specsHtml;
      this.modelSpecs.classList.remove('hidden');
    } else {
      this.modelSpecs.classList.add('hidden');
    }
  }

  aktualisiereDigrammLabels(einstellungen) {
    // Update SVG labels with actual values
    const sattelLabel = document.getElementById('sattelhoehe-label');
    const lenkerLabel = document.getElementById('lenkerhoehe-label');
    const lenkerbreiteLabel = document.getElementById('lenkerbreite-label');
    
    if (sattelLabel) {
      sattelLabel.textContent = `${einstellungen.sattelhoehe} cm`;
    }
    
    if (lenkerLabel) {
      const sign = einstellungen.lenkerhoehe >= 0 ? '+' : '';
      lenkerLabel.textContent = `${sign}${einstellungen.lenkerhoehe} cm`;
    }
    
    if (lenkerbreiteLabel) {
      lenkerbreiteLabel.textContent = `${einstellungen.lenkerbreite} cm`;
    }
  }

  aktualisiereKILinks() {
    if (!this.currentCalculation) return;

    const promptText = this.generatePromptText();
    
    // Update Perplexity Link
    document.getElementById('perplexityLink').href = `${DATEN.ki_prompts.perplexity_url}?q=${encodeURIComponent(promptText)}`;
    
    // Update ChatGPT Link (opens homepage, user needs to paste prompt)
    document.getElementById('chatgptLink').href = DATEN.ki_prompts.chatgpt_url;
    
    // Update Claude Link (opens homepage, user needs to paste prompt)  
    document.getElementById('claudeLink').href = DATEN.ki_prompts.claude_url;

    // Add click handlers to copy prompt to clipboard
    document.getElementById('chatgptLink').addEventListener('click', (e) => {
      this.copyToClipboard(promptText);
      this.showTooltip(e.target, 'Prompt kopiert! Füge ihn in ChatGPT ein.');
    });

    document.getElementById('claudeLink').addEventListener('click', (e) => {
      this.copyToClipboard(promptText);
      this.showTooltip(e.target, 'Prompt kopiert! Füge ihn in Claude ein.');
    });
  }

  generatePromptText() {
    const calc = this.currentCalculation;
    const fahrradtyp = DATEN.fahrradtypen[calc.eingabe.fahrradtyp];
    
    return `${DATEN.ki_prompts.base_prompt}
    
Körpermaße:
- Geschlecht: ${calc.eingabe.geschlecht}
- Körpergröße: ${calc.eingabe.koerpergroesse} cm
- Schrittlänge: ${calc.eingabe.schrittlaenge.toFixed(1)} cm
- Schulterbreite: ${calc.eingabe.schulterbreite.toFixed(1)} cm
- Gewicht: ${calc.eingabe.gewicht.toFixed(1)} kg

Fahrradtyp: ${fahrradtyp.name}

Berechnete Ergebnisse:
- Sattelhöhe: ${calc.ergebnis.sattelhoehe} cm
- Lenkerhöhe (relativ): ${calc.ergebnis.lenkerhoehe >= 0 ? '+' : ''}${calc.ergebnis.lenkerhoehe} cm
- Lenkerbreite: ${calc.ergebnis.lenkerbreite} cm

Verwendete Formeln:
- Sattelfaktor: ${fahrradtyp.sattelfaktor}
- Lenkerposition: ${calc.ergebnis.lenkerhoehe} cm relativ zum Sattel

Bitte überprüfe diese Berechnung auf Plausibilität und ergonomische Korrektheit.`;
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  showTooltip(element, message) {
    // Create temporary tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: fixed;
      top: ${element.getBoundingClientRect().top - 40}px;
      left: ${element.getBoundingClientRect().left}px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      box-shadow: var(--shadow-md);
      color: var(--color-success);
    `;
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
      document.body.removeChild(tooltip);
    }, 2000);
  }

  addCustomLink() {
    const customLinkInput = document.getElementById('customLink');
    const customLinkResult = document.getElementById('customLinkResult');
    const url = customLinkInput.value.trim();
    
    if (!url) {
      this.showMessage(customLinkResult, 'Bitte gib eine URL ein.', 'error');
      return;
    }
    
    if (!this.isValidUrl(url)) {
      this.showMessage(customLinkResult, 'Bitte gib eine gültige URL ein.', 'error');
      return;
    }
    
    // Create custom link button
    const linkButton = document.createElement('a');
    linkButton.href = url;
    linkButton.target = '_blank';
    linkButton.className = 'btn btn--outline btn--sm';
    linkButton.textContent = `🔗 ${this.extractDomainName(url)}`;
    linkButton.style.display = 'inline-block';
    linkButton.style.marginTop = '4px';
    
    customLinkResult.innerHTML = '';
    customLinkResult.appendChild(linkButton);
    
    this.showMessage(customLinkResult, 'Link erfolgreich hinzugefügt!', 'success');
    customLinkInput.value = '';
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  extractDomainName(url) {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return 'Eigener Link';
    }
  }

  showMessage(container, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `status status--${type}`;
    messageDiv.textContent = message;
    messageDiv.style.marginTop = '8px';
    
    // Remove existing messages
    const existingMessages = container.querySelectorAll('.status');
    existingMessages.forEach(msg => msg.remove());
    
    container.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }

  sindPflichtfelderAusgefuellt(werte) {
    return werte.fahrradtyp && werte.koerpergroesse;
  }

  scrolleZuErgebnissen() {
    setTimeout(() => {
      this.resultsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  versteckeErgebnisse() {
    this.resultsSection.classList.add('hidden');
    this.estimationNotice.classList.add('hidden');
    this.modelSpecs.classList.add('hidden');
  }
}

// Zusätzliche Hilfsfunktionen

// Validierung der Eingabewerte
function validiereEingabe(input, min, max) {
  const wert = parseFloat(input.value);
  
  if (isNaN(wert)) return true; // Leere Eingaben sind ok (optional)
  
  if (wert < min || wert > max) {
    input.style.borderColor = 'var(--color-error)';
    return false;
  } else {
    input.style.borderColor = '';
    return true;
  }
}

// Lokale Speicherung der Eingaben (deaktiviert wegen Sandbox)
function speichereEingaben(werte) {
  // localStorage deaktiviert wegen Sandbox-Umgebung
  // try {
  //   if (typeof Storage !== 'undefined') {
  //     localStorage.setItem('fahrradErgonomie', JSON.stringify(werte));
  //   }
  // } catch (e) {
  //   // Storage nicht verfügbar oder voll
  // }
}

function ladeGespeicherteEingaben() {
  // localStorage deaktiviert wegen Sandbox-Umgebung
  // try {
  //   if (typeof Storage !== 'undefined') {
  //     const gespeichert = localStorage.getItem('fahrradErgonomie');
  //     return gespeichert ? JSON.parse(gespeichert) : null;
  //   }
  // } catch (e) {
  //   // Storage nicht verfügbar oder korrupt
  // }
  return null;
}

// Format-Hilfsfunktionen
function formatiereCm(wert) {
  return `${Math.round(wert * 10) / 10} cm`;
}

function formatiereDrehmoment(min, max) {
  return `${min}-${max} Nm`;
}

// Erweiterte Berechnungen für Experten-Modus (später erweiterbar)
class ErweiterteBerechnung {
  static berechneSitzbeinhoekerAbstand(geschlecht, gewicht) {
    // Geschätzte Berechnung basierend auf anthropometrischen Daten
    const basis = geschlecht === 'frauen' ? 12.5 : 11.5;
    const gewichtsFaktor = Math.sqrt(gewicht / 70) * 0.5;
    return Math.round((basis + gewichtsFaktor) * 10) / 10;
  }

  static berechneOptimalenReifendruck(gewicht, fahrradtyp) {
    const basisDruck = {
      transporter2: 3.0,
      cargo_bike: 3.0,
      city_bike: 3.5,
      trekking: 4.0,
      rennrad: 6.0
    };
    
    const gewichtsFaktor = (gewicht - 70) * 0.05;
    return Math.max(2.0, basisDruck[fahrradtyp] + gewichtsFaktor);
  }
}

// Theme Toggle (falls später gewünscht)
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-color-scheme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-color-scheme', newTheme);
}

// Initialisierung wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
  // Setze explizit das dunkle Theme
  document.documentElement.setAttribute('data-color-scheme', 'dark');
  
  // Initialisiere den Rechner
  const rechner = new FahrradErgonomieRechner();
  
  // Lade gespeicherte Eingaben (deaktiviert wegen Sandbox)
  const gespeicherteWerte = ladeGespeicherteEingaben();
  if (gespeicherteWerte) {
    Object.keys(gespeicherteWerte).forEach(key => {
      const input = document.getElementById(key);
      if (input && gespeicherteWerte[key]) {
        input.value = gespeicherteWerte[key];
      }
    });
    // Triggere Berechnung mit gespeicherten Werten
    rechner.berechneEinstellungen();
  }
  
  // Eingabe-Validierung
  const koerpergroesseInput = document.getElementById('koerpergroesse');
  koerpergroesseInput.addEventListener('input', () => {
    validiereEingabe(koerpergroesseInput, 140, 220);
  });
  
  const schrittlaengeInput = document.getElementById('schrittlaenge');
  schrittlaengeInput.addEventListener('input', () => {
    validiereEingabe(schrittlaengeInput, 60, 110);
  });
  
  const schulterbreiteInput = document.getElementById('schulterbreite');
  schulterbreiteInput.addEventListener('input', () => {
    validiereEingabe(schulterbreiteInput, 30, 60);
  });
  
  const gewichtInput = document.getElementById('gewicht');
  gewichtInput.addEventListener('input', () => {
    validiereEingabe(gewichtInput, 40, 150);
  });
  
  // Speichere Eingaben bei Änderungen (deaktiviert wegen Sandbox)
  // Object.values(rechner.inputs).forEach(input => {
  //   input.addEventListener('change', () => {
  //     const werte = rechner.sammelEingabewerte();
  //     speichereEingaben(werte);
  //   });
  // });
});
