import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  CompanySettings,
  DashboardSummary,
  Department,
  GatePass,
  GatePassItem,
  StockItem,
  StoredUser,
  TransactionType,
  User,
} from '../src/types/gatepass.ts';
import {
  calculateGatePassTotals,
  calculateItemRow,
  round2,
} from '../src/utils/calculations.ts';

interface DatabaseSchema {
  users: StoredUser[];
  departments: Department[];
  stockItems: StockItem[];
  gatePasses: GatePass[];
  settings: CompanySettings;
  sequenceCounter: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'tjd-gatepass-db.json');

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function buildSeedData(): DatabaseSchema {
  const now = new Date('2026-11-10T09:00:00.000Z');
  const isoOffset = (daysAgo: number, hour = 10) => {
    const d = new Date(now.getTime() - daysAgo * 86400000);
    d.setUTCHours(hour, 15, 0, 0);
    return d.toISOString();
  };

  const departments: Department[] = [
    {
      id: 'dept_hdtn',
      code: 'HDTN',
      name: 'HDTN',
      costCenter: 'CC-100',
      hodName: '',
      active: true,
      createdAt: isoOffset(120),
    },
    {
      id: 'dept_maint',
      code: 'MAINT',
      name: 'Maintenance & Utilities',
      costCenter: 'CC-101',
      hodName: 'R. K. Deshmukh',
      active: true,
      createdAt: isoOffset(120),
    },
    {
      id: 'dept_prod',
      code: 'PROD',
      name: 'Production & Assembly',
      costCenter: 'CC-204',
      hodName: 'S. M. Kulkarni',
      active: true,
      createdAt: isoOffset(120),
    },
    {
      id: 'dept_qa',
      code: 'QA',
      name: 'Quality Assurance & Calibration',
      costCenter: 'CC-302',
      hodName: 'Anjali Verma',
      active: true,
      createdAt: isoOffset(120),
    },
    {
      id: 'dept_eng',
      code: 'ENG',
      name: 'Tooling & Engineering',
      costCenter: 'CC-401',
      hodName: 'Mahesh Iyer',
      active: true,
      createdAt: isoOffset(120),
    },
    {
      id: 'dept_it',
      code: 'IT',
      name: 'IT & Plant Automation',
      costCenter: 'CC-505',
      hodName: 'Nikhil Joshi',
      active: true,
      createdAt: isoOffset(120),
    },
    {
      id: 'dept_stores',
      code: 'STORES',
      name: 'Central Stores & Logistics',
      costCenter: 'CC-108',
      hodName: 'Prakash Nair',
      active: true,
      createdAt: isoOffset(120),
    },
  ];

  const users: StoredUser[] = [
    {
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@tjdindustries.in',
      fullName: 'Rajesh Sharma',
      role: 'ADMIN',
      departmentId: 'dept_stores',
      departmentName: 'Central Stores & Logistics',
      password: 'password123',
      active: true,
      createdAt: isoOffset(120),
    },
    {
      id: 'usr_operator',
      username: 'operator',
      email: 'priya.nair@tjdindustries.in',
      fullName: 'Priya Nair',
      role: 'OPERATOR',
      departmentId: 'dept_prod',
      departmentName: 'Production & Assembly',
      password: 'password123',
      active: true,
      createdAt: isoOffset(110),
    },
    {
      id: 'usr_supervisor',
      username: 'supervisor',
      email: 'vikram.patel@tjdindustries.in',
      fullName: 'Vikram Patel',
      role: 'SUPERVISOR',
      departmentId: 'dept_maint',
      departmentName: 'Maintenance & Utilities',
      password: 'password123',
      active: true,
      createdAt: isoOffset(100),
    },
    {
      id: 'usr_security',
      username: 'security',
      email: 'gate.security@tjdindustries.in',
      fullName: 'Suresh Kumar',
      role: 'SECURITY',
      departmentId: 'dept_stores',
      departmentName: 'Central Stores & Logistics',
      password: 'password123',
      active: true,
      createdAt: isoOffset(90),
    },
  ];

  const stockItems: StockItem[] = [
    {
      id: 'stk_01',
      stockNo: 'NS-HYD-104',
      description: 'Rexroth Hydraulic Proportional Control Valve 4WRE',
      uom: 'NOS',
      hsnCode: '84812000',
      unitPrice: 18500,
      taxPercent: 18,
      category: 'Hydraulics',
      active: true,
      createdAt: isoOffset(90),
    },
    {
      id: 'stk_02',
      stockNo: 'NS-BRG-209',
      description: 'SKF Precision Angular Contact Spindle Bearing 7014 CD/P4A',
      uom: 'SET',
      hsnCode: '84821090',
      unitPrice: 14200,
      taxPercent: 18,
      category: 'Mechanical',
      active: true,
      createdAt: isoOffset(90),
    },
    {
      id: 'stk_03',
      stockNo: 'NS-CAL-312',
      description: 'Mitutoyo Digital Vernier Caliper 0-300mm IP67',
      uom: 'NOS',
      hsnCode: '90173010',
      unitPrice: 9800,
      taxPercent: 18,
      category: 'Metrology',
      active: true,
      createdAt: isoOffset(85),
    },
    {
      id: 'stk_04',
      stockNo: 'NS-ELC-418',
      description: 'Siemens SINAMICS Servo Drive Power Module 2.2kW',
      uom: 'NOS',
      hsnCode: '85044090',
      unitPrice: 32500,
      taxPercent: 18,
      category: 'Electrical',
      active: true,
      createdAt: isoOffset(80),
    },
    {
      id: 'stk_05',
      stockNo: 'NS-PNE-502',
      description: 'Festo Double Acting Pneumatic Cylinder DNC-63-250',
      uom: 'NOS',
      hsnCode: '84123100',
      unitPrice: 6400,
      taxPercent: 18,
      category: 'Pneumatics',
      active: true,
      createdAt: isoOffset(75),
    },
    {
      id: 'stk_06',
      stockNo: 'NS-FAB-610',
      description: 'SS-316 Machined Flange Gasket & Stud Assembly DN100',
      uom: 'SET',
      hsnCode: '73072100',
      unitPrice: 2850,
      taxPercent: 18,
      category: 'Fabrication',
      active: true,
      createdAt: isoOffset(70),
    },
    {
      id: 'stk_07',
      stockNo: 'NS-CAL-705',
      description: 'WIKA Bourdon Tube Calibration Pressure Gauge 0-400 Bar',
      uom: 'NOS',
      hsnCode: '90262000',
      unitPrice: 4100,
      taxPercent: 18,
      category: 'Metrology',
      active: true,
      createdAt: isoOffset(60),
    },
    {
      id: 'stk_08',
      stockNo: 'NS-IT-801',
      description: 'Industrial Managed Ethernet Switch 8-Port DIN Rail',
      uom: 'NOS',
      hsnCode: '85176290',
      unitPrice: 11500,
      taxPercent: 18,
      category: 'Automation',
      active: true,
      createdAt: isoOffset(55),
    },
    {
      id: 'stk_09',
      stockNo: 'NS-WLD-904',
      description: 'TIG Welding Inverter Torch & Water Cooler Assembly',
      uom: 'SET',
      hsnCode: '85153990',
      unitPrice: 24000,
      taxPercent: 18,
      category: 'Welding',
      active: true,
      createdAt: isoOffset(45),
    },
    {
      id: 'stk_10',
      stockNo: 'NS-PRC-990',
      description: 'Platinum-Rhodium Type-R Thermocouple Probe 600mm',
      uom: 'NOS',
      hsnCode: '90251990',
      unitPrice: 46500,
      taxPercent: 18,
      category: 'Precious Instrument',
      active: true,
      createdAt: isoOffset(40),
    },
  ];

  const makeItems = (
    raw: Array<{
      stockNo: string;
      description: string;
      uom: string;
      hsnCode: string;
      quantity: number;
      pricePerUnit: number;
      taxPercent: number;
    }>,
    txType: TransactionType
  ): GatePassItem[] =>
    raw.map((r, idx) =>
      calculateItemRow(
        {
          id: makeId('item'),
          sNo: idx + 1,
          stockNo: r.stockNo,
          description: r.description,
          uom: r.uom,
          hsnCode: r.hsnCode,
          quantity: r.quantity,
          pricePerUnit: r.pricePerUnit,
          taxPercent: r.taxPercent,
          igstValue: 0,
          cgstValue: 0,
          sgstValue: 0,
          taxValue: 0,
          total: 0,
        },
        txType
      )
    );

  const gp1Items = makeItems(
    [
      {
        stockNo: 'NS-HYD-104',
        description: 'Rexroth Hydraulic Proportional Control Valve 4WRE',
        uom: 'NOS',
        hsnCode: '84812000',
        quantity: 2,
        pricePerUnit: 18500,
        taxPercent: 18,
      },
      {
        stockNo: 'NS-PNE-502',
        description: 'Festo Double Acting Pneumatic Cylinder DNC-63-250',
        uom: 'NOS',
        hsnCode: '84123100',
        quantity: 3,
        pricePerUnit: 6400,
        taxPercent: 18,
      },
    ],
    'INTRA_STATE'
  );
  const gp1Totals = calculateGatePassTotals(gp1Items);

  const gp2Items = makeItems(
    [
      {
        stockNo: 'NS-CAL-312',
        description: 'Mitutoyo Digital Vernier Caliper 0-300mm IP67',
        uom: 'NOS',
        hsnCode: '90173010',
        quantity: 4,
        pricePerUnit: 9800,
        taxPercent: 18,
      },
      {
        stockNo: 'NS-CAL-705',
        description: 'WIKA Bourdon Tube Calibration Pressure Gauge 0-400 Bar',
        uom: 'NOS',
        hsnCode: '90262000',
        quantity: 2,
        pricePerUnit: 4100,
        taxPercent: 18,
      },
    ],
    'INTER_STATE'
  );
  const gp2Totals = calculateGatePassTotals(gp2Items);

  const gp3Items = makeItems(
    [
      {
        stockNo: 'NS-ELC-418',
        description: 'Siemens SINAMICS Servo Drive Power Module 2.2kW',
        uom: 'NOS',
        hsnCode: '85044090',
        quantity: 1,
        pricePerUnit: 32500,
        taxPercent: 18,
      },
    ],
    'INTRA_STATE'
  );
  const gp3Totals = calculateGatePassTotals(gp3Items);

  const gp4Items = makeItems(
    [
      {
        stockNo: 'NS-PRC-990',
        description: 'Platinum-Rhodium Type-R Thermocouple Probe 600mm',
        uom: 'NOS',
        hsnCode: '90251990',
        quantity: 2,
        pricePerUnit: 46500,
        taxPercent: 18,
      },
    ],
    'INTER_STATE'
  );
  const gp4Totals = calculateGatePassTotals(gp4Items);

  const gp5Items = makeItems(
    [
      {
        stockNo: 'NON-STOCK',
        description: 'Custom CNC Fixture Base Plate (Re-grinding Job Work)',
        uom: 'NOS',
        hsnCode: '84669390',
        quantity: 2,
        pricePerUnit: 12000,
        taxPercent: 18,
      },
      {
        stockNo: 'NS-FAB-610',
        description: 'SS-316 Machined Flange Gasket & Stud Assembly DN100',
        uom: 'SET',
        hsnCode: '73072100',
        quantity: 5,
        pricePerUnit: 2850,
        taxPercent: 18,
      },
    ],
    'INTRA_STATE'
  );
  const gp5Totals = calculateGatePassTotals(gp5Items);

  const gatePasses: GatePass[] = [
    {
      id: 'gp_0001',
      gpNo: 'TJD/NSGP/2026-27/0001',
      fromAddress: 'TJD Industries Pvt. Ltd.\nPlot No. B-42, MIDC Chakan Industrial Area, Phase II, Pune - 410501, Maharashtra, India',
      sentTo: 'Bharat Hydraulics & Fluid Power Pvt. Ltd.\nPlot E-18, Bhosari MIDC, Pune - 411026\nMaharashtra, India',
      gstNo: '27AAACB7721M1Z4',
      stCode: '27',
      wayBillNo: 'EWB-271004882910',
      status: 'ACKNOWLEDGED',
      docRefNo: 'MAINT/WO/2026/084',
      departmentId: 'dept_maint',
      departmentName: 'Maintenance & Utilities',
      preciousMaterial: false,
      returnable: true,
      expectedDate: '2026-11-22',
      appValue: gp1Totals.grandTotal,
      appValueOverridden: false,
      despatchThru: 'BlueDart Surface Cargo - MH14-CX-4410',
      transactionType: 'INTRA_STATE',
      remarks: 'Sent for valve spool refurbishment & seal kit pressure testing.',
      totalQuantity: gp1Totals.totalQuantity,
      totalTaxValue: gp1Totals.totalTaxValue,
      grandTotal: gp1Totals.grandTotal,
      items: gp1Items,
      dispatchDetails: {
        dispatchedById: 'usr_supervisor',
        dispatchedByName: 'Vikram Patel',
        dispatchedAt: isoOffset(8, 14),
        despatchThru: 'BlueDart Surface Cargo - MH14-CX-4410',
        wayBillNo: 'EWB-271004882910',
        vehicleOrCourierRef: 'MH14-CX-4410',
        remarks: 'Gate exit verified at Main Gate #1.',
      },
      acknowledgementDetails: {
        acknowledgedById: 'usr_security',
        acknowledgedByName: 'Suresh Kumar',
        acknowledgedAt: isoOffset(3, 16),
        receivedBy: 'R. K. Deshmukh (Vendor Rep Signed)',
        remarks: 'Material returned & verified in working condition.',
      },
      auditLog: [
        {
          id: makeId('aud'),
          action: 'CREATED',
          performedById: 'usr_operator',
          performedByName: 'Priya Nair',
          timestamp: isoOffset(9, 10),
          summary: 'Gate Pass TJD/NSGP/2026-27/0001 created as PENDING.',
        },
        {
          id: makeId('aud'),
          action: 'DISPATCHED',
          performedById: 'usr_supervisor',
          performedByName: 'Vikram Patel',
          timestamp: isoOffset(8, 14),
          summary: 'Dispatch confirmed via BlueDart Surface Cargo - MH14-CX-4410.',
        },
        {
          id: makeId('aud'),
          action: 'ACKNOWLEDGED',
          performedById: 'usr_security',
          performedByName: 'Suresh Kumar',
          timestamp: isoOffset(3, 16),
          summary: 'Receipt acknowledged. Received by R. K. Deshmukh (Vendor Rep Signed).',
        },
      ],
      createdById: 'usr_operator',
      createdByName: 'Priya Nair',
      createdAt: isoOffset(9, 10),
      modifiedById: 'usr_security',
      modifiedByName: 'Suresh Kumar',
      modifiedAt: isoOffset(3, 16),
    },
    {
      id: 'gp_0002',
      gpNo: 'TJD/NSGP/2026-27/0002',
      fromAddress: 'TJD Industries Pvt. Ltd.\nPlot No. B-42, MIDC Chakan Industrial Area, Phase II, Pune - 410501, Maharashtra, India',
      sentTo: 'NABL Precision Metrology Labs\n42 Peenya Industrial Area Phase II, Bengaluru - 560058\nKarnataka, India',
      gstNo: '29AABCN4920L1Z2',
      stCode: '29',
      wayBillNo: 'EWB-291009912345',
      status: 'DISPATCHED',
      docRefNo: 'QA/CAL/2026/119',
      departmentId: 'dept_qa',
      departmentName: 'Quality Assurance & Calibration',
      preciousMaterial: false,
      returnable: true,
      expectedDate: '2026-11-25',
      appValue: gp2Totals.grandTotal,
      appValueOverridden: false,
      despatchThru: 'DTDC Air Express - AWB 88219402',
      transactionType: 'INTER_STATE',
      remarks: 'Annual NABL ISO-17025 calibration required with certificate.',
      totalQuantity: gp2Totals.totalQuantity,
      totalTaxValue: gp2Totals.totalTaxValue,
      grandTotal: gp2Totals.grandTotal,
      items: gp2Items,
      dispatchDetails: {
        dispatchedById: 'usr_admin',
        dispatchedByName: 'Rajesh Sharma',
        dispatchedAt: isoOffset(5, 11),
        despatchThru: 'DTDC Air Express - AWB 88219402',
        wayBillNo: 'EWB-291009912345',
        vehicleOrCourierRef: 'AWB 88219402',
        remarks: 'Packed in foam-lined Pelican transit case.',
      },
      acknowledgementDetails: null,
      auditLog: [
        {
          id: makeId('aud'),
          action: 'CREATED',
          performedById: 'usr_operator',
          performedByName: 'Priya Nair',
          timestamp: isoOffset(5, 9),
          summary: 'Gate Pass TJD/NSGP/2026-27/0002 created as PENDING.',
        },
        {
          id: makeId('aud'),
          action: 'DISPATCHED',
          performedById: 'usr_admin',
          performedByName: 'Rajesh Sharma',
          timestamp: isoOffset(5, 11),
          summary: 'Dispatch confirmed via DTDC Air Express - AWB 88219402.',
        },
      ],
      createdById: 'usr_operator',
      createdByName: 'Priya Nair',
      createdAt: isoOffset(5, 9),
      modifiedById: 'usr_admin',
      modifiedByName: 'Rajesh Sharma',
      modifiedAt: isoOffset(5, 11),
    },
    {
      id: 'gp_0003',
      gpNo: 'TJD/NSGP/2026-27/0003',
      fromAddress: 'TJD Industries Pvt. Ltd.\nPlot No. B-42, MIDC Chakan Industrial Area, Phase II, Pune - 410501, Maharashtra, India',
      sentTo: 'Siemens Industrial Automation Service Center\nPlot 7B, Talegaon MIDC, Pune - 410507\nMaharashtra, India',
      gstNo: '27AAACS4521Q1Z9',
      stCode: '27',
      wayBillNo: 'EWB-271005531802',
      status: 'DISPATCHED',
      docRefNo: 'PROD/BRK/2026/041',
      departmentId: 'dept_prod',
      departmentName: 'Production & Assembly',
      preciousMaterial: false,
      returnable: true,
      expectedDate: '2026-11-20',
      appValue: gp3Totals.grandTotal,
      appValueOverridden: false,
      despatchThru: 'Company Pickup Van - MH12-PQ-9081',
      transactionType: 'INTRA_STATE',
      remarks: 'Faulty IGBT inverter module sent for warranty diagnostics.',
      totalQuantity: gp3Totals.totalQuantity,
      totalTaxValue: gp3Totals.totalTaxValue,
      grandTotal: gp3Totals.grandTotal,
      items: gp3Items,
      dispatchDetails: {
        dispatchedById: 'usr_supervisor',
        dispatchedByName: 'Vikram Patel',
        dispatchedAt: isoOffset(2, 15),
        despatchThru: 'Company Pickup Van - MH12-PQ-9081',
        wayBillNo: 'EWB-271005531802',
        vehicleOrCourierRef: 'MH12-PQ-9081',
        remarks: 'Driver signed gate register.',
      },
      acknowledgementDetails: null,
      auditLog: [
        {
          id: makeId('aud'),
          action: 'CREATED',
          performedById: 'usr_operator',
          performedByName: 'Priya Nair',
          timestamp: isoOffset(2, 13),
          summary: 'Gate Pass TJD/NSGP/2026-27/0003 created as PENDING.',
        },
        {
          id: makeId('aud'),
          action: 'DISPATCHED',
          performedById: 'usr_supervisor',
          performedByName: 'Vikram Patel',
          timestamp: isoOffset(2, 15),
          summary: 'Dispatch confirmed via Company Pickup Van - MH12-PQ-9081.',
        },
      ],
      createdById: 'usr_operator',
      createdByName: 'Priya Nair',
      createdAt: isoOffset(2, 13),
      modifiedById: 'usr_supervisor',
      modifiedByName: 'Vikram Patel',
      modifiedAt: isoOffset(2, 15),
    },
    {
      id: 'gp_0004',
      gpNo: 'TJD/NSGP/2026-27/0004',
      fromAddress: 'TJD Industries Pvt. Ltd.\nPlot No. B-42, MIDC Chakan Industrial Area, Phase II, Pune - 410501, Maharashtra, India',
      sentTo: 'Heraeus Electro-Nite India Pvt. Ltd.\nGIDC Makarpura, Vadodara - 390010\nGujarat, India',
      gstNo: '24AAACH8812D1Z7',
      stCode: '24',
      wayBillNo: 'EWB-241007721109',
      status: 'PENDING',
      docRefNo: 'ENG/THM/2026/019',
      departmentId: 'dept_eng',
      departmentName: 'Tooling & Engineering',
      preciousMaterial: true,
      returnable: true,
      expectedDate: '2026-11-30',
      appValue: gp4Totals.grandTotal,
      appValueOverridden: false,
      despatchThru: 'Safexpress Insured Armored Courier',
      transactionType: 'INTER_STATE',
      remarks: 'Contains Platinum-Rhodium sensor wire. Requires security escort at dispatch.',
      totalQuantity: gp4Totals.totalQuantity,
      totalTaxValue: gp4Totals.totalTaxValue,
      grandTotal: gp4Totals.grandTotal,
      items: gp4Items,
      dispatchDetails: null,
      acknowledgementDetails: null,
      auditLog: [
        {
          id: makeId('aud'),
          action: 'CREATED',
          performedById: 'usr_operator',
          performedByName: 'Priya Nair',
          timestamp: isoOffset(1, 11),
          summary: 'Gate Pass TJD/NSGP/2026-27/0004 created as PENDING.',
        },
      ],
      createdById: 'usr_operator',
      createdByName: 'Priya Nair',
      createdAt: isoOffset(1, 11),
      modifiedById: 'usr_operator',
      modifiedByName: 'Priya Nair',
      modifiedAt: isoOffset(1, 11),
    },
    {
      id: 'gp_0005',
      gpNo: 'TJD/NSGP/2026-27/0005',
      fromAddress: 'TJD Industries Pvt. Ltd.\nPlot No. B-42, MIDC Chakan Industrial Area, Phase II, Pune - 410501, Maharashtra, India',
      sentTo: 'Apex Tooling & Precision Grinders\nShed 14, Chakan Industrial Area Phase III, Pune - 410501\nMaharashtra, India',
      gstNo: '27AADCA3309H1Z1',
      stCode: '27',
      wayBillNo: '',
      status: 'PENDING',
      docRefNo: 'ENG/JW/2026/207',
      departmentId: 'dept_eng',
      departmentName: 'Tooling & Engineering',
      preciousMaterial: false,
      returnable: true,
      expectedDate: '2026-11-24',
      appValue: gp5Totals.grandTotal,
      appValueOverridden: false,
      despatchThru: 'Vendor Tempo - MH14-GT-1182',
      transactionType: 'INTRA_STATE',
      remarks: 'Surface grinding tolerance +/- 0.005mm per drawing #TJD-FX-902.',
      totalQuantity: gp5Totals.totalQuantity,
      totalTaxValue: gp5Totals.totalTaxValue,
      grandTotal: gp5Totals.grandTotal,
      items: gp5Items,
      dispatchDetails: null,
      acknowledgementDetails: null,
      auditLog: [
        {
          id: makeId('aud'),
          action: 'CREATED',
          performedById: 'usr_admin',
          performedByName: 'Rajesh Sharma',
          timestamp: isoOffset(0, 9),
          summary: 'Gate Pass TJD/NSGP/2026-27/0005 created as PENDING.',
        },
      ],
      createdById: 'usr_admin',
      createdByName: 'Rajesh Sharma',
      createdAt: isoOffset(0, 9),
      modifiedById: 'usr_admin',
      modifiedByName: 'Rajesh Sharma',
      modifiedAt: isoOffset(0, 9),
    },
  ];

  const settings: CompanySettings = {
    companyName: 'TJD Industries Pvt. Ltd.',
    companyAddress: 'Plot No. B-42, MIDC Chakan Industrial Area, Phase II, Pune - 410501, Maharashtra, India',
    companyGstin: '27AABCT4829K1Z8',
    homeStateCode: '27',
    phone: '+91 20 6712 4800',
    email: 'stores@tjdindustries.in',
    gpPrefix: 'TJD/NSGP/2026-27/',
    defaultTaxPercent: 18,
    allowAuthorizedOverride: true,
  };

  return {
    users,
    departments,
    stockItems,
    gatePasses,
    settings,
    sequenceCounter: 5,
  };
}

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seeded = buildSeedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
  const defaults = buildSeedData();
  const loadedDepartments = Array.isArray(parsed.departments)
    ? parsed.departments
    : defaults.departments;
  const hasHdtn = loadedDepartments.some(
    (d) => d.code.toUpperCase() === 'HDTN' || d.name.toUpperCase() === 'HDTN'
  );
  const departments = hasHdtn ? loadedDepartments : [defaults.departments[0], ...loadedDepartments];

  const db: DatabaseSchema = {
    users: Array.isArray(parsed.users) ? parsed.users : defaults.users,
    departments,
    stockItems: Array.isArray(parsed.stockItems) ? parsed.stockItems : defaults.stockItems,
    gatePasses: Array.isArray(parsed.gatePasses)
      ? parsed.gatePasses.map((gp) => ({
          ...gp,
          fromAddress: gp.fromAddress ?? '',
          sentTo: gp.sentTo ?? '',
          gstNo: gp.gstNo ?? '',
          stCode: gp.stCode ?? '',
          wayBillNo: gp.wayBillNo ?? '',
          docRefNo: gp.docRefNo ?? '',
          departmentName: gp.departmentName ?? '',
          despatchThru: gp.despatchThru ?? '',
          remarks: gp.remarks ?? '',
          items: Array.isArray(gp.items) ? gp.items : [],
          auditLog: Array.isArray(gp.auditLog) ? gp.auditLog : [],
        }))
      : defaults.gatePasses,
    settings: parsed.settings ? { ...defaults.settings, ...parsed.settings } : defaults.settings,
    sequenceCounter:
      typeof parsed.sequenceCounter === 'number'
        ? parsed.sequenceCounter
        : defaults.sequenceCounter,
  };
  if (!hasHdtn) {
    saveDb(db);
  }
  return db;
}

function saveDb(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

function sanitizeUser(u: StoredUser, departments: Department[]): User {
  const dept = departments.find((d) => d.id === u.departmentId);
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    departmentId: u.departmentId,
    departmentName: dept?.name || u.departmentName || '-',
    active: u.active,
    createdAt: u.createdAt,
  };
}

export function authenticateUser(usernameOrEmail: string, password: string): User | null {
  const db = ensureDb();
  const q = usernameOrEmail.trim().toLowerCase();
  const found = db.users.find(
    (u) =>
      u.active &&
      (u.username.toLowerCase() === q || u.email.toLowerCase() === q) &&
      u.password === password
  );
  if (!found) return null;
  return sanitizeUser(found, db.departments);
}

export function getUserById(userId: string): User | null {
  const db = ensureDb();
  const found = db.users.find((u) => u.id === userId);
  if (!found) return null;
  return sanitizeUser(found, db.departments);
}

export function getNextGpNumber(): string {
  const db = ensureDb();
  const prefix = db.settings.gpPrefix || 'TJD/NSGP/2026-27/';
  let candidateNum = db.sequenceCounter + 1;
  const existing = new Set(db.gatePasses.map((g) => g.gpNo.toUpperCase()));
  let candidate = `${prefix}${String(candidateNum).padStart(4, '0')}`;
  while (existing.has(candidate.toUpperCase())) {
    candidateNum += 1;
    candidate = `${prefix}${String(candidateNum).padStart(4, '0')}`;
  }
  return candidate;
}

export function getDashboardSummary(): DashboardSummary {
  const db = ensureDb();
  const gatePasses = [...db.gatePasses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const deptMap = new Map<string, { count: number; totalValue: number }>();
  let totalValue = 0;
  let pendingCount = 0;
  let dispatchedCount = 0;
  let acknowledgedCount = 0;
  let returnablePendingCount = 0;
  let preciousCount = 0;

  for (const gp of gatePasses) {
    totalValue = round2(totalValue + (gp.grandTotal || 0));
    if (gp.status === 'PENDING') pendingCount += 1;
    if (gp.status === 'DISPATCHED') dispatchedCount += 1;
    if (gp.status === 'ACKNOWLEDGED') acknowledgedCount += 1;
    if (gp.returnable && gp.status !== 'ACKNOWLEDGED') returnablePendingCount += 1;
    if (gp.preciousMaterial) preciousCount += 1;

    const deptName = gp.departmentName || 'Unassigned';
    const current = deptMap.get(deptName) || { count: 0, totalValue: 0 };
    current.count += 1;
    current.totalValue = round2(current.totalValue + (gp.grandTotal || 0));
    deptMap.set(deptName, current);
  }

  const departmentStats = Array.from(deptMap.entries())
    .map(([departmentName, stats]) => ({
      departmentName,
      count: stats.count,
      totalValue: stats.totalValue,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalGatePasses: gatePasses.length,
    pendingCount,
    dispatchedCount,
    acknowledgedCount,
    totalValue,
    returnablePendingCount,
    preciousCount,
    recentGatePasses: gatePasses.slice(0, 6),
    departmentStats,
  };
}

export function listGatePasses(): GatePass[] {
  const db = ensureDb();
  return [...db.gatePasses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getGatePassById(id: string): GatePass | null {
  const db = ensureDb();
  return db.gatePasses.find((g) => g.id === id) || null;
}

export interface SaveGatePassInput {
  id?: string;
  gpNo?: string;
  fromAddress?: string;
  sentTo: string;
  gstNo: string;
  stCode: string;
  wayBillNo: string;
  docRefNo: string;
  departmentId: string;
  departmentName?: string;
  preciousMaterial: boolean;
  returnable: boolean;
  expectedDate: string;
  appValue: number;
  appValueOverridden: boolean;
  despatchThru: string;
  transactionType: TransactionType;
  remarks: string;
  items: GatePassItem[];
}

export function saveGatePass(
  input: SaveGatePassInput,
  actorId: string
): { gatePass?: GatePass; previousGpNo?: string; error?: string; statusCode?: number } {
  const db = ensureDb();
  const actor = db.users.find((u) => u.id === actorId && u.active);
  if (!actor) {
    return { error: 'Authenticated user not found or inactive.', statusCode: 401 };
  }

  if (!input.sentTo || !input.sentTo.trim()) {
    return { error: 'Sent To (Company Name & Address) is mandatory.', statusCode: 400 };
  }

  const rawDeptName = (input.departmentName || '').trim();
  const rawDeptId = (input.departmentId || '').trim();
  if (!rawDeptId && !rawDeptName) {
    return { error: 'Department is mandatory.', statusCode: 400 };
  }

  const deptQuery = (rawDeptName || rawDeptId).toLowerCase();
  const dept = db.departments.find(
    (d) =>
      d.id === rawDeptId ||
      d.code.toLowerCase() === deptQuery ||
      d.name.toLowerCase() === deptQuery
  );
  const resolvedDeptId = dept ? dept.id : rawDeptId || 'dept_custom';
  const resolvedDeptName = dept ? dept.name : rawDeptName || rawDeptId;

  const validItems = (input.items || []).filter(
    (item) => item.description.trim() !== '' && Number(item.quantity) > 0
  );
  if (validItems.length === 0) {
    return {
      error: 'At least one item row with Description and Quantity > 0 is required.',
      statusCode: 400,
    };
  }

  const recalculatedItems = validItems.map((item, idx) =>
    calculateItemRow(
      {
        ...item,
        id: item.id || makeId('item'),
        sNo: idx + 1,
        stockNo: item.stockNo?.trim() || 'NON-STOCK',
        description: item.description.trim(),
        uom: item.uom?.trim() || 'NOS',
        hsnCode: item.hsnCode?.trim() || '',
      },
      input.transactionType
    )
  );

  const totals = calculateGatePassTotals(recalculatedItems);
  const parsedAppValue = Number(input.appValue);
  const canOverride =
    Boolean(input.appValueOverridden) ||
    (Number.isFinite(parsedAppValue) &&
      Math.abs(round2(parsedAppValue) - totals.grandTotal) > 0.001);

  const finalAppValue = canOverride
    ? round2(Math.max(0, Number.isFinite(parsedAppValue) ? parsedAppValue : 0))
    : totals.grandTotal;
  const nowIso = new Date().toISOString();

  if (input.id) {
    const idx = db.gatePasses.findIndex((g) => g.id === input.id);
    if (idx === -1) {
      return { error: 'Gate Pass record not found.', statusCode: 404 };
    }
    const existing = db.gatePasses[idx];
    if (existing.status !== 'PENDING') {
      return {
        error: `Gate Pass ${existing.gpNo} is already ${existing.status} and cannot be modified.`,
        statusCode: 403,
      };
    }

    const requestedGpNo = (input.gpNo || '').trim() || existing.gpNo;
    if (requestedGpNo.toUpperCase() !== existing.gpNo.toUpperCase()) {
      const collision = db.gatePasses.some(
        (g) => g.id !== existing.id && g.gpNo.toUpperCase() === requestedGpNo.toUpperCase()
      );
      if (collision) {
        return {
          error: `Gate Pass No "${requestedGpNo}" already exists. Please use a unique G.P. No.`,
          statusCode: 409,
        };
      }
    }

    const updated: GatePass = {
      ...existing,
      gpNo: requestedGpNo,
      fromAddress: (input.fromAddress ?? existing.fromAddress ?? '').trim(),
      sentTo: input.sentTo.trim(),
      gstNo: (input.gstNo || '').trim().toUpperCase(),
      stCode: (input.stCode || '').trim(),
      wayBillNo: (input.wayBillNo || '').trim(),
      docRefNo: (input.docRefNo || '').trim(),
      departmentId: resolvedDeptId,
      departmentName: resolvedDeptName,
      preciousMaterial: Boolean(input.preciousMaterial),
      returnable: Boolean(input.returnable),
      expectedDate: input.expectedDate || '',
      appValue: finalAppValue,
      appValueOverridden: canOverride,
      despatchThru: (input.despatchThru || '').trim(),
      transactionType: input.transactionType,
      remarks: (input.remarks || '').trim(),
      totalQuantity: totals.totalQuantity,
      totalTaxValue: totals.totalTaxValue,
      grandTotal: totals.grandTotal,
      items: recalculatedItems,
      modifiedById: actor.id,
      modifiedByName: actor.fullName,
      modifiedAt: nowIso,
      auditLog: [
        ...existing.auditLog,
        {
          id: makeId('aud'),
          action: 'UPDATED',
          performedById: actor.id,
          performedByName: actor.fullName,
          timestamp: nowIso,
          summary: `Gate Pass ${requestedGpNo} updated (Grand Total Rs. ${totals.grandTotal.toFixed(2)}).`,
        },
      ],
    };

    db.gatePasses[idx] = updated;
    saveDb(db);
    return { gatePass: updated, previousGpNo: existing.gpNo };
  }

  // Creating new Gate Pass with guaranteed unique G.P. No
  const prefix = db.settings.gpPrefix || 'TJD/NSGP/2026-27/';
  let requestedGpNo = (input.gpNo || '').trim();
  const existingSet = new Set(db.gatePasses.map((g) => g.gpNo.toUpperCase()));

  if (requestedGpNo && existingSet.has(requestedGpNo.toUpperCase())) {
    return {
      error: `Gate Pass No "${requestedGpNo}" already exists. Please enter a unique G.P. No.`,
      statusCode: 409,
    };
  }

  if (!requestedGpNo) {
    db.sequenceCounter += 1;
    requestedGpNo = `${prefix}${String(db.sequenceCounter).padStart(4, '0')}`;
    while (existingSet.has(requestedGpNo.toUpperCase())) {
      db.sequenceCounter += 1;
      requestedGpNo = `${prefix}${String(db.sequenceCounter).padStart(4, '0')}`;
    }
  } else {
    // Sync sequence counter if numeric suffix exceeds current counter
    const match = requestedGpNo.match(/(\d+)$/);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (parsed > db.sequenceCounter) {
        db.sequenceCounter = parsed;
      }
    }
  }

  const defaultFrom = `${db.settings.companyName}\n${db.settings.companyAddress}`;
  const created: GatePass = {
    id: makeId('gp'),
    gpNo: requestedGpNo,
    fromAddress: (input.fromAddress ?? defaultFrom).trim(),
    sentTo: input.sentTo.trim(),
    gstNo: (input.gstNo || '').trim().toUpperCase(),
    stCode: (input.stCode || '').trim(),
    wayBillNo: (input.wayBillNo || '').trim(),
    status: 'PENDING',
    docRefNo: (input.docRefNo || '').trim(),
    departmentId: resolvedDeptId,
    departmentName: resolvedDeptName,
    preciousMaterial: Boolean(input.preciousMaterial),
    returnable: Boolean(input.returnable),
    expectedDate: input.expectedDate || '',
    appValue: finalAppValue,
    appValueOverridden: canOverride,
    despatchThru: (input.despatchThru || '').trim(),
    transactionType: input.transactionType,
    remarks: (input.remarks || '').trim(),
    totalQuantity: totals.totalQuantity,
    totalTaxValue: totals.totalTaxValue,
    grandTotal: totals.grandTotal,
    items: recalculatedItems,
    dispatchDetails: null,
    acknowledgementDetails: null,
    auditLog: [
      {
        id: makeId('aud'),
        action: 'CREATED',
        performedById: actor.id,
        performedByName: actor.fullName,
        timestamp: nowIso,
        summary: `Gate Pass ${requestedGpNo} saved as PENDING.`,
      },
    ],
    createdById: actor.id,
    createdByName: actor.fullName,
    createdAt: nowIso,
    modifiedById: actor.id,
    modifiedByName: actor.fullName,
    modifiedAt: nowIso,
  };

  db.gatePasses.unshift(created);
  saveDb(db);
  return { gatePass: created };
}

export function dispatchGatePass(
  id: string,
  payload: { vehicleOrCourierRef?: string; dispatchRemarks?: string },
  actorId: string
): { gatePass?: GatePass; error?: string; statusCode?: number } {
  const db = ensureDb();
  const actor = db.users.find((u) => u.id === actorId && u.active);
  if (!actor) {
    return { error: 'Authenticated user not found or inactive.', statusCode: 401 };
  }

  const idx = db.gatePasses.findIndex((g) => g.id === id);
  if (idx === -1) {
    return { error: 'Gate Pass record not found.', statusCode: 404 };
  }

  const existing = db.gatePasses[idx];
  if (existing.status !== 'PENDING') {
    return {
      error: `Gate Pass ${existing.gpNo} cannot be dispatched because its status is ${existing.status}.`,
      statusCode: 400,
    };
  }

  if (!existing.sentTo.trim() || !existing.departmentId || existing.items.length === 0) {
    return {
      error: 'Cannot confirm dispatch: Sent To, Department, and Item Details are required.',
      statusCode: 400,
    };
  }
  if (!existing.despatchThru.trim()) {
    return {
      error: 'Despatch Thru (Transport / Courier details) is required before confirming dispatch.',
      statusCode: 400,
    };
  }

  const nowIso = new Date().toISOString();
  const updated: GatePass = {
    ...existing,
    status: 'DISPATCHED',
    dispatchDetails: {
      dispatchedById: actor.id,
      dispatchedByName: actor.fullName,
      dispatchedAt: nowIso,
      despatchThru: existing.despatchThru,
      wayBillNo: existing.wayBillNo,
      vehicleOrCourierRef: (payload.vehicleOrCourierRef || '').trim(),
      remarks: (payload.dispatchRemarks || '').trim(),
    },
    modifiedById: actor.id,
    modifiedByName: actor.fullName,
    modifiedAt: nowIso,
    auditLog: [
      ...existing.auditLog,
      {
        id: makeId('aud'),
        action: 'DISPATCHED',
        performedById: actor.id,
        performedByName: actor.fullName,
        timestamp: nowIso,
        summary: `Dispatch confirmed via ${existing.despatchThru}.`,
      },
    ],
  };

  db.gatePasses[idx] = updated;
  saveDb(db);
  return { gatePass: updated };
}

export function acknowledgeGatePass(
  id: string,
  payload: { receivedBy: string; remarks?: string },
  actorId: string
): { gatePass?: GatePass; error?: string; statusCode?: number } {
  const db = ensureDb();
  const actor = db.users.find((u) => u.id === actorId && u.active);
  if (!actor) {
    return { error: 'Authenticated user not found or inactive.', statusCode: 401 };
  }

  if (actor.role !== 'ADMIN' && actor.role !== 'SUPERVISOR' && actor.role !== 'SECURITY') {
    return {
      error: 'Only Admin, Supervisor, or Security Gate roles are authorized to confirm acknowledgement.',
      statusCode: 403,
    };
  }

  const idx = db.gatePasses.findIndex((g) => g.id === id);
  if (idx === -1) {
    return { error: 'Gate Pass record not found.', statusCode: 404 };
  }

  const existing = db.gatePasses[idx];
  if (existing.status !== 'DISPATCHED') {
    return {
      error: 'Acknowledgement is allowed only after the Gate Pass has been DISPATCHED.',
      statusCode: 400,
    };
  }

  const receivedBy = (payload.receivedBy || '').trim();
  if (!receivedBy) {
    return { error: 'Received By name is mandatory for acknowledgement.', statusCode: 400 };
  }

  const nowIso = new Date().toISOString();
  const updated: GatePass = {
    ...existing,
    status: 'ACKNOWLEDGED',
    acknowledgementDetails: {
      acknowledgedById: actor.id,
      acknowledgedByName: actor.fullName,
      acknowledgedAt: nowIso,
      receivedBy,
      remarks: (payload.remarks || '').trim(),
    },
    modifiedById: actor.id,
    modifiedByName: actor.fullName,
    modifiedAt: nowIso,
    auditLog: [
      ...existing.auditLog,
      {
        id: makeId('aud'),
        action: 'ACKNOWLEDGED',
        performedById: actor.id,
        performedByName: actor.fullName,
        timestamp: nowIso,
        summary: `Receipt acknowledged. Received by ${receivedBy}.`,
      },
    ],
  };

  db.gatePasses[idx] = updated;
  saveDb(db);
  return { gatePass: updated };
}

// Departments CRUD
export function listDepartments(): Department[] {
  return ensureDb().departments;
}

export function upsertDepartment(
  input: Partial<Department> & { code: string; name: string },
  actorId: string
): { department?: Department; error?: string } {
  const db = ensureDb();
  const actor = db.users.find((u) => u.id === actorId && u.active);
  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'SUPERVISOR')) {
    return { error: 'Only Admin or Supervisor can modify departments.' };
  }

  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  if (!code || !name) {
    return { error: 'Department Code and Name are required.' };
  }

  const duplicate = db.departments.find(
    (d) => d.code.toUpperCase() === code && d.id !== input.id
  );
  if (duplicate) {
    return { error: `Department code ${code} already exists.` };
  }

  if (input.id) {
    const idx = db.departments.findIndex((d) => d.id === input.id);
    if (idx === -1) return { error: 'Department not found.' };
    const updated: Department = {
      ...db.departments[idx],
      code,
      name,
      costCenter: (input.costCenter || '').trim(),
      hodName: (input.hodName || '').trim(),
      active: input.active !== undefined ? Boolean(input.active) : db.departments[idx].active,
    };
    db.departments[idx] = updated;
    saveDb(db);
    return { department: updated };
  }

  const created: Department = {
    id: makeId('dept'),
    code,
    name,
    costCenter: (input.costCenter || '').trim(),
    hodName: (input.hodName || '').trim(),
    active: input.active !== undefined ? Boolean(input.active) : true,
    createdAt: new Date().toISOString(),
  };
  db.departments.push(created);
  saveDb(db);
  return { department: created };
}

// Stock Items CRUD
export function listStockItems(): StockItem[] {
  return ensureDb().stockItems;
}

export function upsertStockItem(
  input: Partial<StockItem> & { stockNo: string; description: string },
  actorId: string
): { stockItem?: StockItem; error?: string } {
  const db = ensureDb();
  const actor = db.users.find((u) => u.id === actorId && u.active);
  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'SUPERVISOR' && actor.role !== 'OPERATOR')) {
    return { error: 'Insufficient permissions to manage Stock Master.' };
  }

  const stockNo = input.stockNo.trim().toUpperCase();
  const description = input.description.trim();
  if (!stockNo || !description) {
    return { error: 'Stock No and Description are required.' };
  }

  const duplicate = db.stockItems.find(
    (s) => s.stockNo.toUpperCase() === stockNo && s.id !== input.id
  );
  if (duplicate) {
    return { error: `Stock No ${stockNo} already exists.` };
  }

  if (input.id) {
    const idx = db.stockItems.findIndex((s) => s.id === input.id);
    if (idx === -1) return { error: 'Stock item not found.' };
    const updated: StockItem = {
      ...db.stockItems[idx],
      stockNo,
      description,
      uom: (input.uom || 'NOS').trim().toUpperCase(),
      hsnCode: (input.hsnCode || '').trim(),
      unitPrice: round2(Math.max(0, Number(input.unitPrice) || 0)),
      taxPercent: Math.max(0, Number(input.taxPercent) || 0),
      category: (input.category || 'General').trim(),
      active: input.active !== undefined ? Boolean(input.active) : db.stockItems[idx].active,
    };
    db.stockItems[idx] = updated;
    saveDb(db);
    return { stockItem: updated };
  }

  const created: StockItem = {
    id: makeId('stk'),
    stockNo,
    description,
    uom: (input.uom || 'NOS').trim().toUpperCase(),
    hsnCode: (input.hsnCode || '').trim(),
    unitPrice: round2(Math.max(0, Number(input.unitPrice) || 0)),
    taxPercent: Math.max(0, Number(input.taxPercent) || 0),
    category: (input.category || 'General').trim(),
    active: input.active !== undefined ? Boolean(input.active) : true,
    createdAt: new Date().toISOString(),
  };
  db.stockItems.push(created);
  saveDb(db);
  return { stockItem: created };
}

// Users CRUD
export function listUsers(actorId: string): { users?: User[]; error?: string } {
  const db = ensureDb();
  const actor = db.users.find((u) => u.id === actorId && u.active);
  if (!actor || actor.role !== 'ADMIN') {
    return { error: 'Only Admin users can view and manage user accounts.' };
  }
  return { users: db.users.map((u) => sanitizeUser(u, db.departments)) };
}

export function upsertUser(
  input: Partial<StoredUser> & { username: string; fullName: string; email: string; role: StoredUser['role'] },
  actorId: string
): { user?: User; error?: string } {
  const db = ensureDb();
  const actor = db.users.find((u) => u.id === actorId && u.active);
  if (!actor || actor.role !== 'ADMIN') {
    return { error: 'Only Admin users can create or edit user accounts.' };
  }

  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!username || !email || !fullName) {
    return { error: 'Username, Email, and Full Name are required.' };
  }

  const duplicate = db.users.find(
    (u) =>
      (u.username.toLowerCase() === username || u.email.toLowerCase() === email) &&
      u.id !== input.id
  );
  if (duplicate) {
    return { error: 'A user with that username or email already exists.' };
  }

  const deptLookup = (input.departmentName || input.departmentId || '').trim().toLowerCase();
  const dept = db.departments.find(
    (d) =>
      d.id === input.departmentId ||
      d.code.toLowerCase() === deptLookup ||
      d.name.toLowerCase() === deptLookup
  );

  if (input.id) {
    const idx = db.users.findIndex((u) => u.id === input.id);
    if (idx === -1) return { error: 'User not found.' };
    const prev = db.users[idx];
    const updated: StoredUser = {
      ...prev,
      username,
      email,
      fullName,
      role: input.role,
      departmentId: dept?.id || input.departmentId || prev.departmentId,
      departmentName: dept?.name || input.departmentName || prev.departmentName,
      password: input.password && input.password.trim() ? input.password.trim() : prev.password,
      active: input.active !== undefined ? Boolean(input.active) : prev.active,
    };
    db.users[idx] = updated;
    saveDb(db);
    return { user: sanitizeUser(updated, db.departments) };
  }

  const created: StoredUser = {
    id: makeId('usr'),
    username,
    email,
    fullName,
    role: input.role,
    departmentId: dept?.id || input.departmentId || db.departments[0]?.id || '',
    departmentName: dept?.name || input.departmentName || db.departments[0]?.name || '',
    password: input.password?.trim() || 'password123',
    active: input.active !== undefined ? Boolean(input.active) : true,
    createdAt: new Date().toISOString(),
  };
  db.users.push(created);
  saveDb(db);
  return { user: sanitizeUser(created, db.departments) };
}

// Settings
export function getSettings(): CompanySettings {
  return ensureDb().settings;
}

export function updateSettings(
  input: CompanySettings,
  actorId: string
): { settings?: CompanySettings; error?: string } {
  const db = ensureDb();
  const actor = db.users.find((u) => u.id === actorId && u.active);
  if (!actor || actor.role !== 'ADMIN') {
    return { error: 'Only Admin users can update portal settings.' };
  }

  db.settings = {
    companyName: (input.companyName || '').trim() || db.settings.companyName,
    companyAddress: (input.companyAddress || '').trim() || db.settings.companyAddress,
    companyGstin: (input.companyGstin || '').trim().toUpperCase(),
    homeStateCode: (input.homeStateCode || '27').trim(),
    phone: (input.phone || '').trim(),
    email: (input.email || '').trim(),
    gpPrefix: (input.gpPrefix || 'TJD/NSGP/2026-27/').trim(),
    defaultTaxPercent: Number(input.defaultTaxPercent) || 18,
    allowAuthorizedOverride: Boolean(input.allowAuthorizedOverride),
  };
  saveDb(db);
  return { settings: db.settings };
}
