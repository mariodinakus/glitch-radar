import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyNews} from '../lib/news-category.ts';
import {buildStories} from '../lib/stories.ts';

const NOW=Date.parse('2026-10-23T12:00:00Z');
const row=(id,title,source='BBC',category='world')=>({
 id, title, source, category, summary:'',
 timestamp:new Date(NOW-30*60000).toISOString(),
 url:'https://example.com/'+id,score:65,level:'elevated',
 confidence:'publisher',details:[],metricLabel:'NEWS',metricValue:'LATEST',
 reason:'Test fixture'
});
test('health coverage does not leak into the economy section',()=>{
 assert.equal(classifyNews('economy','First personalised cancer vaccine cuts risk of disease returning'),'health');
 assert.equal(classifyNews('economy','Melanoma vaccine brings new hope for patients'),'health');
 assert.equal(classifyNews('economy','Share prices rise after biotech company reports vaccine sales'),'economy');
});
test('protests and extreme weather are not economy just because of RSS section',()=>{
 assert.equal(classifyNews('economy','Major protests sweep across France'),'world');
 assert.equal(classifyNews('economy','Severe flooding in eastern Spain'),'climate');
 assert.equal(classifyNews('economy','Central bank cuts interest rates'),'economy');
});
test('technology classifications use meaningful headline topics',()=>{
 assert.equal(classifyNews('world','OpenAI announces new AI agents'),'ai');
 assert.equal(classifyNews('tech','Nvidia shares fall after earnings report'),'economy');
});
test('different named AI companies must not merge into one storyline',()=>{
 const stories=buildStories([
  row('one','OpenAI announces major AI research partnership in Poland','BBC'),
  row('two','Anthropic announces major AI research partnership in Poland','Reuters')
 ],NOW);
 assert.equal(stories.length,2);
});
test('reports about the same specific incident still cluster',()=>{
 const stories=buildStories([
  row('one','OpenAI announces major AI research partnership in Poland','BBC'),
  row('two','OpenAI announces major AI research partnership in Poland','Reuters')
 ],NOW);
 assert.equal(stories.length,1);
 assert.equal(stories[0].sources.length,2);
});
test('same-country updates on unrelated events stay separate',()=>{
 const stories=buildStories([
  row('one','France government announces major climate report','BBC'),
  row('two','France government announces major housing report','Reuters')
 ],NOW);
 assert.equal(stories.length,2);
});
