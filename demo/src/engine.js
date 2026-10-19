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
 'org.manage':['Editar, organizar e excluir unidades, setores e catálogos','Instituição'],
 'professionals.view':['Ver profissionais','Pessoas'],
 'professionals.manage':['Cadastrar e editar profissionais','Pessoas'],
 'documents.verify':['Validar cadastros profissionais','Pessoas'],
 'talent.manage':['Usar o banco de talentos','Pessoas'],
 'shifts.view':['Ver escalas','Escalas'],
 'shifts.manage':['Criar, editar e gerar escalas','Escalas'],
 'shifts.publish':['Publicar escalas','Escalas'],
 'requests.decide':['Aprovar solicitações','Escalas'],
 'vaccines.view':['Ver vacinação e calendário vacinal','Clínico'],
 'vaccines.apply':['Registrar aplicações de vacina','Clínico'],
 'vaccines.manage':['Cancelar aplicações e estornar doses','Clínico'],
 'records.view':['Ver prontuário eletrônico','Clínico'],
 'records.write':['Registrar evoluções e cadastrar pacientes','Clínico'],
 'procedures.register':['Registrar procedimentos realizados','Clínico'],
 'procedures.verify':['Agendar e conferir procedimentos','Clínico'],
 'aesthetic.view':['Ver agenda de estética','Estética'],
 'aesthetic.manage':['Agendar, vender pacotes e editar catálogo de estética','Estética'],
 'aesthetic.perform':['Registrar sessões de estética','Estética'],
 'ltc.view':['Ver longa permanência','Longa permanência'],
 'ltc.care':['Registrar cuidados, medicações e intercorrências','Longa permanência'],
 'ltc.manage':['Admitir residentes, leitos e transcrever prescrições','Longa permanência'],
 'wounds.view':['Ver feridas e estomias','Feridas e estomaterapia'],
 'wounds.manage':['Registrar lesões, avaliações e estomias','Feridas e estomaterapia'],
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
const ACT={create:'Criou plantão',update:'Editou plantão',move:'Moveu plantão',duplicate:'Duplicou plantão',publish:'Publicou',cancel:'Cancelou plantão',assign:'Escalou profissional',unassign:'Removeu profissional',confirm:'Confirmou presença',decline:'Recusou plantão',request:'Abriu solicitação',apply:'Candidatou-se',approve:'Aprovou solicitação',reject:'Recusou solicitação',withdraw:'Retirou solicitação',prof_create:'Cadastrou profissional',prof_update:'Editou profissional',validate:'Alterou validação',availability:'Alterou disponibilidade',absence:'Registrou ausência',absence_rm:'Removeu ausência',rules:'Alterou regras de escala',perms:'Alterou permissões',institution:'Criou a instituição',generate:'Aplicou escala gerada',stock_move:'Movimentou estoque',immunize:'Registrou aplicação',immunize_cancel:'Cancelou aplicação',reading:'Registrou temperatura',occurrence:'Tratou ocorrência de temperatura',visit:'Agendou atendimento domiciliar',visit_status:'Atualizou atendimento domiciliar',pay:'Baixou conta',bill:'Lançou conta',talent:'Movimentou banco de talentos',
 org:'Alterou a organização',org_delete:'Excluiu da organização',org_archive:'Arquivou',shift_delete:'Excluiu rascunho de plantão',prof_delete:'Excluiu profissional',bill_delete:'Excluiu lançamento',
 patient:'Cadastrou ou editou paciente',patient_delete:'Excluiu paciente',record:'Registrou evolução',addendum:'Registrou adendo',record_view:'Acessou prontuário',imm_external:'Transcreveu dose da caderneta',
 proc_assign:'Agendou procedimento',proc_done:'Registrou procedimento realizado',proc_not:'Registrou procedimento não realizado',proc_ok:'Conferiu procedimento',proc_back:'Devolveu procedimento para correção',
 checkin:'Registrou entrada no plantão',checkout:'Registrou saída do plantão',
 aes_appt:'Agendou atendimento de estética',aes_status:'Atualizou atendimento de estética',aes_session:'Registrou sessão de estética',aes_pkg:'Vendeu pacote de estética',aes_anam:'Atualizou anamnese estética',aes_cat:'Alterou catálogo de estética',
 ltc_admit:'Admitiu residente',ltc_discharge:'Registrou saída de residente',ltc_rx:'Transcreveu prescrição',ltc_rx_stop:'Suspendeu prescrição',ltc_mar:'Registrou administração de medicação',ltc_care:'Registrou cuidado',ltc_occ:'Registrou intercorrência',ltc_occ_close:'Encerrou intercorrência',ltc_handoff:'Registrou passagem de plantão',ltc_room:'Alterou quartos e leitos',wound_add:'Registrou lesão',wound_eval:'Registrou avaliação de lesão',wound_status:'Alterou situação da lesão',ostomy_add:'Registrou estomia',ostomy_eval:'Registrou avaliação de estomia'};
const ENT={shift:'Plantão',asg:'Escala do profissional',req:'Solicitação',prof:'Profissional',inst:'Instituição',stock:'Estoque',vaccine:'Vacinação',cold:'Temperatura',home:'Home care',finance:'Financeiro',talent:'Banco de talentos',org:'Organização',patient:'Prontuário',proc:'Procedimentos',aes:'Estética',ltc:'Longa permanência',wound:'Feridas e estomias'};
const ACTIVE=s=>s==='aguardando_confirmacao'||s==='confirmado'||s==='substituicao_solicitada';
const ALL_PERMS=Object.keys(PERMS);

/* ------------------------------------------------------------------ dados de demonstração */
function seed(){
  const T=today(), W0=weekStart(T);
  const S={v:5,inst:{name:'Clínica Vida Vacinas',type:'Vacinação, estética, home care e longa permanência',city:'Campinas/SP',cnpj:'00.000.000/0001-00 (fictício)',phone:'(19) 3000-0000',email:'contato@vidavacinas.demo'},
    rules:{rest:11,week:44,maxShift:24},
    rates:{tecnico_enfermagem:28,enfermeiro:46,medico:150,auxiliar_enfermagem:24,farmaceutico:52},
    rolePerms:{
      admin:ALL_PERMS.slice(),
      gestor:['wounds.view','aesthetic.view','aesthetic.manage','ltc.view','ltc.manage','org.manage','professionals.view','professionals.manage','talent.manage','shifts.view','shifts.manage','shifts.publish','requests.decide','stock.view','stock.manage','homecare.view','homecare.manage','vaccines.view','coldchain.view','reports.view','audit.view'],
      rt:['wounds.view','wounds.manage','aesthetic.view','aesthetic.perform','ltc.view','ltc.care','ltc.manage','professionals.view','documents.verify','shifts.view','vaccines.view','vaccines.apply','vaccines.manage','records.view','records.write','procedures.verify','stock.view','coldchain.view','coldchain.manage','homecare.view','reports.view','audit.view'],
      prof:['wounds.view','wounds.manage','aesthetic.view','aesthetic.perform','ltc.view','ltc.care','vaccines.view','vaccines.apply','records.view','records.write','procedures.register']},
    units:[{id:'u1',name:'Matriz Centro',addr:'Rua Barão de Jaguara, 1200, Centro'},{id:'u2',name:'Unidade Taquaral',addr:'Av. Heitor Penteado, 450, Taquaral'},{id:'u3',name:'Residencial Vida Longa',addr:'Rua Padre Vieira, 300, Bosque'}],
    services:[{id:'s1',unit:'u1',name:'Sala de vacinação'},{id:'s2',unit:'u1',name:'Atendimento de enfermagem'},{id:'s3',unit:'u2',name:'Sala de vacinação'},{id:'s4',unit:'u2',name:'Coleta domiciliar'},{id:'s5',unit:'u1',name:'Estética'},{id:'s6',unit:'u3',name:'Cuidados residenciais'}],
    users:[
      {id:'ana',name:'Ana Ribeiro',role:'admin',email:'ana.ribeiro@vidavacinas.demo'},
      {id:'marcos',name:'Marcos Lima',role:'gestor',units:['u2'],email:'marcos.lima@vidavacinas.demo'},
      {id:'helena',name:'Helena Prado',role:'rt',email:'helena.prado@vidavacinas.demo'},
      {id:'carla',name:'Carla Mendes',role:'prof',prof:'p1',email:'carla.mendes@email.demo'},
      {id:'paulo',name:'Paulo Santos',role:'prof',prof:'p5',email:'paulo.santos@email.demo'}],
    profs:[],shifts:[],asg:[],reqs:[],abs:[],notifs:[],audit:[],
    items:[],lots:[],moves:[],imm:[],equip:[],readings:[],occ:[],patients:[],visits:[],pay:[],rec:[],cands:[],opps:[],evol:[],procs:[],
    aesCat:[],aesPkgs:[],aesAppts:[],wounds:[],ostomies:[],rooms:[],rx:[],mar:[],care:[],ltcOcc:[],handoff:[],
    procCat:['Aferição de sinais vitais','Curativo','Glicemia capilar','Coleta de material para exame','Administração de medicação prescrita','Retirada de pontos','Orientação de enfermagem'].map((n,i)=>({id:'pc'+(i+1),name:n,archived:false}))};
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
  if(wdOf(T)!==0){const td=S.shifts.filter(s=>dkey(s.start)===T);
    const put=(srv,pid)=>{const sh=td.find(s=>s.service===srv);if(!sh)return;const a=S.asg.find(x=>x.shift===sh.id);const prev=a&&a.prof;if(a){a.prof=pid;a.status='confirmado'}else as(sh,pid,'confirmado');
      S.asg.filter(x=>x.prof===pid&&x.shift!==sh.id&&td.some(t=>t.id===x.shift)).forEach(x=>{if(prev&&prev!==pid)x.prof=prev;else x.status='removido'});};
    put('s1','p1');put('s2','p5');}
  S.shifts.forEach(s=>recompute(S,s.id));
  const fut=S.asg.filter(a=>a.prof==='p2'&&ACTIVE(a.status)).map(a=>({a,s:shiftOf(S,a.shift)})).filter(x=>x.s.status!=='rascunho'&&new Date(x.s.start)>new Date(Date.now()+864e5)).sort((x,y)=>x.s.start.localeCompare(y.s.start))[0];
  if(fut){S.reqs.push({id:'r'+uid(),shift:fut.s.id,asg:fut.a.id,prof:'p2',kind:'substituicao',reason:'Consulta médica marcada no mesmo horário.',status:'pendente',prev:fut.a.status,created:new Date(Date.now()-3*36e5).toISOString()});fut.a.status='substituicao_solicitada';recompute(S,fut.s.id);
    note(S,null,'requests.decide','Solicitação de substituição',`Fernanda Ribeiro, plantão de ${D2(fut.s.start)} ${hm(fut.s.start)}`,{page:'solicitacoes'});}
  const open=S.shifts.filter(s=>s.status==='descoberto'&&s.cat==='tecnico_enfermagem'&&new Date(s.start)>new Date()).sort((x,y)=>x.start.localeCompare(y.start));
  for(const s of open){const cand=['p3','p1','p2'].find(p=>!checks(S,s,p).blocking.length);if(cand){S.reqs.push({id:'r'+uid(),shift:s.id,asg:null,prof:cand,kind:'candidatura',reason:'Posso cobrir, moro perto da unidade.',status:'pendente',prev:null,created:new Date(Date.now()-50*6e4).toISOString()});break;}}
  const cp=S.asg.find(a=>a.prof==='p1'&&a.status==='aguardando_confirmacao');
  if(cp){const s=shiftOf(S,cp.shift);push(S,'carla','Novo plantão na sua escala',`${F(s.start,{weekday:'short',day:'2-digit',month:'2-digit'})} às ${hm(s.start)}. Confirme sua presença.`,{page:'meu'});}
  push(S,'helena','Cadastro aguardando validação','Bruno Tavares enviou o cadastro profissional.',{page:'prof',id:'p8'});

  /* estoque */
  const IT=(id,name,cat,unit,min,lotc,vac)=>S.items.push({id,name,cat,unit,min,lotc,vac:vac||null,maker:cat==='Vacina'?'Fabricante (demo)':null,archived:false});
  [['v1','flu',40],['v2','hepb',20],['v3','fa',15],['v4','scr',15],['v5','hpv',10],['v6','acwy',10],['v7','penta',12],['v8','vip',12],['v9','rota',10],['v10','pcv20',12],['v11','menc',10],['v12','dtp',8],['v13','var',8],['v14','hepa',8],['v15','bcg',6],['v16','dtpa',8],['v17','pcv10',6],['v18','scrv',6],['v19','dt',10]]
    .forEach(([id,v,min])=>IT(id,'Vacina '+VAC[v].n,'Vacina','dose',min,true,v));
  IT('i1','Seringa 3 mL','Insumo','unidade',300,false);IT('i2','Agulha 25 x 0,6 mm','Insumo','unidade',300,false);IT('i3','Algodão hidrófilo 500 g','Insumo','pacote',6,false);
  IT('i4','Luva de procedimento M','EPI','caixa',10,false);IT('i5','Álcool 70% 1 L','Insumo','frasco',8,false);IT('i6','Bobina de gelo reciclável','Insumo','unidade',24,false);
  const L=(item,lot,exp,qty,unit)=>{const l={id:'l'+uid(),item,lot,exp,qty,unit,status:'disponivel'};S.lots.push(l);return l};
  L('v1','FLU26-118',addDays(T,140),96,'u1');L('v1','FLU26-131',addDays(T,170),60,'u2');L('v2','HB-7720',addDays(T,24),18,'u1');L('v2','HB-7801',addDays(T,300),40,'u2');
  L('v3','FA-3391',addDays(T,90),12,'u1');L('v4','TV-5512',addDays(T,-3),6,'u1');L('v4','TV-5620',addDays(T,210),30,'u2');L('v5','HPV-0907',addDays(T,18),14,'u1');L('v6','MEN-2204',addDays(T,260),22,'u1');
  L('v7','PEN-4410',addDays(T,190),20,'u1');L('v8','VIP-1187',addDays(T,220),24,'u1');L('v9','ROT-6620',addDays(T,75),16,'u1');L('v10','P20-0031',addDays(T,330),18,'u1');L('v11','MNC-5508',addDays(T,160),14,'u1');
  L('v12','DTP-2290',addDays(T,250),9,'u1');L('v13','VAR-7716',addDays(T,120),5,'u1');L('v14','HPA-3302',addDays(T,280),12,'u1');L('v15','BCG-0912',addDays(T,45),10,'u1');L('v16','DTPA-118',addDays(T,200),11,'u1');
  L('v17','P10-8804',addDays(T,60),7,'u1');L('v18','SCRV-221',addDays(T,150),8,'u1');L('v19','DT-5541',addDays(T,310),26,'u1');
  L('i1','—',addDays(T,700),820,'u1');L('i2','—',addDays(T,700),640,'u1');L('i3','—',addDays(T,400),4,'u1');L('i4','—',addDays(T,500),26,'u1');L('i5','—',addDays(T,300),11,'u1');L('i6','—',addDays(T,900),40,'u1');
  S.moves.push({id:uid(),at:new Date(Date.now()-5*864e5).toISOString(),item:'v1',lot:S.lots[0].id,type:'entrada',qty:100,reason:'Nota fiscal 48.211 (demo)',ref:'Compra',user:'Ana Ribeiro'});
  S.moves.push({id:uid(),at:new Date(Date.now()-2*864e5).toISOString(),item:'i3',lot:S.lots.find(l=>l.item==='i3').id,type:'saida',qty:2,reason:'Consumo da sala de vacinação',ref:'Consumo',user:'Marcos Lima'});

  /* pacientes (todos fictícios) */
  const bm=(m,d=0)=>addDays(addMonthsKey(T,-m),-d);
  const PT=(id,name,birth,sex,extra={})=>S.patients.push({id,name,birth,sex,doc:'CNS 7'+pad(10+S.patients.length*7)+' '+pad(S.patients.length*13%100)+'xx (fictício)',phone:`(19) 9${8200+S.patients.length*41}-${pad(20+S.patients.length*3)}${pad(S.patients.length*7%100)}`,
    addr:'',region:'',homecare:false,allergies:[],conditions:[],pregnant:false,guardian:'',active:true,...extra,created:birth>addDays(T,-900)?addDays(birth,1):addDays(T,-900)});
  PT('hp1','Sr. Antônio Reis',bm(81*12,40),'M',{region:'Cambuí',addr:'Rua Coronel Quirino, 820',homecare:true,conditions:['Hipertensão arterial (informada)'],allergies:['Dipirona (informada pela família)']});
  PT('hp2','Dona Lúcia Freitas',bm(77*12,12),'F',{region:'Taquaral',addr:'Rua Dr. Sampaio Ferraz, 140',homecare:true,conditions:['Diabetes mellitus (informada)']});
  PT('hp3','Sr. Henrique Mattos',bm(72*12,90),'M',{region:'Barão Geraldo',addr:'Av. Albino J. B. de Oliveira, 1030',homecare:true});
  PT('hp4','Dona Célia Prado',bm(84*12,5),'F',{region:'Centro',addr:'Rua Regente Feijó, 455',homecare:true,allergies:['Esparadrapo (informada)']});
  PT('pc1','Helena Duarte',bm(7,9),'F',{region:'Cambuí',addr:'Rua Maria Monteiro, 300',guardian:'Juliana Duarte (mãe)'});
  PT('pc2','Theo Martins',bm(16,4),'M',{region:'Taquaral',addr:'Rua Hermantino Coelho, 75',guardian:'Rafael Martins (pai)'});
  PT('pc3','Alice Ramos',bm(50,3),'F',{region:'Centro',addr:'Rua Conceição, 210',guardian:'Bianca Ramos (mãe)',allergies:['Proteína do leite de vaca (informada)']});
  PT('pa1','Joana Pereira',bm(34*12,60),'F',{region:'Cambuí',addr:'Rua Guilherme da Silva, 512',pregnant:true,conditions:['Gestação (informada)']});
  PT('pa2','Rui Albuquerque',bm(45*12,20),'M',{region:'Nova Campinas',addr:'Av. Princesa d’Oeste, 1880'});
  PT('pa3','Marta Sena',bm(27*12,150),'F',{region:'Barão Geraldo',addr:'Rua Albert Einstein, 400'});
  PT('pa4','Otávio Lins',bm(68*12,33),'M',{region:'Taquaral',addr:'Rua Uruguai, 980'});
  /* caderneta: doses do calendário até a idade, com lacunas propositais para a conferência */
  const anyLot=v=>{const it=S.items.find(i=>i.vac===v);return it?S.lots.find(l=>l.item===it.id):null};
  const IM=(pid,v,dose,day,o={})=>{const lot=o.ext?null:anyLot(v);const it=S.items.find(i=>i.vac===v);
    S.imm.push({id:'im'+uid(),at:at(day,o.t||'09:'+pad(10+S.imm.length%45)),patient:pid,vac:v,item:it?it.id:null,lot:lot?lot.id:null,dose,via:VAC[v].via,site:o.site||SITES[VAC[v].via][VAC[v].via==='Intramuscular'?2:0],
      prof:o.prof||['p1','p2','p5'][S.imm.length%3],unit:'u1',status:'registrado',origin:o.ext?'externa':'aplicada',place:o.ext?(o.place||'Maternidade (transcrito da caderneta)'):null,strategy:o.strategy||'Rotina',notes:''})};
  const kid=(pid,skip=[])=>{const pt=S.patients.find(p=>p.id===pid);const am=ageMonths(pt.birth);
    CAL_CHILD.forEach(row=>{if(row.m>am)return;row.items.forEach(([v,dose,core])=>{if(!core||skip.includes(v+'|'+dose))return;const day=addDays(addMonthsKey(pt.birth,row.m),row.m?3:1);
      IM(pid,v,dose,day,row.m===0?{ext:true}:{site:VAC[v].via==='Intramuscular'?(am<12?'Vasto lateral da coxa '+(S.imm.length%2?'direita':'esquerda'):'Deltoide '+(S.imm.length%2?'direito':'esquerdo')):undefined})})})};
  kid('pc1');kid('pc2',['pcv20|Reforço','hepa|Dose única']);kid('pc3',['var|2ª dose','fa|Reforço']);
  IM('pa3','hepb','1ª dose',addDays(T,-62));IM('pa1','flu','Dose por gestação',addDays(T,-20));
  /* aplicações de hoje e da semana (baixam estoque) */
  const todayIm=[['pa4','flu','Dose anual',0,'08:20','p5','Deltoide esquerdo'],['pa3','hepb','2ª dose',0,'09:05','p1','Deltoide direito'],['pa1','dtpa','Dose por gestação',0,'10:40','p5','Deltoide esquerdo'],
    ['hp2','flu','Dose anual',-1,'14:50','p5','Deltoide direito'],['pa2','dt','Reforço',-2,'11:10','p2','Deltoide esquerdo'],['hp3','flu','Dose anual',-3,'16:40','p5','Deltoide esquerdo']];
  todayIm.forEach(([pid,v,dose,d,t,prof,site])=>{const k=addDays(T,d);if(new Date(at(k,t))>new Date())return;IM(pid,v,dose,k,{t,prof,site});const im=S.imm[S.imm.length-1];const lot=lotOf(S,im.lot);if(lot){lot.qty-=1;S.moves.push({id:uid(),at:im.at,item:lot.item,lot:lot.id,type:'saida',qty:1,reason:'Aplicação registrada',ref:'Vacinação',user:'Sistema'})}});
  S.imm.sort((a,b)=>b.at.localeCompare(a.at));

  /* temperatura */
  S.equip.push({id:'e1',name:'Câmara refrigerada 1',unit:'u1',min:2,max:8,archived:false},{id:'e2',name:'Refrigerador sala 2',unit:'u1',min:2,max:8,archived:false},{id:'e3',name:'Câmara refrigerada Taquaral',unit:'u2',min:2,max:8,archived:false});
  for(let d=3;d>=0;d--){['08:00','17:00'].forEach((t,j)=>{const iso=at(addDays(T,-d),t);if(new Date(iso)>new Date())return;
    S.equip.forEach((e,k)=>{let temp=+(4+((d*7+k*3+j*5)%30)/10).toFixed(1);const exc=d===1&&k===1&&j===1;if(exc)temp=9.4;
      S.readings.push({id:uid(),eq:e.id,at:iso,temp,user:['Carla Mendes','Paulo Santos','Mariana Costa'][(d+k)%3]});
      if(exc){S.occ.push({id:'oc'+uid(),eq:e.id,at:iso,temp,status:'em_avaliacao',action:'Porta encontrada entreaberta. Fechada, produtos mantidos isolados e identificados.',lots:[S.lots.find(l=>l.item==='v3').id],note:null});}});});}
  S.lots.find(l=>l.item==='v3').status='em_avaliacao';

  /* home care */
  const V=(p,d,s,e,srv,prof,st)=>S.visits.push({id:'hv'+uid(),patient:p,date:addDays(T,d),start:s,end:e,service:srv,prof,status:st,notes:''});
  V('hp1',0,'09:00','10:00','Curativo','p6','concluido');V('hp2',0,'14:30','15:30','Vacinação domiciliar','p5','agendado');V('hp3',0,'16:30','17:30','Sinais vitais e orientação','p6','agendado');
  V('hp4',1,'08:30','09:30','Curativo','p6','agendado');V('hp1',2,'09:00','10:00','Curativo','p6','agendado');V('hp2',3,'14:30','15:30','Coleta domiciliar','p3','agendado');V('hp3',-1,'10:00','11:00','Sinais vitais e orientação','p5','concluido');

  /* prontuário: evoluções (textos fictícios de demonstração) */
  const EV=(pid,d,t,author,cat,kind,text)=>S.evol.push({id:'ev'+uid(),patient:pid,at:at(addDays(T,d),t),author,cat,kind,text,addenda:[]});
  EV('hp1',-7,'09:40','Ana Beatriz Lima','Enfermeiro(a)','Evolução de enfermagem','Visita domiciliar. Curativo realizado conforme prescrição vigente. Paciente e família orientados sobre os cuidados até a próxima visita.');
  EV('hp1',0,'09:55','Ana Beatriz Lima','Enfermeiro(a)','Evolução de enfermagem','Curativo realizado conforme prescrição. Sem intercorrências durante o procedimento. Próxima visita agendada.');
  EV('hp3',-1,'10:50','Paulo Santos','Enfermeiro(a)','Evolução de enfermagem','Aferidos sinais vitais e registrados na ficha. Paciente orientado sobre o uso das medicações já prescritas pelo médico assistente.');
  EV('pc2',-30,'10:10','Carla Mendes','Técnico(a) de enfermagem','Atendimento','Responsável trouxe a caderneta. Doses transcritas para o sistema. Orientado retorno para conferir pendências com a enfermeira.');
  EV('pa1',-20,'15:20','Paulo Santos','Enfermeiro(a)','Atendimento','Gestante em acompanhamento pré-natal externo. Caderneta de vacinação conferida e orientações registradas.');
  EV('pc3',-60,'09:30','Helena Prado','Responsável técnica','Observação','Responsável informa alergia à proteína do leite de vaca. Registrado em alergias para alerta nos próximos atendimentos.');

  /* procedimentos */
  const PR=(pid,type,d,t,prof,status,o={})=>S.procs.push({id:'pr'+uid(),patient:pid,type,unit:'u1',date:addDays(T,d),start:t,prof,status,notes:o.notes||'',assignedBy:o.by||'Helena Prado',created:at(addDays(T,d-1),'17:00'),doneAt:status!=='agendado'?at(addDays(T,d),t):null,verifiedBy:o.vb||null,returnNote:o.rn||null});
  PR('pa3','Aferição de sinais vitais',0,'10:30','p1','agendado');PR('pa2','Glicemia capilar',0,'11:00','p1','agendado');
  PR('pa4','Orientação de enfermagem',-1,'09:30','p1','devolvido',{notes:'Orientação realizada.',rn:'Descreva quais orientações foram dadas e se o paciente compreendeu.'});
  PR('hp2','Aferição de sinais vitais',-1,'15:00','p5','realizado',{notes:'Sinais vitais aferidos e registrados na ficha domiciliar.'});
  PR('pc2','Orientação de enfermagem',0,'15:30','p5','agendado');
  PR('hp1','Curativo',-7,'09:00','p6','conferido',{notes:'Curativo realizado conforme prescrição.',vb:'Helena Prado'});
  PR('pa1','Orientação de enfermagem',-20,'15:00','p5','conferido',{notes:'Orientações sobre o calendário da gestante.',vb:'Helena Prado'});

  /* enfermagem estética (catálogo configurável pela clínica; nomes e valores fictícios) */
  [['Limpeza de pele',60,180,1,2],['Drenagem linfática',50,150,10,4],['Microagulhamento',60,420,4,6],['Peeling químico superficial',45,260,4,1],['Fotobiomodulação com LED',30,120,8,3],['Massagem modeladora',50,160,10,5]]
    .forEach(([n,d,v,ses,c],i)=>S.aesCat.push({id:'ae'+(i+1),name:n,dur:d,price:v,sessions:ses,c,archived:false}));
  PT('ae1','Larissa Moura',bm(31*12,40),'F',{region:'Cambuí',addr:'Rua Olavo Bilac, 210',aes:{at:addDays(T,-40),complaint:'Manchas e textura irregular na face',reported:'Nega gestação. Relata pele sensível ao sol.',notes:'Usa protetor solar diariamente.'}});
  PT('ae2','Beatriz Lemos',bm(42*12,15),'F',{region:'Nova Campinas',addr:'Rua Buarque de Macedo, 77',aes:{at:addDays(T,-20),complaint:'Retenção de líquido nas pernas',reported:'Nega doenças crônicas.',notes:''}});
  PT('ae3','Camila Torres',bm(29*12,80),'F',{region:'Taquaral',addr:'Rua Uruguai, 145',aes:null});
  const PK=(pid,cat,used,d)=>{const c=S.aesCat.find(x=>x.id===cat);const k={id:'pk'+uid(),patient:pid,cat,total:c.sessions,used,price:c.price*c.sessions*0.85,created:addDays(T,d),status:used>=c.sessions?'concluido':'ativo'};S.aesPkgs.push(k);return k};
  const pk1=PK('ae1','ae3',2,-40),pk2=PK('ae2','ae2',6,-12);
  const AP=(pid,cat,d,t,prof,st,o={})=>S.aesAppts.push({id:'aa'+uid(),patient:pid,cat,date:addDays(T,d),start:t,prof,status:st,pkg:o.pkg||null,consent:!!o.consent,notes:o.notes||'',products:o.products||'',doneAt:st==='realizado'?at(addDays(T,d),t):null});
  AP('ae1','ae3',-28,'10:00','p6','realizado',{pkg:pk1.id,consent:true,notes:'Sessão realizada conforme protocolo da clínica. Orientada sobre fotoproteção.',products:'Kit microagulhamento lote KM-221 (demo)'});
  AP('ae1','ae3',-7,'10:00','p6','realizado',{pkg:pk1.id,consent:true,notes:'Sessão realizada sem intercorrências.',products:'Kit microagulhamento lote KM-240 (demo)'});
  AP('ae2','ae2',-2,'16:00','p5','realizado',{pkg:pk2.id,consent:true,notes:'Drenagem realizada. Cliente refere bem-estar.'});
  AP('ae1','ae3',0,'10:00','p6','confirmado',{pkg:pk1.id,consent:true});AP('ae2','ae2',0,'16:00','p5','agendado',{pkg:pk2.id,consent:true});
  AP('ae3','ae1',0,'17:30','p6','agendado');AP('ae2','ae2',2,'16:00','p5','agendado',{pkg:pk2.id,consent:true});AP('ae3','ae5',3,'11:00','p6','agendado');
  S.rec.push({id:'rc'+uid(),payer:'Larissa Moura',service:'Pacote Microagulhamento (4 sessões)',value:pk1.price,issued:addDays(T,-40),due:addDays(T,-40),received:addDays(T,-40)});

  /* longa permanência (residentes e prescrições fictícios) */
  S.rooms=[{id:'q1',name:'Quarto 1',beds:['A','B']},{id:'q2',name:'Quarto 2',beds:['A','B']},{id:'q3',name:'Quarto 3',beds:['A','B','C']},{id:'q4',name:'Quarto 4',beds:['A']}];
  const RS=(id,name,age,sex,room,bed,grau,o={})=>PT(id,name,bm(age*12,id.charCodeAt(2)*7),sex,{region:'Residencial Vida Longa',addr:'Rua Padre Vieira, 300',ltc:{room,bed,grau,admitted:addDays(T,o.adm||-300),contact:o.contact||'',diet:o.diet||'Dieta geral',active:true},...o.extra});
  RS('lr1','Dona Aurora Campos',86,'F','q1','A',3,{contact:'Sérgio Campos (filho), (19) 99111-2030',diet:'Dieta pastosa',extra:{allergies:['Penicilina (informada)'],conditions:['Demência (diagnóstico informado)']}});
  RS('lr2','Sr. Benedito Rocha',79,'M','q1','B',2,{contact:'Marta Rocha (filha), (19) 99222-4050'});
  RS('lr3','Dona Iracema Luz',91,'F','q2','A',3,{contact:'Paulo Luz (neto), (19) 99333-6070',diet:'Dieta branda'});
  RS('lr4','Sr. Joaquim Prates',74,'M','q3','A',1,{contact:'Ana Prates (esposa), (19) 99444-8090',adm:-40});
  RS('lr5','Dona Zélia Andrade',82,'F','q3','B',2,{contact:'Rita Andrade (filha), (19) 99555-1020',extra:{conditions:['Diabetes mellitus (informada)']}});
  const PRESC='Dr. Rafael Nogueira, CRM fictício 184.322';
  const RX=(pid,drug,dose,route,times,o={})=>S.rx.push({id:'rx'+uid(),patient:pid,drug,dose,route,times,prescriber:PRESC,start:addDays(T,-60),end:null,active:true,notes:o.notes||'',by:'Helena Prado',demo:true});
  RX('lr1','Medicamento de uso contínuo A (demo)','1 comprimido','Via oral',['08:00','20:00']);RX('lr1','Suplemento nutricional (demo)','200 mL','Via oral',['10:00','15:00']);
  RX('lr2','Medicamento de uso contínuo B (demo)','1 comprimido','Via oral',['08:00']);RX('lr3','Medicamento de uso contínuo C (demo)','1 comprimido','Via oral',['08:00','14:00','20:00']);
  RX('lr4','Medicamento de uso contínuo D (demo)','1 comprimido','Via oral',['12:00']);RX('lr5','Medicamento de uso contínuo E (demo)','Conforme prescrição','Via subcutânea',['07:00','19:00'],{notes:'Registrar glicemia capilar antes da administração, conforme prescrição.'});
  const nowHM=hm(nowIso());
  S.rx.forEach(r=>r.times.forEach(t=>{[-1,0].forEach(d=>{if(d===0&&t>nowHM)return;if(d===0&&r.patient==='lr3'&&t==='14:00')return;
    S.mar.push({id:'mr'+uid(),rx:r.id,patient:r.patient,date:addDays(T,d),time:t,status:r.patient==='lr2'&&t==='08:00'&&d===-1?'recusado':'administrado',note:r.patient==='lr2'&&t==='08:00'&&d===-1?'Residente recusou. Médico comunicado.':'',by:['Carla Mendes','Mariana Costa','Paulo Santos'][(t.charCodeAt(1)+d)%3],at:at(addDays(T,d),t)})})}));
  {const sn=shiftNow(),ago=m=>new Date(Date.now()-m*6e4).toISOString();
   ['lr1','lr2','lr3','lr5'].forEach((pid,i)=>{S.care.push({id:'cr'+uid(),patient:pid,date:T,shift:sn,kind:'higiene',value:i===2?'Realizada com auxílio total':'Realizada',by:'Mariana Costa',at:ago(150-i*8)});
     if(i<3)S.care.push({id:'cr'+uid(),patient:pid,date:T,shift:sn,kind:'alimentacao',value:i===1?'Aceitação parcial':'Aceitação total',by:'Mariana Costa',at:ago(90-i*6)});});
   S.care.push({id:'cr'+uid(),patient:'lr1',date:T,shift:sn,kind:'sinais',value:'PA 128/80 mmHg · FC 76 bpm · Tax 36,4 °C · SpO2 96%',by:'Paulo Santos',at:ago(70)});
   S.care.push({id:'cr'+uid(),patient:'lr3',date:T,shift:sn,kind:'decubito',value:'Realizada',by:'Mariana Costa',at:ago(40)});}
  S.ltcOcc.push({id:'lo'+uid(),patient:'lr3',at:at(addDays(T,-2),'03:40'),kind:'Queda',desc:'Encontrada sentada ao lado da cama durante a ronda. Consciente, sem queixa de dor no momento.',actions:'Avaliada pela enfermeira de plantão, família e médico comunicados. Grade da cama revisada.',by:'Ana Beatriz Lima',status:'aberta'});
  S.handoff.push({id:'hf'+uid(),at:at(addDays(T,-1),'19:05'),shift:'tarde',by:'Ana Beatriz Lima',text:'Dona Iracema em observação após a queda de anteontem, sem novas queixas. Sr. Benedito recusou a medicação das 8h de ontem; médico ciente. Demais residentes sem intercorrências.'});
  S.handoff.push({id:'hf'+uid(),at:at(T,'07:05'),shift:'noite',by:'Paulo Santos',text:'Noite tranquila. Dona Aurora dormiu bem, sem agitação. Rondas de 2 em 2 horas realizadas.'});

  /* feridas e estomias (registros fictícios de demonstração) */
  const WD=(pid,type,site,stage,days,evals)=>{const w={id:'wd'+uid(),patient:pid,type,site,stage,opened:addDays(T,-days),status:'em_tratamento',origin:'',evals:[]};
    evals.forEach(([d,L,W,D,tis,ex,pain,cov,by],k)=>w.evals.push({id:'we'+uid(),at:at(addDays(T,d),'10:'+pad(10+k*7)),len:L,wid:W,dep:D,tissue:tis,exudate:ex,exType:ex==='Ausente'?'':'Seroso',odor:'Ausente',edges:k<evals.length-1?'Regulares, aderidas':'Regulares, com epitelização',peri:'Íntegra',pain,cover:cov,next:addDays(T,d+3),by,notes:''}));S.wounds.push(w);return w};
  WD('hp1','Lesão por pressão','Região sacral','Estágio 3',42,[[-42,6.0,4.5,1.2,{gran:40,esf:50,nec:10,epi:0},'Moderado',5,'Cobertura conforme protocolo institucional (demo)','Ana Beatriz Lima'],[-28,5.2,4.0,1.0,{gran:60,esf:35,nec:5,epi:0},'Moderado',4,'Cobertura conforme protocolo institucional (demo)','Ana Beatriz Lima'],[-14,4.1,3.2,0.6,{gran:80,esf:15,nec:0,epi:5},'Pouco',3,'Cobertura conforme protocolo institucional (demo)','Paulo Santos'],[0,3.0,2.4,0.3,{gran:80,esf:5,nec:0,epi:15},'Pouco',2,'Cobertura conforme protocolo institucional (demo)','Ana Beatriz Lima']]);
  WD('lr1','Lesão por pressão','Calcâneo direito','Estágio 2',18,[[-18,2.2,2.0,0.1,{gran:70,esf:30,nec:0,epi:0},'Pouco',2,'Cobertura conforme prescrição (demo)','Paulo Santos'],[-6,1.6,1.4,0.1,{gran:70,esf:10,nec:0,epi:20},'Pouco',1,'Cobertura conforme prescrição (demo)','Mariana Costa']]);
  WD('hp2','Úlcera em pé diabético','Hálux esquerdo, face plantar','Não se aplica',30,[[-30,1.8,1.5,0.4,{gran:50,esf:50,nec:0,epi:0},'Moderado',3,'Cobertura conforme prescrição (demo)','Paulo Santos'],[-9,1.9,1.6,0.4,{gran:45,esf:55,nec:0,epi:0},'Moderado',4,'Cobertura conforme prescrição (demo)','Paulo Santos']]);
  S.ostomies.push({id:'os'+uid(),patient:'hp3',type:'Colostomia',site:'Quadrante inferior esquerdo',since:addDays(T,-120),diameter:32,equipment:'Bolsa drenável de uma peça, recorte 35 mm (demo)',status:'ativa',evals:[
    {id:'oe'+uid(),at:at(addDays(T,-15),'15:00'),aspect:'Vermelho vivo, úmido, protruso',peri:'Íntegra',effluent:'Fezes pastosas',diameter:32,change:true,teach:'Familiar orientado sobre recorte da placa e esvaziamento da bolsa.',by:'Paulo Santos'},
    {id:'oe'+uid(),at:at(addDays(T,-1),'10:30'),aspect:'Vermelho vivo, úmido, protruso',peri:'Hiperemia leve às 6h',effluent:'Fezes pastosas',diameter:32,change:true,teach:'Reforçada orientação de recorte justo ao estoma.',by:'Paulo Santos'}]});

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
const patOf=(S,id)=>S.patients.find(x=>x.id===id);
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
const ORGK={units:'Unidade',services:'Setor',equip:'Equipamento',items:'Item de estoque',procCat:'Procedimento'};
const orgList=(S,k)=>S[k];
function orgUses(S,kind,id){const u=[];
  if(kind==='units'){if(S.shifts.some(s=>s.unit===id))u.push('plantões');if(S.lots.some(l=>l.unit===id&&l.qty>0))u.push('estoque');if(S.equip.some(e=>e.unit===id&&!e.archived))u.push('equipamentos');if(S.imm.some(i=>i.unit===id))u.push('aplicações')}
  if(kind==='services'&&S.shifts.some(s=>s.service===id))u.push('plantões');
  if(kind==='equip'&&S.readings.some(r=>r.eq===id))u.push('leituras de temperatura');
  if(kind==='items'&&(S.moves.some(m=>m.item===id)||S.lots.some(l=>l.item===id&&l.qty>0)))u.push('movimentações');
  if(kind==='procCat'){const n=(S.procCat.find(p=>p.id===id)||{}).name;if(S.procs.some(p=>p.type===n))u.push('procedimentos registrados')}
  return u}
const aesCatOf=(S,id)=>S.aesCat.find(x=>x.id===id);const roomOf=(S,id)=>S.rooms.find(x=>x.id===id)||{name:'Sem quarto',beds:[]};
const shiftNow=()=>{const h=new Date().getHours();return h>=7&&h<13?'manha':h>=13&&h<19?'tarde':'noite'};const SHIFTN={manha:'Manhã (7h às 13h)',tarde:'Tarde (13h às 19h)',noite:'Noite (19h às 7h)'};
const CARE={higiene:['Higiene corporal',['Realizada','Realizada com auxílio total','Recusou']],alimentacao:['Alimentação',['Aceitação total','Aceitação parcial','Recusou']],hidratacao:['Hidratação',null,'Ex.: 300 mL'],
  decubito:['Mudança de decúbito',['Realizada']],sinais:['Sinais vitais',null,'Ex.: PA 120/80 mmHg, FC 72 bpm, Tax 36,5 °C'],eliminacoes:['Eliminações',['Diurese presente','Evacuação presente','Sem eliminações no turno']],sono:['Sono e repouso',['Dormiu bem','Sono agitado','Acordado']]};
const WST={em_tratamento:['Em tratamento','amber'],cicatrizada:['Cicatrizada','teal'],encaminhada:['Encaminhada','sky']};
const wArea=e=>e?Math.round(e.len*e.wid*10)/10:0;
const AST2={agendado:['Agendado','sky'],confirmado:['Confirmado','teal'],realizado:['Realizado','p4'],faltou:['Faltou','amber'],cancelado:['Cancelado','neutral']};
const PST={agendado:['Agendado','sky'],realizado:['Aguardando conferência','amber'],conferido:['Conferido','teal'],devolvido:['Devolvido para correção','danger'],nao_realizado:['Não realizado','neutral']};
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
  immunize(S,u,f){need(S,u,'vaccines.apply');const pt=patOf(S,f.patient);if(!pt)throw new Stop('validation','Selecione o paciente.');if(!pt.active)throw new Stop('blocking','Paciente inativo.');
    if(!f.vac||!VAC[f.vac])throw new Stop('validation','Selecione a vacina.');
    const lot=lotOf(S,f.lot);if(!lot||itemOf(S,lot.item).vac!==f.vac)throw new Stop('validation','Selecione o lote utilizado.');
    if(lot.status!=='disponivel')throw new Stop('blocking','Este lote está em avaliação após ocorrência de temperatura e não pode ser usado.');
    if(lot.exp<today())throw new Stop('blocking','Lote vencido. Selecione outro lote.');if(lot.qty<1)throw new Stop('blocking','Lote sem saldo.');
    if(!f.dose)throw new Stop('validation','Informe a dose.');if(!f.via||!f.site)throw new Stop('validation','Informe a via e o local de aplicação.');
    const prof=u.prof||f.prof;if(!prof)throw new Stop('validation','Informe o profissional que aplicou.');
    const W=[];const dup=S.imm.find(i=>i.patient===pt.id&&i.status==='registrado'&&VAC[i.vac]&&VAC[i.vac].g===VAC[f.vac].g&&i.dose===f.dose&&!['Dose anual','Dose por gestação','Dose adicional'].includes(f.dose));
    if(dup)W.push(`Já existe ${f.dose.toLowerCase()} de ${VAC[f.vac].n} registrada em ${D2(dup.at)}. Confira a caderneta.`);
    enforce({blocking:[],warnings:W},f.reason);
    const im={id:'im'+uid(),at:nowIso(),patient:pt.id,vac:f.vac,item:lot.item,lot:lot.id,dose:f.dose,via:f.via,site:f.site,prof,unit:lot.unit,status:'registrado',origin:'aplicada',place:null,strategy:f.strategy||'Rotina',notes:(f.notes||'').trim(),reason:W.length?f.reason:null};
    S.imm.unshift(im);lot.qty-=1;S.moves.unshift({id:uid(),at:im.at,item:lot.item,lot:lot.id,type:'saida',qty:1,reason:`Aplicação em ${pt.name}`,ref:'Vacinação',user:u.name});
    log(S,u,'immunize','vaccine',pt.id,im.reason,`${pt.name}: ${VAC[f.vac].n}, ${f.dose}, lote ${lot.lot}, ${f.via.toLowerCase()}, ${f.site.toLowerCase()}`);
    if(itemQty(S,lot.item)<itemOf(S,lot.item).min)note(S,u,'stock.manage','Estoque baixo',`${itemOf(S,lot.item).name}: ${itemQty(S,lot.item)} doses.`,{page:'estoque'});return im.id;},
  immExternal(S,u,f){need(S,u,'vaccines.apply');const pt=patOf(S,f.patient);if(!pt)throw new Stop('validation','Selecione o paciente.');
    if(!f.vac||!f.dose||!f.date)throw new Stop('validation','Informe vacina, dose e data da aplicação.');if(f.date>today())throw new Stop('validation','A data não pode estar no futuro.');
    if(!(f.place||'').trim())throw new Stop('validation','Informe onde a dose foi aplicada (como consta na caderneta).');
    S.imm.push({id:'im'+uid(),at:at(f.date,'12:00'),patient:pt.id,vac:f.vac,item:null,lot:null,lotText:(f.lotText||'').trim()||null,dose:f.dose,via:VAC[f.vac].via,site:'Não informado',prof:u.prof||null,unit:null,status:'registrado',origin:'externa',place:f.place.trim(),strategy:'Transcrição',notes:'',by:u.name});
    S.imm.sort((a,b)=>b.at.localeCompare(a.at));log(S,u,'imm_external','vaccine',pt.id,null,`${pt.name}: ${VAC[f.vac].n}, ${f.dose}, ${D2(f.date)} (${f.place})`);},
  immunizeCancel(S,u,id,reason){need(S,u,'vaccines.manage');if(!reason.trim())throw new Stop('validation','Informe o motivo do cancelamento.');
    const im=S.imm.find(x=>x.id===id);if(im.status!=='registrado')return;im.status='cancelado';im.cancelReason=reason;const lot=lotOf(S,im.lot);
    if(lot){lot.qty+=1;S.moves.unshift({id:uid(),at:nowIso(),item:im.item,lot:im.lot,type:'estorno',qty:1,reason:`Estorno: ${reason}`,ref:'Vacinação',user:u.name});}
    log(S,u,'immunize_cancel','vaccine',im.patient,reason,`${VAC[im.vac].n}, ${patOf(S,im.patient).name}`);},
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
    S.visits.push({id:'hv'+uid(),...f,status:'agendado',notes:''});log(S,u,'visit','home',f.patient,null,`${S.patients.find(p=>p.id===f.patient).name}, ${D2(f.date)} ${f.start}`);
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
  /* ---------------- organização: editar, organizar e excluir */
  inst(S,u,f){need(S,u,'institution.manage');if((f.name||'').trim().length<3)throw new Stop('validation','Informe o nome da instituição.');
    Object.assign(S.inst,{name:f.name.trim(),type:f.type,city:f.city,cnpj:f.cnpj,phone:f.phone,email:f.email});log(S,u,'org','org',null,null,'Dados da instituição');},
  orgSave(S,u,kind,f){need(S,u,'org.manage');const L=orgList(S,kind);const nm=(f.name||'').trim();if(nm.length<2)throw new Stop('validation','Informe o nome.');
    if(L.some(x=>x.id!==f.id&&!x.archived&&x.name.toLowerCase()===nm.toLowerCase()&&(kind!=='services'||x.unit===f.unit)))throw new Stop('validation','Já existe um cadastro com este nome.');
    if(kind==='equip'&&!(+f.min<+f.max))throw new Stop('validation','A temperatura mínima deve ser menor que a máxima.');
    if(kind==='items'&&!(+f.min>=0))throw new Stop('validation','Informe o estoque mínimo.');
    const clean={...f,name:nm};if(kind==='equip'){clean.min=+f.min;clean.max=+f.max}if(kind==='items'){clean.min=+f.min;clean.lotc=clean.cat==='Vacina'?true:!!clean.lotc}
    if(f.id){const x=L.find(y=>y.id===f.id);Object.assign(x,clean);log(S,u,'org','org',f.id,null,`${ORGK[kind]} editado: ${nm}`);return f.id}
    const id={units:'u',services:'s',equip:'e',items:'it',procCat:'pc'}[kind]+uid();L.push({...clean,id,archived:false});
    if(kind==='items'&&!clean.lotc)S.lots.push({id:'l'+uid(),item:id,lot:'—',exp:addDays(today(),3650),qty:0,unit:S.units[0].id,status:'disponivel'});
    log(S,u,'org','org',id,null,`${ORGK[kind]} criado: ${nm}`);return id;},
  orgMove(S,u,kind,id,dir){need(S,u,'org.manage');const L=orgList(S,kind);const i=L.findIndex(x=>x.id===id);
    const peers=L.map((x,k)=>({x,k})).filter(({x})=>kind!=='services'||x.unit===L[i].unit);const pi=peers.findIndex(p=>p.k===i);const tgt=peers[pi+dir];if(!tgt)return;
    [L[i],L[tgt.k]]=[L[tgt.k],L[i]];log(S,u,'org','org',id,null,`${ORGK[kind]} reordenado: ${L[tgt.k].name}`);},
  orgDelete(S,u,kind,id){need(S,u,'org.manage');const L=orgList(S,kind);const x=L.find(y=>y.id===id);const uses=orgUses(S,kind,id);
    if(kind==='units'&&S.units.filter(y=>!y.archived).length<=1)throw new Stop('blocking','A instituição precisa de pelo menos uma unidade.');
    if(uses.length){x.archived=true;log(S,u,'org_archive','org',id,null,`${ORGK[kind]} arquivado: ${x.name} (${uses.join(', ')})`);return 'archived'}
    L.splice(L.indexOf(x),1);if(kind==='units')S.services=S.services.filter(y=>y.unit!==id);if(kind==='items')S.lots=S.lots.filter(l=>l.item!==id);
    log(S,u,'org_delete','org',id,null,`${ORGK[kind]} excluído: ${x.name}`);return 'deleted';},
  orgRestore(S,u,kind,id){need(S,u,'org.manage');const x=orgList(S,kind).find(y=>y.id===id);x.archived=false;log(S,u,'org','org',id,null,`${ORGK[kind]} restaurado: ${x.name}`);},
  shiftDelete(S,u,id){const s=shiftOf(S,id);need(S,u,'shifts.manage',s.unit);if(s.status!=='rascunho')throw new Stop('blocking','Só rascunhos podem ser excluídos. Plantão publicado deve ser cancelado, para ficar no histórico.');
    S.shifts=S.shifts.filter(x=>x.id!==id);S.asg=S.asg.filter(a=>a.shift!==id);log(S,u,'shift_delete','shift',null,null,label(s));},
  profDelete(S,u,pid){need(S,u,'professionals.manage');const p=profOf(S,pid);
    const hist=S.asg.some(a=>a.prof===pid)||S.imm.some(i=>i.prof===pid)||S.procs.some(x=>x.prof===pid)||S.visits.some(v=>v.prof===pid)||S.users.some(x=>x.prof===pid);
    if(hist)throw new Stop('blocking','Este profissional tem histórico de escalas ou atendimentos. Desative o cadastro para manter a rastreabilidade.');
    S.profs=S.profs.filter(x=>x.id!==pid);S.abs=S.abs.filter(a=>a.prof!==pid);log(S,u,'prof_delete','prof',null,null,p.name);},
  billDelete(S,u,kind,id,reason){need(S,u,'finance.manage');const L=kind==='pay'?S.pay:S.rec;const x=L.find(y=>y.id===id);
    if(kind==='pay'?x.paid:x.received)throw new Stop('blocking','Lançamento já baixado não pode ser excluído.');if(!(reason||'').trim())throw new Stop('validation','Informe o motivo da exclusão.');
    L.splice(L.indexOf(x),1);log(S,u,'bill_delete','finance',null,reason,`${x.desc||x.service}, ${BRL(x.value)}`);},
  oppClose(S,u,id){need(S,u,'talent.manage');const o=S.opps.find(x=>x.id===id);S.opps=S.opps.filter(x=>x.id!==id);log(S,u,'talent','talent',null,null,'Oportunidade encerrada: '+o.title);},
  candRemove(S,u,id){need(S,u,'talent.manage');const c=S.cands.find(x=>x.id===id);S.cands=S.cands.filter(x=>x.id!==id);log(S,u,'talent','talent',null,null,'Removido do banco: '+c.name);},

  /* ---------------- prontuário */
  patientSave(S,u,f){if(!(can(S,u,'records.write')||can(S,u,'vaccines.apply')))throw new Stop('permission','Seu perfil não cadastra pacientes.');
    if((f.name||'').trim().length<3)throw new Stop('validation','Informe o nome completo do paciente.');if(!f.birth)throw new Stop('validation','Informe a data de nascimento.');
    if(f.birth>today())throw new Stop('validation','A data de nascimento não pode estar no futuro.');
    const list=t=>Array.isArray(t)?t:String(t||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean);
    const d={name:f.name.trim(),birth:f.birth,sex:f.sex||'',doc:f.doc||'',phone:f.phone||'',addr:f.addr||'',region:f.region||'',homecare:!!f.homecare,allergies:list(f.allergies),conditions:list(f.conditions),pregnant:!!f.pregnant,guardian:f.guardian||''};
    if(f.id){const p=patOf(S,f.id);Object.assign(p,d);log(S,u,'patient','patient',p.id,null,'Cadastro atualizado: '+p.name);return p.id}
    const id='pt'+uid();S.patients.push({id,...d,active:true,created:today()});log(S,u,'patient','patient',id,null,'Paciente cadastrado: '+d.name);return id;},
  patientActive(S,u,id,v){need(S,u,'records.write');const p=patOf(S,id);p.active=v;log(S,u,'patient','patient',id,null,`${p.name}: ${v?'reativado':'inativado'}`);},
  patientDelete(S,u,id){need(S,u,'org.manage');const p=patOf(S,id);
    if(S.imm.some(i=>i.patient===id)||S.evol.some(e=>e.patient===id)||S.procs.some(x=>x.patient===id)||S.visits.some(v=>v.patient===id))
      throw new Stop('blocking','Paciente com registros clínicos não pode ser excluído: o prontuário deve ser guardado (Lei 13.787/2018). Use “Inativar”.');
    S.patients=S.patients.filter(x=>x.id!==id);log(S,u,'patient_delete','patient',null,null,p.name);},
  recordView(S,u,id){if(!can(S,u,'records.view'))return;const last=S.audit.find(a=>a.action==='record_view'&&a.ref===id&&a.actor===u.name);
    if(last&&Date.now()-new Date(last.at)<10*6e4)return;log(S,u,'record_view','patient',id,null,patOf(S,id).name);},
  record(S,u,f){need(S,u,'records.write');const p=patOf(S,f.patient);if(!p)throw new Stop('validation','Paciente não encontrado.');
    if((f.text||'').trim().length<10)throw new Stop('validation','Descreva o atendimento (mínimo de 10 caracteres).');
    const pr=u.prof&&profOf(S,u.prof);S.evol.push({id:'ev'+uid(),patient:p.id,at:nowIso(),author:u.name,cat:pr?CAT[pr.cat]:ROLE[u.role],kind:f.kind||'Evolução de enfermagem',text:f.text.trim(),addenda:[]});
    log(S,u,'record','patient',p.id,null,`${f.kind||'Evolução'}: ${p.name}`);},
  addendum(S,u,id,text){need(S,u,'records.write');const e=S.evol.find(x=>x.id===id);if(e.author!==u.name)throw new Stop('permission','Só quem registrou pode acrescentar adendo. Registre uma nova evolução.');
    if((text||'').trim().length<5)throw new Stop('validation','Escreva o adendo.');e.addenda.push({at:nowIso(),text:text.trim()});log(S,u,'addendum','patient',e.patient,null,patOf(S,e.patient).name);},

  /* ---------------- procedimentos */
  procAssign(S,u,f){if(!(can(S,u,'procedures.verify')||can(S,u,'homecare.manage')))throw new Stop('permission','Seu perfil não agenda procedimentos.');
    if(!f.patient||!f.type||!f.prof||!f.date||!f.start)throw new Stop('validation','Preencha paciente, procedimento, profissional, data e horário.');
    const x={id:'pr'+uid(),patient:f.patient,type:f.type,unit:f.unit||'u1',date:f.date,start:f.start,prof:f.prof,status:'agendado',notes:'',assignedBy:u.name,created:nowIso(),doneAt:null,verifiedBy:null,returnNote:null};
    S.procs.push(x);log(S,u,'proc_assign','proc',f.patient,null,`${f.type}: ${patOf(S,f.patient).name}, ${D2(f.date)} ${f.start}`);
    noteProf(S,u,f.prof,'Procedimento agendado para você',`${f.type}, ${patOf(S,f.patient).name}, ${D2(f.date)} às ${f.start}. Confirme a realização na Minha área.`);return x.id;},
  procRegister(S,u,f){need(S,u,'procedures.register');if(!u.prof)throw new Stop('permission','Apenas profissionais registram procedimentos realizados.');
    if(!f.patient||!f.type)throw new Stop('validation','Selecione paciente e procedimento.');if((f.notes||'').trim().length<5)throw new Stop('validation','Descreva o que foi realizado.');
    const n=new Date();S.procs.push({id:'pr'+uid(),patient:f.patient,type:f.type,unit:f.unit||'u1',date:today(),start:hm(n.toISOString()),prof:u.prof,status:'realizado',notes:f.notes.trim(),assignedBy:null,created:nowIso(),doneAt:nowIso(),verifiedBy:null,returnNote:null});
    log(S,u,'proc_done','proc',f.patient,null,`${f.type}: ${patOf(S,f.patient).name}`);note(S,u,'procedures.verify','Procedimento aguardando conferência',`${u.name}: ${f.type}, ${patOf(S,f.patient).name}`,{page:'procedimentos'});},
  procDone(S,u,id,notes){const x=S.procs.find(y=>y.id===id);if(!x||x.prof!==u.prof)throw new Stop('permission','Procedimento não encontrado na sua lista.');
    if(!['agendado','devolvido'].includes(x.status))throw new Stop('validation','Este procedimento já foi registrado.');if((notes||'').trim().length<5)throw new Stop('validation','Descreva o que foi realizado.');
    x.status='realizado';x.notes=notes.trim();x.doneAt=nowIso();log(S,u,'proc_done','proc',x.patient,null,`${x.type}: ${patOf(S,x.patient).name}`);
    note(S,u,'procedures.verify','Procedimento aguardando conferência',`${u.name}: ${x.type}, ${patOf(S,x.patient).name}`,{page:'procedimentos'});},
  procNot(S,u,id,reason){const x=S.procs.find(y=>y.id===id);if(!x||x.prof!==u.prof)throw new Stop('permission','Procedimento não encontrado na sua lista.');
    if(!(reason||'').trim())throw new Stop('validation','Informe por que não foi realizado.');x.status='nao_realizado';x.notes=reason.trim();x.doneAt=nowIso();
    log(S,u,'proc_not','proc',x.patient,reason,`${x.type}: ${patOf(S,x.patient).name}`);note(S,u,'procedures.verify','Procedimento não realizado',`${u.name}: ${x.type}, ${patOf(S,x.patient).name}. ${reason}`,{page:'procedimentos'});},
  procVerify(S,u,id,ok,txt){need(S,u,'procedures.verify');const x=S.procs.find(y=>y.id===id);if(!['realizado','nao_realizado'].includes(x.status))throw new Stop('validation','Nada para conferir neste procedimento.');
    if(!ok&&!(txt||'').trim())throw new Stop('validation','Diga o que precisa ser corrigido.');
    x.status=ok?'conferido':'devolvido';x.verifiedBy=u.name;x.verifiedAt=nowIso();x.returnNote=ok?null:txt.trim();
    log(S,u,ok?'proc_ok':'proc_back','proc',x.patient,ok?null:txt,`${x.type}: ${patOf(S,x.patient).name}`);
    noteProf(S,u,x.prof,ok?'Procedimento conferido':'Procedimento devolvido para correção',`${x.type}, ${patOf(S,x.patient).name}${ok?'':'. '+txt}`);},
  /* ---------------- enfermagem estética */
  aesAppt(S,u,f){need(S,u,'aesthetic.manage');if(!f.patient||!f.cat||!f.prof||!f.date||!f.start)throw new Stop('validation','Preencha cliente, procedimento, profissional, data e horário.');
    const c=S.aesCat.find(x=>x.id===f.cat);const end=m=>{const[h,mi]=m.split(':').map(Number);const t=h*60+mi+c.dur;return pad(Math.floor(t/60))+':'+pad(t%60)};
    const clash=S.aesAppts.find(a=>a.prof===f.prof&&a.date===f.date&&!['cancelado','faltou'].includes(a.status)&&a.start<end(f.start)&&end(a.start)>f.start);
    if(clash)throw new Stop('blocking',`${profOf(S,f.prof).name} já tem atendimento às ${clash.start} neste dia.`);
    const pkg=S.aesPkgs.find(k=>k.patient===f.patient&&k.cat===f.cat&&k.status==='ativo');
    S.aesAppts.push({id:'aa'+uid(),patient:f.patient,cat:f.cat,date:f.date,start:f.start,prof:f.prof,status:'agendado',pkg:pkg?pkg.id:null,consent:false,notes:'',products:'',doneAt:null});
    log(S,u,'aes_appt','aes',f.patient,null,`${c.name}: ${patOf(S,f.patient).name}, ${D2(f.date)} ${f.start}`);noteProf(S,u,f.prof,'Novo atendimento de estética',`${c.name}, ${patOf(S,f.patient).name}, ${D2(f.date)} às ${f.start}`);},
  aesStatus(S,u,id,st){const a=S.aesAppts.find(x=>x.id===id);if(!(can(S,u,'aesthetic.manage')||(u.prof===a.prof&&can(S,u,'aesthetic.perform'))))throw new Stop('permission','Sem permissão.');
    a.status=st;log(S,u,'aes_status','aes',a.patient,null,`${aesCatOf(S,a.cat).name}: ${patOf(S,a.patient).name}, ${{confirmado:'confirmado',cancelado:'cancelado',faltou:'falta registrada'}[st]||st}`);},
  aesAnam(S,u,pid,f){if(!(can(S,u,'aesthetic.perform')||can(S,u,'aesthetic.manage')))throw new Stop('permission','Sem permissão.');if(!(f.complaint||'').trim())throw new Stop('validation','Informe a queixa principal.');
    patOf(S,pid).aes={at:today(),complaint:f.complaint.trim(),reported:(f.reported||'').trim(),notes:(f.notes||'').trim()};log(S,u,'aes_anam','aes',pid,null,patOf(S,pid).name);},
  aesSession(S,u,id,f){need(S,u,'aesthetic.perform');const a=S.aesAppts.find(x=>x.id===id);const pt=patOf(S,a.patient);
    if(!['agendado','confirmado'].includes(a.status))throw new Stop('validation','Este atendimento não está em aberto.');
    if(!pt.aes)throw new Stop('blocking','Registre a anamnese estética do cliente antes da primeira sessão.');
    if(!f.consent)throw new Stop('blocking','Confirme que o termo de consentimento foi assinado pelo cliente.');
    if((f.notes||'').trim().length<10)throw new Stop('validation','Descreva a sessão (mínimo de 10 caracteres).');
    a.status='realizado';a.consent=true;a.notes=f.notes.trim();a.products=(f.products||'').trim();a.doneAt=nowIso();a.by=u.name;
    const k=a.pkg&&S.aesPkgs.find(x=>x.id===a.pkg);if(k){k.used=Math.min(k.total,k.used+1);if(k.used>=k.total)k.status='concluido'}
    log(S,u,'aes_session','aes',pt.id,null,`${aesCatOf(S,a.cat).name}: ${pt.name}${k?` (sessão ${k.used} de ${k.total})`:''}`);},
  aesPkg(S,u,f){need(S,u,'aesthetic.manage');const c=aesCatOf(S,f.cat);if(!f.patient||!c)throw new Stop('validation','Selecione cliente e procedimento.');
    const n=Math.max(1,Math.round(+f.total||0)),v=+String(f.price).replace(/\./g,'').replace(',','.');if(!v||v<=0)throw new Stop('validation','Informe o valor do pacote.');
    if(S.aesPkgs.some(k=>k.patient===f.patient&&k.cat===f.cat&&k.status==='ativo'))throw new Stop('validation','Este cliente já tem um pacote ativo deste procedimento.');
    S.aesPkgs.push({id:'pk'+uid(),patient:f.patient,cat:f.cat,total:n,used:0,price:v,created:today(),status:'ativo'});
    S.rec.push({id:'rc'+uid(),payer:patOf(S,f.patient).name,service:`Pacote ${c.name} (${n} sessões)`,value:v,issued:today(),due:f.due||today(),received:null});
    log(S,u,'aes_pkg','aes',f.patient,null,`${c.name}, ${n} sessões, ${BRL(v)}`);},
  aesCatSave(S,u,f){need(S,u,'aesthetic.manage');if((f.name||'').trim().length<3)throw new Stop('validation','Informe o nome do procedimento.');
    const d={name:f.name.trim(),dur:Math.max(10,+f.dur||30),price:+String(f.price).replace(',','.')||0,sessions:Math.max(1,+f.sessions||1)};
    if(f.id)Object.assign(aesCatOf(S,f.id),d);else S.aesCat.push({id:'ae'+uid(),...d,c:S.aesCat.length%6+1,archived:false});log(S,u,'aes_cat','aes',null,null,d.name);},
  aesCatDel(S,u,id){need(S,u,'aesthetic.manage');const c=aesCatOf(S,id);if(S.aesAppts.some(a=>a.cat===id)){c.archived=true;log(S,u,'aes_cat','aes',null,null,'Arquivado: '+c.name);return 'archived'}
    S.aesCat=S.aesCat.filter(x=>x.id!==id);log(S,u,'aes_cat','aes',null,null,'Excluído: '+c.name);return 'deleted';},
  /* ---------------- longa permanência */
  ltcAdmit(S,u,f){need(S,u,'ltc.manage');const p=patOf(S,f.patient);if(!p)throw new Stop('validation','Selecione o residente.');if(!f.room||!f.bed)throw new Stop('validation','Escolha quarto e leito.');
    if(S.patients.some(x=>x.ltc&&x.ltc.active&&x.id!==p.id&&x.ltc.room===f.room&&x.ltc.bed===f.bed))throw new Stop('blocking','Este leito está ocupado.');
    if(!['1','2','3',1,2,3].includes(f.grau))throw new Stop('validation','Informe o grau de dependência.');
    const was=p.ltc&&p.ltc.active;p.ltc={room:f.room,bed:f.bed,grau:+f.grau,admitted:was?p.ltc.admitted:(f.date||today()),contact:f.contact||'',diet:f.diet||'Dieta geral',active:true};
    log(S,u,'ltc_admit','ltc',p.id,null,`${p.name}: ${roomOf(S,f.room).name}, leito ${f.bed}, grau ${f.grau}`);},
  ltcDischarge(S,u,pid,reason){need(S,u,'ltc.manage');if(!(reason||'').trim())throw new Stop('validation','Informe o motivo da saída.');const p=patOf(S,pid);
    p.ltc.active=false;p.ltc.left=today();p.ltc.leftReason=reason;S.rx.filter(r=>r.patient===pid&&r.active).forEach(r=>{r.active=false;r.end=today()});log(S,u,'ltc_discharge','ltc',pid,reason,p.name);},
  ltcRx(S,u,f){need(S,u,'ltc.manage');if(!f.patient||!(f.drug||'').trim()||!(f.dose||'').trim()||!f.route)throw new Stop('validation','Preencha residente, medicamento, dose e via.');
    const times=(f.times||'').split(/[,; ]+/).map(t=>t.trim()).filter(Boolean);if(!times.length||times.some(t=>!/^\d{2}:\d{2}$/.test(t)))throw new Stop('validation','Informe os horários no formato 08:00, 20:00.');
    if(!(f.prescriber||'').trim())throw new Stop('validation','Informe o prescritor e o registro do conselho.');
    S.rx.push({id:'rx'+uid(),patient:f.patient,drug:f.drug.trim(),dose:f.dose.trim(),route:f.route,times:times.sort(),prescriber:f.prescriber.trim(),start:today(),end:null,active:true,notes:(f.notes||'').trim(),by:u.name});
    log(S,u,'ltc_rx','ltc',f.patient,null,`${f.drug}, ${f.dose}, ${times.join(' ')}`);},
  ltcRxStop(S,u,id,reason){need(S,u,'ltc.manage');if(!(reason||'').trim())throw new Stop('validation','Informe o motivo da suspensão.');const r=S.rx.find(x=>x.id===id);r.active=false;r.end=today();r.stopReason=reason;log(S,u,'ltc_rx_stop','ltc',r.patient,reason,r.drug);},
  ltcMar(S,u,rxid,time,st,txt){need(S,u,'ltc.care');const r=S.rx.find(x=>x.id===rxid);const T=today();
    if(S.mar.some(m=>m.rx===rxid&&m.date===T&&m.time===time))throw new Stop('validation','Este horário já foi registrado.');
    if(st!=='administrado'&&!(txt||'').trim())throw new Stop('validation','Informe o motivo.');
    S.mar.push({id:'mr'+uid(),rx:rxid,patient:r.patient,date:T,time,status:st,note:(txt||'').trim(),by:u.name,at:nowIso()});
    log(S,u,'ltc_mar','ltc',r.patient,txt||null,`${r.drug} ${time}: ${st.replace('_',' ')}`);
    if(st!=='administrado')note(S,u,'ltc.manage','Medicação não administrada',`${patOf(S,r.patient).name}: ${r.drug} das ${time}. ${txt}`,{page:'ilpi'});},
  ltcCare(S,u,f){need(S,u,'ltc.care');if(!f.patient||!f.kind||!(f.value||'').trim())throw new Stop('validation','Informe o registro.');
    S.care.push({id:'cr'+uid(),patient:f.patient,date:today(),shift:shiftNow(),kind:f.kind,value:f.value.trim(),by:u.name,at:nowIso()});log(S,u,'ltc_care','ltc',f.patient,null,`${CARE[f.kind][0]}: ${f.value}`);},
  ltcOccAdd(S,u,f){need(S,u,'ltc.care');if(!f.patient||!f.kind||(f.desc||'').trim().length<10)throw new Stop('validation','Informe residente, tipo e descrição (mínimo de 10 caracteres).');
    S.ltcOcc.unshift({id:'lo'+uid(),patient:f.patient,at:nowIso(),kind:f.kind,desc:f.desc.trim(),actions:(f.actions||'').trim(),by:u.name,status:'aberta'});
    log(S,u,'ltc_occ','ltc',f.patient,null,`${f.kind}: ${patOf(S,f.patient).name}`);note(S,u,'ltc.manage','Intercorrência na longa permanência',`${f.kind}: ${patOf(S,f.patient).name}`,{page:'ilpi'});},
  ltcOccClose(S,u,id,txt){need(S,u,'ltc.manage');if(!(txt||'').trim())throw new Stop('validation','Descreva o desfecho.');const o=S.ltcOcc.find(x=>x.id===id);o.status='encerrada';o.outcome=txt.trim();o.closedBy=u.name;log(S,u,'ltc_occ_close','ltc',o.patient,txt,o.kind);},
  ltcHandoff(S,u,txt){need(S,u,'ltc.care');if((txt||'').trim().length<15)throw new Stop('validation','Escreva a passagem de plantão (mínimo de 15 caracteres).');
    S.handoff.unshift({id:'hf'+uid(),at:nowIso(),shift:shiftNow(),by:u.name,text:txt.trim()});log(S,u,'ltc_handoff','ltc',null,null,SHIFTN[shiftNow()]);},
  ltcRooms(S,u,rooms){need(S,u,'ltc.manage');S.rooms=rooms;log(S,u,'ltc_room','ltc',null,null,`${rooms.length} quartos, ${rooms.reduce((t,r)=>t+r.beds.length,0)} leitos`);},
  /* ---------------- feridas e estomias */
  woundAdd(S,u,f){need(S,u,'wounds.manage');if(!f.patient||!f.type||!(f.site||'').trim())throw new Stop('validation','Informe paciente, tipo e localização da lesão.');
    const w={id:'wd'+uid(),patient:f.patient,type:f.type,site:f.site.trim(),stage:f.stage||'Não se aplica',opened:f.opened||today(),status:'em_tratamento',origin:(f.origin||'').trim(),evals:[]};S.wounds.push(w);
    log(S,u,'wound_add','wound',f.patient,null,`${f.type}, ${f.site}: ${patOf(S,f.patient).name}`);return w.id;},
  woundEval(S,u,id,f){need(S,u,'wounds.manage');const w=S.wounds.find(x=>x.id===id);const n=k=>+String(f[k]||'').replace(',','.');
    if(!(n('len')>0&&n('wid')>0))throw new Stop('validation','Informe comprimento e largura em centímetros.');
    const tis={gran:+f.gran||0,esf:+f.esf||0,nec:+f.nec||0,epi:+f.epi||0};const tot=tis.gran+tis.esf+tis.nec+tis.epi;if(tot!==100)throw new Stop('validation',`A soma dos tecidos precisa dar 100% (está em ${tot}%).`);
    if(!(f.cover||'').trim())throw new Stop('validation','Informe a cobertura ou o curativo realizado, conforme a prescrição.');
    w.evals.push({id:'we'+uid(),at:nowIso(),len:n('len'),wid:n('wid'),dep:n('dep')||0,tissue:tis,exudate:f.exudate,exType:f.exType||'',odor:f.odor,edges:f.edges||'',peri:f.peri||'',pain:+f.pain||0,cover:f.cover.trim(),next:f.next||'',by:u.name,notes:(f.notes||'').trim()});
    if(f.stage)w.stage=f.stage;log(S,u,'wound_eval','wound',w.patient,null,`${w.type}, ${w.site}: ${(n('len')*n('wid')).toFixed(1).replace('.',',')} cm²`);},
  woundStatus(S,u,id,st,txt){need(S,u,'wounds.manage');const w=S.wounds.find(x=>x.id===id);if(!(txt||'').trim())throw new Stop('validation','Registre a observação.');w.status=st;w.closed=today();w.closeNote=txt.trim();log(S,u,'wound_status','wound',w.patient,txt,`${w.type}: ${WST[st][0].toLowerCase()}`);},
  ostomyAdd(S,u,f){need(S,u,'wounds.manage');if(!f.patient||!f.type)throw new Stop('validation','Informe paciente e tipo de estomia.');
    S.ostomies.push({id:'os'+uid(),patient:f.patient,type:f.type,site:(f.site||'').trim(),since:f.since||today(),diameter:+f.diameter||null,equipment:(f.equipment||'').trim(),status:'ativa',evals:[]});log(S,u,'ostomy_add','wound',f.patient,null,f.type);},
  ostomyEval(S,u,id,f){need(S,u,'wounds.manage');const o=S.ostomies.find(x=>x.id===id);if(!f.aspect||!f.peri)throw new Stop('validation','Informe o aspecto do estoma e da pele periestomal.');
    o.evals.push({id:'oe'+uid(),at:nowIso(),aspect:f.aspect,peri:f.peri,effluent:(f.effluent||'').trim(),diameter:+f.diameter||o.diameter,change:!!f.change,teach:(f.teach||'').trim(),by:u.name});if(+f.diameter)o.diameter=+f.diameter;
    log(S,u,'ostomy_eval','wound',o.patient,null,`${o.type}: ${patOf(S,o.patient).name}`);},
  /* ---------------- ponto do plantão */
  punch(S,u,aid,kind){const a=A.myAsg(S,u,aid),s=shiftOf(S,a.shift);if(a.status!=='confirmado')throw new Stop('validation','Confirme a presença antes de registrar o ponto.');
    const now=Date.now(),st=+new Date(s.start),en=+new Date(s.end);
    if(kind==='in'){if(a.inAt)throw new Stop('validation','Entrada já registrada.');if(now<st-60*6e4||now>en)throw new Stop('validation','A entrada pode ser registrada a partir de 1 hora antes do início até o fim do plantão.');a.inAt=nowIso();}
    else{if(!a.inAt)throw new Stop('validation','Registre a entrada primeiro.');if(a.outAt)throw new Stop('validation','Saída já registrada.');a.outAt=nowIso();}
    log(S,u,kind==='in'?'checkin':'checkout','asg',s.id,null,`${u.name}, ${label(s)}`);},

};

/* ------------------------------------------------------------------ armazenamento */
const SKEY='medlink-demo-v5',UKEY='medlink-demo-user3',TKEY='medlink-theme';
const load=()=>{try{const s=JSON.parse(localStorage.getItem(SKEY));if(s&&s.v===5)return s}catch(e){}return null};
const save=s=>{try{localStorage.setItem(SKEY,JSON.stringify(s))}catch(e){}};
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
