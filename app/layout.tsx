import type {Metadata,Viewport} from 'next';
import './editorial.css';
import './immersion.css';
export const metadata:Metadata={
 title:'GLITCH — Ειδήσεις με ανάλυση | World News & Analysis',
 description:'Παγκόσμια επικαιρότητα, πραγματικές πηγές και τεκμηριωμένη ανάλυση. Ελληνικά και αγγλικά.',
 applicationName:'GLITCH',manifest:'/manifest.webmanifest?v=2',
 icons:{icon:[{url:'/api/icon-v2/192',sizes:'192x192',type:'image/png'},{url:'/icon.svg?v=2',type:'image/svg+xml'}],apple:[{url:'/api/icon-v2/180',sizes:'180x180',type:'image/png'}]},
 appleWebApp:{capable:true,title:'GLITCH',statusBarStyle:'black-translucent'}
};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#090C14'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="el"><body>{children}</body></html>}
