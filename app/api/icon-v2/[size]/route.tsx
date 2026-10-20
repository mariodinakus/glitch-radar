import {ImageResponse} from 'next/og';
export const runtime='edge';
export async function GET(_request:Request,{params}:{params:Promise<{size:string}>}){
 const {size:raw}=await params;
 const size=raw==='512'?512:raw==='180'?180:raw==='192'?192:null;
 if(size===null)return new Response('Unknown icon size',{status:404});
 return new ImageResponse(
  <div style={{display:'flex',width:'100%',height:'100%',background:'#07080B',alignItems:'center',justifyContent:'center'}}>
   <svg width="76%" height="76%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="22" stroke="#E2B857" strokeWidth="3.5"/>
    <ellipse cx="32" cy="32" rx="9" ry="22" stroke="#D4A84A" strokeWidth="2.2"/>
    <path d="M12 24h40M12 40h40" stroke="#D4A84A" strokeWidth="2.2"/>
    <rect x="6" y="28.5" width="54" height="7" fill="#07080B"/>
    <rect x="17" y="30" width="44" height="4" rx="1" fill="#F3D58A"/>
    <rect x="4" y="30" width="9" height="4" rx="1" fill="#B8862B"/>
    <circle cx="51" cy="11" r="3.2" fill="#EF5B5B"/>
   </svg>
  </div>,
  {width:size,height:size,headers:{'Cache-Control':'public, max-age=86400, s-maxage=604800'}}
 );
}
