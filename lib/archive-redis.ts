/** The existing server-only Upstash integration. No new credentials or public writes. */
export async function archiveCommand(args:(string|number)[]):Promise<unknown>{
 const base=process.env.UPSTASH_REDIS_REST_URL;
 const token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!base||!token)throw new Error('Redis archive is not configured');
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),7500);
 try{
  const r=await fetch((base.endsWith('/')?base.slice(0,-1):base) ,{
   method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify(args),cache:'no-store',signal:controller.signal
  });
  if(!r.ok)throw Error('Archive storage is unavailable');
  const j=await r.json() as {result?:unknown;error?:string};
  if(j.error)throw new Error('Archive command rejected');
  return j.result??null;
 }finally{clearTimeout(timeout)}
}
