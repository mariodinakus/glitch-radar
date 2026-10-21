package com.mariodinakus.glitchlite;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import android.text.TextWatcher;
import android.text.Editable;
import org.json.*;
import java.net.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {
  private static final String API="https://glitch-radar-github.vercel.app/api/feed";
  private static final String SITE="https://glitch-radar-github.vercel.app/";
  private static final int BG=0xff080a0f,CARD=0xff141820,LINE=0xff2b303a,GOLD=0xffe2b857,WHITE=0xfff2f0e9,DIM=0xffa3a9b1,RED=0xffed625c;
  private final Handler ui=new Handler(Looper.getMainLooper());
  private final ExecutorService executor=Executors.newSingleThreadExecutor();
  private final List<Story> stories=new ArrayList<>();
  private final Set<String> saved=new HashSet<>();
  private String tab="Radar",query="",category="All";
  private LinearLayout base,results,filters;
  private TextView status,title;
  private ScrollView feedScroll;
  private boolean loading=false;
  private SharedPreferences preferences;

  private static class Story {
    String id,title,summary,category,source,url,date,reason;int score;
    Story(JSONObject o){
      id=o.optString("id");title=o.optString("title");summary=o.optString("summary");
      category=o.optString("category");source=o.optString("source");url=o.optString("url");
      date=o.optString("timestamp");reason=o.optString("reason");score=o.optInt("score");
    }
  }
  private int dp(float n){return (int)(n*getResources().getDisplayMetrics().density+.5f);}
  private GradientDrawable bg(int color,int border,int radius){
    GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));
    if(border!=0)d.setStroke(dp(1),border);return d;
  }
  private TextView label(String text,int size,int color,boolean bold){
    TextView v=new TextView(this);v.setText(text);v.setTextSize(size);v.setTextColor(color);
    if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return v;
  }
  private void pad(View v,int x,int y){v.setPadding(dp(x),dp(y),dp(x),dp(y));}
  private void spacing(LinearLayout col,int n){View v=new View(this);col.addView(v,new LinearLayout.LayoutParams(1,dp(n)));}
  private void saveBookmarks(){
    preferences.edit().putStringSet("saved",new HashSet<>(saved)).apply();
  }
  @Override public void onCreate(Bundle state){
    super.onCreate(state);
    getWindow().setStatusBarColor(BG);getWindow().setNavigationBarColor(BG);
    preferences=getSharedPreferences("glitch-radar-mobile",MODE_PRIVATE);
    saved.addAll(preferences.getStringSet("saved",Collections.emptySet()));
    showShell();loadFeed();
  }
  private void showShell(){
    base=new LinearLayout(this);base.setOrientation(LinearLayout.VERTICAL);base.setBackgroundColor(BG);
    setContentView(base);
    LinearLayout bar=new LinearLayout(this);bar.setOrientation(LinearLayout.HORIZONTAL);bar.setGravity(Gravity.CENTER_VERTICAL);pad(bar,15,10);
    TextView logo=label("◉",27,GOLD,true);bar.addView(logo);
    LinearLayout brand=new LinearLayout(this);brand.setOrientation(LinearLayout.VERTICAL);
    TextView name=label("  GLITCH RADAR",22,WHITE,true);brand.addView(name);
    TextView sub=label("   WORLD INTELLIGENCE · LIVE",9,DIM,false);brand.addView(sub);
    bar.addView(brand,new LinearLayout.LayoutParams(0,dp(52),1));
    TextView update=label("↻",25,GOLD,true);pad(update,10,7);bar.addView(update);
    update.setContentDescription("Refresh headlines");
    update.setOnClickListener(v->loadFeed());
    base.addView(bar);
    View rule=new View(this);rule.setBackgroundColor(LINE);base.addView(rule,new LinearLayout.LayoutParams(-1,dp(1)));
    title=label("THE RADAR",25,GOLD,true);pad(title,16,16);base.addView(title);
    status=label("Connecting to live news…",11,DIM,false);status.setPadding(dp(16),0,dp(16),dp(10));base.addView(status);
    EditText search=new EditText(this);search.setSingleLine(true);search.setTextSize(13);
    search.setHint("Search global news…");search.setHintTextColor(DIM);search.setTextColor(WHITE);
    search.setBackground(bg(CARD,LINE,12));pad(search,12,9);
    LinearLayout.LayoutParams searchLp=new LinearLayout.LayoutParams(-1,dp(42));searchLp.setMargins(dp(14),0,dp(14),dp(12));
    base.addView(search,searchLp);
    search.addTextChangedListener(new TextWatcher(){
      public void beforeTextChanged(CharSequence s,int start,int count,int after){}
      public void onTextChanged(CharSequence s,int start,int before,int count){query=s.toString();render();}
      public void afterTextChanged(Editable e){}
    });
    HorizontalScrollView horizontal=new HorizontalScrollView(this);horizontal.setHorizontalScrollBarEnabled(false);
    filters=new LinearLayout(this);filters.setOrientation(LinearLayout.HORIZONTAL);pad(filters,12,2);
    horizontal.addView(filters);base.addView(horizontal);
    feedScroll=new ScrollView(this);feedScroll.setFillViewport(true);
    results=new LinearLayout(this);results.setOrientation(LinearLayout.VERTICAL);pad(results,14,12);
    feedScroll.addView(results);base.addView(feedScroll,new LinearLayout.LayoutParams(-1,0,1));
    LinearLayout nav=new LinearLayout(this);nav.setBackgroundColor(CARD);
    for(String section:new String[]{"Radar","Latest","Saved","Desk","Profile"}){
      TextView item=label(section,12,WHITE,false);item.setGravity(Gravity.CENTER);pad(item,6,16);
      nav.addView(item,new LinearLayout.LayoutParams(0,dp(54),1));
      item.setOnClickListener(v->{tab=section;render();});
    }
    base.addView(nav);
    render();
  }
  private void loadFeed(){
    if(loading)return;loading=true;status.setText("Scanning sources…");
    executor.execute(()->{
      String response=null,err=null;
      try{
        HttpURLConnection c=(HttpURLConnection)new URL(API).openConnection();
        c.setConnectTimeout(10000);c.setReadTimeout(13000);
        c.setRequestProperty("Accept","application/json");c.setRequestProperty("User-Agent","GlitchRadarAndroid/1.0");
        try(InputStream input=c.getInputStream();ByteArrayOutputStream output=new ByteArrayOutputStream()){
          byte[] buf=new byte[8192];int count;while((count=input.read(buf))!=-1){output.write(buf,0,count);if(output.size()>6000000)throw new IOException("Feed too large");}
          response=output.toString("UTF-8");
        }finally{c.disconnect();}
      }catch(Exception e){err=e.getMessage();}
      final String data=response,error=err;
      ui.post(()->{
        loading=false;
        if(data!=null){
          try{
            JSONObject json=new JSONObject(data);
            JSONArray items=json.optJSONArray("signals");
            if(items==null)throw new JSONException("No signal list");
            stories.clear();
            for(int i=0;i<items.length()&&i<450;i++){
              JSONObject o=items.optJSONObject(i);if(o!=null)stories.add(new Story(o));
            }
            preferences.edit().putString("cache",data).apply();
            status.setText("LIVE · "+stories.size()+" signals");
          }catch(Exception ex){status.setText("Feed decoding error");}
        }else{
          status.setText("OFFLINE · Showing saved headlines");
          if(stories.isEmpty()){
            try{
              JSONObject json=new JSONObject(preferences.getString("cache","{}"));JSONArray items=json.optJSONArray("signals");
              if(items!=null)for(int i=0;i<items.length()&&i<450;i++){JSONObject o=items.optJSONObject(i);if(o!=null)stories.add(new Story(o));}
            }catch(Exception ignored){}
          }
        }
        render();
      });
    });
  }
  private void openUrl(String url){
    try{Intent open=new Intent(Intent.ACTION_VIEW,Uri.parse(url));startActivity(open);}
    catch(Exception e){Toast.makeText(this,"Unable to open link",Toast.LENGTH_LONG).show();}
  }
  private void rowText(String txt,LinearLayout parent,int size,int color,boolean bold){
    TextView view=label(txt,size,color,bold);parent.addView(view);
  }
  private void renderFilters(){
    filters.removeAllViews();
    for(String name:new String[]{"All","World","Economy","Tech","Climate","Energy","Science","Sports"}){
      boolean chosen=category.equals(name);
      TextView b=label(name,11,chosen?BG:DIM,true);pad(b,13,10);
      b.setBackground(bg(chosen?GOLD:CARD,chosen?GOLD:LINE,18));
      LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-2,-2);lp.setMargins(dp(2),0,dp(6),dp(3));
      filters.addView(b,lp);b.setOnClickListener(v->{category=name;render();});
    }
  }
  private String mappedCategory(String raw){
    if(raw.equals("ai")||raw.equals("tech"))return "Tech";
    if(raw.equals("space")||raw.equals("science"))return "Science";
    if(raw.equals("earth")||raw.equals("climate")||raw.equals("nature"))return "Climate";
    String x=raw.toLowerCase(Locale.ROOT);
    if(x.equals("world"))return "World";if(x.equals("economy"))return "Economy";
    if(x.equals("energy"))return "Energy";if(x.equals("sports"))return "Sports";
    return "World";
  }
  private void render(){
    if(results==null)return;
    results.removeAllViews();
    title.setText(tab.equals("Radar")?"THE RADAR":tab.toUpperCase(Locale.ROOT));
    if(tab.equals("Profile")){
      renderFilters();
      TextView h=label("YOUR GLITCH PROFILE",19,GOLD,true);results.addView(h);spacing(results,16);
      rowText("Accounts, saved cloud preferences, and notification settings are available in the full GLITCH RADAR service.",results,14,WHITE,false);
      spacing(results,18);
      TextView btn=button("Open account & alerts  ↗");results.addView(btn);
      btn.setOnClickListener(v->openUrl(SITE));
      return;
    }
    if(tab.equals("Desk")){
      TextView h=label("FULL INTELLIGENCE DESK",20,GOLD,true);results.addView(h);spacing(results,12);
      rowText("Open the full GLITCH RADAR dashboard, storylines, Black Cat analysis and live source coverage.",results,14,WHITE,false);
      spacing(results,16);
      TextView btn=button("Open full dashboard  ↗");results.addView(btn);
      btn.setOnClickListener(v->openUrl(SITE));
      return;
    }
    renderFilters();
    List<Story> display=new ArrayList<>();
    String find=query.toLowerCase(Locale.ROOT).trim();
    for(Story story:stories){
      if(tab.equals("Saved")&&!saved.contains(story.id))continue;
      if(tab.equals("Radar")&&story.score<74)continue;
      if(!category.equals("All")&&!mappedCategory(story.category).equals(category))continue;
      if(!find.isEmpty()&&!(story.title+" "+story.summary+" "+story.source).toLowerCase(Locale.ROOT).contains(find))continue;
      display.add(story);
    }
    if(tab.equals("Latest"))display.sort((a,b)->b.date.compareTo(a.date));
    rowText(display.size()+" stories",results,11,DIM,false);spacing(results,10);
    if(display.isEmpty()){rowText(stories.isEmpty()?"No news loaded. Tap refresh to retry.":"No matching stories. Try a different category.",results,14,DIM,false);return;}
    int limit=Math.min(display.size(),100);
    for(int i=0;i<limit;i++)renderStory(display.get(i));
  }
  private TextView button(String text){
    TextView b=label(text,13,BG,true);b.setGravity(Gravity.CENTER);pad(b,13,13);b.setBackground(bg(GOLD,0,10));return b;
  }
  private void renderStory(Story story){
    LinearLayout item=new LinearLayout(this);item.setOrientation(LinearLayout.VERTICAL);
    item.setBackground(bg(CARD,LINE,13));pad(item,14,13);
    LinearLayout meta=new LinearLayout(this);meta.setOrientation(LinearLayout.HORIZONTAL);
    TextView source=label(story.source.length()>35?story.source.substring(0,35):story.source,10,DIM,false);
    meta.addView(source,new LinearLayout.LayoutParams(0,-2,1));
    TextView score=label(story.score+"/100",13,story.score>=85?RED:GOLD,true);meta.addView(score);
    item.addView(meta);spacing(item,8);
    TextView heading=label(story.title,16,WHITE,true);heading.setMaxLines(4);item.addView(heading);spacing(item,8);
    TextView summary=label(story.summary,12,DIM,false);summary.setMaxLines(3);item.addView(summary);spacing(item,11);
    LinearLayout footer=new LinearLayout(this);footer.setOrientation(LinearLayout.HORIZONTAL);
    footer.setGravity(Gravity.CENTER_VERTICAL);
    TextView categoryText=label(mappedCategory(story.category).toUpperCase(Locale.ROOT),10,GOLD,true);
    footer.addView(categoryText,new LinearLayout.LayoutParams(0,-2,1));
    TextView bookmark=label(saved.contains(story.id)?"★ SAVED":"☆ SAVE",11,saved.contains(story.id)?GOLD:DIM,true);
    pad(bookmark,7,7);footer.addView(bookmark);item.addView(footer);
    item.setOnClickListener(v->{if(story.url.startsWith("https://"))openUrl(story.url);});
    bookmark.setOnClickListener(v->{if(saved.contains(story.id))saved.remove(story.id);else saved.add(story.id);saveBookmarks();render();});
    LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.setMargins(0,0,0,dp(11));results.addView(item,lp);
  }
  @Override protected void onDestroy(){executor.shutdownNow();super.onDestroy();}
}
