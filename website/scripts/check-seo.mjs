import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SITE} from '../src/data/site.mjs';

const root=path.resolve(process.argv[2]??fileURLToPath(new URL('../dist/',import.meta.url)));
const decode=text=>text.replace(/&(?:amp|quot|apos|lt|gt);|&#(?:x[\da-f]+|\d+);/gi,entity=>{
  const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
  return named[entity]??String.fromCodePoint(parseInt(entity.slice(2,-1).replace(/^x/i,''),/^&#x/i.test(entity)?16:10));
});
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([,key,a,b])=>[key.toLowerCase(),decode(a??b)]));
const tags=(html,name)=>[...html.matchAll(new RegExp(`<${name}\\b[^>]*>`,'gi'))].map(match=>attributes(match[0]));
const text=html=>decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const read=relative=>readFile(path.join(root,relative),'utf8');
const origin=SITE.origin+'/';
const routeFile=url=>decodeURIComponent(url.pathname).replace(/^\//,'')+(url.pathname.endsWith('/')?'index.html':'');
const robots=await read('robots.txt');
assert(robots.includes(`Sitemap: ${origin}sitemap-index.xml`),'robots.txt must advertise the canonical sitemap');
assert(!/^Disallow:\s*\/$/im.test(robots),'robots.txt blocks the entire site');
const index=await read('sitemap-index.xml');
const sitemaps=[...index.matchAll(/<loc>(.*?)<\/loc>/g)].map(([,url])=>new URL(decode(url)));
assert(sitemaps.length>0,'No child sitemap');
const urls=[];
for(const sitemap of sitemaps){
  assert.equal(sitemap.origin,SITE.origin,'Unexpected sitemap origin');
  const xml=await read(sitemap.pathname.slice(1));
  urls.push(...[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([,url])=>decode(url)));
}
assert(urls.length>0,'Empty sitemap');
assert.equal(new Set(urls).size,urls.length,'Duplicate sitemap URLs');
const pages=new Map(),titles=new Set(),descriptions=new Set();
let linkCount=0,imageCount=0;
for(const value of urls){
  const url=new URL(value);
  assert.equal(url.origin,SITE.origin,`Noncanonical origin: ${value}`);
  assert(url.pathname.endsWith('/'),`Missing trailing slash: ${value}`);
  const html=await read(routeFile(url));
  const meta=tags(html,'meta'),links=tags(html,'link');
  const canonical=links.filter(link=>link.rel==='canonical');
  assert.equal(canonical.length,1,`Expected one canonical: ${value}`);
  assert.equal(canonical[0].href,value,`Canonical mismatch: ${value}`);
  assert(!meta.some(tag=>tag.name==='robots'&&/noindex/i.test(tag.content)),`Sitemap includes a noindex page: ${value}`);
  const title=decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'').trim();
  const description=meta.find(tag=>tag.name==='description')?.content?.trim();
  assert(title.length>0&&description,`Missing title or description: ${value}`);
  assert(!titles.has(title),`Duplicate title: ${title}`);titles.add(title);
  assert(!descriptions.has(description),`Duplicate description: ${value}`);descriptions.add(description);
  assert.equal([...html.matchAll(/<h1\b/gi)].length,1,`Expected one H1: ${value}`);
  for(const [property,expected] of [['og:url',value],['og:title',title],['og:description',description]]){
    assert.equal(meta.find(tag=>tag.property===property)?.content,expected,`${property} mismatch: ${value}`);
  }
  const image=meta.find(tag=>tag.property==='og:image')?.content;
  assert(image&&new URL(image).origin===SITE.origin,`Missing canonical social image: ${value}`);
  await access(path.join(root,new URL(image).pathname));
  assert.equal(meta.find(tag=>tag.name==='twitter:card')?.content,'summary_large_image',`Missing social card: ${value}`);
  const schemas=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(([,json])=>JSON.parse(json));
  assert(schemas.length>0,`Missing structured data: ${value}`);
  const graph=schemas.flatMap(schema=>schema['@graph']??[schema]);
  assert(graph.some(node=>node['@type']==='WebPage'&&node.url===value),`Missing page identity: ${value}`);
  const ids=new Set([...html.matchAll(/\bid="([^"]*)"/g)].map(([,id])=>decode(id)));
  for(const img of tags(html,'img')){
    assert(Object.hasOwn(img,'alt'),`Image has no alt text: ${value}`);
    const src=new URL(img.src,url);
    if(src.origin===SITE.origin)await access(path.join(root,src.pathname));
    imageCount++;
  }
  pages.set(value,{html,ids,graph,anchors:tags(html,'a')});
}
for(const [value,page] of pages){
  for(const anchor of page.anchors){
    if(!anchor.href||/^(?:mailto:|tel:|javascript:)/i.test(anchor.href))continue;
    const target=new URL(anchor.href,value);
    if(target.origin!==SITE.origin)continue;
    linkCount++;
    const route=target.origin+target.pathname;
    if(pages.has(route)){
      if(target.hash)assert(pages.get(route).ids.has(decodeURIComponent(target.hash.slice(1))),`Broken fragment ${target.href} from ${value}`);
    }else{
      assert(!target.pathname.endsWith('/'),`Internal page absent from sitemap: ${target.href}`);
      await access(path.join(root,target.pathname));
    }
  }
}
// Answers must exist in the generated HTML, not only in JSON-LD or after a click.
for(const [value,page] of pages){
  const faq=page.graph.filter(node=>node['@type']==='FAQPage');
  const disclosures=[...page.html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/gi)].map(([,html])=>({
    question:text(html.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i)?.[1]??'').replace(/\s*\+$/,'').trim(),
    answer:html.match(/<p\b[^>]*data-faq-answer\b[^>]*>([\s\S]*?)<\/p>/i)?.[1],
    html,
  })).filter(item=>item.answer!==undefined||item.html.includes('faq-comparison'));
  for(const node of faq){
    assert(node.mainEntity?.length>0,`Empty FAQ: ${value}`);
    const questions=new Set();
    for(const entry of node.mainEntity){
      assert(!questions.has(entry.name),`Duplicate FAQ question: ${value}`);questions.add(entry.name);
      const disclosure=disclosures.find(item=>item.question===entry.name);
      assert(disclosure,`FAQ question absent from native disclosure: ${value}: ${entry.name}`);
      if(disclosure.answer!==undefined){
        assert.equal(text(disclosure.answer),text(entry.acceptedAnswer.text),`FAQ answer/schema mismatch: ${value}: ${entry.name}`);
      }else{
        // Rich comparison answers use the same source and several table cells.
        const words=s=>text(s).toLowerCase().match(/[\p{L}\p{N}]+/gu)??[];
        const visible=new Set(words(disclosure.html));
        assert(words(entry.acceptedAnswer.text).every(word=>visible.has(word)),`Rich FAQ answer absent from HTML: ${value}: ${entry.name}`);
      }
    }
    assert.equal(disclosures.length,node.mainEntity.length,`Visible FAQ/schema count mismatch: ${value}`);
  }
}

async function htmlFiles(directory=''){
  const files=[];
  for(const entry of await readdir(path.join(root,directory),{withFileTypes:true})){
    const relative=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await htmlFiles(relative));
    else if(entry.name.endsWith('.html'))files.push(relative);
  }
  return files;
}
for(const file of await htmlFiles()){
  const html=await read(file);
  const noindex=tags(html,'meta').some(tag=>tag.name==='robots'&&/noindex/i.test(tag.content));
  if(!noindex){
    const canonical=tags(html,'link').find(link=>link.rel==='canonical')?.href;
    assert(pages.has(canonical),`Indexable page missing from sitemap: ${file}`);
  }
}
const notFound=await read('404.html');
assert(tags(notFound,'meta').some(tag=>tag.name==='robots'&&/noindex/i.test(tag.content)),'404 must be noindex');
const home=pages.get(origin);
assert(home,'Homepage absent from sitemap');
const website=home.graph.find(node=>node['@type']==='WebSite');
assert.equal(website?.name,SITE.name,'Site name mismatch');
assert.equal(website?.alternateName,SITE.alternateName,'Spaced brand alias missing');
assert(text(home.html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??'').includes(SITE.alternateName),'Brand alias must also appear in main page content');
assert(text(home.html).includes('video'),'Homepage must explain the product');
console.log(`SEO checks passed: ${pages.size} indexable pages, ${linkCount} internal links, ${imageCount} images, canonical metadata, JSON-LD and sitemap coverage.`);
