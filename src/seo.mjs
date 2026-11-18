export function metadata(base, page, program) {
  const brand = 'Т-Университет', home = page === 'index.html';
  const url = base && new URL(home ? './' : page, base).href;
  const image = base ? new URL('img/social-card.png', base).href : 'img/social-card.png';
  const title = home ? brand : `${program.title} — ${brand}`;
  const description = home ? 'Т-Университет ДГТУ: направления бакалавриата и магистратуры, мероприятия для абитуриентов и контакты в Ростове-на-Дону.' : `${program.title}: программа Т-Университета ДГТУ. Уровень образования, срок обучения, будущая карьера и партнёры программы.`;
  const esc = s => s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  const schema = home ? {'@type':'WebSite', name:brand, alternateName:['Туниверситет','Тунивер ДГТУ'], publisher:{'@type':'EducationalOrganization',name:'Т-Университет ДГТУ',parentOrganization:{'@type':'CollegeOrUniversity',name:'Донской государственный технический университет',alternateName:'ДГТУ'}}} : {'@type':'WebPage',name:title,description};
  return [url && `<link rel="canonical" href="${esc(url)}">`, '<link rel="icon" href="img/star-purple.svg" type="image/svg+xml">', ...Object.entries({description,'og:type':'website','og:locale':'ru_RU','og:site_name':brand,'og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:width':'1200','og:image:height':'630','og:image:type':'image/png','og:image:alt':'Т-Университет ДГТУ — направления и мероприятия','twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':'Т-Университет ДГТУ — направления и мероприятия'}).filter(([,v])=>v).map(([k,v])=>`<meta ${k.startsWith('og:')?'property':'name'}="${k}" content="${esc(v)}">`), `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org',...schema,inLanguage:'ru',url:url||undefined}).replaceAll('<','\\u003c')}</script>`].filter(Boolean).join('\n\t');
}
