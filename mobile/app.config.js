const fs=require('fs');
const easId=process.env.EXPO_PUBLIC_EAS_PROJECT_ID||'';
const site=process.env.EXPO_PUBLIC_GLITCH_URL||'https://glitch-radar-github.vercel.app';
const expo={
 name:'GLITCH RADAR',slug:'glitch-radar-mobile',scheme:'glitchradar',
 version:'1.0.0',orientation:'portrait',userInterfaceStyle:'dark',
 icon:'./assets/icon.png',newArchEnabled:true,
 splash:{image:'./assets/splash.png',resizeMode:'contain',backgroundColor:'#080A0F'},
 ios:{supportsTablet:true,bundleIdentifier:'com.mariodinakus.glitchradar'},
 android:{package:'com.mariodinakus.glitchradar',versionCode:1,
  permissions:['android.permission.POST_NOTIFICATIONS'],
  adaptiveIcon:{foregroundImage:'./assets/adaptive-icon.png',backgroundColor:'#080A0F'}
 },
 plugins:[['expo-notifications',{icon:'./assets/notification.png',color:'#E2B857'}],'expo-secure-store'],
 extra:{siteUrl:site,...(easId?{eas:{projectId:easId}}:{})},
 ...(easId?{owner:process.env.EXPO_PUBLIC_EAS_OWNER||undefined,runtimeVersion:{policy:'appVersion'},
  updates:{url:'https://u.expo.dev/'+easId,checkAutomatically:'ON_LOAD',fallbackToCacheTimeout:0}}:{})
};
module.exports={expo};
