/* ------------------------------------------------------------------ vacinas e Calendário Nacional de Vacinação 2026
   Fontes: Ministério da Saúde, Instrução Normativa do Calendário Nacional de Vacinação 2026 e
   Calendário Técnico Nacional de Vacinação da Criança (gov.br); quadro por idade SESA-ES, junho/2026.
   Conteúdo de consulta. Conferir sempre a instrução normativa vigente e as notas técnicas do município. */
const CAL_SRC={label:'Calendário Nacional de Vacinação 2026, Ministério da Saúde',updated:'junho de 2026',
  url:'https://www.gov.br/saude/pt-br/vacinacao/publicacoes/instrucao-normativa-que-instrui-o-calendario-nacional-de-vacinacao-2026.pdf',
  url2:'https://www.gov.br/saude/pt-br/composicao/svsa/pni/calendario-tecnico/calendario-tecnico-nacional-de-vacinacao-crianca'};
/* g = grupo para conferência de doses; c = cor pastel (1..6); via e volume conforme o calendário técnico da criança */
const VAC={
 bcg:{n:'BCG',full:'BCG',g:'bcg',c:5,via:'Intradérmica',vol:'0,05 mL (menores de 1 ano); 0,1 mL (a partir de 1 ano)',dz:'Formas graves de tuberculose (miliar e meníngea)'},
 hepb:{n:'Hepatite B',full:'Hepatite B (recombinante)',g:'hepb',c:3,via:'Intramuscular',vol:'0,5 mL',dz:'Hepatite B'},
 penta:{n:'Penta',full:'Penta (DTP + Hib + Hepatite B)',g:'penta',c:2,via:'Intramuscular',vol:'0,5 mL',dz:'Difteria, tétano, coqueluche, hepatite B e infecções por Haemophilus influenzae b'},
 vip:{n:'VIP',full:'Poliomielite inativada (VIP)',g:'vip',c:4,via:'Intramuscular',vol:'0,5 mL',dz:'Poliomielite'},
 rota:{n:'Rotavírus',full:'Rotavírus humano (VRH)',g:'rota',c:1,via:'Oral',vol:'1,5 mL (todo o conteúdo da bisnaga)',dz:'Diarreia por rotavírus'},
 pcv20:{n:'Pneumo 20',full:'Pneumocócica 20-valente (VPC20)',g:'pneumo',c:6,via:'Intramuscular',vol:null,dz:'Doença pneumocócica invasiva e otite média aguda'},
 pcv10:{n:'Pneumo 10',full:'Pneumocócica 10-valente (VPC10)',g:'pneumo',c:6,via:'Intramuscular',vol:'0,5 mL',dz:'Doença pneumocócica invasiva e otite média aguda'},
 menc:{n:'Meningo C',full:'Meningocócica C (conjugada)',g:'menc',c:3,via:'Intramuscular',vol:'0,5 mL',dz:'Doença meningocócica pelo sorogrupo C'},
 acwy:{n:'Meningo ACWY',full:'Meningocócica ACWY (conjugada)',g:'acwy',c:3,via:'Intramuscular',vol:'0,5 mL',dz:'Doença meningocócica pelos sorogrupos A, C, W e Y'},
 flu:{n:'Influenza',full:'Influenza trivalente (inativada)',g:'flu',c:4,via:'Intramuscular',vol:'0,25 mL (6 meses a 2 anos); 0,5 mL (a partir de 3 anos)',dz:'Influenza (gripe)'},
 covid:{n:'COVID-19',full:'COVID-19 (RNA mensageiro)',g:'covid',c:2,via:'Intramuscular',vol:'Conforme o produto (Comirnaty pediátrica 0,2 mL; Spikevax 0,25 mL)',dz:'COVID-19'},
 fa:{n:'Febre amarela',full:'Febre amarela (atenuada)',g:'fa',c:1,via:'Subcutânea',vol:'0,5 mL',dz:'Febre amarela'},
 scr:{n:'Tríplice viral',full:'Tríplice viral (SCR)',g:'scr',c:6,via:'Subcutânea',vol:'0,5 mL',dz:'Sarampo, caxumba e rubéola'},
 scrv:{n:'Tetraviral',full:'Tetraviral (SCRV)',g:'scrv',c:6,via:'Subcutânea',vol:null,dz:'Sarampo, caxumba, rubéola e varicela'},
 hepa:{n:'Hepatite A',full:'Hepatite A (inativada)',g:'hepa',c:5,via:'Intramuscular',vol:'0,5 mL',dz:'Hepatite A'},
 dtp:{n:'DTP',full:'DTP (tríplice bacteriana infantil)',g:'dtp',c:2,via:'Intramuscular',vol:'0,5 mL',dz:'Difteria, tétano e coqueluche'},
 var:{n:'Varicela',full:'Varicela (atenuada)',g:'var',c:4,via:'Subcutânea',vol:'0,5 mL',dz:'Varicela (catapora)'},
 hpv:{n:'HPV',full:'HPV quadrivalente (HPV4)',g:'hpv',c:6,via:'Intramuscular',vol:'0,5 mL',dz:'Infecções pelo HPV tipos 6, 11, 16 e 18'},
 dt:{n:'dT',full:'Dupla adulto (dT)',g:'dt',c:5,via:'Intramuscular',vol:'0,5 mL',dz:'Difteria e tétano'},
 dtpa:{n:'dTpa',full:'dTpa (tríplice bacteriana acelular do tipo adulto)',g:'dtpa',c:2,via:'Intramuscular',vol:null,dz:'Difteria, tétano e coqueluche'},
 vsr:{n:'VSR',full:'Vírus sincicial respiratório (VSR)',g:'vsr',c:3,via:'Intramuscular',vol:null,dz:'Doença pelo vírus sincicial respiratório no bebê'}};
const DOSES=['Dose ao nascer','1ª dose','2ª dose','3ª dose','Dose única','Reforço','1º reforço','2º reforço','Dose anual','Dose por gestação','Dose adicional'];
const SITES={
 Intramuscular:['Deltoide direito','Deltoide esquerdo','Vasto lateral da coxa direita','Vasto lateral da coxa esquerda','Ventroglútea direita','Ventroglútea esquerda'],
 'Subcutânea':['Braço direito (região posterior)','Braço esquerdo (região posterior)','Coxa direita (face anterolateral)','Coxa esquerda (face anterolateral)'],
 'Intradérmica':['Inserção inferior do deltoide direito','Inserção inferior do deltoide esquerdo'],
 Oral:['Via oral']};
const VIAS=Object.keys(SITES);
/* Calendário da criança: m = idade recomendada em meses; core = entra na conferência automática da caderneta */
const CAL_CHILD=[
 {age:'Ao nascer',m:0,items:[['bcg','Dose única',1],['hepb','Dose ao nascer',1]]},
 {age:'2 meses',m:2,items:[['penta','1ª dose',1],['vip','1ª dose',1],['rota','1ª dose',1],['pcv20','1ª dose',1]]},
 {age:'3 meses',m:3,items:[['menc','1ª dose',1]]},
 {age:'4 meses',m:4,items:[['penta','2ª dose',1],['vip','2ª dose',1],['rota','2ª dose',1],['pcv10','2ª dose',1,'Pneumo 10 enquanto houver estoque (transição para a Pneumo 20)']]},
 {age:'5 meses',m:5,items:[['menc','2ª dose',1]]},
 {age:'6 meses',m:6,items:[['penta','3ª dose',1],['vip','3ª dose',1],['flu','1ª dose',0,'Sazonal'],['covid','1ª dose',0,'Se disponível a vacina Pfizer (Comirnaty)']]},
 {age:'7 meses',m:7,items:[['covid','2ª dose',0,'Se disponível a vacina Pfizer (Comirnaty)'],['flu','2ª dose',0,'Só para quem nunca recebeu influenza']]},
 {age:'9 meses',m:9,items:[['fa','1ª dose',1],['covid','3ª dose',0,'Se disponível a vacina Pfizer (Comirnaty)']]},
 {age:'12 meses',m:12,items:[['scr','1ª dose',1],['pcv20','Reforço',1,'Reforço ou dose única'],['acwy','Reforço',1,'Reforço ou dose única']]},
 {age:'15 meses',m:15,items:[['vip','Reforço',1],['hepa','Dose única',1],['dtp','1º reforço',1],['scrv','Dose única',1]]},
 {age:'4 anos',m:48,items:[['dtp','2º reforço',1],['var','2ª dose',1],['fa','Reforço',1]]},
 {age:'9 a 14 anos',m:108,items:[['hpv','Dose única',0,'Até 14 anos, 11 meses e 29 dias']]}];
const CAL_GROUPS=[
 {id:'crianca',t:'Criança',sub:'0 a 9 anos',c:1,child:true},
 {id:'adolescente',t:'Adolescente',sub:'10 a 19 anos',c:2,rows:[
   ['hpv','Dose única','9 a 14 anos'],['acwy','Dose única','11 a 14 anos'],['hepb','3 doses','11 a 19 anos, conforme situação vacinal'],
   ['dt','3 doses ou reforço','11 a 19 anos, conforme situação vacinal'],['scr','2 doses','11 a 19 anos, conforme situação vacinal'],['fa','Dose única','11 a 19 anos, conforme situação vacinal']]},
 {id:'adulto',t:'Adulto',sub:'20 a 59 anos',c:3,rows:[
   ['hepb','3 doses','Conforme situação vacinal'],['dt','3 doses ou reforço','Conforme situação vacinal; reforço a cada 10 anos'],['fa','Dose única','Conforme situação vacinal'],
   ['scr','2 doses até 29 anos; 1 dose de 30 a 59 anos','Conforme situação vacinal']]},
 {id:'gestante',t:'Gestante',sub:'Em qualquer idade',c:6,rows:[
   ['hepb','3 doses','Conforme situação vacinal'],['dtpa','Dose ou reforço','dT e/ou dTpa; dTpa a partir da 20ª semana'],['flu','1 dose por gestação',''],
   ['covid','1 dose por gestação',''],['vsr','1 dose por gestação','A partir da 28ª semana']]},
 {id:'idoso',t:'Idoso',sub:'60 anos ou mais',c:4,rows:[
   ['hepb','3 doses','Conforme situação vacinal'],['dt','Doses ou reforço','Conforme situação vacinal'],['flu','1 dose anual',''],['covid','1 dose e reforço a cada 6 meses','']]},
 {id:'saude',t:'Trabalhador da saúde',sub:'Profissionais e estudantes',c:5,rows:[
   ['hepb','3 doses','Conforme situação vacinal'],['dtpa','Doses ou reforço','dT e/ou dTpa'],['scr','2 doses','Conforme situação vacinal'],['fa','Dose única','Conforme situação vacinal'],
   ['var','2 doses',''],['covid','1 dose e reforço a cada 12 meses','Estratégia de campanha']]}];
const CAL_NOTES=[
 'COVID-19 na criança: 3 doses (6, 7 e 9 meses) quando disponível a Pfizer (Comirnaty). Com Spikevax, 2 doses (6 e 7 meses).',
 'Influenza: na primeira vacinação da vida, 2 doses com 30 dias de intervalo; quem já recebeu ao menos uma dose em anos anteriores toma 1 dose por ano.',
 'Pneumocócica: desde junho de 2026 a Pneumo 20 substitui gradualmente a Pneumo 10. Durante a transição: Pneumo 20 aos 2 meses, Pneumo 10 aos 4 meses e reforço com Pneumo 20 aos 12 meses.',
 'Rotavírus: 1ª dose de 1 mês e 15 dias até 11 meses e 29 dias; 2ª dose de 3 meses e 15 dias até 1 ano, 11 meses e 29 dias. Fora da janela, a dose não é aplicada.',
 'Adolescentes, adultos, gestantes, idosos e trabalhadores da saúde: doses “conforme situação vacinal” dependem do histórico registrado na caderneta.'];
const ageMonths=(birth,ref)=>{const b=parseKey(birth),r=parseKey(ref||today());let m=(r.getFullYear()-b.getFullYear())*12+(r.getMonth()-b.getMonth());if(r.getDate()<b.getDate())m--;return m};
const ageLabel=birth=>{if(!birth)return'Idade não informada';const m=ageMonths(birth);if(m<1){const d=Math.round((parseKey(today())-parseKey(birth))/864e5);return d+(d===1?' dia':' dias')}if(m<24)return m+(m===1?' mês':' meses');return Math.floor(m/12)+' anos'};
const addMonthsKey=(k,m)=>{const d=parseKey(k);d.setMonth(d.getMonth()+m);return key(d)};
/* Conferência da caderneta da criança: compara registros (desta instituição e transcritos) com o calendário. */
function childStatus(S,pt){
  if(!pt.birth)return null;const am=ageMonths(pt.birth);if(am>=120)return null;
  const recs=S.imm.filter(i=>i.patient===pt.id&&i.status==='registrado');
  return CAL_CHILD.map(row=>({...row,items:row.items.map(([v,dose,core,note])=>{
    const r=recs.find(i=>VAC[i.vac]&&VAC[i.vac].g===VAC[v].g&&i.dose===dose);
    const due=addMonthsKey(pt.birth,row.m);let st=r?'aplicada':!core?'condicional':am>=row.m+1?'atrasada':am>=row.m?'agora':'prevista';
    if(!r&&v==='rota'&&((dose==='1ª dose'&&am>=12)||(dose==='2ª dose'&&am>=24)))st='janela';
    return {v,dose,core,note,rec:r,due,st}})}));
}
const CST={aplicada:['Aplicada','teal'],agora:['Indicada agora','sky'],atrasada:['Verificar atraso','danger'],prevista:['Prevista','neutral'],condicional:['Conforme indicação','neutral'],janela:['Fora da janela','amber']};
