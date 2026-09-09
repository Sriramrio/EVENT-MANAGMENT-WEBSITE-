import { configureStore } from '@reduxjs/toolkit'; import session from './sessionSlice'; import ui from './uiSlice';
export const store=configureStore({reducer:{session,ui},devTools:import.meta.env.DEV}); export type RootState=ReturnType<typeof store.getState>; export type AppDispatch=typeof store.dispatch;
