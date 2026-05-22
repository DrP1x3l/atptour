# ATP Tour – REFERENCE.md

Riferimento estratto VERBATIM da `atptour/index.html` (453 righe).
Tutte le citazioni mantengono le righe originali; le righe `>500 char` sono state
riassunte estraendo solo le costanti/blocchi rilevanti via `grep -oE`.

---

## 1. Inizializzazione Supabase

**Righe 22, 25-27, 30:** Storage key + config + client + device id.

```
22: const SK = "atptour_v3";
25: const SUPA_URL = "https://casmuuhouepdzbuzsnce.supabase.co";
26: const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhc211dWhvdWVwZHpidXpzbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzA4NjIsImV4cCI6MjA5MTE0Njg2Mn0.D6CJrcGDgNw-ix9t_FZ29G4NrQQFggo_Sy9GsxF7Eho";
27: const supa = supabase.createClient(SUPA_URL, SUPA_KEY);
30: const DEVICE_ID = "atptour_shared";
```

> Tabella Supabase: `atptour_state`, chiave `device_id`, colonna `data` (JSON).
> `DEVICE_ID` e' uno solo: tutti i device condividono lo stesso record.

**Righe 33-50:** `ldAsync` (load) — Supabase first, fallback `localStorage`.

```
33: async function ldAsync() {
34:   try {
35:     const { data, error } = await supa
36:       .from("atptour_state")
37:       .select("data")
38:       .eq("device_id", DEVICE_ID)
39:       .single();
40:     if (error || !data) {
41:       // fallback: prova localStorage
42:       const local = localStorage.getItem(SK);
43:       return local ? JSON.parse(local) : null;
44:     }
45:     return data.data;
46:   } catch (e) {
47:     console.error("Load error:", e);
48:     const local = localStorage.getItem(SK);
49:     return local ? JSON.parse(local) : null;
50:   }
51: }
```

**Righe 54-65:** `svAsync` (save) — upsert su Supabase + backup `localStorage`.

```
54: async function svAsync(d) {
55:   try {
56:     localStorage.setItem(SK, JSON.stringify(d)); // backup locale
56:     const { error } = await supa
57:       .from("atptour_state")
58:       .upsert({ device_id: DEVICE_ID, data: d, updated_at: new Date().toISOString() },
59:                { onConflict: "device_id" });
60:     if (error) console.error("Save error:", error);
61:   } catch (e) {
62:     console.error("Save error:", e);
63:   }
64: }
```

**Righe 67-68:** wrapper sync compatibili.

```
67: function ld() { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch { return null; } }
68: function sv(d) { svAsync(d); } // fire-and-forget
```

---

## 2. Lista TORNEI / GRAND SLAM (array `T`)

**Riga 77-81:** Definizione completa del catalogo tornei. Solo 3 tornei (NON i 4 Slam classici).
Non ci sono flag `is_gs` / `grand_slam` espliciti: TUTTI i tornei in `T` sono considerati Slam.

```
77: const T = [
78:   {id:"ao",name:"Australian Open",surf:"Cemento",surfType:"hard",color:"#3B9FE7",icon:"🇦🇺",grad:"linear-gradient(135deg,#1a3a5c,#2563a0)"},
79:   {id:"rg",name:"Roland Garros",surf:"Terra Rossa",surfType:"clay",color:"#D4612B",icon:"🇫🇷",grad:"linear-gradient(135deg,#5c2a1a,#a04325)"},
80:   {id:"uo",name:"US Open",surf:"Cemento",surfType:"hard",color:"#1E40AF",icon:"🇺🇸",grad:"linear-gradient(135deg,#1a2a5c,#1e40af)"},
81: ];
```

> Nessun campo `month` o `points` nel torneo: i punti sono globali (vedi `PT`),
> non per torneo. "GRAND SLAM" = vincere tutti e 3 i tornei in una stagione
> (`Object.keys(sWins).length===3`).

---

## 3. Tabella punti ATP (oggetto `PT`)

**Riga 82:** Punti globali, identici per ogni torneo.

```
82: const PT={win:2000,lose:1200,bagel:100,dom:150};
```

| Chiave | Valore | Significato |
|---|---|---|
| `win` | 2000 | Vincitore del match |
| `lose` | 1200 | Sconfitto (NON zero) |
| `bagel` | 100 | Bonus se nei set c'e' un 6-0 (non-tb) |
| `dom` | 150 | Bonus "Domination" (2-0 senza perdere set) |

Non esistono tabelle distinte per round (vincitore/finalista/SF/QF). Esistono solo i
2 punteggi `win`/`lose` + bonus.

---

## 4. Superfici e mapping ai tornei

Le superfici sono indicizzate via campo `surfType` di ciascun torneo (vedi riga 77-81):

- `ao` (Australian Open) -> `surf:"Cemento"`, `surfType:"hard"`
- `rg` (Roland Garros) -> `surf:"Terra Rossa"`, `surfType:"clay"`
- `uo` (US Open) -> `surf:"Cemento"`, `surfType:"hard"`

`calcStats` traccia record solo per due superfici (riga 91):

```
91: ... bySurf:{hard:{w:0,l:0},clay:{w:0,l:0}} ...
```

> NON ci sono `grass` / `carpet` nell'app. Solo `hard` e `clay`.

---

## 5. Palette CSS (CSS variables)

**Riga 140 (`:root{...}`)** — estratta via `grep -oE`:

```
:root{--bg:#0A0908;--card:#141210;--card2:#1A1714;--border:#2A2520;--border2:#342E28;--text:#F0EBE3;--text2:#A89E94;--text3:#6B6058;--blue:#D4A843;--blue2:#C49632;--blue3:#B08428;--bluesoft:rgba(212,168,67,0.08);--gold:#D4A843;--green:#22C55E;--red:#EF4444;--font:'Nunito',-apple-system,sans-serif;--mono:'Space Mono',monospace}
```

| Variabile | Valore |
|---|---|
| `--bg` | `#0A0908` |
| `--card` | `#141210` |
| `--card2` | `#1A1714` |
| `--border` | `#2A2520` |
| `--border2` | `#342E28` |
| `--text` | `#F0EBE3` |
| `--text2` | `#A89E94` |
| `--text3` | `#6B6058` |
| `--blue` | `#D4A843` (alias gold) |
| `--blue2` | `#C49632` |
| `--blue3` | `#B08428` |
| `--bluesoft` | `rgba(212,168,67,0.08)` |
| `--gold` | `#D4A843` |
| `--green` | `#22C55E` |
| `--red` | `#EF4444` |
| `--font` | `'Nunito',-apple-system,sans-serif` |
| `--mono` | `'Space Mono',monospace` |

**Riga 138:** font caricati.

```
138: @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
```

**Body inline (riga 11):**

```
11: body{margin:0;padding:0;background:#0A0908;overflow-x:hidden}
```

Animazioni significative (righe 141-162):

- `fadeIn` (.4s) — entrata pagine
- `scorePop` (.3s cubic-bezier) — quando cambia il punteggio
- `sponsorScroll` (25s linear infinite) — sponsor bar
- `float` (3s) — `.float-avatar`
- `confettiFall` — `.confetti`
- `badgePop` (.5s)
- `victoryGlow` / `victorySlideUp` / `victoryPulse` — schermata vittoria (`v-trophy`, `v-name`, `v-title`, `v-avatar`, `v-label`, `v-score`, `v-btn`, `v-glow`)

---

## 6. Logica TIEBREAK in NewMatch

**Riga 321 (`addTb`):**

```
function addTb(who){vib(25);push();setScoreKey(k=>k+1);let a=who===1?t1+1:t1,b=who===2?t2+1:t2;setT1(a);setT2(b);const tgt=curSet===3?10:8;if(a>=tgt&&a-b>=2){if(curSet===3){setSets([...sets,{set:3,s1:a,s2:b,winner:p1.id,isTb:true,tb1:a,tb2:b,p1:p1.id,p2:p2.id}]);setStep("confirm");}else endSet(g1+1,g2,true,a,b);return;}if(b>=tgt&&b-a>=2){if(curSet===3){setSets([...sets,{set:3,s1:a,s2:b,winner:p2.id,isTb:true,tb1:a,tb2:b,p1:p1.id,p2:p2.id}]);else endSet(g1,g2+1,true,a,b);}}
```

Regole TB derivate:
- `tgt = curSet===3 ? 10 : 8` — il super TB del 3° set arriva a 10, i TB normali arrivano a 8 (NON 7).
- Si vince con `>=tgt && diff>=2` (margine di 2).
- Quando si chiude un TB di set normale: `endSet(g1+1,g2,true,a,b)` (il game `g+1` viene "regalato" al vincitore del TB, quindi nel set si scrive 7-6 -> `s1=g1+1` o `s2=g2+1`).
- Quando si chiude il TB del 3° set: si pusha DIRETTAMENTE un set con `set:3, s1=a, s2=b, isTb:true, tb1:a, tb2:b` e si va a `"confirm"` (non passa per `endSet`).

**Riga 320 (`addGame`):** condizione che attiva il TB nel set normale:

```
function addGame(who){...; if(a===4&&b===4){setTbOn(true);setT1(0);setT2(0);}}
```

> Nota: la condizione `a===4 && b===4` indica che internamente i game sono numerati 0-5 e il TB scatta quando entrambi raggiungono il 5° game (sul 5-5 logico). Vedi sezione successiva per il senso pieno.

`isTb` diventa `true`:
- in stato locale (`tbOn`) quando `a===4 && b===4` (riga 320);
- in stato locale (`tbOn`) all'inizio del 3° set se siamo 1-1 (`endSet`, riga 319: `if(w1===1&&w2===1){setCurSet(3);setG1(0);setG2(0);setTbOn(true);setT1(0);setT2(0);return;}`);
- sul set salvato (`ns.isTb`) quando `endSet` viene chiamato con `isTb=true` (cioe' dal `addTb`).

---

## 7. Logica score set standard (game-by-game)

**Riga 320 (`addGame`):** logica completa per chiudere un set normale.

```
function addGame(who){vib(25);push();setScoreKey(k=>k+1);let a=who===1?g1+1:g1,b=who===2?g2+1:g2;setG1(a);setG2(b);if((a===4&&b<=2)||(a===5&&b===3)){endSet(a,b,false);return;}if((b===4&&a<=2)||(b===5&&a===3)){endSet(a,b,false);return;}if(a===4&&b===4){setTbOn(true);setT1(0);setT2(0);}}
```

Regole derivate (i contatori `g1/g2` partono da 0 -> il game corrente e' `g+1`):
- Set vinto p1: `(a===4 && b<=2) || (a===5 && b===3)` — quindi 4-0/4-1/4-2 oppure 5-3. NB: i numeri reali nei dataset salvati sembrano essere proprio quelli (4-0..5-3), NON 6-0..7-5 come nel tennis classico. Confronto: la UI mostra esattamente `s.s1`/`s.s2`.
- Set vinto p2: simmetrico.
- TB attivato su `4-4` (sul 5-5 logico se si guarda da 1).
- `endSet(a,b,false)` salva il set chiuso senza tiebreak.

**Riga 319 (`endSet`):** transizione di stato dopo chiusura set.

```
function endSet(sc1,sc2,isTb,tb1v,tb2v){const winner=sc1>sc2?p1.id:p2.id;const ns={set:curSet,s1:sc1,s2:sc2,winner,isTb,tb1:isTb?tb1v:null,tb2:isTb?tb2v:null,p1:p1.id,p2:p2.id};const all=[...sets,ns];setSets(all);const w1=all.filter(s=>s.winner===p1.id).length,w2=all.filter(s=>s.winner===p2.id).length;if(w1===2||w2===2){setStep("confirm");return;}if(w1===1&&w2===1){setCurSet(3);setG1(0);setG2(0);setTbOn(true);setT1(0);setT2(0);return;}setCurSet(curSet+1);setG1(0);setG2(0);setTbOn(false);setT1(0);setT2(0);}
```

Regole derivate:
- Best-of-3. Match chiuso a `w===2`.
- Se 1-1 dopo 2 set -> 3° set e' un Super Tie-Break (`tbOn=true`, target 10).
- Reset di game/tb counter ad ogni nuovo set.

> NON c'e' logica 15/30/40/AD/Deuce: il contatore avanza per GAME, non per punto.

---

## 8. `calcStats` (funzione completa)

**Righe 89-116:**

```
89: function calcStats(matches,players){
90:   const s={};
91:   players.forEach(p=>{s[p.id]={played:0,w:0,l:0,sW:0,sL:0,tbW:0,tbL:0,pts:0,slams:0,bagels:0,doms:0,streak:0,best:0,byT:{},bySn:{},bySurf:{hard:{w:0,l:0},clay:{w:0,l:0}},ptsHistory:[],form:[]};T.forEach(t=>{s[p.id].byT[t.id]={w:0,l:0};});});
92:   let cumPts={};players.forEach(p=>{cumPts[p.id]=0;});
93:   [...matches].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(m=>{
94:     const W=s[m.winner],L=s[m.loser];if(!W||!L)return;
95:     W.played++;L.played++;W.w++;L.l++;
96:     m.sets.forEach(st=>{if(st.winner===m.winner){W.sW++;L.sL++;}else{L.sW++;W.sL++;}if(st.isTb){if(st.winner===m.winner){W.tbW++;L.tbL++;}else{L.tbW++;W.tbL++;}}});
97:     const bag=m.sets.some(st=>(st.s1===0||st.s2===0)&&!st.isTb);
98:     const dom=m.sets.filter(st=>st.winner===m.winner).length===2&&m.sets.length===2;
99:     let wp=PT.win,lp=PT.lose;
100:    if(bag){wp+=PT.bagel;W.bagels++;}if(dom){wp+=PT.dom;W.doms++;}
101:    W.pts+=wp;L.pts+=lp;W.slams++;
102:    if(W.byT[m.tournament])W.byT[m.tournament].w++;if(L.byT[m.tournament])L.byT[m.tournament].l++;
103:    const sn=m.season;
104:    if(!W.bySn[sn])W.bySn[sn]={pts:0,w:0,l:0,slams:0};if(!L.bySn[sn])L.bySn[sn]={pts:0,w:0,l:0,slams:0};
105:    W.bySn[sn].pts+=wp;W.bySn[sn].w++;W.bySn[sn].slams++;L.bySn[sn].pts+=lp;L.bySn[sn].l++;
106:    const surfType=T.find(t=>t.id===m.tournament)?.surfType||"hard";
107:    W.bySurf[surfType].w++;L.bySurf[surfType].l++;
108:    W.streak=W.streak>=0?W.streak+1:1;L.streak=L.streak<=0?L.streak-1:-1;
109:    W.best=Math.max(W.best,W.streak);
110:    cumPts[m.winner]+=wp;cumPts[m.loser]+=lp;
111:    W.ptsHistory.push(cumPts[m.winner]);L.ptsHistory.push(cumPts[m.loser]);
112:    W.form.push("V");L.form.push("P");
113:  });
114:  players.forEach(p=>{s[p.id].form=s[p.id].form.slice(-5);});
115:  return s;
116: }
```

Struttura di output per giocatore (`s[playerId]`):
- `played`, `w`, `l` — partite totali, vinte, perse.
- `sW`, `sL` — set vinti / persi.
- `tbW`, `tbL` — tiebreak vinti / persi.
- `pts` — punti ATP cumulati (con bonus bagel/dom).
- `slams` — torneo Slam vinti (incrementato a ogni W: ogni match e' uno Slam in questo modello).
- `bagels`, `doms` — contatori achievement.
- `streak` (corrente, negativo per losing streak) e `best` (record positivo).
- `byT[id]` -> `{w,l}` per ogni torneo in `T`.
- `bySn[sn]` -> `{pts,w,l,slams}` per stagione.
- `bySurf` -> `{hard:{w,l}, clay:{w,l}}` solo 2 superfici.
- `ptsHistory` -> array cumulativo di punti per il grafico.
- `form` -> ultime 5 partite (`"V"` / `"P"`).

**Ranking** (calcolato inline, non dentro `calcStats`): riga 247 e 198.

```
247: const ranking=players.map(p=>({id:p.id,pts:stats[p.id]?.pts||0})).sort((a,b)=>b.pts-a.pts).map((r,i)=>({...r,pos:i+1}));
198: const ranking=players.map(p=>({id:p.id,pts:stats[p.id]?.pts||0})).sort((a,b)=>b.pts-a.pts);
```

**H2H** — riga 117:

```
117: function getH2H(matches,a,b){const r=matches.filter(m=>(m.winner===a&&m.loser===b)||(m.winner===b&&m.loser===a));return{[a]:r.filter(m=>m.winner===a).length,[b]:r.filter(m=>m.winner===b).length,total:r.length};}
```

---

## 9. Golden Slam / Achievements

> NON esiste "Golden Slam" letterale nel codice (Golden Slam = Slam + Olimpiadi nel tennis reale).
> L'equivalente massimo nell'app e' **GRAND SLAM** (vincere tutti e 3 i tornei in una stagione).

**Riga 251-252 (in `Dash`):** rilevamento GS della stagione corrente.

```
251: const sW={};matches.filter(m=>m.season===state.season).forEach(m=>{if(!sW[m.winner])sW[m.winner]=new Set();sW[m.winner].add(m.tournament);});
252: const gs=Object.entries(sW).find(([,s])=>s.size===3);
```

**Riga 355 (in `Albo`):** stessa logica, riusabile per ogni stagione.

```
355: function hasGS(sn){const sW={};matches.filter(m=>m.season===sn).forEach(m=>{if(!sW[m.winner])sW[m.winner]=new Set();sW[m.winner].add(m.tournament);});return Object.entries(sW).find(([,s])=>s.size===3);}
```

**Render GS card su Dash (riga 287):**

```
{gs&&(<div ...>👑 ... GRAND SLAM · STAGIONE {state.season} ... {players.find(p=>p.id===gs[0])?.name}</div>)}
```

**Render GS card per stagione su Albo (riga 359):**

```
{gs&&gsPlayer&&(<div ...>{gsPlayer.name} ... GRAND SLAM CHAMPION</div>)}
```

**Achievements / Badges** — definiti in 2 punti DUPLICATI (vanno tenuti coerenti):

A) `getAchievements` (riga 120-135, non usata direttamente nel codice):

```
120: function getAchievements(match,allMatches,players,stats){
121:   const badges=[];const w=stats[match.winner];const wP=players.find(p=>p.id===match.winner);
122:   const tName=T.find(t=>t.id===match.tournament)?.name||"";
123:   const tWins=allMatches.filter(m=>m.winner===match.winner&&m.tournament===match.tournament).length;
124:   if(tWins===1)badges.push(`🎉 Prima vittoria al ${tName}!`);
125:   if(w.streak===3)badges.push("🔥 3 vittorie di fila!");
126:   if(w.streak===5)badges.push("💀 5 vittorie di fila! Inarrestabile!");
127:   if(w.slams===1)badges.push("🏆 Primo Slam vinto!");
128:   const seasonWins={};allMatches.filter(m=>m.season===match.season&&m.winner===match.winner).forEach(m=>{if(!seasonWins[m.tournament])seasonWins[m.tournament]=true;});
129:   if(Object.keys(seasonWins).length===3)badges.push("👑 GRAND SLAM! Tutti e 3 i tornei!");
130:   const isDom=match.sets.filter(st=>st.winner===match.winner).length===2&&match.sets.length===2;
131:   if(isDom)badges.push("💪 Domination! Vittoria 2-0!");
132:   const hasBagel=match.sets.some(st=>(st.s1===0||st.s2===0)&&!st.isTb);
133:   if(hasBagel)badges.push("🥯 Bagel servito!");
134:   return badges;
135: }
```

B) Inline dentro `saveM` (riga 322) — versione effettivamente usata, leggermente diversa:

```
const tWins=newMatches.filter(m=>m.winner===winner&&m.tournament===tourn).length;
if(tWins===1)b.push("🎉 Prima vittoria al "+tName+"!");
const winStreak=newMatches.slice().reverse().findIndex(m=>m.winner!==winner);
const streak=winStreak===-1?newMatches.length:winStreak;
if(streak===3)b.push("🔥 3 vittorie di fila!");
if(streak===5)b.push("💀 5 vittorie di fila!");
const totalSlams=newMatches.filter(m=>m.winner===winner).length;
if(totalSlams===1)b.push("🏆 Primo Slam vinto!");
const sWins={};newMatches.filter(m=>m.season===state.season&&m.winner===winner).forEach(m=>{sWins[m.tournament]=true;});
if(Object.keys(sWins).length===3)b.push("👑 GRAND SLAM!");
const isDom=match.sets.filter(st=>st.winner===winner).length===2&&match.sets.length===2;
if(isDom)b.push("💪 Domination!");
const hasBagel=match.sets.some(st=>(st.s1===0||st.s2===0)&&!st.isTb);
if(hasBagel)b.push("🥯 Bagel servito!");
```

> Nel refactor: unificare le 2 versioni. La (B) calcola lo streak ricontando dai `matches`, la (A) usa `stats[].streak`. Le stringhe italiane sono leggermente divergenti ("Tutti e 3 i tornei!" vs no, "Inarrestabile!" vs no).

---

## 10. Sponsor

**Righe 166-169 (definizione costanti immagini base64):**

```
166: const SP_EMIRATES="data:image/png;base64,..."  // 12767 char
167: const SP_ROLEX="data:image/png;base64,..."     // 14500 char
168: const SP_WILSON="data:image/png;base64,..."    // 16457 char
169: const SP_LAVAZZA="data:image/png;base64,..."   // 27746 char
```

**Righe 171-186 (componente `SponsorBar`):** carosello con fade ogni 5s.

```
171: function SponsorBar(){
172:   const[idx,setIdx]=useState(0);
173:   const[fade,setFade]=useState(true);
174:   const sponsors=[
175:     {src:SP_EMIRATES,bg:"#fff"},
176:     {src:SP_ROLEX,bg:"#fff"},
177:     {src:SP_WILSON,bg:"#fff"},
178:     {src:SP_LAVAZZA,bg:"#fff"},
179:   ];
180:   useEffect(()=>{const iv=setInterval(()=>{setFade(false);setTimeout(()=>{setIdx(p=>(p+1)%sponsors.length);setFade(true);},500);},5000);return()=>clearInterval(iv);},[]);
181:   return(
182:     <div style={{margin:"0 18px 10px",borderRadius:"16px",overflow:"hidden",background:sponsors[idx].bg,height:"72px",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.5s ease"}}>
183:       <img src={sponsors[idx].src} alt="" style={{height:"52px",objectFit:"contain",maxWidth:"85%",opacity:fade?1:0,transition:"opacity 0.5s ease"}}/>
184:     </div>
185:   );
186: }
```

Sponsor: Emirates, Rolex, Wilson, Lavazza. Tutti su sfondo bianco, altezza 72px, fade 5s.

---

## 11. Formato dello state

**Riga 84 — fresh state factory:**

```
84: function fr(){return{players:PD,matches:[],season:1};}
```

**Riga 76 — `PD` (default players):**

```
76: const PD = [{id:"p1",name:"Giocatore 1",avatar:AV_IMG1},{id:"p2",name:"Giocatore 2",avatar:AV_IMG2}];
```

**Match shape** — riga 322 (`saveM`):

```
const match={id:gid(),tournament:tourn,season:state.season,date,winner,loser,sets};
```

Quindi:
```
state = {
  season: number,           // intero, default 1
  players: [                // sempre 2
    {id:"p1", name:string, avatar:string},
    {id:"p2", name:string, avatar:string}
  ],
  matches: [
    {
      id: string,           // gid() = Date.now base36 + random base36
      tournament: "ao"|"rg"|"uo",
      season: number,
      date: "YYYY-MM-DD",   // ISO date
      winner: "p1"|"p2",
      loser: "p1"|"p2",
      sets: [
        {
          set: 1|2|3,
          s1: number,       // game vinti player 1 (formato 4-0..5-3 + 7-6 con TB)
          s2: number,       // game vinti player 2
          winner: "p1"|"p2",
          isTb: boolean,
          tb1: number|null, // punti TB player 1 (null se isTb=false)
          tb2: number|null, // punti TB player 2
          p1: "p1",         // ridondante ma salvato
          p2: "p2"
        }, ...
      ]
    }, ...
  ]
}
```

**Riga 83 — `gid` (id generator):**

```
83: const gid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
```

**App state init (righe 420-431):**

```
420: const[state,setState]=useState(null);const[page,setPage]=useState("dash");const[loading,setLoading]=useState(true);
423: useEffect(()=>{
424:   ldAsync().then(d=>{
425:     setState(d||fr());
426:     setLoading(false);
427:   }).catch(()=>{
428:     setState(ld()||fr());
429:     setLoading(false);
430:   });
431: },[]);
434: useEffect(()=>{if(state&&!loading)sv(state);},[state]);
```

---

## 12. Icone / Emoji

**Tab di navigazione (riga 189, componente `Nav`):**

```
189: const its=[{id:"dash",l:"Home",e:"⚡"},{id:"new",l:"Match",e:"🎾"},{id:"hist",l:"Storico",e:"📋"},{id:"albo",l:"Albo",e:"🏆"},{id:"prof",l:"Profili",e:"👤"},{id:"cfg",l:"Setup",e:"⚙️"}];
```

| Tab id | Label | Icona |
|---|---|---|
| `dash` | Home | ⚡ |
| `new` | Match | 🎾 |
| `hist` | Storico | 📋 |
| `albo` | Albo | 🏆 |
| `prof` | Profili | 👤 |
| `cfg` | Setup | ⚙️ |

**Icone tornei (campo `icon` in `T`, riga 77-81):**

| Torneo | Icona |
|---|---|
| Australian Open | 🇦🇺 |
| Roland Garros | 🇫🇷 |
| US Open | 🇺🇸 |

**Avatar emoji options (riga 75, troncata: 228 char totali):**

```
const AVATAR_OPTIONS = ["🧑‍🦱","👨‍🦰","👩‍🦳","🧔","👲","🤴","👸","🥷","🧙‍♂️","🧝‍♂️","🦸‍♂️","🦹‍♂️","🧛‍♂️","🧟‍♂️", ...
```

(elenco completo da estrarre con `grep -oE 'AVATAR_OPTIONS = \[[^]]+\]'` durante il refactor)

**Emoji ricorrenti:**
- 🏆 Trofeo / Slam / Albo
- 👑 Grand Slam / Campione
- 🔥 3 vittorie di fila
- 💀 5 vittorie di fila
- 🎉 Prima vittoria
- 💪 Domination
- 🥯 Bagel
- ↩ Annulla
- ⚡ Home
- 🎾 Match / fallback avatar
- 📋 Storico
- 👤 Profili
- ⚙️ Setup

---

## 13. Testi italiani principali

**Labels tab di navigazione** (riga 189): vedi sezione 12.

**Titoli sezioni (componente `SL` riga 213):**
- Riga 276: `<SL>Classifica ATP</SL>`
- Riga 288: `<SL>Head to Head</SL>`
- Riga 290: `<SL>Andamento Punti</SL>`
- Riga 291: `<SL>Stagione {state.season}</SL>`
- Riga 293: `<SL>Ultima Partita</SL>`
- Riga 324: `<SL>Nuovo Match</SL>`
- Riga 348: `<SL>Storico Partite</SL>`
- Riga 356/357: `<SL>Albo d'Oro</SL>`
- Riga 370: `<SL>Profili Giocatori</SL>`
- Riga 416: `<SL>Impostazioni</SL>`

**Header / N°1 (Hdr, riga 197-211):**
- Mesi: `["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"]` (anche in riga 85, `fmtD`).
- `S{season}` (es. `S1`).

**Loading screen (riga 442):**
- `CARICAMENTO...`

**NewMatch:**
- Riga 324: `Nuovo Match` / `Seleziona Torneo`
- Riga 326: `SUPER TIE-BREAK DECISIVO` / `SET ${curSet}` / `TIE-BREAK`
- Riga 326: pulsanti `Game` / `Punto` (tbOn switch); etichetta `SET {swn}`.
- Riga 326: `↩ Annulla ultimo`
- Riga 328: `CAMPIONE`, `Annulla`, `Salva Risultato ✓`, etichetta set `STB` / `SET {s.set}`.
- Riga 338: vittoria + badges (testi vedi sezione 9).

**Dashboard:**
- Riga 261: `N°1`
- Riga 264: `LEADER ATP`
- Riga 287: `GRAND SLAM · STAGIONE {state.season}`
- Riga 359 (Albo): `GRAND SLAM CHAMPION`
- Riga 363 (Albo): `👑 Campione`

**Profili (riga 370+):**
- Riga 379: `{w}V – {l}P · {played} partite`
- Riga 385: `PUNTI ATP`
- Riga 389: `WIN RATE`
- Riga 393: `SLAM 🏆`
- Riga 398: `Set`, `TB`, `Streak`, `Bagel`, `Dom`

**Cfg (Impostazioni, riga 412-416):**
- placeholder `Nome` (riga 416)
- `Giocatore 1`, `Giocatore 2` (PD, riga 76)
- Reset stagione + conferma reset (vedi `confirmReset`, riga 412/415)

**MiniChart (riga 240):**
- `Tocca un punto per vedere il dettaglio`

**Albo vuoto (riga 356):**
- `Albo d'Oro` + emoji 🏆 + messaggio placeholder (testo completo nella riga 356 troncata, da rileggere durante il refactor con `sed -n '356p'`).

---

## Note finali per il refactor

- Il file e' monolitico (453 righe, ma con righe lunghissime: linea 70 e' 46378 char per `ATP_LOGO`).
- I 4 sponsor PNG base64 occupano da soli ~71KB di sorgente (righe 166-169).
- Il logo ATP_LOGO occupa ~46KB di sorgente (riga 70).
- `IMG_AVATARS=[AV_IMG1,AV_IMG2]` (riga 74) — gli avatar `AV_IMG1`/`AV_IMG2` sono base64 definiti in chunk precedenti del file (NON cercati qui — `AV_IMG1` / `AV_IMG2` vanno estratti via `grep -n "AV_IMG"` se servono per il refactor).
- 2 versioni duplicate dei badge achievement: unificare.
- Non c'e' separazione modelli/UI: tutto e' inline.
- L'app usa `<script type="text/babel">` con Babel standalone CDN (NON una build). Da convertire in build vera Vite/React.
