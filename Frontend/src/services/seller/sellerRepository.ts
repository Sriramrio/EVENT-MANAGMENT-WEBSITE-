import type { PagedResult, SellerCapability, SellerDashboard, SellerEngagement, SellerEngagementMessage, SellerMeeting, SellerOpportunity, SellerRfq, SellerSession } from '../../domain/models/seller';
import { httpClient } from '../api/httpClient';

type ApiMeeting={id:string;meetingNo:string;engagementId:string;requirementId:string;requirementNo:string;requirementTitle:string;buyerOrganizationId:string;buyerOrganizationName:string;capabilityId:string;sellerOrganizationId:string;sellerOrganizationName:string;scheduledStart:string;scheduledEnd:string;mode:string;venueOrLink:string;status:string;notes:string;version:number};
const two=(n:number)=>String(n).padStart(2,'0');
const mapMeeting=(x:ApiMeeting):SellerMeeting=>{const start=new Date(x.scheduledStart);const end=new Date(x.scheduledEnd);return {id:x.id,engagementId:x.engagementId,meetingNo:x.meetingNo,buyerOrganizationId:x.buyerOrganizationId,buyerOrganizationName:x.buyerOrganizationName,requirementId:x.requirementId,requirementCode:x.requirementNo,requirementTitle:x.requirementTitle,date:`${start.getFullYear()}-${two(start.getMonth()+1)}-${two(start.getDate())}`,startTime:`${two(start.getHours())}:${two(start.getMinutes())}`,endTime:`${two(end.getHours())}:${two(end.getMinutes())}`,timezone:'Asia/Kolkata',status:x.status,mode:x.mode,agenda:x.notes||x.requirementTitle,venue:x.venueOrLink,version:x.version}};

// The backend RFQ entity has no requirement title/number join (unlike MeetingDto for meetings),
// so it only returns requirementId. requirementNo/requirementTitle are looked up client-side
// against the seller's opportunities list (which already carries requirement titles) so the
// list screen shows something readable instead of a bare GUID.
type ApiRfq={id:string;rfqNo:string;requirementId:string;submissionDeadline:string;status:string;createdAt:string;version:number};
const mapRfq=(x:ApiRfq,requirementLookup:Map<string,{requirementNo:string;title:string}>):SellerRfq=>{const req=requirementLookup.get(x.requirementId);return {id:x.id,rfqNo:x.rfqNo,requirementId:x.requirementId,requirementNo:req?.requirementNo,requirementTitle:req?.title,submissionDeadline:x.submissionDeadline,status:x.status,createdAt:x.createdAt,version:x.version}};

export interface SellerRepository { getSession():Promise<SellerSession>; getDashboard():Promise<SellerDashboard>; listCapabilities():Promise<PagedResult<SellerCapability>>; getCapability(id:string):Promise<SellerCapability>; createCapability(payload:unknown):Promise<SellerCapability>; updateCapability(id:string,payload:unknown,version?:number):Promise<SellerCapability>; saveDraft(id:string,payload:unknown,version?:number):Promise<SellerCapability>; saveClassification(id:string,payload:unknown,version:number):Promise<SellerCapability>; saveTechnical(id:string,payload:unknown,version:number):Promise<SellerCapability>; saveCommercial(id:string,payload:unknown,version:number):Promise<SellerCapability>; publish(id:string,version:number):Promise<SellerCapability>; listOpportunities():Promise<SellerOpportunity[]>;
  listMeetings():Promise<SellerMeeting[]>; getMeeting(id:string):Promise<SellerMeeting>; listMeetingOutcomes():Promise<any[]>;
  transitionMeeting(id:string,status:string,notes?:string):Promise<SellerMeeting>;
  meetingOutcome(id:string,payload:{outcome:string;notes:string;actionItems?:{title:string;ownerUserId?:string;dueDate?:string}[]}):Promise<{meeting:SellerMeeting;outcome:{outcome:string;notes:string}}>;
  listRfqs():Promise<SellerRfq[]>; listAwards():Promise<unknown[]>;
  listEngagements():Promise<SellerEngagement[]>; listEngagementMessages(engagementId:string):Promise<SellerEngagementMessage[]>;
  sendEngagementMessage(engagementId:string,payload:{senderOrganizationId:string;message:string}):Promise<SellerEngagementMessage>;
  submitQuotation(rfqId:string,payload:{sellerOrganizationId:string;currency:string;lines:{description:string;quantity:number;uomCode:string;unitPrice:number}[]}):Promise<unknown>;
  listReports():Promise<any>; }

export const sellerRepository:SellerRepository={getSession:()=>httpClient.get('/seller/session'),getDashboard:()=>httpClient.get('/seller/dashboard'),listCapabilities:()=>httpClient.get('/seller/capabilities'),getCapability:id=>httpClient.get(`/seller/capabilities/${id}`),createCapability:p=>httpClient.post('/seller/capabilities',p,crypto.randomUUID()),updateCapability:(id,p,version=0)=>httpClient.patch(`/seller/capabilities/${id}`,{...(p as object),version},version),saveDraft:(id,p,version=0)=>httpClient.patch(`/seller/capabilities/${id}`,{...(p as object),version},version),saveClassification:(id,p,version)=>httpClient.patch(`/seller/capabilities/${id}/classification`,{...(p as object),version},version),saveTechnical:(id,p,version)=>httpClient.patch(`/seller/capabilities/${id}/technical`,{payload:p,version},version),saveCommercial:(id,p,version)=>httpClient.patch(`/seller/capabilities/${id}/commercial`,{payload:p,version},version),publish:(id,version)=>httpClient.post(`/seller/capabilities/${id}/publish`,{version},crypto.randomUUID()),listOpportunities:()=>httpClient.get('/seller/opportunities'),
  listMeetings:async()=>(await httpClient.get<ApiMeeting[]>('/seller/meetings')).map(mapMeeting),
  listMeetingOutcomes:async()=>await httpClient.get<any[]>('/seller/meetings/outcomes'),
  getMeeting:async id=>{const x=await httpClient.get<{meeting:ApiMeeting}>(`/seller/meetings/${id}`);return mapMeeting(x.meeting)},
  listReports:()=>httpClient.get('/seller/reports'),
  // Transition/outcome return the raw MarketplaceMeeting row, so refetch the enriched detail.
  transitionMeeting:async(id,status,notes)=>{await httpClient.post<{id:string}>(`/marketplace/meetings/${id}/transition`,{status,notes},crypto.randomUUID());const x=await httpClient.get<{meeting:ApiMeeting}>(`/seller/meetings/${id}`);return mapMeeting(x.meeting)},
  meetingOutcome:async(id,payload)=>{await httpClient.post(`/marketplace/meetings/${id}/outcome`,{outcome:payload.outcome,notes:payload.notes,actionItems:payload.actionItems},crypto.randomUUID());const x=await httpClient.get<{meeting:ApiMeeting;outcome:{outcome:string;notes:string}}>(`/seller/meetings/${id}`);return {meeting:mapMeeting(x.meeting),outcome:x.outcome!}},
  listRfqs:async()=>{
    const [rows,opportunities]=await Promise.all([
      httpClient.get<ApiRfq[]>('/seller/rfqs'),
      httpClient.get<SellerOpportunity[]>('/seller/opportunities').catch(()=>[] as SellerOpportunity[]),
    ]);
    const requirementLookup=new Map(opportunities.map(o=>[o.requirementId,{requirementNo:o.requirementNo,title:o.title}]));
    return rows.map(r=>mapRfq(r,requirementLookup));
  },
  listAwards:()=>httpClient.get('/seller/awards'),
  listEngagements:async()=>{const rows=await httpClient.get<Array<Record<string,unknown>>>('/marketplace/engagements');return rows.map(x=>({id:String(x.id),requirementId:String(x.requirementId),requirementNo:String(x.requirementNo??''),requirementTitle:String(x.title??''),buyerOrganizationId:String(x.buyerOrganizationId??''),buyerOrganizationName:String(x.buyerOrganizationName??''),capabilityId:String(x.capabilityId??''),sellerOrganizationId:String(x.sellerOrganizationId??''),sellerOrganizationName:String(x.sellerOrganizationName??''),stage:String(x.stage??''),updatedAt:String(x.updatedAt??x.createdAt??''),createdAt:String(x.createdAt??'')}));},
  listEngagementMessages:async engagementId=>{const rows=await httpClient.get<Array<Record<string,unknown>>>(`/marketplace/engagements/${engagementId}/messages`);return rows.map(x=>({id:String(x.id),engagementId:String(x.engagementId),senderOrganizationId:String(x.senderOrganizationId),message:String(x.message),sentAt:String(x.sentAt)}));},
  sendEngagementMessage:async(engagementId,payload)=>{const x=await httpClient.post<Record<string,unknown>>(`/marketplace/engagements/${engagementId}/messages`,{senderOrganizationId:payload.senderOrganizationId,message:payload.message},crypto.randomUUID());return {id:String(x.id),engagementId:String(x.engagementId),senderOrganizationId:String(x.senderOrganizationId),message:String(x.message),sentAt:String(x.sentAt)};},
  submitQuotation:(rfqId,payload)=>httpClient.post(`/marketplace/rfqs/${rfqId}/quotations`,payload,crypto.randomUUID())};