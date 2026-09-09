import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
interface UiState { mobileNavOpen:boolean; selectedWorkspace:'buyer'; }
const initialState:UiState={mobileNavOpen:false,selectedWorkspace:'buyer'};
const slice=createSlice({name:'ui',initialState,reducers:{setMobileNavOpen:(s,a:PayloadAction<boolean>)=>{s.mobileNavOpen=a.payload;}}});
export const {setMobileNavOpen}=slice.actions; export default slice.reducer;
