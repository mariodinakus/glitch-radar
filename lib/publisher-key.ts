/** Count the same publisher only once across its different feed names. */
export function publisherKey(name:string):string|null{
 const raw=name.trim();
 if(!raw||/^Google News\s*\//i.test(raw))return null;
 const named:[RegExp,string][]=[
  [/^(bbc)\b/i,'BBC'],[/^(the )?guardian\b/i,'Guardian'],
  [/^(the )?new york times\b|^nyt\b/i,'New York Times'],
  [/^(reuters)\b/i,'Reuters'],[/^(associated press|ap news)\b/i,'Associated Press'],
  [/^(npr)\b/i,'NPR'],[/^(cbs news)\b/i,'CBS News'],
  [/^(fox news)\b/i,'Fox News'],[/^(bloomberg)\b/i,'Bloomberg'],
  [/^(dw|deutsche welle)\b/i,'DW'],[/^france\s*24\b/i,'France 24'],
  [/^al jazeera\b/i,'Al Jazeera'],[/^euronews\b/i,'Euronews'],
  [/^un news\b/i,'UN News'],[/^spaceflight news\b/i,'Spaceflight News'],
  [/^(the )?independent\b/i,'The Independent'],[/^(the )?wall street journal\b|^wsj\b/i,'WSJ']
 ];
 return named.find(([rx])=>rx.test(raw))?.[1]||raw;
}
