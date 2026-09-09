export const en = {
  app: {
    tagline: 'Know before you print',
    demo: 'Load demo project',
    dropTitle: 'Drop your print here',
    dropHint: '3MF · G-code · BG-code',
    browse: 'Browse files',
    localOnly: 'The file is analyzed locally on your computer.',
    analyzing: 'Analyzing project…',
    analyzingHint: 'Reading 3MF structure, profiles, filaments and slicer settings.',
    unsupported: 'At this stage, live analysis is connected for 3MF files. G-code and BG-code will follow in later stages.',
    invalid3mf: 'The file could not be analyzed as a 3MF project.',
    overview: 'Overview',
    project: 'Project',
    printer: 'Printer',
    filaments: 'Filaments',
    settings: 'Settings',
    risks: 'Risks',
    compare: 'Compare',
    printHealth: 'PRELIMINARY CHECK',
    goodToPrint: 'PROJECT LOOKS CONSISTENT',
    needsReview: 'REVIEW SUGGESTED',
    criticalReview: 'CRITICAL ISSUES FOUND',
    warnings: '{{count}} warnings · {{critical}} critical issues',
    safeCopy: 'CREATE SAFE 3MF',
    safeCopySoon: 'Safe 3MF Builder is coming in the next stage',
    demoProject: 'Demo project',
    author: 'Created by CraftIN / QvarcY',
    support: 'Support the project',
    prototype: 'v0.2 · live 3MF Inspector',
    language: 'Language',
    realData: 'REAL DATA',
    extracted: 'READ FROM 3MF',
    projectFacts: 'Project facts',
    archive: '3MF container',
    entries: '{{count}} files in container',
    settingsFound: '{{count}} project settings parameters',
    plates: '{{count}} plates',
    parts: '{{count}} parts',
    thumbnail: 'Preview image',
    present: 'Present',
    missing: 'Missing',
    slicerSettings: 'Slicer settings',
    slicerSettingsHint: 'Names intentionally stay in English so they match Bambu Studio / OrcaSlicer.',
    filamentPalette: 'Filament palette',
    noFilaments: 'No filament profile data could be found in this file.',
    notices: 'Inspection results',
    noNotices: 'Nothing suspicious was found at the current inspection level.',
    preliminary: 'This is not yet a full geometry/G-code safety audit.',
    fileSize: 'File size',
    process: 'Process profile',
    unknown: 'Not specified',
    scoreAbout: 'The v0.2 score is based on 3MF structure and a small set of setting checks; it does not yet prove that a print will succeed.'
  },
  settings: {
    maxVolumetricSpeed: {
      description: 'Defines the maximum amount of filament the hotend may extrude per second.',
      higher: 'More speed potential, but too high can cause under-extrusion and weak layer adhesion.',
      lower: 'Safer flow and often better consistency, but print time may increase.'
    },
    wallLoops: {
      description: 'Controls how many perimeter walls are printed around the part.',
      higher: 'Usually improves wall strength and thickness, while using more material and time.',
      lower: 'Reduces print time and material use, but may reduce strength.'
    },
    sparseInfillDensity: {
      description: 'Controls how much internal sparse structure is placed inside the model.',
      higher: 'Can increase stiffness and material use, but is not always the best way to gain strength.',
      lower: 'Uses less material and prints faster, but provides less internal support.'
    },
    layerHeight: {
      description: 'Controls the height of each printed layer.',
      higher: 'Usually prints faster, but lowers vertical detail and may reduce surface quality.',
      lower: 'Produces finer surfaces and more detail, but can significantly increase print time.'
    },
    support: {
      description: 'Controls whether the slicer generates support structures where the model needs additional support.',
      higher: 'Enabled supports can make difficult overhangs printable, while increasing material use and print time.',
      lower: 'No supports means less waste and cleanup, but some geometry may not print reliably.'
    },
    brimWidth: {
      description: 'Controls brim width around the first layer to improve adhesion to the build plate.',
      higher: 'Can improve stability and reduce lifting, but uses more material and needs removal.',
      lower: 'Less material and cleanup, but narrow or tall parts may have less stability.'
    }
  },
  notices: {
    missingSettings: { title: 'project_settings.config is missing', detail: 'The Bambu/Orca global slicer settings file was not found. The model may still open, but PrintGuardian cannot fully inspect the profile.' },
    noObjects: { title: 'No printable geometry found', detail: 'No configured or build objects could be found in the 3MF structure.' },
    manyFilaments: { title: 'Unusually large filament palette', detail: 'The project stores {{count}} filament profiles. If the model does not use all of them, some may be leftovers from the author’s AMS setup.' },
    highLayer: { title: 'Very high Layer height', detail: 'Layer height {{layer}} mm is more than 80% of the {{nozzle}} mm nozzle diameter. This is worth reviewing before printing.' },
    oneWall: { title: 'Only one perimeter wall', detail: 'Wall loops is set to {{walls}}. This can be intentional for some models, but may be too little for functional parts.' },
    unusedFilaments: { title: 'Demo: unused filament profile', detail: '{{count}} filament profile is stored in the project even though the demo model does not use it.' }
  },
  dna: { quality: 'QUALITY', speed: 'SPEED', flow: 'FLOW', support: 'SUPPORT', strength: 'STRENGTH', cooling: 'COOLING' },
  cards: {
    printer: 'Printer profile',
    plate: 'Build plate',
    filament: 'Filaments',
    geometry: 'Geometry',
    compatible: 'Read',
    check: 'Review',
    objects: 'Objects',
    profile: 'Profile',
    value: 'Value',
    status: 'Status'
  }
};
