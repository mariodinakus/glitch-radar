import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const base=path.resolve(import.meta.dirname,'../..');
const dest=path.join(base,'mobile','assets');
await fs.mkdir(dest,{recursive:true});
const logo=await fs.readFile(path.join(base,'public','icon.svg'));
for(const [name,size] of [['icon.png',1024],['adaptive-icon.png',1024],['splash.png',384],['notification.png',96]]){
 await sharp(logo,{density:320}).resize(size,size).png().toFile(path.join(dest,name));
}
console.log('GLITCH RADAR native icons generated');
