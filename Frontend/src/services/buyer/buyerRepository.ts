import type { ActionItem, Audit, BuyerContact, BuyerOrganisation, BuyerSession, Engagement, EngagementMessage, Evaluation, Meeting, MeetingOutcomeRecord, Negotiation, Notification, Onboarding, PurchaseOrder, Qualification, ReportItem, Requirement, Rfq, Sample, Supplier, SupplierMatch } from '../../domain/models/buyer';
import { httpClient } from '../api/httpClient';

export interface BuyerRepository {
  getSession():Promise<BuyerSession>; getOrganisation():Promise<BuyerOrganisation>; getContact():Promise<BuyerContact>;
  createRequirement(payload:unknown):Promise<Requirement>;
  listRequirements():Promise<Requirement[]>; getRequirement(id:string):Promise<Requirement>; listMatches(requirementId:string):Promise<SupplierMatch[]>; getSupplier(id:string):Promise<Supplier>;
  createEngagement(payload:{requirementId:string;capabilityId:string;stage:string}):Promise<{id:string;stage:string}>;
  listEngagements():Promise<Engagement[]>; listEngagementMessages(engagementId:string):Promise<EngagementMessage[]>;
  sendEngagementMessage(engagementId:string,payload:{senderOrganizationId:string;message:string}):Promise<EngagementMessage>;
  createRfq(payload:{requirementId:string;capabilityIds:string[]}):Promise<Rfq>;
  listMeetings():Promise<Meeting[]>; getMeeting(id:string):Promise<Meeting>; listMeetingOutcomes():Promise<any[]>; listActions():Promise<ActionItem[]>; listRfqs():Promise<Rfq[]>; listSamples():Promise<Sample[]>;
  scheduleMeeting(payload:{engagementId:string;start:string;end:string;mode:string;venueOrLink:string;alternativeSlots?:{start:string;end:string}[]}):Promise<Meeting>;
  transitionMeeting(id:string,status:string,notes?:string):Promise<Meeting>;
  meetingOutcome(id:string,payload:{outcome:string;notes:string;actionItems?:{title:string;ownerUserId?:string;dueDate?:string}[]}):Promise<{meeting:Meeting;outcome:MeetingOutcomeRecord}>;
  listQualifications():Promise<Qualification[]>; listEvaluations():Promise<Evaluation[]>; listOnboarding():Promise<Onboarding[]>; listAudits():Promise<Audit[]>; listNegotiations():Promise<Negotiation[]>; listPurchaseOrders():Promise<PurchaseOrder[]>; listNotifications():Promise<Notification[]>; listReports():Promise<ReportItem[]>;
  saveDraft(resource:string,payload:unknown,version?:number):Promise<{savedAt:string;version:number}>; updateRequirement(id:string,payload:unknown,version?:number):Promise<{savedAt:string;version:number}>; submit(resource:string,payload:unknown):Promise<{id:string;status:string}>;
  changePassword(currentPassword:string,newPassword:string):Promise<{message:string}>;
    listContacts():Promise<BuyerContact[]>; 
  createContact(payload:unknown):Promise<BuyerContact>; 
  deleteContact(id:string):Promise<void>;
}

type ApiRequirement={id:string;requirementNo:string;title:string;description:string;sourcingType:string;mainCategoryCode?:string;classificationCode?:string;quantity:number;uomCode:string;needByDate:string;status:string;budgetMax?:number;currency:string;version:number;updatedAt?:string;createdAt:string;matchCount?:number;averageMatchScore?:number;detailsJson?:any};
// matchCount/averageMatchScore are returned by the API and should be used
// so the Requirements list/detail reflects persisted matching results.

const mapRequirement=(x:ApiRequirement):Requirement=>({id:x.id,code:x.requirementNo,title:x.title,sourcingType:(['Product','Service','Works'].includes(x.sourcingType)?x.sourcingType:'Product') as Requirement['sourcingType'],category:x.mainCategoryCode??'Not selected',subcategory:x.classificationCode??'Not selected',quantity:x.quantity,unit:x.uomCode,neededBy:x.needByDate,preferredLocation:'India',description:x.description,status:x.status,matchCount:x.matchCount??0,averageMatch:x.averageMatchScore??0,updatedAt:x.updatedAt??x.createdAt,confidentiality:'NDA before drawings',budget:x.budgetMax?{amount:x.budgetMax,currency:x.currency}:undefined,version:x.version,detailsJson:x.detailsJson});

type ApiMeeting={id:string;meetingNo:string;engagementId:string;requirementId:string;requirementNo:string;requirementTitle:string;buyerOrganizationId:string;buyerOrganizationName:string;capabilityId:string;sellerOrganizationId:string;sellerOrganizationName:string;scheduledStart:string;scheduledEnd:string;mode:string;venueOrLink:string;status:string;notes:string;version:number};
const two=(n:number)=>String(n).padStart(2,'0');
const mapMeeting=(x:ApiMeeting):Meeting=>{const start=new Date(x.scheduledStart);const end=new Date(x.scheduledEnd);return {id:x.id,engagementId:x.engagementId,meetingNo:x.meetingNo,supplierId:x.sellerOrganizationId,supplierName:x.sellerOrganizationName,requirementId:x.requirementId,requirementCode:x.requirementNo,requirementTitle:x.requirementTitle,date:`${start.getFullYear()}-${two(start.getMonth()+1)}-${two(start.getDate())}`,startTime:`${two(start.getHours())}:${two(start.getMinutes())}`,endTime:`${two(end.getHours())}:${two(end.getMinutes())}`,timezone:'Asia/Kolkata',status:x.status,mode:x.mode,agenda:x.notes||x.requirementTitle,venue:x.venueOrLink,version:x.version}};

// The backend RFQ entity only carries requirementId (no title/number join, unlike MeetingDto for
// meetings), so requirement title is looked up client-side against the buyer's own requirements
// list. Field names below (rfqNo, requirementId, submissionDeadline) match what the backend
// actually returns — the previous code read row.rfqNumber, which does not exist on the response.
type ApiRfq={id:string;rfqNo:string;requirementId:string;submissionDeadline:string;status:string;createdAt:string};
const mapRfq=(x:ApiRfq,requirementLookup:Map<string,Requirement>):Rfq=>{const req=requirementLookup.get(x.requirementId);return {id:x.id,code:x.rfqNo,requirement:req?`${req.code} · ${req.title}`:x.requirementId.slice(0,8)+'…',suppliers:0,sentDate:x.createdAt,dueDate:x.submissionDeadline,responses:0,status:x.status}};

export const buyerRepository:BuyerRepository={
  getSession:()=>httpClient.get('/buyer/session'),
  getOrganisation:async()=>{const x=await httpClient.get<Record<string,unknown>>('/buyer/organisation');return {id:String(x.id),legalName:String(x.legalName??''),gstin:x.gstin?String(x.gstin):undefined,pan:x.pan?String(x.pan):undefined,organisationType:String(x.organizationType??'Buyer'),industry:'Manufacturing',establishmentYear:0,employeeBand:'Not provided',turnoverBand:'Not provided',registeredAddress:String(x.address??''),city:String(x.city??''),state:String(x.state??''),postalCode:String(x.pincode??''),country:String(x.country??'India'),version:Number(x.version??1)}},
  getContact:async()=>{const x=await httpClient.get<Record<string,unknown>>('/buyer/contacts/primary');return {id:String(x.id),fullName:String(x.name??''),designation:String(x.designation??''),department:'Procurement',email:String(x.email??''),mobile:String(x.phone??''),communication:['Email'],decisionRole:'Buyer'}},
  createRequirement:async payload=>mapRequirement(await httpClient.post<ApiRequirement>('/buyer/requirements',payload,crypto.randomUUID())),
  listRequirements:async()=>{const x=await httpClient.get<{items:ApiRequirement[]}>('/buyer/requirements');return x.items.map(mapRequirement)},
  getRequirement:async id=>mapRequirement(await httpClient.get<ApiRequirement>(`/buyer/requirements/${id}`)),
  listMatches:async id=>{
    // Run matching first so results are actually persisted into match_runs/match_results —
    // this also powers Match Explanation, buyer/seller notifications, and report counts,
    // none of which worked when matches were only computed in-memory and thrown away.
    // Safe to call on every visit: the backend clears this requirement's previous results
    // before recomputing, so re-running is idempotent.
    await httpClient.post(`/marketplace/matching/requirements/${id}/run`, {}, crypto.randomUUID());
    return (await httpClient.get<Array<Record<string,unknown>>>(`/buyer/requirements/${id}/matches`)).map(x=>({id:String(x.id),requirementId:id,supplierId:String(x.supplierId),capabilityId:x.capabilityId?String(x.capabilityId):undefined,supplierName:String(x.supplierName),overallScore:Number(x.score??0),eligibility:'Eligible',location:'India',capability:String(x.supplierName),strengths:[String(x.explanation??'Explainable match')],verifiedCertifications:[],dimensions:[]}));
  },
  getSupplier:async id=>{const x=await httpClient.get<Record<string,unknown>>(`/buyer/suppliers/${id}`);return {id:String(x.id),name:String(x.name),location:String(x.location),industry:String(x.industry),employees:String(x.employees),certifications:(x.certifications as string[])??[],capabilities:(x.capabilities as string[])??[],capabilityId:x.capabilityId?String(x.capabilityId):undefined,qualityScore:Number(x.qualityScore??0),deliveryScore:Number(x.deliveryScore??0),technicalScore:Number(x.technicalScore??0),responseScore:Number(x.responseScore??0),visibility:(x.visibility as 'full'|'masked')??'full'}},
  createEngagement:async payload=>{const row=await httpClient.post<{id:string;stage:string}>('/marketplace/engagements',{requirementId:payload.requirementId,capabilityId:payload.capabilityId,stage:payload.stage},crypto.randomUUID());return {id:row.id,stage:row.stage}},
  listEngagements:async()=>{const rows=await httpClient.get<Array<Record<string,unknown>>>('/marketplace/engagements');return rows.map(x=>({id:String(x.id),requirementId:String(x.requirementId),requirementNo:String(x.requirementNo??''),requirementTitle:String(x.title??''),buyerOrganizationId:String(x.buyerOrganizationId??''),buyerOrganizationName:String(x.buyerOrganizationName??''),capabilityId:String(x.capabilityId??''),sellerOrganizationId:String(x.sellerOrganizationId??''),sellerOrganizationName:String(x.sellerOrganizationName??''),stage:String(x.stage??''),updatedAt:String(x.updatedAt??x.createdAt??''),createdAt:String(x.createdAt??'')}));},
  listEngagementMessages:async engagementId=>{const rows=await httpClient.get<Array<Record<string,unknown>>>(`/marketplace/engagements/${engagementId}/messages`);return rows.map(x=>({id:String(x.id),engagementId:String(x.engagementId),senderOrganizationId:String(x.senderOrganizationId),message:String(x.message),sentAt:String(x.sentAt)}));},
  sendEngagementMessage:async(engagementId,payload)=>{const x=await httpClient.post<Record<string,unknown>>(`/marketplace/engagements/${engagementId}/messages`,{senderOrganizationId:payload.senderOrganizationId,message:payload.message},crypto.randomUUID());return {id:String(x.id),engagementId:String(x.engagementId),senderOrganizationId:String(x.senderOrganizationId),message:String(x.message),sentAt:String(x.sentAt)};},
  createRfq:async payload=>{const row=await httpClient.post<Record<string,unknown>>('/marketplace/rfqs',{requirementId:payload.requirementId,submissionDeadline:new Date(Date.now()+7*86400000).toISOString(),termsJson:'{}',capabilityIds:payload.capabilityIds},crypto.randomUUID());return {id:String(row.id),code:String(row.rfqNo??row.id),requirement:'',suppliers:payload.capabilityIds.length,sentDate:new Date().toISOString(),dueDate:String(row.submissionDeadline??''),responses:0,status:'Sent'}},
  listMeetings:async()=>(await httpClient.get<ApiMeeting[]>('/buyer/meetings')).map(mapMeeting),
  listMeetingOutcomes:async()=>await httpClient.get<any[]>('/buyer/meetings/outcomes'),
  getMeeting:async id=>{const x=await httpClient.get<{meeting:ApiMeeting}>(`/buyer/meetings/${id}`);return mapMeeting(x.meeting)},
  // Schedule/transition/outcome return the raw MarketplaceMeeting row (ids only, no
  // requirement/organization names), so refetch the enriched detail the screens need
  // instead of mapping the write response directly.
  scheduleMeeting:async payload=>{const row=await httpClient.post<{id:string}>('/marketplace/meetings',{engagementId:payload.engagementId,start:payload.start,end:payload.end,mode:payload.mode,venueOrLink:payload.venueOrLink,alternativeSlots:payload.alternativeSlots},crypto.randomUUID());const x=await httpClient.get<{meeting:ApiMeeting}>(`/buyer/meetings/${row.id}`);return mapMeeting(x.meeting)},
  transitionMeeting:async(id,status,notes)=>{await httpClient.post<{id:string}>(`/marketplace/meetings/${id}/transition`,{status,notes},crypto.randomUUID());const x=await httpClient.get<{meeting:ApiMeeting}>(`/buyer/meetings/${id}`);return mapMeeting(x.meeting)},
  meetingOutcome:async(id,payload)=>{await httpClient.post(`/marketplace/meetings/${id}/outcome`,{outcome:payload.outcome,notes:payload.notes,actionItems:payload.actionItems},crypto.randomUUID());const x=await httpClient.get<{meeting:ApiMeeting;outcome:{outcome:string;notes:string}}>(`/buyer/meetings/${id}`);return {meeting:mapMeeting(x.meeting),outcome:x.outcome!}},
  listActions:()=>httpClient.get('/buyer/actions'),
  listRfqs:async()=>{
    const [rows,requirements]=await Promise.all([
      httpClient.get<ApiRfq[]>('/buyer/rfqs'),
      buyerRepository.listRequirements().catch(()=>[] as Requirement[]),
    ]);
    const requirementLookup=new Map(requirements.map(r=>[r.id,r]));
    return rows.map(r=>mapRfq(r,requirementLookup));
  },
  listSamples:()=>httpClient.get('/buyer/samples'),listQualifications:()=>httpClient.get('/buyer/qualifications'),listEvaluations:()=>httpClient.get('/buyer/evaluations'),listOnboarding:()=>httpClient.get('/buyer/vendor-onboarding'),listAudits:()=>httpClient.get('/buyer/audits'),listNegotiations:()=>httpClient.get('/buyer/negotiations'),listPurchaseOrders:()=>httpClient.get('/buyer/purchase-orders'),listNotifications:()=>httpClient.get('/buyer/notifications'),listReports:()=>httpClient.get('/buyer/reports'),
  saveDraft:async(resource,payload,version=0)=>{
    // 'organisation' and 'contacts' are not requirement drafts -- they save the buyer's own
    // org/contact profile (onboarding screens 3 & 4). Previously this fell through to the
    // generic requirements-shaped path below and PATCHed /buyer/requirements/organisation,
    // which isn't a real requirement id, so profile edits silently failed. Route them to the
    // dedicated endpoints instead. The org/contact forms only collect a subset of backend
    // fields, so round-trip the current record first and merge, to avoid blanking out fields
    // (email, phone, tradeName, udyamNumber) the UI never shows.
    if(resource==='organisation'){
      const current=await httpClient.get<Record<string,unknown>>('/buyer/organisation');
      const p=payload as Record<string,unknown>;
      const body={legalName:p.legalName,tradeName:current.tradeName??null,email:current.email??'',phone:current.phone??'',address:p.registeredAddress,city:p.city,state:p.state,pincode:p.postalCode,gstin:p.gstin||null,pan:p.pan||null,udyamNumber:current.udyamNumber??null,version:Number(current.version??version)};
      const row=await httpClient.patch<Record<string,unknown>>('/buyer/organisation',body,Number(current.version??version));
      return {savedAt:String(row.updatedAt??new Date().toISOString()),version:Number(row.version??version)};
    }
    if(resource==='contacts'){
      const current=await httpClient.get<Record<string,unknown>>('/buyer/contacts/primary').catch(()=>null);
      // ContactPage submits an array (it supports multiple contacts in the form), but the
      // backend only models a single primary contact -- save the first entry as primary.
      const first=Array.isArray(payload)?(payload[0] as Record<string,unknown>):(payload as Record<string,unknown>);
      const body={fullName:first.fullName,email:first.email,mobile:first.mobile,designation:first.designation,version:current?Number(current.version??version):undefined};
      const row=await httpClient.patch<Record<string,unknown>>('/buyer/contacts/primary',body,current?Number(current.version??version):version);
      return {savedAt:String(row.updatedAt??new Date().toISOString()),version:Number(row.version??version)};
    }
    const parts=resource.replace(/^\/?requirements\//,'').split('/');
    const id=parts[0];
    const step=parts.length>1?parts[parts.length-1]:null;
    const path=step?`/buyer/requirements/${id}/steps/${step}`:`/buyer/requirements/${id}`;
    let body: any;
    if(step){
      body={payload,version};
    } else {
      const p=payload as Record<string,any>;
      const details=p.details||{};
      body={
        title:p.title??details.title,
        description:p.description??details.description,
        sourcingType:p.sourcingType??details.requirementType??details.sourcingType,
        segmentCode:p.segmentCode??details.segmentCode??details.segment,
        mainCategoryCode:p.mainCategoryCode??details.mainCategoryCode??details.mainCategory,
        classificationCode:p.classificationCode??details.classificationCode??details.classification??details.hsnCode,
        quantity:p.quantity??details.quantity,
        uomCode:p.uomCode??p.uom??details.uomCode??details.uom,
        needByDate:p.needByDate??details.needByDate,
        budgetMin:p.budgetMin??details.budgetMin,
        budgetMax:p.budgetMax??details.budgetMax,
        details:p.details??p,
        version,
      };
    }
    const row=await httpClient.patch<ApiRequirement>(path,body,version);
    return {savedAt:row.updatedAt??new Date().toISOString(),version:row.version};
  },
  updateRequirement:(id,payload,version=0)=>buyerRepository.saveDraft(`requirements/${id}`,payload,version),
  submit:async(resource,payload)=>{const id=resource.replace(/^\/?requirements\//,'').split('/')[0];const row=await httpClient.post<ApiRequirement>(`/buyer/requirements/${id}/publish`,payload,crypto.randomUUID());return {id:row.id,status:row.status}},
  // Settings screen (32) — Change Password. Previously this had no backend at all; the page
  // just flipped local state and threw it away.
  changePassword:(currentPassword,newPassword)=>httpClient.post('/account/change-password',{currentPassword,newPassword}),
    listContacts:async()=>{const rows=await httpClient.get<Array<Record<string,unknown>>>('/buyer/contacts');return rows.map(x=>({id:String(x.id),fullName:String(x.name??''),designation:String(x.designation??''),department:'Procurement',email:String(x.email??''),mobile:String(x.phone??''),communication:['Email'],decisionRole:'Buyer'}));},
  createContact:async payload=>{const x=await httpClient.post<Record<string,unknown>>('/buyer/contacts',payload,crypto.randomUUID());return {id:String(x.id),fullName:String(x.name??''),designation:String(x.designation??''),department:'Procurement',email:String(x.email??''),mobile:String(x.phone??''),communication:['Email'],decisionRole:'Buyer'};},
  deleteContact:async id=>{await httpClient.delete(`/buyer/contacts/${id}`);},
};