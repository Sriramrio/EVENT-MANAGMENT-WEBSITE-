export interface TechnicalJson {
  processes?: string[];
  materials?: string[];
  machines?: { type: string; make?: string; count: string; capacity?: string }[];
  attributes?: { attribute: string; value: string }[];
  certifications?: string[];
  inspectionMethods?: string[];
  environmentalStandards?: string[];
}

export interface CommercialJson {
  routes?: {
    id: number;
    title: string;
    badgeText: string;
    operations: { name: string; type: string }[];
  }[];
  primaryRouteId?: number;
  operations?: {
    uom: string;
    monthlyCapacity: string;
    annualCapacity: string;
    moq: string;
    batchSize: string;
    setupTime: string;
    turnaroundTime: string;
    sequence: { code: string; name: string; type: string; applicability: string; notes: string }[];
  };
  serviceGeography?: {
    states: string[];
    countries: string[];
  };
  deliverySupport?: {
    installation: string;
    onsiteService: string;
    training: string;
  };
  exportCapability?: {
    typeOfSales: string[];
    exportExperience: string;
    exportDocumentation: string[];
    customsSupport: string;
  };
  commercialTerms?: {
    incoterm: string;
    moq: string;
    moqUom: string;
    paymentPreferences: string[];
    priceValidity: string;
  };
  slas?: {
    salesResponse: string;
    quoteTurnaround: string;
    supportResponse: string;
    communication: string[];
  };
  warranty?: {
    warrantyOffered: string;
    serviceCoverage: string;
    spareParts: string;
    amc: string;
  };
  documents?: {
    companyBrochure?: string;
    machineList?: string;
    capabilityStatement?: string;
    sampleCertificates?: string;
    companyBrochureDoc?: SellerDocumentAttachment;
    machineListDoc?: SellerDocumentAttachment;
    capabilityStatementDoc?: SellerDocumentAttachment;
    sampleCertificatesDoc?: SellerDocumentAttachment;
    files?: Array<SellerDocumentAttachment & { category: string }>;
  };
}

export interface SellerDocumentAttachment {
  name: string;
  size: string;
  type?: string;
  dataBase64?: string;
}

export const parseTechnicalJson = (jsonStr?: string): TechnicalJson => {
  try {
    return JSON.parse(jsonStr || '{}') as TechnicalJson;
  } catch {
    return {};
  }
};

export const parseCommercialJson = (jsonStr?: string): CommercialJson => {
  try {
    return JSON.parse(jsonStr || '{}') as CommercialJson;
  } catch {
    return {};
  }
};
