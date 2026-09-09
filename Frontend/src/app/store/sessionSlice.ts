import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
interface SessionProjection { userId:string|null; displayName:string; role:string; organisationName:string; eventId:string|null; permissions:string[]; }
const initialState:SessionProjection={userId:null,displayName:'',role:'',organisationName:'',eventId:null,permissions:[]};
const slice=createSlice({name:'session',initialState,reducers:{hydrateSession:(_s,a:PayloadAction<SessionProjection>)=>a.payload,clearSession:()=>initialState}});
export const {hydrateSession,clearSession}=slice.actions; export default slice.reducer;
