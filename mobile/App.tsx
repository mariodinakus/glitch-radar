import 'react-native-url-polyfill/auto';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,AppState,FlatList,Image,Linking,Platform,Pressable,RefreshControl,ScrollView,StatusBar,StyleSheet,Text,TextInput,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WebView} from 'react-native-webview';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import {createClient,type User} from '@supabase/supabase-js';

const SITE='https://glitch-radar-github.vercel.app';
const BG='#080A0F',CARD='#121721',LINE='#2C323D',GOLD='#E2B857',INK='#F3F0E9',DIM='#A6ACB6',RED='#F25A5B';
type Tab='Radar'|'Latest'|'Wars'|'Saved'|'Desk'|'Profile';
type Signal={id:string;title:string;summary:string;category:string;source:string;url:string;timestamp:string;score:number;reason?:string};
type Prefs={saved:string[];read:string[];follow:string[];mute:string[]};
type Profile={display_name:string;topics:string[];min_score:number;notifications_enabled:boolean;prefs:Prefs};
const EMPTY:Prefs={saved:[],read:[],follow:[],mute:[]};
const DEFAULT:Profile={display_name:'',topics:['all'],min_score:74,notifications_enabled:true,prefs:EMPTY};
const CATS=['All','World','Economy','Tech','Climate','Energy','Science','Sports'];
const PREFERENCES=[['all','All'],['world','World'],['economy','Economy'],['tech','AI & Tech'],['climate','Climate'],['energy','Energy'],['science','Science'],['sports','Sports']] as const;
const api=process.env.EXPO_PUBLIC_GLITCH_URL||SITE;
const anon=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,db=process.env.EXPO_PUBLIC_SUPABASE_URL;
const auth=anon&&db?createClient(db,anon,{auth:{storage:{
 getItem:(key:string)=>SecureStore.getItemAsync(key),
 setItem:(key:string,value:string)=>SecureStore.setItemAsync(key,value),
 removeItem:(key:string)=>SecureStore.deleteItemAsync(key)},
 persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce'}}):null;
const expoId=process.env.EXPO_PUBLIC_EAS_PROJECT_ID||String(Constants.expoConfig?.extra?.eas?.projectId||'');
const category=(raw:string)=>({ai:'Tech',tech:'Tech',economy:'Economy',energy:'Energy',science:'Science',space:'Science',climate:'Climate',nature:'Climate',earth:'Climate',sports:'Sports',world:'World'} as Record<string,string>)[raw]||'World';
const age=(iso:string)=>{const min=Math.max(1,Math.floor((Date.now()-Date.parse(iso))/60000));if(!Number.isFinite(min))return '';return min<60?min+'m':min<1440?Math.floor(min/60)+'h':Math.floor(min/1440)+'d'};
const validatePrefs=(p:unknown):Prefs=>{
 const x=p&&typeof p==='object'?p as Record<string,unknown>:{};
 const arr=(v:unknown)=>Array.isArray(v)?v.filter((s):s is string=>typeof s==='string').slice(-350):[];
 return {saved:arr(x.saved),read:arr(x.read),follow:arr(x.follow),mute:arr(x.mute)};
};
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
function Button({label,onPress,secondary=false,disabled=false}:{label:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}){return <Pressable disabled={disabled} onPress={onPress} style={[s.action,secondary&&s.actionSecondary,disabled&&{opacity:.5}]}><Text style={[s.actionText,secondary&&{color:GOLD}]}>{label}</Text></Pressable>}
function Pill({label,onPress,selected=false}:{label:string;onPress:()=>void;selected?:boolean}){return <Pressable onPress={onPress} style={[s.pill,selected&&s.pillOn]}><Text style={[s.pillText,selected&&{color:BG}]}>{label}</Text></Pressable>}

export default function App(){
 const [tab,setTab]=useState<Tab>('Radar');
 const [feed,setFeed]=useState<Signal[]>([]);
 const [busy,setBusy]=useState(true),[refreshing,setRefreshing]=useState(false);
 const [offline,setOffline]=useState(''),[stamp,setStamp]=useState('');
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('All');
 const [user,setUser]=useState<User|null>(null),[profile,setProfile]=useState<Profile>(DEFAULT);
 const [profileReady,setProfileReady]=useState(false),[saved,setSaved]=useState<string[]>([]);
 const [email,setEmail]=useState(''),[profileName,setProfileName]=useState(''),[message,setMessage]=useState('');
 const [authBusy,setAuthBusy]=useState(false),[pushBusy,setPushBusy]=useState(false),[pushOn,setPushOn]=useState(false);
 const [selected,setSelected]=useState<Signal|null>(null),[deskKey,setDeskKey]=useState(0);
 const active=useRef(true),inFlight=useRef(false),profileId=useRef('guest');
 const load=useCallback(async()=>{
  if(inFlight.current)return;
  inFlight.current=true;setRefreshing(true);
  const abort=new AbortController();
  const timeout=setTimeout(()=>abort.abort(),12000);
  try{
   const result=await fetch(api+'/api/feed',{signal:abort.signal,headers:{Accept:'application/json'}});
   if(!result.ok)throw Error('News API unavailable');
   const json=await result.json() as {signals:Signal[];generatedAt:string};
   if(!Array.isArray(json.signals))throw Error('Invalid feed');
   if(active.current){setFeed(json.signals.slice(0,500));setStamp(json.generatedAt||'');setOffline('')}
   void AsyncStorage.setItem('glitch.native.feed',JSON.stringify({signals:json.signals.slice(0,500),generatedAt:json.generatedAt}));
  }catch{if(active.current)setOffline('Connection unavailable — showing saved news when available')}
  finally{clearTimeout(timeout);inFlight.current=false;if(active.current){setBusy(false);setRefreshing(false)}}
 },[]);
 useEffect(()=>{
  active.current=true;
  void AsyncStorage.getItem('glitch.native.feed').then(data=>{if(!active.current||!data)return;try{const j=JSON.parse(data) as {signals:Signal[];generatedAt:string};if(Array.isArray(j.signals)){setFeed(j.signals);setStamp(j.generatedAt)}}catch{}}).finally(()=>void load());
  const timer=setInterval(()=>{if(AppState.currentState==='active')void load()},5*60000);
  const sub=AppState.addEventListener('change',state=>{if(state==='active')void load()});
  return()=>{active.current=false;clearInterval(timer);sub.remove()};
 },[load]);
 useEffect(()=>{
  if(!auth)return;
  let alive=true;
  void auth.auth.getUser().then(({data})=>{if(alive)setUser(data.user||null)});
  const {data:{subscription}}=auth.auth.onAuthStateChange((_e,session)=>{if(alive)setUser(session?.user||null)});
  const link=async(url:string)=>{try{
   const code=new URL(url).searchParams.get('code');
   if(code){const {error}=await auth.auth.exchangeCodeForSession(code);if(error)throw error;setMessage('You are signed in.');return}
   const hash=new URLSearchParams(url.split('#')[1]||'');
   const a=hash.get('access_token'),r=hash.get('refresh_token');
   if(a&&r){const {error}=await auth.auth.setSession({access_token:a,refresh_token:r});if(error)throw error;setMessage('You are signed in.')}
  }catch{setMessage('Login link expired. Request another link.')}}
  const listener=Linking.addEventListener('url',evt=>void link(evt.url));
  void Linking.getInitialURL().then(url=>{if(url?.startsWith('glitchradar://'))void link(url)});
  return()=>{alive=false;subscription.unsubscribe();listener.remove()};
 },[]);
 useEffect(()=>{
  let alive=true;
  const id=user?.id||'guest';profileId.current=id;
  setProfile(DEFAULT);setProfileReady(false);setSaved([]);
  void AsyncStorage.getItem('glitch.native.saved.'+id).then(raw=>{if(alive&&raw){try{const parsed=JSON.parse(raw);if(Array.isArray(parsed))setSaved(parsed)}catch{}}});
  if(auth&&user){
   void auth.from('user_profiles').select('display_name,topics,min_score,notifications_enabled,prefs').eq('id',user.id).maybeSingle().then(({data,error})=>{
    if(!alive)return;
    if(error){setMessage('Profile database needs setup. Browsing is available.');setProfileReady(false);return}
    if(data){
     const prefs=validatePrefs(data.prefs);
     setProfile({display_name:data.display_name||'',topics:Array.isArray(data.topics)?data.topics:['all'],min_score:Number(data.min_score||74),notifications_enabled:data.notifications_enabled!==false,prefs});
     setSaved(prefs.saved);setProfileName(data.display_name||'');
    }
    setProfileReady(true);
   });
  }else{setProfileReady(false)}
  return()=>{alive=false};
 },[user?.id]);
 const filtered=useMemo(()=>{
  let list=feed;
  if(tab==='Saved')list=list.filter(item=>saved.includes(item.id));
  else if(tab==='Wars')list=list.filter(item=>/war|conflict|ukrain|russi|gaza|israel|iran|militar|sudan|yemen/i.test(item.title+' '+item.summary));
  else if(tab==='Radar')list=list.filter(item=>item.score>=74);
  if(filter!=='All')list=list.filter(item=>category(item.category)===filter);
  if(query.trim()){const q=query.trim().toLowerCase();list=list.filter(item=>(item.title+' '+item.summary+' '+item.source).toLowerCase().includes(q))}
  return tab==='Latest'?[...list].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)):list;
 },[tab,feed,saved,filter,query]);
 const saveProfile=useCallback(async(next:Profile)=>{
  setProfile(next);setSaved(next.prefs.saved);
  if(!auth||!user||!profileReady)return;
  const {error}=await auth.from('user_profiles').update({display_name:next.display_name.slice(0,50),topics:next.topics,min_score:next.min_score,notifications_enabled:next.notifications_enabled,prefs:next.prefs}).eq('id',user.id);
  if(error)setMessage('Could not sync profile: '+error.message);
 },[user?.id,profileReady]);
 const toggleSaved=(id:string)=>{
  const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id].slice(-350);
  setSaved(next);void AsyncStorage.setItem('glitch.native.saved.'+profileId.current,JSON.stringify(next));
  if(user&&profileReady)void saveProfile({...profile,prefs:{...profile.prefs,saved:next}});
 };
 const subscribe=async()=>{
  if(!auth||!user){setTab('Profile');setMessage('Sign in before enabling notifications.');return}
  if(!expoId){setMessage('Expo EAS project not linked. Connect Expo to enable native push.');return}
  if(!Device.isDevice){setMessage('Push requires a real device.');return}
  setPushBusy(true);
  try{
   const current=await Notifications.getPermissionsAsync();
   const permission=current.granted?current:await Notifications.requestPermissionsAsync();
   if(!permission.granted)throw Error('Notification permission denied.');
   if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('radar',{name:'GLITCH RADAR',importance:Notifications.AndroidImportance.HIGH});
   const token=(await Notifications.getExpoPushTokenAsync({projectId:expoId})).data;
   const {data:{session}}=await auth.auth.getSession();
   if(!session)throw Error('Session expired. Please sign in again.');
   const result=await fetch(api+'/api/push/native',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({token,platform:Platform.OS})});
   if(!result.ok)throw Error('Push server not configured ('+result.status+').');
   await SecureStore.setItemAsync('glitch.native.push',token);
   setPushOn(true);setMessage('Native push enabled on this device.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not register device')}
  finally{setPushBusy(false)}
 };
 const unsubscribe=async()=>{
  if(!auth||!user)return;
  setPushBusy(true);
  try{
   const token=await SecureStore.getItemAsync('glitch.native.push');
   const {data:{session}}=await auth.auth.getSession();
   if(token&&session){
    const r=await fetch(api+'/api/push/native',{method:'DELETE',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({token})});
    if(!r.ok)throw Error('Could not remove device from push server.');
   }
   await SecureStore.deleteItemAsync('glitch.native.push');setPushOn(false);setMessage('Notifications disabled.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not disable notifications')}
  finally{setPushBusy(false)}
 };
 useEffect(()=>{void SecureStore.getItemAsync('glitch.native.push').then(t=>setPushOn(Boolean(t))).catch(()=>{})},[]);
 const login=async()=>{
  if(!auth){setMessage('Supabase keys are not configured yet.');return}
  if(!/^\S+@\S+\.\S+$/.test(email.trim())){setMessage('Enter a valid email.');return}
  setAuthBusy(true);setMessage('');
  try{const {error}=await auth.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:'glitchradar://auth/callback'}});
   if(error)throw error;setMessage('Check your email. Tap the login link to return to GLITCH RADAR.')
  }catch(e){setMessage(e instanceof Error?e.message:'Email login failed')}
  finally{setAuthBusy(false)}
 };
 const logout=async()=>{
  if(!auth)return;
  try{if(pushOn)await unsubscribe();const {error}=await auth.auth.signOut();if(error)throw error;setMessage('Signed out.')}
  catch(e){setMessage(e instanceof Error?e.message:'Sign out failed')}
 };
 const renderItem=useCallback(({item}:{item:Signal})=><Pressable onPress={()=>setSelected(item)} style={s.story}>
  <View style={s.storyTop}><Text style={s.source}>{item.source} · {age(item.timestamp)}</Text><Text style={s.score}>{Math.round(item.score)}/100</Text></View>
  <Text numberOfLines={3} style={s.storyTitle}>{item.title}</Text>
  {!!item.summary&&<Text numberOfLines={2} style={s.storySummary}>{item.summary}</Text>}
  <View style={s.storyBottom}><Text style={s.category}>{category(item.category).toUpperCase()}</Text><Pressable onPress={()=>toggleSaved(item.id)} style={s.bookmark}><Text style={{color:saved.includes(item.id)?GOLD:DIM}}>{saved.includes(item.id)?'★ Saved':'☆ Save'}</Text></Pressable></View>
 </Pressable>,[saved,profile,user,profileReady]);
 const renderProfile=()=>{
  if(!auth)return <View style={s.panel}><Text style={s.heading}>Personal account</Text><Text style={s.subtitle}>User profiles require a Supabase project. The native app still lets you read and save news locally.</Text></View>;
  if(!user)return <View style={s.panel}><Text style={s.heading}>Your own radar</Text><Text style={s.subtitle}>Sign in or create an account using a secure email link.</Text><TextInput keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={DIM} style={s.field}/><Button disabled={authBusy} label={authBusy?'Sending…':'Continue with email'} onPress={()=>void login()}/></View>;
  return <ScrollView contentContainerStyle={s.profileContent} keyboardShouldPersistTaps="handled">
   <Text style={s.heading}>Your radar profile</Text><Text style={s.subtitle}>{user.email}</Text>
   <Text style={s.caption}>DISPLAY NAME</Text><TextInput value={profileName} onChangeText={setProfileName} placeholder="Your name" placeholderTextColor={DIM} maxLength={50} style={s.field}/>
   <Button label="Save display name" onPress={()=>void saveProfile({...profile,display_name:profileName})}/>
   <Text style={s.caption}>NOTIFICATION TOPICS</Text>
   <View style={s.topics}>{PREFERENCES.map(([id,name])=><Pill key={id} label={name} selected={profile.topics.includes(id)} onPress={()=>{
    const choices=id==='all'?['all']:profile.topics.filter(x=>x!=='all');
    const result=id==='all'?choices:choices.includes(id)?choices.filter(x=>x!==id):[...choices,id];
    void saveProfile({...profile,topics:result.length?result:['all']});
   }}/>)}</View>
   <Text style={s.caption}>MINIMUM GLITCH SCORE · {profile.min_score}/100</Text>
   <View style={s.topics}>{[60,74,85,95].map(score=><Pill key={score} label={String(score)} selected={profile.min_score===score} onPress={()=>void saveProfile({...profile,min_score:score})}/>)}</View>
   <Button secondary label={profile.notifications_enabled?'Alert categories: enabled':'Alert categories: paused'} onPress={()=>void saveProfile({...profile,notifications_enabled:!profile.notifications_enabled})}/>
   <Button disabled={pushBusy} label={pushOn?'Disable native push notifications':'Enable native push notifications'} onPress={()=>void (pushOn?unsubscribe():subscribe())}/>
   <Button secondary label="Sign out" onPress={()=>void logout()}/>
  </ScrollView>;
 };
 const tabs:Tab[]=['Radar','Latest','Wars','Saved','Desk','Profile'];
 return <SafeAreaProvider><SafeAreaView style={s.root}>
  <StatusBar backgroundColor={BG} barStyle="light-content"/>
  <View style={s.header}>
   <Image source={require('./assets/icon.png')} resizeMode="contain" style={s.logo}/>
   <View style={{flex:1}}><Text style={s.brand}>GLITCH <Text style={{color:GOLD}}>RADAR</Text></Text><Text style={s.tag}>SEE THE CODE BEHIND THE NEWS</Text></View>
   <Pressable style={s.avatar} onPress={()=>setTab('Profile')}><Text style={{color:GOLD,fontSize:22}}>◎</Text></Pressable>
  </View>
  {Boolean(offline)&&<Text style={s.error}>{offline}</Text>}
  {Boolean(message)&&<Pressable onPress={()=>setMessage('')}><Text style={s.notice}>{message}  ×</Text></Pressable>}
  {selected?
   <ScrollView contentContainerStyle={s.details}>
    <Button secondary label="← Back" onPress={()=>setSelected(null)}/>
    <Text style={s.caption}>{selected.source} · {age(selected.timestamp)} · GLITCH {Math.round(selected.score)}/100</Text>
    <Text style={s.heading}>{selected.title}</Text><Text style={s.body}>{selected.summary}</Text>
    {selected.reason&&<Text style={s.subtitle}>RADAR SIGNAL: {selected.reason}</Text>}
    <Button label="Read original ↗" onPress={()=>void Linking.openURL(selected.url)}/>
    <Button secondary label={saved.includes(selected.id)?'Remove bookmark':'Save to my radar'} onPress={()=>toggleSaved(selected.id)}/>
   </ScrollView>:
   tab==='Profile'?renderProfile():
   tab==='Desk'?<View style={{flex:1}}><View style={s.deskBar}><Text style={s.subtitle}>Full intelligence dashboard</Text><Pressable onPress={()=>setDeskKey(k=>k+1)}><Text style={{color:GOLD}}>Refresh ↻</Text></Pressable></View><WebView key={deskKey} source={{uri:api}} javaScriptEnabled domStorageEnabled startInLoadingState renderLoading={()=><ActivityIndicator style={{marginTop:40}} color={GOLD}/>} onShouldStartLoadWithRequest={r=>{if(r.url.startsWith(api)||r.url==='about:blank')return true;void Linking.openURL(r.url);return false}}/></View>:
   <View style={{flex:1}}>
    <View style={s.intro}><Text style={s.sectionTitle}>{tab==='Radar'?'THE RADAR':tab.toUpperCase()}</Text><Text style={s.subtitle}>{tab==='Radar'?'Significant signals, not just headlines':tab==='Saved'?'Your bookmarked stories':tab==='Wars'?'Conflict and geopolitical signals':'Latest global reporting'}</Text></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search global news…" placeholderTextColor={DIM} style={s.search}/>
    <View style={{height:49}}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>{CATS.map(c=><Pill key={c} label={c} selected={filter===c} onPress={()=>setFilter(c)}/>)}</ScrollView></View>
    {busy&&feed.length===0?<ActivityIndicator color={GOLD} size="large" style={{marginTop:60}}/>:
    <FlatList keyExtractor={item=>item.id} data={filtered} renderItem={renderItem} initialNumToRender={7} maxToRenderPerBatch={7} windowSize={6} removeClippedSubviews={Platform.OS==='android'} contentContainerStyle={{paddingHorizontal:14,paddingBottom:20}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>void load()} tintColor={GOLD}/>} ListEmptyComponent={<Text style={s.empty}>No signals here. Change the category or refresh.</Text>} ListHeaderComponent={<Text style={s.count}>{filtered.length} signals · {stamp?('Updated '+age(stamp)+' ago'):'Connecting…'}</Text>}/>}
   </View>}
  <View style={s.bottom}>{tabs.map(t=><Pressable key={t} onPress={()=>{setSelected(null);setTab(t);setQuery('');setFilter('All')}} style={s.tab}><Text style={[s.tabLabel,t===tab&&s.tabOn]}>{t}</Text><View style={[s.dot,t!==tab&&{opacity:0}]}/></Pressable>)}</View>
 </SafeAreaView></SafeAreaProvider>;
}
const s=StyleSheet.create({
 root:{flex:1,backgroundColor:BG},header:{height:70,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:11,borderBottomWidth:1,borderColor:LINE},
 logo:{width:42,height:42,borderRadius:10},brand:{fontWeight:'900',fontSize:20,letterSpacing:1.1,color:INK},tag:{fontSize:8.5,color:DIM,letterSpacing:1.1,marginTop:4},
 avatar:{width:39,height:39,alignItems:'center',justifyContent:'center',borderRadius:22,borderWidth:1,borderColor:LINE},
 error:{backgroundColor:'#492523',color:'#FFD7D7',padding:8,fontSize:11},notice:{padding:11,color:GOLD,backgroundColor:'#232017',fontSize:12},
 intro:{paddingHorizontal:17,paddingTop:16,paddingBottom:10},sectionTitle:{color:GOLD,fontWeight:'900',fontSize:26,letterSpacing:1.3},subtitle:{color:DIM,fontSize:12,lineHeight:19,marginTop:3},
 search:{backgroundColor:CARD,color:INK,marginHorizontal:14,borderColor:LINE,borderWidth:1,borderRadius:12,paddingHorizontal:13,height:43,fontSize:13,marginBottom:9},
 filterRow:{paddingHorizontal:14,gap:7,alignItems:'center'},pill:{borderWidth:1,borderColor:LINE,borderRadius:18,paddingHorizontal:12,paddingVertical:8,backgroundColor:CARD},pillOn:{backgroundColor:GOLD,borderColor:GOLD},pillText:{fontSize:11,fontWeight:'700',color:DIM},
 count:{color:DIM,fontSize:10,paddingVertical:9,letterSpacing:.3},story:{backgroundColor:CARD,borderRadius:14,borderColor:LINE,borderWidth:1,padding:15,marginBottom:10,gap:8},
 storyTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},source:{color:DIM,fontSize:10,flex:1},score:{color:GOLD,fontWeight:'800',fontSize:13},
 storyTitle:{color:INK,fontSize:16,fontWeight:'800',lineHeight:23},storySummary:{color:'#ADB1BC',fontSize:12.5,lineHeight:19},
 storyBottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:4},category:{color:GOLD,fontSize:9,letterSpacing:1,fontWeight:'700'},
 bookmark:{padding:7},bottom:{flexDirection:'row',backgroundColor:'#0E1219',borderTopWidth:1,borderColor:LINE,paddingTop:7,paddingBottom:6},
 tab:{flex:1,alignItems:'center',justifyContent:'center',height:40},tabLabel:{fontSize:10,color:DIM,fontWeight:'700'},tabOn:{color:GOLD},dot:{height:3,width:17,borderRadius:5,backgroundColor:GOLD,marginTop:6},
 empty:{textAlign:'center',color:DIM,marginTop:42,fontSize:13,paddingHorizontal:25},
 panel:{padding:22,gap:13},profileContent:{padding:21,gap:14,paddingBottom:60},
 heading:{fontSize:25,fontWeight:'800',color:INK,lineHeight:32},caption:{color:GOLD,fontSize:11,fontWeight:'800',letterSpacing:.6,marginTop:9},
 field:{height:46,backgroundColor:CARD,borderRadius:10,borderColor:LINE,borderWidth:1,paddingHorizontal:14,color:INK,fontSize:14},
 topics:{flexDirection:'row',flexWrap:'wrap',gap:8},
 action:{backgroundColor:GOLD,borderRadius:11,minHeight:46,padding:10,justifyContent:'center',alignItems:'center',marginTop:4},
 actionSecondary:{backgroundColor:'#181D27',borderWidth:1,borderColor:LINE},actionText:{fontSize:13,fontWeight:'800',color:BG},
 details:{padding:21,gap:18,paddingBottom:90},body:{fontSize:15,lineHeight:25,color:INK},
 deskBar:{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:15,paddingVertical:10,alignItems:'center'}
});
