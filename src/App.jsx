import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── DESIGN SYSTEM ──────────────────────────────────────────────────────
// Exact iOS 16 dark mode system colors + SF Pro font stack
const DS = {
  // Backgrounds
  bg:          "#000000",
  surface:     "#1C1C1E",
  surfaceEl:   "#2C2C2E",
  surfaceEl2:  "#3A3A3C",
  // Labels — iOS uses rgba for perceptual lightness consistency
  label:       "#FFFFFF",
  labelSec:    "rgba(235,235,245,0.60)",
  labelTert:   "rgba(235,235,245,0.30)",
  labelQuat:   "rgba(235,235,245,0.18)",
  // Fills
  fill:        "rgba(120,120,128,0.36)",
  fillSec:     "rgba(120,120,128,0.32)",
  fillTert:    "rgba(118,118,128,0.24)",
  // Separators — hairline
  sep:         "rgba(84,84,88,0.65)",
  // System accent colors — each used for ONE semantic purpose only
  blue:        "#0A84FF",  // Back/shoulder day
  green:       "#30D158",  // Positive deltas + completion confirmation
  orange:      "#FF9F0A",  // Chest/tri day + Strength phase
  red:         "#FF453A",  // Peaking phase + negative deltas
  indigo:      "#5E5CE6",  // Legs day — distinct from all phase colors
  yellow:      "#FFD60A",
  // Typography — system font renders SF Pro on Apple devices natively
  font:        "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontMono:    "'SF Mono', 'Menlo', 'Monaco', monospace",
  // Radius — Apple's values
  r16:         "16px",
  r12:         "12px",
  r10:         "10px",
  r8:          "8px",
  r6:          "6px",
};

// ── EXERCISE SETTINGS DEFAULTS ────────────────────────────────────────
// Per-exercise: increment = smallest weight change available on the machine/bar
// Defaults reflect common gym equipment. Users can override in Settings.
const DEFAULT_EX_SETTINGS = {
  bench:        {increment:5,   minW:45,  maxW:null},
  pushdown:     {increment:2.5, minW:5,   maxW:null},
  incline:      {increment:2.5, minW:5,   maxW:null},
  skull:        {increment:10,  minW:20,  maxW:null}, // EZ bar gym typically 10lb jumps
  fly:          {increment:2.5, minW:2.5, maxW:null},
  kickback:     {increment:2.5, minW:2.5, maxW:null},
  pullup:       {increment:2.5, minW:0,   maxW:null},
  row:          {increment:5,   minW:20,  maxW:null},
  facepull:     {increment:2.5, minW:5,   maxW:null},
  db_shoulder:  {increment:2.5, minW:5,   maxW:null},
  incline_curl: {increment:2.5, minW:5,   maxW:null},
  lat_raise:    {increment:2.5, minW:2.5, maxW:null},
  lat_pulldown: {increment:5,   minW:20,  maxW:null},
  trap_bar:     {increment:5,   minW:45,  maxW:null},
  leg_press:    {increment:10,  minW:50,  maxW:null},
  rdl:          {increment:5,   minW:20,  maxW:null},
  calf:         {increment:5,   minW:0,   maxW:null},
  leg_ext:      {increment:5,   minW:10,  maxW:null},
  leg_curl:     {increment:5,   minW:10,  maxW:null},
};
const getExSetting=(exId,key,exSettings)=>exSettings?.[exId]?.[key]??DEFAULT_EX_SETTINGS[exId]?.[key]??2.5;
const snapToIncrement=(val,exId,exSettings)=>{
  const inc=getExSetting(exId,"increment",exSettings);
  const minW=getExSetting(exId,"minW",exSettings);
  const maxW=exSettings?.[exId]?.maxW??DEFAULT_EX_SETTINGS[exId]?.maxW;
  let snapped=Math.round(val/inc)*inc;
  if(minW!==null) snapped=Math.max(minW,snapped);
  if(maxW!==null) snapped=Math.min(maxW,snapped);
  return snapped;
};
// Single stroke, round caps, mimic SF Symbols geometry
const Ico = {
  settings: (sz=20) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  chart: (sz=20) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  chevLeft: (sz=18) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevRight: (sz=18) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  info: (sz=18) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  check: (sz=16) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  timer: (sz=16) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
    </svg>
  ),
  undo: (sz=14) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6"/><path d="M3 13C5 8 9.5 5 14 5a9 9 0 0 1 0 18c-4 0-7.4-2-9-5"/>
    </svg>
  ),
  play: (sz=14) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  logout: (sz=17) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ── CONSTANTS ──────────────────────────────────────────────────────────
const PHASES = ["Hypertrophy","Hypertrophy","Hypertrophy","Hypertrophy","Strength","Strength","Strength","Strength","Peaking","Peaking","Peaking","Deload"];
const PHASE_COLORS = { Hypertrophy:DS.blue, Strength:DS.orange, Peaking:DS.red, Deload:"#636366" };
// Phase segments for header timeline
const PHASE_SEGS=[
  {name:"Hyp",label:"Hypertrophy",weeks:[1,2,3,4],color:DS.blue},
  {name:"Str",label:"Strength",weeks:[5,6,7,8],color:DS.orange},
  {name:"Pea",label:"Peaking",weeks:[9,10,11,12],color:DS.red},
];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PR_EXERCISES = ["bench","row","trap_bar","leg_press","incline","rdl","pullup"];
const r25 = v => Math.round(v / 2.5) * 2.5;
function parseRest(s){const m=s.match(/(\d+)\s*min/);if(m)return parseInt(m[1])*60;const n=s.match(/(\d+)s/);if(n)return parseInt(n[1]);return 90;}
function playBeep(){try{const c=new(window.AudioContext||window.webkitAudioContext)();[0,.15,.3].forEach(t=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.25;o.start(c.currentTime+t);o.stop(c.currentTime+t+.12);});}catch(e){}}

const MOTIVATIONAL={
  Hypertrophy:["Every rep is a deposit. You're building something real.","Volume is the engine. Consistency is the fuel.","The discomfort today is the strength you'll have tomorrow.","Muscle is built in the reps you almost skip.","Progress is slow until it's sudden. Keep going.","Show up. Do the work. Trust the process."],
  Strength:["This is where it compounds.","Heavier than last week. That's the whole game.","Strength is a skill. Practice it today.","The bar doesn't care how you feel. Move it anyway.","Your nervous system is learning. Push it."],
  Peaking:["This is what the last 8 weeks built toward.","Low volume, high intent. Make every set count.","Peak week. Leave it all in the gym.","You're not building anymore — you're expressing it."],
  Deload:["Recovery is where growth happens.","Trust the process. Rest is part of the plan.","Earn your recovery. You've put in the work.","Your muscles grow when you rest, not when you lift."]
};
const COMPLETE_MSGS=["Consistency over intensity. You showed up today — that's what separates people who get results from people who don't.","Every session is a vote for the person you're becoming. You just cast yours.","The hard days are the most important ones. You just had one of them.","Most people skipped today. You didn't. That's the whole difference.","You won't remember how you felt walking in. You'll remember how you felt walking out.","Another session in the books. The compound interest on consistency is coming.","Strength is built one session at a time. This was one of them.","Showing up is the hardest part. You keep doing the hardest part."];

const FORM_CUES={
  bench:{setup:"Grip slightly wider than shoulder-width. Slight natural arch. Butt stays on bench. Feet flat — drive through heels.",cues:"Bar path: lower to mid-chest at a slight diagonal. Elbows 45-75° from torso — not flared. Touch chest lightly, brief pause, press. Think: leg drive into the floor as you press."},
  pushdown:{setup:"Cable set high. Rope attachment. Slight hip hinge forward. Elbows pinned to your sides — they don't move.",cues:"Pull rope ends apart at the bottom for full contraction. 2s eccentric on the way up. If elbows are flaring or lifting, drop the weight."},
  incline:{setup:"Bench at 30-45°. DBs at chest level, elbows slightly below bench line at the bottom.",cues:"Press straight up — don't let DBs travel toward each other. Feel the stretch at the bottom. Stop just short of lockout. Shoulders packed, not shrugging."},
  skull:{setup:"Lie flat, EZ bar over forehead. Elbows shoulder-width apart, pointed at the ceiling.",cues:"Lower bar just behind your forehead. Elbows stay pointing up — flaring is the key failure point. Controlled down, press up. 10lb increments only."},
  fly:{setup:"Cable at chest height or slightly above. Slight forward lean. Slight bend in elbows — hold that angle the entire set.",cues:"Drive with upper arms, not hands. Think hugging a tree. Full stretch at start. Stop just before hands touch. Don't let the weight yank your shoulder back."},
  kickback:{setup:"Cable set low. Stand side-on. Hinge forward at hips, upper arm pinned to your side parallel to the floor. This is a single-arm movement — complete all reps on one side before switching.",cues:"Extend forearm back until arm is fully straight. Squeeze at the top for 1 count. Keep upper arm completely still — only the forearm moves. Use a lighter weight than you think. 7.5-10lbs is correct for most people at this ROM."},
  pullup:{setup:"Grip just outside shoulder-width, palms facing away. Dead hang to start. Engage lats before you pull.",cues:"Full dead hang between every rep — this is where ROM gets lost. Drive elbows down and back. Chin clears the bar every rep. Reduce reps before sacrificing range."},
  row:{setup:"Bar below knee, slight knee bend, hinge at hips ~45°. Back neutral — not rounded.",cues:"Drive elbows back, not up. Bar touches your lower abdomen at the top. Pause and squeeze. 2s controlled eccentric. Torso should not swing."},
  facepull:{setup:"Cable at face height. Rope attachment. Step back until arms are extended.",cues:"Pull rope to your face, hands finishing beside your ears. Think show your armpits. External rotation is the goal — shoulder health work. Light weight, high control, every week."},
  db_shoulder:{setup:"Seated or standing. DBs at shoulder level, elbows slightly in front of your ears — not directly out to the sides.",cues:"Press overhead but stop short of lockout — keep tension on delts. Don't crane your neck forward. Controlled return. If lower back is arching, go seated."},
  incline_curl:{setup:"Bench at 45-60°. Arms hang fully behind torso — full stretch on the bicep long head. One DB per hand. Alternate arms each rep.",cues:"Supinated grip (palms up) throughout — not hammer grip. Curl from a full dead hang. Don't let elbows swing forward at the top. Slow eccentric — 2-3s down."},
  lat_raise:{setup:"Cable low. Start with hand at hip, slight bend in elbow. 12 reps per side — complete all reps on one side before switching.",cues:"Raise to shoulder height only — not above. Lead with your elbow, not your hand. Avoid shrugging at the top."},
  lat_pulldown:{setup:"Grip just outside shoulder-width, lean back slightly. Engage lats before you pull.",cues:"Pull bar to upper chest, driving elbows down and back. Don't lean back excessively. Full arm extension at the top on every rep — ROM first, weight second."},
  trap_bar:{setup:"Stand centered in the trap bar. Hip hinge to grip, shins nearly vertical. Neutral spine — brace hard before lifting.",cues:"Drive through the floor, not up with your back. Think push the ground away. Hips and shoulders rise at the same rate. Lock out with glutes, not hyperextension."},
  leg_press:{setup:"Feet shoulder-width, mid-plate or slightly high. Back flat against the pad. Weight shown is total load including the carriage.",cues:"Lower until knees at or past 90° — don't cut the range. Knees track over toes. Drive through the full foot. Stop just short of lockout. Both legs simultaneously."},
  rdl:{setup:"Hip-width stance, slight knee bend that doesn't change. Bar close to legs throughout.",cues:"Hinge at hips — push them back, not down. Feel the hamstring stretch. Lower until stretch but spine stays neutral. 3s eccentric. Drive hips forward to return."},
  calf:{setup:"Stand on a plate or step with heels hanging off the edge. Hold DBs at your sides. Knee stays straight throughout.",cues:"Full stretch at the bottom — heel fully below the step, hold 1s. Drive all the way to the top — hold 1s. Full ROM is more important than load."},
  leg_ext:{setup:"Seat adjusted so knee joint aligns with machine pivot. Pad on lower shin. Both legs simultaneously.",cues:"Extend fully, squeeze at top for 1 count. Slow eccentric — 2-3s down. Avoid swinging or momentum. Keep back against the pad throughout."},
  leg_curl:{setup:"Lie face down, pad just above the ankle. Hips stay flat on the bench. Both legs simultaneously.",cues:"Curl heels to glutes. Squeeze at the top. Slow eccentric — 2-3s. Don't let hips lift. Plantarflex feet slightly to increase hamstring recruitment."}
};

const MOBILITY={
  chest_tri:[
    {name:"Thoracic Rotation",timing:"8 reps/side · 60s",instructions:"Sit or kneel, hands behind your head. Rotate your upper back as far as you can each direction. Feel mid-back doing the work, not your hips."},
    {name:"Pec Minor Doorway Stretch",timing:"30s/side · 60s",instructions:"Place forearm on a rack upright at 90°. Step through until you feel a stretch across your chest and front shoulder. Hold steady, breathe, then switch sides."},
    {name:"Band Pull-Apart",timing:"2 × 15 reps · 60s",instructions:"Hold a band or light cable at chest height, arms straight. Pull apart until hands are at your sides. Squeeze rear delts at the end. Reverses the rounded posture from pressing."},
    {name:"Wrist Circles + Extension",timing:"10 reps each direction · 30s",instructions:"Make slow circles with both wrists, then press palms forward to stretch the forearms. Barbell work loads the wrists — take 30 seconds to wake them up."}
  ],
  back_shoulder_bi:[
    {name:"Lat Hang",timing:"3 × 20s · 90s",instructions:"Dead hang from the pull-up bar. Let your shoulder blades rise fully — don't actively pull them down. Three holds. This decompresses the spine and primes the lats before pulling."},
    {name:"Band Pull-Apart",timing:"2 × 20 reps · 60s",instructions:"Chest-height, arms straight. Focus on squeezing rear delts and external rotators at the end range. Keep arms straight throughout."},
    {name:"Shoulder Circles + Cross-Body Stretch",timing:"10 reps each + 20s/side · 60s",instructions:"Large arm circles forward and back to warm the rotator cuff. Then pull each arm across your chest and hold. Protects the shoulder joint during overhead pressing."},
    {name:"Cat-Cow",timing:"8 slow reps · 45s",instructions:"On all fours. Breathe in as you drop your belly and lift your head (cow), breathe out as you round your back to the ceiling (cat). Mobilizes the thoracic spine for row mechanics."}
  ],
  legs:[
    {name:"Leg Swings",timing:"12 reps/direction/side · 75s",instructions:"Hold a rack. Swing each leg front-to-back 12 times, then side-to-side 12 times. Controlled at the end ranges. Hip flexors and adductors need this before heavy hinging and pressing."},
    {name:"Deep Squat Hold",timing:"3 × 20s · 75s",instructions:"Hold a rack and lower into the deepest squat you can with a flat back. Hips sink, knees track over toes. Breathe at the bottom. Three holds — don't bounce out."},
    {name:"Hip 90/90 Stretch",timing:"30s/side · 60s",instructions:"Sit on the floor with both knees bent at 90°, one in front and one behind. Sit tall and lean gently forward over the front shin. Targets hip internal and external rotation for squat depth."},
    {name:"Ankle Circles + Calf Raise",timing:"10 circles + 10 raises · 45s",instructions:"Circle each ankle 10 times each direction, then do 10 slow bodyweight calf raises on flat ground. Ankle mobility is the most common limiter on leg press and squat depth."}
  ]
};

const PLAN={
  chest_tri:{label:"Chest & Triceps",day:"SUN",accent:DS.orange,
    notes:["Calibration week. 2 reps in reserve every set. Build from here.","Add 5lbs to bench and incline. EZ bar holds at 50.","Another 5lbs on bench. EZ bar holds — build clean reps before jumping.","Volume peak. More reps at slightly lower weight on main lifts.","Strength block begins. Weight jumps. Hard by set 4.","All 5 sets. Controlled 2s eccentric on bench.","Heavier than last week. Short rest only if needed.","Last heavy week before peaking. Leave nothing.","Low volume, high intensity. Top sets matter.","Top set then back-off sets. Trust the fatigue.","Near-max bench attempt. Spotter recommended.","Deload. Light, full ROM, no strain."],
    groups:[
      {label:"Superset 1",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"bench",name:"Flat Barbell Bench Press",weights:[135,140,145,135,155,160,165,170,175,180,185,115],sets:[4,4,4,4,5,5,5,5,4,3,3,3],reps:["10","10","10","12","6","5","5","5","4","3","2-3","8"],backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"8",w:150},{sets:3,reps:"6",w:155},null]},
        {id:"pushdown",name:"Cable Tricep Pushdown",weights:[32.5,35,37.5,37.5,42.5,45,47.5,50,52.5,55,57.5,32.5],sets:[4,4,4,4,5,5,5,5,4,4,4,3],reps:["12","12","12","12","8","8","8","8","8","8","8","10"],backoff:Array(12).fill(null)}
      ]},
      {label:"Superset 2",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"incline",name:"Incline DB Press",weights:[45,50,50,45,55,60,60,65,65,70,70,40],sets:[4,4,4,4,5,5,5,5,4,3,3,3],reps:["10","10","10","12","6","6","5","5","4","3","2-3","8"],backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"6",w:55},{sets:3,reps:"6",w:55},null]},
        {id:"skull",name:"EZ Bar Skull Crushers",weights:[50,50,50,50,60,60,60,70,70,70,80,50],sets:[4,4,4,4,5,5,5,5,4,4,4,3],reps:["12","12","12","15","8","8","8","8","8","8","8","10"],backoff:Array(12).fill(null)}
      ]},
      {label:"Superset 3",rest:"Rest 60s",supersetted:true,exercises:[
        {id:"fly",name:"Cable Fly",weights:[17.5,20,20,17.5,22.5,25,25,27.5,27.5,30,30,17.5],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","15","10","10","10","10","12","12","12","10"],backoff:Array(12).fill(null)},
        {id:"kickback",name:"Single-Arm Cable Kickback",weights:[10,10,12.5,12.5,15,15,17.5,17.5,17.5,20,20,10],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","15","10","10","10","10","12","12","12","10"],backoff:Array(12).fill(null)}
      ]}
    ]
  },
  back_shoulder_bi:{label:"Back · Shoulder · Bi",day:"TUE",accent:DS.blue,
    notes:["Full ROM on every pull-up. Row is a pattern rebuild: form over weight.","Add a rep on pull-ups if ROM was full. Row adds 10lbs.","Row: elbows drive back, not up. Watch form on last shoulder set.","Volume peak. Higher reps. Curl: 4 sets for bicep development.","Belt on for pull-ups. Strength block begins.","Push rows heavy. Controlled eccentric on every rep.","Shoulder press: form over weight. No cheat reps.","Last heavy week before peaking.","Chest-to-bar attempts on weighted pull-ups.","Heavy rows. Every set deliberate.","Near-max weighted pull-ups.","Deload. Move well, recover fully."],
    groups:[
      {label:"Straight Set",rest:"Rest 90s",supersetted:false,exercises:[
        {id:"pullup",name:"Pull-ups",weights:[0,0,0,0,10,15,20,20,25,30,35,0],sets:[4,4,4,4,4,4,4,4,4,4,4,3],reps:["8","8","9","10","6","6","5","5","4","3","3","6"],backoff:Array(12).fill(null),isPullup:true}
      ]},
      {label:"Superset 1",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"row",name:"Barbell Row",weights:[65,75,85,90,100,110,115,120,125,130,135,90],sets:[4,4,4,4,5,5,5,5,4,4,4,3],reps:["10","10","10","10","6","5","5","5","4","4","4","8"],backoff:Array(12).fill(null)},
        {id:"facepull",name:"Face Pull",weights:[40,42.5,45,47.5,50,52.5,55,57.5,57.5,60,60,40],sets:[4,4,4,4,4,4,4,4,4,4,4,3],reps:["12","12","12","12","12","12","12","12","12","12","12","12"],backoff:Array(12).fill(null)}
      ]},
      {label:"Superset 2",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"db_shoulder",name:"DB Shoulder Press",weights:[50,52.5,55,55,62.5,65,67.5,70,72.5,75,77.5,50],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["10","10","10","10","6","6","5","5","4","4","3","8"],backoff:Array(12).fill(null)},
        {id:"incline_curl",name:"Alternating Incline Curl",weights:[25,25,27.5,30,32.5,35,37.5,40,40,42.5,45,25],sets:[4,4,4,4,4,4,4,4,4,4,4,3],reps:["10","10","10","12","8","8","6","6","8","8","8","10"],backoff:Array(12).fill(null)}
      ]},
      {label:"Superset 3",rest:"Rest 60s",supersetted:true,exercises:[
        {id:"lat_raise",name:"Cable Lateral Raise",weights:[10,10,10,10,12.5,12.5,15,15,17.5,17.5,20,10],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","15","12","12","12","12","12","12","12","10"],backoff:Array(12).fill(null)},
        {id:"lat_pulldown",name:"Lat Pulldown",weights:[100,105,110,110,120,125,130,135,140,145,150,100],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","12","8","8","6","6","8","8","8","10"],backoff:Array(12).fill(null)}
      ]}
    ]
  },
  legs:{label:"Legs",day:"THU",accent:DS.indigo,
    notes:["Trap bar: neutral back, drive through heels. Calibration week.","RDL: 3s eccentric. Feel the hamstring stretch.","Leg press depth: parallel or below every rep.","Volume peak. Slight back-off on hinges.","Strength block. Weight jumps. Brace hard.","Control on both hinge movements. No bouncing RDL.","Leg press going heavy. Full range every rep.","Final heavy week. Back stays neutral on trap bar.","Low volume, high intensity. Top sets matter.","Top sets + back-off. Legs should feel it.","Near-max trap bar. Strong brace, strong pull.","Deload. Full ROM, no strain, flush the legs."],
    groups:[
      {label:"Straight Sets",rest:"Rest 2 min",supersetted:false,exercises:[
        {id:"trap_bar",name:"Trap Bar Deadlift",weights:[185,195,205,215,235,245,255,265,275,285,295,185],sets:[4,4,4,4,5,5,5,5,4,3,3,3],reps:["10","10","10","10","5","5","5","5","4","3","2-3","8"],backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"6",w:225},{sets:3,reps:"5",w:230},null]},
        {id:"leg_press",name:"Leg Press (total load)",weights:[300,340,370,360,410,440,470,500,530,560,590,300],sets:[4,4,4,4,5,5,5,5,4,3,3,3],reps:["10","10","10","10","6","5","5","5","4","3","2-3","8"],backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"5",w:460},{sets:3,reps:"5",w:490},null]}
      ]},
      {label:"Superset 1",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"rdl",name:"Romanian Deadlift",weights:[110,120,130,135,150,160,170,180,185,195,205,110],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","12","8","8","6","6","5","5","5","8"],backoff:Array(12).fill(null)},
        {id:"calf",name:"Standing Calf Raise",weights:[90,105,115,105,125,135,145,155,150,160,170,90],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["15","15","15","20","12","12","12","12","15","15","15","12"],backoff:Array(12).fill(null)}
      ]},
      {label:"Superset 2",rest:"Rest 60s",supersetted:true,exercises:[
        {id:"leg_ext",name:"Leg Extension",weights:[110,115,120,125,130,135,140,145,145,150,155,110],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","12","10","10","10","10","12","12","12","10"],backoff:Array(12).fill(null)},
        {id:"leg_curl",name:"Lying Leg Curl",weights:[70,75,80,85,90,95,100,105,110,115,120,70],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","12","10","10","10","10","12","12","12","10"],backoff:Array(12).fill(null)}
      ]}
    ]
  }
};

const EQUIPMENT_LIST=[
  {id:"barbell",label:"Barbell + rack"},{id:"dumbbells",label:"Dumbbells"},
  {id:"cables",label:"Cable machines (dual)"},{id:"single_cable",label:"Single cable machine"},
  {id:"trap_bar",label:"Trap bar"},{id:"ez_bar",label:"EZ bar"},
  {id:"leg_press",label:"Leg press machine"},{id:"pullup_bar",label:"Pull-up bar"},
  {id:"kettlebells",label:"Kettlebells"},{id:"trx",label:"TRX / suspension straps"},
  {id:"resistance_bands",label:"Resistance bands"},{id:"seated_calf",label:"Seated calf raise machine"},
  {id:"hack_squat",label:"Hack squat machine"},
];
const defaultEquipment=()=>{const e={};EQUIPMENT_LIST.forEach(i=>e[i.id]=true);return e;};

const BENCH_FIELDS={
  chest_tri:[
    {id:"bench",label:"Flat Barbell Bench Press",hint:"4 × 10, 2 reps in reserve",step:5,min:20,default:135,unit:"lbs"},
    {id:"incline",label:"Incline DB Press (per hand)",hint:"4 × 10",step:2.5,min:5,default:45,unit:"lbs"},
    {id:"pushdown",label:"Cable Tricep Pushdown",hint:"4 × 12",step:2.5,min:5,default:30,unit:"lbs"},
    {id:"skull",label:"EZ Bar Skull Crushers",hint:"4 × 12",step:5,min:20,default:50,unit:"lbs"},
    {id:"fly",label:"Cable Fly (per side)",hint:"3 × 12",step:2.5,min:2.5,default:15,unit:"lbs"},
    {id:"kickback",label:"Single-Arm Cable Kickback (per arm)",hint:"3 × 12 per side",step:2.5,min:2.5,default:10,unit:"lbs"},
  ],
  back_shoulder_bi:[
    {id:"pullup_reps",label:"Pull-up max reps",hint:"Bodyweight, strict dead hang",step:1,min:0,default:5,unit:"reps"},
    {id:"row",label:"Barbell Row",hint:"4 × 10",step:5,min:20,default:95,unit:"lbs"},
    {id:"facepull",label:"Face Pull",hint:"4 × 12",step:2.5,min:5,default:35,unit:"lbs"},
    {id:"db_shoulder",label:"DB Shoulder Press (per hand)",hint:"3 × 10",step:2.5,min:5,default:45,unit:"lbs"},
    {id:"incline_curl",label:"Incline DB Curl (per hand)",hint:"4 × 10",step:2.5,min:5,default:25,unit:"lbs"},
    {id:"lat_raise",label:"Cable Lateral Raise (per side)",hint:"3 × 12",step:2.5,min:2.5,default:10,unit:"lbs"},
    {id:"lat_pulldown",label:"Lat Pulldown",hint:"3 × 12",step:5,min:20,default:100,unit:"lbs"},
  ],
  legs:[
    {id:"trap_bar",label:"Trap Bar Deadlift",hint:"4 × 10",step:5,min:45,default:155,unit:"lbs"},
    {id:"leg_press",label:"Leg Press (total load w/ carriage)",hint:"4 × 10",step:10,min:50,default:250,unit:"lbs"},
    {id:"rdl",label:"Romanian Deadlift",hint:"3 × 12",step:5,min:20,default:95,unit:"lbs"},
    {id:"calf",label:"Standing Calf Raise",hint:"3 × 15",step:5,min:0,default:70,unit:"lbs"},
    {id:"leg_ext",label:"Leg Extension (both legs)",hint:"3 × 12",step:5,min:10,default:100,unit:"lbs"},
    {id:"leg_curl",label:"Lying Leg Curl (both legs)",hint:"3 × 12",step:5,min:10,default:80,unit:"lbs"},
  ]
};
const defaultBenchmarks=()=>{const b={};Object.values(BENCH_FIELDS).flat().forEach(f=>b[f.id]=f.default);return b;};

const PROG={compound_major:[0,5,10,0,20,25,30,35,40,45,50],compound_minor:[0,5,5,0,15,17.5,17.5,22.5,22.5,27.5,27.5],isolation:[0,2.5,5,2.5,10,12.5,15,17.5,17.5,20,22.5],cable_light:[0,2.5,5,2.5,7.5,10,12.5,15,15,17.5,20]};
const gW=(w1,t)=>[...PROG[t].map(d=>r25(w1+d)),r25(w1*.85)];
const gPU=r=>{const a=r>=12?15:r>=8?10:r>=5?5:0;return[0,0,0,0,a,a+5,a+10,a+10,a+15,a+20,a+25,0];};
function buildWeights(b,eq){
  if(!b||!Object.keys(b).length) return null;
  const hp=eq?.pullup_bar!==false;
  return{bench:gW(b.bench||135,'compound_major'),pushdown:gW(b.pushdown||32.5,'isolation'),incline:gW(b.incline||45,'compound_minor'),skull:gW(b.skull||50,'isolation'),fly:gW(b.fly||17.5,'cable_light'),kickback:gW(b.kickback||15,'cable_light'),pullup:hp?gPU(b.pullup_reps||5):Array(12).fill(0),row:gW(b.row||65,'compound_major'),facepull:gW(b.facepull||40,'isolation'),db_shoulder:gW(b.db_shoulder||50,'compound_minor'),incline_curl:gW(b.incline_curl||25,'isolation'),lat_raise:gW(b.lat_raise||10,'cable_light'),lat_pulldown:gW(b.lat_pulldown||100,'compound_minor'),trap_bar:gW(b.trap_bar||185,'compound_major'),leg_press:gW(b.leg_press||300,'compound_major'),rdl:gW(b.rdl||110,'compound_minor'),calf:gW(b.calf||90,'isolation'),leg_ext:gW(b.leg_ext||110,'isolation'),leg_curl:gW(b.leg_curl||70,'isolation')};
}
async function saveGeneratedWeights(userId,weights){
  if(!weights) return;
  const dayMap={chest_tri:['bench','pushdown','incline','skull','fly','kickback'],back_shoulder_bi:['pullup','row','facepull','db_shoulder','incline_curl','lat_raise','lat_pulldown'],legs:['trap_bar','leg_press','rdl','calf','leg_ext','leg_curl']};
  const rows=[];
  for(const[day,exIds] of Object.entries(dayMap)){for(const exId of exIds){if(!weights[exId])continue;for(let w=1;w<=12;w++)rows.push({user_id:userId,day,week:w,exercise_id:exId,weight:weights[exId][w-1],updated_at:new Date().toISOString()});}}
  for(let i=0;i<rows.length;i+=50) await supabase.from("weight_adjustments").upsert(rows.slice(i,i+50),{onConflict:"user_id,day,week,exercise_id"});
}
function getAutoWeekAndTab(startDate,d1,d2,d3){
  if(!startDate) return{week:1,tab:null};
  const today=new Date();today.setHours(0,0,0,0);const start=new Date(startDate);start.setHours(0,0,0,0);
  const days=Math.floor((today-start)/86400000);if(days<0)return{week:1,tab:null};
  const week=Math.min(12,Math.floor(days/7)+1);const dow=today.getDay();
  return{week,tab:{[d1]:'chest_tri',[d2]:'back_shoulder_bi',[d3]:'legs'}[dow]||null};
}
function getLocalKey(uid){return`done_${uid}`;}
function saveToLocal(uid,d){try{const f={};Object.entries(d).forEach(([k,v])=>{if(v)f[k]=true;});localStorage.setItem(getLocalKey(uid),JSON.stringify(f));}catch(e){}}
function loadFromLocal(uid){try{const d=localStorage.getItem(getLocalKey(uid));return d?JSON.parse(d):null;}catch(e){return null;}}

// ── SHARED PRIMITIVES ──────────────────────────────────────────────────
// iOS-style button with precise press feedback
function Btn({onPress,style,children,disabled}){
  return <button onClick={onPress} disabled={disabled} style={{border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:DS.font,...style}}>{children}</button>;
}
// Full-width primary CTA — matches iOS design precisely
function PrimaryBtn({onPress,label,loading,disabled,color,textColor}){
  const bg=disabled||loading?DS.surfaceEl:color||DS.blue;
  const tc=disabled||loading?DS.labelTert:textColor||"#fff";
  return(
    <Btn onPress={onPress} disabled={disabled||loading} style={{width:"100%",padding:"0 20px",height:"50px",background:bg,borderRadius:DS.r12,fontSize:"17px",fontWeight:600,color:tc,letterSpacing:"-0.2px",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {loading?"…":label}
    </Btn>
  );
}
// Icon button — 44×44 tap target, circular
function IconBtn({onPress,icon,tint,bg}){
  return(
    <Btn onPress={onPress} style={{width:"34px",height:"34px",borderRadius:"50%",background:bg||DS.fillTert,color:tint||DS.labelSec,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {icon}
    </Btn>
  );
}

// ── BENCH INPUT ────────────────────────────────────────────────────────
function BenchInput({label:lbl,hint,value,onChange,step,min=0,unit="lbs",accent}){
  const[editing,setEditing]=useState(false);
  const[raw,setRaw]=useState(String(value));
  const commit=()=>{const v=parseFloat(raw);if(!isNaN(v)&&v>=min)onChange(Math.round(v/step)*step);else setRaw(String(value));setEditing(false);};
  return(
    <div style={{paddingTop:"12px",paddingBottom:"12px",borderBottom:`0.5px solid ${DS.sep}`}}>
      <div style={{fontSize:"15px",fontWeight:400,color:DS.label,marginBottom:"1px"}}>{lbl}</div>
      <div style={{fontSize:"13px",color:DS.labelTert,marginBottom:"12px"}}>{hint}</div>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <Btn onPress={()=>onChange(Math.max(min,Math.round((value-step)/step)*step))} style={{width:"36px",height:"36px",background:DS.fillTert,borderRadius:"50%",color:DS.labelSec,fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</Btn>
        {editing?(
          <input autoFocus type="number" inputMode="decimal" value={raw} onChange={e=>setRaw(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();}} style={{flex:1,background:DS.surfaceEl,border:`1.5px solid ${accent}`,borderRadius:DS.r8,color:DS.label,fontFamily:DS.fontMono,fontSize:"24px",textAlign:"center",padding:"8px",outline:"none"}}/>
        ):(
          <div onClick={()=>{setRaw(String(value));setEditing(true);}} style={{flex:1,textAlign:"center",cursor:"pointer"}}>
            <span style={{fontFamily:DS.fontMono,fontSize:"28px",fontWeight:300,color:DS.label,letterSpacing:"-1px"}}>{value}</span>
            <span style={{fontSize:"13px",color:DS.labelSec,marginLeft:"5px"}}>{unit}</span>
          </div>
        )}
        <Btn onPress={()=>onChange(Math.round((value+step)/step)*step)} style={{width:"36px",height:"36px",background:DS.fillTert,borderRadius:"50%",color:DS.labelSec,fontSize:"20px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</Btn>
      </div>
    </div>
  );
}

// ── AUTH ───────────────────────────────────────────────────────────────
function AuthScreen(){
  const[mode,setMode]=useState("signin");
  const[email,setEmail]=useState(""),[ password,setPassword]=useState(""),[ name,setName]=useState("");
  const[error,setError]=useState(""),[ loading,setLoading]=useState(false);
  const handle=async()=>{
    setError("");setLoading(true);
    if(mode==="signin"){const{error:e}=await supabase.auth.signInWithPassword({email,password});if(e)setError(e.message);}
    else{if(!name.trim()){setError("Please enter your name.");setLoading(false);return;}const{error:e}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});if(e)setError(e.message);else setError("Check your email to confirm, then sign in.");}
    setLoading(false);
  };
  const inp=(ph,val,set,type="text")=>(
    <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} type={type} style={{width:"100%",background:DS.surface,border:`0.5px solid ${DS.sep}`,borderRadius:DS.r10,color:DS.label,fontFamily:DS.font,fontSize:"17px",padding:"14px 16px",marginBottom:"10px",WebkitAppearance:"none",outline:"none"}}/>
  );
  return(
    <div style={{background:DS.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",fontFamily:DS.font}}>
      <style>{`html,body{background:#000;margin:0;padding:0;} *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;} button{transition:opacity 0.12s,transform 0.1s;} button:active{opacity:0.65;transform:scale(0.96);}`}</style>
      <div style={{width:"100%",maxWidth:"340px"}}>
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <div style={{fontSize:"13px",fontWeight:400,color:DS.labelTert,letterSpacing:"0.5px",marginBottom:"10px",textTransform:"uppercase"}}>12-Week Strength Program</div>
          <div style={{fontSize:"34px",fontWeight:700,color:DS.label,letterSpacing:"-0.5px",lineHeight:1.1,marginBottom:"10px"}}>Workout Tracker</div>
          <div style={{fontSize:"15px",color:DS.labelSec,lineHeight:1.5}}>
            {mode==="signup"?"Your transformation starts here. Build your personalized 12-week plan in under 3 minutes.":"Welcome back. Let's get to work."}
          </div>
        </div>
        {/* Segmented control */}
        <div style={{display:"flex",background:DS.surfaceEl,borderRadius:DS.r10,padding:"2px",marginBottom:"24px",gap:"2px"}}>
          {["signin","signup"].map(m=>(
            <Btn key={m} onPress={()=>{setMode(m);setError("");}} style={{flex:1,padding:"7px",background:mode===m?DS.surfaceEl2:"transparent",borderRadius:DS.r8,color:mode===m?DS.label:DS.labelTert,fontSize:"15px",fontWeight:mode===m?600:400,transition:"all 0.18s"}}>
              {m==="signin"?"Sign In":"Get Started"}
            </Btn>
          ))}
        </div>
        {mode==="signup"&&inp("First name",name,setName)}
        {inp("Email",email,setEmail,"email")}
        {inp("Password",password,setPassword,"password")}
        {error&&<div style={{fontSize:"14px",color:error.includes("Check")?DS.green:DS.red,marginBottom:"14px",lineHeight:1.5,textAlign:"center"}}>{error}</div>}
        <PrimaryBtn onPress={handle} label={mode==="signin"?"Sign In":"Create Account"} loading={loading} color={DS.blue}/>
      </div>
    </div>
  );
}

// ── ONBOARDING ─────────────────────────────────────────────────────────
const OB_COPY=[
  {title:"When do you train?",sub:"Choose your 3 workout days. The app opens to the right session automatically each day."},
  {title:"What's in your gym?",sub:"Check everything available to you. The plan adapts with substitute exercises for anything missing."},
  {title:"How strong are you now?",sub:"Enter your working weights for Chest and Triceps — the weight you can do leaving 2 reps before failure, not your max."},
  {title:"Back and shoulders.",sub:"Now your back, shoulder, and bicep movements. Same rule — challenging but controlled."},
  {title:"Finally, legs.",sub:"Last page. Your full personalized 12-week plan generates after this."},
];

function OnboardingScreen({session,onComplete}){
  const[step,setStep]=useState(0);
  const[d1,setD1]=useState(0),[d2,setD2]=useState(2),[d3,setD3]=useState(4);
  const[startDate,setStartDate]=useState(new Date().toISOString().split('T')[0]);
  const[equipment,setEquipment]=useState(defaultEquipment);
  const[benchmarks,setBenchmarks]=useState(defaultBenchmarks);
  const[saving,setSaving]=useState(false);
  const handleFinish=async()=>{
    setSaving(true);
    const weights=buildWeights(benchmarks,equipment);
    await supabase.from("user_progress").upsert({user_id:session.user.id,benchmarks,equipment,setup_complete:true,start_date:startDate,day1_dow:d1,day2_dow:d2,day3_dow:d3,current_week:1,current_day:'chest_tri',has_seen_orientation:false,last_completed_week:0,manual_week_lock:false,completed_sessions:[],updated_at:new Date().toISOString()});
    await saveGeneratedWeights(session.user.id,weights);
    setSaving(false);onComplete();
  };
  const copy=OB_COPY[step];
  const dayBtn=(val,set,i)=>(
    <Btn key={i} onPress={()=>set(i)} style={{flex:1,padding:"8px 0",background:val===i?DS.surfaceEl2:DS.surfaceEl,borderRadius:DS.r8,color:val===i?DS.label:DS.labelTert,fontSize:"14px",fontWeight:val===i?600:400,transition:"all 0.15s"}}>
      {DAYS_SHORT[i]}
    </Btn>
  );
  return(
    <div style={{background:DS.bg,minHeight:"100vh",color:DS.label,maxWidth:"480px",margin:"0 auto",paddingBottom:"96px",fontFamily:DS.font}}>
      <style>{`html,body{background:#000;margin:0;padding:0;} *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;} button:active{opacity:0.65;transform:scale(0.96);} button{transition:opacity 0.12s,transform 0.1s;} input:focus{outline:none;} input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.5);}`}</style>
      {/* Nav bar */}
      <div style={{padding:"16px 20px 0",marginBottom:"6px"}}>
        <div style={{fontSize:"13px",color:DS.labelTert,marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.4px"}}>{step+1} of {OB_COPY.length}</div>
        {/* Progress */}
        <div style={{display:"flex",gap:"4px",marginBottom:"20px"}}>
          {OB_COPY.map((_,i)=><div key={i} style={{flex:1,height:"2px",background:i<=step?DS.blue:DS.surfaceEl,borderRadius:"1px",transition:"background 0.3s"}}/>)}
        </div>
        <div style={{fontSize:"28px",fontWeight:700,letterSpacing:"-0.5px",marginBottom:"6px"}}>{copy.title}</div>
        <div style={{fontSize:"15px",color:DS.labelSec,lineHeight:1.5}}>{copy.sub}</div>
      </div>
      <div style={{padding:"8px 20px"}}>
        {step===0&&(<>
          {[{label:"Chest & Triceps",a:DS.orange,val:d1,set:setD1},{label:"Back & Shoulders",a:DS.blue,val:d2,set:setD2},{label:"Legs",a:DS.indigo,val:d3,set:setD3}].map(({label:lbl,a,val,set})=>(
            <div key={lbl} style={{marginBottom:"20px"}}>
              <div style={{fontSize:"13px",fontWeight:600,color:a,marginBottom:"8px",letterSpacing:"0.2px"}}>{lbl.toUpperCase()}</div>
              <div style={{display:"flex",gap:"4px",background:DS.surfaceEl,borderRadius:DS.r10,padding:"2px"}}>{DAYS_SHORT.map((_,i)=>dayBtn(val,set,i))}</div>
            </div>
          ))}
          <div>
            <div style={{fontSize:"13px",fontWeight:600,color:DS.labelSec,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.2px"}}>Start Date</div>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",maxWidth:"100%",background:DS.surface,border:`0.5px solid ${DS.sep}`,borderRadius:DS.r10,color:DS.label,fontFamily:DS.font,fontSize:"15px",padding:"13px 14px",boxSizing:"border-box",WebkitAppearance:"none"}}/>
          </div>
        </>)}
        {step===1&&(<>
          <div style={{fontSize:"15px",color:DS.labelSec,marginBottom:"16px",lineHeight:1.5}}>Uncheck any equipment not at your gym. The plan provides substitute exercises automatically.</div>
          <div style={{background:DS.surface,borderRadius:DS.r16,overflow:"hidden"}}>
            {EQUIPMENT_LIST.map((eq,i)=>(
              <Btn key={eq.id} onPress={()=>setEquipment(p=>({...p,[eq.id]:!p[eq.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:"14px",padding:"14px 16px",background:"transparent",borderBottom:i<EQUIPMENT_LIST.length-1?`0.5px solid ${DS.sep}`:"none",textAlign:"left",transition:"background 0.12s"}}>
                <div style={{width:"22px",height:"22px",borderRadius:"50%",border:`1.5px solid ${equipment[eq.id]?DS.blue:DS.labelTert}`,background:equipment[eq.id]?DS.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                  {equipment[eq.id]&&<span style={{color:"#fff",fontSize:"11px",fontWeight:700}}>{Ico.check(11)}</span>}
                </div>
                <span style={{fontSize:"17px",color:equipment[eq.id]?DS.label:DS.labelSec}}>{eq.label}</span>
              </Btn>
            ))}
          </div>
        </>)}
        {step>=2&&step<=4&&(
          <div style={{background:DS.surface,borderRadius:DS.r16,padding:"0 16px",overflow:"hidden"}}>
            {Object.values(BENCH_FIELDS)[step-2].map(f=>(
              <BenchInput key={f.id} label={f.label} hint={f.hint} value={benchmarks[f.id]} onChange={v=>setBenchmarks(p=>({...p,[f.id]:v}))} step={f.step} min={f.min} unit={f.unit} accent={DS.blue}/>
            ))}
          </div>
        )}
      </div>
      {/* Sticky footer */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",padding:"12px 20px 28px",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:`0.5px solid ${DS.sep}`,display:"flex",gap:"10px"}}>
        {step>0&&<Btn onPress={()=>setStep(s=>s-1)} style={{flex:1,height:"50px",background:DS.surfaceEl,borderRadius:DS.r12,color:DS.labelSec,fontSize:"17px",fontWeight:500}}>Back</Btn>}
        <PrimaryBtn onPress={()=>step<OB_COPY.length-1?setStep(s=>s+1):handleFinish()} label={saving?"Building your plan…":step<OB_COPY.length-1?"Continue":"Generate My Plan"} loading={saving} color={DS.blue}/>
      </div>
    </div>
  );
}

// ── SETTINGS ───────────────────────────────────────────────────────────
function SettingsScreen({session,userProgress,onBack,onSave}){
  const[d1,setD1]=useState(userProgress?.day1_dow??0);
  const[d2,setD2]=useState(userProgress?.day2_dow??2);
  const[d3,setD3]=useState(userProgress?.day3_dow??4);
  const[startDate,setStartDate]=useState(userProgress?.start_date||new Date().toISOString().split('T')[0]);
  const[equipment,setEquipment]=useState(()=>{const e=defaultEquipment();if(userProgress?.equipment)Object.assign(e,userProgress.equipment);return e;});
  const[benchmarks,setBenchmarks]=useState(()=>{const b=defaultBenchmarks();if(userProgress?.benchmarks)Object.assign(b,userProgress.benchmarks);return b;});
  const[manualLock,setManualLock]=useState(userProgress?.manual_week_lock||false);
  const[localExSettings,setLocalExSettings]=useState(()=>userProgress?.exercise_settings||{});
  const[expandedEx,setExpandedEx]=useState(null);
  const[stab,setStab]=useState("schedule");
  const[saving,setSaving]=useState(false);
  const setExSetting=(exId,key,val)=>setLocalExSettings(p=>({...p,[exId]:{...p[exId],[key]:val}}));
  const handleSave=async()=>{
    setSaving(true);
    const weights=buildWeights(benchmarks,equipment);
    await supabase.from("user_progress").upsert({user_id:session.user.id,benchmarks,equipment,start_date:startDate,day1_dow:d1,day2_dow:d2,day3_dow:d3,manual_week_lock:manualLock,exercise_settings:localExSettings,updated_at:new Date().toISOString()});
    await saveGeneratedWeights(session.user.id,weights);
    setSaving(false);onSave();
  };
  const tabs=["schedule","equipment","chest","back","legs"];
  const tabLabels={schedule:"Schedule",equipment:"Equipment",chest:"Chest/Tri",back:"Back/Shoulder/Bi",legs:"Legs"};
  const dayBtn=(val,set,i)=><Btn key={i} onPress={()=>set(i)} style={{flex:1,padding:"7px 0",background:val===i?DS.surfaceEl2:DS.surfaceEl,borderRadius:DS.r8,color:val===i?DS.label:DS.labelTert,fontSize:"13px",fontWeight:val===i?600:400,transition:"all 0.15s"}}>{DAYS_SHORT[i]}</Btn>;
  const Row=({label,value,onToggle,last})=>(
    <Btn onPress={onToggle} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",borderBottom:last?"none":`0.5px solid ${DS.sep}`,textAlign:"left"}}>
      <span style={{fontSize:"17px",color:DS.label}}>{label}</span>
      <div style={{width:"28px",height:"28px",borderRadius:"50%",border:`1.5px solid ${value?DS.blue:DS.labelTert}`,background:value?DS.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",flexShrink:0}}>
        {value&&<span style={{color:"#fff"}}>{Ico.check(12)}</span>}
      </div>
    </Btn>
  );
  return(
    <div style={{background:DS.bg,minHeight:"100vh",color:DS.label,maxWidth:"480px",margin:"0 auto",paddingBottom:"96px",fontFamily:DS.font,overflowX:"hidden"}}>
      <style>{`html,body{background:#000;margin:0;padding:0;} *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;} button:active{opacity:0.65;transform:scale(0.96);} button{transition:opacity 0.12s,transform 0.1s;} input:focus{outline:none;}`}</style>
      {/* Nav bar */}
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:`0.5px solid ${DS.sep}`,padding:"12px 20px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
          <IconBtn onPress={onBack} icon={Ico.chevLeft(18)}/>
          <span style={{fontSize:"17px",fontWeight:600}}>Settings</span>
        </div>
        {/* Tab strip */}
        <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"2px"}}>
          {tabs.map(t=>(
            <Btn key={t} onPress={()=>setStab(t)} style={{padding:"6px 14px",background:stab===t?DS.surfaceEl2:DS.surfaceEl,borderRadius:"20px",color:stab===t?DS.label:DS.labelTert,fontSize:"14px",fontWeight:stab===t?600:400,whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
              {tabLabels[t]}
            </Btn>
          ))}
        </div>
      </div>
      <div style={{padding:"20px"}}>
        {stab==="schedule"&&(<>
          {[{label:"Chest & Triceps",a:DS.orange,val:d1,set:setD1},{label:"Back & Shoulders",a:DS.blue,val:d2,set:setD2},{label:"Legs",a:DS.indigo,val:d3,set:setD3}].map(({label:lbl,a,val,set})=>(
            <div key={lbl} style={{marginBottom:"20px"}}>
              <div style={{fontSize:"13px",fontWeight:600,color:a,marginBottom:"8px"}}>{lbl.toUpperCase()}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"}}>
                {DAYS_SHORT.map((_,i)=>dayBtn(val,set,i))}
              </div>
            </div>
          ))}
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"13px",fontWeight:600,color:DS.labelSec,marginBottom:"8px",textTransform:"uppercase"}}>Start Date</div>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",maxWidth:"100%",background:DS.surface,border:`0.5px solid ${DS.sep}`,borderRadius:DS.r10,color:DS.label,fontFamily:DS.font,fontSize:"15px",padding:"13px 14px",boxSizing:"border-box",WebkitAppearance:"none"}}/>
          </div>
          {/* Manual week control — iOS toggle row */}
          <div style={{background:DS.surface,borderRadius:DS.r16,overflow:"hidden"}}>
            <Btn onPress={()=>setManualLock(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",textAlign:"left",gap:"12px"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:"17px",color:DS.label,marginBottom:"3px"}}>Manual week control</div>
                <div style={{fontSize:"13px",color:DS.labelTert,lineHeight:1.4}}>
                  {manualLock
                    ? "On — you advance weeks manually using the ‹ › arrows. Useful if you missed a week or want to repeat one."
                    : "Off — the app opens to the correct week based on your start date automatically."}
                </div>
              </div>
              {/* iOS-style toggle */}
              <div style={{width:"51px",height:"31px",borderRadius:"15.5px",background:manualLock?DS.blue:"rgba(120,120,128,0.32)",flexShrink:0,position:"relative",transition:"background 0.2s"}}>
                <div style={{position:"absolute",top:"2px",left:manualLock?"22px":"2px",width:"27px",height:"27px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.3)",transition:"left 0.18s ease"}}/>
              </div>
            </Btn>
          </div>
        </>)}
        {stab==="equipment"&&(
          <div>
            <div style={{background:`${DS.blue}12`,borderRadius:DS.r10,padding:"12px 14px",marginBottom:"14px",fontSize:"14px",color:DS.labelSec,lineHeight:1.6}}>
              Check everything available at your gym. The workout plan will only use exercises that match your equipment — anything unchecked will be substituted automatically.
            </div>
            <div style={{background:DS.surface,borderRadius:DS.r16,overflow:"hidden"}}>
              {EQUIPMENT_LIST.map((eq,i)=>(
                <Row key={eq.id} label={eq.label} value={equipment[eq.id]} onToggle={()=>setEquipment(p=>({...p,[eq.id]:!p[eq.id]}))} last={i===EQUIPMENT_LIST.length-1}/>
              ))}
            </div>
          </div>
        )}
        {["chest","back","legs"].map((t,ti)=>stab===t&&(
          <div key={t}>
            <div style={{fontSize:"13px",color:DS.labelTert,marginBottom:"12px",lineHeight:1.5}}>
              Set your starting weights for each exercise. Use a weight you can do with 2 reps left before failure — not your max.
            </div>
            <div style={{background:DS.surface,borderRadius:DS.r16,padding:"0 16px",overflow:"hidden",marginBottom:"8px"}}>
              {Object.values(BENCH_FIELDS)[ti].map((f,fi,arr)=>{
                const isExpanded=expandedEx===f.id;
                const inc=localExSettings?.[f.id]?.increment??DEFAULT_EX_SETTINGS[f.id]?.increment??2.5;
                const minW=localExSettings?.[f.id]?.minW??DEFAULT_EX_SETTINGS[f.id]?.minW??0;
                const maxWval=localExSettings?.[f.id]?.maxW??DEFAULT_EX_SETTINGS[f.id]?.maxW??null;
                return(
                  <div key={f.id} style={{borderBottom:fi<arr.length-1&&!isExpanded?`0.5px solid ${DS.sep}`:"none"}}>
                    <BenchInput label={f.label} hint={f.hint} value={benchmarks[f.id]} onChange={v=>setBenchmarks(p=>({...p,[f.id]:v}))} step={f.step} min={f.min} unit={f.unit} accent={DS.blue}/>
                    {f.unit==="lbs"&&(
                      <>
                        <Btn onPress={()=>setExpandedEx(isExpanded?null:f.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0 12px",background:"transparent",textAlign:"left"}}>
                          <span style={{fontSize:"12px",color:DS.blue,fontWeight:500}}>Equipment settings</span>
                          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                            <span style={{fontSize:"11px",color:DS.labelTert}}>±{inc}lbs</span>
                            <span style={{fontSize:"10px",color:DS.labelTert,display:"inline-block",transform:isExpanded?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▼</span>
                          </div>
                        </Btn>
                        {isExpanded&&(
                          <div className="reveal" style={{padding:"12px 0 16px",borderTop:`0.5px solid ${DS.sep}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"4px"}}>
                            {[
                              {label:"Increment",key:"increment",val:inc,placeholder:"e.g. 2.5"},
                              {label:"Min weight",key:"minW",val:minW,placeholder:"e.g. 20"},
                              {label:"Max weight",key:"maxW",val:maxWval||"",placeholder:"optional"},
                            ].map(({label:lbl,key,val,placeholder})=>(
                              <div key={key}>
                                <div style={{fontSize:"11px",color:DS.labelTert,marginBottom:"5px"}}>{lbl}</div>
                                <input
                                  type="number" inputMode="decimal"
                                  value={val===""||(val===null&&key==="maxW")?"":val}
                                  placeholder={placeholder}
                                  onChange={e=>{
                                    const v=e.target.value===""?null:parseFloat(e.target.value);
                                    setExSetting(f.id,key,v);
                                  }}
                                  style={{width:"100%",background:DS.surfaceEl,border:`0.5px solid ${DS.sep}`,borderRadius:DS.r8,color:DS.label,fontFamily:DS.fontMono,fontSize:"15px",fontWeight:300,padding:"8px 10px",textAlign:"center"}}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",padding:"12px 20px 28px",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:`0.5px solid ${DS.sep}`}}>
        <PrimaryBtn onPress={handleSave} label={saving?"Saving…":"Save Changes"} loading={saving} color={DS.blue}/>
      </div>
    </div>
  );
}

// ── SIMPLE STOPWATCH ───────────────────────────────────────────────────
function SimpleStopwatch(){
  const[elapsed,setElapsed]=useState(0);
  const[running,setRunning]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    if(running){ref.current=setInterval(()=>setElapsed(p=>p+1),1000);}
    else{clearInterval(ref.current);}
    return()=>clearInterval(ref.current);
  },[running]);
  const mm=String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss=String(elapsed%60).padStart(2,'0');
  return(
    <Btn onPress={()=>{if(running){setRunning(false);setElapsed(0);}else setRunning(true);}} style={{background:running?`${DS.orange}15`:"transparent",border:running?`0.5px solid ${DS.orange}30`:"none",borderRadius:"16px",padding:"4px 8px",display:"flex",alignItems:"center",gap:"5px",color:running?DS.orange:DS.labelTert,fontSize:"12px",fontFamily:DS.fontMono,fontWeight:300,transition:"all 0.2s",minWidth:"28px",justifyContent:"center"}}>
      {Ico.timer(12)}
      {running&&<span>{mm}:{ss}</span>}
    </Btn>
  );
}

// ── COMPLETION OVERLAY ─────────────────────────────────────────────────
function CompletionOverlay({day,week,message,aiSummary,completedSets,totalVolume,isW1,w1AiRes,w1Feedback,setW1Feedback,w1Loading,handleW1Feedback,applyW1Recal,feedback,setFeedback,loading,handleFeedback,aiRes,applyAi,getW,wi,onClose}){
  const nextPhase=PHASES[Math.min(week,11)];
  const nextPhaseColor=PHASE_COLORS[nextPhase]||DS.labelTert;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 24px 40px",fontFamily:DS.font,overflowY:"auto"}}>
      <div style={{width:"100%",maxWidth:"360px",textAlign:"center"}}>
        {/* Checkmark */}
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:`${day.accent}18`,border:`2px solid ${day.accent}40`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",color:day.accent}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{fontSize:"26px",fontWeight:700,color:DS.label,letterSpacing:"-0.5px",marginBottom:"4px"}}>Workout Complete</div>
        <div style={{fontSize:"12px",color:day.accent,fontWeight:600,letterSpacing:"0.5px",marginBottom:"20px",textTransform:"uppercase"}}>Week {week} · {day.label}</div>

        {/* Volume stats */}
        <div style={{display:"flex",gap:"10px",marginBottom:"20px"}}>
          <div style={{flex:1,background:DS.surface,borderRadius:DS.r12,padding:"14px 10px"}}>
            <div style={{fontFamily:DS.fontMono,fontSize:"28px",fontWeight:300,color:DS.label,letterSpacing:"-1px",lineHeight:1}}>{completedSets}</div>
            <div style={{fontSize:"11px",color:DS.labelTert,marginTop:"3px"}}>sets completed</div>
          </div>
          {totalVolume>0&&<div style={{flex:1,background:DS.surface,borderRadius:DS.r12,padding:"14px 10px"}}>
            <div style={{fontFamily:DS.fontMono,fontSize:"28px",fontWeight:300,color:day.accent,letterSpacing:"-1px",lineHeight:1}}>{totalVolume>=1000?`${(totalVolume/1000).toFixed(1)}k`:totalVolume}</div>
            <div style={{fontSize:"11px",color:DS.labelTert,marginTop:"3px"}}>lbs moved</div>
          </div>}
        </div>

        <div style={{fontSize:"14px",color:DS.labelSec,lineHeight:1.65,marginBottom:"16px",textAlign:"left"}}>{message}</div>

        {/* AI plan update */}
        <div style={{background:DS.surface,borderRadius:DS.r12,padding:"14px 16px",marginBottom:"20px",textAlign:"left"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:DS.labelTert,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"}}>Plan Update</div>
          <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.6}}>{aiSummary||"Reviewing your session ratings…"}</div>
        </div>

        {/* Session feedback — only appears post-workout */}
        <div style={{background:DS.surface,borderRadius:DS.r12,padding:"14px 16px",marginBottom:"20px",textAlign:"left"}}>
          <div style={{fontSize:"13px",fontWeight:600,color:DS.label,marginBottom:"10px"}}>
            {isW1?"Week 1 Debrief":"Additional Notes"}
          </div>
          {isW1&&<div style={{fontSize:"12px",color:DS.labelTert,marginBottom:"10px",lineHeight:1.5}}>
            Describe anything that felt off — too heavy, too light, form issues. We'll recalibrate weeks 2-12.
          </div>}
          {isW1?(<>
            {w1AiRes?.applied?(
              <div style={{padding:"10px 12px",background:`${DS.green}10`,borderRadius:DS.r8}}>
                <div style={{fontSize:"11px",fontWeight:700,color:DS.green,marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Plan Recalibrated</div>
                <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.5}}>{w1AiRes.summary}. Weeks 2-12 updated.</div>
              </div>
            ):(
              <>
                <textarea value={w1Feedback} onChange={e=>setW1Feedback(e.target.value)} placeholder={'e.g. "bench was too heavy, row felt light"'} style={{width:"100%",minHeight:"70px",background:DS.surfaceEl,border:`0.5px solid ${DS.sep}`,borderRadius:DS.r8,color:DS.label,fontSize:"13px",padding:"10px 12px",resize:"vertical",lineHeight:1.5,fontFamily:DS.font}}/>
                <div style={{marginTop:"8px"}}>
                  <PrimaryBtn onPress={handleW1Feedback} label={w1Loading?"Analyzing…":"Recalibrate Weeks 2-12"} loading={w1Loading} disabled={!w1Feedback.trim()} color={DS.green} textColor="#000"/>
                </div>
                {w1AiRes&&!w1AiRes.applied&&(
                  <div className="reveal" style={{marginTop:"10px",padding:"12px",background:DS.surfaceEl,borderRadius:DS.r8}}>
                    <div style={{fontSize:"13px",color:DS.labelSec,marginBottom:"10px",lineHeight:1.5}}>{w1AiRes.analysis}</div>
                    {Object.keys(w1AiRes.adjustments||{}).length>0?(<>
                      <div style={{background:DS.surface,borderRadius:DS.r8,overflow:"hidden",marginBottom:"10px"}}>
                        {Object.entries(w1AiRes.adjustments).map(([id,nw],idx,arr)=>{
                          const fe=day.groups.flatMap(g=>g.exercises).find(e=>e.id===id);
                          const cw=getW(id,wi);const diff=Math.round((nw-cw)*10)/10;
                          return(<div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:idx<arr.length-1?`0.5px solid ${DS.sep}`:"none"}}>
                            <span style={{fontSize:"13px",color:DS.labelSec}}>{fe?.name??id}</span>
                            <span style={{fontFamily:DS.fontMono,fontSize:"14px",color:DS.green}}>{nw}lbs <span style={{fontSize:"11px",color:diff>0?DS.green:DS.red}}>{diff>0?`+${diff}`:diff}</span></span>
                          </div>);
                        })}
                      </div>
                      <PrimaryBtn onPress={()=>applyW1Recal(w1AiRes.adjustments)} label="Apply to Weeks 2-12" color={`${DS.green}20`} textColor={DS.green}/>
                    </>):<div style={{fontSize:"13px",color:DS.labelTert}}>Weights on target — no changes needed.</div>}
                  </div>
                )}
              </>
            )}
          </>):(
            <>
              <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder={'e.g. "bench felt heavy, shoulder was tight"'} style={{width:"100%",minHeight:"70px",background:DS.surfaceEl,border:`0.5px solid ${DS.sep}`,borderRadius:DS.r8,color:DS.label,fontSize:"13px",padding:"10px 12px",resize:"vertical",lineHeight:1.5,fontFamily:DS.font}}/>
              {feedback.trim()&&<div style={{marginTop:"8px"}}>
                <PrimaryBtn onPress={handleFeedback} label={loading?"Analyzing…":"Adjust Next Session"} loading={loading} disabled={!feedback.trim()} color={day.accent} textColor={day.accent===DS.blue?"#fff":"#000"}/>
              </div>}
              {aiRes&&(
                <div className="reveal" style={{marginTop:"10px",padding:"12px",background:DS.surfaceEl,borderRadius:DS.r8}}>
                  <div style={{fontSize:"13px",color:DS.labelSec,marginBottom:"10px",lineHeight:1.5}}>{aiRes.analysis}</div>
                  {Object.keys(aiRes.adjustments||{}).length>0?(<>
                    <div style={{background:DS.surface,borderRadius:DS.r8,overflow:"hidden",marginBottom:"10px"}}>
                      {Object.entries(aiRes.adjustments).map(([id,nw],idx,arr)=>{
                        const fe=day.groups.flatMap(g=>g.exercises).find(e=>e.id===id);
                        const cw=getW(id,wi);const diff=Math.round((nw-cw)*10)/10;
                        return(<div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:idx<arr.length-1?`0.5px solid ${DS.sep}`:"none"}}>
                          <span style={{fontSize:"13px",color:DS.labelSec}}>{fe?.name??id}</span>
                          <span style={{fontFamily:DS.fontMono,fontSize:"14px",color:day.accent}}>{nw}lbs <span style={{fontSize:"11px",color:diff>0?DS.green:DS.red}}>{diff>0?`+${diff}`:diff}</span></span>
                        </div>);
                      })}
                    </div>
                    <PrimaryBtn onPress={()=>applyAi(aiRes.adjustments)} label="Apply Changes" color={`${day.accent}20`} textColor={day.accent}/>
                  </>):<div style={{fontSize:"13px",color:DS.labelTert}}>Weights on target — no changes needed.</div>}
                </div>
              )}
            </>
          )}
        </div>

        {week<12&&<div style={{fontSize:"12px",color:DS.labelTert,marginBottom:"20px"}}>
          Next up: <span style={{color:nextPhaseColor,fontWeight:500}}>Week {week+1} · {nextPhase}</span>
        </div>}
        <Btn onPress={onClose} style={{width:"100%",height:"50px",background:day.accent,borderRadius:DS.r12,color:day.accent===DS.blue?"#fff":"#000",fontSize:"17px",fontWeight:600}}>Keep Going</Btn>
      </div>
    </div>
  );
}

// ── CORE FINISHER ──────────────────────────────────────────────────────
// All bodyweight by default. Dumbbell upgrades only shown when user has dumbbells.
// Day-specific rotation for variety. 4-tier progression across 12 weeks.
// Science basis: McGill Big 3 (curl-up, bird dog, side bridge) as foundation;
// anti-extension (dead bug, hollow body) and anti-rotation (side plank) added for balance.
const getCoreTier=(week)=>week<=4?0:week<=8?1:week<=11?2:3; // 0=Foundation, 1=Build, 2=Peak, 3=Deload
const CORE_PLAN={
  chest_tri:[ // Anti-extension focus — complements pressing
    {id:"dead_bug",name:"Dead Bug",
      tiers:[
        {sets:2,reps:"6/side",note:"Lower back stays flat the whole time. Move slow."},
        {sets:3,reps:"8/side",note:"3-second extension, 1-second pause at bottom."},
        {sets:3,reps:"10/side",note:"Add a 2-second hold at full extension."},
        {sets:2,reps:"5/side",note:"Deload — easy pace, perfect form only."},
      ],
      cue:"On your back, arms to ceiling, knees at 90°. Slowly extend opposite arm and leg until nearly parallel to the floor. Keep lower back pressed into the ground. Return and switch.",
      easier:"Keep arms vertical. Only extend the leg.",
      harder:"Hold a light dumbbell in each hand.",
      dumbbellHarder:true,
    },
    {id:"plank",name:"Plank",
      tiers:[
        {sets:2,reps:"25s",note:"Squeeze glutes and brace abs like you're about to take a punch."},
        {sets:3,reps:"35s",note:"Create tension through the whole body — not just your abs."},
        {sets:3,reps:"45s",note:"Add a small posterior pelvic tilt — tuck hips slightly under."},
        {sets:2,reps:"20s",note:"Deload — relaxed effort, just move."},
      ],
      cue:"Forearms on the floor, elbows under shoulders. Body forms a straight line from heels to head. Brace the core, squeeze the glutes, and breathe steadily.",
      easier:"Knees on the floor.",
      harder:"Lift one foot an inch off the floor, alternate every 5 seconds.",
      dumbbellHarder:false,
    },
    {id:"mcgill_curl",name:"McGill Curl-Up",
      tiers:[
        {sets:2,reps:"8",note:"Hands under lower back. Lift only an inch or two."},
        {sets:3,reps:"10",note:"5-second hold at the top of each rep."},
        {sets:3,reps:"12",note:"10-second hold. Move from the ribcage, not the neck."},
        {sets:2,reps:"6",note:"Deload — short hold, no strain."},
      ],
      cue:"Lie on back, one knee bent, one leg flat. Tuck hands under your lower back to preserve its natural curve. Lift only your head and shoulders — not a full crunch. Hold briefly, lower slowly.",
      easier:"Keep both knees bent.",
      harder:"Extend both legs flat (removes the hip flexor support).",
      dumbbellHarder:false,
    },
  ],
  back_shoulder_bi:[ // Anti-rotation + lateral stability — complements pulling
    {id:"bird_dog",name:"Bird Dog",
      tiers:[
        {sets:2,reps:"6/side",note:"No hip rotation. Move slowly — quality over speed."},
        {sets:3,reps:"8/side",note:"Add a 2-second hold at full extension."},
        {sets:3,reps:"10/side",note:"Draw back slowly — elbow to knee before re-extending."},
        {sets:2,reps:"5/side",note:"Deload — no holds, gentle pace."},
      ],
      cue:"On all fours, wrists under shoulders, knees under hips. Extend opposite arm and leg until parallel. Hips stay level — no rotation or arch. Hold briefly, return slowly.",
      easier:"Extend just the leg, keep both hands down.",
      harder:"Add wrist weights or hold a light dumbbell in the extended hand.",
      dumbbellHarder:true,
    },
    {id:"side_plank",name:"Side Plank",
      tiers:[
        {sets:2,reps:"20s/side",note:"Stack feet or stagger them. Hips up, body straight."},
        {sets:2,reps:"30s/side",note:"Slow hip dip: lower hips toward the floor and back up, 5 reps each side."},
        {sets:3,reps:"30s/side",note:"Hip dips every hold: 5 dips before resting."},
        {sets:2,reps:"15s/side",note:"Deload — modified (knee down) if needed."},
      ],
      cue:"Lie on your side, prop on forearm. Stack your feet or stagger them. Lift hips until your body forms a straight line. Hold position — don't let the hips sag.",
      easier:"Bottom knee on the floor.",
      harder:"Raise the top leg 6 inches throughout the hold.",
      dumbbellHarder:false,
    },
    {id:"hollow_body",name:"Hollow Body Hold",
      tiers:[
        {sets:2,reps:"20s",note:"Lower back stays on the floor the whole time. That's the only rule."},
        {sets:3,reps:"25s",note:"Arms reach overhead to increase the lever — harder."},
        {sets:3,reps:"30s",note:"Arms fully overhead, legs lower toward 30°."},
        {sets:2,reps:"15s",note:"Deload — bent knees variation."},
      ],
      cue:"Lie on back, flatten lower back against the floor. Raise legs to 45° and arms overhead. Hold the 'banana' position. If lower back lifts, raise your legs higher until it stays down.",
      easier:"Bend your knees to reduce the lever.",
      harder:"Lower legs closer to the floor (increases lever length significantly).",
      dumbbellHarder:false,
    },
  ],
  legs:[ // Hip bridge + flexion + posterior chain — complements hinge/press work
    {id:"glute_bridge",name:"Glute Bridge",
      tiers:[
        {sets:2,reps:"12",note:"Squeeze glutes hard at the top for 2 seconds. Not a hip flex — a glute contraction."},
        {sets:3,reps:"15",note:"Slow 3-second eccentric (lowering)."},
        {sets:3,reps:"15",note:"Single-leg version: one leg extended for the last 5 reps each side."},
        {sets:2,reps:"10",note:"Deload — no holds, comfortable pace."},
      ],
      cue:"Lie on back, knees bent, feet flat. Drive hips up by squeezing glutes — not by arching your back. Hold briefly at the top, lower slowly. Feet should be close enough that you could touch your heels.",
      easier:"Place feet wider for more stability.",
      harder:"Hold a dumbbell across your hips.",
      dumbbellHarder:true,
    },
    {id:"reverse_crunch",name:"Reverse Crunch",
      tiers:[
        {sets:2,reps:"10",note:"No momentum. The lower abs pull the hips off the floor."},
        {sets:3,reps:"12",note:"2-second pause at the top before lowering."},
        {sets:3,reps:"15",note:"Slow 3-second eccentric. Control the descent entirely."},
        {sets:2,reps:"8",note:"Deload — partial range is fine."},
      ],
      cue:"Lie on back, hands by sides, knees bent at 90°. Pull knees toward your chest and lift hips slightly off the floor using your lower abs. Lower slowly. No swinging.",
      easier:"Reduce the range — hips don't need to lift much.",
      harder:"Extend legs to 45° (longer lever) while still controlling the movement.",
      dumbbellHarder:false,
    },
    {id:"bear_hold",name:"Bear Hold",
      tiers:[
        {sets:2,reps:"20s",note:"Knees 1 inch off the floor. Everything else stays still."},
        {sets:3,reps:"25s",note:"Add shoulder taps: alternate hands to opposite shoulder, 5 each side, while holding."},
        {sets:3,reps:"30s",note:"Shoulder taps the entire hold — smooth, no rotation."},
        {sets:2,reps:"15s",note:"Deload — no shoulder taps, just the hold."},
      ],
      cue:"Start on all fours. Tuck toes under, lift knees 1 inch off the ground. Hold. Back is flat, hips level. Breathe steadily. Fight every instinct to move.",
      easier:"Keep knees on the floor — just practice the braced position.",
      harder:"Slow shoulder taps throughout: maintain perfect stillness in the hips.",
      dumbbellHarder:false,
    },
  ],
};

function CoreFinisher({accent,tab,week,equipment}){
  const[mode,setMode]=useState("default");
  const[expanded,setExpanded]=useState({});
  const exercises=CORE_PLAN[tab]||CORE_PLAN.chest_tri;
  const tier=getCoreTier(week);
  const tierLabels=["Foundation","Build","Peak","Deload"];
  const hasDumbbells=equipment?.dumbbells!==false; // true by default
  const toggle=(id)=>setExpanded(p=>({...p,[id]:!p[id]}));
  return(
    <div style={{marginBottom:"20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
        <div>
          <span style={{fontSize:"13px",fontWeight:600,color:DS.labelSec,textTransform:"uppercase",letterSpacing:"0.5px"}}>Core Finisher</span>
          {mode==="custom"&&<span style={{fontSize:"11px",color:accent,marginLeft:"8px",fontWeight:500}}>{tierLabels[tier]}</span>}
        </div>
        <div style={{display:"flex",gap:"6px"}}>
          <Btn onPress={()=>setMode("default")} style={{background:mode==="default"?DS.surfaceEl:"transparent",borderRadius:"10px",padding:"4px 10px",color:mode==="default"?DS.label:DS.labelTert,fontSize:"12px",fontWeight:500,border:`0.5px solid ${mode==="default"?DS.sep:"transparent"}`}}>My routine</Btn>
          <Btn onPress={()=>setMode("custom")} style={{background:mode==="custom"?`${accent}20`:"transparent",borderRadius:"10px",padding:"4px 10px",color:mode==="custom"?accent:DS.labelTert,fontSize:"12px",fontWeight:500,border:`0.5px solid ${mode==="custom"?accent:"transparent"}`}}>Get inspiration</Btn>
        </div>
      </div>
      {mode==="default"?(
        <div style={{background:DS.surface,borderRadius:DS.r12,padding:"13px 16px",fontSize:"14px",color:DS.labelSec,lineHeight:1.5}}>
          Do your own routine. Complete before leaving the gym.
        </div>
      ):(
        <div style={{background:DS.surface,borderRadius:DS.r12,overflow:"hidden"}}>
          {exercises.map((ex,i)=>{
            const t=ex.tiers[tier];
            const showDumbbellHarder=ex.dumbbellHarder&&hasDumbbells;
            const harderText=ex.dumbbellHarder?(hasDumbbells?ex.harder:"Slow 3-second eccentric on each rep."):ex.harder;
            return(
              <div key={ex.id} style={{borderBottom:i<exercises.length-1?`0.5px solid ${DS.sep}`:"none"}}>
                <Btn onPress={()=>toggle(ex.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"transparent",textAlign:"left",gap:"8px"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:"8px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"14px",fontWeight:600,color:DS.label}}>{ex.name}</span>
                      <span style={{fontSize:"11px",color:DS.labelTert,fontFamily:DS.fontMono}}>{t.sets} × {t.reps}</span>
                    </div>
                    <div style={{fontSize:"11px",color:accent,marginTop:"2px",lineHeight:1.4}}>{t.note}</div>
                  </div>
                  <span style={{fontSize:"11px",color:DS.labelTert,transform:expanded[ex.id]?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}>▼</span>
                </Btn>
                {expanded[ex.id]&&(
                  <div className="reveal" style={{padding:"0 14px 12px",borderTop:`0.5px solid ${DS.sep}`}}>
                    <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.55,marginTop:"10px",marginBottom:"10px"}}>{ex.cue}</div>
                    <div style={{display:"flex",gap:"6px"}}>
                      <div style={{flex:1,background:`${DS.green}10`,borderRadius:DS.r8,padding:"8px 10px"}}>
                        <div style={{fontSize:"10px",fontWeight:600,color:DS.green,marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.4px"}}>Easier</div>
                        <div style={{fontSize:"12px",color:DS.labelSec,lineHeight:1.4}}>{ex.easier}</div>
                      </div>
                      <div style={{flex:1,background:`${accent}10`,borderRadius:DS.r8,padding:"8px 10px"}}>
                        <div style={{fontSize:"10px",fontWeight:600,color:accent,marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.4px"}}>Harder</div>
                        <div style={{fontSize:"12px",color:DS.labelSec,lineHeight:1.4}}>{harderText}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── APP TOUR ───────────────────────────────────────────────────────────
function AppTour({step,onNext,onSkip,accent}){
  const steps=[
    {
      title:"Your workout plan",
      body:"This is your training overview for today. Each card shows an exercise with its weight, sets, and reps. Tap the ⓘ to see form guidance.",
      icon:(
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="3" rx="1"/><rect x="3" y="10" width="18" height="3" rx="1"/><rect x="3" y="16" width="14" height="3" rx="1"/>
        </svg>
      ),
      arrow:"The exercise cards fill the page below the header.",
    },
    {
      title:"Track your progress",
      body:"Tap the chart icon in the top right to see how your weights are progressing across all 12 weeks.",
      icon:(
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      arrow:"Chart icon 2014 top right of the header.",
    },
    {
      title:"Adjust settings",
      body:"The gear icon opens settings where you can change your training days, starting weights, and equipment constraints.",
      icon:(
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
        </svg>
      ),
      arrow:"Gear icon — top right of the header.",
    },
    {
      title:"Start your workout",
      body:"Tap Start Workout to enter focus mode — one exercise group at a time, no distractions. Log each set with a single tap.",
      icon:(
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      ),
      arrow:"Start Workout button 2014 just below this tour.",
    },
  ];
  const s=steps[step];
  const isLast=step===steps.length-1;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",zIndex:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",fontFamily:DS.font}}>
      <div style={{width:"100%",maxWidth:"380px"}}>
        {/* Step indicator */}
        <div style={{display:"flex",gap:"4px",justifyContent:"center",marginBottom:"24px"}}>
          {steps.map((_,i)=>(
            <div key={i} style={{width:i===step?20:6,height:"4px",borderRadius:"2px",background:i===step?accent:DS.surfaceEl2,transition:"all 0.2s"}}/>
          ))}
        </div>
        {/* Card */}
        <div style={{background:DS.surface,borderRadius:"20px",padding:"24px",marginBottom:"16px",textAlign:"center"}}>
          <div style={{width:"56px",height:"56px",borderRadius:"16px",background:`${accent}14`,display:"flex",alignItems:"center",justifyContent:"center",color:accent,margin:"0 auto 16px"}}>
            {s.icon}
          </div>
          <div style={{fontSize:"20px",fontWeight:700,color:DS.label,letterSpacing:"-0.3px",marginBottom:"8px"}}>{s.title}</div>
          <div style={{fontSize:"14px",color:DS.labelSec,lineHeight:1.6,marginBottom:"14px"}}>{s.body}</div>
          <div style={{fontSize:"12px",color:accent,fontWeight:500}}>{s.arrow}</div>
        </div>
        <Btn onPress={isLast?onSkip:onNext} style={{width:"100%",height:"50px",background:accent,borderRadius:DS.r12,color:accent===DS.blue?"#fff":"#000",fontSize:"17px",fontWeight:600,marginBottom:"10px"}}>
          {isLast?"Let's Train":"Next"}
        </Btn>
        <Btn onPress={onSkip} style={{width:"100%",padding:"10px",background:"transparent",color:DS.labelTert,fontSize:"14px",textAlign:"center"}}>Skip tour</Btn>
      </div>
    </div>
  );
}

// ── ORIENTATION ICONS (module level to avoid esbuild JSX-in-function issues) ─
const OIcoSuperset=()=>(
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/>
    <path d="M7 11v3a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4v-3"/>
  </svg>
);
const OIcoRIR=()=>(
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/>
    <path d="M8 12h3"/>
  </svg>
);
const OIcoInfo=()=>(
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
);

// ── ORIENTATION CARD ───────────────────────────────────────────────────
function OrientationCard({accent,onDismiss}){
  const[step,setStep]=useState(0);
  const[browser,setBrowser]=useState("safari");
  const items=[
    {Icon:OIcoSuperset,title:"Supersets",body:"Two exercises are grouped together. Alternate between them with no rest in between, then rest after completing both. More efficient than resting after every individual set."},
    {Icon:OIcoRIR,title:"2 Reps in Reserve",body:"Stop each set when you have 2 reps left before failure. This protects form and recovery so you perform consistently across all sets, every workout."},
    {Icon:OIcoInfo,title:"Exercise Guides",body:"Tap the \u24d8 icon on any exercise to see setup instructions, form cues, and a demo video — useful for any movement you're less familiar with."},
  ];
  const safariSteps=["Open this page in Safari","Tap the Share button at the bottom of the screen","Scroll down and tap \"Add to Home Screen\"","Tap \"Add\" in the top right corner"];
  const chromeSteps=["Open this page in Chrome","Tap the More menu (three dots) at the top right","Tap \"Add to Home Screen\"","Tap \"Add\" to confirm"];

  if(step===0) return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",zIndex:150,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",overflowY:"auto",fontFamily:DS.font}}>
      <div style={{width:"100%",maxWidth:"400px"}}>
        <div style={{fontSize:"12px",fontWeight:600,color:accent,letterSpacing:"0.5px",marginBottom:"8px",textTransform:"uppercase"}}>Before You Start</div>
        <div style={{fontSize:"26px",fontWeight:700,color:DS.label,letterSpacing:"-0.5px",marginBottom:"22px"}}>How This Works</div>
        {items.map(({Icon,title,body})=>(
          <div key={title} style={{background:DS.surface,borderRadius:DS.r12,padding:"14px 16px",marginBottom:"10px",display:"flex",gap:"14px",alignItems:"flex-start"}}>
            <div style={{width:"36px",height:"36px",borderRadius:DS.r8,background:`${accent}14`,display:"flex",alignItems:"center",justifyContent:"center",color:accent,flexShrink:0,marginTop:"1px"}}>
              <Icon/>
            </div>
            <div>
              <div style={{fontSize:"15px",fontWeight:600,color:DS.label,marginBottom:"4px"}}>{title}</div>
              <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.55}}>{body}</div>
            </div>
          </div>
        ))}
        <Btn onPress={()=>setStep(1)} style={{width:"100%",height:"50px",background:accent,borderRadius:DS.r12,color:accent===DS.blue?"#fff":"#000",fontSize:"17px",fontWeight:600,marginTop:"8px"}}>Next</Btn>
      </div>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",zIndex:150,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",overflowY:"auto",fontFamily:DS.font}}>
      <div style={{width:"100%",maxWidth:"400px"}}>
        {/* iPhone icon */}
        <div style={{width:"52px",height:"52px",borderRadius:"14px",background:`${accent}14`,display:"flex",alignItems:"center",justifyContent:"center",color:accent,margin:"0 auto 18px"}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
          </svg>
        </div>
        <div style={{fontSize:"12px",fontWeight:600,color:accent,letterSpacing:"0.5px",marginBottom:"6px",textTransform:"uppercase",textAlign:"center"}}>Optional</div>
        <div style={{fontSize:"24px",fontWeight:700,color:DS.label,letterSpacing:"-0.5px",marginBottom:"8px",textAlign:"center"}}>Get the full app experience</div>
        <div style={{fontSize:"14px",color:DS.labelSec,lineHeight:1.55,marginBottom:"20px",textAlign:"center"}}>Add this page to your iPhone homescreen so it opens like an app — no browser chrome, full screen.</div>
        {/* Browser toggle */}
        <div style={{display:"flex",background:DS.surfaceEl,borderRadius:DS.r10,padding:"2px",gap:"2px",marginBottom:"18px"}}>
          {["safari","chrome"].map(b=>(
            <Btn key={b} onPress={()=>setBrowser(b)} style={{flex:1,padding:"8px",background:browser===b?DS.surfaceEl2:"transparent",borderRadius:DS.r8,color:browser===b?DS.label:DS.labelTert,fontSize:"14px",fontWeight:browser===b?600:400,textAlign:"center",transition:"all 0.15s"}}>
              {b==="safari"?"Safari":"Chrome"}
            </Btn>
          ))}
        </div>
        {/* Steps */}
        <div style={{background:DS.surface,borderRadius:DS.r12,overflow:"hidden",marginBottom:"18px"}}>
          {(browser==="safari"?safariSteps:chromeSteps).map((st,i,arr)=>(
            <div key={i} style={{display:"flex",gap:"12px",alignItems:"flex-start",padding:"12px 16px",borderBottom:i<arr.length-1?`0.5px solid ${DS.sep}`:"none"}}>
              <div style={{width:"20px",height:"20px",borderRadius:"50%",background:`${accent}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>
                <span style={{fontSize:"11px",fontWeight:700,color:accent}}>{i+1}</span>
              </div>
              <span style={{fontSize:"14px",color:DS.labelSec,lineHeight:1.5}}>{st}</span>
            </div>
          ))}
        </div>
        <Btn onPress={onDismiss} style={{width:"100%",height:"50px",background:accent,borderRadius:DS.r12,color:accent===DS.blue?"#fff":"#000",fontSize:"17px",fontWeight:600,marginBottom:"10px"}}>Let's Go</Btn>
        <Btn onPress={onDismiss} style={{width:"100%",padding:"10px",background:"transparent",color:DS.labelTert,fontSize:"14px",textAlign:"center"}}>Continue using browser version</Btn>
      </div>
    </div>
  );
}

// ── GAP RESUME PROMPT ──────────────────────────────────────────────────
function GapResumePrompt({calculatedWeek,lastCompletedWeek,onResume,onAdjust}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",zIndex:150,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",fontFamily:DS.font}}>
      <div style={{width:"100%",maxWidth:"360px",textAlign:"center"}}>
        <div style={{fontSize:"52px",marginBottom:"16px"}}>👋</div>
        <div style={{fontSize:"28px",fontWeight:700,color:DS.label,letterSpacing:"-0.5px",marginBottom:"12px"}}>Welcome Back</div>
        <div style={{fontSize:"16px",color:DS.labelSec,lineHeight:1.6,marginBottom:"32px"}}>
          Your schedule puts you at Week {calculatedWeek}, but you last completed Week {lastCompletedWeek}. Where would you like to pick up?
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <Btn onPress={()=>onResume(lastCompletedWeek+1)} style={{width:"100%",height:"50px",background:DS.orange,borderRadius:DS.r12,color:"#000",fontSize:"17px",fontWeight:600}}>Continue from Week {lastCompletedWeek+1}</Btn>
          <Btn onPress={()=>onResume(calculatedWeek)} style={{width:"100%",height:"50px",background:DS.surface,borderRadius:DS.r12,color:DS.labelSec,fontSize:"17px",fontWeight:500}}>Jump to Week {calculatedWeek}</Btn>
          <Btn onPress={onAdjust} style={{width:"100%",padding:"12px",background:"transparent",color:DS.labelTert,fontSize:"14px"}}>Adjust start date in settings</Btn>
        </div>
      </div>
    </div>
  );
}

// ── PROGRESS SCREEN ────────────────────────────────────────────────────
function ProgressScreen({session,adj,userProgress,completedSessions,currentWeek,onBack}){
  const[selectedEx,setSelectedEx]=useState("bench");
  const[selectedBar,setSelectedBar]=useState(null);
  const allExercises=[
    {id:"bench",name:"Bench Press",day:"chest_tri"},{id:"incline",name:"Incline DB Press",day:"chest_tri"},
    {id:"pushdown",name:"Tricep Pushdown",day:"chest_tri"},{id:"row",name:"Barbell Row",day:"back_shoulder_bi"},
    {id:"pullup",name:"Pull-ups",day:"back_shoulder_bi"},{id:"db_shoulder",name:"Shoulder Press",day:"back_shoulder_bi"},
    {id:"lat_pulldown",name:"Lat Pulldown",day:"back_shoulder_bi"},{id:"trap_bar",name:"Trap Bar Deadlift",day:"legs"},
    {id:"leg_press",name:"Leg Press",day:"legs"},{id:"rdl",name:"Romanian Deadlift",day:"legs"},
    {id:"leg_ext",name:"Leg Extension",day:"legs"},{id:"leg_curl",name:"Leg Curl",day:"legs"},
  ];

  // Calculate actual week dates from start date
  const getWeekDate=(wk)=>{
    if(!userProgress?.start_date) return `Wk ${wk}`;
    const d=new Date(userProgress.start_date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()+(wk-1)*7);
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  };

  const isWeekCompleted=(wk)=>{
    const dayKey=allExercises.find(e=>e.id===selectedEx)?.day;
    if(!dayKey) return false;
    return completedSessions?.includes(`${dayKey}_w${wk}`);
  };

  const ex=allExercises.find(e=>e.id===selectedEx);
  const day=PLAN[ex?.day];
  const planEx=day?.groups.flatMap(g=>g.exercises).find(e=>e.id===selectedEx);
  const dataPoints=Array(12).fill(null).map((_,i)=>{const k=`${ex.day}_w${i+1}_${selectedEx}`;return adj[k]??planEx?.weights[i]??0;});
  const w1=dataPoints[0];
  const relevantMax=Math.max(...dataPoints);const relevantMin=Math.min(...dataPoints.filter(v=>v>0));
  const chartH=110;const range=relevantMax-relevantMin||1;const accent=day?.accent||DS.blue;
  const totalGain=Math.max(0,(dataPoints[currentWeek-1]||0)-w1);
  const dayGroups={chest_tri:allExercises.filter(e=>e.day==="chest_tri"),back_shoulder_bi:allExercises.filter(e=>e.day==="back_shoulder_bi"),legs:allExercises.filter(e=>e.day==="legs")};

  const sel=selectedBar!==null?selectedBar:(currentWeek-1);
  const selVal=dataPoints[sel];
  const selDate=getWeekDate(sel+1);
  const selCompleted=isWeekCompleted(sel+1);

  return(
    <div style={{background:DS.bg,minHeight:"100vh",color:DS.label,maxWidth:"480px",margin:"0 auto",paddingBottom:"40px",fontFamily:DS.font}}>
      <style>{`html,body{background:#000;margin:0;padding:0;} *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;} button:active{opacity:0.65;transform:scale(0.96);} button{transition:opacity 0.12s,transform 0.1s;}`}</style>
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:`0.5px solid ${DS.sep}`,padding:"12px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <IconBtn onPress={onBack} icon={Ico.chevLeft(18)}/>
          <span style={{fontSize:"17px",fontWeight:600}}>Progress</span>
        </div>
      </div>
      <div style={{padding:"16px 20px"}}>
        {/* Exercise selector by day */}
        {Object.entries(dayGroups).map(([dayKey,exs])=>(
          <div key={dayKey} style={{marginBottom:"16px"}}>
            <div style={{fontSize:"11px",fontWeight:600,color:PLAN[dayKey].accent,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:"7px"}}>{PLAN[dayKey].label}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
              {exs.map(e=>(
                <Btn key={e.id} onPress={()=>{setSelectedEx(e.id);setSelectedBar(null);}} style={{padding:"6px 12px",background:selectedEx===e.id?PLAN[e.day].accent:DS.surface,borderRadius:"20px",color:selectedEx===e.id?"#000":DS.labelSec,fontSize:"13px",fontWeight:selectedEx===e.id?600:400,transition:"all 0.15s"}}>
                  {e.name}
                </Btn>
              ))}
            </div>
          </div>
        ))}

        {/* Chart card */}
        <div style={{background:DS.surface,borderRadius:DS.r16,padding:"20px",marginBottom:"12px"}}>
          <div style={{fontSize:"19px",fontWeight:700,color:DS.label,marginBottom:"2px",letterSpacing:"-0.3px"}}>{ex?.name}</div>
          <div style={{fontSize:"13px",color:DS.labelTert,marginBottom:"18px"}}>{day?.label}</div>

          {/* Selected bar callout */}
          <div style={{background:DS.surfaceEl,borderRadius:DS.r10,padding:"12px 14px",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:"12px",color:DS.labelTert,marginBottom:"2px"}}>{selCompleted?"Completed":"Planned"} · {selDate}</div>
              <div style={{fontSize:"13px",color:DS.labelSec}}>Week {sel+1} · {PHASES[sel]}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:DS.fontMono,fontSize:"32px",fontWeight:300,color:selCompleted?accent:DS.labelSec,letterSpacing:"-1px",lineHeight:1}}>{selVal}</div>
              <div style={{fontSize:"12px",color:DS.labelTert}}>lbs</div>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{display:"flex",gap:"12px",marginBottom:"18px"}}>
            <div style={{flex:1,background:DS.surfaceEl,borderRadius:DS.r10,padding:"10px 12px"}}>
              <div style={{fontFamily:DS.fontMono,fontSize:"20px",fontWeight:300,color:DS.label,letterSpacing:"-0.5px"}}>{w1}<span style={{fontSize:"11px",color:DS.labelTert,marginLeft:"3px"}}>lbs</span></div>
              <div style={{fontSize:"11px",color:DS.labelTert,marginTop:"1px"}}>Week 1 baseline</div>
            </div>
            {totalGain>0&&<div style={{flex:1,background:`${DS.green}10`,borderRadius:DS.r10,padding:"10px 12px"}}>
              <div style={{fontFamily:DS.fontMono,fontSize:"20px",fontWeight:300,color:DS.green,letterSpacing:"-0.5px"}}>+{totalGain}<span style={{fontSize:"11px",color:DS.green,opacity:.7,marginLeft:"3px"}}>lbs</span></div>
              <div style={{fontSize:"11px",color:DS.green,opacity:.7,marginTop:"1px"}}>through today</div>
            </div>}
          </div>

          {/* Bar chart — tappable, completed vs planned opacity */}
          <div style={{position:"relative",height:`${chartH}px`,display:"flex",alignItems:"flex-end",gap:"2px",marginBottom:"8px"}}>
            {dataPoints.map((v,i)=>{
              const h=range===0?chartH:Math.max(4,Math.round(((v-relevantMin)/range)*chartH));
              const completed=isWeekCompleted(i+1);
              const isSelected=sel===i;
              const isPast=i+1<currentWeek;
              const isFuture=i+1>currentWeek;
              const opacity=completed?1:isPast?0.7:i+1===currentWeek?0.9:0.3;
              return(
                <Btn key={i} onPress={()=>setSelectedBar(i)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"0",padding:0,background:"transparent",borderRadius:0}}>
                  <div style={{
                    width:"100%",
                    background:accent,
                    opacity:opacity,
                    borderRadius:"3px 3px 0 0",
                    height:`${h}px`,
                    transition:"height 0.4s ease,opacity 0.2s",
                    border:isSelected?`1.5px solid ${DS.label}`:"1.5px solid transparent",
                    boxSizing:"border-box"
                  }}/>
                </Btn>
              );
            })}
          </div>
          {/* X-axis dates */}
          <div style={{display:"flex",gap:"2px"}}>
            {dataPoints.map((_,i)=>(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:"7px",color:sel===i?DS.label:DS.labelTert,fontFamily:DS.fontMono,fontWeight:sel===i?600:400,lineHeight:1,transform:"rotate(-35deg)",transformOrigin:"center top",marginTop:"2px",whiteSpace:"nowrap"}}>
                  {getWeekDate(i+1)}
                </div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div style={{display:"flex",gap:"14px",marginTop:"20px"}}>
            {[{opacity:1,label:"completed"},{opacity:0.3,label:"planned"}].map(({opacity,label})=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:"5px"}}>
                <div style={{width:"10px",height:"10px",borderRadius:"2px",background:accent,opacity}}/>
                <span style={{fontSize:"11px",color:DS.labelTert}}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Week by week list */}
        <div style={{background:DS.surface,borderRadius:DS.r16,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:`0.5px solid ${DS.sep}`}}>
            <div style={{fontSize:"15px",fontWeight:600,color:DS.label}}>Week by Week</div>
          </div>
          {dataPoints.map((v,i)=>{
            const wk=i+1;const prev=i>0?dataPoints[i-1]:null;const diff=prev!==null?v-prev:null;
            const completed=isWeekCompleted(wk);const isFuture=wk>currentWeek;
            return(
              <Btn key={wk} onPress={()=>setSelectedBar(i)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 16px",borderBottom:i<11?`0.5px solid ${DS.sep}`:"none",background:sel===i?DS.surfaceEl:"transparent",textAlign:"left",transition:"background 0.15s"}}>
                <div>
                  <span style={{fontSize:"15px",color:isFuture?DS.labelTert:DS.labelSec,fontWeight:sel===i?500:400}}>{getWeekDate(wk)}</span>
                  <span style={{fontSize:"12px",color:DS.labelTert,marginLeft:"8px"}}>{PHASES[i].slice(0,4)}</span>
                  {completed&&<span style={{fontSize:"10px",color:DS.labelTert,marginLeft:"6px"}}>✓</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  {diff!==null&&diff!==0&&<span style={{fontSize:"13px",color:diff>0?DS.green:DS.red,fontFamily:DS.fontMono,opacity:isFuture?0.5:1}}>{diff>0?"+":""}{diff}</span>}
                  <span style={{fontFamily:DS.fontMono,fontSize:"17px",fontWeight:300,color:isFuture?DS.labelTert:completed?accent:DS.label,letterSpacing:"-0.5px",opacity:isFuture?0.5:1}}>{v}<span style={{fontSize:"11px",color:DS.labelTert,marginLeft:"2px"}}>lbs</span></span>
                </div>
              </Btn>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────
export default function App(){
  const[session,setSession]=useState(null);
  const[authReady,setAuthReady]=useState(false);
  const[userProgress,setUserProgress]=useState(undefined);
  const[screen,setScreen]=useState("workout");
  const[tab,setTab]=useState("chest_tri");
  const[week,setWeek]=useState(1);
  const[adj,setAdj]=useState({});
  const[done,setDone]=useState({});
  const[prs,setPRs]=useState({});
  const[ratings,setRatings]=useState({});
  const[lastCompletedKey,setLastCompletedKey]=useState(null);
  const[cueOpen,setCueOpen]=useState({});
  const[ssOpen,setSSOpen]=useState({});
  const[mobOpen,setMobOpen]=useState(true);
  const[editingW,setEditingW]=useState(null);
  const[editVal,setEditVal]=useState("");
  const[feedback,setFeedback]=useState("");
  const[w1Feedback,setW1Feedback]=useState("");
  const[aiRes,setAiRes]=useState(null);
  const[w1AiRes,setW1AiRes]=useState(null);
  const[loading,setLoading]=useState(false);
  const[w1Loading,setW1Loading]=useState(false);
  const[processingRatings,setProcessingRatings]=useState(false);
  const[showComplete,setShowComplete]=useState(false);
  const[completionMsg,setCompletionMsg]=useState("");
  const[completionAiSummary,setCompletionAiSummary]=useState("");
  const[completedSessions,setCompletedSessions]=useState([]);
  const[showOrientation,setShowOrientation]=useState(false);
  const[showTour,setShowTour]=useState(false);
  const[tourStep,setTourStep]=useState(0);
  const[showGapPrompt,setShowGapPrompt]=useState(false);
  const[gapCalcWeek,setGapCalcWeek]=useState(1);
  const[gapLastWeek,setGapLastWeek]=useState(0);
  const[exSettings,setExSettings]=useState({});
  const[focusMode,setFocusMode]=useState(false);
  const[focusGi,setFocusGi]=useState(-1);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setAuthReady(true);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return()=>subscription.unsubscribe();
  },[]);

  const loadProgress=async()=>{
    if(!session) return;
    const uid=session.user.id;
    const{data:progress,error}=await supabase.from("user_progress").select("*").eq("user_id",uid).single();
    if(error&&error.code==='PGRST116'){setUserProgress(null);return;}
    if(progress){
      setUserProgress(progress);
      if(progress.completed_sessions) setCompletedSessions(progress.completed_sessions);
      if(progress.exercise_settings) setExSettings(progress.exercise_settings);
      const manualLock=progress.manual_week_lock||false;
      const lastCompleted=progress.last_completed_week||0;
      if(manualLock){setWeek(progress.current_week||1);setTab(progress.current_day||'chest_tri');}
      else{
        const{week:autoWeek,tab:autoTab}=getAutoWeekAndTab(progress.start_date,progress.day1_dow??0,progress.day2_dow??2,progress.day3_dow??4);
        const calcW=autoWeek||1;
        if(lastCompleted>0&&calcW>lastCompleted+1){setGapCalcWeek(calcW);setGapLastWeek(lastCompleted);setShowGapPrompt(true);setWeek(lastCompleted+1);}
        else{setWeek(calcW);setTab(autoTab||progress.current_day||'chest_tri');}
      }
      if(!progress.has_seen_orientation) setShowOrientation(true);
    }
    const{data:adjs}=await supabase.from("weight_adjustments").select("*").eq("user_id",uid);
    if(adjs){const aMap={},prMap={};adjs.forEach(a=>{aMap[`${a.day}_w${a.week}_${a.exercise_id}`]=a.weight;if(!prMap[a.exercise_id]||a.weight>prMap[a.exercise_id])prMap[a.exercise_id]=a.weight;});setAdj(aMap);setPRs(prMap);}
    const localDone=loadFromLocal(uid);if(localDone) setDone(localDone);
    const{data:sets}=await supabase.from("completed_sets").select("*").eq("user_id",uid).eq("completed",true);
    if(sets&&sets.length>0){const dMap={};sets.forEach(s=>{dMap[`${s.day}_w${s.week}_${s.set_key}`]=true;});setDone(dMap);saveToLocal(uid,dMap);}
  };
  useEffect(()=>{if(session) loadProgress();},[session]);

  const dismissOrientation=async()=>{
    setShowOrientation(false);
    if(session) await supabase.from("user_progress").upsert({user_id:session.user.id,has_seen_orientation:true,updated_at:new Date().toISOString()});
    // Show tour after orientation, only if haven't seen it
    const seen=localStorage.getItem(`tour_seen_${session?.user?.id}`);
    if(!seen){setShowTour(true);setTourStep(0);}
  };
  const dismissTour=()=>{
    setShowTour(false);
    if(session) localStorage.setItem(`tour_seen_${session.user.id}`,"1");
  };
  const handleGapResume=async(w)=>{setShowGapPrompt(false);setWeek(w);if(session)await supabase.from("user_progress").upsert({user_id:session.user.id,current_week:w,updated_at:new Date().toISOString()});};

  // Smart focus re-entry: find first incomplete group, or last group if all done
  const getResumeGi=(dayData,wi)=>{
    for(let gi=0;gi<dayData.groups.length;gi++){
      const grp=dayData.groups[gi];
      const anyStarted=grp.exercises.some(ex=>getCC(ex.id,ex.sets[wi],false)>0);
      const allDone2=grp.exercises.every(ex=>getCC(ex.id,ex.sets[wi],false)>=ex.sets[wi]);
      if(anyStarted&&!allDone2) return gi;
      if(anyStarted) continue; // done, check next
      if(!anyStarted&&gi>0) return gi; // first untouched after some progress
    }
    // check if any group has started at all
    const anyProgress=dayData.groups.some(g=>g.exercises.some(ex=>getCC(ex.id,ex.sets[wi],false)>0));
    return anyProgress?dayData.groups.length-1:-1; // -1 = start from mobility
  };

  const getW=(exId,wi)=>{const k=`${tab}_w${week}_${exId}`;if(adj[k]!==undefined)return adj[k];const ex=PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===exId);return ex?ex.weights[wi]:0;};
  const getPrevW=(exId,wi)=>{if(wi===0)return null;const k=`${tab}_w${week-1}_${exId}`;if(adj[k]!==undefined)return adj[k];const ex=PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===exId);return ex?ex.weights[wi-1]:0;};
  const getW1=(exId)=>{const k=`${tab}_w1_${exId}`;if(adj[k]!==undefined)return adj[k];const ex=PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===exId);return ex?ex.weights[0]:0;};

  const saveWeight=(day,wk,exId,val)=>{if(!session)return;supabase.from("weight_adjustments").upsert({user_id:session.user.id,day,week:wk,exercise_id:exId,weight:val,updated_at:new Date().toISOString()},{onConflict:"user_id,day,week,exercise_id"});};
  const adjustW=(exId,wi,dir)=>{
    const curr=getW(exId,wi);
    const inc=getExSetting(exId,"increment",exSettings);
    const next=Math.max(0,snapToIncrement(curr+(dir*inc),exId,exSettings));
    const k=`${tab}_w${week}_${exId}`;setAdj(p=>({...p,[k]:next}));if(PR_EXERCISES.includes(exId)&&next>(prs[exId]||0))setPRs(p=>({...p,[exId]:next}));saveWeight(tab,week,exId,next);
  };
  const commitWeightEdit=(exId)=>{const v=parseFloat(editVal);if(!isNaN(v)&&v>=0){const next=snapToIncrement(v,exId,exSettings);const k=`${tab}_w${week}_${exId}`;setAdj(p=>({...p,[k]:next}));if(PR_EXERCISES.includes(exId)&&next>(prs[exId]||0))setPRs(p=>({...p,[exId]:next}));saveWeight(tab,week,exId,next);}setEditingW(null);};
  const saveSetToDb=async(day,wk,setKey,completed)=>{if(!session)return;await supabase.from("completed_sets").upsert({user_id:session.user.id,day,week:wk,set_key:setKey,completed,updated_at:new Date().toISOString()},{onConflict:"user_id,day,week,set_key"});};
  const getCC=(exId,totalSets,isBO=false)=>{const pre=isBO?`${tab}_w${week}_${exId}_bo`:`${tab}_w${week}_${exId}_s`;let c=0;for(let i=0;i<totalSets;i++){if(done[`${pre}${i}`])c++;}return c;};
  const completeNextSet=(exId,totalSets,groupRest,groupLabel,isBO=false)=>{
    const pre=isBO?`${tab}_w${week}_${exId}_bo`:`${tab}_w${week}_${exId}_s`;const dbPre=isBO?`${exId}_bo`:`${exId}_s`;
    let ni=0;while(ni<totalSets&&done[`${pre}${ni}`])ni++;if(ni>=totalSets)return;
    setDone(p=>{const n={...p,[`${pre}${ni}`]:true};saveToLocal(session?.user?.id,n);return n;});
    setLastCompletedKey(`${pre}${ni}`);
    setTimeout(()=>setLastCompletedKey(null),400);
    saveSetToDb(tab,week,`${dbPre}${ni}`,true);
  };
  const undoLastSet=(exId,totalSets,isBO=false)=>{
    const pre=isBO?`${tab}_w${week}_${exId}_bo`:`${tab}_w${week}_${exId}_s`;const dbPre=isBO?`${exId}_bo`:`${exId}_s`;
    let li=-1;for(let i=0;i<totalSets;i++){if(done[`${pre}${i}`])li=i;}if(li===-1)return;
    setDone(p=>{const n={...p,[`${pre}${li}`]:false};saveToLocal(session?.user?.id,n);return n;});
    saveSetToDb(tab,week,`${dbPre}${li}`,false);
  };
  const setRating=(exId,r)=>{setRatings(p=>({...p,[`${tab}_w${week}_${exId}`]:r}));if(session)supabase.from("exercise_ratings").upsert({user_id:session.user.id,day:tab,week,exercise_id:exId,rating:r},{onConflict:"user_id,day,week,exercise_id"});};
  const changeWeek=(w)=>{const c=Math.max(1,Math.min(12,w));setWeek(c);setAiRes(null);setFeedback("");setW1Feedback("");setW1AiRes(null);setMobOpen(true);setEditingW(null);if(session)supabase.from("user_progress").upsert({user_id:session.user.id,current_week:c,updated_at:new Date().toISOString()});};
  const changeTab=(t)=>{setTab(t);setAiRes(null);setFeedback("");setW1Feedback("");setW1AiRes(null);setMobOpen(true);setEditingW(null);if(session)supabase.from("user_progress").upsert({user_id:session.user.id,current_day:t,updated_at:new Date().toISOString()});};
  const applyAi=async(aiAdj)=>{const n={...adj};const rows=[];for(const[id,w] of Object.entries(aiAdj)){n[`${tab}_w${week}_${id}`]=w;rows.push({user_id:session?.user.id,day:tab,week,exercise_id:id,weight:w,updated_at:new Date().toISOString()});}setAdj(n);setAiRes(null);setFeedback("");if(session&&rows.length)await supabase.from("weight_adjustments").upsert(rows,{onConflict:"user_id,day,week,exercise_id"});};
  const applyW1Recal=async(adjustments)=>{
    const n={...adj};const rows=[];const changes=[];
    for(const[id,newW1] of Object.entries(adjustments)){
      const oldW1=getW(id,0);const diff=newW1-oldW1;
      const fe=PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===id);
      if(diff!==0)changes.push(`${fe?.name||id} ${diff>0?`+${diff}lbs`:`${diff}lbs`} to ${newW1}lbs`);
      for(let wk=1;wk<=12;wk++){const baseW=adj[`${tab}_w${wk}_${id}`]??fe?.weights[wk-1]??newW1;const nw=Math.max(0,r25(baseW+diff));n[`${tab}_w${wk}_${id}`]=nw;rows.push({user_id:session?.user.id,day:tab,week:wk,exercise_id:id,weight:nw,updated_at:new Date().toISOString()});}
    }
    setAdj(n);setW1AiRes({...w1AiRes,applied:true,summary:changes.join(". ")});setW1Feedback("");
    if(session&&rows.length){for(let i=0;i<rows.length;i+=50)await supabase.from("weight_adjustments").upsert(rows.slice(i,i+50),{onConflict:"user_id,day,week,exercise_id"});}
  };
  const processRatings=async()=>{
    const dayRatings=Object.entries(ratings).filter(([k])=>k.startsWith(`${tab}_w${week}_`));
    setProcessingRatings(true);
    const day=PLAN[tab];const wi=week-1;
    if(dayRatings.length===0){setProcessingRatings(false);return "No ratings collected this session.";}
    const lines=dayRatings.map(([k,r])=>{const exId=k.split('_').slice(3).join('_');const fe=day.groups.flatMap(g=>g.exercises).find(e=>e.id===exId);return `${fe?.name||exId}: ${getW(exId,wi)}lbs — ${r}`;}).join("\n");
    const ids=day.groups.flatMap(g=>g.exercises.map(e=>e.id)).join(",");
    const prompt="You are a strength coach. Week "+week+"/12, "+PHASES[wi]+" phase. The user just finished their workout and rated each exercise. Adjust next week's weights if needed, and write a 1-2 sentence summary.\n\nRatings:\n"+lines+"\n\nRules: Failing last 1-2 reps of last set = normal progressive overload, no change. Too easy = +2.5-5lbs. Too hard (failing early sets) = -2.5-5lbs. Just right = no change.\n\nReturn ONLY valid JSON, no markdown:\n{\"summary\":\"1-2 sentences. Acknowledge what went well. If no changes, say so and explain why. Warm but direct.\",\"adjustments\":{\"EXERCISE_ID\": NEW_WEIGHT}}\n\nOnly include exercises that genuinely need changing. Valid IDs: "+ids+". Week to adjust: "+(week+1)+".";
    try{
      const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();const text=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      if(parsed.adjustments&&Object.keys(parsed.adjustments).length>0){
        const n={...adj};const rows=[];
        for(const[id,nw] of Object.entries(parsed.adjustments)){const nx=week+1;if(nx<=12){n[`${tab}_w${nx}_${id}`]=nw;rows.push({user_id:session?.user.id,day:tab,week:nx,exercise_id:id,weight:nw,updated_at:new Date().toISOString()});}}
        setAdj(n);if(session&&rows.length)await supabase.from("weight_adjustments").upsert(rows,{onConflict:"user_id,day,week,exercise_id"});
      }
      setProcessingRatings(false);
      return parsed.summary||"Good session. Weights are on track.";
    }catch(e){console.error("Rating processing failed:",e);setProcessingRatings(false);return "Good session. Keep the weights for next week and focus on form.";}
  };
  const NEXT_TAB={chest_tri:'back_shoulder_bi',back_shoulder_bi:'legs',legs:'chest_tri'};
  const handleFinishWorkout=async()=>{
    // Calculate session stats for completion screen
    const sessionSets=day.groups.flatMap(g=>g.exercises).reduce((sum,ex)=>{
      const s=ex.sets[wi];const cc=getCC(ex.id,s,false);return sum+cc;},0);
    const sessionVol=day.groups.flatMap(g=>g.exercises).reduce((sum,ex)=>{
      const s=ex.sets[wi];const cc=getCC(ex.id,s,false);const w=getW(ex.id,wi);
      const r=parseInt(ex.reps[wi])||10;return sum+(ex.isPullup?0:cc*r*w);},0);
    setCompletionMsg(COMPLETE_MSGS[(week+Object.keys(done).filter(k=>done[k]).length)%COMPLETE_MSGS.length]);
    setCompletionAiSummary("");
    const sessionKey=`${tab}_w${week}`;const updated=[...new Set([...completedSessions,sessionKey])];
    setCompletedSessions(updated);
    const allDone=['chest_tri','back_shoulder_bi','legs'].every(t=>updated.includes(`${t}_w${week}`));
    const newLast=allDone?week:(userProgress?.last_completed_week||0);
    if(session) await supabase.from("user_progress").upsert({user_id:session.user.id,completed_sessions:updated,last_completed_week:newLast,updated_at:new Date().toISOString()});
    setShowComplete({sets:sessionSets,volume:Math.round(sessionVol)});
    const summary=await processRatings();
    setCompletionAiSummary(summary);
  };
  const handleKeepGoing=()=>{
    setShowComplete(false);const nextT=NEXT_TAB[tab];const nextW=nextT==='chest_tri'?Math.min(12,week+1):week;
    changeTab(nextT);if(nextW!==week)changeWeek(nextW);window.scrollTo({top:0,behavior:'smooth'});
  };  const handleFeedback=async()=>{
    if(!feedback.trim()||loading) return;
    setLoading(true);setAiRes(null);
    const day=PLAN[tab];const wi=week-1;
    const summary=day.groups.flatMap(g=>g.exercises.map(ex=>{const w=getW(ex.id,wi);return `${ex.name}: ${ex.sets[wi]}x${ex.reps[wi]} @ ${ex.isPullup?(w===0?"bodyweight":`+${w}lbs`):`${w}lbs`}`;})).join("\n");
    const ids=day.groups.flatMap(g=>g.exercises.map(e=>e.id)).join(",");
    try{
      const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:`Strength coach. Week ${week}/12, ${PHASES[wi]} phase.\n\nWorkout:\n${summary}\n\nFeedback: "${feedback}"\n\nReturn ONLY valid JSON:\n{"analysis":"one sentence","adjustments":{"EXERCISE_ID": NEW_WEIGHT_NUMBER}}\n\nOnly include exercises that need changing. Valid IDs: ${ids}. Round to 2.5lbs.`}]})});
      const data=await res.json();const text=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      setAiRes(parsed);if(session) await supabase.from("session_feedback").insert({user_id:session.user.id,day:tab,week,feedback,ai_response:parsed});
    }catch{setAiRes({analysis:"Could not process. Try again.",adjustments:{}});}
    setLoading(false);
  };
  const handleW1Feedback=async()=>{
    if(!w1Feedback.trim()||w1Loading) return;
    setW1Loading(true);setW1AiRes(null);
    const day=PLAN[tab];
    const summary=day.groups.flatMap(g=>g.exercises.map(ex=>{const w=getW(ex.id,0);return `${ex.name}: ${ex.sets[0]}x${ex.reps[0]} @ ${ex.isPullup?(w===0?"bodyweight":`+${w}lbs`):`${w}lbs`}`;})).join("\n");
    const ids=day.groups.flatMap(g=>g.exercises.map(e=>e.id)).join(",");
    try{
      const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:`Strength coach. End of Week 1, calibration complete.\n\nWeek 1 workout:\n${summary}\n\nFeedback: "${w1Feedback}"\n\nReturn ONLY valid JSON:\n{"analysis":"one sentence","adjustments":{"EXERCISE_ID": CORRECTED_WEIGHT_NUMBER}}\n\nOnly include exercises needing adjustment. Valid IDs: ${ids}. Round to 2.5lbs.`}]})});
      const data=await res.json();const text=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      setW1AiRes(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch{setW1AiRes({analysis:"Could not process. Try again.",adjustments:{}});}
    setW1Loading(false);
  };

  if(!authReady) return <div style={{background:DS.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:DS.labelTert,fontSize:"15px",fontFamily:DS.font}}>Loading…</div>;
  if(!session) return <AuthScreen/>;
  if(userProgress===undefined) return <div style={{background:DS.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:DS.labelTert,fontSize:"15px",fontFamily:DS.font}}>Loading your plan…</div>;
  if(userProgress===null||!userProgress.setup_complete) return <OnboardingScreen session={session} onComplete={()=>loadProgress()}/>;
  if(screen==="settings") return <SettingsScreen session={session} userProgress={userProgress} onBack={()=>setScreen("workout")} onSave={()=>{loadProgress();setScreen("workout");}}/>;
  if(screen==="progress") return <ProgressScreen session={session} adj={adj} userProgress={userProgress} completedSessions={completedSessions} currentWeek={week} onBack={()=>setScreen("workout")}/>;

  const day=PLAN[tab];const wi=week-1;const phase=PHASES[wi];const pc=PHASE_COLORS[phase];
  const mobility=MOBILITY[tab];
  const motivMessages=MOTIVATIONAL[phase]||MOTIVATIONAL.Hypertrophy;
  const motiv=motivMessages[week%motivMessages.length];
  const allKeys=day.groups.flatMap(g=>g.exercises.flatMap(ex=>Array(ex.sets[wi]).fill(null).map((_,si)=>`${tab}_w${week}_${ex.id}_s${si}`)));
  const pct=allKeys.length>0?Math.round(allKeys.filter(k=>done[k]).length/allKeys.length*100):0;
  const RATING_OPTS=[{v:"too_easy",label:"Too Easy",color:DS.green},{v:"just_right",label:"Just Right",color:DS.orange},{v:"too_hard",label:"Too Hard",color:DS.red}];

  return(
    <div style={{background:DS.bg,minHeight:"100vh",color:DS.label,maxWidth:"480px",margin:"0 auto",paddingBottom:"100px",fontFamily:DS.font}}>
      <style>{`
        html,body{background:#000;margin:0;padding:0;min-height:100vh;}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;touch-action:pan-y;}
        textarea,input{caret-color:${day.accent};color:${DS.label};font-family:${DS.font};}
        textarea:focus,input:focus{outline:none!important;}
        button{transition:opacity 0.12s,transform 0.1s;font-family:${DS.font};}
        button:active{opacity:0.65;transform:scale(0.97);}
        .reveal{animation:reveal 0.2s ease;}
        @keyframes reveal{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        .dotPop{animation:dotPop 0.28s cubic-bezier(0.34,1.56,0.64,1);}
        @keyframes dotPop{0%{transform:scale(0.4);opacity:0.3}60%{transform:scale(1.4)}100%{transform:scale(1);opacity:1}}
        .barFill{transition:width 0.35s cubic-bezier(0.34,1.2,0.64,1);}
        .setBtnDone{animation:setBtnDone 0.22s ease;}
        @keyframes setBtnDone{0%{transform:scale(0.95)}50%{transform:scale(1.03)}100%{transform:scale(1)}}
      `}</style>

      {showOrientation&&<OrientationCard accent={day.accent} onDismiss={dismissOrientation}/>}
      {showTour&&<AppTour step={tourStep} accent={day.accent} onNext={()=>setTourStep(p=>p+1)} onSkip={dismissTour}/>}
      {showGapPrompt&&<GapResumePrompt calculatedWeek={gapCalcWeek} lastCompletedWeek={gapLastWeek} onResume={handleGapResume} onAdjust={()=>{setShowGapPrompt(false);setScreen("settings");}}/>}
      {showComplete&&<CompletionOverlay day={day} week={week} message={completionMsg} aiSummary={completionAiSummary} completedSets={showComplete?.sets||0} totalVolume={showComplete?.volume||0} isW1={week===1} w1AiRes={w1AiRes} w1Feedback={w1Feedback} setW1Feedback={setW1Feedback} w1Loading={w1Loading} handleW1Feedback={handleW1Feedback} applyW1Recal={applyW1Recal} feedback={feedback} setFeedback={setFeedback} loading={loading} handleFeedback={handleFeedback} aiRes={aiRes} applyAi={applyAi} getW={getW} wi={wi} onClose={handleKeepGoing}/>}

      {/* ── NAV BAR ── */}
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",borderBottom:`0.5px solid ${DS.sep}`}}>
        {focusMode?(
          /* Focus mode: minimal — day name, completion %, stopwatch, exit */
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:day.accent,flexShrink:0}}/>
              <span style={{fontSize:"16px",fontWeight:600,color:DS.label}}>{day.label}</span>
              <span style={{fontSize:"13px",color:DS.labelTert}}>Wk {week}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <SimpleStopwatch/>
              <span style={{fontFamily:DS.fontMono,fontSize:"13px",color:pct===100?DS.green:DS.labelSec}}>{pct}%</span>
              <Btn onPress={()=>setFocusMode(false)} style={{background:"transparent",border:`1px solid ${DS.sep}`,borderRadius:"14px",padding:"6px 16px",color:DS.labelSec,fontSize:"14px",fontWeight:500}}>Exit</Btn>
            </div>
          </div>
        ):(
          /* Overview mode: full header */
          <>
            {/* Top row: phase timeline left, icons right */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px 8px"}}>
              {/* Phase timeline */}
              <div style={{flex:1,marginRight:"12px"}}>
                <div style={{display:"flex",alignItems:"baseline",gap:"6px",marginBottom:"5px"}}>
                  <span style={{fontSize:"15px",fontWeight:600,color:pc,letterSpacing:"-0.2px"}}>{phase}</span>
                  <span style={{fontSize:"12px",color:DS.labelTert}}>
                    {(()=>{const seg=PHASE_SEGS.find(s=>s.weeks.includes(week));return seg?`Wk ${week-seg.weeks[0]+1} of ${seg.weeks.length}`:"";})()}
                  </span>
                </div>
                <div style={{display:"flex",gap:"3px",alignItems:"center"}}>
                  {PHASE_SEGS.map(seg=>{
                    const past=seg.weeks[seg.weeks.length-1]<week;
                    const current=seg.weeks.includes(week);
                    const pct2=past?100:current?Math.round((week-seg.weeks[0]+1)/seg.weeks.length*100):0;
                    return(
                      <div key={seg.name} style={{flex:1}}>
                        <div style={{height:"3px",background:DS.surfaceEl,borderRadius:"2px",overflow:"hidden"}}>
                          <div style={{width:`${pct2}%`,height:"100%",background:seg.color,transition:"width 0.4s ease"}}/>
                        </div>
                        <div style={{fontSize:"9px",color:current?seg.color:past?DS.labelTert:DS.labelQuat,marginTop:"2px",fontWeight:current?600:400,letterSpacing:"0.2px"}}>{seg.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                <IconBtn onPress={()=>setScreen("progress")} icon={Ico.chart(18)} tint={DS.labelSec}/>
                <IconBtn onPress={()=>setScreen("settings")} icon={Ico.settings(18)} tint={DS.labelSec}/>
                <IconBtn onPress={()=>supabase.auth.signOut()} icon={Ico.logout(17)} tint={DS.labelTert}/>
              </div>
            </div>
            {/* Week calendar — tells a story: built/building/ahead */}
            <div style={{padding:"0 16px 8px"}}>
              <div style={{display:"flex",gap:"2px"}}>
                {Array(12).fill(null).map((_,i)=>{
                  const wk=i+1;
                  const allDone=['chest_tri','back_shoulder_bi','legs'].every(t=>completedSessions.includes(`${t}_w${wk}`));
                  const isCurrent=wk===week;
                  const phaseColor=PHASE_SEGS.find(s=>s.weeks.includes(wk))?.color||DS.labelTert;
                  const isPast=wk<week&&!isCurrent;
                  return(
                    <Btn key={wk} onPress={()=>changeWeek(wk)} style={{flex:1,height:"20px",borderRadius:"4px",
                      background:allDone?`${phaseColor}55`:isCurrent?`${day.accent}30`:isPast?`${phaseColor}20`:DS.surfaceEl,
                      border:`0.5px solid ${allDone?phaseColor:isCurrent?day.accent:"transparent"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all 0.2s",
                      boxShadow:isCurrent?`0 0 6px ${day.accent}60`:"none"}}>
                      <span style={{fontSize:"7px",fontFamily:DS.fontMono,
                        color:allDone?phaseColor:isCurrent?day.accent:isPast?`${phaseColor}80`:DS.labelTert,
                        fontWeight:isCurrent||allDone?700:400}}>{allDone?"✓":wk}</span>
                    </Btn>
                  );
                })}
              </div>
            </div>
            {/* Day tabs */}
            <div style={{padding:"0 16px 8px"}}>
              <div style={{display:"flex",background:DS.surfaceEl,borderRadius:DS.r10,padding:"2px",gap:"2px"}}>
                {Object.entries(PLAN).map(([key,d])=>{
                  const sessionDone=completedSessions.includes(`${key}_w${week}`);const isActive=tab===key;
                  return(
                    <Btn key={key} onPress={()=>changeTab(key)} style={{flex:1,padding:"7px 4px",background:isActive?DS.surfaceEl2:"transparent",borderRadius:DS.r8,color:isActive||sessionDone?DS.label:DS.labelTert,fontSize:"12px",fontWeight:isActive?600:400,lineHeight:1.3,textAlign:"center",position:"relative",transition:"all 0.18s"}}>
                      {sessionDone&&!isActive&&<span style={{position:"absolute",top:"3px",right:"5px",fontSize:"7px",color:DS.labelSec,fontWeight:700}}>✓</span>}
                      <div style={{fontSize:"13px",fontWeight:isActive?600:400,color:isActive?day.accent:sessionDone?DS.labelSec:DS.labelTert}}>{d.day}</div>
                      <div style={{fontSize:"10px",color:isActive?DS.labelSec:DS.labelTert}}>{d.label.split(" ")[0]}</div>
                    </Btn>
                  );
                })}
              </div>
            </div>
            {/* Week selector + progress */}
            <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"0 16px 10px"}}>
              <IconBtn onPress={()=>changeWeek(week-1)} icon={Ico.chevLeft(16)} tint={DS.labelSec}/>
              <div style={{background:`${day.accent}14`,borderRadius:DS.r8,padding:"4px 12px",textAlign:"center",flexShrink:0}}>
                <div style={{fontSize:"8px",color:day.accent,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase"}}>Week</div>
                <div style={{fontFamily:DS.fontMono,fontSize:"24px",fontWeight:300,color:day.accent,lineHeight:1,letterSpacing:"-1px"}}>{week}</div>
                <div style={{fontSize:"8px",color:day.accent,opacity:.5}}>of 12</div>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
                  <span style={{fontSize:"13px",color:DS.labelSec}}>{day.label}</span>
                  <span style={{fontSize:"13px",color:pct===100?DS.green:DS.labelTert,fontFamily:DS.fontMono}}>{pct}%</span>
                </div>
                <div style={{background:DS.surfaceEl,borderRadius:"3px",height:"3px",overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:pct===100?DS.green:day.accent,borderRadius:"3px",transition:"width 0.4s ease"}}/>
                </div>
              </div>
              <IconBtn onPress={()=>changeWeek(week+1)} icon={Ico.chevRight(16)} tint={DS.labelSec}/>
            </div>
          </>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{padding:"0 16px",marginTop:"16px"}}>

        {/* ── START WORKOUT BUTTON ── */}
        {!focusMode&&(
          <>
            <div style={{padding:"10px 14px",marginBottom:"12px",background:DS.surface,borderRadius:DS.r10}}>
              <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.5}}>{day.notes[wi]}</div>
            </div>
            {/* Floating sticky CTA — always visible, never competes with set logging */}
            <Btn onPress={()=>{const gi=getResumeGi(day,wi);setFocusMode(true);setFocusGi(gi);window.scrollTo({top:0,behavior:'smooth'});}} style={{width:"100%",height:"52px",background:day.accent,borderRadius:DS.r12,color:day.accent===DS.blue?"#fff":"#000",fontSize:"17px",fontWeight:600,marginBottom:"24px",letterSpacing:"-0.2px",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",boxShadow:`0 4px 20px ${day.accent}40`}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Workout
            </Btn>
          </>
        )}

        {/* ── FOCUS MODE ── */}
        {focusMode&&(()=>{
          // Step -1: mobility warm-up
          if(focusGi===-1){
            return(
              <div style={{marginBottom:"24px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                  <div>
                    <div style={{fontSize:"13px",fontWeight:600,color:DS.labelSec,letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:"2px"}}>Before You Start</div>
                    <div style={{fontSize:"11px",color:DS.labelTert}}>~2-3 min · complete before first exercise</div>
                  </div>
                </div>
                <div style={{background:DS.surface,borderRadius:DS.r16,overflow:"hidden",marginBottom:"16px"}}>
                  {mobility.map((move,mi)=>(
                    <div key={mi} style={{padding:"14px 16px",borderBottom:mi<mobility.length-1?`0.5px solid ${DS.sep}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"5px"}}>
                        <span style={{fontSize:"16px",fontWeight:500,color:DS.label}}>{move.name}</span>
                        <span style={{fontSize:"12px",color:DS.labelTert}}>{move.timing}</span>
                      </div>
                      <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.55}}>{move.instructions}</div>
                    </div>
                  ))}
                </div>
                <Btn onPress={()=>setFocusGi(0)} style={{width:"100%",height:"50px",background:day.accent,borderRadius:DS.r12,color:day.accent===DS.blue?"#fff":"#000",fontSize:"17px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                  <span>Start Exercises</span>{Ico.chevRight(16)}
                </Btn>
              </div>
            );
          }

          // Core step (after last exercise group)
          if(focusGi===day.groups.length){
            return(
              <div style={{marginBottom:"24px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:600,color:DS.label,marginBottom:"2px"}}>Core Finisher</div>
                    <div style={{fontSize:"11px",color:DS.labelTert}}>Your standard routine · complete before leaving</div>
                  </div>
                </div>
                <div style={{background:DS.surface,borderRadius:DS.r12,padding:"16px",marginBottom:"16px"}}>
                  <CoreFinisher accent={day.accent} tab={tab} week={week} equipment={userProgress?.equipment}/>
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  <Btn onPress={()=>setFocusGi(p=>p-1)} style={{flex:1,height:"44px",background:DS.surface,borderRadius:DS.r10,color:DS.labelSec,fontSize:"15px",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                    {Ico.chevLeft(14)}<span>Back</span>
                  </Btn>
                  <Btn onPress={handleFinishWorkout} disabled={processingRatings} style={{flex:2,height:"44px",background:DS.green,borderRadius:DS.r10,color:"#000",fontSize:"15px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                    <span>{processingRatings?"Processing…":"End Workout"}</span>
                    {!processingRatings&&Ico.check(14)}
                  </Btn>
                </div>
              </div>
            );
          }

          // Steps 0+: exercise groups
          const group=day.groups[focusGi];
          const isLast=focusGi===day.groups.length-1;
          const groupAllDone=group.exercises.every(ex=>getCC(ex.id,ex.sets[wi],false)>=ex.sets[wi]);
          return(
            <div style={{marginBottom:"24px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"15px",fontWeight:600,color:day.accent}}>{group.label}</span>
                <span style={{fontSize:"12px",color:DS.labelTert}}>{focusGi+1} of {day.groups.length}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                {group.supersetted&&<Btn onPress={()=>setSSOpen(p=>({...p,[focusGi]:!p[focusGi]}))} style={{background:ssOpen[focusGi]?`${day.accent}18`:DS.fillTert,borderRadius:"12px",padding:"3px 10px",color:ssOpen[focusGi]?day.accent:DS.labelTert,fontSize:"11px",fontWeight:500}}>
                  {ssOpen[focusGi]?"hide":"what's a superset?"}
                </Btn>}
                {/* Rest duration */}
                <span style={{fontSize:"12px",color:DS.labelTert}}>{group.rest}</span>
              </div>
            </div>
              {/* Superset definition — hidden by default, toggled */}
              {group.supersetted&&ssOpen[focusGi]&&(
                <div className="reveal" style={{background:DS.surface,borderRadius:DS.r10,padding:"10px 14px",marginBottom:"10px",borderLeft:`2.5px solid ${day.accent}`}}>
                  <span style={{fontSize:"14px",fontWeight:600,color:day.accent}}>Superset: </span>
                  <span style={{fontSize:"14px",color:DS.labelSec}}>Alternate between both exercises. Rest {parseRest(group.rest)}s after completing a round of both.</span>
                </div>
              )}
              {group.exercises.map((ex)=>{
                const w=getW(ex.id,wi),prevW=getPrevW(ex.id,wi),w1base=getW1(ex.id);
                const s=ex.sets[wi],r=ex.reps[wi],bo=ex.backoff[wi];
                const wLabel=ex.isPullup?(w===0?"BW":`+${w}`):`${w}`;
                const isAdj=adj[`${tab}_w${week}_${ex.id}`]!==undefined;
                const cues=FORM_CUES[ex.id],isOpen=cueOpen[ex.id];
                const delta=(week>1&&prevW!==null)?Math.round((w-prevW)*10)/10:null;
                const isPR=PR_EXERCISES.includes(ex.id)&&prs[ex.id]&&w>0&&w>=prs[ex.id]&&isAdj;
                const cc=getCC(ex.id,s,false);
                const boCount=bo?getCC(ex.id,bo.sets,true):0;
                const currentRating=ratings[`${tab}_w${week}_${ex.id}`];
                const allSetsDone=cc>=s;
                const showW1Progress=week>1&&w1base>0&&w!==w1base;
                const RATING_OPTS_F=[{v:"too_easy",label:"Too Easy",color:DS.green},{v:"just_right",label:"Just Right",color:DS.orange},{v:"too_hard",label:"Too Hard",color:DS.red}];
                return(
                  <div key={ex.id} style={{background:DS.surface,borderRadius:DS.r16,overflow:"hidden",marginBottom:"10px"}}>
                    {cc>0&&<div style={{height:"3px",background:`${day.accent}20`}}><div style={{height:"100%",width:`${(cc/s)*100}%`,background:allSetsDone?DS.green:day.accent,transition:"width 0.3s ease"}}/></div>}
                    <div style={{padding:"16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                            <span style={{fontSize:"17px",fontWeight:600,color:DS.label,letterSpacing:"-0.2px"}}>{ex.name}</span>
                            {isPR&&<span style={{fontSize:"10px",fontWeight:700,color:"#000",background:day.accent,padding:"2px 7px",borderRadius:"10px"}}>PR</span>}
                          </div>
                          {ex.note&&<div style={{fontSize:"12px",color:DS.labelTert,marginTop:"2px"}}>{ex.note}</div>}
                        </div>
                        {cues&&<IconBtn onPress={()=>setCueOpen(p=>({...p,[ex.id]:!p[ex.id]}))} icon={Ico.info(16)} tint={isOpen?day.accent:DS.labelTert} bg={isOpen?`${day.accent}18`:DS.fillTert}/>}
                      </div>
                      {isOpen&&cues&&(
                        <div className="reveal" style={{marginBottom:"14px",padding:"13px 14px",background:DS.surfaceEl,borderRadius:DS.r10,borderLeft:`2.5px solid ${day.accent}`}}>
                          <div style={{fontSize:"11px",fontWeight:700,color:day.accent,letterSpacing:"0.5px",marginBottom:"5px",textTransform:"uppercase"}}>Setup</div>
                          <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.55,marginBottom:"10px"}}>{cues.setup}</div>
                          <div style={{fontSize:"11px",fontWeight:700,color:day.accent,letterSpacing:"0.5px",marginBottom:"5px",textTransform:"uppercase"}}>Cues</div>
                          <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.55,marginBottom:"10px"}}>{cues.cues}</div>
                          <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name+' exercise form tutorial')}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"4px",color:day.accent,fontSize:"12px",textDecoration:"none",fontWeight:500}}>
                            {Ico.play(10)}<span>Watch demo</span>
                          </a>
                        </div>
                      )}
                      {/* Weight hero */}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0",marginBottom:"10px"}}>
                        <Btn onPress={()=>adjustW(ex.id,wi,-1)} style={{width:"44px",height:"44px",background:DS.fillTert,borderRadius:"50%",color:DS.labelSec,fontSize:"22px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</Btn>
                        <div style={{flex:1,textAlign:"center",padding:"4px 8px"}}>
                          {editingW===ex.id?(
                            <input autoFocus type="number" inputMode="decimal" value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>commitWeightEdit(ex.id)} onKeyDown={e=>{if(e.key==='Enter')commitWeightEdit(ex.id);}} style={{width:"100%",background:DS.surfaceEl,border:`1.5px solid ${day.accent}`,borderRadius:DS.r10,color:DS.label,fontFamily:DS.fontMono,fontSize:"32px",textAlign:"center",padding:"8px",fontWeight:300}}/>
                          ):(
                            <div onClick={()=>{setEditingW(ex.id);setEditVal(String(w));}} style={{cursor:"pointer"}}>
                              <span style={{fontFamily:DS.fontMono,fontSize:"52px",fontWeight:300,color:isAdj?day.accent:DS.label,letterSpacing:"-2px",lineHeight:1}}>{wLabel}</span>
                              <span style={{fontSize:"16px",color:DS.labelSec,marginLeft:"4px"}}>{ex.isPullup&&w>0?"lbs":!ex.isPullup?"lbs":""}</span>
                            </div>
                          )}
                        </div>
                        <Btn onPress={()=>adjustW(ex.id,wi,1)} style={{width:"44px",height:"44px",background:DS.fillTert,borderRadius:"50%",color:DS.labelSec,fontSize:"22px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</Btn>
                      </div>
                      {/* Sets × reps — clear prescription */}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",marginBottom:"14px"}}>
                        <div style={{display:"flex",alignItems:"baseline",gap:"3px"}}>
                          <span style={{fontFamily:DS.fontMono,fontSize:"22px",fontWeight:400,color:DS.label}}>{s}</span>
                          <span style={{fontSize:"13px",color:DS.labelTert}}>sets</span>
                          <span style={{fontSize:"16px",color:DS.labelTert,margin:"0 4px"}}>×</span>
                          <span style={{fontFamily:DS.fontMono,fontSize:"20px",fontWeight:400,color:DS.labelSec}}>{r}</span>
                          <span style={{fontSize:"13px",color:DS.labelTert}}>reps</span>
                        </div>
                      </div>
                      {/* Set tracker with explicit position label */}
                      <div style={{background:DS.surfaceEl,borderRadius:DS.r10,padding:"12px"}}>
                        {/* Explicit position */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
                          <span style={{fontSize:"13px",color:allSetsDone?DS.green:DS.labelSec,fontWeight:500}}>
                            {allSetsDone?"All sets done":"Set "+( cc+1)+" of "+s}
                          </span>
                          {/* Thin bar indicators */}
                          <div style={{display:"flex",gap:"3px",width:"60px"}}>
                            {Array(s).fill(null).map((_,si)=>(
                              <div key={si} style={{flex:1,height:"3px",borderRadius:"2px",background:si<cc?day.accent:DS.surfaceEl2,transition:"background 0.2s"}}/>
                            ))}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:"8px"}}>
                          {cc<s?(
                            <Btn onPress={()=>completeNextSet(ex.id,s,group.rest,group.label,false)} style={{flex:1,height:"64px",background:day.accent,borderRadius:DS.r12,color:day.accent===DS.blue?"#fff":"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"2px",boxShadow:`0 4px 16px ${day.accent}50`}}>
                              <span style={{fontSize:"12px",fontWeight:500,opacity:0.75,letterSpacing:"0.3px"}}>SET {cc+1} OF {s}</span>
                              <span style={{fontSize:"22px",fontWeight:700,letterSpacing:"-0.5px"}}>Done ✓</span>
                            </Btn>
                          ):(
                            <div style={{flex:1,height:"64px",display:"flex",alignItems:"center",justifyContent:"center",background:`${DS.green}12`,borderRadius:DS.r12,gap:"8px",color:DS.green,fontSize:"16px",fontWeight:600}}>
                              {Ico.check(16)}<span>All sets done</span>
                            </div>
                          )}
                          {cc>0&&<Btn onPress={()=>undoLastSet(ex.id,s,false)} style={{height:"64px",width:"56px",background:DS.fillTert,borderRadius:DS.r12,color:DS.labelTert,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.undo(15)}</Btn>}
                        </div>
                      </div>
                      {allSetsDone&&(
                        <div className="reveal" style={{marginTop:"10px",padding:"10px 12px",background:DS.fillTert,borderRadius:DS.r10}}>
                          <div style={{fontSize:"12px",color:DS.labelTert,marginBottom:"8px",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.4px"}}>How did that feel?</div>
                          <div style={{display:"flex",gap:"6px"}}>
                            {RATING_OPTS_F.map(({v,label,color})=>(
                              <Btn key={v} onPress={()=>setRating(ex.id,v)} style={{flex:1,padding:"8px 4px",background:currentRating===v?`${color}20`:DS.surface,borderRadius:DS.r8,color:currentRating===v?color:DS.labelTert,fontSize:"12px",fontWeight:currentRating===v?600:400,transition:"all 0.15s",border:currentRating===v?`0.5px solid ${color}`:"none"}}>
                                {label}
                              </Btn>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Focus mode nav */}
              <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
                <Btn onPress={()=>setFocusGi(p=>p-1)} style={{flex:1,height:"44px",background:DS.surface,borderRadius:DS.r10,color:DS.labelSec,fontSize:"15px",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                  {Ico.chevLeft(14)}<span>{focusGi===0?"Mobility":"Previous"}</span>
                </Btn>
                <Btn onPress={()=>setFocusGi(p=>p+1)} style={{flex:2,height:"44px",background:groupAllDone?day.accent:DS.surfaceEl,borderRadius:DS.r10,color:groupAllDone?(day.accent===DS.blue?"#fff":"#000"):DS.labelSec,fontSize:"15px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",transition:"all 0.2s"}}>
                  <span>{isLast?"Core →":"Next"}</span>{!isLast&&Ico.chevRight(14)}
                </Btn>
              </div>
            </div>
          );
        })()}

        {/* ── EXERCISE GROUPS (overview) ── */}
        {!focusMode&&<>
        {/* ── EXERCISE GROUPS ── */}
        {day.groups.map((group,gi)=>(
          <div key={gi} style={{marginBottom:"28px"}}>
            {/* Group header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"13px",fontWeight:700,color:day.accent,letterSpacing:"0.5px",textTransform:"uppercase"}}>{group.label}</span>
                {group.supersetted&&(
                  <Btn onPress={()=>setSSOpen(p=>({...p,[gi]:!p[gi]}))} style={{background:ssOpen[gi]?`${day.accent}18`:DS.fillTert,borderRadius:"12px",padding:"3px 10px",color:ssOpen[gi]?day.accent:DS.labelTert,fontSize:"11px",fontWeight:500,transition:"all 0.15s"}}>
                    {ssOpen[gi]?"hide":"what's a superset?"}
                  </Btn>
                )}
              </div>
              <span style={{fontSize:"12px",color:DS.labelTert}}>{group.rest}</span>
            </div>
            {ssOpen[gi]&&(
              <div className="reveal" style={{background:DS.surface,borderRadius:DS.r10,padding:"12px 14px",marginBottom:"10px",borderLeft:`2.5px solid ${day.accent}`}}>
                <span style={{fontSize:"14px",fontWeight:600,color:day.accent}}>Superset: </span>
                <span style={{fontSize:"14px",color:DS.labelSec,lineHeight:1.55}}>Do one set of the first exercise, then immediately one set of the second — no rest in between. Rest after both. This alternating pattern continues until all sets are done.</span>
              </div>
            )}

            {/* Exercise cards — left-accent-bar reference design */}
            {group.exercises.map((ex)=>{
              const w=getW(ex.id,wi);
              const s=ex.sets[wi],r=ex.reps[wi],bo=ex.backoff[wi];
              const wLabel=ex.isPullup?(w===0?"BW":`+${w}`):`${w}`;
              const wSuffix=ex.isPullup&&w===0?"":ex.isPullup?" lbs":" lbs";
              const isAdj=adj[`${tab}_w${week}_${ex.id}`]!==undefined;
              const cues=FORM_CUES[ex.id],isOpen=cueOpen[ex.id];
              const isPR=PR_EXERCISES.includes(ex.id)&&prs[ex.id]&&w>0&&w>=prs[ex.id]&&isAdj;
              const cc=getCC(ex.id,s,false);
              const boCount=bo?getCC(ex.id,bo.sets,true):0;
              const currentRating=ratings[`${tab}_w${week}_${ex.id}`];
              const allSetsDone=cc>=s;
              const prevW=getPrevW(ex.id,wi);
              const delta=(week>1&&prevW!==null)?Math.round((w-prevW)*10)/10:null;
              const doneKey=`${tab}_w${week}_${ex.id}_s${cc-1}`;
              const isPartial=cc>0&&!allSetsDone;

              return(
                <div key={ex.id} style={{background:DS.surface,borderRadius:DS.r12,overflow:"hidden",marginBottom:"8px",display:"flex"}}>
                  {/* Left accent bar — shows completion state */}
                  <div style={{width:"3px",flexShrink:0,background:allSetsDone?DS.green:isPartial?day.accent:DS.surfaceEl2,transition:"background 0.3s"}}/>
                  <div style={{flex:1,padding:"11px 13px"}}>
                    {/* Single-row: name · weight · sets×reps · dots · action */}
                    <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                      {/* Name + badges */}
                      <div style={{flex:"1 1 auto",minWidth:0,display:"flex",alignItems:"center",gap:"5px"}}>
                        <span style={{fontSize:"14px",fontWeight:600,color:allSetsDone?DS.labelSec:DS.label,letterSpacing:"-0.1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",transition:"color 0.2s"}}>{ex.name}</span>
                        {isPR&&<span style={{fontSize:"9px",fontWeight:700,color:"#000",background:day.accent,padding:"1px 5px",borderRadius:"8px",flexShrink:0}}>PR</span>}
                        {delta!==null&&delta!==0&&<span style={{fontSize:"11px",color:delta>0?DS.green:DS.red,fontFamily:DS.fontMono,flexShrink:0}}>{delta>0?`+${delta}`:delta}</span>}
                      </div>
                      {/* Info button */}
                      {cues&&<IconBtn onPress={()=>setCueOpen(p=>({...p,[ex.id]:!p[ex.id]}))} icon={Ico.info(13)} tint={isOpen?day.accent:DS.labelTert} bg={isOpen?`${day.accent}15`:DS.fillTert}/>}
                    </div>
                    {/* Second row: weight · prescription · progress · action */}
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"6px",flexWrap:"nowrap"}}>
                      {/* Inline weight with silent −/+ */}
                      <div style={{display:"flex",alignItems:"center",gap:"3px",flexShrink:0}}>
                        <Btn onPress={()=>adjustW(ex.id,wi,-1)} style={{color:DS.labelTert,fontSize:"14px",background:"none",padding:"0 2px",lineHeight:1}}>−</Btn>
                        <div onClick={()=>{setEditingW(ex.id);setEditVal(String(w));}} style={{cursor:"pointer",flexShrink:0}}>
                          {editingW===ex.id?(
                            <input autoFocus type="number" inputMode="decimal" value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>commitWeightEdit(ex.id)} onKeyDown={e=>{if(e.key==='Enter')commitWeightEdit(ex.id);}} style={{width:"56px",background:DS.surfaceEl,border:`1px solid ${day.accent}`,borderRadius:DS.r6,color:DS.label,fontFamily:DS.fontMono,fontSize:"15px",textAlign:"center",padding:"2px 5px",fontWeight:300}}/>
                          ):(
                            <span style={{fontFamily:DS.fontMono,fontSize:"16px",fontWeight:300,color:isAdj?day.accent:DS.label,letterSpacing:"-0.3px"}}>{wLabel}<span style={{fontSize:"10px",color:DS.labelTert,marginLeft:"2px"}}>{wSuffix}</span></span>
                          )}
                        </div>
                        <Btn onPress={()=>adjustW(ex.id,wi,1)} style={{color:DS.labelTert,fontSize:"14px",background:"none",padding:"0 2px",lineHeight:1}}>+</Btn>
                      </div>
                      <span style={{color:DS.sep,fontSize:"11px",flexShrink:0}}>·</span>
                      {/* Sets hero, reps secondary */}
                      <span style={{fontFamily:DS.fontMono,fontSize:"15px",fontWeight:500,color:DS.label,flexShrink:0}}>{s}</span>
                      <span style={{fontSize:"11px",color:DS.labelTert,flexShrink:0}}>×</span>
                      <span style={{fontFamily:DS.fontMono,fontSize:"13px",color:DS.labelSec,flexShrink:0}}>{r}</span>
                      <span style={{color:DS.sep,fontSize:"11px",flexShrink:0}}>·</span>
                      {/* Animated progress dots */}
                      <div style={{display:"flex",gap:"3px",alignItems:"center",flex:1,minWidth:0}}>
                        {Array(s).fill(null).map((_,si)=>(
                          <div key={si}
                            className={si===cc-1&&lastCompletedKey===doneKey?"dotPop":""}
                            style={{width:"7px",height:"7px",borderRadius:"50%",background:si<cc?day.accent:DS.surfaceEl2,flexShrink:0,transition:"background 0.15s"}}/>
                        ))}
                      </div>
                      {/* The log action — smallest possible footprint, unambiguous */}
                      <div style={{flexShrink:0}}>
                        {allSetsDone?(
                          <span style={{color:DS.green}}>{Ico.check(14)}</span>
                        ):(
                          <Btn onPress={()=>completeNextSet(ex.id,s,group.rest,group.label,false)} style={{background:day.accent,borderRadius:DS.r6,width:"30px",height:"30px",display:"flex",alignItems:"center",justifyContent:"center",color:day.accent===DS.blue?"#fff":"#000",fontSize:"18px",fontWeight:600,flexShrink:0}}>+</Btn>
                        )}
                      </div>
                    </div>
                    {/* Cue panel */}
                    {isOpen&&cues&&(
                      <div className="reveal" style={{marginTop:"8px",padding:"10px 12px",background:DS.surfaceEl,borderRadius:DS.r8,borderLeft:`2px solid ${day.accent}`}}>
                        <div style={{fontSize:"11px",fontWeight:700,color:day.accent,letterSpacing:"0.5px",marginBottom:"4px",textTransform:"uppercase"}}>Setup</div>
                        <div style={{fontSize:"12px",color:DS.labelSec,lineHeight:1.5,marginBottom:"8px"}}>{cues.setup}</div>
                        <div style={{fontSize:"11px",fontWeight:700,color:day.accent,letterSpacing:"0.5px",marginBottom:"4px",textTransform:"uppercase"}}>Cues</div>
                        <div style={{fontSize:"12px",color:DS.labelSec,lineHeight:1.5,marginBottom:"8px"}}>{cues.cues}</div>
                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name+' exercise form tutorial')}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"4px",color:day.accent,fontSize:"12px",textDecoration:"none",fontWeight:500}}>
                          {Ico.play(10)}<span>Watch demo</span>
                        </a>
                      </div>
                    )}
                    {/* Rating inline after all sets done */}
                    {allSetsDone&&(
                      <div className="reveal" style={{display:"flex",gap:"5px",marginTop:"8px"}}>
                        {RATING_OPTS.map(({v,label,color})=>(
                          <Btn key={v} onPress={()=>setRating(ex.id,v)} style={{flex:1,padding:"5px 4px",background:currentRating===v?`${color}18`:DS.surfaceEl,borderRadius:DS.r6,color:currentRating===v?color:DS.labelTert,fontSize:"11px",fontWeight:currentRating===v?600:400,border:currentRating===v?`0.5px solid ${color}`:"none"}}>
                            {label}
                          </Btn>
                        ))}
                      </div>
                    )}
                    {/* Back-off */}
                    {bo&&allSetsDone&&(
                      <div style={{marginTop:"6px",display:"flex",alignItems:"center",gap:"6px"}}>
                        <span style={{fontSize:"10px",color:DS.labelTert,flex:1}}>Back-off {boCount} of {bo.sets} done ({bo.reps} @ {bo.w}lbs)</span>
                        {boCount<bo.sets&&<Btn onPress={()=>completeNextSet(ex.id,bo.sets,group.rest,"back-off",true)} style={{background:day.accent,borderRadius:DS.r6,width:"22px",height:"22px",color:day.accent===DS.blue?"#fff":"#000",fontSize:"14px",fontWeight:600}}>+</Btn>}
                        {boCount>=bo.sets&&<span style={{color:DS.green}}>{Ico.check(12)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        </>}

        {/* Core finisher */}
        {!focusMode&&<CoreFinisher accent={day.accent} tab={tab} week={week} equipment={userProgress?.equipment}/>}

        {/* Finish workout (overview mode only — focus mode has its own end workout) */}
        {!focusMode&&<Btn onPress={handleFinishWorkout} disabled={processingRatings} style={{width:"100%",height:"50px",background:processingRatings?DS.surfaceEl:`${day.accent}18`,border:`0.5px solid ${processingRatings?DS.sep:day.accent}40`,borderRadius:DS.r12,color:processingRatings?DS.labelTert:day.accent,fontSize:"17px",fontWeight:600,marginBottom:"28px",letterSpacing:"-0.2px"}}>
          {processingRatings?"Processing ratings…":"Finish Workout"}
        </Btn>}

      </div>

    </div>
  );
}
