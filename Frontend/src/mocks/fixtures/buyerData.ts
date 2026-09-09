import type { ActionItem, Audit, BuyerContact, BuyerOrganisation, BuyerSession, Evaluation, Meeting, Negotiation, Notification, Onboarding, PurchaseOrder, Qualification, ReportItem, Requirement, Rfq, Sample, Supplier, SupplierMatch } from '../../domain/models/buyer';
export const session: BuyerSession = { userId:'usr-buyer-001', buyerOrganisationId:'buy-org-001', displayName:'Rahul Deshmukh', role:'BuyerAdmin', organisationName:'Apex Mobility Systems Ltd.', eventId:'evt-msme-2026', eventName:'MSME Sangamam Buyer & Seller Meet 2026', unreadNotifications:3, permissions:['buyer.dashboard.view','buyer.organisation.update','buyer.requirement.create','buyer.requirement.submit','buyer.matches.view','buyer.supplier.view','buyer.shortlist.manage','buyer.meeting.view','buyer.meeting.request','buyer.meeting.checkin','buyer.meeting.notes','buyer.meeting.outcome','buyer.rfq.view','buyer.rfq.create','buyer.action.manage','buyer.qualification.view','buyer.evaluation.create','buyer.vendor_onboarding.view','buyer.audit.view','buyer.negotiation.view','buyer.purchase_order.view','buyer.report.view','buyer.settings.manage'] };
export const organisation: BuyerOrganisation = { id:'buy-org-001', legalName:'Apex Mobility Systems Ltd.', gstin:'33ABCDE1234F1Z5', pan:'ABCDE1234F', organisationType:'Private Limited Company', industry:'Automotive', website:'https://example.com', establishmentYear:2012, employeeBand:'501 - 1000', turnoverBand:'₹100 - 500 Crore', registeredAddress:'42 Industrial Estate, SIPCOT Phase II', city:'Hosur', state:'Tamil Nadu', postalCode:'635109', country:'India', version:3 };
export const contact: BuyerContact = { id:'buy-contact-001', fullName:'Rahul Deshmukh', designation:'Head - Procurement', department:'Procurement', email:'rahul.d@example.com', mobile:'+91 98765 43210', communication:['Email','SMS','WhatsApp'], decisionRole:'Final Decision Maker' };
export const requirements: Requirement[] = [
{id:'req-001',code:'REQ-0001',title:'CNC Machined Shaft - Qty 120,000/month',sourcingType:'Product',category:'Machined Components',subcategory:'Precision Shafts',quantity:120000,unit:'Nos / month',neededBy:'2026-09-30',preferredLocation:'South India',description:'Precision CNC machined transmission shaft with controlled grinding and traceability requirements.',status:'Active',matchCount:28,averageMatch:92,updatedAt:'2026-08-12',confidentiality:'NDA before drawings',budget:{amount:12000000,currency:'INR'},version:7},
{id:'req-002',code:'REQ-0002',title:'Sheet Metal Enclosure',sourcingType:'Product',category:'Sheet Metal',subcategory:'Fabrication',quantity:5000,unit:'Nos / month',neededBy:'2026-10-15',preferredLocation:'Tamil Nadu / Karnataka',description:'Powder-coated precision enclosure with laser cutting, bending, welding and inspection requirements.',status:'Active',matchCount:14,averageMatch:86,updatedAt:'2026-08-11',confidentiality:'Standard',budget:{amount:4200000,currency:'INR'},version:4},
{id:'req-003',code:'REQ-0003',title:'Plastic Injection Components',sourcingType:'Product',category:'Plastics',subcategory:'Injection Moulding',quantity:80000,unit:'Nos / month',neededBy:'2026-11-01',preferredLocation:'South India',description:'Engineering-plastic injection moulded components with moulding validation and dimensional capability evidence.',status:'Draft',matchCount:0,averageMatch:0,updatedAt:'2026-08-10',confidentiality:'NDA before drawings',version:2},
{id:'req-004',code:'REQ-0004',title:'Industrial Automation Panel',sourcingType:'Works',category:'Industrial Automation',subcategory:'Control Panels',quantity:12,unit:'Panels',neededBy:'2026-12-10',preferredLocation:'India',description:'PLC and VFD based control panels including engineering, assembly, FAT and commissioning support.',status:'Matching',matchCount:9,averageMatch:81,updatedAt:'2026-08-09',confidentiality:'Standard',version:5}
];
const dims=[
{dimensionCode:'TECH',label:'Technical Fit',score:29,maxScore:30,weight:30,explanation:'CNC turning, cylindrical grinding and controlled shaft manufacturing are evidenced.',evidenceRefs:['CAP-CNC-01','CAP-GRIND-02']},
{dimensionCode:'QUALITY',label:'Quality Systems',score:18,maxScore:20,weight:20,explanation:'ISO/IATF aligned quality systems and PPAP capability are verified.',evidenceRefs:['CERT-IATF','PPAP-L3']},
{dimensionCode:'CAPACITY',label:'Capacity',score:17,maxScore:20,weight:20,explanation:'Declared capacity supports monthly sourcing volume with reserve capacity.',evidenceRefs:['CAPACITY-2026']},
{dimensionCode:'DELIVERY',label:'Delivery',score:14,maxScore:15,weight:15,explanation:'Location and historical delivery evidence support the requested schedule.',evidenceRefs:['OTD-Q2']},
{dimensionCode:'COMMERCIAL',label:'Commercial Fit',score:14,maxScore:15,weight:15,explanation:'Indicative commercial band is within the configured sourcing threshold.',evidenceRefs:['QUOTE-BAND']}
];
export const suppliers: Supplier[]=[
{id:'sup-001',name:'Precision Mach Tech Pvt. Ltd.',location:'Hosur, TN',industry:'Precision Engineering',employees:'400+',certifications:['IATF 16949','ISO 9001','ISO 14001'],capabilities:['CNC Turning','Cylindrical Grinding','Heat Treatment Coordination','PPAP'],qualityScore:96,deliveryScore:94,technicalScore:97,responseScore:92,visibility:'full'},
{id:'sup-002',name:'XYZ Engineering Works',location:'Peenya, KA',industry:'Machining',employees:'180+',certifications:['ISO 9001'],capabilities:['CNC Turning','VMC','Grinding'],qualityScore:90,deliveryScore:91,technicalScore:92,responseScore:89,visibility:'full'},
{id:'sup-003',name:'Shree Components',location:'Pune, MH',industry:'Auto Components',employees:'250+',certifications:['IATF 16949','ISO 9001'],capabilities:['CNC','Broaching','Grinding'],qualityScore:89,deliveryScore:88,technicalScore:91,responseScore:84,visibility:'full'},
{id:'sup-004',name:'Omega Precision',location:'Coimbatore, TN',industry:'Precision Components',employees:'220+',certifications:['ISO 9001'],capabilities:['CNC','Grinding','Inspection'],qualityScore:88,deliveryScore:90,technicalScore:89,responseScore:86,visibility:'full'},
{id:'sup-005',name:'Meca Fab Pvt. Ltd.',location:'Chennai, TN',industry:'Fabrication',employees:'300+',certifications:['ISO 9001','ISO 14001'],capabilities:['Laser Cutting','Bending','Welding','Powder Coating'],qualityScore:87,deliveryScore:86,technicalScore:90,responseScore:87,visibility:'full'}
];
export const matches: SupplierMatch[] = suppliers.slice(0,4).map((s,i)=>({id:`match-${i+1}`,requirementId:'req-001',supplierId:s.id,supplierName:s.name,overallScore:[92,88,85,82][i]??80,eligibility:'Eligible',location:s.location,capability:s.capabilities.slice(0,3).join(', '),strengths:s.capabilities.slice(0,3),verifiedCertifications:s.certifications,dimensions:dims.map(d=>({...d,score:Math.max(1,d.score-i)}))}));
export const meetings: Meeting[]=[
{id:'meet-001',engagementId:'eng-001',meetingNo:'MTG-2026-000001',supplierId:'sup-001',supplierName:'Precision Mach Tech Pvt. Ltd.',requirementId:'req-001',requirementCode:'REQ-0001',requirementTitle:'CNC Machined Shaft',date:'2026-09-18',startTime:'09:30',endTime:'10:00',timezone:'Asia/Kolkata',status:'Confirmed',mode:'In-person at MSME Sangamam',agenda:'Review CNC shaft technical feasibility, quality evidence, capacity and commercial next steps.',venue:'Buyer-Seller Hall · Table B-12',version:1},
{id:'meet-002',engagementId:'eng-002',meetingNo:'MTG-2026-000002',supplierId:'sup-002',supplierName:'XYZ Engineering Works',requirementId:'req-001',requirementCode:'REQ-0001',requirementTitle:'CNC Machined Shaft',date:'2026-09-18',startTime:'11:45',endTime:'12:15',timezone:'Asia/Kolkata',status:'Pending Confirmation',mode:'In-person at MSME Sangamam',agenda:'Capability review and sourcing discussion.',venue:'Buyer-Seller Hall · Table B-08',version:1},
{id:'meet-003',engagementId:'eng-003',meetingNo:'MTG-2026-000003',supplierId:'sup-005',supplierName:'Meca Fab Pvt. Ltd.',requirementId:'req-002',requirementCode:'REQ-0002',requirementTitle:'Sheet Metal Enclosures',date:'2026-09-19',startTime:'15:30',endTime:'16:00',timezone:'Asia/Kolkata',status:'Scheduled',mode:'In-person at MSME Sangamam',agenda:'Sheet-metal sourcing discussion.',venue:'Buyer-Seller Hall · Table C-14',version:1}
];
export const actions: ActionItem[]=[
{id:'act-001',action:'Share drawing & specification',relatedTo:'Precision Mach Tech · REQ-0001',owner:'You',dueDate:'2026-08-22',status:'Open',priority:'High'},
{id:'act-002',action:'Provide capacity details',relatedTo:'XYZ Engineering Works · REQ-0001',owner:'Rahul Sharma',dueDate:'2026-08-23',status:'Open',priority:'High'},
{id:'act-003',action:'Submit quotation',relatedTo:'Shree Components · REQ-0001',owner:'Vendor',dueDate:'2026-08-27',status:'Open',priority:'Medium'},
{id:'act-004',action:'Share process flow chart',relatedTo:'Omega Precision · REQ-0001',owner:'Vendor',dueDate:'2026-08-25',status:'In Progress',priority:'Medium'},
{id:'act-005',action:'Send sample',relatedTo:'Meca Fab · REQ-0002',owner:'Vendor',dueDate:'2026-09-02',status:'Open',priority:'High'}
];
export const rfqs:Rfq[]=[
{id:'rfq-001',code:'RFQ-0001',requirement:'CNC Machined Shaft · REQ-0001',suppliers:5,sentDate:'2026-08-21',dueDate:'2026-08-31',responses:3,status:'Response Received'},
{id:'rfq-002',code:'RFQ-0002',requirement:'Sheet Metal Enclosure · REQ-0002',suppliers:4,sentDate:'2026-08-20',dueDate:'2026-08-30',responses:2,status:'Sent'},
{id:'rfq-003',code:'RFQ-0003',requirement:'Plastic Injection Components · REQ-0003',suppliers:6,sentDate:'2026-08-18',dueDate:'2026-08-29',responses:0,status:'Draft'}
];
export const samples:Sample[]=[
{id:'samp-001',sampleCode:'SMP-0001',requirement:'REQ-0001',supplier:'Precision Mach Tech Pvt. Ltd.',requestedOn:'2026-08-20',expectedOn:'2026-08-30',status:'Submitted'},
{id:'samp-002',sampleCode:'SMP-0002',requirement:'REQ-0001',supplier:'XYZ Engineering Works',requestedOn:'2026-08-21',expectedOn:'2026-08-31',status:'In Progress'},
{id:'samp-003',sampleCode:'SMP-0003',requirement:'REQ-0002',supplier:'Meca Fab Pvt. Ltd.',requestedOn:'2026-08-19',expectedOn:'2026-08-29',status:'Approved'}
];
export const qualifications:Qualification[]=[
{id:'qual-001',supplier:'Precision Mach Tech Pvt. Ltd.',requirement:'REQ-0001',stage:'Audit Scheduled',status:'In Progress',updatedAt:'2026-08-20'},
{id:'qual-002',supplier:'XYZ Engineering Works',requirement:'REQ-0001',stage:'Technical Review',status:'In Progress',updatedAt:'2026-08-21'},
{id:'qual-003',supplier:'Shree Components',requirement:'REQ-0001',stage:'Document Review',status:'In Progress',updatedAt:'2026-08-19'},
{id:'qual-004',supplier:'Omega Precision',requirement:'REQ-0001',stage:'Qualified',status:'Qualified',updatedAt:'2026-08-18'}
];
export const evaluations:Evaluation[]=[{id:'eval-001',supplier:'Precision Mach Tech Pvt. Ltd.',requirement:'REQ-0001',totalScore:4.55,status:'Draft',updatedAt:'2026-08-21'}];
export const onboarding:Onboarding[]=[
{id:'onb-001',supplier:'Precision Mach Tech Pvt. Ltd.',requirement:'REQ-0001',stage:'Vendor Master Creation',startedOn:'2026-08-19',status:'Approved'},
{id:'onb-002',supplier:'XYZ Engineering Works',requirement:'REQ-0001',stage:'Compliance Documents',startedOn:'2026-08-19',status:'In Progress'},
{id:'onb-003',supplier:'Shree Components',requirement:'REQ-0001',stage:'Bank Verification',startedOn:'2026-08-20',status:'In Progress'}
];
export const audits:Audit[]=[
{id:'aud-001',supplier:'Precision Mach Tech Pvt. Ltd.',type:'Process Audit',auditDate:'2026-08-24',auditor:'John D\'Souza',status:'Planned',report:false},
{id:'aud-002',supplier:'XYZ Engineering Works',type:'System Audit',auditDate:'2026-08-25',auditor:'Anita Rao',status:'In Progress',report:false},
{id:'aud-003',supplier:'Omega Precision',type:'Process Audit',auditDate:'2026-08-15',auditor:'John D\'Souza',status:'Completed',report:true}
];
export const negotiations:Negotiation[]=[
{id:'neg-001',supplier:'Precision Mach Tech Pvt. Ltd.',requirement:'REQ-0001',stage:'Negotiation',expectedValue:{amount:12500000,currency:'INR'},owner:'Rahul Sharma',nextFollowUp:'2026-08-23'},
{id:'neg-002',supplier:'XYZ Engineering Works',requirement:'REQ-0001',stage:'Discussion',expectedValue:{amount:9000000,currency:'INR'},owner:'Rahul Sharma',nextFollowUp:'2026-08-24'},
{id:'neg-003',supplier:'Shree Components',requirement:'REQ-0002',stage:'Negotiation',expectedValue:{amount:6400000,currency:'INR'},owner:'Anita Verma',nextFollowUp:'2026-08-25'}
];
export const purchaseOrders:PurchaseOrder[]=[
{id:'po-001',code:'PO-0001',supplier:'Precision Mach Tech Pvt. Ltd.',requirement:'REQ-0001',poDate:'2026-08-21',value:{amount:11000000,currency:'INR'},status:'Issued',receiptState:'Not Received',sourceSystem:'External ERP'},
{id:'po-002',code:'PO-0002',supplier:'Omega Precision',requirement:'REQ-0001',poDate:'2026-08-20',value:{amount:8500000,currency:'INR'},status:'Issued',receiptState:'Partially Received',sourceSystem:'External ERP'},
{id:'po-003',code:'PO-0003',supplier:'Shree Components',requirement:'REQ-0002',poDate:'2026-08-19',value:{amount:4300000,currency:'INR'},status:'Issued',receiptState:'Received',sourceSystem:'External ERP'}
];
export const notifications:Notification[]=[
{id:'not-001',type:'meeting',title:'Meeting confirmed with Precision Mach Tech',timestamp:'2026-08-13T12:20:00+05:30',read:false,href:'/buyer/meetings/meet-001'},
{id:'not-002',type:'match',title:'New supplier matches available for REQ-0001',timestamp:'2026-08-13T10:15:00+05:30',read:false,href:'/buyer/requirements/req-001/matches'},
{id:'not-003',type:'rfq',title:'RFQ-0001 has a new supplier response',timestamp:'2026-08-13T09:40:00+05:30',read:false,href:'/buyer/rfqs'}
];
export const reports:ReportItem[]=[
{id:'rep-001',name:'Matchmaking Summary Report',generatedAt:'2026-08-12',status:'Ready'},
{id:'rep-002',name:'Meeting Effectiveness Report',generatedAt:'2026-08-10',status:'Ready'},
{id:'rep-003',name:'Supplier Evaluation Summary',generatedAt:'2026-08-09',status:'Ready'},
{id:'rep-004',name:'Conversion & Impact Report',generatedAt:'2026-08-08',status:'Ready'}
];
