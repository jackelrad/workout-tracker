import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PHASES = ["Hypertrophy","Hypertrophy","Hypertrophy","Hypertrophy","Strength","Strength","Strength","Strength","Peaking","Peaking","Peaking","Deload"];
const PHASE_COLORS = { "Hypertrophy":"#22C55E","Strength":"#F97316","Peaking":"#EF4444","Deload":"#6B7280" };

function parseRest(str) {
  const m = str.match(/(\d+)\s*min/); if (m) return parseInt(m[1]) * 60;
  const s = str.match(/(\d+)s/);      if (s) return parseInt(s[1]);
  return 90;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach(t => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.25;
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.12);
    });
  } catch(e) {}
}

const FORM_CUES = {
  bench:        { setup:"Grip slightly wider than shoulder-width. Slight natural arch. Butt stays on bench. Feet flat — drive through heels.", cues:"Bar path: lower to mid-chest at a slight diagonal. Elbows 45-75° from torso — not flared. Touch chest lightly, brief pause, press. Think: leg drive into the floor as you press." },
  pushdown:     { setup:"Cable set high. Rope attachment. Slight hip hinge forward. Elbows pinned to your sides — they don't move.", cues:"Pull rope ends apart at the bottom for full contraction. 2s eccentric on the way up. If elbows are flaring or lifting, drop the weight." },
  incline:      { setup:"Bench at 30-45°. DBs at chest level, elbows slightly below bench line at the bottom.", cues:"Press straight up — don't let DBs travel toward each other. Feel the stretch at the bottom. Stop just short of lockout. Shoulders packed, not shrugging." },
  skull:        { setup:"Lie flat, EZ bar over forehead. Elbows shoulder-width apart, pointed at the ceiling.", cues:"Lower bar just behind your forehead. Elbows stay pointing up throughout — flaring is the key failure point. Controlled down, press up. 10lb increments only at your gym." },
  fly:          { setup:"Cable at chest height or slightly above. Slight forward lean. Slight bend in elbows — hold that angle the entire set.", cues:"Drive with upper arms, not hands. Think 'hugging a tree.' Full stretch at start. Stop just before hands touch. Don't let the weight yank your shoulder back." },
  kickback:     { setup:"Cable set low. Hinge forward at hips, upper arm parallel to the floor and pinned to your side. Forearm hangs down at start.", cues:"Extend forearm back until arm is fully straight. Squeeze hard at the top for 1 count. Pure elbow extension — no shoulder movement. Replaces overhead extension: same isolation, zero shoulder strain." },
  pullup:       { setup:"Grip just outside shoulder-width, palms facing away. Dead hang to start. Engage lats before you pull.", cues:"Full dead hang between every rep — this is where ROM gets lost. Drive elbows down and back. Chin clears the bar every rep. Reduce reps before sacrificing range. Chest-to-bar is the long-term goal." },
  row:          { setup:"Bar below knee, slight knee bend, hinge at hips ~45°. Back neutral — not rounded. Pattern rebuild: prioritize form over load.", cues:"Drive elbows back, not up. Bar touches your lower abdomen at the top. Pause and squeeze. 2s controlled eccentric. Torso should not swing. Weight will climb quickly as the pattern comes back." },
  facepull:     { setup:"Cable at face height. Rope attachment. Step back until arms are extended.", cues:"Pull rope to your face, hands finishing beside your ears. Think 'show your armpits.' External rotation is the goal — shoulder health work. Light weight, high control, every week." },
  db_shoulder:  { setup:"Seated or standing. DBs at shoulder level, elbows slightly in front of your ears — not directly out to the sides.", cues:"Press overhead but stop short of lockout — keep tension on delts. Don't crane your neck forward. Controlled return. If lower back is arching, go seated." },
  incline_curl: { setup:"Bench at 45-60°. Arms hang fully behind torso — full stretch on the bicep long head. One DB per hand. Alternate arms each rep.", cues:"Supinated grip (palms up) throughout — not hammer grip. Curl from a full dead hang. Don't let elbows swing forward at the top. Slow eccentric — 2-3s down. If you're swinging, weight is too heavy." },
  lat_raise:    { setup:"Cable low. Start with hand at hip, slight bend in elbow. 12 reps per side — complete all reps on one side before switching.", cues:"Raise to shoulder height only — not above. Lead with your elbow, not your hand. Avoid shrugging at the top. Slow and controlled beats heavy and sloppy every time." },
  lat_pulldown: { setup:"Grip just outside shoulder-width, lean back slightly. Engage lats before you pull.", cues:"Pull bar to upper chest, driving elbows down and back. Don't lean back excessively. Full arm extension at the top on every rep — ROM first, weight second." },
  trap_bar:     { setup:"Stand centered in the trap bar. Hip hinge to grip, shins nearly vertical. Neutral spine — brace hard before lifting.", cues:"Drive through the floor, not up with your back. Think 'push the ground away.' Hips and shoulders rise at the same rate. Lock out with glutes, not hyperextension. Set the bar down with control." },
  leg_press:    { setup:"Feet shoulder-width, mid-plate or slightly high. Back flat against the pad. Weight shown is total load including the 140lb carriage — subtract 140 to find your plate load.", cues:"Lower until knees at or past 90° — don't cut the range. Knees track over toes, don't cave inward. Drive through the full foot. Stop just short of lockout to keep quads under tension. Both legs simultaneously." },
  rdl:          { setup:"Hip-width stance, slight knee bend that doesn't change. Bar close to legs throughout. Use a loadable bar from week 2 onwards to progress freely.", cues:"Hinge at hips — push them back, not down. Feel the hamstring stretch. Lower until stretch but spine stays neutral. 3s eccentric. Drive hips forward to return. This is not a squat." },
  calf:         { setup:"Stand on a plate or step with heels hanging off the edge. Hold DBs or plates at your sides. Knee stays straight throughout — this loads the gastrocnemius, the larger calf muscle.", cues:"Full stretch at the bottom — heel fully below the step, hold 1s. Drive all the way to the top — hold 1s at the top. Full ROM is more important than load. No bouncing." },
  leg_ext:      { setup:"Seat adjusted so knee joint aligns with machine pivot. Pad on lower shin. Both legs simultaneously throughout this program.", cues:"Extend fully, squeeze at top for 1 count. Slow eccentric — 2-3s down. Avoid swinging or momentum. Keep back against the pad throughout." },
  leg_curl:     { setup:"Lie face down, pad just above the ankle. Hips stay flat on the bench. Both legs simultaneously throughout this program.", cues:"Curl heels to glutes. Squeeze at the top. Slow eccentric — 2-3s. Don't let hips lift to compensate. Plantarflex feet (point toes) slightly to increase hamstring recruitment." }
};

const MOBILITY = {
  chest_tri: [
    { name:"Thoracic Rotation", timing:"5 reps/side · ~45s", instructions:"Sit or kneel with hands behind your head. Slowly rotate your upper back as far as you can each direction. Feel your mid-back — not your lower back — doing the work. Opens up the thoracic spine before bench." },
    { name:"Pec Minor Stretch", timing:"30s/side · ~60s", instructions:"Place forearm against a rack upright at 90°. Step through until you feel a stretch across your chest and front shoulder. Hold steady. Switch sides. Directly primes the pec for full range on bench and cable fly." }
  ],
  back_shoulder_bi: [
    { name:"Lat Hang", timing:"2 × 20s · ~60s", instructions:"Hang from the pull-up bar with a full dead hang. Let your shoulder blades rise fully. This activates the lat-to-shoulder connection before rows and pull-ups and decompresses the spine. Two short holds, not one long one." },
    { name:"Band Pull-Apart or Light Face Pull", timing:"2 × 15 reps · ~60s", instructions:"Use a light resistance band or the face pull cable at minimal weight. Pull apart or pull to face — focus on squeezing the rear delts and external rotators at the end range. Primes the rotator cuff before heavy pulling." }
  ],
  legs: [
    { name:"Leg Swings", timing:"10 reps/direction/side · ~60s", instructions:"Hold onto a rack. Swing each leg front-to-back 10 times, then side-to-side 10 times. Keep the movement controlled but full range. Wakes up the hip flexors, glutes, and adductors before hinge and press work." },
    { name:"Deep Squat Hold", timing:"2 × 20s · ~60s", instructions:"Hold a rack and lower into the deepest squat you can maintain with a flat back. Let your hips sink, knees track over toes. This opens up hip flexors and ankles — both tend to be tight before a leg session. Two holds, no bouncing." }
  ]
};

const PLAN = {
  chest_tri: {
    label:"Chest & Tri", day:"SUN", accent:"#F97316",
    notes:["Calibration week. 2 reps in reserve every set. Build from here.","Add 5lbs to bench and incline. Pushdown adds 2.5lbs. EZ bar holds at 50.","Another 5lbs on bench. EZ bar holds at 50 — build clean reps before jumping to 60.","Volume peak. More reps at slightly lower weight on main lifts.","Strength block. Weight jumps. Should feel hard by set 4.","All 5 sets. Controlled eccentric on bench — 2s down.","Heavier than last week. Short rest only if needed.","Last heavy week before peaking. Leave nothing.","Low volume, high intensity. Top sets matter.","Top set then back-off sets. Trust the fatigue.","Near-max bench attempt. Spotter recommended.","Deload. Light, full ROM, no strain."],
    groups:[
      { label:"Superset 1", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"bench", name:"Flat Barbell Bench Press", weights:[135,140,145,135,155,160,165,170,175,180,185,115], sets:[4,4,4,4,5,5,5,5,4,3,3,3], reps:["10","10","10","12","6","5","5","5","4","3","2-3","8"], backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"8",w:150},{sets:3,reps:"6",w:155},null] },
        { id:"pushdown", name:"Cable Tricep Pushdown (rope)", weights:[32.5,35,37.5,37.5,42.5,45,47.5,50,52.5,55,57.5,32.5], sets:[4,4,4,4,5,5,5,5,4,4,4,3], reps:["12","12","12","12","8","8","8","8","8","8","8","10"], backoff:Array(12).fill(null) }
      ]},
      { label:"Superset 2", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"incline", name:"Incline DB Press", weights:[45,50,50,45,55,60,60,65,65,70,70,40], sets:[4,4,4,4,5,5,5,5,4,3,3,3], reps:["10","10","10","12","6","6","5","5","4","3","2-3","8"], backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"6",w:55},{sets:3,reps:"6",w:55},null] },
        { id:"skull", name:"EZ Bar Skull Crushers", weights:[50,50,50,50,60,60,60,70,70,70,80,50], sets:[4,4,4,4,5,5,5,5,4,4,4,3], reps:["12","12","12","15","8","8","8","8","8","8","8","10"], backoff:Array(12).fill(null), note:"10lb increments only. Hold weight until form is locked before jumping." }
      ]},
      { label:"Superset 3", rest:"Rest 60s", supersetted:true, exercises:[
        { id:"fly", name:"Cable Fly (flat angle)", weights:[17.5,20,20,17.5,22.5,25,25,27.5,27.5,30,30,17.5], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","15","10","10","10","10","12","12","12","10"], backoff:Array(12).fill(null) },
        { id:"kickback", name:"Cable Tricep Kickback", weights:[15,17.5,20,20,22.5,25,27.5,30,30,32.5,35,15], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","15","10","10","10","10","12","12","12","10"], backoff:Array(12).fill(null), note:"Replaces overhead extension — full tricep isolation, no shoulder overhead load." }
      ]}
    ]
  },
  back_shoulder_bi: {
    label:"Back / Shoulder / Bi", day:"TUE", accent:"#3B82F6",
    notes:["Full ROM on every pull-up rep — reduce reps before sacrificing range. Row is a pattern rebuild: form over weight.","Pull-up: try to add a rep if ROM was full on all sets. Row adds 10lbs — stay strict.","Row: elbows drive back, not up. Pause at chest. Shoulder press: watch form on last set.","Volume peak. Higher reps throughout. Curl: 4 sets for bicep development.","Belt on for pull-ups. Strength block begins. Row weight climbing steadily now.","Push rows heavy. Controlled eccentric on every rep.","Shoulder press: form over weight. No cheat reps.","Last heavy week before peaking.","Chest-to-bar attempts on weighted pull-ups.","Heavy rows. Every set deliberate.","Near-max weighted pull-ups.","Deload. Move well, recover fully."],
    groups:[
      { label:"Straight Set", rest:"Rest 90s", supersetted:false, exercises:[
        { id:"pullup", name:"Pull-ups", weights:[0,0,0,0,10,15,20,20,25,30,35,0], sets:[4,4,4,4,4,4,4,4,4,4,4,3], reps:["8","8","9","10","6","6","5","5","4","3","3","6"], backoff:Array(12).fill(null), isPullup:true, note:"Full dead hang between every rep. Reduce reps before losing ROM. Chest-to-bar is the long-term goal." }
      ]},
      { label:"Superset 1", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"row", name:"Barbell Row", weights:[65,75,85,90,100,110,115,120,125,130,135,90], sets:[4,4,4,4,5,5,5,5,4,4,4,3], reps:["10","10","10","10","6","5","5","5","4","4","4","8"], backoff:Array(12).fill(null), note:"Pattern rebuild — weight climbs quickly. Form over load every set." },
        { id:"facepull", name:"Face Pull", weights:[40,42.5,45,47.5,50,52.5,55,57.5,57.5,60,60,40], sets:[4,4,4,4,4,4,4,4,4,4,4,3], reps:["12","12","12","12","12","12","12","12","12","12","12","12"], backoff:Array(12).fill(null) }
      ]},
      { label:"Superset 2", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"db_shoulder", name:"DB Shoulder Press", weights:[50,52.5,55,55,62.5,65,67.5,70,72.5,75,77.5,50], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["10","10","10","10","6","6","5","5","4","4","3","8"], backoff:Array(12).fill(null), note:"Hold 50lbs through W3 until all reps are clean before progressing." },
        { id:"incline_curl", name:"Alternating Incline DB Curl", weights:[25,25,27.5,30,32.5,35,37.5,40,40,42.5,45,25], sets:[4,4,4,4,4,4,4,4,4,4,4,3], reps:["10","10","10","12","8","8","6","6","8","8","8","10"], backoff:Array(12).fill(null), note:"Supinated grip (palms up) — not hammer. Alternate one arm at a time. 4 sets for bicep development." }
      ]},
      { label:"Superset 3", rest:"Rest 60s", supersetted:true, exercises:[
        { id:"lat_raise", name:"Cable Lateral Raise", weights:[10,10,10,10,12.5,12.5,15,15,17.5,17.5,20,10], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","15","12","12","12","12","12","12","12","10"], backoff:Array(12).fill(null), note:"12 reps per side — complete all reps one side before switching." },
        { id:"lat_pulldown", name:"Lat Pulldown", weights:[100,105,110,110,120,125,130,135,140,145,150,100], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","12","8","8","6","6","8","8","8","10"], backoff:Array(12).fill(null), note:"Full arm extension at the top on every rep — ROM first, weight second." }
      ]}
    ]
  },
  legs: {
    label:"Legs", day:"THU", accent:"#22C55E",
    notes:["Trap bar felt right at 185 — keep it. Leg press: load plates to hit the total shown (includes 140lb carriage). RDL: use a loadable bar from this week.","RDL: 3s eccentric. Feel the hamstring stretch. Leg press moves up — still should feel manageable.","Leg press depth: parallel or below every rep. Calf raise: full stretch and full contraction every rep.","Volume peak. Slight back-off on hinges. Extension and curl fatigue is normal late in session.","Strength block begins. Weight jumps across the board. Brace hard on both hinges.","Control on both hinge movements. No bouncing RDL at any weight.","Leg press going heavy. Full range every rep. Don't cut depth.","Final heavy week. Back stays neutral on trap bar. No exceptions.","Low volume, high intensity. Top sets matter.","Top sets + back-off. Legs should feel it.","Near-max trap bar. Strong brace, strong pull.","Deload. Full ROM, no strain, flush the legs."],
    groups:[
      { label:"Straight Sets", rest:"Rest 2 min", supersetted:false, exercises:[
        { id:"trap_bar", name:"Trap Bar Deadlift", weights:[185,195,205,215,235,245,255,265,275,285,295,185], sets:[4,4,4,4,5,5,5,5,4,3,3,3], reps:["10","10","10","10","5","5","5","5","4","3","2-3","8"], backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"6",w:225},{sets:3,reps:"5",w:230},null] },
        { id:"leg_press", name:"Leg Press (total load)", weights:[300,340,370,360,410,440,470,500,530,560,590,300], sets:[4,4,4,4,5,5,5,5,4,3,3,3], reps:["10","10","10","10","6","5","5","5","4","3","2-3","8"], backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"5",w:460},{sets:3,reps:"5",w:490},null], note:"Total load including the 140lb carriage. Subtract 140, divide by 2 = plates per side. W1: 80lbs/side." }
      ]},
      { label:"Superset 1", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"rdl", name:"Romanian Deadlift", weights:[110,120,130,135,150,160,170,180,185,195,205,110], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","12","8","8","6","6","5","5","5","8"], backoff:Array(12).fill(null), note:"Use a loadable bar from week 2 to progress freely past 110lbs." },
        { id:"calf", name:"Standing Calf Raise", weights:[90,105,115,105,125,135,145,155,150,160,170,90], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["15","15","15","20","12","12","12","12","15","15","15","12"], backoff:Array(12).fill(null), note:"Stand on a plate with heels hanging off. Hold DBs at your sides. Standing targets the gastrocnemius — the larger, more visible calf muscle. Full ROM every rep." }
      ]},
      { label:"Superset 2", rest:"Rest 60s", supersetted:true, exercises:[
        { id:"leg_ext", name:"Leg Extension (both legs)", weights:[110,115,120,125,130,135,140,145,145,150,155,110], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","12","10","10","10","10","12","12","12","10"], backoff:Array(12).fill(null), note:"Both legs simultaneously. Full ROM matters more than load late in this session." },
        { id:"leg_curl", name:"Lying Leg Curl (both legs)", weights:[70,75,80,85,90,95,100,105,110,115,120,70], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","12","10","10","10","10","12","12","12","10"], backoff:Array(12).fill(null), note:"Both legs simultaneously. Legs are heavily fatigued here — accept the lighter starting weight and build steadily." }
      ]}
    ]
  }
};

// ── AUTH SCREEN ───────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]         = useState("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    if (mode === "signin") {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) setError(e.message);
    } else {
      if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
      const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
      if (e) setError(e.message);
      else setError("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  };

  const accent = "#F97316";
  return (
    <div style={{background:"#080808",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed','Impact',sans-serif",padding:"20px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap'); *{box-sizing:border-box;} input:focus{outline:none;border-color:${accent}!important;}`}</style>
      <div style={{width:"100%",maxWidth:"360px"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",letterSpacing:"3px",marginBottom:"8px"}}>12-WEEK PROGRAM</div>
          <div style={{fontSize:"32px",fontWeight:900,color:"#E0E0E0",letterSpacing:"1px"}}>WORKOUT TRACKER</div>
        </div>

        <div style={{display:"flex",gap:"0",marginBottom:"24px",border:"1px solid #222",borderRadius:"6px",overflow:"hidden"}}>
          {["signin","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{flex:1,padding:"10px",background:mode===m?accent:"transparent",border:"none",color:mode===m?"#000":"#555",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,letterSpacing:"1.5px",cursor:"pointer"}}>
              {m === "signin" ? "SIGN IN" : "SIGN UP"}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{width:"100%",background:"#101010",border:"1px solid #222",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",padding:"12px",marginBottom:"10px"}} />
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{width:"100%",background:"#101010",border:"1px solid #222",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",padding:"12px",marginBottom:"10px"}} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={{width:"100%",background:"#101010",border:"1px solid #222",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",padding:"12px",marginBottom:"16px"}} />

        {error && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:error.includes("Check your email")?"#22C55E":"#EF4444",marginBottom:"12px",lineHeight:1.5}}>{error}</div>}

        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#151515":accent,border:`1px solid ${loading?"#222":accent}`,borderRadius:"4px",color:loading?"#444":"#000",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"15px",fontWeight:700,letterSpacing:"2px",cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "..." : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>
      </div>
    </div>
  );
}

// ── REST TIMER ────────────────────────────────────────────────
function RestTimer({ timer, accent, onSkip }) {
  if (!timer) return null;
  const { seconds, total, label, done: timerDone } = timer;
  const r = 28; const circ = 2 * Math.PI * r;
  const offset = circ * (seconds / total);
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",zIndex:100,background:timerDone?"#0D200D":"#0D0D0D",borderTop:`2px solid ${timerDone?"#22C55E":accent}`,padding:"14px 20px",display:"flex",alignItems:"center",gap:"16px",boxShadow:"0 -4px 24px rgba(0,0,0,0.6)"}}>
      <div style={{position:"relative",width:"68px",height:"68px",flexShrink:0}}>
        <svg width="68" height="68" style={{transform:"rotate(-90deg)"}}>
          <circle cx="34" cy="34" r={r} fill="none" stroke="#222" strokeWidth="4"/>
          <circle cx="34" cy="34" r={r} fill="none" stroke={timerDone?"#22C55E":accent} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ-offset} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
        </svg>
        <div style={{position:"absolute",top:0,left:0,width:"68px",height:"68px",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:timerDone?"13px":"20px",fontWeight:600,color:timerDone?"#22C55E":"#E0E0E0"}}>
          {timerDone ? "GO!" : seconds}
        </div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"16px",fontWeight:700,color:"#D0D0D0"}}>{timerDone ? "Rest complete" : "Resting"}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555",marginTop:"2px"}}>{label}</div>
        {!timerDone && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",marginTop:"4px"}}>{total}s total · {total-seconds}s elapsed</div>}
      </div>
      <button onClick={onSkip} style={{background:"#1A1A1A",border:"1px solid #333",color:"#666",borderRadius:"4px",padding:"8px 14px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"13px",fontWeight:700,cursor:"pointer",flexShrink:0}}>
        {timerDone ? "CLOSE" : "SKIP"}
      </button>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [session, setSession]   = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab]           = useState("chest_tri");
  const [week, setWeek]         = useState(1);
  const [adj, setAdj]           = useState({});
  const [done, setDone]         = useState({});
  const [cueOpen, setCueOpen]   = useState({});
  const [mobOpen, setMobOpen]   = useState(true);
  const [feedback, setFeedback] = useState("");
  const [aiRes, setAiRes]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [timer, setTimer]       = useState(null);
  const timerRef                = useRef(null);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Load user progress from Supabase
  useEffect(() => {
    if (!session) return;
    async function load() {
      const uid = session.user.id;
      const { data: progress } = await supabase.from("user_progress").select("*").eq("user_id", uid).single();
      if (progress) { setWeek(progress.current_week); setTab(progress.current_day); }
      const { data: adjs } = await supabase.from("weight_adjustments").select("*").eq("user_id", uid);
      if (adjs) {
        const map = {};
        adjs.forEach(a => { map[`${a.day}_w${a.week}_${a.exercise_id}`] = a.weight; });
        setAdj(map);
      }
    }
    load();
  }, [session]);

  // Save progress
  const saveProgress = async (newWeek, newTab) => {
    if (!session) return;
    await supabase.from("user_progress").upsert({ user_id:session.user.id, current_week:newWeek, current_day:newTab, updated_at:new Date().toISOString() });
  };

  const saveWeight = async (day, week, exId, weight) => {
    if (!session) return;
    await supabase.from("weight_adjustments").upsert({ user_id:session.user.id, day, week, exercise_id:exId, weight, updated_at:new Date().toISOString() }, { onConflict:"user_id,day,week,exercise_id" });
  };

  // Timer
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (timer && !timer.done) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (!prev || prev.done) return prev;
          if (prev.seconds <= 1) { clearInterval(timerRef.current); playBeep(); return { ...prev, seconds:0, done:true }; }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer?.done, timer?.total]);

  const startTimer = (restStr, label) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer({ seconds:parseRest(restStr), total:parseRest(restStr), label, done:false });
  };
  const skipTimer = () => { if (timerRef.current) clearInterval(timerRef.current); setTimer(null); };

  const getW = (exId, wi) => {
    const k = `${tab}_w${week}_${exId}`;
    const ex = PLAN[tab].groups.flatMap(g => g.exercises).find(e => e.id === exId);
    return adj[k] !== undefined ? adj[k] : (ex ? ex.weights[wi] : 0);
  };
  const getPrevW = (exId, wi) => {
    if (wi === 0) return null;
    const k = `${tab}_w${week-1}_${exId}`;
    const ex = PLAN[tab].groups.flatMap(g => g.exercises).find(e => e.id === exId);
    return adj[k] !== undefined ? adj[k] : (ex ? ex.weights[wi-1] : 0);
  };
  const adjustW = (exId, wi, delta) => {
    const k = `${tab}_w${week}_${exId}`;
    const next = Math.max(0, Math.round((getW(exId, wi) + delta) * 4) / 4);
    setAdj(p => ({ ...p, [k]:next }));
    saveWeight(tab, week, exId, next);
  };
  const changeWeek = (w) => {
    const c = Math.max(1, Math.min(12, w));
    setWeek(c); setAiRes(null); setFeedback(""); setDone({}); skipTimer(); setMobOpen(true);
    saveProgress(c, tab);
  };
  const changeTab = (t) => {
    setTab(t); setAiRes(null); setFeedback(""); setDone({}); skipTimer(); setMobOpen(true);
    saveProgress(week, t);
  };
  const applyAi = (aiAdj) => {
    const n = { ...adj };
    for (const [id, w] of Object.entries(aiAdj)) {
      n[`${tab}_w${week}_${id}`] = w;
      saveWeight(tab, week, id, w);
    }
    setAdj(n); setAiRes(null); setFeedback("");
  };

  const handleFeedback = async () => {
    if (!feedback.trim() || loading) return;
    setLoading(true); setAiRes(null);
    const day = PLAN[tab]; const wi = week - 1;
    const summary = day.groups.flatMap(g => g.exercises.map(ex => {
      const w = getW(ex.id, wi);
      const wl = ex.isPullup ? (w === 0 ? "bodyweight" : `+${w}lbs`) : `${w}lbs`;
      return `${ex.name}: ${ex.sets[wi]}x${ex.reps[wi]} @ ${wl}`;
    })).join("\n");
    const ids = day.groups.flatMap(g => g.exercises.map(e => e.id)).join(",");
    const prompt = `Strength coach. Week ${week}/12, ${PHASES[wi]} phase.\n\nWorkout:\n${summary}\n\nFeedback: "${feedback}"\n\nReturn ONLY valid JSON with no markdown:\n{"analysis":"one sentence","adjustments":{/* id: weight_number. Only what needs changing. IDs: ${ids} */}}\n\nRules: round to 2.5lbs. Pull-up weight = added lbs (0=bodyweight). Conservative adjustments.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:500, messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setAiRes(parsed);
      // Save feedback to Supabase
      if (session) {
        await supabase.from("session_feedback").insert({ user_id:session.user.id, day:tab, week, feedback, ai_response:parsed });
      }
    } catch {
      setAiRes({ analysis:"Could not process. Try again.", adjustments:{} });
    }
    setLoading(false);
  };

  if (!authReady) return <div style={{background:"#080808",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:"12px"}}>Loading...</div>;
  if (!session) return <AuthScreen onAuth={setSession} />;

  const day = PLAN[tab]; const wi = week - 1; const phase = PHASES[wi]; const pc = PHASE_COLORS[phase];
  const mobility = MOBILITY[tab];
  const allKeys = day.groups.flatMap(g => g.exercises.flatMap(ex => Array(ex.sets[wi]).fill(null).map((_, si) => `${tab}_w${week}_${ex.id}_s${si}`)));
  const pct = allKeys.length > 0 ? Math.round(allKeys.filter(k => done[k]).length / allKeys.length * 100) : 0;
  const userName = session.user.user_metadata?.display_name || session.user.email.split("@")[0];

  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#E0E0E0",fontFamily:"'Barlow Condensed','Impact',sans-serif",maxWidth:"480px",margin:"0 auto",paddingBottom:timer?"180px":"100px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        textarea { caret-color:${day.accent}; }
        textarea:focus { outline:none; border-color:${day.accent} !important; }
        input:focus { outline:none; }
        button:active { opacity:0.75; transform:scale(0.96); }
        .cuebox { animation:fadeIn 0.15s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* HEADER */}
      <div style={{position:"sticky",top:0,zIndex:20,background:"#080808",borderBottom:"1px solid #1A1A1A",padding:"12px 16px 10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",letterSpacing:"2px"}}>12-WEEK PROGRAM</span>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",letterSpacing:"1.5px",background:pc+"18",color:pc,padding:"3px 8px",borderRadius:"2px"}}>{phase.toUpperCase()}</span>
            <button onClick={() => supabase.auth.signOut()} style={{background:"none",border:"none",color:"#333",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",cursor:"pointer",letterSpacing:"1px"}}>
              {userName} · out
            </button>
          </div>
        </div>
        <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
          {Object.entries(PLAN).map(([key, d]) => (
            <button key={key} onClick={() => changeTab(key)} style={{flex:1,padding:"8px 4px",background:tab===key?d.accent:"#111",border:`1px solid ${tab===key?d.accent:"#222"}`,borderRadius:"3px",color:tab===key?"#000":"#555",fontSize:"13px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:tab===key?"700":"400",letterSpacing:"1px",cursor:"pointer",lineHeight:1.2,textAlign:"center"}}>
              {d.day}<br /><span style={{fontSize:"10px"}}>{d.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button onClick={() => changeWeek(week-1)} style={{background:"none",border:"1px solid #222",color:"#666",width:"30px",height:"30px",borderRadius:"3px",fontFamily:"inherit",fontSize:"16px",cursor:"pointer",lineHeight:1}}>‹</button>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#888"}}>WEEK {week} / 12</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:pct===100?day.accent:"#444"}}>{pct}%</span>
            </div>
            <div style={{background:"#1A1A1A",borderRadius:"2px",height:"3px"}}>
              <div style={{width:`${pct}%`,height:"100%",background:day.accent,borderRadius:"2px",transition:"width 0.3s ease"}} />
            </div>
          </div>
          <button onClick={() => changeWeek(week+1)} style={{background:"none",border:"1px solid #222",color:"#666",width:"30px",height:"30px",borderRadius:"3px",fontFamily:"inherit",fontSize:"16px",cursor:"pointer",lineHeight:1}}>›</button>
        </div>
      </div>

      {/* COACHING NOTE */}
      <div style={{margin:"12px 16px 4px",padding:"10px 12px",borderLeft:`3px solid ${day.accent}`,background:day.accent+"0D",fontSize:"13px",color:"#888",lineHeight:1.4,fontFamily:"'Barlow Condensed',sans-serif"}}>
        {day.notes[wi]}
      </div>

      <div style={{padding:"0 16px",marginTop:"12px"}}>
        {/* MOBILITY */}
        <div style={{marginBottom:"20px"}}>
          <button onClick={() => setMobOpen(p => !p)} style={{width:"100%",background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <span style={{fontSize:"13px",color:"#6B7280",fontWeight:700,letterSpacing:"1.5px",fontFamily:"'Barlow Condensed',sans-serif"}}>PRE-WORKOUT MOBILITY</span>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444"}}>~2-3 min</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"12px",color:"#444"}}>{mobOpen ? "▲" : "▼"}</span>
            </div>
          </button>
          {mobOpen && mobility.map((move, mi) => (
            <div key={mi} style={{background:"#0C0C0C",border:"1px solid #1A1A1A",borderRadius:"6px",padding:"12px",marginBottom:"6px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"6px"}}>
                <span style={{fontSize:"15px",fontWeight:700,color:"#9CA3AF"}}>{move.name}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444"}}>{move.timing}</span>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555",lineHeight:1.6}}>{move.instructions}</div>
            </div>
          ))}
        </div>

        {/* EXERCISE GROUPS */}
        {day.groups.map((group, gi) => (
          <div key={gi} style={{marginBottom:"20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px",alignItems:"center"}}>
              <span style={{fontSize:"13px",color:day.accent,fontWeight:700,letterSpacing:"1.5px"}}>{group.label.toUpperCase()}</span>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444"}}>{group.supersetted ? "alternate" : "all sets each"}</span>
                <button onClick={() => startTimer(group.rest, `${group.label} · ${group.rest}`)} style={{background:"#151515",border:"1px solid #2A2A2A",borderRadius:"4px",color:"#666",padding:"4px 10px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",display:"flex",alignItems:"center",gap:"5px"}}>
                  <span>⏱</span><span>{parseRest(group.rest)}s</span>
                </button>
              </div>
            </div>

            {group.exercises.map((ex) => {
              const w = getW(ex.id, wi); const prevW = getPrevW(ex.id, wi);
              const s = ex.sets[wi]; const r = ex.reps[wi]; const bo = ex.backoff[wi];
              const wLabel = ex.isPullup ? (w === 0 ? "BW" : `+${w}`) : `${w}`;
              const wSuffix = (ex.isPullup && w > 0) ? " lbs" : (!ex.isPullup ? " lbs" : "");
              const isAdj = adj[`${tab}_w${week}_${ex.id}`] !== undefined;
              const cues = FORM_CUES[ex.id]; const isOpen = cueOpen[ex.id];
              const delta = (week > 1 && prevW !== null) ? Math.round((w - prevW) * 10) / 10 : null;
              const dColor = delta > 0 ? "#22C55E" : delta < 0 ? "#EF4444" : "#555";

              return (
                <div key={ex.id} style={{background:"#101010",border:"1px solid #1C1C1C",borderRadius:"6px",padding:"12px",marginBottom:"8px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"16px",fontWeight:700,color:"#D0D0D0"}}>{ex.name}</div>
                      {ex.note && <div style={{fontSize:"10px",color:"#555",fontFamily:"'JetBrains Mono',monospace",marginTop:"4px",lineHeight:1.5}}>{ex.note}</div>}
                    </div>
                    {cues && (
                      <button onClick={() => setCueOpen(p => ({...p,[ex.id]:!p[ex.id]}))} style={{background:isOpen?day.accent+"22":"#1A1A1A",border:`1px solid ${isOpen?day.accent:"#2A2A2A"}`,borderRadius:"4px",color:isOpen?day.accent:"#555",width:"26px",height:"26px",cursor:"pointer",fontFamily:"inherit",fontSize:"13px",flexShrink:0,marginLeft:"8px",lineHeight:1}}>ⓘ</button>
                    )}
                  </div>

                  {isOpen && cues && (
                    <div className="cuebox" style={{marginBottom:"10px",padding:"10px 12px",background:"#0A0A0A",border:`1px solid ${day.accent}33`,borderRadius:"4px",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",lineHeight:1.6,color:"#888"}}>
                      <div style={{color:day.accent,fontWeight:600,marginBottom:"4px",fontSize:"10px",letterSpacing:"1px"}}>SETUP</div>
                      <div style={{marginBottom:"8px"}}>{cues.setup}</div>
                      <div style={{color:day.accent,fontWeight:600,marginBottom:"4px",fontSize:"10px",letterSpacing:"1px"}}>CUES</div>
                      <div>{cues.cues}</div>
                    </div>
                  )}

                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:delta!==null?"8px":"10px"}}>
                    <div style={{textAlign:"center",minWidth:"40px"}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"28px",fontWeight:600,color:day.accent,lineHeight:1}}>{s}</div>
                      <div style={{fontSize:"10px",color:"#444",marginTop:"2px"}}>SETS</div>
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",color:"#333",fontSize:"20px"}}>×</div>
                    <div style={{textAlign:"center",minWidth:"40px"}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"28px",fontWeight:600,color:"#C0C0C0",lineHeight:1}}>{r}</div>
                      <div style={{fontSize:"10px",color:"#444",marginTop:"2px"}}>REPS</div>
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",color:"#333",fontSize:"14px"}}>@</div>
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:"6px",justifyContent:"flex-end"}}>
                      <button onClick={() => adjustW(ex.id, wi, -2.5)} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",color:"#666",width:"26px",height:"26px",borderRadius:"3px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:"14px",lineHeight:1}}>−</button>
                      <div style={{textAlign:"center",minWidth:"56px"}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"24px",fontWeight:600,color:isAdj?day.accent:"#C0C0C0",lineHeight:1}}>
                          {wLabel}<span style={{fontSize:"11px",color:"#555"}}>{wSuffix}</span>
                        </div>
                        <div style={{fontSize:"9px",color:"#444",marginTop:"2px"}}>WEIGHT</div>
                      </div>
                      <button onClick={() => adjustW(ex.id, wi, 2.5)} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",color:"#666",width:"26px",height:"26px",borderRadius:"3px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:"14px",lineHeight:1}}>+</button>
                    </div>
                  </div>

                  {delta !== null && (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:dColor,marginBottom:"10px",paddingBottom:"8px",borderBottom:"1px solid #1A1A1A"}}>
                      {delta === 0 ? `same as week ${week-1}` : delta > 0 ? `+${delta}lbs vs week ${week-1}` : `${delta}lbs vs week ${week-1}`}
                    </div>
                  )}

                  {bo && (
                    <div style={{marginBottom:"10px",padding:"6px 10px",background:"#0C0C0C",border:"1px dashed #252525",borderRadius:"4px",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555"}}>
                      Back-off: {bo.sets} × {bo.reps} @ {bo.w}lbs
                    </div>
                  )}

                  <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                    {Array(s).fill(null).map((_, si) => {
                      const k = `${tab}_w${week}_${ex.id}_s${si}`; const isDone = done[k];
                      return (
                        <button key={si} onClick={() => { const wasOff = !isDone; setDone(p => ({...p,[k]:!p[k]})); if (wasOff && si === s - 1) startTimer(group.rest, `${group.label} · ${ex.name}`); }} style={{width:"34px",height:"34px",borderRadius:"4px",background:isDone?day.accent:"#1A1A1A",border:`1px solid ${isDone?day.accent:"#2A2A2A"}`,color:isDone?"#000":"#555",fontFamily:"'JetBrains Mono',monospace",fontSize:"12px",fontWeight:isDone?700:400,cursor:"pointer",lineHeight:1}}>
                          {isDone ? "✓" : si+1}
                        </button>
                      );
                    })}
                    {bo && Array(bo.sets).fill(null).map((_, si) => {
                      const k = `${tab}_w${week}_${ex.id}_bo${si}`; const isDone = done[k];
                      return (
                        <button key={`bo${si}`} onClick={() => { const wasOff = !isDone; setDone(p => ({...p,[k]:!p[k]})); if (wasOff && si === bo.sets - 1) startTimer(group.rest, `${group.label} · back-off`); }} style={{width:"34px",height:"34px",borderRadius:"4px",background:isDone?"#555":"#1A1A1A",border:`1px dashed ${isDone?"#555":"#252525"}`,color:isDone?"#000":"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",cursor:"pointer",lineHeight:1}}>
                          {isDone ? "✓" : `b${si+1}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div style={{padding:"10px 14px",marginBottom:"20px",background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:"6px",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#444"}}>
          + Core finisher — your standard routine
        </div>

        {/* AI FEEDBACK */}
        <div style={{background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:"6px",padding:"14px",marginBottom:"20px"}}>
          <div style={{fontSize:"13px",fontWeight:700,color:"#666",letterSpacing:"2px",marginBottom:"10px"}}>SESSION FEEDBACK</div>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
            placeholder={"How did it feel?\n\ne.g. \"bench was too easy, got 12 reps each set\""}
            style={{width:"100%",minHeight:"80px",background:"#080808",border:"1px solid #222",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"12px",padding:"10px",resize:"vertical",lineHeight:1.5}} />
          <button onClick={handleFeedback} disabled={loading || !feedback.trim()} style={{marginTop:"8px",width:"100%",padding:"11px",background:loading||!feedback.trim()?"#151515":day.accent,border:`1px solid ${loading||!feedback.trim()?"#222":day.accent}`,borderRadius:"4px",color:loading||!feedback.trim()?"#444":"#000",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,letterSpacing:"2px",cursor:loading||!feedback.trim()?"not-allowed":"pointer"}}>
            {loading ? "ANALYZING..." : "ADJUST WEIGHTS →"}
          </button>
          {aiRes && (
            <div style={{marginTop:"12px",padding:"12px",background:"#080808",border:`1px solid ${day.accent}33`,borderRadius:"4px"}}>
              <div style={{fontSize:"13px",color:"#AAA",marginBottom:"10px",lineHeight:1.5}}>{aiRes.analysis}</div>
              {Object.keys(aiRes.adjustments || {}).length > 0 ? (
                <>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",marginBottom:"8px",letterSpacing:"1px"}}>SUGGESTED CHANGES</div>
                  {Object.entries(aiRes.adjustments).map(([id, nw]) => {
                    const foundEx = day.groups.flatMap(g => g.exercises).find(e => e.id === id);
                    const cw = getW(id, wi); const diff = Math.round((nw - cw) * 10) / 10;
                    return (
                      <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1A1A1A",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px"}}>
                        <span style={{color:"#777"}}>{foundEx?.name ?? id}</span>
                        <span style={{color:day.accent}}>{nw}lbs <span style={{color:diff>0?"#22C55E":diff<0?"#EF4444":"#555",marginLeft:"6px"}}>{diff>0?`+${diff}`:diff<0?`${diff}`:"="}</span></span>
                      </div>
                    );
                  })}
                  <button onClick={() => applyAi(aiRes.adjustments)} style={{marginTop:"10px",width:"100%",padding:"9px",background:day.accent+"20",border:`1px solid ${day.accent}66`,borderRadius:"4px",color:day.accent,fontFamily:"'Barlow Condensed',sans-serif",fontSize:"13px",fontWeight:700,letterSpacing:"1.5px",cursor:"pointer"}}>
                    APPLY ALL CHANGES
                  </button>
                </>
              ) : (
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555"}}>Weights on target — no changes needed.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <RestTimer timer={timer} accent={day.accent} onSkip={skipTimer} />
    </div>
  );
}
