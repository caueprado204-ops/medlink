/* ------------------------------------------------------------------ utilidades */
const pad=n=>String(n).padStart(2,'0');
const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseKey=k=>{const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(k,n)=>{const d=parseKey(k);d.setDate(d.getDate()+n);return key(d)};
const wdOf=k=>parseKey(k).getDay();
const weekStart=k=>addDays(k,wdOf(k)===0?-6:1-wdOf(k));
const at=(k,t)=>{const[h,m]=t.split(':').map(Number);const d=parseKey(k);d.setHours(h,m,0,0);return d.toISOString()};
const hm=iso=>{const d=new Date(iso);return pad(d.getHours())+':'+pad(d.getMinutes())};
const dkey=iso=>key(new Date(iso));
const F=(v,o)=>new Intl.DateTimeFormat('pt-BR',o).format(typeof v==='string'&&v.length===10?parseKey(v):new Date(v));
const D2=v=>F(v,{day:'2-digit',month:'2-digit'});
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const hours=(s,e,b)=>(new Date(e)-new Date(s))/36e5-(b||0)/60;
const fmtH=h=>(Math.round(h*10)/10).toLocaleString('pt-BR')+'h';
const BRL=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const BRL0=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const uid=()=>Math.random().toString(36).slice(2,10);
const today=()=>key(new Date());
const nowIso=()=>new Date().toISOString();
const cx=(...a)=>a.filter(Boolean).join(' ');
const daysTo=k=>Math.round((parseKey(k)-parseKey(today()))/864e5);

/* ------------------------------------------------------------------ vocabulário */
const CAT={medico:'Médico(a)',enfermeiro:'Enfermeiro(a)',tecnico_enfermagem:'Técnico(a) de enfermagem',auxiliar_enfermagem:'Auxiliar de enfermagem',farmaceutico:'Farmacêutico(a)'};
const COUNCIL={medico:'CRM',enfermeiro:'COREN',tecnico_enfermagem:'COREN',auxiliar_enfermagem:'COREN',farmaceutico:'CRF'};
const SST={rascunho:['Rascunho','neutral'],publicado:['Publicado','sky'],aguardando_confirmacao:['Aguardando confirmação','amber'],confirmado:['Confirmado','teal'],descoberto:['Descoberto','danger'],substituicao_solicitada:['Substituição solicitada','amber'],cancelado:['Cancelado','neutral']};
const AST={aguardando_confirmacao:['Aguardando confirmação','amber'],confirmado:['Confirmado','teal'],substituicao_solicitada:['Pediu substituição','amber'],recusado:['Recusou','neutral'],removido:['Removido','neutral']};
const VST={pendente:['Validação pendente','amber'],em_analise:['Em análise','sky'],validado:['Validado','teal'],rejeitado:['Rejeitado','danger']};
const RK={substituicao:'Substituição',cancelamento:'Cancelamento',alteracao:'Alteração',candidatura:'Candidatura'};
const RST={pendente:['Pendente','amber'],aprovada:['Aprovada','teal'],recusada:['Recusada','danger'],cancelada:['Retirada','neutral']};
const ABS={indisponivel:'Indisponível',ferias:'Férias',afastamento:'Afastamento',licenca:'Licença'};
const WD=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const WDS=['dom','seg','ter','qua','qui','sex','sáb'];
const ROLE={admin:'Administradora institucional',gestor:'Gestor operacional',rt:'Responsável técnica',prof:'Profissional de saúde'};
const PERMS={
 'institution.manage':['Editar dados e regras da instituição','Instituição'],
 'members.manage':['Gerenciar equipe e permissões','Instituição'],
 'professionals.view':['Ver profissionais','Pessoas'],
 'professionals.manage':['Cadastrar e editar profissionais','Pessoas'],
 'documents.verify':['Validar cadastros profissionais','Pessoas'],
 'talent.manage':['Usar o banco de talentos','Pessoas'],
 'shifts.view':['Ver escalas','Escalas'],
 'shifts.manage':['Criar, editar e gerar escalas','Escalas'],
 'shifts.publish':['Publicar escalas','Escalas'],
 'requests.decide':['Aprovar solicitações','Escalas'],
 'vaccines.view':['Ver vacinação','Operação'],
 'vaccines.manage':['Registrar e cancelar aplicações','Operação'],
 'stock.view':['Ver estoque','Operação'],
 'stock.manage':['Movimentar estoque','Operação'],
 'coldchain.view':['Ver temperatura','Operação'],
 'coldchain.manage':['Registrar leituras e tratar ocorrências','Operação'],
 'homecare.view':['Ver home care','Operação'],
 'homecare.manage':['Agendar atendimentos domiciliares','Operação'],
 'finance.view':['Ver financeiro','Financeiro'],
 'finance.manage':['Lançar e baixar contas','Financeiro'],
 'reports.view':['Ver relatórios','Financeiro'],
 'audit.view':['Ver auditoria','Sistema']};
const ACT={create:'Criou plantão',update:'Editou plantão',move:'Moveu plantão',duplicate:'Duplicou plantão',publish:'Publicou',cancel:'Cancelou plantão',assign:'Escalou profissional',unassign:'Removeu profissional',confirm:'Confirmou presença',decline:'Recusou plantão',request:'Abriu solicitação',apply:'Candidatou-se',approve:'Aprovou solicitação',reject:'Recusou solicitação',withdraw:'Retirou solicitação',prof_create:'Cadastrou profissional',prof_update:'Editou profissional',validate:'Alterou validação',availability:'Alterou disponibilidade',absence:'Registrou ausência',absence_rm:'Removeu ausência',rules:'Alterou regras de escala',perms:'Alterou permissões',institution:'Criou a instituição',generate:'Aplicou escala gerada',stock_move:'Movimentou estoque',immunize:'Registrou aplicação',immunize_cancel:'Cancelou aplicação',reading:'Registrou temperatura',occurrence:'Tratou ocorrência de temperatura',visit:'Agendou atendimento domiciliar',visit_status:'Atualizou atendimento domiciliar',pay:'Baixou conta',bill:'Lançou conta',talent:'Movimentou banco de talentos'};
const ENT={shift:'Plantão',asg:'Escala do profissional',req:'Solicitação',prof:'Profissional',inst:'Instituição',stock:'Estoque',vaccine:'Vacinação',cold:'Temperatura',home:'Home care',finance:'Financeiro',talent:'Banco de talentos'};
const ACTIVE=s=>s==='aguardando_confirmacao'||s==='confirmado'||s==='substituicao_solicitada';
const ALL_PERMS=Object.keys(PERMS);

/* ------------------------------------------------------------------ dados de demonstração */
function seed(){
  const T=today(), W0=weekStart(T);
  const S={v:2,inst:{name:'Clínica Vida Vacinas',type:'Clínica de vacinação e home care',city:'Campinas/SP'},
    rules:{rest:11,week:44,maxShift:24},
    rates:{tecnico_enfermagem:28,enfermeiro:46,medico:150,auxiliar_enfermagem:24,farmaceutico:52},
    rolePerms:{
      admin:ALL_PERMS.slice(),
      gestor:['professionals.view','professionals.manage','talent.manage','shifts.view','shifts.manage','shifts.publish','requests.decide','stock.view','stock.manage','homecare.view','homecare.manage','vaccines.view','coldchain.view','reports.view','audit.view'],
      rt:['professionals.view','documents.verify','shifts.view','vaccines.view','vaccines.manage','stock.view','coldchain.view','coldchain.manage','homecare.view','reports.view','audit.view'],prof:[]},
    units:[{id:'u1',name:'Matriz Centro',addr:'Rua Barão de Jaguara, 1200, Centro'},{id:'u2',name:'Unidade Taquaral',addr:'Av. Heitor Penteado, 450, Taquaral'}],
    services:[{id:'s1',unit:'u1',name:'Sala de vacinação'},{id:'s2',unit:'u1',name:'Atendimento de enfermagem'},{id:'s3',unit:'u2',name:'Sala de vacinação'},{id:'s4',unit:'u2',name:'Coleta domiciliar'}],
    users:[
      {id:'ana',name:'Ana Ribeiro',role:'admin',email:'ana.ribeiro@vidavacinas.demo'},
      {id:'marcos',name:'Marcos Lima',role:'gestor',units:['u2'],email:'marcos.lima@vidavacinas.demo'},
      {id:'helena',name:'Helena Prado',role:'rt',email:'helena.prado@vidavacinas.demo'},
      {id:'carla',name:'Carla Mendes',role:'prof',prof:'p1',email:'carla.mendes@email.demo'},
      {id:'paulo',name:'Paulo Santos',role:'prof',prof:'p5',email:'paulo.santos@email.demo'}],
    profs:[],shifts:[],asg:[],reqs:[],abs:[],notifs:[],audit:[],
    items:[],lots:[],moves:[],imm:[],equip:[],readings:[],occ:[],patients:[],visits:[],pay:[],rec:[],cands:[],opps:[]};
  let ph=0;
  const P=(id,name,cat,num,comps,extra={})=>{ph++;S.profs.push({id,name,cat,council:COUNCIL[cat],num,uf:'SP',comps,validation:'validado',active:true,email:'',phone:`(19) 9${8100+ph*37}-${pad(10+ph*7)}${pad(ph*3)}`,units:[],avail:[1,2,3,4,5,6].map(wd=>({wd,s:'07:00',e:'19:00'})),maxWeek:null,...extra})};
  P('p1','Carla Mendes','tecnico_enfermagem','482.117',['Sala de vacinação','Coleta'],{email:'carla.mendes@email.demo'});
  P('p2','Fernanda Ribeiro','tecnico_enfermagem','503.882',['Sala de vacinação']);
  P('p3','Mariana Costa','tecnico_enfermagem','517.240',['Sala de vacinação','Coleta']);
  P('p4','Lucas Andrade','tecnico_enfermagem','498.031',['Sala de vacinação']);
  P('p5','Paulo Santos','enfermeiro','301.554',['Sala de vacinação','Curativos','Supervisão de sala'],{email:'paulo.santos@email.demo'});
  P('p6','Ana Beatriz Lima','enfermeiro','288.910',['Curativos','Supervisão de sala']);
  P('p7','João Pedro Alves','enfermeiro','312.006',['Sala de vacinação','Supervisão de sala'],{units:['u1']});
  P('p8','Bruno Tavares','tecnico_enfermagem','529.774',['Coleta'],{validation:'pendente'});
  P('p9','Rafael Nogueira','medico','184.322',['Clínica geral','Pediatria'],{avail:[{wd:2,s:'08:00',e:'12:00'},{wd:4,s:'08:00',e:'12:00'}]});
  S.abs.push({id:'ab1',prof:'p4',kind:'ferias',from:addDays(W0,7),to:addDays(W0,20),note:'Férias programadas'});
  S.abs.push({id:'ab2',prof:'p3',kind:'indisponivel',from:addDays(W0,12),to:addDays(W0,12),note:'Prova da especialização'});

  const tech=['p1','p2','p3','p4'],nurse=['p5','p6','p7'];
  const mk=o=>{const s={id:'sh'+uid(),brk:15,comps:[],notes:'',status:'publicado',cancelReason:null,...o};S.shifts.push(s);return s};
  const as=(s,p,st)=>S.asg.push({id:'a'+uid(),shift:s.id,prof:p,status:st,reason:null,warnings:[],ended:null});
  const now=Date.now();
  for(let d=0;d<14;d++){
    const k=addDays(W0,d);if(wdOf(k)===0)continue;
    const next=d>=7,past=t=>new Date(at(k,t)).getTime()<now;
    const a=mk({unit:'u1',service:'s1',start:at(k,'07:00'),end:at(k,'13:00'),cat:'tecnico_enfermagem',slots:1,comps:['Sala de vacinação']});
    const ta=tech[d%4];
    if(!(next&&ta==='p4')&&d!==3)as(a,ta,past('13:00')?'confirmado':(ta==='p1'||next?'aguardando_confirmacao':'confirmado'));
    const b=mk({unit:'u1',service:'s2',start:at(k,'13:00'),end:at(k,'19:00'),cat:'enfermeiro',slots:1,status:next&&d>=9?'rascunho':'publicado'});
    as(b,nurse[d%3],past('19:00')?'confirmado':(nurse[d%3]==='p5'&&!next?'aguardando_confirmacao':'confirmado'));
    if(wdOf(k)!==6){
      const c=mk({unit:'u2',service:'s3',start:at(k,'08:00'),end:at(k,'14:00'),cat:'tecnico_enfermagem',slots:2,comps:['Sala de vacinação'],status:next?'rascunho':'publicado'});
      const t1=tech[(d+1)%4];if(!(next&&t1==='p4'))as(c,t1,'confirmado');
      if(d%3!==0&&!next){const t2=tech[(d+2)%4];as(c,t2,'confirmado');}
    }
  }
  S.shifts.forEach(s=>recompute(S,s.id));
  const fut=S.asg.filter(a=>a.prof==='p2'&&ACTIVE(a.status)).map(a=>({a,s:shiftOf(S,a.shift)})).filter(x=>x.s.status!=='rascunho'&&new Date(x.s.start)>new Date(Date.now()+864e5)).sort((x,y)=>x.s.start.localeCompare(y.s.start))[0];
  if(fut){S.reqs.push({id:'r'+uid(),shift:fut.s.id,asg:fut.a.id,prof:'p2',kind:'substituicao',reason:'Consulta médica marcada no mesmo horário.',status:'pendente',prev:fut.a.status,created:new Date(Date.now()-3*36e5).toISOString()});fut.a.status='substituicao_solicitada';recompute(S,fut.s.id);
    note(S,null,'requests.decide','Solicitação de substituição',`Fernanda Ribeiro, plantão de ${D2(fut.s.start)} ${hm(fut.s.start)}`,{page:'solicitacoes'});}
  const open=S.shifts.filter(s=>s.status==='descoberto'&&s.cat==='tecnico_enfermagem'&&new Date(s.start)>new Date()).sort((x,y)=>x.start.localeCompare(y.start));
  for(const s of open){const cand=['p3','p1','p2'].find(p=>!checks(S,s,p).blocking.length);if(cand){S.reqs.push({id:'r'+uid(),shift:s.id,asg:null,prof:cand,kind:'candidatura',reason:'Posso cobrir, moro perto da unidade.',status:'pendente',prev:null,created:new Date(Date.now()-50*6e4).toISOString()});break;}}
  const cp=S.asg.find(a=>a.prof==='p1'&&a.status==='aguardando_confirmacao');
  if(cp){const s=shiftOf(S,cp.shift);push(S,'carla','Novo plantão na sua escala',`${F(s.start,{weekday:'short',day:'2-digit',month:'2-digit'})} às ${hm(s.start)}. Confirme sua presença.`,{page:'meu'});}
  push(S,'helena','Cadastro aguardando validação','Bruno Tavares enviou o cadastro profissional.',{page:'prof',id:'p8'});

  /* estoque e vacinas */
  const IT=(id,name,cat,unit,min,lotc)=>S.items.push({id,name,cat,unit,min,lotc,maker:cat==='Vacina'?'Fabricante (demo)':null});
  IT('v1','Vacina influenza','Vacina','dose',40,true);IT('v2','Vacina hepatite B','Vacina','dose',20,true);IT('v3','Vacina febre amarela','Vacina','dose',15,true);
  IT('v4','Vacina tríplice viral','Vacina','dose',15,true);IT('v5','Vacina HPV','Vacina','dose',10,true);IT('v6','Vacina meningocócica ACWY','Vacina','dose',10,true);
  IT('i1','Seringa 3 mL','Insumo','unidade',300,false);IT('i2','Agulha 25 x 0,6 mm','Insumo','unidade',300,false);IT('i3','Algodão hidrófilo 500 g','Insumo','pacote',6,false);
  IT('i4','Luva de procedimento M','EPI','caixa',10,false);IT('i5','Álcool 70% 1 L','Insumo','frasco',8,false);IT('i6','Bobina de gelo reciclável','Insumo','unidade',24,false);
  const L=(item,lot,exp,qty,unit)=>S.lots.push({id:'l'+uid(),item,lot,exp,qty,unit,status:'disponivel'});
  L('v1','FLU24-118',addDays(T,140),96,'u1');L('v1','FLU24-131',addDays(T,170),60,'u2');L('v2','HB-7720',addDays(T,24),18,'u1');L('v2','HB-7801',addDays(T,300),40,'u2');
  L('v3','FA-3391',addDays(T,90),12,'u1');L('v4','TV-5512',addDays(T,-3),6,'u1');L('v4','TV-5620',addDays(T,210),30,'u2');L('v5','HPV-0907',addDays(T,18),14,'u1');L('v6','MEN-2204',addDays(T,260),22,'u1');
  L('i1','—',addDays(T,700),820,'u1');L('i2','—',addDays(T,700),640,'u1');L('i3','—',addDays(T,400),4,'u1');L('i4','—',addDays(T,500),26,'u1');L('i5','—',addDays(T,300),11,'u1');L('i6','—',addDays(T,900),40,'u1');
  const pts=['Joana Pereira','Rui Albuquerque','Marta Sena','Otávio Lins','Lia Bastos','Caio Ferraz','Nina Rocha','Tomás Prado','Iara Moura','Davi Couto'];
  for(let i=0;i<9;i++){const lot=S.lots.filter(l=>S.items.find(x=>x.id===l.item).cat==='Vacina'&&l.exp>T&&l.unit==='u1')[i%5];
    const day=addDays(T,-(i%4));const tm=at(day,`${pad(8+i%6)}:${pad((i*13)%60)}`);
    S.imm.push({id:'im'+uid(),at:tm,patient:pts[i],item:lot.item,lot:lot.id,dose:['1ª dose','2ª dose','Dose única','Reforço'][i%4],via:['Intramuscular','Subcutânea'][i%2],site:['Deltoide direito','Deltoide esquerdo','Vasto lateral direito'][i%3],prof:['p1','p2','p5'][i%3],unit:'u1',status:'registrado'});
    lot.qty-=1;S.moves.push({id:uid(),at:tm,item:lot.item,lot:lot.id,type:'saida',qty:1,reason:'Aplicação registrada',ref:'Vacinação',user:'Sistema'});}
  S.moves.push({id:uid(),at:new Date(Date.now()-5*864e5).toISOString(),item:'v1',lot:S.lots[0].id,type:'entrada',qty:100,reason:'Nota fiscal 48.211 (demo)',ref:'Compra',user:'Ana Ribeiro'});
  S.moves.push({id:uid(),at:new Date(Date.now()-2*864e5).toISOString(),item:'i3',lot:S.lots.find(l=>l.item==='i3').id,type:'saida',qty:2,reason:'Consumo da sala de vacinação',ref:'Consumo',user:'Marcos Lima'});

  /* temperatura */
  S.equip.push({id:'e1',name:'Câmara refrigerada 1',unit:'u1',min:2,max:8},{id:'e2',name:'Refrigerador sala 2',unit:'u1',min:2,max:8},{id:'e3',name:'Câmara refrigerada Taquaral',unit:'u2',min:2,max:8});
  for(let d=3;d>=0;d--){['08:00','17:00'].forEach((t,j)=>{const iso=at(addDays(T,-d),t);if(new Date(iso)>new Date())return;
    S.equip.forEach((e,k)=>{let temp=+(4+((d*7+k*3+j*5)%30)/10).toFixed(1);const exc=d===1&&k===1&&j===1;if(exc)temp=9.4;
      S.readings.push({id:uid(),eq:e.id,at:iso,temp,user:['Carla Mendes','Paulo Santos','Mariana Costa'][(d+k)%3]});
      if(exc){S.occ.push({id:'oc'+uid(),eq:e.id,at:iso,temp,status:'em_avaliacao',action:'Porta encontrada entreaberta. Fechada, produtos mantidos isolados e identificados.',lots:[S.lots.find(l=>l.item==='v3').id],note:null});}});});}
  S.lots.find(l=>l.item==='v3').status='em_avaliacao';

  /* home care */
  S.patients=[{id:'hp1',name:'Sr. Antônio Reis',region:'Cambuí',addr:'Rua Coronel Quirino, 820'},{id:'hp2',name:'Dona Lúcia Freitas',region:'Taquaral',addr:'Rua Dr. Sampaio Ferraz, 140'},{id:'hp3',name:'Sr. Henrique Mattos',region:'Barão Geraldo',addr:'Av. Albino J. B. de Oliveira, 1030'},{id:'hp4',name:'Dona Célia Prado',region:'Centro',addr:'Rua Regente Feijó, 455'}];
  const V=(p,d,s,e,srv,prof,st)=>S.visits.push({id:'hv'+uid(),patient:p,date:addDays(T,d),start:s,end:e,service:srv,prof,status:st,notes:''});
  V('hp1',0,'09:00','10:00','Curativo','p6','concluido');V('hp2',0,'14:30','15:30','Vacinação domiciliar','p5','agendado');V('hp3',0,'16:30','17:30','Sinais vitais e orientação','p6','agendado');
  V('hp4',1,'08:30','09:30','Curativo','p6','agendado');V('hp1',2,'09:00','10:00','Curativo','p6','agendado');V('hp2',3,'14:30','15:30','Coleta domiciliar','p3','agendado');V('hp3',-1,'10:00','11:00','Sinais vitais e orientação','p5','concluido');

  /* financeiro */
  const PY=(sup,desc,cat,val,d,paid)=>S.pay.push({id:'py'+uid(),supplier:sup,desc,cat,value:val,due:addDays(T,d),paid:paid?addDays(T,paid):null});
  PY('Distribuidora Imuno (demo)','Lote de vacinas influenza','Vacinas e insumos',18640,6,null);PY('Frio Certo Manutenção (demo)','Manutenção preventiva das câmaras','Manutenção',1480,-2,null);
  PY('Imobiliária Centro (demo)','Aluguel da Matriz','Estrutura',9800,4,null);PY('Distribuidora Imuno (demo)','Seringas e agulhas','Vacinas e insumos',2130,-9,-8);
  PY('Energia SP (demo)','Conta de energia','Estrutura',2310,12,null);PY('Folha de plantonistas','Plantões da quinzena','Pessoal',26450,10,null);
  const RC=(payer,srv,val,d,rec)=>S.rec.push({id:'rc'+uid(),payer,service:srv,value:val,issued:addDays(T,d-15),due:addDays(T,d),received:rec?addDays(T,rec):null});
  RC('Empresa Alfa Logística (demo)','Campanha de vacinação in company',14200,8,null);RC('Particulares','Vacinas avulsas da semana',9870,0,0);RC('Convênio Saúde Mais (demo)','Atendimentos de setembro',22350,-5,null);
  RC('Escola Pequeno Saber (demo)','Campanha escolar influenza',6400,15,null);RC('Home care particulares','Pacotes de curativos',4780,-12,-11);

  /* banco de talentos */
  const C=(name,cat,region,avail,comps,st)=>S.cands.push({id:'c'+uid(),name,cat,region,avail,comps,visible:true,status:st,council:COUNCIL[cat]});
  C('Patrícia Gomes','tecnico_enfermagem','Campinas, Centro','Manhãs e sábados',['Sala de vacinação','Coleta'],'disponivel');
  C('Renato Vieira','enfermeiro','Campinas, Barão Geraldo','Noites e fins de semana',['Curativos','Home care'],'convidado');
  C('Sabrina Lopes','tecnico_enfermagem','Valinhos','Tardes',['Sala de vacinação'],'em_analise');
  C('Guilherme Sá','enfermeiro','Campinas, Taquaral','Plantões 12h',['Supervisão de sala','Sala de vacinação'],'disponivel');
  C('Aline Duarte','tecnico_enfermagem','Hortolândia','Manhãs',['Coleta','Curativos'],'disponivel');
  S.opps.push({id:'op1',title:'Técnico(a) de enfermagem para sala de vacinação',unit:'u2',cat:'tecnico_enfermagem',period:'Manhãs, segunda a sexta',slots:2,status:'aberta'});
  S.opps.push({id:'op2',title:'Enfermeiro(a) para home care',unit:'u1',cat:'enfermeiro',period:'Visitas à tarde',slots:1,status:'aberta'});

  S.audit.push({id:uid(),at:new Date(Date.now()-2*864e5).toISOString(),actor:'Ana Ribeiro',action:'institution',entity:'inst',ref:null,reason:null,detail:'Clínica Vida Vacinas'});
  S.audit.push({id:uid(),at:new Date(Date.now()-864e5).toISOString(),actor:'Marcos Lima',action:'publish',entity:'shift',ref:null,reason:null,detail:'Escala da semana publicada'});
  return S;
}

/* ------------------------------------------------------------------ regras */
class Stop{constructor(kind,msg,checks){this.kind=kind;this.msg=msg;this.checks=checks}}
const shiftOf=(S,id)=>S.shifts.find(s=>s.id===id);
const profOf=(S,id)=>S.profs.find(p=>p.id===id);
const unitOf=(S,id)=>S.units.find(u=>u.id===id);
const servOf=(S,id)=>S.services.find(u=>u.id===id);
const itemOf=(S,id)=>S.items.find(x=>x.id===id);
const lotOf=(S,id)=>S.lots.find(x=>x.id===id);
function recompute(S,sid){
  const s=shiftOf(S,sid);if(!s||s.status==='rascunho'||s.status==='cancelado')return s&&s.status;
  const a=S.asg.filter(x=>x.shift===sid);
  const act=a.filter(x=>ACTIVE(x.status)).length,pend=a.filter(x=>x.status==='aguardando_confirmacao').length,sub=a.filter(x=>x.status==='substituicao_solicitada').length;
  s.status=sub?'substituicao_solicitada':act<s.slots?'descoberto':pend?'aguardando_confirmacao':'confirmado';
  return s.status;
}
function checks(S,sh,pid,o={}){
  const B=[],W=[],p=profOf(S,pid);if(!p)return{blocking:['Profissional não encontrado.'],warnings:[]};
  const start=o.start||sh.start,end=o.end||sh.end,s0=+new Date(start),e0=+new Date(end);
  if(sh.status==='cancelado')B.push('Plantão cancelado.');
  if(!p.active)B.push('Profissional inativo.');
  if(p.validation==='rejeitado')B.push('Cadastro rejeitado na validação.');
  if(sh.cat&&sh.cat!==p.cat)B.push(`Este plantão exige ${CAT[sh.cat].toLowerCase()}.`);
  const act=S.asg.filter(a=>a.shift===sh.id&&ACTIVE(a.status));
  if(act.some(a=>a.prof===pid&&a.id!==o.ignore))B.push('Profissional já está neste plantão.');
  if(!o.ignore&&act.length>=sh.slots)B.push('Todas as vagas deste plantão já estão preenchidas.');
  const mine=S.asg.filter(a=>a.prof===pid&&ACTIVE(a.status)&&a.id!==o.ignore).map(a=>shiftOf(S,a.shift)).filter(s=>s&&s.id!==sh.id&&s.status!=='cancelado');
  const rest=S.rules.rest*36e5;
  mine.forEach(s=>{const a=+new Date(s.start),b=+new Date(s.end);
    if(a<e0&&b>s0)B.push(`Sobrepõe outro plantão em ${unitOf(S,s.unit).name} (${D2(s.start)}, ${hm(s.start)}–${hm(s.end)}).`);
    else if(b>s0-rest&&a<e0+rest)W.push(`Descanso menor que ${S.rules.rest}h em relação ao plantão de ${D2(s.start)} às ${hm(s.start)}.`);});
  S.abs.filter(x=>x.prof===pid&&x.from<=dkey(end)&&x.to>=dkey(start)).forEach(x=>{const per=`${D2(x.from)} a ${D2(x.to)}`;
    if(x.kind==='indisponivel')W.push(`Marcou indisponibilidade de ${per}.`);else B.push(`Em ${ABS[x.kind].toLowerCase()} de ${per}.`);});
  const miss=(sh.comps||[]).filter(c=>!p.comps.includes(c));if(miss.length)W.push('Competências não registradas: '+miss.join(', ')+'.');
  if(p.validation==='pendente'||p.validation==='em_analise')W.push('Cadastro profissional ainda não validado.');
  if(p.units.length&&!p.units.includes(sh.unit))W.push('Unidade fora das informadas pelo profissional.');
  if(p.avail.length){const w=new Date(start).getDay(),hs=hm(start),he=hm(end);
    if(!p.avail.some(v=>v.wd===w&&v.s<=hs&&(v.e>v.s?(dkey(end)===dkey(start)&&v.e>=he):true)))W.push('Fora da disponibilidade informada pelo profissional.');}
  const ws=weekStart(dkey(start)),we=addDays(ws,7);
  const wh=mine.filter(s=>dkey(s.start)>=ws&&dkey(s.start)<we).reduce((t,s)=>t+hours(s.start,s.end,s.brk),0)+hours(start,end,sh.brk);
  const lim=p.maxWeek||S.rules.week;if(wh>lim)W.push(`Carga na semana chegaria a ${fmtH(wh)} (referência: ${fmtH(lim)}).`);
  return {blocking:B,warnings:W,weekHours:wh};
}
function enforce(c,reason){
  if(c.blocking.length)throw new Stop('blocking',c.blocking[0],c);
  if(c.warnings.length&&!(reason||'').trim())throw new Stop('warning','Esta alteração gera alertas. Informe uma justificativa para autorizar a exceção.',c);
}
function push(S,userId,title,body,link){S.notifs.unshift({id:uid(),user:userId,title,body,link,read:false,at:nowIso()})}
const permsOf=(S,u)=>S.rolePerms[u.role]||[];
const can=(S,u,perm,unit)=>permsOf(S,u).includes(perm)&&(!unit||!u.units||u.units.includes(unit));
function note(S,actor,perm,title,body,link,unit){S.users.filter(u=>u.id!==(actor&&actor.id)&&can(S,u,perm,unit)).forEach(u=>push(S,u.id,title,body,link))}
function noteProf(S,actor,pid,title,body){const u=S.users.find(x=>x.prof===pid);if(u&&u.id!==(actor&&actor.id))push(S,u.id,title,body,{page:'meu'})}
function log(S,u,action,entity,ref,reason,detail){S.audit.unshift({id:uid(),at:nowIso(),actor:u?u.name:'Sistema',action,entity,ref,reason:reason||null,detail:detail||null})}
const label=s=>`${F(s.start,{weekday:'short',day:'2-digit',month:'2-digit'})}, ${hm(s.start)}–${hm(s.end)}`;
function need(S,u,perm,unit){if(!can(S,u,perm,unit))throw new Stop('permission','Seu perfil não tem permissão para esta ação.')}
const lotStatus=(S,l)=>l.status!=='disponivel'?l.status:l.exp<today()?'vencido':daysTo(l.exp)<=30?'vencendo':'ok';
const itemQty=(S,id)=>S.lots.filter(l=>l.item===id).reduce((t,l)=>t+l.qty,0);

/* motor de escalonamento: só profissionais sem bloqueios; menor pontuação vence. */
function proposeSchedule(S,u,from,to,unit,allowWarnings){
  const D=structuredClone(S);const out=[];
  const target=D.shifts.filter(s=>s.status!=='cancelado'&&dkey(s.start)>=from&&dkey(s.start)<=to&&(!unit||s.unit===unit)&&can(D,u,'shifts.manage',s.unit)&&new Date(s.start)>new Date()).sort((a,b)=>a.start.localeCompare(b.start));
  target.forEach(s=>{let open=s.slots-D.asg.filter(a=>a.shift===s.id&&ACTIVE(a.status)).length;
    while(open>0){
      const cands=D.profs.filter(p=>p.active&&(!s.cat||p.cat===s.cat)).map(p=>({p,c:checks(D,s,p.id)})).filter(x=>!x.c.blocking.length&&(allowWarnings||!x.c.warnings.length));
      if(!cands.length){
        const why=D.profs.filter(p=>p.active&&(!s.cat||p.cat===s.cat)).map(p=>({p,c:checks(D,s,p.id)}));
        const reasons=why.map(x=>`${x.p.name.split(' ')[0]}: ${(x.c.blocking[0]||x.c.warnings[0]||'').replace(/\.$/,'')}`).slice(0,4);
        out.push({shift:s.id,prof:null,reasons:reasons.length?reasons:['Nenhum profissional ativo da categoria exigida.']});break;}
      cands.forEach(x=>{x.score=x.c.warnings.length*20+x.c.weekHours});
      cands.sort((a,b)=>a.score-b.score);const best=cands[0];
      D.asg.push({id:'tmp'+uid(),shift:s.id,prof:best.p.id,status:'aguardando_confirmacao',reason:null,warnings:[],ended:null});
      out.push({shift:s.id,prof:best.p.id,warnings:best.c.warnings,hours:best.c.weekHours});open--;}
  });
  return out;
}

const A={
  saveShift(S,u,f){
    const isNew=!f.id,old=isNew?null:shiftOf(S,f.id);
    need(S,u,'shifts.manage',f.unit);if(old)need(S,u,'shifts.manage',old.unit);
    if(!f.date||!f.start||!f.end)throw new Stop('validation','Informe data e horários.');
    const start=at(f.date,f.start);let end=at(f.date,f.end);if(f.end<=f.start)end=at(addDays(f.date,1),f.end);
    const dur=hours(start,end,0);if(dur>S.rules.maxShift)throw new Stop('validation',`Duração acima do máximo configurado (${S.rules.maxShift}h).`);
    const slots=Math.max(1,Math.min(50,+f.slots||1)),brk=Math.max(0,+f.brk||0);
    if(brk/60>=dur)throw new Stop('validation','O intervalo não pode ser maior que o plantão.');
    if(isNew){const s={id:'sh'+uid(),unit:f.unit,service:f.service||null,start,end,brk,cat:f.cat||null,slots,comps:f.comps,notes:f.notes,status:'rascunho',cancelReason:null};S.shifts.push(s);log(S,u,'create','shift',s.id,null,label(s));return s.id;}
    const act=S.asg.filter(a=>a.shift===old.id&&ACTIVE(a.status));
    if(slots<act.length)throw new Stop('validation',`Há ${act.length} profissionais escalados; remova atribuições antes de reduzir as vagas.`);
    if(start!==old.start||end!==old.end||f.unit!==old.unit||(f.cat||null)!==old.cat){const tmp={...old,unit:f.unit,cat:f.cat||null,brk};let W=[];
      act.forEach(a=>{const c=checks(S,tmp,a.prof,{ignore:a.id,start,end});if(c.blocking.length)enforce(c);W=W.concat(c.warnings.map(w=>profOf(S,a.prof).name.split(' ')[0]+': '+w))});
      enforce({blocking:[],warnings:W},f.override);}
    const moved=start!==old.start;
    Object.assign(old,{unit:f.unit,service:f.service||null,start,end,brk,cat:f.cat||null,slots,comps:f.comps,notes:f.notes});
    recompute(S,old.id);log(S,u,f.moved?'move':'update','shift',old.id,f.override,label(old));
    if(moved&&old.status!=='rascunho')act.forEach(a=>noteProf(S,u,a.prof,'Plantão alterado','Novo horário: '+label(old)));
    return old.id;
  },
  move(S,u,id,date,reason){const s=shiftOf(S,id);return A.saveShift(S,u,{id,unit:s.unit,service:s.service,date,start:hm(s.start),end:hm(s.end),brk:s.brk,cat:s.cat,slots:s.slots,comps:s.comps,notes:s.notes,override:reason,moved:true})},
  duplicate(S,u,id,dates){const s=shiftOf(S,id);need(S,u,'shifts.manage',s.unit);let n=0;
    dates.forEach(d=>{if(d===dkey(s.start))return;const st=at(d,hm(s.start));S.shifts.push({...s,id:'sh'+uid(),start:st,end:new Date(+new Date(st)+(new Date(s.end)-new Date(s.start))).toISOString(),status:'rascunho',cancelReason:null});n++});
    log(S,u,'duplicate','shift',s.id,null,`${n} cópias de ${label(s)}`);return n;},
  publish(S,u,ids){let n=0;ids.forEach(id=>{const s=shiftOf(S,id);if(!s||s.status!=='rascunho'||new Date(s.end)<new Date())return;need(S,u,'shifts.publish',s.unit);
    s.status='publicado';recompute(S,id);n++;S.asg.filter(a=>a.shift===id&&ACTIVE(a.status)).forEach(a=>noteProf(S,u,a.prof,'Novo plantão na sua escala',label(s)+'. Confirme sua presença.'));});
    log(S,u,'publish','shift',ids.length===1?ids[0]:null,null,`${n} ${n===1?'plantão':'plantões'}`);return n;},
  cancel(S,u,id,reason){const s=shiftOf(S,id);need(S,u,'shifts.manage',s.unit);if(!reason.trim())throw new Stop('validation','Informe o motivo do cancelamento.');
    const was=s.status;s.status='cancelado';s.cancelReason=reason;
    S.asg.filter(a=>a.shift===id&&ACTIVE(a.status)).forEach(a=>{a.status='removido';a.ended='Plantão cancelado';if(was!=='rascunho')noteProf(S,u,a.prof,'Plantão cancelado',label(s)+'. '+reason)});
    S.reqs.filter(r=>r.shift===id&&r.status==='pendente').forEach(r=>{r.status='cancelada';r.note='Plantão cancelado'});
    log(S,u,'cancel','shift',id,reason,label(s));},
  assign(S,u,sid,pid,reason,confirmed,skip){const s=shiftOf(S,sid);if(!skip)need(S,u,'shifts.manage',s.unit);
    const c=checks(S,s,pid);enforce(c,reason);
    const a={id:'a'+uid(),shift:sid,prof:pid,status:confirmed?'confirmado':'aguardando_confirmacao',reason:c.warnings.length?reason:null,warnings:c.warnings,ended:null};
    S.asg.push(a);recompute(S,sid);log(S,u,'assign','asg',sid,a.reason,`${profOf(S,pid).name}, ${label(s)}`);
    if(s.status!=='rascunho')noteProf(S,u,pid,'Novo plantão na sua escala',label(s)+(confirmed?'':'. Confirme sua presença.'));return a.id;},
  applyProposal(S,u,list,reason){let n=0;list.filter(x=>x.prof).forEach(x=>{try{A.assign(S,u,x.shift,x.prof,reason||null,false);n++}catch(e){if(!(e instanceof Stop))throw e}});
    log(S,u,'generate','shift',null,reason,`${n} atribuições`);return n;},
  unassign(S,u,aid,reason){const a=S.asg.find(x=>x.id===aid),s=shiftOf(S,a.shift);need(S,u,'shifts.manage',s.unit);
    if(s.status!=='rascunho'&&!reason.trim())throw new Stop('validation','Informe o motivo para remover alguém de uma escala publicada.');
    a.status='removido';a.ended=reason||null;S.reqs.filter(r=>r.asg===aid&&r.status==='pendente').forEach(r=>{r.status='cancelada';r.note='Profissional removido do plantão'});
    recompute(S,s.id);log(S,u,'unassign','asg',s.id,reason,`${profOf(S,a.prof).name}, ${label(s)}`);
    if(s.status!=='rascunho')noteProf(S,u,a.prof,'Você foi removido de um plantão',label(s));},
  myAsg(S,u,aid){const a=S.asg.find(x=>x.id===aid);if(!a||a.prof!==u.prof)throw new Stop('permission','Atribuição não encontrada.');return a},
  confirm(S,u,aid){const a=A.myAsg(S,u,aid);if(a.status!=='aguardando_confirmacao')throw new Stop('validation','Este plantão não está aguardando confirmação.');
    a.status='confirmado';recompute(S,a.shift);log(S,u,'confirm','asg',a.shift,null,label(shiftOf(S,a.shift)));},
  decline(S,u,aid,reason){const a=A.myAsg(S,u,aid),s=shiftOf(S,a.shift);
    if(a.status!=='aguardando_confirmacao')throw new Stop('validation','Plantões confirmados só mudam com aprovação da gestão.');
    if(!reason.trim())throw new Stop('validation','Informe o motivo.');
    a.status='recusado';a.ended=reason;recompute(S,s.id);log(S,u,'decline','asg',s.id,reason,label(s));
    note(S,u,'shifts.manage','Plantão recusado, vaga descoberta',`${u.name}: ${label(s)}. ${reason}`,{page:'escalas',shift:s.id},s.unit);},
  request(S,u,aid,kind,reason){const a=A.myAsg(S,u,aid),s=shiftOf(S,a.shift);
    if(!reason.trim())throw new Stop('validation','Explique o motivo da solicitação.');
    if(S.reqs.some(r=>r.asg===aid&&r.status==='pendente'))throw new Stop('validation','Já existe uma solicitação pendente para este plantão.');
    S.reqs.push({id:'r'+uid(),shift:s.id,asg:aid,prof:a.prof,kind,reason,status:'pendente',prev:a.status,created:nowIso()});
    if(kind==='substituicao'){a.status='substituicao_solicitada';recompute(S,s.id);}
    log(S,u,'request','req',s.id,reason,`${RK[kind]}, ${label(s)}`);
    note(S,u,'requests.decide',`Solicitação de ${RK[kind].toLowerCase()}`,`${u.name}: ${label(s)}`,{page:'solicitacoes'},s.unit);},
  apply(S,u,sid){const s=shiftOf(S,sid),p=profOf(S,u.prof);
    if(!['descoberto','publicado'].includes(s.status)||new Date(s.start)<new Date())throw new Stop('validation','Este plantão não está aberto para candidaturas.');
    if(s.cat&&s.cat!==p.cat)throw new Stop('validation','Este plantão exige outra categoria profissional.');
    if(S.reqs.some(r=>r.shift===sid&&r.prof===p.id&&r.kind==='candidatura'&&r.status==='pendente'))throw new Stop('validation','Você já se candidatou a este plantão.');
    S.reqs.push({id:'r'+uid(),shift:sid,asg:null,prof:p.id,kind:'candidatura',reason:null,status:'pendente',prev:null,created:nowIso()});
    log(S,u,'apply','req',sid,null,label(s));note(S,u,'requests.decide','Nova candidatura a plantão',`${u.name}: ${label(s)}`,{page:'solicitacoes'},s.unit);},
  withdraw(S,u,rid){const r=S.reqs.find(x=>x.id===rid);if(!r||r.prof!==u.prof||r.status!=='pendente')throw new Stop('validation','A solicitação já foi analisada.');
    r.status='cancelada';if(r.kind==='substituicao'){const a=S.asg.find(x=>x.id===r.asg);if(a&&a.status==='substituicao_solicitada')a.status=r.prev||'confirmado';recompute(S,r.shift);}
    log(S,u,'withdraw','req',r.shift,null,RK[r.kind]);},
  decide(S,u,rid,approve,txt,sub,reason){const r=S.reqs.find(x=>x.id===rid),s=shiftOf(S,r.shift);need(S,u,'requests.decide',s.unit);
    if(r.status!=='pendente')throw new Stop('validation','A solicitação já foi analisada.');
    if(!approve&&!txt.trim())throw new Stop('validation','Informe o motivo da recusa.');
    if(approve){
      if(r.kind==='candidatura')A.assign(S,u,s.id,r.prof,reason,true,true);
      else if(r.kind!=='alteracao'){const a=S.asg.find(x=>x.id===r.asg);const prev=a.status;a.status='removido';a.ended=r.kind==='substituicao'?'Substituição aprovada':'Cancelamento aprovado';
        if(sub){try{A.assign(S,u,s.id,sub,reason,false,true)}catch(e){a.status=prev;throw e}}
        if(recompute(S,s.id)==='descoberto')note(S,u,'shifts.manage','Plantão descoberto',label(s),{page:'escalas',shift:s.id},s.unit);}
    }else if(r.kind==='substituicao'){const a=S.asg.find(x=>x.id===r.asg);if(a&&a.status==='substituicao_solicitada')a.status=r.prev||'confirmado';recompute(S,s.id);}
    r.status=approve?'aprovada':'recusada';r.note=txt||null;r.decided=nowIso();r.by=u.name;
    log(S,u,approve?'approve':'reject','req',s.id,txt,`${RK[r.kind]} de ${profOf(S,r.prof).name}`);
    noteProf(S,u,r.prof,approve?'Solicitação aprovada':'Solicitação recusada',txt||label(s));},
  saveProf(S,u,f){need(S,u,'professionals.manage');if((f.name||'').trim().length<3)throw new Stop('validation','Informe o nome completo.');
    if(!f.cat)throw new Stop('validation','Selecione a categoria profissional.');
    if(f.id){const p=profOf(S,f.id);Object.assign(p,{name:f.name,cat:f.cat,council:f.council,num:f.num,uf:f.uf,email:f.email,phone:f.phone,comps:f.comps,units:f.units});log(S,u,'prof_update','prof',p.id,null,p.name);return p.id;}
    const p={id:'p'+uid(),name:f.name.trim(),cat:f.cat,council:f.council||COUNCIL[f.cat],num:f.num,uf:f.uf||'SP',comps:f.comps,validation:'pendente',active:true,email:f.email,phone:f.phone,units:f.units||[],avail:[],maxWeek:null};
    S.profs.push(p);log(S,u,'prof_create','prof',p.id,null,p.name);note(S,u,'documents.verify','Cadastro aguardando validação',p.name+' foi cadastrado(a).',{page:'prof',id:p.id});return p.id;},
  setActive(S,u,pid,v){need(S,u,'professionals.manage');const p=profOf(S,pid);p.active=v;log(S,u,'prof_update','prof',pid,null,`${p.name}: ${v?'reativado':'desativado'}`);},
  validate(S,u,pid,v){need(S,u,'documents.verify');const p=profOf(S,pid);const old=p.validation;p.validation=v;log(S,u,'validate','prof',pid,null,`${p.name}: ${VST[old][0]} → ${VST[v][0]}`);},
  availability(S,u,pid,slots,maxWeek){if(!(u.prof===pid||can(S,u,'professionals.manage')))throw new Stop('permission','Sem permissão.');
    if(slots.find(s=>s.s===s.e))throw new Stop('validation','Início e término não podem ser iguais.');
    const p=profOf(S,pid);p.avail=slots;p.maxWeek=maxWeek||null;log(S,u,'availability','prof',pid,null,p.name);},
  absence(S,u,pid,kind,from,to,txt){if(!(u.prof===pid||can(S,u,'professionals.manage')))throw new Stop('permission','Sem permissão.');
    if(!from||!to)throw new Stop('validation','Informe as datas.');if(to<from)throw new Stop('validation','A data final deve ser igual ou posterior à inicial.');
    S.abs.push({id:uid(),prof:pid,kind,from,to,note:txt});log(S,u,'absence','prof',pid,null,`${ABS[kind]}: ${D2(from)} a ${D2(to)}`);},
  absenceRm(S,u,id){const x=S.abs.find(a=>a.id===id);if(!(u.prof===x.prof||can(S,u,'professionals.manage')))throw new Stop('permission','Sem permissão.');S.abs=S.abs.filter(a=>a.id!==id);log(S,u,'absence_rm','prof',x.prof,null,ABS[x.kind]);},
  rules(S,u,r){need(S,u,'institution.manage');S.rules={rest:+r.rest,week:+r.week,maxShift:+r.maxShift};log(S,u,'rules','inst',null,null,`Descanso ${r.rest}h, semana ${r.week}h, máximo ${r.maxShift}h`);},
  perms(S,u,role,list){need(S,u,'members.manage');if(role==='admin')throw new Stop('permission','As permissões da administradora não podem ser alteradas.');S.rolePerms[role]=list;log(S,u,'perms','inst',null,null,ROLE[role]);},
  readAll(S,u){S.notifs.forEach(n=>{if(n.user===u.id)n.read=true})},
  read(S,u,id){const n=S.notifs.find(x=>x.id===id);if(n)n.read=true},
  /* estoque */
  stockMove(S,u,f){need(S,u,'stock.manage');const it=itemOf(S,f.item);const qty=Math.round(+f.qty);
    if(!qty||qty<=0)throw new Stop('validation','Informe uma quantidade maior que zero.');if(!(f.reason||'').trim())throw new Stop('validation','Informe o motivo ou a referência da movimentação.');
    let lot=f.lot&&lotOf(S,f.lot);
    if(f.type==='entrada'){if(it.lotc&&!f.newLot&&!lot)throw new Stop('validation','Informe o lote.');
      if(f.newLot){if(!f.exp)throw new Stop('validation','Informe a validade do lote.');lot={id:'l'+uid(),item:it.id,lot:f.newLot,exp:f.exp,qty:0,unit:f.unit||'u1',status:'disponivel'};S.lots.push(lot);}
      if(!lot){lot=S.lots.find(l=>l.item===it.id);}
      lot.qty+=qty;}
    else{if(!lot)throw new Stop('validation','Selecione o lote.');if(lot.qty<qty)throw new Stop('validation',`Saldo insuficiente no lote ${lot.lot}: ${lot.qty} ${it.unit}.`);lot.qty-=qty;}
    S.moves.unshift({id:uid(),at:nowIso(),item:it.id,lot:lot.id,type:f.type,qty,reason:f.reason,ref:{entrada:'Entrada',saida:'Consumo',perda:'Perda',ajuste:'Ajuste de inventário'}[f.type],user:u.name});
    log(S,u,'stock_move','stock',null,f.reason,`${f.type} de ${qty} ${it.unit}: ${it.name} (${lot.lot})`);
    if(itemQty(S,it.id)<it.min)note(S,u,'stock.manage','Estoque baixo',`${it.name}: ${itemQty(S,it.id)} ${it.unit} (mínimo ${it.min}).`,{page:'estoque'});},
  immunize(S,u,f){need(S,u,'vaccines.manage');if(!(f.patient||'').trim())throw new Stop('validation','Informe o paciente.');
    const lot=lotOf(S,f.lot);if(!lot)throw new Stop('validation','Selecione o lote utilizado.');
    if(lot.status!=='disponivel')throw new Stop('blocking','Este lote está em avaliação após ocorrência de temperatura e não pode ser usado.');
    if(lot.exp<today())throw new Stop('blocking','Lote vencido. Selecione outro lote.');if(lot.qty<1)throw new Stop('blocking','Lote sem saldo.');
    if(!f.prof)throw new Stop('validation','Informe o profissional responsável.');
    const im={id:'im'+uid(),at:nowIso(),patient:f.patient.trim(),item:lot.item,lot:lot.id,dose:f.dose,via:f.via,site:f.site,prof:f.prof,unit:lot.unit,status:'registrado'};
    S.imm.unshift(im);lot.qty-=1;S.moves.unshift({id:uid(),at:im.at,item:lot.item,lot:lot.id,type:'saida',qty:1,reason:`Aplicação em ${im.patient}`,ref:'Vacinação',user:u.name});
    log(S,u,'immunize','vaccine',im.id,null,`${itemOf(S,lot.item).name}, lote ${lot.lot}`);},
  immunizeCancel(S,u,id,reason){need(S,u,'vaccines.manage');if(!reason.trim())throw new Stop('validation','Informe o motivo do cancelamento.');
    const im=S.imm.find(x=>x.id===id);if(im.status!=='registrado')return;im.status='cancelado';im.cancelReason=reason;const lot=lotOf(S,im.lot);lot.qty+=1;
    S.moves.unshift({id:uid(),at:nowIso(),item:im.item,lot:im.lot,type:'estorno',qty:1,reason:`Estorno: ${reason}`,ref:'Vacinação',user:u.name});
    log(S,u,'immunize_cancel','vaccine',id,reason,`${itemOf(S,im.item).name}, ${im.patient}`);},
  reading(S,u,eq,temp){need(S,u,'coldchain.manage');const e=S.equip.find(x=>x.id===eq);const t=+String(temp).replace(',','.');
    if(Number.isNaN(t))throw new Stop('validation','Informe a temperatura.');
    S.readings.push({id:uid(),eq,at:nowIso(),temp:t,user:u.name});log(S,u,'reading','cold',null,null,`${e.name}: ${t.toLocaleString('pt-BR')} °C`);
    if(t<e.min||t>e.max){const lots=S.lots.filter(l=>l.unit===e.unit&&itemOf(S,l.item).cat==='Vacina'&&l.status==='disponivel').slice(0,2);
      S.occ.unshift({id:'oc'+uid(),eq,at:nowIso(),temp:t,status:'aberta',action:'',lots:lots.map(l=>l.id),note:null});lots.forEach(l=>l.status='em_avaliacao');
      note(S,u,'coldchain.manage','Ocorrência de temperatura',`${e.name}: ${t.toLocaleString('pt-BR')} °C, fora da faixa ${e.min}–${e.max} °C.`,{page:'temperatura'});return 'fora';}
    return 'ok';},
  occurrence(S,u,id,status,txt){need(S,u,'coldchain.manage');const o=S.occ.find(x=>x.id===id);if(!(txt||'').trim())throw new Stop('validation','Descreva as medidas adotadas ou o parecer técnico.');
    o.status=status;o.action=o.action||txt;o.note=txt;
    if(status==='liberado')o.lots.forEach(l=>{const x=lotOf(S,l);if(x)x.status='disponivel'});
    if(status==='descartado')o.lots.forEach(l=>{const x=lotOf(S,l);if(x){S.moves.unshift({id:uid(),at:nowIso(),item:x.item,lot:x.id,type:'perda',qty:x.qty,reason:'Descarte após ocorrência de temperatura',ref:'Perda',user:u.name});x.qty=0;x.status='bloqueado'}});
    log(S,u,'occurrence','cold',id,txt,{em_avaliacao:'Em avaliação',liberado:'Lotes liberados após avaliação técnica',descartado:'Lotes descartados'}[status]);},
  visit(S,u,f){need(S,u,'homecare.manage');if(!f.patient||!f.prof||!f.date||!f.start)throw new Stop('validation','Preencha paciente, profissional, data e horário.');
    const clash=S.visits.find(v=>v.prof===f.prof&&v.date===f.date&&v.status!=='cancelado'&&v.start<f.end&&v.end>f.start);
    if(clash)throw new Stop('blocking',`${profOf(S,f.prof).name} já tem atendimento das ${clash.start} às ${clash.end} neste dia.`);
    S.visits.push({id:'hv'+uid(),...f,status:'agendado',notes:''});log(S,u,'visit','home',null,null,`${S.patients.find(p=>p.id===f.patient).name}, ${D2(f.date)} ${f.start}`);
    noteProf(S,u,f.prof,'Novo atendimento domiciliar',`${D2(f.date)} às ${f.start}: ${f.service}`);},
  visitStatus(S,u,id,st,txt){const v=S.visits.find(x=>x.id===id);if(!(u.prof===v.prof||can(S,u,'homecare.manage')))throw new Stop('permission','Sem permissão.');
    v.status=st;if(txt)v.notes=txt;if(st==='em_andamento')v.startedAt=nowIso();if(st==='concluido')v.doneAt=nowIso();
    log(S,u,'visit_status','home',id,txt,`${S.patients.find(p=>p.id===v.patient).name}: ${st.replace('_',' ')}`);},
  pay(S,u,kind,id){need(S,u,'finance.manage');const x=(kind==='pay'?S.pay:S.rec).find(y=>y.id===id);if(kind==='pay')x.paid=today();else x.received=today();
    log(S,u,'pay','finance',id,null,`${kind==='pay'?'Pagamento':'Recebimento'}: ${x.desc||x.service}, ${BRL(x.value)}`);},
  bill(S,u,kind,f){need(S,u,'finance.manage');const v=+String(f.value).replace(/\./g,'').replace(',','.');if(!v||v<=0)throw new Stop('validation','Informe um valor válido.');
    if(!f.due)throw new Stop('validation','Informe o vencimento.');if(!(f.who||'').trim()||!(f.what||'').trim())throw new Stop('validation','Preencha todos os campos.');
    if(kind==='pay')S.pay.push({id:'py'+uid(),supplier:f.who,desc:f.what,cat:f.cat||'Outros',value:v,due:f.due,paid:null});
    else S.rec.push({id:'rc'+uid(),payer:f.who,service:f.what,value:v,issued:today(),due:f.due,received:null});
    log(S,u,'bill','finance',null,null,`${kind==='pay'?'Conta a pagar':'Conta a receber'}: ${f.what}, ${BRL(v)}`);},
  talent(S,u,id,st){need(S,u,'talent.manage');const c=S.cands.find(x=>x.id===id);c.status=st;log(S,u,'talent','talent',id,null,`${c.name}: ${st.replace('_',' ')}`);},
  opp(S,u,f){need(S,u,'talent.manage');if(!(f.title||'').trim())throw new Stop('validation','Informe o título da oportunidade.');S.opps.unshift({id:'op'+uid(),...f,slots:+f.slots||1,status:'aberta'});log(S,u,'talent','talent',null,null,'Oportunidade publicada: '+f.title);},
};

/* ------------------------------------------------------------------ armazenamento */
const SKEY='medlink-demo-v2',UKEY='medlink-demo-user2',TKEY='medlink-theme';
const load=()=>{try{const s=JSON.parse(localStorage.getItem(SKEY));if(s&&s.v===2)return s}catch(e){}return null};
const save=s=>{try{localStorage.setItem(SKEY,JSON.stringify(s))}catch(e){}};
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
