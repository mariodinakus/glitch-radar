import {NextResponse} from 'next/server';
import {archiveCommand} from '@/lib/archive-redis';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 try {
  const [events,auditedAt]=await Promise.all([archiveCommand(['GET','glitch:archive:events:v1']),archiveCommand(['GET','glitch:archive:audit:v1'])]);
  const parsed=events?JSON.parse(String(events)):[];const rows=Array.isArray(parsed)?parsed.slice(-150):[];
  return NextResponse.json({available:true,auditedAt:auditedAt||null,events:rows},{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=300'}});
 }catch{
  return NextResponse.json({available:false,events:[],auditedAt:null},{headers:{'Cache-Control':'no-store'}});
 }
}
