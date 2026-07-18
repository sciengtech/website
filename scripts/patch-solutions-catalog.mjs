/**
 * Client catalog updates: solution groups, renames, and manual solution entries.
 * Applied after docx ingest and before site build.
 */
import { solutionGroupLabel } from './solution-groups.mjs';

function makeSearch(p) {
  return [
    p.id,
    p.sku,
    p.name,
    p.type,
    p.solutionGroup,
    p.categoryLabel,
    p.summary,
    p.specHighlight,
    (p.aliases || []).join(' '),
    (p.tags || []).join(' '),
    p.body || '',
  ]
    .join(' ')
    .toLowerCase();
}

const MADE_IN_INDIA = 'Proudly Designed and Manufactured in India';

const CUSTOM_RFQ_PARAMS = [
  'Application and experimental goals',
  'Wavelength / spectral range',
  'Power, repetition rate, or bandwidth targets',
  'Integration and mounting requirements',
  'Timeline and quantity',
];

function defaultRfqSections() {
  return [
    {
      id: 'requirements',
      title: 'Specify Your Requirements',
      parameters: [...CUSTOM_RFQ_PARAMS],
    },
  ];
}

function makeCustomSolution({
  id,
  name,
  sku,
  group,
  summary,
  customized = true,
  pageTemplate = 'solution',
}) {
  const customLine = customized
    ? 'Customized as per user requirements.'
    : 'Configured in consultation with SciEngTech engineering.';
  const item = {
    id,
    sku,
    name,
    type: 'solution',
    pageTemplate,
    aliases: [],
    overview: [summary],
    features: [],
    applications: [],
    techSpecs: [],
    keyValueSpecs: [],
    variants: [],
    configurationOptions: null,
    rfqSections: defaultRfqSections(),
    solutionContent: {
      tagline: customized ? 'Customized as per user requirements' : summary,
      demonstrates: customized ? [] : [customLine],
      kitIncludes: [
        'Engineering consultation and specification review',
        'Turnkey or modular delivery scoped to your quote',
      ],
      capabilities: [MADE_IN_INDIA],
    },
    customNote: null,
    summary,
    specHighlight: customized
      ? 'Customized as per user requirements · Request Technical Quote'
      : 'Request Technical Quote · Engineering consultation available',
    specs: [{ label: 'Procurement', value: 'Custom configuration · Request Technical Quote' }],
    body: `${name}\n\n${summary}\n\n${customLine}`,
    image: null,
    tags: [id.replace(/-/g, ' '), group.replace(/-/g, ' ')],
    writeupPath: null,
    solutionGroup: group,
    categoryLabel: solutionGroupLabel(group),
    solutionUrl: `solutions/${id}.html`,
  };
  item._search = makeSearch(item);
  return item;
}

function normText(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.·]+$/g, '');
}

function dedupeDemonstratesFromTagline(s) {
  const tagline = s.solutionContent?.tagline;
  if (!tagline || !s.solutionContent?.demonstrates?.length) return;
  s.solutionContent.demonstrates = s.solutionContent.demonstrates.filter(
    (line) => normText(line) !== normText(tagline)
  );
}

function applySolutionLabels(solutions) {
  for (const s of solutions) {
    s.categoryLabel = solutionGroupLabel(s.solutionGroup);
    s.solutionUrl = `solutions/${s.id}.html`;
  }
}

export function patchSolutionsCatalog(catalog) {
  const { solutions } = catalog;
  const byId = Object.fromEntries(solutions.map((s) => [s.id, s]));

  // —— Renames ——
  if (byId['bomb-tester']) {
    const s = byId['bomb-tester'];
    s.name = 'SciEngTech Elitzur-Vaidman Bomb Tester Educational Kit';
    s.summary = s.summary || 'Elitzur-Vaidman interaction-free quantum measurement demonstration kit.';
    if (s.solutionContent?.demonstrates?.length) {
      s.solutionContent.demonstrates = s.solutionContent.demonstrates.map((line) =>
        line.replace(/Bomb Tester/gi, 'Elitzur-Vaidman Bomb Tester')
      );
    }
  }

  if (byId['quantum-key-distribution']) {
    const s = byId['quantum-key-distribution'];
    s.name = 'QKD-BB84 Educational Platform';
    s.aliases = ['Quantum Key Distribution'];
    s.summary =
      s.solutionContent?.tagline ||
      'BB84 quantum key distribution educational platform for classroom and laboratory instruction.';
    s.specHighlight =
      'Quantum Key Distribution · BB84 protocol · Educational platform';
  }

  for (const id of ['michelson-interferometer', 'quantum-eraser']) {
    const s = byId[id];
    if (!s) continue;
    dedupeDemonstratesFromTagline(s);
    if (s.specHighlight && s.solutionContent?.tagline && normText(s.specHighlight) === normText(s.solutionContent.tagline)) {
      s.specHighlight = 'Educational quantum optics kit · Request Technical Quote';
    }
  }

  // —— Move to State of the Art Setups ——
  if (byId['regenerative-delay-line']) {
    byId['regenerative-delay-line'].solutionGroup = 'state-of-the-art-setups';
  }

  const manual = [
    makeCustomSolution({
      id: 'white-light-supercontinuum-source',
      name: 'White Light Supercontinuum Source',
      sku: 'SET-WL-SC',
      group: 'state-of-the-art-setups',
      summary:
        'Turnkey or custom supercontinuum generation systems for ultrafast spectroscopy, imaging, and pump–probe experiments.',
      customized: true,
    }),
    makeCustomSolution({
      id: 'cw-and-pulsed-lasers',
      name: 'CW and Pulsed Lasers',
      sku: 'SET-CW-PULSE',
      group: 'state-of-the-art-setups',
      summary:
        'Continuous-wave and pulsed laser systems specified for research, ultrafast, and industrial photonics applications.',
      customized: true,
    }),
    makeCustomSolution({
      id: 'ultrafast-photodiodes-assemblies',
      name: 'Ultrafast Photodiodes Assemblies',
      sku: 'SET-UFPDA',
      group: 'state-of-the-art-setups',
      summary:
        'Integrated ultrafast photodiode assemblies for timing, detection, and characterization in advanced optical setups.',
      customized: true,
    }),
    makeCustomSolution({
      id: 'pockels-cell-assemblies',
      name: 'Pockels Cell Assemblies',
      sku: 'SET-POCKELS',
      group: 'state-of-the-art-setups',
      summary:
        'Pockels cell assemblies and drivers for pulse picking, cavity control, and ultrafast beam modulation.',
      customized: true,
    }),
    makeCustomSolution({
      id: 'quantum-tomography',
      name: 'Quantum Tomography',
      sku: 'SET-QTOM',
      group: 'quantum-setups',
      summary:
        'Quantum state tomography platforms for reconstructing and characterizing quantum states in research and education.',
      customized: false,
    }),
    makeCustomSolution({
      id: 'hbt-and-hom',
      name: 'HBT and HOM',
      sku: 'SET-HBT-HOM',
      group: 'quantum-setups',
      summary:
        'Hanbury Brown–Twiss (HBT) and Hong–Ou–Mandel (HOM) experimental setups for photon statistics and indistinguishability measurements.',
      customized: true,
    }),
  ];

  for (const item of manual) {
    const idx = solutions.findIndex((s) => s.id === item.id);
    if (idx >= 0) {
      const prev = solutions[idx];
      if (prev.image && !item.image) item.image = prev.image;
      if (prev.images?.length && !item.images?.length) item.images = prev.images;
      if (prev.overview?.length && item.overview?.[0] === item.summary) {
        // keep richer overview when present
        if (prev.overview.join(' ') !== item.overview.join(' ') && prev.overview[0] !== item.summary) {
          item.overview = prev.overview;
        }
      }
      if (prev.solutionContent?.demonstrates?.length && !item.solutionContent.demonstrates?.length) {
        item.solutionContent.demonstrates = prev.solutionContent.demonstrates;
      }
      if (prev.solutionContent?.kitIncludes?.length > item.solutionContent.kitIncludes.length) {
        item.solutionContent.kitIncludes = prev.solutionContent.kitIncludes;
      }
      solutions[idx] = item;
      byId[item.id] = item;
    } else {
      solutions.push(item);
      byId[item.id] = item;
    }
  }

  applySolutionLabels(solutions);

  const QUANTUM_ORDER = [
    'entangled-photon-source',
    'quantum-key-distribution',
    'quantum-eraser',
    'bomb-tester',
    'hbt-and-hom',
    'quantum-tomography',
    'michelson-interferometer',
  ];
  const TRAINING_ORDER = ['polarized-3d-cinema', 'fourier-optics-kit'];
  const SOTA_ORDER = [
    'pockels-cell-assemblies',
    'white-light-supercontinuum-source',
    'cw-and-pulsed-lasers',
    'ultrafast-photodiodes-assemblies',
    'regenerative-delay-line',
  ];

  for (const s of solutions) {
    // Keep rfqSections as stored in catalog (editable from site editor).
    if (!s.solutionContent) {
      s.solutionContent = { tagline: null, demonstrates: [], kitIncludes: [], capabilities: [] };
    }
    const sc = s.solutionContent;
    if (!Array.isArray(sc.kitIncludes)) sc.kitIncludes = [];
    if (!Array.isArray(sc.capabilities)) sc.capabilities = [];
    if (!sc.capabilities.includes(MADE_IN_INDIA)) sc.capabilities.push(MADE_IN_INDIA);
    if (s.pageTemplate === 'configurable') s.pageTemplate = 'solution';

    const qi = QUANTUM_ORDER.indexOf(s.id);
    const ti = TRAINING_ORDER.indexOf(s.id);
    const si = SOTA_ORDER.indexOf(s.id);
    if (qi >= 0) s.sortIndex = qi + 1;
    else if (ti >= 0) s.sortIndex = ti + 1;
    else if (si >= 0) s.sortIndex = si + 1;

    s._search = makeSearch(s);
  }

  solutions.sort((a, b) => {
    const ga = a.solutionGroup || '';
    const gb = b.solutionGroup || '';
    if (ga !== gb) return ga.localeCompare(gb);
    const ia = a.sortIndex ?? 999;
    const ib = b.sortIndex ?? 999;
    if (ia !== ib) return ia - ib;
    return a.name.localeCompare(b.name);
  });
  catalog.counts = {
    solutions: solutions.length,
    components: catalog.components.length,
  };

  return catalog;
}
