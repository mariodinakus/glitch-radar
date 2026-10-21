import type {Metadata,Viewport} from 'next';
import './glitch-news.css';
import './society.css';
import './conflict-atlas.css';
export const metadata:Metadata={
 title:'GLITCH RADAR — The Black Cat News Detector',
 description:'GLITCH finds observable inconsistencies and source echoes in global English-language reporting, with keyless Black Cat analysis and source-linked War Room.',
 applicationName:'GLITCH RADAR',manifest:'/manifest.webmanifest?v=5',
 icons:{icon:[{url:'/api/icon-v2/192?v=5',sizes:'192x192',type:'image/png'},{url:'/icon.svg?v=5',type:'image/svg+xml'}],apple:[{url:'/api/icon-v2/180?v=5',sizes:'180x180',type:'image/png'}]},
 appleWebApp:{capable:true,title:'GLITCH RADAR',statusBarStyle:'black-translucent'}
};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#090B13'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head>
 <link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
 {/* eslint-disable-next-line @next/next/no-page-custom-font */}
 <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Commissioner:wght@500;600;700;800;900&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@800&display=swap"/>
</head><body>{children}</body></html>}
