import { useState, useEffect, useCallback } from "react";

const CLAUDE_API = "https://api.anthropic.com/v1/messages";
const PROXY = process.env.REACT_APP_PROXY_URL || "https://salvada-proxy.vercel.app/api/proxy";

// Helper para llamar al proxy
const fp = async (path, params = {}) => {
  const qs = new URLSearchParams({ path, ...params }).toString();
  const r  = await fetch(`${PROXY}?${qs}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

const LIGAS = [
  { nombre:"Champions League 🏆", id:2,   season:2024 },
  { nombre:"La Liga 🇪🇸",          id:140, season:2024 },
  { nombre:"Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿",  id:39,  season:2024 },
  { nombre:"Serie A 🇮🇹",           id:135, season:2024 },
  { nombre:"Bundesliga 🇩🇪",        id:78,  season:2024 },
  { nombre:"Ligue 1 🇫🇷",           id:61,  season:2024 },
];

const MONTOS  = [500, 1000, 2000, 5000, 10000, 20000];
const SECCIONES = [
  { id:"pred",   label:"🎯 Predicción"  },
  { id:"h2h",    label:"⚔️ H2H Real"   },
  { id:"forma",  label:"📈 Forma"       },
  { id:"stats",  label:"📊 Stats"       },
  { id:"combo",  label:"🎲 Combinadas"  },
  { id:"score",  label:"🏁 Marcador"    },
];

const fmtARS  = n => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n);
const riskClr = r => r==="Bajo"?"#00e676":r==="Medio"?"#ffb300":"#ff5252";
const confClr = c => c>=70?"#00e676":c>=50?"#ffb300":"#ff5252";
const resClr  = (gf,gc) => gf>gc?"#00e676":gf<gc?"#ff5252":"#ffb300";


// Partidos reales - Champions League octavos 2026
const ESCUDOS = {
  "Bayer Leverkusen":"🔴⚫","Arsenal":"🔴","PSG":"🔵🔴","Chelsea":"🔵","Manchester City":"🔵","Real Madrid":"⚪","Barcelona":"🔵🔴","Newcastle United":"⚫⚪","Bayern Munich":"🔴","Atalanta BC":"⚫🔵","Liverpool FC":"🔴","Galatasaray Istanbul":"🔴🟡","Tottenham Hotspur":"⚪","Atletico Madrid":"🔴⚪","Sporting CP":"🟢⚪","Bodoe/Glimt":"🟡⚫","Sevilla":"🔴⚪","Athletic Club":"🔴⚪","Villarreal":"🟡","Napoli":"🔵⚪","AC Milan":"🔴⚫","Inter Milan":"🔵⚫","Juventus":"⚪⚫","Roma":"🔴🟡","Borussia Dortmund":"🟡⚫","RB Leipzig":"🔴⚪","Marseille":"🔵⚪","Monaco":"🔴⚪","Lyon":"🔵⚪"
};
const mkTeam = (id, name) => ({ id, name, logo:"", emoji: ESCUDOS[name]||"⚽" });

const FIXTURES_DATA = {
  "Champions League 🏆": [
    // ── HOY jugados (10 Mar) ──
    { fixture:{id:9001, date:"2026-03-10T17:45:00+00:00", status:{short:"FT",long:"Match Finished",elapsed:90}},  league:{name:"Champions League",round:"Octavos · Ida"}, teams:{home:mkTeam(506,"Galatasaray Istanbul"), away:mkTeam(40,"Liverpool FC")},          goals:{home:1,away:0} },
    { fixture:{id:9002, date:"2026-03-10T20:00:00+00:00", status:{short:"FT",long:"Match Finished",elapsed:90}},  league:{name:"Champions League",round:"Octavos · Ida"}, teams:{home:mkTeam(34,"Newcastle United"),       away:mkTeam(529,"Barcelona")},             goals:{home:1,away:1} },
    { fixture:{id:9003, date:"2026-03-10T20:00:00+00:00", status:{short:"FT",long:"Match Finished",elapsed:90}},  league:{name:"Champions League",round:"Octavos · Ida"}, teams:{home:mkTeam(530,"Atletico Madrid"),       away:mkTeam(47,"Tottenham Hotspur")},       goals:{home:5,away:2} },
    { fixture:{id:9004, date:"2026-03-10T20:00:00+00:00", status:{short:"FT",long:"Match Finished",elapsed:90}},  league:{name:"Champions League",round:"Octavos · Ida"}, teams:{home:mkTeam(499,"Atalanta BC"),           away:mkTeam(157,"Bayern Munich")},          goals:{home:1,away:6} },
    // ── MAÑANA (11 Mar) ──
    { fixture:{id:9005, date:"2026-03-11T17:45:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Ida"}, teams:{home:mkTeam(168,"Bayer Leverkusen"),      away:mkTeam(42,"Arsenal")},                goals:{home:null,away:null} },
    { fixture:{id:9006, date:"2026-03-11T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Ida"}, teams:{home:mkTeam(541,"Real Madrid"),           away:mkTeam(50,"Manchester City")},         goals:{home:null,away:null} },
    { fixture:{id:9007, date:"2026-03-11T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Ida"}, teams:{home:mkTeam(772,"Bodoe/Glimt"),           away:mkTeam(228,"Sporting CP")},            goals:{home:null,away:null} },
    { fixture:{id:9008, date:"2026-03-11T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Ida"}, teams:{home:mkTeam(85,"PSG"),                    away:mkTeam(49,"Chelsea")},                 goals:{home:null,away:null} },
    // ── VUELTA (17-18 Mar) ──
    { fixture:{id:9009, date:"2026-03-17T17:45:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Vuelta"}, teams:{home:mkTeam(228,"Sporting CP"),        away:mkTeam(772,"Bodoe/Glimt")},            goals:{home:null,away:null} },
    { fixture:{id:9010, date:"2026-03-17T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Vuelta"}, teams:{home:mkTeam(50,"Manchester City"),     away:mkTeam(541,"Real Madrid")},            goals:{home:null,away:null} },
    { fixture:{id:9011, date:"2026-03-17T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Vuelta"}, teams:{home:mkTeam(49,"Chelsea"),             away:mkTeam(85,"PSG")},                     goals:{home:null,away:null} },
    { fixture:{id:9012, date:"2026-03-17T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Vuelta"}, teams:{home:mkTeam(42,"Arsenal"),             away:mkTeam(168,"Bayer Leverkusen")},       goals:{home:null,away:null} },
    { fixture:{id:9013, date:"2026-03-18T17:45:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Vuelta"}, teams:{home:mkTeam(529,"Barcelona"),          away:mkTeam(34,"Newcastle United")},        goals:{home:null,away:null} },
    { fixture:{id:9014, date:"2026-03-18T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Vuelta"}, teams:{home:mkTeam(40,"Liverpool FC"),        away:mkTeam(506,"Galatasaray Istanbul")},   goals:{home:null,away:null} },
    { fixture:{id:9015, date:"2026-03-18T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Vuelta"}, teams:{home:mkTeam(47,"Tottenham Hotspur"),   away:mkTeam(530,"Atletico Madrid")},        goals:{home:null,away:null} },
    { fixture:{id:9016, date:"2026-03-18T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}},   league:{name:"Champions League",round:"Octavos · Vuelta"}, teams:{home:mkTeam(157,"Bayern Munich"),      away:mkTeam(499,"Atalanta BC")},            goals:{home:null,away:null} },
  ],
  "La Liga 🇪🇸": [
    { fixture:{id:2001, date:"2026-03-22T21:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"La Liga",round:"Jornada 29 · El Clásico"}, teams:{home:mkTeam(529,"Barcelona"),      away:mkTeam(541,"Real Madrid")},     goals:{home:null,away:null} },
    { fixture:{id:2002, date:"2026-03-15T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"La Liga",round:"Jornada 28"},              teams:{home:mkTeam(530,"Atletico Madrid"), away:mkTeam(536,"Sevilla")},         goals:{home:null,away:null} },
    { fixture:{id:2003, date:"2026-03-16T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"La Liga",round:"Jornada 28"},              teams:{home:mkTeam(531,"Athletic Club"),   away:mkTeam(533,"Villarreal")},      goals:{home:null,away:null} },
    { fixture:{id:2004, date:"2026-04-05T19:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"La Liga",round:"Jornada 31"},              teams:{home:mkTeam(541,"Real Madrid"),     away:mkTeam(530,"Atletico Madrid")}, goals:{home:null,away:null} },
  ],
  "Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿": [
    { fixture:{id:3001, date:"2026-03-14T17:30:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Premier League",round:"GW 29"}, teams:{home:mkTeam(50,"Manchester City"), away:mkTeam(40,"Liverpool FC")},       goals:{home:null,away:null} },
    { fixture:{id:3002, date:"2026-03-15T14:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Premier League",round:"GW 29"}, teams:{home:mkTeam(47,"Tottenham Hotspur"),away:mkTeam(66,"Aston Villa")},      goals:{home:null,away:null} },
    { fixture:{id:3003, date:"2026-03-16T16:30:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Premier League",round:"GW 30"}, teams:{home:mkTeam(42,"Arsenal"),          away:mkTeam(49,"Chelsea")},           goals:{home:null,away:null} },
    { fixture:{id:3004, date:"2026-03-29T16:30:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Premier League",round:"GW 31"}, teams:{home:mkTeam(40,"Liverpool FC"),     away:mkTeam(42,"Arsenal")},           goals:{home:null,away:null} },
    { fixture:{id:3005, date:"2026-04-04T14:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Premier League",round:"GW 32"}, teams:{home:mkTeam(49,"Chelsea"),          away:mkTeam(50,"Manchester City")},   goals:{home:null,away:null} },
  ],
  "Serie A 🇮🇹": [
    { fixture:{id:4001, date:"2026-03-15T19:45:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Serie A",round:"Jornada 29"}, teams:{home:mkTeam(492,"Napoli"),    away:mkTeam(489,"AC Milan")},  goals:{home:null,away:null} },
    { fixture:{id:4002, date:"2026-03-16T19:45:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Serie A",round:"Jornada 29"}, teams:{home:mkTeam(505,"Inter Milan"),away:mkTeam(496,"Juventus")}, goals:{home:null,away:null} },
    { fixture:{id:4003, date:"2026-03-16T17:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Serie A",round:"Jornada 29"}, teams:{home:mkTeam(497,"Roma"),      away:mkTeam(499,"Atalanta BC")},goals:{home:null,away:null} },
  ],
  "Bundesliga 🇩🇪": [
    { fixture:{id:5001, date:"2026-03-15T17:30:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Bundesliga",round:"Jornada 25"}, teams:{home:mkTeam(157,"Bayern Munich"),      away:mkTeam(165,"Borussia Dortmund")}, goals:{home:null,away:null} },
    { fixture:{id:5002, date:"2026-03-15T15:30:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Bundesliga",round:"Jornada 25"}, teams:{home:mkTeam(168,"Bayer Leverkusen"),   away:mkTeam(173,"RB Leipzig")},        goals:{home:null,away:null} },
    { fixture:{id:5003, date:"2026-04-05T16:30:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Bundesliga",round:"Jornada 27"}, teams:{home:mkTeam(165,"Borussia Dortmund"),away:mkTeam(157,"Bayern Munich")},    goals:{home:null,away:null} },
  ],
  "Ligue 1 🇫🇷": [
    { fixture:{id:6001, date:"2026-03-16T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Ligue 1",round:"Jornada 26"}, teams:{home:mkTeam(85,"PSG"),      away:mkTeam(81,"Marseille")}, goals:{home:null,away:null} },
    { fixture:{id:6002, date:"2026-03-15T19:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Ligue 1",round:"Jornada 26"}, teams:{home:mkTeam(91,"Monaco"),   away:mkTeam(80,"Lyon")},      goals:{home:null,away:null} },
    { fixture:{id:6003, date:"2026-04-06T20:00:00+00:00", status:{short:"NS",long:"Not Started",elapsed:null}}, league:{name:"Ligue 1",round:"Jornada 28"}, teams:{home:mkTeam(81,"Marseille"),away:mkTeam(85,"PSG")},       goals:{home:null,away:null} },
  ],
};


export default function App() {
  const [ligaIdx,   setLigaIdx]   = useState(0);
  const [fixtures,  setFixtures]  = useState([]);
  const [pidx,      setPidx]      = useState(0);
  const [loadFix,   setLoadFix]   = useState(false);
  const [errFix,    setErrFix]    = useState("");

  const [analysis,  setAnalysis]  = useState(null);
  const [h2hData,   setH2hData]   = useState(null);
  const [formaData, setFormaData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [loadStep,  setLoadStep]  = useState("");
  const [seccion,   setSeccion]   = useState("pred");

  const [simPick,   setSimPick]   = useState(null);
  const [simMonto,  setSimMonto]  = useState("");
  const [apiOk,     setApiOk]     = useState(null); // null=checking, true, false

  const liga    = LIGAS[ligaIdx];
  const partido = fixtures[pidx];

  // ── Verificar proxy al montar ─────────────────────────────────────────────
  // Proxy verificado — arrancar directo
  useEffect(()=>{ setApiOk(true); },[]);

  // ── Cargar fixtures: API real primero, fallback estáticos ───────────────
  useEffect(()=>{
    setFixtures([]); setPidx(0); setAnalysis(null);
    setH2hData(null); setFormaData(null); setStatsData(null);
    setErrFix(""); setLoadFix(true);
    if(!apiOk){ setFixtures(FIXTURES_DATA[liga.nombre]||[]); setLoadFix(false); return; }
    (async()=>{
      try {
        const [dNext, dLast] = await Promise.allSettled([
          fp("fixtures", {league:liga.id, season:liga.season, next:20}),
          fp("fixtures", {league:liga.id, season:liga.season, last:10}),
        ]);
        const proximos = dNext.status==="fulfilled" ? dNext.value.response||[] : [];
        const pasados  = dLast.status==="fulfilled" ? dLast.value.response||[] : [];
        const combined = [...proximos,...pasados]
          .filter((f,i,arr)=>arr.findIndex(x=>x.fixture.id===f.fixture.id)===i)
          .sort((a,b)=>new Date(a.fixture.date)-new Date(b.fixture.date));
        setFixtures(combined.length>0 ? combined : FIXTURES_DATA[liga.nombre]||[]);
      } catch(e){
        setFixtures(FIXTURES_DATA[liga.nombre]||[]);
      }
      setLoadFix(false);
    })();
  },[ligaIdx, apiOk]);

  useEffect(()=>{
    setAnalysis(null); setH2hData(null); setFormaData(null);
    setStatsData(null); setSimPick(null); setSimMonto("");
  },[pidx]);

  // ── ANALIZAR ─────────────────────────────────────────────────────────────
  async function analizar() {
    if(!partido) return;
    setLoading(true); setAnalysis(null);
    setH2hData(null); setFormaData(null); setStatsData(null);

    const localId   = partido.teams.home.id;
    const visitId   = partido.teams.away.id;
    const localName = partido.teams.home.name;
    const visitName = partido.teams.away.name;
    const fixId     = partido.fixture.id;

    const steps = [
      "Cargando H2H real…","Analizando forma local…",
      "Analizando forma visitante…","Cargando estadísticas…",
      "Procesando con IA…","Calculando combinadas…","Estimando marcadores…"
    ];
    let i=0; const iv = setInterval(()=>setLoadStep(steps[i++%steps.length]),900);

    try {
      // ── 1. Datos reales en paralelo ──────────────────────────────────────
      const [h2hRes, formaLRes, formaVRes, statsRes] = await Promise.allSettled([
        fp("fixtures/headtohead", { h2h:`${localId}-${visitId}`, last:10 }),
        fp("fixtures", { team:localId,  last:6, season:liga.season }),
        fp("fixtures", { team:visitId,  last:6, season:liga.season }),
        fp("fixtures/statistics", { fixture:fixId }),
      ]);

      const h2h       = h2hRes.status==="fulfilled"       ? h2hRes.value.response||[]       : [];
      const formaL    = formaLRes.status==="fulfilled"     ? formaLRes.value.response||[]    : [];
      const formaV    = formaVRes.status==="fulfilled"     ? formaVRes.value.response||[]    : [];
      const statsArr  = statsRes.status==="fulfilled"      ? statsRes.value.response||[]     : [];

      setH2hData(h2h);
      setFormaData({ local:formaL, visitante:formaV });
      setStatsData(statsArr);

      // ── 2. Resúmenes para IA ─────────────────────────────────────────────
      const resumeH2H = h2h.length===0 ? "Sin enfrentamientos previos." :
        h2h.slice(0,8).map(f=>{
          const hg=f.goals.home??"-", ag=f.goals.away??"-";
          return `${f.league.season}: ${f.teams.home.name} ${hg}-${ag} ${f.teams.away.name} (${f.league.name})`;
        }).join(" | ");

      // Estadísticas H2H agregadas
      let h2hGoles=0, h2hBTTS=0;
      h2h.forEach(f=>{
        const hg=f.goals.home??0, ag=f.goals.away??0;
        h2hGoles+=hg+ag;
        if(hg>0&&ag>0) h2hBTTS++;
      });
      const h2hStats = h2h.length>0
        ? `Prom goles: ${(h2hGoles/h2h.length).toFixed(1)}/partido | Ambos marcan: ${Math.round(h2hBTTS/h2h.length*100)}% veces`
        : "";

      const resumeForma = (fixtures, teamId) => {
        if(!fixtures.length) return "Sin datos.";
        return fixtures.slice(0,6).map(f=>{
          const esL = f.teams.home.id===teamId;
          const gf  = esL ? f.goals.home??0 : f.goals.away??0;
          const gc  = esL ? f.goals.away??0 : f.goals.home??0;
          const rival = esL ? f.teams.away.name : f.teams.home.name;
          const r   = gf>gc?"V":gf<gc?"D":"E";
          // Stats del partido si disponibles
          const sts = f.statistics||[];
          return `${r} ${gf}-${gc} vs ${rival} [${f.league.name}]`;
        }).join(" | ");
      };

      // Stats avanzadas de cada equipo en últimos partidos
      const calcStats = (fixtures, teamId) => {
        let corners=0, shots=0, shotsOT=0, yellow=0, games=0;
        fixtures.slice(0,5).forEach(f=>{
          const stats = f.statistics||[];
          if(!stats.length) return;
          const isHome = f.teams.home.id===teamId;
          const side   = stats[isHome?0:1]?.statistics||[];
          const get    = (type) => side.find(s=>s.type===type)?.value||0;
          corners  += parseInt(get("Corner Kicks"))||0;
          shots    += parseInt(get("Total Shots"))||0;
          shotsOT  += parseInt(get("Shots on Goal"))||0;
          yellow   += parseInt(get("Yellow Cards"))||0;
          games++;
        });
        if(!games) return "Sin stats detalladas.";
        return `Córners/p: ${(corners/games).toFixed(1)} | Remates/p: ${(shots/games).toFixed(1)} | Al arco/p: ${(shotsOT/games).toFixed(1)} | Amarillas/p: ${(yellow/games).toFixed(1)}`;
      };

      const statsLocal = calcStats(formaL, localId);
      const statsVisit = calcStats(formaV, visitId);

      // ── 3. Prompt a Claude con todos los datos reales ────────────────────
      const prompt = `Sos el mejor analista de fútbol del mundo. Tenés estos DATOS REALES de API-Football:

🏟️ PARTIDO: ${localName} vs ${visitName}
🏆 Liga: ${liga.nombre.replace(/[^\w\s]/g,"").trim()} | ${partido.fixture.date?.slice(0,10)}
📍 Estado: ${partido.fixture.status?.long||"Programado"}

⚔️ H2H (últimos ${h2h.length} partidos reales):
${resumeH2H}
${h2hStats}

📈 FORMA ${localName} (últimos ${formaL.length} partidos):
${resumeForma(formaL, localId)}
📊 Stats promedio ${localName}: ${statsLocal}

📈 FORMA ${visitName} (últimos ${formaV.length} partidos):
${resumeForma(formaV, visitId)}
📊 Stats promedio ${visitName}: ${statsVisit}

Basate ESTRICTAMENTE en estos datos reales. Respondé SOLO JSON sin markdown ni backticks:
{
  "cuotas": {
    "local": número_decimal,
    "empate": número_decimal,
    "visitante": número_decimal,
    "nota": "justificación basada en datos reales"
  },
  "prediccion": {
    "resultado": "Local"|"Empate"|"Visitante",
    "confianza": número_1_100,
    "marcador": "X-X",
    "resumen": "análisis 2 oraciones basado en H2H y forma reales"
  },
  "factores": [
    "factor específico basado en datos 1",
    "factor específico basado en datos 2",
    "factor específico basado en datos 3",
    "factor específico basado en datos 4"
  ],
  "combinadas": [
    {"nombre":"Victoria Local","tipo":"1X2","seleccion":"${localName} gana","prob":número,"cuota":número,"razon":"basado en H2H/forma real","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Doble oportunidad 1X","tipo":"Doble oportunidad","seleccion":"${localName} no pierde","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Doble oportunidad X2","tipo":"Doble oportunidad","seleccion":"${visitName} no pierde","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Ambos marcan — SÍ","tipo":"BTTS","seleccion":"Los dos equipos anotan","prob":número,"cuota":número,"razon":"basado en % BTTS del H2H real","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Ambos marcan — NO","tipo":"BTTS","seleccion":"Al menos uno no anota","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Más de 2.5 goles","tipo":"Total goles","seleccion":"3+ goles en el partido","prob":número,"cuota":número,"razon":"basado en promedio goles H2H","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Menos de 2.5 goles","tipo":"Total goles","seleccion":"Máximo 2 goles","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Más de 3.5 goles","tipo":"Total goles","seleccion":"4+ goles","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Córners: más de 9.5","tipo":"Córners","seleccion":"10+ córners totales","prob":número,"cuota":número,"razon":"basado en stats de córners reales","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Córners: menos de 9.5","tipo":"Córners","seleccion":"9 o menos córners","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Córners 1T: más de 4.5","tipo":"Córners 1T","seleccion":"5+ córners en 1T","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Tarjetas: más de 3.5","tipo":"Tarjetas","seleccion":"4+ tarjetas amarillas","prob":número,"cuota":número,"razon":"basado en promedio amarillas real","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Tarjeta roja","tipo":"Tarjeta roja","seleccion":"Al menos una expulsión","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Portería a cero Local","tipo":"Clean sheet","seleccion":"${localName} no recibe gol","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Portería a cero Visitante","tipo":"Clean sheet","seleccion":"${visitName} no recibe gol","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Hándicap -1 Local","tipo":"Hándicap","seleccion":"${localName} gana por 2+","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Gol antes del min 15","tipo":"Gol rápido","seleccion":"Gol antes del minuto 15","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Local gana 1er tiempo","tipo":"Resultado 1T","seleccion":"${localName} gana al descanso","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Empate al descanso","tipo":"Resultado 1T","seleccion":"Igualdad al descanso","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Palo o travesaño","tipo":"Impacto marco","seleccion":"Al menos 1 remate al palo","prob":número,"cuota":número,"razon":"basado en remates stats reales","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Penalti pitado","tipo":"Penalti","seleccion":"Al menos un penalti en el partido","prob":número,"cuota":número,"razon":"razón","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Más de 19.5 remates","tipo":"Remates","seleccion":"20+ remates totales","prob":número,"cuota":número,"razon":"basado en remates/partido reales","riesgo":"Bajo"|"Medio"|"Alto"},
    {"nombre":"Más de 5.5 remates al arco","tipo":"Remates al arco","seleccion":"6+ remates entre los tres palos","prob":número,"cuota":número,"razon":"basado en shots on target reales","riesgo":"Bajo"|"Medio"|"Alto"}
  ],
  "marcador_correcto": {
    "recomendacion": "apostar"|"evitar",
    "marcadores": [
      {"marcador":"X-X","prob":número,"cuota":número},
      {"marcador":"X-X","prob":número,"cuota":número},
      {"marcador":"X-X","prob":número,"cuota":número},
      {"marcador":"X-X","prob":número,"cuota":número}
    ],
    "analisis": "análisis basado en H2H goles reales",
    "alternativa": "alternativa si se recomienda evitar"
  },
  "apuesta_valor": {
    "seleccion": "descripción de la mejor apuesta",
    "cuota": número,
    "razon": "justificación con datos reales"
  }
}`;

      const res = await fetch(CLAUDE_API,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:6000,messages:[{role:"user",content:prompt}]})});
      const d2  = await res.json();
      const raw = d2.content?.map(b=>b.text||"").join("")||"";
      setAnalysis(JSON.parse(raw.replace(/```json|```/g,"").trim()));
      setSeccion("pred");
    } catch(e){ setAnalysis({error:`Error: ${e.message}`}); }
    clearInterval(iv); setLoading(false); setLoadStep("");
  }

  // ── Cuota simulador ───────────────────────────────────────────────────────
  const cuotaSim = analysis
    ? simPick==="Local"?analysis.cuotas.local
    : simPick==="Empate"?analysis.cuotas.empate
    : simPick==="Visitante"?analysis.cuotas.visitante:null : null;
  const ganancia    = simPick&&simMonto&&parseFloat(simMonto)>0&&cuotaSim ? parseFloat(simMonto)*cuotaSim : 0;
  const gananciaNet = ganancia - parseFloat(simMonto||0);

  // ── Helpers de render ─────────────────────────────────────────────────────
  const getFormaString = (fixtures, teamId) => {
    if(!fixtures?.length) return [];
    return fixtures.slice(0,6).map(f=>{
      const esL = f.teams.home.id===teamId;
      const gf  = esL?f.goals.home??0:f.goals.away??0;
      const gc  = esL?f.goals.away??0:f.goals.home??0;
      return gf>gc?"V":gf<gc?"D":"E";
    });
  };

  // ── Estilos ───────────────────────────────────────────────────────────────
  const c = {
    app:    {minHeight:"100vh",background:"linear-gradient(160deg,#04080f 0%,#070f1e 50%,#040a14 100%)",fontFamily:"'Outfit',sans-serif",color:"#dde8f5",margin:0,padding:0},
    hdr:    {background:"rgba(255,255,255,0.025)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"14px 18px",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100},
    body:   {padding:"16px",maxWidth:960,margin:"0 auto"},
    card:   {background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:13,padding:15,marginBottom:11},
    cardB:  {background:"rgba(0,180,216,0.05)",border:"1px solid rgba(0,180,216,0.22)",borderRadius:13,padding:15,marginBottom:11},
    cardG:  {background:"rgba(255,179,0,0.04)",border:"1px solid rgba(255,179,0,0.18)",borderRadius:13,padding:15,marginBottom:11},
    cardGr: {background:"rgba(0,230,118,0.05)",border:"1px solid rgba(0,230,118,0.2)",borderRadius:13,padding:15,marginBottom:11},
    sel:    {background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#dde8f5",padding:"9px 11px",fontSize:13,width:"100%",outline:"none",cursor:"pointer"},
    inp:    {background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#dde8f5",padding:"9px 11px",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box"},
    lbl:    {fontSize:10,fontWeight:700,letterSpacing:".8px",color:"#546e7a",textTransform:"uppercase",marginBottom:5,display:"block"},
    btn:    {background:"linear-gradient(135deg,#c8a84b,#8a6d1f)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,padding:"13px 22px",cursor:"pointer",width:"100%",letterSpacing:"0.3px"},
    secBtn: (a)=>({background:a?"rgba(200,168,75,0.15)":"none",border:a?"1px solid rgba(200,168,75,0.4)":"1px solid rgba(255,255,255,0.06)",borderRadius:7,color:a?"#c8a84b":"#607d8b",fontSize:11,fontWeight:600,padding:"6px 12px",cursor:"pointer",transition:"all .2s"}),
    badge:  (col)=>({display:"inline-block",background:`${col}22`,color:col,border:`1px solid ${col}44`,borderRadius:5,padding:"3px 8px",fontSize:10,fontWeight:700}),
    secTit: {fontSize:10,fontWeight:700,letterSpacing:"1px",color:"#546e7a",textTransform:"uppercase",marginBottom:8},
    g2:     {display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},
    g3:     {display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9},
    pill:   (r)=>({display:"inline-flex",alignItems:"center",justifyContent:"center",width:25,height:25,borderRadius:"50%",background:r==="V"?"rgba(0,230,118,.15)":r==="D"?"rgba(255,82,82,.15)":"rgba(255,179,0,.15)",color:r==="V"?"#00e676":r==="D"?"#ff5252":"#ffb300",fontSize:11,fontWeight:800,border:`1px solid ${r==="V"?"#00e67644":r==="D"?"#ff525244":"#ffb30044"}`}),
    pickBtn:(a)=>({background:a?"rgba(200,168,75,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${a?"#c8a84b":"rgba(255,255,255,0.1)"}`,borderRadius:10,color:a?"#c8a84b":"#90a4ae",fontSize:13,fontWeight:a?700:500,padding:"11px 10px",cursor:"pointer",flex:1,textAlign:"center",transition:"all .2s"}),
    mBtn:   (a)=>({background:a?"rgba(200,168,75,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${a?"#c8a84b":"rgba(255,255,255,0.08)"}`,borderRadius:7,color:a?"#c8a84b":"#90a4ae",fontSize:12,fontWeight:700,padding:"6px 9px",cursor:"pointer"}),
    hr:     {borderBottom:"1px solid rgba(255,255,255,0.05)",margin:"6px 0"},
    statRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:12},
  };

  const localName  = partido?.teams.home.name||"";
  const visitName  = partido?.teams.away.name||"";
  const localLogo  = partido?.teams.home.logo||"";
  const visitLogo  = partido?.teams.away.logo||"";

  return (
    <div style={c.app}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        select option{background:#0a1220;color:#dde8f5}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(200,168,75,.35);border-radius:99px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>

      {/* ── HEADER ── */}
      <div style={c.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,background:"linear-gradient(135deg,#c8a84b,#6b4f10)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>💰</div>
          <div>
            <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.5px",background:"linear-gradient(90deg,#c8a84b,#f0d080)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              SALVADA
            </div>
            <div style={{fontSize:10,color:"#4a5568",marginTop:-2,letterSpacing:"1px"}}>SALVACIÓN DE POBREZA 😂</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {apiOk===null && <span style={{fontSize:11,color:"#546e7a",animation:"pulse 1s infinite"}}>Conectando…</span>}
            {apiOk===true && <span style={c.badge("#00e676")}>✅ API en vivo</span>}
            {apiOk===false && <span style={c.badge("#ff5252")}>❌ Sin conexión</span>}
          </div>
        </div>
      </div>

      <div style={c.body}>

        {/* API no conectada */}
        {apiOk===false && (
          <div style={{...c.card,borderColor:"rgba(255,82,82,.3)",padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#ff5252",marginBottom:8}}>❌ No se puede conectar al proxy</div>
            <div style={{fontSize:12,color:"#90a4ae",lineHeight:1.7}}>
              Verificá que el repo <strong>salvada-proxy</strong> en Vercel esté deployado correctamente y que la variable de entorno <strong>API_KEY</strong> esté configurada.<br/>
              URL del proxy: <code style={{color:"#c8a84b"}}>https://salvada-proxy.vercel.app/api/proxy</code>
            </div>
          </div>
        )}

        {/* ── SELECTOR ── */}
        {apiOk && (
          <div style={c.card}>
            <div style={c.secTit}>Seleccionar partido</div>
            <div style={{marginBottom:10}}>
              <label style={c.lbl}>Competición</label>
              <select style={c.sel} value={ligaIdx} onChange={e=>setLigaIdx(Number(e.target.value))}>
                {LIGAS.map((l,i)=><option key={i} value={i}>{l.nombre}</option>)}
              </select>
            </div>

            {loadFix && (
              <div style={{textAlign:"center",padding:"14px 0",color:"#546e7a",fontSize:12,animation:"pulse 1s infinite"}}>
                ⚡ Cargando partidos reales…
              </div>
            )}
            {errFix && <div style={{fontSize:12,color:"#ff5252",marginBottom:8}}>⚠️ {errFix}</div>}

            {!loadFix && fixtures.length>0 && (
              <div style={{marginBottom:12}}>
                <label style={c.lbl}>Partido ({fixtures.length} encontrados)</label>
                <select style={c.sel} value={pidx} onChange={e=>setPidx(Number(e.target.value))}>
                  {fixtures.map((f,i)=>{
                    const fecha = new Date(f.fixture.date).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
                    const st = f.fixture.status?.short;
                    const live = ["1H","2H","HT","ET","BT","P"].includes(st);
                    const fin  = ["FT","AET","PEN"].includes(st);
                    const score = fin ? ` (${f.goals.home??"-"}-${f.goals.away??"-"})` : "";
                    const prefix = live?"🔴 ":fin?"✅ ":"🕐 ";
                    return <option key={i} value={i}>{prefix}{f.teams.home.name} vs {f.teams.away.name}{score} — {fecha} ({f.league.round})</option>;
                  })}
                </select>
              </div>
            )}

            {/* Partido seleccionado */}
            {partido && (
              <div style={{background:"rgba(200,168,75,0.06)",border:"1px solid rgba(200,168,75,0.2)",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                    <div style={{fontSize:28,lineHeight:1}}>{partido.teams.home.emoji||"⚽"}</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:800}}>{localName}</div>
                      <div style={{fontSize:10,color:"#546e7a"}}>Local</div>
                    </div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    {(()=>{
                      const st = partido.fixture.status?.short;
                      const live = ["1H","2H","HT","ET","BT","P"].includes(st);
                      const fin  = ["FT","AET","PEN"].includes(st);
                      if(live) return (
                        <div>
                          <div style={{fontSize:22,fontWeight:900,color:"#ff5252"}}>{partido.goals.home??0} – {partido.goals.away??0}</div>
                          <div style={{fontSize:10,color:"#ff5252",animation:"pulse 1s infinite"}}>🔴 EN VIVO · {partido.fixture.status?.elapsed}'</div>
                        </div>
                      );
                      if(fin) return (
                        <div>
                          <div style={{fontSize:22,fontWeight:900}}>{partido.goals.home} – {partido.goals.away}</div>
                          <div style={{fontSize:10,color:"#546e7a"}}>Final</div>
                        </div>
                      );
                      const fecha = new Date(partido.fixture.date).toLocaleDateString("es-AR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
                      return <div style={{textAlign:"center"}}><div style={{fontSize:12,color:"#c8a84b",fontWeight:700}}>vs</div><div style={{fontSize:11,color:"#546e7a",marginTop:2}}>{fecha}</div></div>;
                    })()}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1,justifyContent:"flex-end"}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:15,fontWeight:800}}>{visitName}</div>
                      <div style={{fontSize:10,color:"#546e7a"}}>Visitante</div>
                    </div>
                    <div style={{fontSize:28,lineHeight:1}}>{partido.teams.away.emoji||"⚽"}</div>
                  </div>
                </div>
                <div style={{fontSize:10,color:"#546e7a",textAlign:"center",marginTop:8}}>{partido.league.name} · {partido.league.round}</div>
              </div>
            )}

            {(() => {
              const st = partido?.fixture?.status?.short;
              const fin = ["FT","AET","PEN"].includes(st);
              if(fin) return (
                <div style={{background:"rgba(255,82,82,0.08)",border:"1px solid rgba(255,82,82,0.25)",borderRadius:10,padding:"13px",textAlign:"center",color:"#ff5252",fontWeight:700,fontSize:13}}>
                  🏁 Partido finalizado — Solo podés analizar partidos por jugar
                </div>
              );
              return (
                <button style={{...c.btn,opacity:loading||!partido?0.6:1}} onClick={analizar} disabled={loading||!partido}>
                  {loading?`⚡ ${loadStep}`:"🔍 Analizar con datos reales"}
                </button>
              );
            })()}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={{...c.card,textAlign:"center",padding:32}}>
            <div style={{fontSize:34,display:"inline-block",animation:"spin 1.4s linear infinite",marginBottom:10}}>⚙️</div>
            <div style={{color:"#c8a84b",fontWeight:700}}>{loadStep}</div>
            <div style={{color:"#546e7a",fontSize:11,marginTop:4}}>Procesando H2H + forma + stats reales…</div>
          </div>
        )}

        {analysis?.error && (
          <div style={{...c.card,borderColor:"rgba(255,82,82,.3)",color:"#ff5252",fontSize:13}}>⚠️ {analysis.error}</div>
        )}

        {analysis&&!analysis.error && (
          <div style={{animation:"fadeUp .4s ease"}}>

            {/* CUOTAS */}
            <div style={c.cardG}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:10}}>
                <div style={c.secTit}>Cuotas estimadas</div>
                <span style={c.badge("#c8a84b")}>Calculadas con datos H2H reales</span>
              </div>
              <div style={c.g3}>
                {[[localName,analysis.cuotas.local,"Local"],[" Empate ",analysis.cuotas.empate,"Empate"],[visitName,analysis.cuotas.visitante,"Visitante"]].map(([lbl,cuota,pick])=>(
                  <div key={pick} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:11,padding:"12px 8px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#546e7a",marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lbl}</div>
                    <div style={{fontSize:24,fontWeight:900,color:"#c8a84b"}}>{cuota}</div>
                    <div style={{fontSize:9,color:"#607d8b",marginTop:1}}>{Math.round(100/cuota)}% prob.</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:"#546e7a",marginTop:8}}>💡 {analysis.cuotas.nota}</div>
            </div>

            {/* SIMULADOR */}
            <div style={c.cardGr}>
              <div style={{fontSize:13,fontWeight:800,color:"#00e676",marginBottom:11,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                💰 Simulador — ¿Cuánto ganás?
                <span style={{fontSize:10,color:"#546e7a",fontWeight:400}}>Solo simulación</span>
              </div>
              <div style={c.secTit}>¿A quién apostás?</div>
              <div style={{display:"flex",gap:7,marginBottom:11,flexWrap:"wrap"}}>
                {[["Local",localName,analysis.cuotas.local],["Empate","Empate",analysis.cuotas.empate],["Visitante",visitName,analysis.cuotas.visitante]].map(([pick,lbl,cuota])=>(
                  <button key={pick} style={c.pickBtn(simPick===pick)} onClick={()=>setSimPick(pick)}>
                    <div style={{fontSize:10,marginBottom:2,opacity:.7,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lbl}</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#c8a84b"}}>{cuota}</div>
                  </button>
                ))}
              </div>
              <div style={c.secTit}>Monto rápido (ARS $)</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                {MONTOS.map(m=><button key={m} style={c.mBtn(simMonto===String(m))} onClick={()=>setSimMonto(String(m))}>{fmtARS(m)}</button>)}
              </div>
              <div style={{marginBottom:10}}>
                <label style={c.lbl}>O escribí el monto</label>
                <input style={c.inp} type="number" placeholder="Ej: 3500" min="1" value={simMonto} onChange={e=>setSimMonto(e.target.value)}/>
              </div>
              {simPick&&simMonto&&parseFloat(simMonto)>0&&cuotaSim ? (
                <div style={{background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,230,118,0.25)",borderRadius:11,padding:14}}>
                  <div style={c.g2}>
                    <div>
                      <div style={{fontSize:10,color:"#546e7a",marginBottom:3}}>APOSTÁS A</div>
                      <div style={{fontSize:12,fontWeight:700}}>{simPick==="Local"?localName:simPick==="Visitante"?visitName:"Empate"}</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#c8a84b",marginTop:2}}>× {cuotaSim}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:10,color:"#546e7a",marginBottom:3}}>MONTO</div>
                      <div style={{fontSize:12,fontWeight:700}}>{fmtARS(parseFloat(simMonto))}</div>
                      <div style={{fontSize:10,color:"#546e7a",marginTop:7}}>SI GANÁS RECIBÍS</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#00e676"}}>{fmtARS(ganancia)}</div>
                    </div>
                  </div>
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",marginTop:11,paddingTop:11,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div><div style={{fontSize:10,color:"#546e7a"}}>GANANCIA NETA</div><div style={{fontSize:19,fontWeight:900,color:"#00e676"}}>+{fmtARS(gananciaNet)}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#546e7a"}}>ROI</div><div style={{fontSize:19,fontWeight:900,color:"#00e676"}}>+{((cuotaSim-1)*100).toFixed(0)}%</div></div>
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:14,color:"#37474f",fontSize:11}}>☝️ Seleccioná resultado y monto para simular</div>
              )}
            </div>

            {/* SUB-NAV */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:11}}>
              {SECCIONES.map(sec=><button key={sec.id} style={c.secBtn(seccion===sec.id)} onClick={()=>setSeccion(sec.id)}>{sec.label}</button>)}
            </div>

            {/* PREDICCIÓN */}
            {seccion==="pred" && <div style={c.cardB}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:13}}>
                <div>
                  <div style={c.secTit}>Resultado predicho</div>
                  <div style={{fontSize:26,fontWeight:900,color:"#00b4d8"}}>
                    {analysis.prediccion.resultado==="Local"?localName:analysis.prediccion.resultado==="Visitante"?visitName:"Empate"}
                  </div>
                  <div style={{fontSize:12,color:"#90a4ae",marginTop:4,lineHeight:1.6,maxWidth:400}}>{analysis.prediccion.resumen}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={c.secTit}>Confianza</div>
                  <div style={{fontSize:38,fontWeight:900,color:confClr(analysis.prediccion.confianza)}}>{analysis.prediccion.confianza}%</div>
                  <div style={{fontSize:11,color:"#607d8b"}}>Marcador: <strong style={{color:"#fff"}}>{analysis.prediccion.marcador}</strong></div>
                </div>
              </div>
              <div style={c.secTit}>Factores clave (basados en datos reales)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {analysis.factores?.map((f,i)=><span key={i} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:7,padding:"4px 10px",fontSize:11}}>{f}</span>)}
              </div>
              {analysis.apuesta_valor&&<div style={{background:"rgba(0,230,118,.06)",border:"1px solid rgba(0,230,118,.18)",borderRadius:9,padding:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontSize:10,color:"#00e676",fontWeight:700,letterSpacing:"1px",marginBottom:3}}>✅ APUESTA DE MAYOR VALOR</div>
                    <div style={{fontSize:13,fontWeight:700}}>{analysis.apuesta_valor.seleccion}</div>
                    <div style={{fontSize:11,color:"#90a4ae",marginTop:3}}>{analysis.apuesta_valor.razon}</div>
                  </div>
                  <div style={{fontSize:26,fontWeight:900,color:"#00e676"}}>{analysis.apuesta_valor.cuota}</div>
                </div>
              </div>}
            </div>}

            {/* H2H REAL */}
            {seccion==="h2h" && <div style={c.card}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
                <div style={c.secTit}>⚔️ H2H — Datos reales API-Football</div>
                <span style={c.badge("#00e676")}>✅ Verificado</span>
              </div>
              {!h2hData||h2hData.length===0?(
                <div style={{textAlign:"center",padding:20,color:"#546e7a",fontSize:12}}>Sin enfrentamientos previos registrados entre estos equipos.</div>
              ):(()=>{
                let vL=0,emp=0,vV=0,tg=0,btts=0;
                h2hData.forEach(f=>{
                  const hg=f.goals.home??0, ag=f.goals.away??0;
                  tg+=hg+ag; if(hg>0&&ag>0)btts++;
                  const esL=f.teams.home.id===partido.teams.home.id;
                  if(hg>ag){esL?vL++:vV++;} else if(hg<ag){esL?vV++:vL++;} else emp++;
                });
                return <>
                  <div style={c.g3}>
                    {[[`Vic. ${localName}`,vL,"#00b4d8"],["Empates",emp,"#ffb300"],[`Vic. ${visitName}`,vV,"#ff5252"]].map(([l,v,col],i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:9,padding:12,textAlign:"center"}}>
                        <div style={{fontSize:24,fontWeight:900,color:col}}>{v}</div>
                        <div style={{fontSize:10,color:"#546e7a",marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:16,margin:"10px 0 13px",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#546e7a"}}>📊 {h2hData.length} partidos</span>
                    <span style={{fontSize:11,color:"#546e7a"}}>⚽ Prom: {(tg/h2hData.length).toFixed(1)} goles</span>
                    <span style={{fontSize:11,color:"#546e7a"}}>🎯 Ambos marcan: {Math.round(btts/h2hData.length*100)}%</span>
                  </div>
                  <div style={c.secTit}>Resultados reales</div>
                  {h2hData.map((f,i)=>{
                    const hg=f.goals.home??"-", ag=f.goals.away??"-";
                    const fecha=f.fixture.date?.slice(0,10);
                    return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",...c.hr}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600}}>{f.teams.home.name} <span style={{color:"#00b4d8",fontWeight:900}}>{hg}–{ag}</span> {f.teams.away.name}</div>
                        <div style={{fontSize:10,color:"#546e7a"}}>{f.league.name} · {f.league.round}</div>
                      </div>
                      <div style={{fontSize:11,color:"#607d8b",textAlign:"right"}}>
                        <div>{f.league.season}</div><div style={{fontSize:10,color:"#37474f"}}>{fecha}</div>
                      </div>
                    </div>;
                  })}
                </>;
              })()}
            </div>}

            {/* FORMA */}
            {seccion==="forma" && <div>
              {[[localName,partido.teams.home.id,formaData?.local,localLogo],[visitName,partido.teams.away.id,formaData?.visitante,visitLogo]].map(([nombre,tid,fixtures,logo])=>(
                <div key={nombre} style={c.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontSize:22}}>{fixtures?.[0]?.teams.home.id===tid ? fixtures[0].teams.home.emoji : fixtures?.[0]?.teams.away.emoji || "⚽"}</div>
                      <div style={{fontSize:14,fontWeight:800}}>{nombre}</div>
                      <span style={c.badge("#00e676")}>✅ Real</span>
                    </div>
                    <div style={{display:"flex",gap:4}}>{getFormaString(fixtures,tid).map((r,i)=><div key={i} style={c.pill(r)}>{r}</div>)}</div>
                  </div>
                  {!fixtures?.length?(
                    <div style={{color:"#546e7a",fontSize:11,textAlign:"center",padding:10}}>Sin datos disponibles.</div>
                  ):fixtures.slice(0,6).map((f,i)=>{
                    const esL=f.teams.home.id===tid;
                    const gf=parseInt(esL?f.goals.home??0:f.goals.away??0);
                    const gc=parseInt(esL?f.goals.away??0:f.goals.home??0);
                    const rival=esL?f.teams.away.name:f.teams.home.name;
                    const r=gf>gc?"V":gf<gc?"D":"E";
                    const rivalLogo=esL?f.teams.away.logo:f.teams.home.logo;
                    return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",...c.hr,fontSize:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <div style={{...c.pill(r),width:22,height:22,fontSize:10}}>{r}</div>

                        <span>vs <strong>{rival}</strong></span>
                      </div>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{color:resClr(gf,gc),fontWeight:700,fontSize:14}}>{gf}–{gc}</span>
                        <span style={{fontSize:10,color:"#546e7a"}}>{f.league.name}</span>
                        <span style={{fontSize:10,color:"#37474f"}}>{f.fixture.date?.slice(0,10)}</span>
                      </div>
                    </div>;
                  })}
                </div>
              ))}
            </div>}

            {/* STATS */}
            {seccion==="stats" && <div style={c.card}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
                <div style={c.secTit}>📊 Estadísticas del partido</div>
                <span style={c.badge(statsData?.length>0?"#00e676":"#ffb300")}>{statsData?.length>0?"✅ Datos reales":"⚠️ Aún no disponibles"}</span>
              </div>
              {!statsData||statsData.length===0?(
                <div style={{textAlign:"center",padding:20,color:"#546e7a",fontSize:12}}>
                  Las estadísticas detalladas del partido estarán disponibles una vez que el partido haya comenzado o finalizado.
                </div>
              ):(()=>{
                const homeStats = statsData[0]?.statistics||[];
                const awayStats = statsData[1]?.statistics||[];
                const pairs = homeStats.map((hs,i)=>({
                  tipo:hs.type, local:hs.value??0, visitante:awayStats[i]?.value??0
                }));
                return pairs.map((p,i)=>{
                  const total = (parseInt(p.local)||0)+(parseInt(p.visitante)||0)||1;
                  const pct   = Math.round((parseInt(p.local)||0)/total*100);
                  return <div key={i} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                      <span style={{fontWeight:700,color:"#00b4d8"}}>{p.local}</span>
                      <span style={{color:"#546e7a"}}>{p.tipo}</span>
                      <span style={{fontWeight:700,color:"#ff5252"}}>{p.visitante}</span>
                    </div>
                    <div style={{background:"rgba(255,82,82,0.3)",borderRadius:99,height:5,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:"#00b4d8",borderRadius:99}}/>
                    </div>
                  </div>;
                });
              })()}
            </div>}

            {/* COMBINADAS */}
            {seccion==="combo" && <div>
              <div style={{fontSize:12,color:"#90a4ae",marginBottom:11,lineHeight:1.6}}>
                {analysis.combinadas?.length} mercados — probabilidades calculadas con datos reales H2H y forma:
              </div>
              {analysis.combinadas?.map((com,i)=>(
                <div key={i} style={{...c.card,marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:700}}>{com.nombre}</span>
                        <span style={c.badge(riskClr(com.riesgo))}>{com.riesgo}</span>
                        <span style={{fontSize:9,color:"#546e7a",background:"rgba(255,255,255,0.04)",borderRadius:4,padding:"2px 6px"}}>{com.tipo}</span>
                      </div>
                      <div style={{fontSize:12,color:"#c8a84b",fontWeight:600,marginBottom:4}}>📌 {com.seleccion}</div>
                      <div style={{fontSize:11,color:"#90a4ae",lineHeight:1.5}}>{com.razon}</div>
                    </div>
                    <div style={{textAlign:"right",minWidth:68}}>
                      <div style={{fontSize:23,fontWeight:900,color:"#c8a84b"}}>{com.cuota}</div>
                      <div style={{fontSize:10,color:"#546e7a"}}>{com.prob}%</div>
                    </div>
                  </div>
                  <div style={{marginTop:7,background:"rgba(255,255,255,0.04)",borderRadius:99,height:4,overflow:"hidden"}}>
                    <div style={{width:`${com.prob}%`,height:"100%",background:`linear-gradient(90deg,${riskClr(com.riesgo)},${riskClr(com.riesgo)}66)`,borderRadius:99,transition:"width .6s"}}/>
                  </div>
                </div>
              ))}
            </div>}

            {/* MARCADOR */}
            {seccion==="score" && <div style={c.card}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
                <div style={c.secTit}>¿Apostar al marcador exacto?</div>
                <span style={c.badge(analysis.marcador_correcto.recomendacion==="apostar"?"#00e676":"#ff5252")}>
                  {analysis.marcador_correcto.recomendacion==="apostar"?"✅ RECOMENDADO":"⚠️ MEJOR EVITAR"}
                </span>
              </div>
              <div style={{fontSize:12,color:"#90a4ae",marginBottom:13,lineHeight:1.7}}>{analysis.marcador_correcto.analisis}</div>
              <div style={c.secTit}>Marcadores más probables</div>
              {analysis.marcador_correcto.marcadores?.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",...c.hr}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:19,fontWeight:900,color:"#fff",minWidth:32}}>{m.marcador}</span>
                    <div>
                      <div style={{background:"rgba(255,255,255,0.05)",borderRadius:99,height:6,width:110,overflow:"hidden"}}>
                        <div style={{width:`${m.prob}%`,height:"100%",background:"linear-gradient(90deg,#c8a84b,#8a6d1f)",borderRadius:99}}/>
                      </div>
                      <div style={{fontSize:10,color:"#546e7a",marginTop:2}}>{m.prob}% de probabilidad</div>
                    </div>
                  </div>
                  <div style={{fontSize:21,fontWeight:900,color:"#c8a84b"}}>{m.cuota}</div>
                </div>
              ))}
              {analysis.marcador_correcto.recomendacion==="evitar"&&analysis.marcador_correcto.alternativa&&(
                <div style={{marginTop:12,background:"rgba(0,230,118,.06)",border:"1px solid rgba(0,230,118,.18)",borderRadius:9,padding:12}}>
                  <div style={{fontSize:10,color:"#00e676",fontWeight:700,letterSpacing:"1px",marginBottom:4}}>💡 ALTERNATIVA RECOMENDADA</div>
                  <div style={{fontSize:12,lineHeight:1.6}}>{analysis.marcador_correcto.alternativa}</div>
                </div>
              )}
            </div>}

          </div>
        )}
      </div>

      <div style={{textAlign:"center",padding:"10px 18px 22px",fontSize:10,color:"#1a2535"}}>
        ⚠️ Solo entretenimiento. Las cuotas son estimaciones. Jugá responsablemente. +18.
      </div>
    </div>
  );
}
