import {ImageResponse} from 'next/og';
export const runtime='edge';
export async function GET(_request:Request,{params}:{params:Promise<{size:string}>}){
 const {size:raw}=await params;
 const size=raw==='512'?512:raw==='180'?180:raw==='192'?192:null;
 if(!size)return new Response('Unknown icon size',{status:404});
 return new ImageResponse(
  <div style={{display:'flex',width:'100%',height:'100%',background:'#090B13',alignItems:'center',justifyContent:'center'}}>
   <svg width="76%" height="76%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M51.2 21.6A21 21 0 1 0 53 37.8" stroke="#E2B857" strokeWidth="2.6" strokeLinecap="round"/>
    <path d="M21.5 19.5c3.2-3.6 7-5.3 12-5.3 5.5 0 9.9 2.1 12.3 4.9" stroke="#F6DDA3" strokeWidth="4" strokeLinecap="round"/>
    <path d="M45.7 31.5H33.3m12.4 0V43c-4.1 4.2-8.7 6.2-13.9 6.2-9.6 0-17-7.2-17-17.2 0-3.7 1-6.7 2.5-9.4" stroke="#E2B857" strokeWidth="5" strokeLinecap="square" strokeLinejoin="round"/>
    <path d="M10 38.7h13.8M36 25.6h18.5" stroke="#FF526D" strokeWidth="3" strokeLinecap="round"/>
    <path d="M45.4 13.1 49 9.5" stroke="#FF4E6C" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="51.2" cy="10.7" r="3.2" fill="#FF4E6C"/>
   </svg>
  </div>,
  {width:size,height:size,headers:{'Cache-Control':'public, max-age=86400, s-maxage=604800'}}
 );
}
