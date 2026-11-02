import {NextResponse} from 'next/server';
import {loadMacroNow} from '@/lib/macro-now';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=25;
export async function GET(){
 const data=await loadMacroNow();
 return NextResponse.json({
  updatedAt:new Date().toISOString(),...data,
  methodology:'Monthly source-period observations from official BLS and ECB APIs. Data update when the agencies publish; revisions and release lags apply. API check time is not publication time. The series are not live observations or forecasts. If unavailable, no figures are invented.'
 },{headers:{'Cache-Control':'public, s-maxage=3600, stale-while-revalidate=3600'}});
}
