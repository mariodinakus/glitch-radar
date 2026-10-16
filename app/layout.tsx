import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'GLITCH — Τι αλλάζει στον κόσμο',description:'Καθαρή εικόνα του κόσμου: τεκμηριωμένες ειδήσεις, τάσεις, αγορές προβλέψεων και υποκαλυμμένα σημαντικά θέματα.',applicationName:'GLITCH',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f7f8f6'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="el"><body>{children}</body></html>}
