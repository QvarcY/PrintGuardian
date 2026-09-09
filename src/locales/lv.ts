export const lv = {
  app: {
    tagline: 'Zini, pirms drukā',
    demo: 'Atvērt demo projektu',
    dropTitle: 'Ievelc drukas failu šeit',
    dropHint: '3MF · G-code · BG-code',
    browse: 'Izvēlēties failu',
    localOnly: 'Fails tiek analizēts lokāli tavā datorā.',
    analyzing: 'Analizēju projektu…',
    analyzingHint: 'Nolasa 3MF struktūru, profilus, filamentus un slicer iestatījumus.',
    unsupported: 'Šajā posmā reāla analīze ir pieslēgta 3MF failiem. G-code un BG-code sekos nākamajos posmos.',
    invalid3mf: 'Failu neizdevās analizēt kā 3MF projektu.',
    overview: 'Pārskats',
    project: 'Projekts',
    printer: 'Printeris',
    filaments: 'Filamenti',
    settings: 'Iestatījumi',
    risks: 'Riski',
    compare: 'Salīdzināt',
    printHealth: 'SĀKOTNĒJĀ PĀRBAUDE',
    goodToPrint: 'PROJEKTS IZSKATĀS KOREKTS',
    needsReview: 'IETEICAMS PĀRBAUDĪT',
    criticalReview: 'ATRASTAS KRITISKAS PROBLĒMAS',
    warnings: '{{count}} brīdinājumi · {{critical}} kritiskas problēmas',
    safeCopy: 'IZVEIDOT DROŠU 3MF',
    safeCopySoon: 'Safe 3MF Builder būs nākamajā posmā',
    demoProject: 'Demo projekts',
    author: 'Izveidoja CraftIN / QvarcY',
    support: 'Atbalstīt projektu',
    prototype: 'v0.2 · dzīvs 3MF Inspector',
    language: 'Valoda',
    realData: 'REAL DATA',
    extracted: 'NOLASĪTS NO 3MF',
    projectFacts: 'Projekta dati',
    archive: '3MF konteiners',
    entries: '{{count}} faili konteinerā',
    settingsFound: '{{count}} project settings parametri',
    plates: '{{count}} plates',
    parts: '{{count}} parts',
    thumbnail: 'Preview image',
    present: 'Ir',
    missing: 'Nav',
    slicerSettings: 'Slicer settings',
    slicerSettingsHint: 'Nosaukumi apzināti atstāti angliski, lai tie sakristu ar Bambu Studio / OrcaSlicer.',
    filamentPalette: 'Filament palette',
    noFilaments: 'Failā neizdevās atrast filamenta profilu datus.',
    notices: 'Pārbaudes rezultāti',
    noNotices: 'Šajā pārbaudes līmenī nekas aizdomīgs netika atrasts.',
    preliminary: 'Šis vēl nav pilns ģeometrijas/G-code drošības audits.',
    fileSize: 'Faila izmērs',
    process: 'Process profile',
    unknown: 'Nav norādīts',
    scoreAbout: 'V0.2 vērtējums balstās uz 3MF struktūras un dažu iestatījumu pārbaudēm; tas vēl neapstiprina, ka druka noteikti izdosies.'
  },
  settings: {
    maxVolumetricSpeed: {
      description: 'Nosaka maksimālo plastmasas daudzumu, ko hotend drīkst izspiest sekundē.',
      higher: 'Ļauj drukāt ātrāk, taču pārāk liela vērtība var izraisīt nepietiekamu ekstrūziju un sliktu slāņu saķeri.',
      lower: 'Drošāka materiāla plūsma un bieži vien stabilāks rezultāts, taču drukas laiks var palielināties.'
    },
    wallLoops: {
      description: 'Nosaka, cik perimetra sienas tiek drukātas apkārt detaļai.',
      higher: 'Parasti palielina sienu stiprību un biezumu, bet patērē vairāk materiāla un laika.',
      lower: 'Samazina drukas laiku un materiāla patēriņu, bet var samazināt detaļas stiprību.'
    },
    sparseInfillDensity: {
      description: 'Nosaka retinātā iekšējā pildījuma daudzumu modeļa iekšpusē.',
      higher: 'Var palielināt stingrību un materiāla patēriņu, taču ne vienmēr ir efektīvākais veids, kā palielināt izturību.',
      lower: 'Patērē mazāk materiāla un drukājas ātrāk, bet nodrošina mazāku iekšējo atbalstu.'
    },
    layerHeight: {
      description: 'Nosaka viena izdrukātā slāņa augstumu.',
      higher: 'Parasti drukā ātrāk, bet samazina vertikālo detaļu izšķirtspēju un var pasliktināt virsmu.',
      lower: 'Dod smalkāku virsmu un vairāk detaļu, bet būtiski palielina drukas laiku.'
    },
    support: {
      description: 'Nosaka, vai sliceris ģenerēs support struktūras vietās, kur modelim nepieciešams papildu balsts.',
      higher: 'Ieslēgti supporti var padarīt sarežģītas pārkares drukājamas, bet palielina laiku un materiāla patēriņu.',
      lower: 'Bez supportiem ir mazāk atkritumu un pēcapstrādes, taču ne visas ģeometrijas būs droši izdrukājamas.'
    },
    brimWidth: {
      description: 'Nosaka brim platumu ap modeļa pirmo slāni, lai uzlabotu saķeri ar drukas plati.',
      higher: 'Var uzlabot stabilitāti un samazināt atlīmēšanās risku, bet patērē vairāk materiāla un prasa noņemšanu.',
      lower: 'Mazāk materiāla un tīrāka pēcapstrāde, bet šaurām vai augstām detaļām var pietrūkt stabilitātes.'
    }
  },
  notices: {
    missingSettings: { title: 'Nav project_settings.config', detail: '3MF failā nav atrasts Bambu/Orca globālo slicer iestatījumu fails. Modeli var būt iespējams atvērt, bet PrintGuardian nevar pilnvērtīgi analizēt profilu.' },
    noObjects: { title: 'Nav atrasta drukājama ģeometrija', detail: '3MF struktūrā neizdevās atrast nevienu konfigurētu vai build objektu.' },
    manyFilaments: { title: 'Neparasti liela filamenta palete', detail: 'Projektā ir {{count}} filamenta profili. Ja modelis tos visus neizmanto, daļa var būt autora AMS konfigurācijas pārpalikums.' },
    highLayer: { title: 'Ļoti liels Layer height', detail: 'Layer height {{layer}} mm ir vairāk nekā 80% no {{nozzle}} mm nozzle diametra. Pirms drukāšanas šo vērtību vērts pārbaudīt.' },
    oneWall: { title: 'Tikai viena ārējā siena', detail: 'Wall loops vērtība ir {{walls}}. Tas dažiem modeļiem var būt apzināti, bet funkcionālām detaļām var būt pārāk maz.' },
    unusedFilaments: { title: 'Demo: lieks filamenta profils', detail: '{{count}} filamenta profils ir saglabāts projektā, lai gan demo modelī tas netiek izmantots.' }
  },
  dna: { quality: 'QUALITY', speed: 'SPEED', flow: 'FLOW', support: 'SUPPORT', strength: 'STRENGTH', cooling: 'COOLING' },
  cards: {
    printer: 'Printer profile',
    plate: 'Build plate',
    filament: 'Filamenti',
    geometry: 'Geometry',
    compatible: 'Nolasīts',
    check: 'Pārbaudīt',
    objects: 'Objekti',
    profile: 'Profils',
    value: 'Vērtība',
    status: 'Statuss'
  }
};
