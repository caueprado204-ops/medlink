/* ------------------------------------------------------------------ app */
const GROUPS=[
  {id:'inicio',label:'Início',icon:'dash',items:[['inicio','Visão geral',null]]},
  {id:'escalas',label:'Escalas',icon:'cal',items:[['escalas','Calendário','shifts.view'],['solicitacoes','Solicitações','requests.decide'],['gerar','Gerar escala','shifts.manage']]},
  {id:'pessoas',label:'Pessoas',icon:'users',items:[['profissionais','Profissionais','professionals.view'],['talentos','Banco de talentos','talent.manage'],['equipe','Equipe e acessos','members.manage']]},
  {id:'operacao',label:'Operação',icon:'syringe',items:[['vacinacao','Vacinação','vaccines.view'],['estoque','Estoque','stock.view'],['temperatura','Temperatura','coldchain.view'],['homecare','Home care','homecare.view']]},
  {id:'financeiro',label:'Financeiro',icon:'wallet',items:[['pagar','Contas a pagar','finance.view'],['receber','Contas a receber','finance.view'],['relatorios','Relatórios','reports.view']]},
  {id:'sistema',label:'Sistema',icon:'gear',items:[['auditoria','Auditoria','audit.view'],['configuracoes','Configurações','institution.manage'],['notificacoes','Notificações',null]]},
  {id:'meu',label:'Minha área',icon:'user',items:[['meu','Minha área',null]],prof:true},
  {id:'manual',label:'Manual',icon:'book',items:[['manual','Manual de uso',null]]}];
const isManager=(S,u)=>u.role!=='prof';
function navFor(S,u){return GROUPS.map(g=>{
  if(g.prof&&!u.prof)return null;
  if(g.id==='inicio'&&!isManager(S,u))return null;
  const items=g.items.filter(([,,p])=>!p||can(S,u,p));return items.length?{...g,items}:null}).filter(Boolean)}
const groupOf=page=>{const p=page==='prof'?'profissionais':page;return (GROUPS.find(g=>g.items.some(i=>i[0]===p))||GROUPS[0]).id};

function App(){
  const [S,setS]=useState(()=>load()||seed());
  const [uidv,setUid]=useState(()=>{const v=lsGet(UKEY);return ['ana','marcos','helena','carla','paulo'].includes(v)?v:null});
  const [route,setRoute]=useState(()=>uidv?'app':'landing');
  const [page,setPage]=useState({page:'inicio'});
  const [picker,setPicker]=useState(false);
  const [theme,setThemeS]=useState(()=>lsGet(TKEY)||'system');
  const [toasts,setToasts]=useState([]);
  const u=S.users.find(x=>x.id===uidv)||null;
  useEffect(()=>save(S),[S]);
  useEffect(()=>{if(u&&page.page==='inicio'&&!isManager(S,u))setPage({page:'meu'})},[uidv]);
  const setTheme=t=>{setThemeS(t);lsSet(TKEY,t);if(t==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t)};
  const toast=(msg,tone='ok')=>{const id=uid();setToasts(t=>[...t,{id,msg,tone}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),tone==='error'?6000:3400)};
  const run=(fn,msg)=>{try{const D=structuredClone(S);const r=fn(D,u);setS(D);if(msg)toast(typeof msg==='function'?msg(r):msg);return{ok:true,data:r}}
    catch(e){if(e instanceof Stop){if(!e.checks)toast(e.msg,'error');return{ok:false,kind:e.kind,msg:e.msg,checks:e.checks}}console.error(e);toast('Algo deu errado nesta ação.','error');return{ok:false}}};
  const go=p=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'})};
  const login=id=>{lsSet(UKEY,id);setUid(id);const usr=S.users.find(x=>x.id===id);setPage({page:usr.role==='prof'?'meu':'inicio'});setRoute('app');setPicker(false);window.scrollTo(0,0)};
  const logout=()=>{lsSet(UKEY,null);setUid(null);setRoute('landing');window.scrollTo(0,0)};
  const reset=()=>{setS(seed());toast('Demonstração reiniciada com os dados originais.')};
  const value={S,u,run,toast,go,page,login,logout,reset,theme,setTheme,openPicker:()=>setPicker(true),setRoute};
  return html`<${Ctx.Provider} value=${value}>
    ${route==='app'&&u?html`<${Shell}/>`:route==='manual'?html`<${PublicManual}/>`:html`<${Landing}/>`}
    <${ProfilePicker} open=${picker} onClose=${()=>setPicker(false)}/>
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2">
      ${toasts.map(t=>html`<div key=${t.id} role=${t.tone==='error'?'alert':'status'} className="anim pointer-events-auto flex items-start gap-3 rounded-[20px] bg-navy px-4 py-3 text-sm text-onnavy shadow-2xl">
        <span className=${cx('grid h-6 w-6 shrink-0 place-items-center rounded-full',t.tone==='error'?'bg-danger text-white':'bg-lime text-onlime')}><${Icon} n=${t.tone==='error'?'x':'check'} s=${14}/></span><span className="pt-0.5">${t.msg}</span></div>`)}
    </div><//>`;
}

/* ------------------------------------------------------------------ apresentação */
const Squiggle=({className,d})=>html`<svg viewBox="0 0 200 140" className=${className} fill="none" aria-hidden="true"><path className="draw" d=${d} stroke="rgb(var(--c-lime))" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/></svg>`;
const SQ1='M20 110 C 60 20, 120 140, 150 60 S 120 10, 100 40 M150 60 l 26 -8 M150 60 l 4 26';
const SQ2='M10 30 C 60 90, 110 -10, 150 60 C 170 95, 140 120, 120 100 M150 60 l 24 -2 M150 60 l -8 24';
const Arrow=({className})=>html`<svg viewBox="0 0 120 60" className=${className} fill="none" aria-hidden="true"><path d="M8 40 C 30 6, 60 56, 84 22 M84 22 l 18 4 M84 22 l -2 18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg>`;
const MODULES=[
  ['cal','Calendário de escalas','Dia, semana, mês e lista, com arrastar e soltar.'],['wand','Gerar escala','Proposta automática que respeita descanso, férias e categoria.'],
  ['inbox','Solicitações','Substituições e candidaturas com aprovação e substituto validado.'],['user','Área do profissional','Confirmar presença, pedir troca e informar disponibilidade.'],
  ['users','Profissionais','Cadastro, conselho, competências e validação.'],['star','Banco de talentos','Convide profissionais e acompanhe a seleção.'],
  ['syringe','Vacinação','Registro de aplicação ligado ao lote e baixa automática no estoque.'],['box','Estoque','Lotes, validades, entradas, saídas, perdas e alertas.'],
  ['thermo','Temperatura','Leituras da rede de frio e ocorrências com avaliação técnica.'],['home','Home care','Agenda domiciliar por profissional, paciente e região.'],
  ['wallet','Financeiro','Contas a pagar e a receber com vencidos e baixas.'],['chart','Relatórios','Cobertura, horas, custos e aplicações em gráficos.'],
  ['hist','Auditoria','Quem fez o quê, quando e por qual motivo.'],['shield','Perfis e permissões','Acesso por função e por unidade.'],['bell','Notificações','Avisos de vaga descoberta, trocas e alertas.']];

function LandingNav({dark}){
  const {openPicker,setRoute}=useApp();
  return html`<header className="relative z-20 mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-4 py-5 sm:px-8">
    <button onClick=${()=>{setRoute('landing');window.scrollTo(0,0)}} aria-label="Início"><${Logo} onDark=${dark}/></button>
    <nav className="order-3 flex w-full justify-center gap-2 sm:order-none sm:ml-auto sm:mr-auto sm:w-auto">
      ${[['Módulos','#modulos'],['Como funciona','#como'],['Perfis','#perfis']].map(([l,h])=>html`<a key=${l} href=${h} onClick=${()=>setRoute('landing')} className=${cx('rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition',dark?'border-white/50 text-white hover:bg-white hover:text-[#1c3ee4]':'border-line hover:bg-panel2')}>${l}</a>`)}
      <button onClick=${()=>{setRoute('manual');window.scrollTo(0,0)}} className=${cx('rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition',dark?'border-white/50 text-white hover:bg-white hover:text-[#1c3ee4]':'border-line hover:bg-panel2')}>Manual</button></nav>
    <div className="ml-auto flex items-center gap-2 sm:ml-0"><${ThemeToggle} className=${dark?'bg-white/15':'bg-panel2'}/>
      <button onClick=${openPicker} className=${cx('h-10 rounded-full border-2 px-5 text-sm font-bold transition',dark?'border-white text-white hover:bg-white hover:text-[#1c3ee4]':'border-navy hover:bg-navy hover:text-onnavy')}>Entrar na demo</button></div></header>`;
}
function Landing(){
  const {S,openPicker,login}=useApp();
  return html`<div className="min-h-screen bg-panel">
    <section className="relative overflow-hidden rounded-b-[40px] bg-cobalt text-white">
      <div className="grid-bg absolute inset-0"></div>
      <${LandingNav} dark/>
      <div className="relative z-10 mx-auto max-w-[1240px] px-4 pb-24 pt-6 sm:px-8 sm:pb-32">
        <h1 className="display relative text-center text-[17vw] sm:text-[12vw] xl:text-[150px]">
          <span className="block"><span className="text-lime">#</span>ESCALA</span><span className="block">SEM FURO</span><span className="block">NA SAÚDE</span></h1>
        <${Squiggle} d=${SQ1} className="pointer-events-none absolute left-[2%] top-[4%] w-[22%] max-w-[220px] -rotate-12"/>
        <${Squiggle} d=${SQ2} className="pointer-events-none absolute right-[4%] top-[34%] w-[20%] max-w-[200px]"/>
        <div className="floaty glass absolute left-[6%] top-[52%] hidden w-[210px] rounded-[26px] p-4 sm:block" style=${{'--r':'-6deg'}}>
          <div className="flex items-center gap-3"><${Avatar} name="Carla Mendes" size=${44}/><div><p className="font-bold leading-tight">Carla Mendes</p><p className="text-xs text-white/80">Técnica de enfermagem</p></div></div>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-xs font-bold text-onlime"><${Icon} n="check" s=${12}/>Presença confirmada</p></div>
        <div className="floaty glass absolute right-[9%] top-[6%] hidden w-[200px] rounded-[26px] p-4 md:block" style=${{'--r':'7deg',animationDelay:'1.2s'}}>
          <p className="text-xs text-white/80">Vaga de sexta, 07:00</p><p className="display-n mt-1 text-2xl">COBERTA</p><p className="mt-1 text-xs text-white/80">substituta validada pelas regras</p></div>
        <p className="mx-auto mt-8 max-w-xl text-center text-[17px] text-white/90">Escalas, equipes, vacinação, estoque, temperatura, home care e financeiro em um só painel, para clínicas de vacinação, clínicas e empresas de home care.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick=${openPicker} className="h-12 rounded-full bg-lime px-7 font-bold text-onlime transition hover:brightness-95">Experimentar a demonstração</button>
          <a href="#modulos" className="grid h-12 place-items-center rounded-full border-2 border-white px-7 font-bold transition hover:bg-white hover:text-[#1c3ee4]">Ver módulos</a></div>
        <button onClick=${openPicker} aria-label="Entrar na demonstração" className="absolute bottom-6 right-4 grid h-32 w-32 place-items-center rounded-full bg-lime text-onlime transition hover:scale-105 sm:right-10 sm:h-36 sm:w-36">
          <svg viewBox="0 0 100 100" className="spin absolute inset-0 h-full w-full" aria-hidden="true"><defs><path id="circ" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0"/></defs><text fontSize="10.5" fontWeight="800" letterSpacing="2.2" fill="currentColor" style=${{fontFamily:'var(--font-display)'}}><textPath href="#circ">ENTRAR NA DEMO • ENTRAR NA DEMO • </textPath></text></svg>
          <${Arrow} className="h-10 w-12"/></button>
      </div></section>

    <section id="como" className="mx-auto max-w-[1240px] px-4 py-16 sm:px-8">
      <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        ${[['MONTE A ESCALA','arraste, duplique e repita plantões',html`<div className="mt-auto flex items-center gap-2 rounded-[20px] bg-cobalt p-3 text-white"><${Avatar} name="Paulo Santos" size=${34}/><span className="text-sm font-bold">13:00–19:00</span><span className="ml-auto rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-onlime">Publicado</span></div>`],
           ['VALIDE AS REGRAS','descanso, férias, categoria e carga semanal',html`<div className="mt-auto space-y-2"><p className="flex items-center gap-2 rounded-full bg-dangerbg px-3 py-1.5 text-xs font-bold text-danger"><${Icon} n="ban" s=${12}/>Sobrepõe outro plantão</p><p className="flex items-center gap-2 rounded-full bg-amberbg px-3 py-1.5 text-xs font-bold text-amber"><${Icon} n="alert" s=${12}/>Descanso menor que 11h</p></div>`],
           ['ACOMPANHE TUDO','confirmações, trocas, estoque e auditoria',html`<div className="mt-auto rounded-[22px] bg-lime px-4 py-3 text-onlime"><p className="text-xs font-bold">Cobertura da semana</p><p className="thin text-[34px] leading-none">94%</p><p className="text-[11px]">exemplo da demonstração</p></div>`]]
          .map(([t,s,ui],i)=>html`<${Fragment} key=${t}>
            <div className="flex min-h-[260px] flex-col rounded-[30px] bg-panel2 p-6 text-center"><h3 className="display text-[30px]">${t}</h3><p className="mt-2 text-sm text-soft">${s}</p><div className="mt-6 flex flex-1 flex-col">${ui}</div></div>
            ${i<2&&html`<${Arrow} className="mx-auto hidden h-10 w-14 self-center text-ink md:block"/>`}<//>`)}
      </div></section>

    <section id="modulos" className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><h2 className="display text-[44px] sm:text-[64px]">${MODULES.length} MÓDULOS,<br/><span className="text-cobalt">UM PAINEL</span></h2>
        <p className="max-w-md text-soft">Cada função tem sua própria tela. Você ativa os módulos que a instituição usa e cada perfil vê só o que precisa.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">${MODULES.map(([ic,t,d],i)=>html`<button key=${t} onClick=${openPicker} className=${cx('group flex flex-col rounded-[26px] p-5 text-left transition hover:-translate-y-1',i===1?'bg-lime text-onlime':'bg-panel2 hover:bg-navy hover:text-onnavy')}>
        <span className=${cx('grid h-11 w-11 place-items-center rounded-full',i===1?'bg-onlime text-lime':'bg-panel text-ink group-hover:bg-lime group-hover:text-onlime')}><${Icon} n=${ic} s=${20}/></span>
        <span className="mt-5 text-[16px] font-bold">${t}</span><span className=${cx('mt-1 text-[13px]',i===1?'opacity-80':'text-soft group-hover:opacity-80 group-hover:text-current')}>${d}</span></button>`)}</div></section>

    <section id="perfis" className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-8">
      <div className="rounded-[36px] bg-navy p-6 text-onnavy sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4"><h2 className="display text-[40px] sm:text-[56px]">ENTRE COMO<br/><span className="text-lime">QUISER</span></h2>
          <p className="max-w-sm opacity-75">Cinco perfis prontos. O que você faz em um aparece nos outros, como na rotina real de uma clínica.</p></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">${PROFILES.map(p=>{const usr=S.users.find(x=>x.id===p.id);return html`<button key=${p.id} onClick=${()=>login(p.id)} className="group flex flex-col rounded-[26px] bg-onnavy/10 p-5 text-left ring-1 ring-onnavy/15 transition hover:bg-lime hover:text-onlime">
          <${Avatar} name=${usr.name} size=${48}/><span className="mt-4 font-bold">${usr.name}</span><span className="text-[13px] opacity-75">${ROLE[usr.role]}</span><span className="mt-3 text-[13px] opacity-80">${p.what}</span>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold">Entrar <${Icon} n="ur" s=${14}/></span></button>`})}</div></div></section>

    <footer className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-8 text-sm text-soft sm:px-8"><${Logo}/><span>Demonstração com dados fictícios de ${S.inst.name}. Nada aqui é dado real de paciente.</span></footer>
  </div>`;
}
const PROFILES=[
  {id:'ana',what:'Vê todos os módulos, aprova, configura regras e permissões.'},
  {id:'marcos',what:'Monta e gera escalas da Unidade Taquaral e cuida do estoque.'},
  {id:'helena',what:'Valida cadastros, registra vacinas e trata a rede de frio.'},
  {id:'carla',what:'Confirma plantões, pede substituição e se candidata a vagas.'},
  {id:'paulo',what:'Enfermeiro: escala, atendimentos domiciliares e férias.'}];
function ProfilePicker({open,onClose}){
  const {S,login,reset}=useApp();const [confirm,setConfirm]=useState(false);
  return html`<${Modal} open=${open} onClose=${onClose} title="Escolha um perfil" desc="Demonstração com dados fictícios. As alterações ficam salvas só neste navegador.">
    <ul className="space-y-2">${PROFILES.map(p=>{const usr=S.users.find(x=>x.id===p.id);return html`<li key=${p.id}><button onClick=${()=>login(p.id)} className="group flex w-full items-center gap-3 rounded-[22px] bg-panel2 px-4 py-3 text-left transition hover:bg-lime hover:text-onlime">
      <${Avatar} name=${usr.name} size=${44}/><span className="min-w-0 flex-1"><span className="block font-bold">${usr.name}</span><span className="block text-[13px] opacity-75">${ROLE[usr.role]}${usr.units?', Unidade Taquaral':''}</span><span className="mt-0.5 block text-[13px] opacity-75">${p.what}</span></span><${Icon} n="ur" s=${18}/></button></li>`})}</ul>
    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-soft">${confirm?html`<span>Apagar o que foi feito e voltar aos dados originais?</span><${Btn} size="sm" v="danger" onClick=${()=>{reset();setConfirm(false)}}>Reiniciar<//><${Btn} size="sm" onClick=${()=>setConfirm(false)}>Manter<//>`
      :html`<button className="font-semibold text-teal underline-offset-2 hover:underline" onClick=${()=>setConfirm(true)}>Reiniciar demonstração</button>`}</div><//>`;
}

/* ------------------------------------------------------------------ estrutura do app */
function Shell(){
  const {S,u,page,go,logout}=useApp();
  const nav=navFor(S,u);const gid=groupOf(page.page);const grp=nav.find(g=>g.id===gid)||nav[0];
  const unread=S.notifs.filter(n=>n.user===u.id&&!n.read).length;
  const pend=S.reqs.filter(r=>r.status==='pendente'&&can(S,u,'requests.decide',shiftOf(S,r.shift).unit)).length;
  const [menu,setMenu]=useState(false);
  const counts={solicitacoes:pend,notificacoes:unread};
  return html`<div className="min-h-screen pb-16">
    <header className="sticky z-40 bg-bg/85 backdrop-blur-md" style=${{top:'env(safe-area-inset-top, 0px)'}}>
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
        <button onClick=${()=>go({page:nav[0].items[0][0]})} aria-label="Início" className="shrink-0"><${Logo}/></button>
        <nav aria-label="Módulos" className="no-scrollbar mx-auto flex min-w-0 gap-1 overflow-x-auto rounded-full bg-panel p-1 shadow-[0_1px_0_rgb(var(--c-line))]">
          ${nav.map(g=>html`<button key=${g.id} onClick=${()=>go({page:g.items[0][0]})} aria-current=${grp.id===g.id?'page':undefined}
            className=${cx('inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition sm:px-4',grp.id===g.id?'bg-lime text-onlime':'text-soft hover:text-ink')}>
            <${Icon} n=${g.icon} s=${15}/><span className=${grp.id===g.id?'':'hidden md:inline'}>${g.label}</span></button>`)}</nav>
        <div className="flex shrink-0 items-center gap-2">
          <${ThemeToggle} className="hidden bg-panel sm:inline-flex"/>
          <${IconBtn} n="bell" label="Notificações" badge=${unread} onClick=${()=>go({page:'notificacoes'})} className="bg-panel"/>
          <div className="relative"><button onClick=${()=>setMenu(m=>!m)} aria-expanded=${menu} aria-label="Menu do perfil" className="rounded-full ring-2 ring-transparent transition hover:ring-lime"><${Avatar} name=${u.name} size=${40}/></button>
            ${menu&&html`<div className="anim absolute right-0 mt-2 w-64 rounded-[22px] bg-panel p-2 shadow-2xl">
              <div className="px-3 py-2"><p className="font-bold">${u.name}</p><p className="text-[13px] text-soft">${ROLE[u.role]}${u.units?', Unidade Taquaral':''}</p></div>
              <div className="flex items-center justify-between px-3 py-2 sm:hidden"><span className="text-sm">Tema</span><${ThemeToggle}/></div>
              <button onClick=${()=>{setMenu(false);logout()}} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-panel2"><${Icon} n="out"/>Trocar perfil</button></div>`}</div>
        </div></div></header>
    <main className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6">
      ${grp.items.length>1&&html`<div className="mb-5"><${Seg} items=${grp.items.map(([k,l])=>[k,l,counts[k]||null])} value=${page.page==='prof'?'profissionais':page.page} onChange=${k=>go({page:k})}/></div>`}
      <div className="mb-4 flex items-center gap-2 rounded-full bg-tealsoft px-4 py-2 text-[13px] text-teal"><${Icon} n="star" s=${14} className="shrink-0"/><span>Dados fictícios. Perfil: <strong>${u.name}</strong></span></div>
      <${Router}/></main></div>`;
}
function Router(){
  const {page}=useApp();
  const M={inicio:Inicio,escalas:Escalas,solicitacoes:Solicitacoes,gerar:Gerar,profissionais:Profissionais,talentos:Talentos,equipe:Equipe,
    vacinacao:Vacinacao,estoque:Estoque,temperatura:Temperatura,homecare:HomeCare,pagar:Pagar,receber:Receber,relatorios:Relatorios,
    auditoria:Auditoria,configuracoes:Config,notificacoes:Notificacoes,meu:MinhaArea,manual:Manual};
  if(page.page==='prof')return html`<${ProfDetail} id=${page.id}/>`;
  const C=M[page.page]||Inicio;return html`<${C}/>`;
}
const visibleShifts=(S,u)=>S.shifts.filter(s=>can(S,u,'shifts.view',s.unit));
