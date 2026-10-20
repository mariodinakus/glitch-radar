import type {Metadata,Viewport} from 'next';
import './glitch-news.css';
export const metadata:Metadata={
 title:'GLITCH — Ο κόσμος σε μια ματιά | World News',
 description:'Τα μεγάλα θέματα της υφηλίου με εικόνες, πλήρη κάλυψη από πολλές πηγές και προσωποποιημένη ροή. Ελληνικά και αγγλικά.',
 applicationName:'GLITCH',manifest:'/manifest.webmanifest?v=2',
 icons:{icon:[{url:'/api/icon-v2/192',sizes:'192x192',type:'image/png'},{url:'/icon.svg?v=2',type:'image/svg+xml'}],apple:[{url:'/api/icon-v2/180',sizes:'180x180',type:'image/png'}]},
 appleWebApp:{capable:true,title:'GLITCH',statusBarStyle:'black-translucent'}
};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#07080B'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="el"><head>
 <link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
 {/* eslint-disable-next-line @next/next/no-page-custom-font */}
 <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Noto+Serif+Display:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&display=swap"/>
</head><body>{children}</body></html>}
