/**
 * Safe RSS text normalization: decode HTML entities before stripping markup.
 * Does not crawl or reproduce the publisher's complete article.
 */
const entities:Record<string,string>={
 amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',rsquo:'’',lsquo:'‘',
 ldquo:'“',rdquo:'”',mdash:'—',ndash:'–',hellip:'…',bull:'•',
 laquo:'«',raquo:'»',euro:'€',copy:'©',middot:'·',trade:'™'
};
export function decodeRssEntities(input:string):string {
 return input.replace(/&(#x[\da-f]+|#\d+|[a-z]{2,12});/gi,(_,entity:string)=>{
  if(entity.startsWith('#')){
   const hex=entity[1]?.toLowerCase()==='x';
   const point=parseInt(entity.slice(hex?2:1),hex?16:10);
   return Number.isInteger(point)&&point>0&&point<=0x10ffff&&!(point>=0xd800&&point<=0xdfff)
      ?String.fromCodePoint(point):' ';
  }
  return entities[entity.toLowerCase()]??' ';
 });
}
export function rssPlainText(value:unknown,max=1200):string {
 let text=String(value??'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1');
 for(let i=0;i<3;i++) {
  text=decodeRssEntities(text);
  text=text.replace(/<\s*(?:script|style|iframe|svg)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|iframe|svg)\s*>/gi,' ');
  text=text.replace(/<[^>]*>/g,' ');
 }
 // Some malformed feeds contain a plain-text redirect URL after entity decoding.
 text=text.replace(/\bhttps?:\/\/[^\s<>"']+/gi,' ');
 return text.replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\s+/g,' ').trim().slice(0,max);
}
export function rssField(item:string,tag:string,max=1600):string {
 if(!/^[a-z][\w:-]*$/i.test(tag))return '';
 const regex=new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i');
 return rssPlainText(item.match(regex)?.[1]??'',max);
}
export function googleNewsPreview(_raw:string):string {
 // Google News RSS descriptions are HTML link lists, not verified article summaries.
 return 'Συγκεντρωτική αναφορά μέσω Google News. Για το πλήρες ρεπορτάζ και τα αίτια της εξέλιξης, άνοιξε την αρχική δημοσίευση.';
}
