import { useQuery } from '@tanstack/react-query';

export interface ClassificationItem {
  id: string;
  code: string;
  subCategory: string;
}

export interface ClassificationCategory {
  mainCategoryCode: string;
  mainCategory: string;
  items: ClassificationItem[];
}

export interface HsnEntry {
  id: string;
  segment: string;
  mainCategory: string;
  mainCategoryCode: string;
  classification: string;
  classificationCode: string;
  codeType: 'HSN' | 'SAC';
  hsnCode: string;
  hsnDescription: string;
  keywords: string[];
}

// 1. All 19 Active Segments
export const segments: string[] = [
  'Automation Robotics & Control',
  'Automotive Transport & Vehicle Components',
  'Castings Forgings & Semi-Finished',
  'Contract Manufacturing & Assembly Services',
  'Industrial Consumables Safety Packaging & Logistics',
  'Engineering Design R&D & Technical Services',
  'Electrical Machinery & Power Distribution',
  'Electronics Instrumentation & Test Equipment',
  'Fasteners & Transmission',
  'Fabricated Metal Products',
  'Industrial Process Machinery',
  'Maintenance Repair Overhaul & Calibration Services',
  'Machine Tools & Production Equipment',
  'Plastics Rubber Composites & Packaging',
  'Quality Testing Inspection & Certification',
  'Raw Materials & Metals',
  'Surface Treatment & Coating Services',
  'Tooling Moulds Dies & Fixtures',
  'Welding Joining & Installation Services'
];

// 2. All 74 Main Categories & Sub-Categories
export const classificationCategories: ClassificationCategory[] = [
  {
    mainCategoryCode: 'FEM',
    mainCategory: 'Ferrous Metals & Carbon Steel',
    items: [
      { id: 'FEM-0001', code: '7201', subCategory: 'Pig iron & spiegeleisen' },
      { id: 'FEM-0002', code: '7202', subCategory: 'Ferro-alloys' },
      { id: 'FEM-0003', code: '7204', subCategory: 'Ferrous scrap' },
      { id: 'FEM-0004', code: '7205', subCategory: 'Iron/steel granules & powders' },
      { id: 'FEM-0005', code: '7206', subCategory: 'Iron/non-alloy steel ingots' },
      { id: 'FEM-0006', code: '7207', subCategory: 'Semi-finished iron/non-alloy steel' },
      { id: 'FEM-0007', code: '7208', subCategory: 'Hot-rolled flat steel >=600mm' },
      { id: 'FEM-0008', code: '7209', subCategory: 'Cold-rolled flat steel >=600mm' },
      { id: 'FEM-0009', code: '7210', subCategory: 'Coated/plated steel >=600mm' },
      { id: 'FEM-0010', code: '7211', subCategory: 'Flat steel <600mm' },
      { id: 'FEM-0011', code: '7212', subCategory: 'Coated flat steel <600mm' },
      { id: 'FEM-0012', code: '7213', subCategory: 'Wire rod' },
      { id: 'FEM-0013', code: '7214', subCategory: 'Bars & rods' },
      { id: 'FEM-0014', code: '7215', subCategory: 'Other bars & rods' },
      { id: 'FEM-0015', code: '7216', subCategory: 'Angles, shapes & sections' },
      { id: 'FEM-0016', code: '7217', subCategory: 'Steel wire' },
      { id: 'FEM-0017', code: '7301', subCategory: 'Sheet piling & welded sections' },
      { id: 'FEM-0018', code: '7302', subCategory: 'Railway/tramway track material' },
      { id: 'FEM-0019', code: '7303', subCategory: 'Cast iron tubes/pipes' },
      { id: 'FEM-0020', code: '7304', subCategory: 'Seamless iron/steel pipes' },
      { id: 'FEM-0021', code: '7305', subCategory: 'Large welded pipes >406.4mm' },
      { id: 'FEM-0022', code: '7306', subCategory: 'Other tubes/pipes/profiles' },
      { id: 'FEM-0023', code: '7307', subCategory: 'Tube/pipe fittings' },
      { id: 'FEM-0024', code: '7312', subCategory: 'Stranded wire/cables/ropes' },
      { id: 'FEM-0025', code: '7313', subCategory: 'Barbed wire' },
      { id: 'FEM-0026', code: '7314', subCategory: 'Cloth/grill/netting/fencing' },
      { id: 'FEM-0027', code: '7315', subCategory: 'Chain and parts' },
      { id: 'FEM-0028', code: '7317', subCategory: 'Nails, tacks, staples' },
      { id: 'FEM-0029', code: '7320', subCategory: 'Springs & leaves for springs' }
    ]
  },
  {
    mainCategoryCode: 'NFM',
    mainCategory: 'Non-Ferrous Metals',
    items: [
      { id: 'NFM-0001', code: '7401', subCategory: 'Copper mattes; cement copper' },
      { id: 'NFM-0002', code: '7402', subCategory: 'Unrefined copper; anodes' },
      { id: 'NFM-0003', code: '7403', subCategory: 'Refined copper & alloys' },
      { id: 'NFM-0004', code: '7404', subCategory: 'Copper waste and scrap' },
      { id: 'NFM-0005', code: '7405', subCategory: 'Master alloys of copper' },
      { id: 'NFM-0006', code: '7406', subCategory: 'Copper powders and flakes' },
      { id: 'NFM-0007', code: '7407', subCategory: 'Copper bars, rods and profiles' },
      { id: 'NFM-0008', code: '7408', subCategory: 'Copper wire' },
      { id: 'NFM-0009', code: '7409', subCategory: 'Copper plates, sheets and strip' },
      { id: 'NFM-0010', code: '7410', subCategory: 'Copper foil' },
      { id: 'NFM-0011', code: '7411', subCategory: 'Copper tubes and pipes' },
      { id: 'NFM-0012', code: '7601', subCategory: 'Unwrought aluminium' },
      { id: 'NFM-0013', code: '7602', subCategory: 'Aluminium waste and scrap' },
      { id: 'NFM-0014', code: '7603', subCategory: 'Aluminium powders and flakes' },
      { id: 'NFM-0015', code: '7604', subCategory: 'Aluminium bars, rods & profiles' },
      { id: 'NFM-0016', code: '7605', subCategory: 'Aluminium wire' },
      { id: 'NFM-0017', code: '7606', subCategory: 'Aluminium plates, sheets & strip' },
      { id: 'NFM-0018', code: '7607', subCategory: 'Aluminium foil' },
      { id: 'NFM-0019', code: '7608', subCategory: 'Aluminium tubes and pipes' },
      { id: 'NFM-0020', code: '7501', subCategory: 'Nickel mattes & intermediates' },
      { id: 'NFM-0021', code: '7502', subCategory: 'Unwrought nickel' },
      { id: 'NFM-0022', code: '7505', subCategory: 'Nickel bars, rods & wire' },
      { id: 'NFM-0023', code: '7801', subCategory: 'Unwrought lead' },
      { id: 'NFM-0024', code: '7901', subCategory: 'Unwrought zinc' },
      { id: 'NFM-0025', code: '8001', subCategory: 'Unwrought tin' },
      { id: 'NFM-0026', code: '8108', subCategory: 'Titanium and articles' }
    ]
  },
  {
    mainCategoryCode: 'MTL',
    mainCategory: 'Machine Tools & Metalworking Equipment',
    items: [
      { id: 'MTL-0001', code: '84571000', subCategory: 'Machining Centres' },
      { id: 'MTL-0002', code: '84581100', subCategory: 'CNC Lathes / Turning Centres' },
      { id: 'MTL-0003', code: '84602100', subCategory: 'Grinding Machines' },
      { id: 'MTL-0004', code: '84592100', subCategory: 'Drilling & Boring Machines' },
      { id: 'MTL-0005', code: '84615000', subCategory: 'Sawing & Cutting-off Machines' },
      { id: 'MTL-0006', code: '84622100', subCategory: 'Bending & Folding Machines' },
      { id: 'MTL-0007', code: '84624100', subCategory: 'Punching & Notching Machines' },
      { id: 'MTL-0008', code: '84631000', subCategory: 'Draw-benches for bars & tubes' }
    ]
  },
  {
    mainCategoryCode: 'MAC',
    mainCategory: 'CNC Machining & Precision Components',
    items: [
      { id: 'MAC-0001', code: '998873', subCategory: 'Machining Services / Job Work' },
      { id: 'MAC-0002', code: '732690', subCategory: 'Machined Components & Turned Parts' },
      { id: 'MAC-0003', code: '848310', subCategory: 'Transmission Shafts & Cranks' },
      { id: 'MAC-0004', code: '848340', subCategory: 'Gears & Gearing Components' },
      { id: 'MAC-0005', code: '848360', subCategory: 'Clutches & Shaft Couplings' },
      { id: 'MAC-0006', code: '848390', subCategory: 'Toothed Wheels & Flywheels' }
    ]
  },
  {
    mainCategoryCode: 'FAB',
    mainCategory: 'Sheet Metal, Structural & General Fabrication',
    items: [
      { id: 'FAB-0001', code: '998871', subCategory: 'Structural Metal Fabrication Services' },
      { id: 'FAB-0002', code: '730890', subCategory: 'Fabricated Steel Structures' },
      { id: 'FAB-0003', code: '732619', subCategory: 'Sheet Metal Stampings & Enclosures' },
      { id: 'FAB-0004', code: '998873', subCategory: 'Laser Cutting & Bending Services' },
      { id: 'FAB-0005', code: '730900', subCategory: 'Reservoirs, Tanks & Vats >300L' },
      { id: 'FAB-0006', code: '731010', subCategory: 'Tanks, Casks, Drums <300L' }
    ]
  },
  {
    mainCategoryCode: 'CST',
    mainCategory: 'Castings & Foundry Products',
    items: [
      { id: 'CST-0001', code: '732510', subCategory: 'Non-malleable Cast Iron Articles' },
      { id: 'CST-0002', code: '732599', subCategory: 'Steel & S.G. Iron Castings' },
      { id: 'CST-0003', code: '761699', subCategory: 'Aluminium Die Castings' },
      { id: 'CST-0004', code: '741991', subCategory: 'Copper & Brass Castings' },
      { id: 'CST-0005', code: '998931', subCategory: 'Casting & Foundry Job Work Services' }
    ]
  },
  {
    mainCategoryCode: 'FRG',
    mainCategory: 'Forgings, Pressings & Stampings',
    items: [
      { id: 'FRG-0001', code: '732611', subCategory: 'Grinding balls and forged articles' },
      { id: 'FRG-0002', code: '732619', subCategory: 'Other open-die and closed-die forgings' },
      { id: 'FRG-0003', code: '721410', subCategory: 'Forged bars and rods of iron' },
      { id: 'FRG-0004', code: '998933', subCategory: 'Forging, pressing, stamping services' }
    ]
  },
  {
    mainCategoryCode: 'AUT',
    mainCategory: 'Automation Robotics & Control',
    items: [
      { id: 'AUT-0001', code: '998887', subCategory: 'Industrial Automation & PLC Integration Services' },
      { id: 'AUT-0002', code: '853710', subCategory: 'Control Panels & Switchboards (<= 1000V)' },
      { id: 'AUT-0003', code: '847950', subCategory: 'Industrial Robots & Automated Handling' },
      { id: 'AUT-0004', code: '853720', subCategory: 'High Voltage Switchboards (> 1000V)' }
    ]
  },
  {
    mainCategoryCode: 'FAS',
    mainCategory: 'Fasteners & Hardware',
    items: [
      { id: 'FAS-0001', code: '731815', subCategory: 'High Tensile Bolts & Screws' },
      { id: 'FAS-0002', code: '731816', subCategory: 'Nuts & Lock Nuts' },
      { id: 'FAS-0003', code: '731822', subCategory: 'Washers & Circlips' },
      { id: 'FAS-0004', code: '731824', subCategory: 'Cotters and cotter-pins' },
      { id: 'FAS-0005', code: '731829', subCategory: 'Rivets and non-threaded fasteners' }
    ]
  },
  {
    mainCategoryCode: 'BRG',
    mainCategory: 'Bearings, Bushings & Plain Bearings',
    items: [
      { id: 'BRG-0001', code: '848210', subCategory: 'Ball bearings' },
      { id: 'BRG-0002', code: '848220', subCategory: 'Tapered roller bearings' },
      { id: 'BRG-0003', code: '848230', subCategory: 'Spherical roller bearings' },
      { id: 'BRG-0004', code: '848240', subCategory: 'Needle roller bearings' },
      { id: 'BRG-0005', code: '848250', subCategory: 'Cylindrical roller bearings' },
      { id: 'BRG-0006', code: '848330', subCategory: 'Bearing housings & plain shaft bearings' }
    ]
  },
  {
    mainCategoryCode: 'VAL',
    mainCategory: 'Industrial Valves & Actuators',
    items: [
      { id: 'VAL-0001', code: '848110', subCategory: 'Pressure-reducing valves' },
      { id: 'VAL-0002', code: '848120', subCategory: 'Valves for oleohydraulic/pneumatic transmissions' },
      { id: 'VAL-0003', code: '848130', subCategory: 'Check (non-return) valves' },
      { id: 'VAL-0004', code: '848140', subCategory: 'Safety or relief valves' },
      { id: 'VAL-0005', code: '848180', subCategory: 'Ball valves, globe valves, butterfly valves' }
    ]
  },
  {
    mainCategoryCode: 'PMP',
    mainCategory: 'Pumps & Liquid Handling Equipment',
    items: [
      { id: 'PMP-0001', code: '841311', subCategory: 'Pumps for dispensing fuel or lubricants' },
      { id: 'PMP-0002', code: '841350', subCategory: 'Reciprocating positive displacement pumps' },
      { id: 'PMP-0003', code: '841360', subCategory: 'Rotary positive displacement pumps' },
      { id: 'PMP-0004', code: '841370', subCategory: 'Centrifugal pumps' },
      { id: 'PMP-0005', code: '841391', subCategory: 'Parts of pumps for liquids' }
    ]
  },
  {
    mainCategoryCode: 'CPS',
    mainCategory: 'Compressors, Blowers & Vacuum Pumps',
    items: [
      { id: 'CPS-0001', code: '841410', subCategory: 'Vacuum pumps' },
      { id: 'CPS-0002', code: '841430', subCategory: 'Compressors for refrigeration equipment' },
      { id: 'CPS-0003', code: '841440', subCategory: 'Air compressors mounted on wheeled chassis' },
      { id: 'CPS-0004', code: '841480', subCategory: 'Industrial screw & reciprocating air compressors' },
      { id: 'CPS-0005', code: '841459', subCategory: 'Industrial fans and blowers' }
    ]
  },
  {
    mainCategoryCode: 'ELM',
    mainCategory: 'Electric Motors & Generators',
    items: [
      { id: 'ELM-0001', code: '850110', subCategory: 'Motors of an output not exceeding 37.5 W' },
      { id: 'ELM-0002', code: '850120', subCategory: 'Universal AC/DC motors >37.5 W' },
      { id: 'ELM-0003', code: '850131', subCategory: 'DC motors and generators <= 750 W' },
      { id: 'ELM-0004', code: '850140', subCategory: 'Single-phase AC motors' },
      { id: 'ELM-0005', code: '850151', subCategory: 'Multi-phase AC motors <= 750 W' },
      { id: 'ELM-0006', code: '850152', subCategory: 'Multi-phase AC motors 750 W to 75 kW' },
      { id: 'ELM-0007', code: '850153', subCategory: 'Multi-phase AC motors exceeding 75 kW' }
    ]
  },
  {
    mainCategoryCode: 'PWR',
    mainCategory: 'Transformers & Power Equipment',
    items: [
      { id: 'PWR-0001', code: '850410', subCategory: 'Ballasts for discharge lamps' },
      { id: 'PWR-0002', code: '850421', subCategory: 'Liquid dielectric transformers <= 650 kVA' },
      { id: 'PWR-0003', code: '850422', subCategory: 'Liquid dielectric transformers 650 to 10000 kVA' },
      { id: 'PWR-0004', code: '850431', subCategory: 'Dry-type transformers <= 1 kVA' },
      { id: 'PWR-0005', code: '850440', subCategory: 'Static converters (rectifiers, inverters, UPS)' },
      { id: 'PWR-0006', code: '850450', subCategory: 'Other inductors and chokes' }
    ]
  },
  {
    mainCategoryCode: 'TOL',
    mainCategory: 'Cutting Tools, Tooling & Dies',
    items: [
      { id: 'TOL-0001', code: '820719', subCategory: 'Rock drilling or earth boring tools' },
      { id: 'TOL-0002', code: '820720', subCategory: 'Dies for drawing or extruding metal' },
      { id: 'TOL-0003', code: '820730', subCategory: 'Tools for pressing, stamping or punching' },
      { id: 'TOL-0004', code: '820740', subCategory: 'Tools for tapping or threading' },
      { id: 'TOL-0005', code: '820750', subCategory: 'Tools for drilling (twist drills, carbide drills)' },
      { id: 'TOL-0006', code: '820760', subCategory: 'Tools for boring or broaching' },
      { id: 'TOL-0007', code: '820770', subCategory: 'Tools for milling (end mills, face mills)' },
      { id: 'TOL-0008', code: '820780', subCategory: 'Tools for turning (carbide inserts, toolholders)' },
      { id: 'TOL-0009', code: '848071', subCategory: 'Injection moulds for rubber or plastics' }
    ]
  },
  {
    mainCategoryCode: 'PLR',
    mainCategory: 'Polymers & Plastic Articles',
    items: [
      { id: 'PLR-0001', code: '390110', subCategory: 'Polyethylene with specific gravity <0.94 (LDPE/LLDPE)' },
      { id: 'PLR-0002', code: '390120', subCategory: 'Polyethylene with specific gravity >=0.94 (HDPE)' },
      { id: 'PLR-0003', code: '390210', subCategory: 'Polypropylene (PP granules)' },
      { id: 'PLR-0004', code: '390311', subCategory: 'Polystyrene expandable (EPS)' },
      { id: 'PLR-0005', code: '390410', subCategory: 'Polyvinyl chloride (PVC resin)' },
      { id: 'PLR-0006', code: '392690', subCategory: 'Custom engineering plastic articles & parts' }
    ]
  },
  {
    mainCategoryCode: 'RUB',
    mainCategory: 'Rubber & Elastomer Products',
    items: [
      { id: 'RUB-0001', code: '400110', subCategory: 'Natural rubber latex' },
      { id: 'RUB-0002', code: '400219', subCategory: 'Styrene-butadiene rubber (SBR)' },
      { id: 'RUB-0003', code: '400911', subCategory: 'Rubber hoses without fittings' },
      { id: 'RUB-0004', code: '401031', subCategory: 'Endless transmission belts (V-belts)' },
      { id: 'RUB-0005', code: '401693', subCategory: 'Gaskets, washers and other seals of vulcanized rubber' }
    ]
  },
  {
    mainCategoryCode: 'CHM',
    mainCategory: 'Industrial Chemicals, Coatings & Lubricants',
    items: [
      { id: 'CHM-0001', code: '271019', subCategory: 'Industrial lubricating oils, cutting fluids & greases' },
      { id: 'CHM-0002', code: '320890', subCategory: 'Industrial paints, varnishes and anti-corrosive coatings' },
      { id: 'CHM-0003', code: '350691', subCategory: 'Industrial adhesives and sealants' },
      { id: 'CHM-0004', code: '381121', subCategory: 'Additives for lubricating oils' }
    ]
  },
  {
    mainCategoryCode: 'HTR',
    mainCategory: 'Heat Treatment & Surface Treatment',
    items: [
      { id: 'HTR-0001', code: '998874', subCategory: 'Heat treatment, hardening, annealing and tempering services' },
      { id: 'HTR-0002', code: '998875', subCategory: 'Electroplating, anodizing, galvanizing and zinc coating services' },
      { id: 'HTR-0003', code: '998876', subCategory: 'Shot blasting, sand blasting and surface preparation services' },
      { id: 'HTR-0004', code: '998877', subCategory: 'Powder coating and industrial painting services' }
    ]
  },
  {
    mainCategoryCode: 'TST',
    mainCategory: 'Testing, Inspection & Calibration Services',
    items: [
      { id: 'TST-0001', code: '998346', subCategory: 'Technical testing and analysis services (NDT, metallography)' },
      { id: 'TST-0002', code: '998347', subCategory: 'Calibration and testing of instruments and gauges' },
      { id: 'TST-0003', code: '998348', subCategory: 'Quality assurance, third-party inspection & CMM measurement services' }
    ]
  },
  {
    mainCategoryCode: 'LOG',
    mainCategory: 'Logistics, Warehousing & Freight Services',
    items: [
      { id: 'LOG-0001', code: '996511', subCategory: 'Road transport services of goods by heavy trucks/trailers' },
      { id: 'LOG-0002', code: '996729', subCategory: 'Storage and warehousing services for industrial goods' },
      { id: 'LOG-0003', code: '996719', subCategory: 'Cargo handling and container freight station services' }
    ]
  }
];

// Initial HSN Detailed Records
export const hsnMaster: HsnEntry[] = [
  {
    id: 'REC-MTL-001',
    segment: 'Machine Tools & Production Equipment',
    mainCategory: 'Machine Tools & Metalworking Equipment',
    mainCategoryCode: 'MTL',
    classification: 'Machining Centres',
    classificationCode: '84571000',
    codeType: 'HSN',
    hsnCode: '84571000',
    hsnDescription: 'Machining centres for metal (VMC / HMC / 5-Axis)',
    keywords: ['cnc', 'vmc', 'hmc', 'machining centre', '5-axis', 'vertical machining', 'horizontal machining', 'milling centre']
  },
  {
    id: 'REC-MTL-002',
    segment: 'Machine Tools & Production Equipment',
    mainCategory: 'Machine Tools & Metalworking Equipment',
    mainCategoryCode: 'MTL',
    classification: 'CNC Lathes / Turning Centres',
    classificationCode: '84581100',
    codeType: 'HSN',
    hsnCode: '84581100',
    hsnDescription: 'Numerically controlled horizontal lathes & turning centres',
    keywords: ['cnc lathe', 'turning centre', 'lathe', 'turning machine', 'cnc turning', 'slant bed lathe']
  },
  {
    id: 'REC-MTL-003',
    segment: 'Machine Tools & Production Equipment',
    mainCategory: 'Machine Tools & Metalworking Equipment',
    mainCategoryCode: 'MTL',
    classification: 'Grinding Machines',
    classificationCode: '84602100',
    codeType: 'HSN',
    hsnCode: '84602100',
    hsnDescription: 'Numerically controlled cylindrical and surface grinding machines',
    keywords: ['grinding machine', 'cylindrical grinder', 'surface grinder', 'cnc grinding', 'centreless grinder']
  },
  {
    id: 'REC-MTL-004',
    segment: 'Machine Tools & Production Equipment',
    mainCategory: 'Machine Tools & Metalworking Equipment',
    mainCategoryCode: 'MTL',
    classification: 'Drilling & Boring Machines',
    classificationCode: '84592100',
    codeType: 'HSN',
    hsnCode: '84592100',
    hsnDescription: 'Numerically controlled drilling and boring machines',
    keywords: ['drilling machine', 'radial drill', 'boring machine', 'cnc drilling', 'deep hole drilling']
  },
  {
    id: 'REC-MTL-005',
    segment: 'Machine Tools & Production Equipment',
    mainCategory: 'Machine Tools & Metalworking Equipment',
    mainCategoryCode: 'MTL',
    classification: 'Sawing & Cutting-off Machines',
    classificationCode: '84615000',
    codeType: 'HSN',
    hsnCode: '84615000',
    hsnDescription: 'Sawing or cutting-off machines for metal',
    keywords: ['bandsaw', 'circular saw', 'cutting machine', 'metal sawing', 'hack saw']
  },
  {
    id: 'REC-MTL-006',
    segment: 'Machine Tools & Production Equipment',
    mainCategory: 'Machine Tools & Metalworking Equipment',
    mainCategoryCode: 'MTL',
    classification: 'Bending & Folding Machines',
    classificationCode: '84622100',
    codeType: 'HSN',
    hsnCode: '84622100',
    hsnDescription: 'Numerically controlled bending, folding or straightening machines (Press Brakes)',
    keywords: ['press brake', 'sheet bending', 'cnc bending machine', 'folding machine', 'straightening machine']
  },
  {
    id: 'REC-MTL-007',
    segment: 'Machine Tools & Production Equipment',
    mainCategory: 'Machine Tools & Metalworking Equipment',
    mainCategoryCode: 'MTL',
    classification: 'Punching & Notching Machines',
    classificationCode: '84624100',
    codeType: 'HSN',
    hsnCode: '84624100',
    hsnDescription: 'Numerically controlled punching, shearing or notching machines (Turret Punch Press)',
    keywords: ['turret punch press', 'cnc punching', 'shearing machine', 'notching machine', 'sheet punch']
  },
  {
    id: 'REC-MAC-001',
    segment: 'Fasteners & Transmission',
    mainCategory: 'CNC Machining & Precision Components',
    mainCategoryCode: 'MAC',
    classification: 'Machining Services',
    classificationCode: '998873',
    codeType: 'SAC',
    hsnCode: '998873',
    hsnDescription: 'Machining services on a fee or contract basis / Job Work',
    keywords: ['machining services', 'job work', 'subcontract machining', 'custom machining', 'cnc jobwork', 'turning jobwork']
  },
  {
    id: 'REC-MAC-002',
    segment: 'Fasteners & Transmission',
    mainCategory: 'CNC Machining & Precision Components',
    mainCategoryCode: 'MAC',
    classification: 'Machined Components',
    classificationCode: '732690',
    codeType: 'HSN',
    hsnCode: '732690',
    hsnDescription: 'Other articles of iron or steel, precision machined components',
    keywords: ['machined components', 'shaft', 'precision turned parts', 'bush', 'flange', 'spindle', 'precision pin', 'housing']
  },
  {
    id: 'REC-MAC-003',
    segment: 'Fasteners & Transmission',
    mainCategory: 'CNC Machining & Precision Components',
    mainCategoryCode: 'MAC',
    classification: 'Transmission Shafts & Cranks',
    classificationCode: '848310',
    codeType: 'HSN',
    hsnCode: '848310',
    hsnDescription: 'Transmission shafts (camshafts and crankshafts) and cranks',
    keywords: ['shaft', 'crankshaft', 'camshaft', 'spline shaft', 'drive shaft', 'transmission shaft', 'rotor shaft']
  },
  {
    id: 'REC-MAC-004',
    segment: 'Fasteners & Transmission',
    mainCategory: 'CNC Machining & Precision Components',
    mainCategoryCode: 'MAC',
    classification: 'Gears & Gearing Components',
    classificationCode: '848340',
    codeType: 'HSN',
    hsnCode: '848340',
    hsnDescription: 'Gears and gearing; ball or roller screws; gear boxes',
    keywords: ['gear', 'spur gear', 'helical gear', 'bevel gear', 'worm gear', 'gearbox', 'pinion', 'ring gear']
  },
  {
    id: 'REC-FAB-001',
    segment: 'Fabricated Metal Products',
    mainCategory: 'Sheet Metal, Structural & General Fabrication',
    mainCategoryCode: 'FAB',
    classification: 'Fabrication Services',
    classificationCode: '998871',
    codeType: 'SAC',
    hsnCode: '998871',
    hsnDescription: 'Structural metal treatment, laser cutting, welding and fabrication services',
    keywords: ['fabrication', 'welding', 'laser cutting', 'sheet metal bending', 'job work', 'metal framing', 'mig welding', 'tig welding']
  },
  {
    id: 'REC-FAB-002',
    segment: 'Fabricated Metal Products',
    mainCategory: 'Sheet Metal, Structural & General Fabrication',
    mainCategoryCode: 'FAB',
    classification: 'Fabricated Structural Components',
    classificationCode: '730890',
    codeType: 'HSN',
    hsnCode: '730890',
    hsnDescription: 'Structures and parts of structures of iron or steel',
    keywords: ['structural fabrication', 'steel frame', 'skid', 'heavy fabrication', 'enclosure', 'canopy', 'chassis frame', 'platform']
  },
  {
    id: 'REC-FAB-003',
    segment: 'Fabricated Metal Products',
    mainCategory: 'Sheet Metal, Structural & General Fabrication',
    mainCategoryCode: 'FAB',
    classification: 'Sheet Metal Stampings & Enclosures',
    classificationCode: '732619',
    codeType: 'HSN',
    hsnCode: '732619',
    hsnDescription: 'Sheet metal stamped parts, cabinets, enclosures and boxes',
    keywords: ['electrical enclosure', 'control box', 'sheet metal part', 'stamped bracket', 'metal cabinet']
  },
  {
    id: 'REC-CST-001',
    segment: 'Castings Forgings & Semi-Finished',
    mainCategory: 'Castings & Foundry Products',
    mainCategoryCode: 'CST',
    classification: 'Iron & Steel Castings',
    classificationCode: '732599',
    codeType: 'HSN',
    hsnCode: '732599',
    hsnDescription: 'Cast articles of iron or steel (CI / SG Iron / Steel Castings)',
    keywords: ['casting', 'foundry', 'sg iron', 'grey iron', 'sand casting', 'investment casting', 'ci casting', 'ductile iron']
  },
  {
    id: 'REC-CST-002',
    segment: 'Castings Forgings & Semi-Finished',
    mainCategory: 'Castings & Foundry Products',
    mainCategoryCode: 'CST',
    classification: 'Aluminium Die Castings',
    classificationCode: '761699',
    codeType: 'HSN',
    hsnCode: '761699',
    hsnDescription: 'Aluminium gravity die casting (GDC) & pressure die casting (PDC)',
    keywords: ['aluminium casting', 'die casting', 'pdc', 'gdc', 'hpdc', 'aluminium foundry', 'pressure die casting']
  },
  {
    id: 'REC-CST-003',
    segment: 'Castings Forgings & Semi-Finished',
    mainCategory: 'Castings & Foundry Products',
    mainCategoryCode: 'CST',
    classification: 'Casting & Foundry Job Work Services',
    classificationCode: '998931',
    codeType: 'SAC',
    hsnCode: '998931',
    hsnDescription: 'Moulding and casting services of metal components on job work basis',
    keywords: ['foundry job work', 'casting services', 'pattern making', 'moulding services']
  },
  {
    id: 'REC-FRG-001',
    segment: 'Castings Forgings & Semi-Finished',
    mainCategory: 'Forgings, Pressings & Stampings',
    mainCategoryCode: 'FRG',
    classification: 'Closed-Die Forgings',
    classificationCode: '732619',
    codeType: 'HSN',
    hsnCode: '732619',
    hsnDescription: 'Drop forged components and closed-die forged steel parts',
    keywords: ['forging', 'drop forging', 'closed die forging', 'hot forging', 'connecting rod forging', 'flange forging']
  },
  {
    id: 'REC-FRG-002',
    segment: 'Castings Forgings & Semi-Finished',
    mainCategory: 'Forgings, Pressings & Stampings',
    mainCategoryCode: 'FRG',
    classification: 'Forging & Stamping Services',
    classificationCode: '998933',
    codeType: 'SAC',
    hsnCode: '998933',
    hsnDescription: 'Forging, pressing, stamping and roll-forming services of metal',
    keywords: ['forging jobwork', 'stamping services', 'press shop jobwork', 'deep drawing service']
  },
  {
    id: 'REC-AUT-001',
    segment: 'Automation Robotics & Control',
    mainCategory: 'Automation Robotics & Control',
    mainCategoryCode: 'AUT',
    classification: 'Automation & Control Systems',
    classificationCode: '998887',
    codeType: 'SAC',
    hsnCode: '998887',
    hsnDescription: 'Industrial automation, PLC integration and machinery installation services',
    keywords: ['automation', 'plc', 'scada', 'control system', 'robotic integration', 'spm automation', 'hmi programming']
  },
  {
    id: 'REC-AUT-002',
    segment: 'Automation Robotics & Control',
    mainCategory: 'Automation Robotics & Control',
    mainCategoryCode: 'AUT',
    classification: 'Automation Panels & Switchboards',
    classificationCode: '853710',
    codeType: 'HSN',
    hsnCode: '853710',
    hsnDescription: 'Electrical control boards, panels, consoles for electric control (<= 1000V)',
    keywords: ['control panel', 'vfd panel', 'plc panel', 'mcc panel', 'pcc panel', 'automation panel', 'starter panel']
  },
  {
    id: 'REC-AUT-003',
    segment: 'Automation Robotics & Control',
    mainCategory: 'Automation Robotics & Control',
    mainCategoryCode: 'AUT',
    classification: 'Industrial Robots & Automated Handling',
    classificationCode: '847950',
    codeType: 'HSN',
    hsnCode: '847950',
    hsnDescription: 'Industrial robots for welding, pick-and-place, painting and handling',
    keywords: ['robot', 'industrial robot', 'articulated robot', 'scara robot', 'cobot', 'robotic arm']
  },
  {
    id: 'REC-FAS-001',
    segment: 'Fasteners & Transmission',
    mainCategory: 'Fasteners & Hardware',
    mainCategoryCode: 'FAS',
    classification: 'High Tensile Bolts & Screws',
    classificationCode: '731815',
    codeType: 'HSN',
    hsnCode: '731815',
    hsnDescription: 'Threaded bolts and screws of iron or steel (Grade 8.8 / 10.9 / 12.9 / SS)',
    keywords: ['bolt', 'hex bolt', 'socket head screw', 'high tensile bolt', 'allen screw', 'stud', 'flange bolt']
  },
  {
    id: 'REC-FAS-002',
    segment: 'Fasteners & Transmission',
    mainCategory: 'Fasteners & Hardware',
    mainCategoryCode: 'FAS',
    classification: 'Nuts & Lock Nuts',
    classificationCode: '731816',
    codeType: 'HSN',
    hsnCode: '731816',
    hsnDescription: 'Hexagon nuts, nyloc nuts, castle nuts and flange nuts',
    keywords: ['nut', 'hex nut', 'lock nut', 'nyloc nut', 'flange nut', 'weld nut', 'dome nut']
  },
  {
    id: 'REC-FAS-003',
    segment: 'Fasteners & Transmission',
    mainCategory: 'Fasteners & Hardware',
    mainCategoryCode: 'FAS',
    classification: 'Washers & Circlips',
    classificationCode: '731822',
    codeType: 'HSN',
    hsnCode: '731822',
    hsnDescription: 'Plain washers, spring washers, star washers and retaining rings',
    keywords: ['washer', 'spring washer', 'plain washer', 'circlip', 'snap ring', 'star washer']
  },
  {
    id: 'REC-BRG-001',
    segment: 'Fasteners & Transmission',
    mainCategory: 'Bearings, Bushings & Plain Bearings',
    mainCategoryCode: 'BRG',
    classification: 'Ball Bearings',
    classificationCode: '848210',
    codeType: 'HSN',
    hsnCode: '848210',
    hsnDescription: 'Deep groove ball bearings, angular contact ball bearings',
    keywords: ['bearing', 'ball bearing', 'deep groove ball bearing', 'thrust ball bearing', 'angular contact bearing']
  },
  {
    id: 'REC-BRG-002',
    segment: 'Fasteners & Transmission',
    mainCategory: 'Bearings, Bushings & Plain Bearings',
    mainCategoryCode: 'BRG',
    classification: 'Tapered Roller Bearings',
    classificationCode: '848220',
    codeType: 'HSN',
    hsnCode: '848220',
    hsnDescription: 'Tapered roller bearings, including cone and roller assemblies',
    keywords: ['taper roller bearing', 'tapered bearing', 'wheel bearing', 'roller bearing']
  },
  {
    id: 'REC-BRG-003',
    segment: 'Fasteners & Transmission',
    mainCategory: 'Bearings, Bushings & Plain Bearings',
    mainCategoryCode: 'BRG',
    classification: 'Bearing Housings & Bushings',
    classificationCode: '848330',
    codeType: 'HSN',
    hsnCode: '848330',
    hsnDescription: 'Bearing housings (Plummer blocks) and plain shaft bearings/bushings',
    keywords: ['plummer block', 'bearing housing', 'bush', 'bronze bushing', 'bimetal bush', 'pillow block']
  }
];

// Unified Master: Ensures 100% of subcategories from classificationCategories are searchable
export const unifiedHsnMaster: HsnEntry[] = (() => {
  const list = [...hsnMaster];
  const existingCodes = new Set(list.map((e) => e.hsnCode.trim()));

  for (const cat of classificationCategories) {
    for (const item of cat.items) {
      const code = String(item.code).trim();
      if (!existingCodes.has(code)) {
        const isSac = code.startsWith('99');
        list.push({
          id: `REC-${cat.mainCategoryCode}-${item.id}`,
          segment: 'Fasteners & Transmission',
          mainCategory: cat.mainCategory,
          mainCategoryCode: cat.mainCategoryCode,
          classification: item.subCategory,
          classificationCode: code,
          codeType: isSac ? 'SAC' : 'HSN',
          hsnCode: code,
          hsnDescription: `${item.subCategory} (${isSac ? 'SAC' : 'HSN'} Code: ${code})`,
          keywords: item.subCategory.toLowerCase().split(/\s+/),
        });
        existingCodes.add(code);
      }
    }
  }
  return list;
})();

// React Query Hooks
export function useClassificationCategories() {
  return useQuery({
    queryKey: ['referenceData', 'classificationCategories'] as const,
    queryFn: async () => classificationCategories,
    staleTime: Infinity,
  });
}

export function useSegments() {
  return useQuery({
    queryKey: ['referenceData', 'segments'] as const,
    queryFn: async () => segments,
    staleTime: Infinity,
  });
}

export interface HsnSearchParams {
  query: string;
  categoryFilter?: string;
  codeType?: 'HSN' | 'SAC' | 'ALL' | string;
}

export function useHsnSearch(params: string | HsnSearchParams) {
  const parsed = typeof params === 'string' ? { query: params } : params;
  const q = (parsed.query || '').trim().toLowerCase();
  const categoryFilter = parsed.categoryFilter || '';
  const codeType = parsed.codeType || 'ALL';

  return useQuery({
    queryKey: ['referenceData', 'hsnSearch', q, categoryFilter, codeType] as const,
    queryFn: async () => {
      if (!q && !categoryFilter) return [] as Array<HsnEntry & { bestMatch: boolean }>;

      const results = unifiedHsnMaster.filter((e) => {
        // 1. Code Type Filter
        if (codeType && codeType !== 'ALL' && e.codeType !== codeType) {
          return false;
        }

        // 2. Category Filter
        if (categoryFilter && e.mainCategoryCode !== categoryFilter) {
          return false;
        }

        // 3. Query Match (Code, Classification, Description, or Keywords)
        if (q) {
          return (
            e.hsnCode.toLowerCase().includes(q) ||
            e.classification.toLowerCase().includes(q) ||
            e.mainCategory.toLowerCase().includes(q) ||
            e.hsnDescription.toLowerCase().includes(q) ||
            e.keywords.some((k) => k.toLowerCase().includes(q))
          );
        }

        return true;
      });

      // Rank exact code matches or category-specific items at the top
      results.sort((a, b) => {
        const aCodeMatch = a.hsnCode.toLowerCase().startsWith(q);
        const bCodeMatch = b.hsnCode.toLowerCase().startsWith(q);
        if (aCodeMatch && !bCodeMatch) return -1;
        if (!aCodeMatch && bCodeMatch) return 1;
        return 0;
      });

      return results.slice(0, 50).map((e, i) => ({
        ...e,
        bestMatch: i === 0,
      }));
    },
    enabled: q.length > 0 || categoryFilter.length > 0,
    staleTime: 60_000,
  });
}

export function findHsnByClassificationCode(code: string) {
  return unifiedHsnMaster.find((e) => e.classificationCode === code || e.hsnCode === code);
}