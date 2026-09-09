import { useEffect } from 'react';
import { useBuyerSession } from '../../services/buyer/hooks';
import { useAppDispatch } from '../store/hooks';
import { hydrateSession } from '../store/sessionSlice';

export function SessionBridge(){const {data}=useBuyerSession();const dispatch=useAppDispatch();useEffect(()=>{if(data)dispatch(hydrateSession({userId:data.userId,displayName:data.displayName,role:data.role,organisationName:data.organisationName,eventId:data.eventId,permissions:data.permissions}));},[data,dispatch]);return null;}
