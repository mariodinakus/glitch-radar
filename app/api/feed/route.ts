import {NextResponse} from 'next/server';
import {getFeed} from '@/lib/sources';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{const data=await getFeed();return NextResponse.json(data,{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=60'}})}catch(e){return NextResponse.json({error:'Unable to load feed',message:e instanceof Error?e.message:'Unknown'}, {status:503})}}
