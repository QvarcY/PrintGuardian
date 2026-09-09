export const en = {
  app: {
    tagline: 'Know before you print',
    demo: 'Load demo project',
    dropTitle: 'Drop your print here',
    dropHint: '3MF · G-code · BG-code',
    browse: 'Browse files',
    localOnly: 'Files stay on your computer.',
    overview: 'Overview',
    project: 'Project',
    printer: 'Printer',
    filaments: 'Filaments',
    settings: 'Settings',
    risks: 'Risks',
    compare: 'Compare',
    printHealth: 'PRINT HEALTH',
    goodToPrint: 'GOOD TO PRINT',
    warnings: '{{count}} warnings · {{critical}} critical issues',
    safeCopy: 'CREATE SAFE 3MF',
    demoProject: 'Demo project',
    author: 'Created by CraftIN / QvarcY',
    support: 'Support the project',
    prototype: 'UI prototype · analysis engine not connected yet',
    language: 'Language'
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
    }
  },
  cards: {
    printer: 'P1S · 0.4 mm',
    plate: 'Textured PEI',
    filament: 'PCTG',
    geometry: '7 objects',
    supports: 'Tree / Manual',
    ams: '4 / 16 slots',
    compatible: 'Compatible',
    check: 'Review suggested',
    objects: 'Objects',
    profile: 'Profile',
    value: 'Value',
    status: 'Status'
  }
};
