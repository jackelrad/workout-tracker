import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── DESIGN TOKENS ──────────────────────────────────────────────────────
const DS = {
  bg:        "#000000",
  surface:   "#1C1C1E",
  surfaceAlt:"#2C2C2E",
  border:    "#38383A",
  borderSub: "#2C2C2E",
  label:     "#FFFFFF",
  labelSec:  "#AEAEB2",
  labelTert: "#636366",
  accent:    "#FF9F0A",
  accentBlue:"#0A84FF",
  accentGreen:"#30D158",
  accentRed: "#FF453A",
  radius:    "12px",
  radiusSm:  "8px",
  radiusXs:  "6px",
};

// ── CONSTANTS ──────────────────────────────────────────────────────────
const PHASES = ["Hypertrophy","Hypertrophy","Hypertrophy","Hypertrophy","Strength","Strength","Strength","Strength","Peaking","Peaking","Peaking","Deload"];
const PHASE_COLORS = { Hypertrophy:DS.accentGreen, Strength:DS.accent, Peaking:DS.accentRed, Deload:DS.labelTert };
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

// ── FORM CUES ──────────────────────────────────────────────────────────
const FORM_CUES={
  bench:{setup:"Grip slightly wider than shoulder-width. Slight natural arch. Butt stays on bench. Feet flat — drive through heels.",cues:"Bar path: lower to mid-chest at a slight diagonal. Elbows 45-75° from torso — not flared. Touch chest lightly, brief pause, press. Think: leg drive into the floor as you press."},
  pushdown:{setup:"Cable set high. Rope attachment. Slight hip hinge forward. Elbows pinned to your sides — they don't move.",cues:"Pull rope ends apart at the bottom for full contraction. 2s eccentric on the way up. If elbows are flaring or lifting, drop the weight."},
  incline:{setup:"Bench at 30-45°. DBs at chest level, elbows slightly below bench line at the bottom.",cues:"Press straight up — don't let DBs travel toward each other. Feel the stretch at the bottom. Stop just short of lockout. Shoulders packed, not shrugging."},
  skull:{setup:"Lie flat, EZ bar over forehead. Elbows shoulder-width apart, pointed at the ceiling.",cues:"Lower bar just behind your forehead. Elbows stay pointing up — flaring is the key failure point. Controlled down, press up. 10lb increments only."},
  fly:{setup:"Cable at chest height or slightly above. Slight forward lean. Slight bend in elbows — hold that angle the entire set.",cues:"Drive with upper arms, not hands. Think hugging a tree. Full stretch at start. Stop just before hands touch. Don't let the weight yank your shoulder back."},
  kickback:{setup:"Cable set low. Hinge forward at hips, upper arm parallel to the floor and pinned to your side. Forearm hangs down at start.",cues:"Extend forearm back until arm is fully straight. Squeeze hard at the top for 1 count. Pure elbow extension — no shoulder movement."},
  pullup:{setup:"Grip just outside shoulder-width, palms facing away. Dead hang to start. Engage lats before you pull.",cues:"Full dead hang between every rep — this is where ROM gets lost. Drive elbows down and back. Chin clears the bar every rep. Reduce reps before sacrificing range."},
  row:{setup:"Bar below knee, slight knee bend, hinge at hips ~45°. Back neutral — not rounded.",cues:"Drive elbows back, not up. Bar touches your lower abdomen at the top. Pause and squeeze. 2s controlled eccentric. Torso should not swing."},
  facepull:{setup:"Cable at face height. Rope attachment. Step back until arms are extended.",cues:"Pull rope to your face, hands finishing beside your ears. Think show your armpits. External rotation is the goal — shoulder health work. Light weight, high control, every week."},
  db_shoulder:{setup:"Seated or standing. DBs at shoulder level, elbows slightly in front of your ears — not directly out to the sides.",cues:"Press overhead but stop short of lockout — keep tension on delts. Don't crane your neck forward. Controlled return. If lower back is arching, go seated."},
  incline_curl:{setup:"Bench at 45-60°. Arms hang fully behind torso — full stretch on the bicep long head. One DB per hand. Alternate arms each rep.",cues:"Supinated grip (palms up) throughout — not hammer grip. Curl from a full dead hang. Don't let elbows swing forward at the top. Slow eccentric — 2-3s down."},
  lat_raise:{setup:"Cable low. Start with hand at hip, slight bend in elbow. 12 reps per side — complete all reps on one side before switching.",cues:"Raise to shoulder height only — not above. Lead with your elbow, not your hand. Avoid shrugging at the top."},
  lat_pulldown:{setup:"Grip just outside shoulder-width, lean back slightly. Engage lats before you pull.",cues:"Pull bar to upper chest, driving elbows down and back. Don't lean back excessively. Full arm extension at the top on every rep — ROM first, weight second."},
  trap_bar:{setup:"Stand centered in the trap bar. Hip hinge to grip, shins nearly vertical. Neutral spine — brace hard before lifting.",cues:"Drive through the floor, not up with your back. Think push the ground away. Hips and shoulders rise at the same rate. Lock out with glutes, not hyperextension."},
  leg_press:{setup:"Feet shoulder-width, mid-plate or slightly high. Back flat against the pad. Weight shown is total load including the carriage.",cues:"Lower until knees at or past 90° — don't cut the range. Knees track over toes. Drive through the full foot. Stop just short of lockout. Both legs simultaneously."},
  rdl:{setup:"Hip-width stance, slight knee bend that doesn't change. Bar close to legs throughout.",cues:"Hinge at hips — push them back, not down. Feel the hamstring stretch. Lower until stretch but spine stays neutral. 3s eccentric. Drive hips forward to return. Not a squat."},
  calf:{setup:"Stand on a plate or step with heels hanging off the edge. Hold DBs at your sides. Knee stays straight throughout.",cues:"Full stretch at the bottom — heel fully below the step, hold 1s. Drive all the way to the top — hold 1s. Full ROM is more important than load."},
  leg_ext:{setup:"Seat adjusted so knee joint aligns with machine pivot. Pad on lower shin. Both legs simultaneously.",cues:"Extend fully, squeeze at top for 1 count. Slow eccentric — 2-3s down. Avoid swinging or momentum. Keep back against the pad throughout."},
  leg_curl:{setup:"Lie face down, pad just above the ankle. Hips stay flat on the bench. Both legs simultaneously.",cues:"Curl heels to glutes. Squeeze at the top. Slow eccentric — 2-3s. Don't let hips lift. Plantarflex feet slightly to increase hamstring recruitment."}
};

const MOBILITY={
  chest_tri:[
    {name:"Thoracic Rotation",timing:"5 reps/side · 45s",instructions:"Sit or kneel with hands behind your head. Slowly rotate your upper back as far as you can each direction. Feel your mid-back doing the work."},
    {name:"Pec Minor Stretch",timing:"30s/side · 60s",instructions:"Place forearm against a rack upright at 90°. Step through until you feel a stretch across your chest and front shoulder. Hold steady. Switch sides."}
  ],
  back_shoulder_bi:[
    {name:"Lat Hang",timing:"2 × 20s · 60s",instructions:"Hang from the pull-up bar with a full dead hang. Let your shoulder blades rise fully. Two short holds, not one long one."},
    {name:"Band Pull-Apart",timing:"2 × 15 reps · 60s",instructions:"Use a light band or the face pull cable at minimal weight. Focus on squeezing the rear delts and external rotators at the end range."}
  ],
  legs:[
    {name:"Leg Swings",timing:"10 reps/direction/side · 60s",instructions:"Hold onto a rack. Swing each leg front-to-back 10 times, then side-to-side 10 times. Controlled but full range."},
    {name:"Deep Squat Hold",timing:"2 × 20s · 60s",instructions:"Hold a rack and lower into the deepest squat you can maintain with a flat back. Let your hips sink, knees track over toes. Two holds, no bouncing."}
  ]
};

// ── PLAN DATA ──────────────────────────────────────────────────────────
const PLAN={
  chest_tri:{
    label:"Chest & Triceps",day:"SUN",accent:"#FF9F0A",
    notes:["Calibration week. 2 reps in reserve every set. Build from here.","Add 5lbs to bench and incline. EZ bar holds at 50.","Another 5lbs on bench. EZ bar holds — build clean reps before jumping.","Volume peak. More reps at slightly lower weight on main lifts.","Strength block begins. Weight jumps. Hard by set 4.","All 5 sets. Controlled 2s eccentric on bench.","Heavier than last week. Short rest only if needed.","Last heavy week before peaking. Leave nothing.","Low volume, high intensity. Top sets matter.","Top set then back-off sets. Trust the fatigue.","Near-max bench attempt. Spotter recommended.","Deload. Light, full ROM, no strain."],
    groups:[
      {label:"Superset 1",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"bench",name:"Flat Barbell Bench Press",weights:[135,140,145,135,155,160,165,170,175,180,185,115],sets:[4,4,4,4,5,5,5,5,4,3,3,3],reps:["10","10","10","12","6","5","5","5","4","3","2-3","8"],backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"8",w:150},{sets:3,reps:"6",w:155},null]},
        {id:"pushdown",name:"Cable Tricep Pushdown",weights:[32.5,35,37.5,37.5,42.5,45,47.5,50,52.5,55,57.5,32.5],sets:[4,4,4,4,5,5,5,5,4,4,4,3],reps:["12","12","12","12","8","8","8","8","8","8","8","10"],backoff:Array(12).fill(null)}
      ]},
      {label:"Superset 2",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"incline",name:"Incline DB Press",weights:[45,50,50,45,55,60,60,65,65,70,70,40],sets:[4,4,4,4,5,5,5,5,4,3,3,3],reps:["10","10","10","12","6","6","5","5","4","3","2-3","8"],backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"6",w:55},{sets:3,reps:"6",w:55},null]},
        {id:"skull",name:"EZ Bar Skull Crushers",weights:[50,50,50,50,60,60,60,70,70,70,80,50],sets:[4,4,4,4,5,5,5,5,4,4,4,3],reps:["12","12","12","15","8","8","8","8","8","8","8","10"],backoff:Array(12).fill(null),note:"10lb increments only."}
      ]},
      {label:"Superset 3",rest:"Rest 60s",supersetted:true,exercises:[
        {id:"fly",name:"Cable Fly",weights:[17.5,20,20,17.5,22.5,25,25,27.5,27.5,30,30,17.5],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","15","10","10","10","10","12","12","12","10"],backoff:Array(12).fill(null)},
        {id:"kickback",name:"Cable Tricep Kickback",weights:[15,17.5,20,20,22.5,25,27.5,30,30,32.5,35,15],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","15","10","10","10","10","12","12","12","10"],backoff:Array(12).fill(null),note:"Full tricep isolation, no overhead load."}
      ]}
    ]
  },
  back_shoulder_bi:{
    label:"Back · Shoulder · Bi",day:"TUE",accent:"#0A84FF",
    notes:["Full ROM on every pull-up. Row is a pattern rebuild: form over weight.","Add a rep on pull-ups if ROM was full. Row adds 10lbs.","Row: elbows drive back, not up. Watch form on last shoulder set.","Volume peak. Higher reps. Curl: 4 sets for bicep development.","Belt on for pull-ups. Strength block begins.","Push rows heavy. Controlled eccentric on every rep.","Shoulder press: form over weight. No cheat reps.","Last heavy week before peaking.","Chest-to-bar attempts on weighted pull-ups.","Heavy rows. Every set deliberate.","Near-max weighted pull-ups.","Deload. Move well, recover fully."],
    groups:[
      {label:"Straight Set",rest:"Rest 90s",supersetted:false,exercises:[
        {id:"pullup",name:"Pull-ups",weights:[0,0,0,0,10,15,20,20,25,30,35,0],sets:[4,4,4,4,4,4,4,4,4,4,4,3],reps:["8","8","9","10","6","6","5","5","4","3","3","6"],backoff:Array(12).fill(null),isPullup:true,note:"Full dead hang between every rep. Reduce reps before losing ROM."}
      ]},
      {label:"Superset 1",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"row",name:"Barbell Row",weights:[65,75,85,90,100,110,115,120,125,130,135,90],sets:[4,4,4,4,5,5,5,5,4,4,4,3],reps:["10","10","10","10","6","5","5","5","4","4","4","8"],backoff:Array(12).fill(null),note:"Pattern rebuild — weight climbs quickly. Form over load every set."},
        {id:"facepull",name:"Face Pull",weights:[40,42.5,45,47.5,50,52.5,55,57.5,57.5,60,60,40],sets:[4,4,4,4,4,4,4,4,4,4,4,3],reps:["12","12","12","12","12","12","12","12","12","12","12","12"],backoff:Array(12).fill(null)}
      ]},
      {label:"Superset 2",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"db_shoulder",name:"DB Shoulder Press",weights:[50,52.5,55,55,62.5,65,67.5,70,72.5,75,77.5,50],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["10","10","10","10","6","6","5","5","4","4","3","8"],backoff:Array(12).fill(null),note:"Hold starting weight through W3 until all reps are clean."},
        {id:"incline_curl",name:"Alternating Incline DB Curl",weights:[25,25,27.5,30,32.5,35,37.5,40,40,42.5,45,25],sets:[4,4,4,4,4,4,4,4,4,4,4,3],reps:["10","10","10","12","8","8","6","6","8","8","8","10"],backoff:Array(12).fill(null),note:"Supinated grip (palms up) — not hammer. Alternate one arm at a time."}
      ]},
      {label:"Superset 3",rest:"Rest 60s",supersetted:true,exercises:[
        {id:"lat_raise",name:"Cable Lateral Raise",weights:[10,10,10,10,12.5,12.5,15,15,17.5,17.5,20,10],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","15","12","12","12","12","12","12","12","10"],backoff:Array(12).fill(null),note:"12 reps per side — complete all reps one side before switching."},
        {id:"lat_pulldown",name:"Lat Pulldown",weights:[100,105,110,110,120,125,130,135,140,145,150,100],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","12","8","8","6","6","8","8","8","10"],backoff:Array(12).fill(null),note:"Full arm extension at the top on every rep — ROM first, weight second."}
      ]}
    ]
  },
  legs:{
    label:"Legs",day:"THU",accent:"#30D158",
    notes:["Trap bar: neutral back, drive through heels. Calibration week.","RDL: 3s eccentric. Feel the hamstring stretch.","Leg press depth: parallel or below every rep.","Volume peak. Slight back-off on hinges.","Strength block. Weight jumps. Brace hard.","Control on both hinge movements. No bouncing RDL.","Leg press going heavy. Full range every rep.","Final heavy week. Back stays neutral on trap bar.","Low volume, high intensity. Top sets matter.","Top sets + back-off. Legs should feel it.","Near-max trap bar. Strong brace, strong pull.","Deload. Full ROM, no strain, flush the legs."],
    groups:[
      {label:"Straight Sets",rest:"Rest 2 min",supersetted:false,exercises:[
        {id:"trap_bar",name:"Trap Bar Deadlift",weights:[185,195,205,215,235,245,255,265,275,285,295,185],sets:[4,4,4,4,5,5,5,5,4,3,3,3],reps:["10","10","10","10","5","5","5","5","4","3","2-3","8"],backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"6",w:225},{sets:3,reps:"5",w:230},null]},
        {id:"leg_press",name:"Leg Press (total load)",weights:[300,340,370,360,410,440,470,500,530,560,590,300],sets:[4,4,4,4,5,5,5,5,4,3,3,3],reps:["10","10","10","10","6","5","5","5","4","3","2-3","8"],backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"5",w:460},{sets:3,reps:"5",w:490},null],note:"Total load including carriage. Subtract carriage, divide by 2 = plates per side."}
      ]},
      {label:"Superset 1",rest:"Rest 90s",supersetted:true,exercises:[
        {id:"rdl",name:"Romanian Deadlift",weights:[110,120,130,135,150,160,170,180,185,195,205,110],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","12","8","8","6","6","5","5","5","8"],backoff:Array(12).fill(null),note:"Use a loadable bar to progress freely."},
        {id:"calf",name:"Standing Calf Raise",weights:[90,105,115,105,125,135,145,155,150,160,170,90],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["15","15","15","20","12","12","12","12","15","15","15","12"],backoff:Array(12).fill(null),note:"Stand on a plate with heels hanging off. Full ROM every rep."}
      ]},
      {label:"Superset 2",rest:"Rest 60s",supersetted:true,exercises:[
        {id:"leg_ext",name:"Leg Extension",weights:[110,115,120,125,130,135,140,145,145,150,155,110],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","12","10","10","10","10","12","12","12","10"],backoff:Array(12).fill(null),note:"Both legs simultaneously. Full ROM matters more than load."},
        {id:"leg_curl",name:"Lying Leg Curl",weights:[70,75,80,85,90,95,100,105,110,115,120,70],sets:[3,3,3,3,4,4,4,4,3,3,3,3],reps:["12","12","12","12","10","10","10","10","12","12","12","10"],backoff:Array(12).fill(null),note:"Both legs simultaneously. Legs are heavily fatigued — keep ROM full."}
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
    {id:"kickback",label:"Cable Kickback",hint:"3 × 12",step:2.5,min:2.5,default:12.5,unit:"lbs"},
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

// ── SHARED STYLE HELPERS ───────────────────────────────────────────────
const card=(extra={})=>({background:DS.surface,borderRadius:DS.radius,padding:"16px",...extra});
const label=(size=13,color=DS.label,weight=400,extra={})=>({fontSize:`${size}px`,color,fontWeight:weight,lineHeight:1.4,...extra});
const mono=(size=12,color=DS.labelSec,extra={})=>({fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:`${size}px`,color,lineHeight:1.4,...extra});

// ── BENCH INPUT ────────────────────────────────────────────────────────
function BenchInput({label:lbl,hint,value,onChange,step,min=0,unit="lbs",accent}){
  const[editing,setEditing]=useState(false);
  const[raw,setRaw]=useState(String(value));
  const commit=()=>{const v=parseFloat(raw);if(!isNaN(v)&&v>=min)onChange(Math.round(v/step)*step);else setRaw(String(value));setEditing(false);};
  return(
    <div style={{background:DS.surface,borderRadius:DS.radius,padding:"14px",marginBottom:"8px"}}>
      <div style={{fontSize:"15px",fontWeight:600,color:DS.label,marginBottom:"2px"}}>{lbl}</div>
      <div style={{...mono(12,DS.labelTert),marginBottom:"12px"}}>{hint}</div>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <button onClick={()=>onChange(Math.max(min,Math.round((value-step)/step)*step))} style={{background:DS.surfaceAlt,border:"none",color:DS.labelSec,width:"36px",height:"36px",borderRadius:"50%",cursor:"pointer",fontSize:"20px",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
        {editing?(
          <input autoFocus type="number" inputMode="decimal" value={raw} onChange={e=>setRaw(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();}} style={{flex:1,background:DS.surfaceAlt,border:`1.5px solid ${accent}`,borderRadius:DS.radiusSm,color:accent,fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"22px",textAlign:"center",padding:"8px"}}/>
        ):(
          <div onClick={()=>{setRaw(String(value));setEditing(true);}} style={{flex:1,textAlign:"center",cursor:"pointer",padding:"6px"}}>
            <span style={{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"26px",fontWeight:600,color:DS.label}}>{value}</span>
            <span style={{...mono(13,DS.labelTert),marginLeft:"6px"}}>{unit}</span>
          </div>
        )}
        <button onClick={()=>onChange(Math.round((value+step)/step)*step)} style={{background:DS.surfaceAlt,border:"none",color:DS.labelSec,width:"36px",height:"36px",borderRadius:"50%",cursor:"pointer",fontSize:"20px",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
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
    else{if(!name.trim()){setError("Please enter your name.");setLoading(false);return;}const{error:e}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});if(e)setError(e.message);else setError("Check your email to confirm your account, then sign in.");}
    setLoading(false);
  };
  const inp={width:"100%",background:DS.surface,border:`1px solid ${DS.border}`,borderRadius:DS.radiusSm,color:DS.label,fontSize:"16px",padding:"14px 16px",marginBottom:"12px",WebkitAppearance:"none"};
  return(
    <div style={{background:DS.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap'); html,body{background:#000;margin:0;padding:0;} *{box-sizing:border-box;} input:focus{outline:none !important;border-color:${DS.accent} !important;} button{transition:opacity 0.15s,transform 0.1s;} button:active{opacity:0.7;transform:scale(0.97);}`}</style>
      <div style={{width:"100%",maxWidth:"360px"}}>
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <div style={{...mono(11,DS.labelTert),letterSpacing:"3px",marginBottom:"12px",textTransform:"uppercase"}}>12-Week Strength Program</div>
          <div style={{fontSize:"34px",fontWeight:700,color:DS.label,letterSpacing:"-0.5px",marginBottom:"10px"}}>Workout Tracker</div>
          <div style={{fontSize:"15px",color:DS.labelSec,lineHeight:1.5}}>
            {mode==="signup"?"Your transformation starts here. Build your personalized plan in under 3 minutes.":"Welcome back. Let's get to work."}
          </div>
        </div>
        <div style={{display:"flex",background:DS.surface,borderRadius:DS.radius,padding:"3px",marginBottom:"24px"}}>
          {["signin","signup"].map(m=>(<button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"9px",background:mode===m?DS.surfaceAlt:"transparent",border:"none",color:mode===m?DS.label:DS.labelTert,fontSize:"15px",fontWeight:mode===m?600:400,borderRadius:DS.radiusSm,cursor:"pointer",transition:"all 0.2s"}}>
            {m==="signin"?"Sign In":"Get Started"}
          </button>))}
        </div>
        {mode==="signup"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your first name" style={inp}/>}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={{...inp,marginBottom:"16px"}}/>
        {error&&<div style={{fontSize:"14px",color:error.includes("Check")?DS.accentGreen:DS.accentRed,marginBottom:"16px",lineHeight:1.5}}>{error}</div>}
        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"15px",background:loading?DS.surface:DS.accent,border:"none",borderRadius:DS.radius,color:loading?DS.labelTert:"#000",fontSize:"16px",fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>
          {loading?"...":mode==="signin"?"Sign In":"Create Account"}
        </button>
      </div>
    </div>
  );
}

// ── ONBOARDING ─────────────────────────────────────────────────────────
const ONBOARDING_COPY=[
  {title:"When do you train?",sub:"Choose your 3 workout days. The app will automatically open to the right session each day."},
  {title:"What's in your gym?",sub:"Check everything available to you. The plan adapts with substitute exercises for any missing equipment."},
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
  const accent=DS.accent;
  const handleFinish=async()=>{
    setSaving(true);
    const weights=buildWeights(benchmarks,equipment);
    await supabase.from("user_progress").upsert({user_id:session.user.id,benchmarks,equipment,setup_complete:true,start_date:startDate,day1_dow:d1,day2_dow:d2,day3_dow:d3,current_week:1,current_day:'chest_tri',has_seen_orientation:false,last_completed_week:0,manual_week_lock:false,completed_sessions:[],updated_at:new Date().toISOString()});
    await saveGeneratedWeights(session.user.id,weights);
    setSaving(false);onComplete();
  };
  const dayBtn=(val,set,i)=>(
    <button key={i} onClick={()=>set(i)} style={{flex:1,padding:"9px 0",background:val===i?accent:DS.surface,border:`1px solid ${val===i?accent:DS.border}`,borderRadius:DS.radiusSm,color:val===i?"#000":DS.labelSec,fontSize:"13px",fontWeight:val===i?600:400,cursor:"pointer",transition:"all 0.15s"}}>{DAYS_SHORT[i]}</button>
  );
  const copy=ONBOARDING_COPY[step];
  return(
    <div style={{background:DS.bg,minHeight:"100vh",color:DS.label,maxWidth:"480px",margin:"0 auto",paddingBottom:"100px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap'); html,body{background:#000;margin:0;padding:0;} *{box-sizing:border-box;} input:focus{outline:none;} button:active{opacity:0.7;transform:scale(0.97);} input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.5);}`}</style>
      <div style={{padding:"24px 20px 20px",borderBottom:`1px solid ${DS.borderSub}`}}>
        <div style={{...mono(11,DS.labelTert),letterSpacing:"2px",marginBottom:"8px",textTransform:"uppercase"}}>Setup · {step+1} of {ONBOARDING_COPY.length}</div>
        <div style={{fontSize:"28px",fontWeight:700,color:DS.label,letterSpacing:"-0.3px",marginBottom:"6px"}}>{copy.title}</div>
        <div style={{fontSize:"14px",color:DS.labelSec,lineHeight:1.6,marginBottom:"16px"}}>{copy.sub}</div>
        <div style={{display:"flex",gap:"4px",borderRadius:"4px",overflow:"hidden"}}>
          {ONBOARDING_COPY.map((_,i)=><div key={i} style={{flex:1,height:"3px",background:i<=step?accent:DS.border,transition:"background 0.3s"}}/>)}
        </div>
      </div>
      <div style={{padding:"20px"}}>
        {step===0&&(<>
          {[{label:"Chest & Triceps",a:PLAN.chest_tri.accent,val:d1,set:setD1},{label:"Back & Shoulders",a:PLAN.back_shoulder_bi.accent,val:d2,set:setD2},{label:"Legs",a:PLAN.legs.accent,val:d3,set:setD3}].map(({label:lbl,a,val,set})=>(
            <div key={lbl} style={{marginBottom:"20px"}}>
              <div style={{fontSize:"13px",fontWeight:600,color:a,letterSpacing:"0.5px",marginBottom:"8px",textTransform:"uppercase"}}>{lbl}</div>
              <div style={{display:"flex",gap:"4px"}}>{DAYS_SHORT.map((_,i)=>dayBtn(val,set,i))}</div>
            </div>
          ))}
          <div style={{marginTop:"4px"}}>
            <div style={{fontSize:"13px",fontWeight:600,color:DS.labelSec,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Start Date</div>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",background:DS.surface,border:`1px solid ${DS.border}`,borderRadius:DS.radiusSm,color:DS.label,fontSize:"15px",padding:"13px 16px"}}/>
          </div>
        </>)}
        {step===1&&(<>
          <div style={{fontSize:"14px",color:DS.labelSec,marginBottom:"16px",lineHeight:1.6}}>Uncheck any equipment not at your gym. The plan provides substitute exercises automatically.</div>
          {EQUIPMENT_LIST.map(eq=>(
            <button key={eq.id} onClick={()=>setEquipment(p=>({...p,[eq.id]:!p[eq.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:"14px",padding:"15px 16px",marginBottom:"8px",background:equipment[eq.id]?`${accent}15`:DS.surface,border:`1px solid ${equipment[eq.id]?accent:DS.border}`,borderRadius:DS.radius,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
              <div style={{width:"22px",height:"22px",borderRadius:"6px",border:`2px solid ${equipment[eq.id]?accent:DS.border}`,background:equipment[eq.id]?accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                {equipment[eq.id]&&<span style={{fontSize:"13px",color:"#000",fontWeight:700}}>✓</span>}
              </div>
              <span style={{fontSize:"16px",fontWeight:500,color:equipment[eq.id]?DS.label:DS.labelSec}}>{eq.label}</span>
            </button>
          ))}
        </>)}
        {step>=2&&step<=4&&Object.values(BENCH_FIELDS)[step-2].map(f=>(
          <BenchInput key={f.id} label={f.label} hint={f.hint} value={benchmarks[f.id]} onChange={v=>setBenchmarks(p=>({...p,[f.id]:v}))} step={f.step} min={f.min} unit={f.unit} accent={accent}/>
        ))}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",padding:"16px 20px",background:"rgba(0,0,0,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${DS.borderSub}`,display:"flex",gap:"10px"}}>
        {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"14px",background:DS.surface,border:"none",borderRadius:DS.radius,color:DS.labelSec,fontSize:"16px",fontWeight:600,cursor:"pointer"}}>Back</button>}
        <button onClick={()=>step<ONBOARDING_COPY.length-1?setStep(s=>s+1):handleFinish()} disabled={saving} style={{flex:2,padding:"14px",background:saving?DS.surface:accent,border:"none",borderRadius:DS.radius,color:saving?DS.labelTert:"#000",fontSize:"16px",fontWeight:600,cursor:saving?"not-allowed":"pointer"}}>
          {saving?"Building your plan…":step<ONBOARDING_COPY.length-1?"Continue":"Generate My Plan"}
        </button>
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
  const[stab,setStab]=useState("schedule");
  const[saving,setSaving]=useState(false);
  const accent=DS.accent;
  const handleSave=async()=>{
    setSaving(true);
    const weights=buildWeights(benchmarks,equipment);
    await supabase.from("user_progress").upsert({user_id:session.user.id,benchmarks,equipment,start_date:startDate,day1_dow:d1,day2_dow:d2,day3_dow:d3,manual_week_lock:manualLock,updated_at:new Date().toISOString()});
    await saveGeneratedWeights(session.user.id,weights);
    setSaving(false);onSave();
  };
  const tabs=[{id:"schedule",label:"Schedule"},{id:"equipment",label:"Equipment"},{id:"chest",label:"Chest"},{id:"back",label:"Back"},{id:"legs",label:"Legs"}];
  const dayBtn=(val,set,i)=><button key={i} onClick={()=>set(i)} style={{flex:1,padding:"7px 0",background:val===i?accent:DS.surface,border:`1px solid ${val===i?accent:DS.border}`,borderRadius:DS.radiusSm,color:val===i?"#000":DS.labelSec,fontSize:"12px",fontWeight:val===i?600:400,cursor:"pointer"}}>{DAYS_SHORT[i]}</button>;
  return(
    <div style={{background:DS.bg,minHeight:"100vh",color:DS.label,maxWidth:"480px",margin:"0 auto",paddingBottom:"100px"}}>
      <style>{`html,body{background:#000;margin:0;padding:0;} *{box-sizing:border-box;} input:focus{outline:none;} button:active{opacity:0.7;transform:scale(0.97);}`}</style>
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${DS.borderSub}`,padding:"12px 20px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
          <button onClick={onBack} style={{background:DS.surface,border:"none",color:DS.labelSec,width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <span style={{fontSize:"17px",fontWeight:600,color:DS.label}}>Settings</span>
        </div>
        <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"2px"}}>
          {tabs.map(t=><button key={t.id} onClick={()=>setStab(t.id)} style={{padding:"7px 14px",background:stab===t.id?DS.surfaceAlt:DS.surface,border:`1px solid ${stab===t.id?DS.labelSec:DS.border}`,borderRadius:"20px",color:stab===t.id?DS.label:DS.labelTert,fontSize:"13px",fontWeight:stab===t.id?600:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>{t.label}</button>)}
        </div>
      </div>
      <div style={{padding:"20px"}}>
        {stab==="schedule"&&(<>
          {[{label:"Chest & Triceps",a:PLAN.chest_tri.accent,val:d1,set:setD1},{label:"Back & Shoulders",a:PLAN.back_shoulder_bi.accent,val:d2,set:setD2},{label:"Legs",a:PLAN.legs.accent,val:d3,set:setD3}].map(({label:lbl,a,val,set})=>(
            <div key={lbl} style={{marginBottom:"20px"}}>
              <div style={{fontSize:"13px",fontWeight:600,color:a,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{lbl}</div>
              <div style={{display:"flex",gap:"4px"}}>{DAYS_SHORT.map((_,i)=>dayBtn(val,set,i))}</div>
            </div>
          ))}
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"13px",fontWeight:600,color:DS.labelSec,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Start Date</div>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",background:DS.surface,border:`1px solid ${DS.border}`,borderRadius:DS.radiusSm,color:DS.label,fontSize:"15px",padding:"13px 16px"}}/>
          </div>
          <button onClick={()=>setManualLock(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",gap:"14px",padding:"15px 16px",background:manualLock?`${accent}15`:DS.surface,border:`1px solid ${manualLock?accent:DS.border}`,borderRadius:DS.radius,cursor:"pointer",textAlign:"left"}}>
            <div style={{width:"22px",height:"22px",borderRadius:"6px",border:`2px solid ${manualLock?accent:DS.border}`,background:manualLock?accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {manualLock&&<span style={{fontSize:"13px",color:"#000",fontWeight:700}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:"15px",fontWeight:500,color:manualLock?DS.label:DS.labelSec}}>Manual week control</div>
              <div style={{fontSize:"12px",color:DS.labelTert,marginTop:"2px"}}>Disables date-based auto-detection. Advance weeks manually.</div>
            </div>
          </button>
        </>)}
        {stab==="equipment"&&(<>
          <div style={{fontSize:"14px",color:DS.labelSec,marginBottom:"16px",lineHeight:1.6}}>Uncheck any equipment not at your gym. Save to regenerate the plan with substitutions.</div>
          {EQUIPMENT_LIST.map(eq=>(
            <button key={eq.id} onClick={()=>setEquipment(p=>({...p,[eq.id]:!p[eq.id]}))} style={{width:"100%",display:"flex",alignItems:"center",gap:"14px",padding:"15px 16px",marginBottom:"8px",background:equipment[eq.id]?`${accent}15`:DS.surface,border:`1px solid ${equipment[eq.id]?accent:DS.border}`,borderRadius:DS.radius,cursor:"pointer",textAlign:"left"}}>
              <div style={{width:"22px",height:"22px",borderRadius:"6px",border:`2px solid ${equipment[eq.id]?accent:DS.border}`,background:equipment[eq.id]?accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {equipment[eq.id]&&<span style={{fontSize:"13px",color:"#000",fontWeight:700}}>✓</span>}
              </div>
              <span style={{fontSize:"16px",fontWeight:500,color:equipment[eq.id]?DS.label:DS.labelSec}}>{eq.label}</span>
            </button>
          ))}
        </>)}
        {["chest","back","legs"].map((t,ti)=>stab===t&&(<div key={t}>
          <div style={{fontSize:"14px",color:DS.labelSec,marginBottom:"16px",lineHeight:1.6}}>Update your benchmarks. Save to regenerate all 12 weeks from these new baselines.</div>
          {Object.values(BENCH_FIELDS)[ti].map(f=>(<BenchInput key={f.id} label={f.label} hint={f.hint} value={benchmarks[f.id]} onChange={v=>setBenchmarks(p=>({...p,[f.id]:v}))} step={f.step} min={f.min} unit={f.unit} accent={accent}/>))}
        </div>))}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",padding:"16px 20px",background:"rgba(0,0,0,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${DS.borderSub}`}}>
        <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:"14px",background:saving?DS.surface:accent,border:"none",borderRadius:DS.radius,color:saving?DS.labelTert:"#000",fontSize:"16px",fontWeight:600,cursor:saving?"not-allowed":"pointer"}}>{saving?"Saving…":"Save Changes"}</button>
      </div>
    </div>
  );
}

// ── REST TIMER ─────────────────────────────────────────────────────────
function RestTimer({timer,accent,onSkip}){
  if(!timer) return null;
  const{seconds,total,label,done:td}=timer;
  const r=30,circ=2*Math.PI*r,offset=circ*(seconds/total);
  return(
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",zIndex:100,background:"rgba(28,28,30,0.95)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",borderTop:`1px solid ${DS.border}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:"18px",boxShadow:"0 -8px 40px rgba(0,0,0,0.6)"}}>
      <div style={{position:"relative",width:"72px",height:"72px",flexShrink:0}}>
        <svg width="72" height="72" style={{transform:"rotate(-90deg)"}}>
          <circle cx="36" cy="36" r={r} fill="none" stroke={DS.surfaceAlt} strokeWidth="4"/>
          <circle cx="36" cy="36" r={r} fill="none" stroke={td?DS.accentGreen:accent} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ-offset} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
        </svg>
        <div style={{position:"absolute",top:0,left:0,width:"72px",height:"72px",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:td?"13px":"22px",fontWeight:600,color:td?DS.accentGreen:DS.label}}>{td?"GO!":seconds}</div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:"16px",fontWeight:600,color:DS.label,marginBottom:"2px"}}>{td?"Rest complete":"Resting"}</div>
        <div style={{fontSize:"13px",color:DS.labelSec}}>{label}</div>
        {!td&&<div style={{...{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"11px",color:DS.labelTert},marginTop:"3px"}}>{total}s total · {total-seconds}s elapsed</div>}
      </div>
      <button onClick={onSkip} style={{background:DS.surfaceAlt,border:"none",color:DS.labelSec,borderRadius:DS.radiusSm,padding:"9px 16px",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>{td?"Close":"Skip"}</button>
    </div>
  );
}

// ── COMPLETION OVERLAY ─────────────────────────────────────────────────
function CompletionOverlay({day,week,message,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px"}}>
      <div style={{width:"100%",maxWidth:"380px",textAlign:"center"}}>
        <div style={{width:"80px",height:"80px",borderRadius:"50%",background:`${day.accent}20`,border:`2px solid ${day.accent}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:"36px"}}>✓</div>
        <div style={{fontSize:"32px",fontWeight:700,color:DS.label,letterSpacing:"-0.5px",marginBottom:"6px"}}>Workout Complete</div>
        <div style={{fontSize:"13px",color:day.accent,letterSpacing:"1px",marginBottom:"24px",textTransform:"uppercase"}}>Week {week} · {day.label} · {PHASES[week-1]}</div>
        <div style={{fontSize:"15px",color:DS.labelSec,lineHeight:1.7,marginBottom:"36px"}}>{message}</div>
        <button onClick={onClose} style={{width:"100%",padding:"16px",background:day.accent,border:"none",borderRadius:DS.radius,color:"#000",fontSize:"17px",fontWeight:600,cursor:"pointer"}}>Keep Going</button>
      </div>
    </div>
  );
}

// ── ORIENTATION CARD ───────────────────────────────────────────────────
function OrientationCard({accent,onDismiss}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.96)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",zIndex:150,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",overflowY:"auto"}}>
      <div style={{width:"100%",maxWidth:"400px"}}>
        <div style={{fontSize:"12px",color:accent,letterSpacing:"2px",marginBottom:"10px",textTransform:"uppercase"}}>Before You Start</div>
        <div style={{fontSize:"28px",fontWeight:700,color:DS.label,letterSpacing:"-0.3px",marginBottom:"24px"}}>How This Works</div>
        {[
          {title:"Supersets",icon:"⚡",body:"Two exercises are grouped together. Alternate between them — do a set of the first, then immediately a set of the second. Rest after completing both. More efficient than resting between every single set."},
          {title:"2 Reps in Reserve",icon:"🎯",body:"Stop when you have 2 reps left before failure. If your max is 12 reps, stop at 10. This protects your form and recovery so you can perform on all sets."},
          {title:"Rest Timer",icon:"⏱",body:"After completing each exercise's last set, the rest timer fires automatically. You can also start it manually with the timer button on any group."},
        ].map(({title,icon,body})=>(
          <div key={title} style={{background:DS.surface,borderRadius:DS.radius,padding:"16px",marginBottom:"10px",display:"flex",gap:"14px",alignItems:"flex-start"}}>
            <div style={{fontSize:"24px",flexShrink:0,marginTop:"2px"}}>{icon}</div>
            <div>
              <div style={{fontSize:"16px",fontWeight:600,color:DS.label,marginBottom:"5px"}}>{title}</div>
              <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.6}}>{body}</div>
            </div>
          </div>
        ))}
        <button onClick={onDismiss} style={{width:"100%",padding:"16px",background:accent,border:"none",borderRadius:DS.radius,color:"#000",fontSize:"17px",fontWeight:600,cursor:"pointer",marginTop:"10px"}}>Let's Go</button>
      </div>
    </div>
  );
}

// ── GAP RESUME PROMPT ──────────────────────────────────────────────────
function GapResumePrompt({calculatedWeek,lastCompletedWeek,onResume,onAdjust}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.96)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",zIndex:150,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{width:"100%",maxWidth:"380px",textAlign:"center"}}>
        <div style={{fontSize:"48px",marginBottom:"16px"}}>👋</div>
        <div style={{fontSize:"28px",fontWeight:700,color:DS.label,letterSpacing:"-0.3px",marginBottom:"10px"}}>Welcome Back</div>
        <div style={{fontSize:"15px",color:DS.labelSec,lineHeight:1.7,marginBottom:"28px"}}>
          Your schedule puts you at Week {calculatedWeek}, but you last completed Week {lastCompletedWeek}. Where would you like to pick up?
        </div>
        <button onClick={()=>onResume(lastCompletedWeek+1)} style={{width:"100%",padding:"15px",background:DS.accent,border:"none",borderRadius:DS.radius,color:"#000",fontSize:"16px",fontWeight:600,cursor:"pointer",marginBottom:"10px"}}>
          Continue from Week {lastCompletedWeek+1}
        </button>
        <button onClick={()=>onResume(calculatedWeek)} style={{width:"100%",padding:"15px",background:DS.surface,border:`1px solid ${DS.border}`,borderRadius:DS.radius,color:DS.labelSec,fontSize:"16px",fontWeight:600,cursor:"pointer",marginBottom:"16px"}}>
          Jump to Week {calculatedWeek}
        </button>
        <button onClick={onAdjust} style={{background:"none",border:"none",color:DS.labelTert,fontSize:"13px",cursor:"pointer"}}>Adjust start date in settings</button>
      </div>
    </div>
  );
}

// ── PROGRESS SCREEN ────────────────────────────────────────────────────
function ProgressScreen({session,adj,onBack}){
  const[selectedEx,setSelectedEx]=useState("bench");
  const allExercises=[
    {id:"bench",name:"Bench Press",day:"chest_tri"},{id:"incline",name:"Incline DB Press",day:"chest_tri"},
    {id:"pushdown",name:"Tricep Pushdown",day:"chest_tri"},{id:"row",name:"Barbell Row",day:"back_shoulder_bi"},
    {id:"pullup",name:"Pull-ups",day:"back_shoulder_bi"},{id:"db_shoulder",name:"Shoulder Press",day:"back_shoulder_bi"},
    {id:"lat_pulldown",name:"Lat Pulldown",day:"back_shoulder_bi"},{id:"trap_bar",name:"Trap Bar Deadlift",day:"legs"},
    {id:"leg_press",name:"Leg Press",day:"legs"},{id:"rdl",name:"Romanian Deadlift",day:"legs"},
    {id:"leg_ext",name:"Leg Extension",day:"legs"},{id:"leg_curl",name:"Leg Curl",day:"legs"},
  ];
  const ex=allExercises.find(e=>e.id===selectedEx);
  const day=PLAN[ex?.day];
  const planEx=day?.groups.flatMap(g=>g.exercises).find(e=>e.id===selectedEx);
  const dataPoints=Array(12).fill(null).map((_,i)=>{const k=`${ex.day}_w${i+1}_${selectedEx}`;return adj[k]??planEx?.weights[i]??0;});
  const w1=dataPoints[0];const maxW=Math.max(...dataPoints);const minW=Math.min(...dataPoints.filter(v=>v>0));
  const chartH=90;const range=maxW-minW||1;const accent=day?.accent||DS.accent;
  const totalGain=Math.max(0,dataPoints[11]-w1);
  const dayGroups={chest_tri:allExercises.filter(e=>e.day==="chest_tri"),back_shoulder_bi:allExercises.filter(e=>e.day==="back_shoulder_bi"),legs:allExercises.filter(e=>e.day==="legs")};
  return(
    <div style={{background:DS.bg,minHeight:"100vh",color:DS.label,maxWidth:"480px",margin:"0 auto",paddingBottom:"40px"}}>
      <style>{`html,body{background:#000;margin:0;padding:0;} *{box-sizing:border-box;} button:active{opacity:0.7;}`}</style>
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${DS.borderSub}`,padding:"12px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <button onClick={onBack} style={{background:DS.surface,border:"none",color:DS.labelSec,width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <span style={{fontSize:"17px",fontWeight:600,color:DS.label}}>Progress</span>
        </div>
      </div>
      <div style={{padding:"20px"}}>
        {Object.entries(dayGroups).map(([dayKey,exs])=>(
          <div key={dayKey} style={{marginBottom:"16px"}}>
            <div style={{fontSize:"11px",fontWeight:600,color:PLAN[dayKey].accent,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>{PLAN[dayKey].label}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {exs.map(e=>(
                <button key={e.id} onClick={()=>setSelectedEx(e.id)} style={{padding:"7px 12px",background:selectedEx===e.id?PLAN[e.day].accent:DS.surface,border:`1px solid ${selectedEx===e.id?PLAN[e.day].accent:DS.border}`,borderRadius:"20px",color:selectedEx===e.id?"#000":DS.labelSec,fontSize:"13px",fontWeight:selectedEx===e.id?600:400,cursor:"pointer",transition:"all 0.15s"}}>
                  {e.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:DS.surface,borderRadius:DS.radius,padding:"20px",marginBottom:"12px"}}>
          <div style={{fontSize:"19px",fontWeight:700,color:DS.label,marginBottom:"2px"}}>{ex?.name}</div>
          <div style={{fontSize:"13px",color:DS.labelTert,marginBottom:"20px"}}>{day?.label}</div>
          <div style={{display:"flex",gap:"16px",marginBottom:"20px",alignItems:"center"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"22px",fontWeight:700,color:accent}}>{w1}<span style={{fontSize:"11px",color:DS.labelTert,marginLeft:"3px"}}>lbs</span></div>
              <div style={{fontSize:"11px",color:DS.labelTert,marginTop:"2px"}}>WEEK 1</div>
            </div>
            <div style={{color:DS.border,fontSize:"18px"}}>→</div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"22px",fontWeight:700,color:accent}}>{dataPoints[11]}<span style={{fontSize:"11px",color:DS.labelTert,marginLeft:"3px"}}>lbs</span></div>
              <div style={{fontSize:"11px",color:DS.labelTert,marginTop:"2px"}}>WEEK 12</div>
            </div>
            <div style={{flex:1}}/>
            {totalGain>0&&<div style={{textAlign:"center",background:`${DS.accentGreen}15`,borderRadius:DS.radiusSm,padding:"8px 12px"}}>
              <div style={{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"20px",fontWeight:700,color:DS.accentGreen}}>+{totalGain}</div>
              <div style={{fontSize:"10px",color:DS.accentGreen,opacity:.7,marginTop:"1px"}}>TOTAL GAIN</div>
            </div>}
          </div>
          <div style={{position:"relative",height:`${chartH}px`,display:"flex",alignItems:"flex-end",gap:"3px"}}>
            {dataPoints.map((v,i)=>{
              const h=range===0?chartH:Math.max(4,Math.round(((v-minW)/range)*chartH));
              const isAdj=adj[`${ex?.day}_w${i+1}_${selectedEx}`]!==undefined;
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                  <div style={{width:"100%",background:isAdj?accent:`${accent}40`,borderRadius:"3px 3px 0 0",height:`${h}px`,transition:"height 0.3s"}}/>
                  <div style={{fontSize:"8px",color:DS.labelTert}}>{i+1}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:"16px",marginTop:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"8px",height:"8px",borderRadius:"2px",background:accent}}/><span style={{fontSize:"11px",color:DS.labelTert}}>adjusted</span></div>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"8px",height:"8px",borderRadius:"2px",background:`${accent}40`}}/><span style={{fontSize:"11px",color:DS.labelTert}}>planned</span></div>
          </div>
        </div>
        <div style={{background:DS.surface,borderRadius:DS.radius,padding:"16px"}}>
          <div style={{fontSize:"13px",fontWeight:600,color:DS.labelSec,letterSpacing:"0.5px",marginBottom:"12px",textTransform:"uppercase"}}>Week by Week</div>
          {dataPoints.map((v,i)=>{
            const wk=i+1;const prev=i>0?dataPoints[i-1]:null;const diff=prev!==null?v-prev:null;
            const isAdj=adj[`${ex?.day}_w${wk}_${selectedEx}`]!==undefined;
            return(
              <div key={wk} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${DS.borderSub}`}}>
                <div>
                  <span style={{fontSize:"14px",fontWeight:500,color:DS.labelSec}}>W{wk}</span>
                  <span style={{fontSize:"11px",color:DS.labelTert,marginLeft:"6px"}}>{PHASES[i].slice(0,4)}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  {diff!==null&&diff!==0&&<span style={{fontSize:"12px",color:diff>0?DS.accentGreen:DS.accentRed}}>{diff>0?"+":""}{diff}</span>}
                  <span style={{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"15px",fontWeight:600,color:isAdj?accent:DS.label}}>{v}<span style={{fontSize:"10px",color:DS.labelTert,marginLeft:"2px"}}>lbs</span></span>
                </div>
              </div>
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
  const[timer,setTimer]=useState(null);
  const[showComplete,setShowComplete]=useState(false);
  const[completionMsg,setCompletionMsg]=useState("");
  const[completedSessions,setCompletedSessions]=useState([]);
  const[showOrientation,setShowOrientation]=useState(false);
  const[showGapPrompt,setShowGapPrompt]=useState(false);
  const[gapCalcWeek,setGapCalcWeek]=useState(1);
  const[gapLastWeek,setGapLastWeek]=useState(0);
  const timerRef=useRef(null);

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

  useEffect(()=>{
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}
    if(timer&&!timer.done){
      timerRef.current=setInterval(()=>{setTimer(prev=>{if(!prev||prev.done)return prev;if(prev.seconds<=1){clearInterval(timerRef.current);playBeep();return{...prev,seconds:0,done:true};}return{...prev,seconds:prev.seconds-1};});},1000);
    }
    return()=>{if(timerRef.current)clearInterval(timerRef.current);};
  },[timer?.done,timer?.total]);

  const startTimer=(restStr,label)=>{if(timerRef.current)clearInterval(timerRef.current);setTimer({seconds:parseRest(restStr),total:parseRest(restStr),label,done:false});};
  const skipTimer=()=>{if(timerRef.current)clearInterval(timerRef.current);setTimer(null);};
  const dismissOrientation=async()=>{setShowOrientation(false);if(session)await supabase.from("user_progress").upsert({user_id:session.user.id,has_seen_orientation:true,updated_at:new Date().toISOString()});};
  const handleGapResume=async(w)=>{setShowGapPrompt(false);setWeek(w);if(session)await supabase.from("user_progress").upsert({user_id:session.user.id,current_week:w,updated_at:new Date().toISOString()});};

  const getW=(exId,wi)=>{const k=`${tab}_w${week}_${exId}`;if(adj[k]!==undefined)return adj[k];const ex=PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===exId);return ex?ex.weights[wi]:0;};
  const getPrevW=(exId,wi)=>{if(wi===0)return null;const k=`${tab}_w${week-1}_${exId}`;if(adj[k]!==undefined)return adj[k];const ex=PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===exId);return ex?ex.weights[wi-1]:0;};
  const getW1=(exId)=>{const k=`${tab}_w1_${exId}`;if(adj[k]!==undefined)return adj[k];const ex=PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===exId);return ex?ex.weights[0]:0;};

  const saveWeight=(day,wk,exId,val)=>{if(!session)return;supabase.from("weight_adjustments").upsert({user_id:session.user.id,day,week:wk,exercise_id:exId,weight:val,updated_at:new Date().toISOString()},{onConflict:"user_id,day,week,exercise_id"});};
  const adjustW=(exId,wi,delta)=>{const next=Math.max(0,r25(getW(exId,wi)+delta));const k=`${tab}_w${week}_${exId}`;setAdj(p=>({...p,[k]:next}));if(PR_EXERCISES.includes(exId)&&next>(prs[exId]||0))setPRs(p=>({...p,[exId]:next}));saveWeight(tab,week,exId,next);};
  const commitWeightEdit=(exId)=>{const v=parseFloat(editVal);if(!isNaN(v)&&v>=0){const next=r25(v);const k=`${tab}_w${week}_${exId}`;setAdj(p=>({...p,[k]:next}));if(PR_EXERCISES.includes(exId)&&next>(prs[exId]||0))setPRs(p=>({...p,[exId]:next}));saveWeight(tab,week,exId,next);}setEditingW(null);};
  const saveSetToDb=async(day,wk,setKey,completed)=>{if(!session)return;await supabase.from("completed_sets").upsert({user_id:session.user.id,day,week:wk,set_key:setKey,completed,updated_at:new Date().toISOString()},{onConflict:"user_id,day,week,set_key"});};
  const getCompletedCount=(exId,totalSets,isBO=false)=>{const pre=isBO?`${tab}_w${week}_${exId}_bo`:`${tab}_w${week}_${exId}_s`;let c=0;for(let i=0;i<totalSets;i++){if(done[`${pre}${i}`])c++;}return c;};
  const completeNextSet=(exId,totalSets,groupRest,groupLabel,isBO=false)=>{
    const pre=isBO?`${tab}_w${week}_${exId}_bo`:`${tab}_w${week}_${exId}_s`;const dbPre=isBO?`${exId}_bo`:`${exId}_s`;
    let ni=0;while(ni<totalSets&&done[`${pre}${ni}`])ni++;if(ni>=totalSets)return;
    setDone(p=>{const n={...p,[`${pre}${ni}`]:true};saveToLocal(session?.user?.id,n);return n;});
    startTimer(groupRest,`${groupLabel} · Set ${ni+1} done`);
    saveSetToDb(tab,week,`${dbPre}${ni}`,true);
  };
  const undoLastSet=(exId,totalSets,isBO=false)=>{
    const pre=isBO?`${tab}_w${week}_${exId}_bo`:`${tab}_w${week}_${exId}_s`;const dbPre=isBO?`${exId}_bo`:`${exId}_s`;
    let li=-1;for(let i=0;i<totalSets;i++){if(done[`${pre}${i}`])li=i;}if(li===-1)return;
    setDone(p=>{const n={...p,[`${pre}${li}`]:false};saveToLocal(session?.user?.id,n);return n;});
    saveSetToDb(tab,week,`${dbPre}${li}`,false);
  };
  const setRating=(exId,r)=>{setRatings(p=>({...p,[`${tab}_w${week}_${exId}`]:r}));if(session)supabase.from("exercise_ratings").upsert({user_id:session.user.id,day:tab,week,exercise_id:exId,rating:r},{onConflict:"user_id,day,week,exercise_id"});};

  const changeWeek=(w)=>{const c=Math.max(1,Math.min(12,w));setWeek(c);setAiRes(null);setFeedback("");setW1Feedback("");setW1AiRes(null);setMobOpen(true);skipTimer();setEditingW(null);if(session)supabase.from("user_progress").upsert({user_id:session.user.id,current_week:c,updated_at:new Date().toISOString()});};
  const changeTab=(t)=>{setTab(t);setAiRes(null);setFeedback("");setW1Feedback("");setW1AiRes(null);setMobOpen(true);skipTimer();setEditingW(null);if(session)supabase.from("user_progress").upsert({user_id:session.user.id,current_day:t,updated_at:new Date().toISOString()});};

  const applyAi=async(aiAdj)=>{const n={...adj};const rows=[];for(const[id,w] of Object.entries(aiAdj)){n[`${tab}_w${week}_${id}`]=w;rows.push({user_id:session?.user.id,day:tab,week,exercise_id:id,weight:w,updated_at:new Date().toISOString()});}setAdj(n);setAiRes(null);setFeedback("");if(session&&rows.length)await supabase.from("weight_adjustments").upsert(rows,{onConflict:"user_id,day,week,exercise_id"});};

  const applyW1Recal=async(adjustments)=>{
    const n={...adj};const rows=[];const changes=[];
    for(const[id,newW1] of Object.entries(adjustments)){
      const oldW1=getW(id,0);const diff=newW1-oldW1;
      const fe=PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===id);
      if(diff!==0) changes.push(`${fe?.name||id} ${diff>0?`+${diff}lbs`:`${diff}lbs`} to ${newW1}lbs`);
      for(let wk=1;wk<=12;wk++){const baseW=adj[`${tab}_w${wk}_${id}`]??fe?.weights[wk-1]??newW1;const nw=Math.max(0,r25(baseW+diff));n[`${tab}_w${wk}_${id}`]=nw;rows.push({user_id:session?.user.id,day:tab,week:wk,exercise_id:id,weight:nw,updated_at:new Date().toISOString()});}
    }
    setAdj(n);setW1AiRes({...w1AiRes,applied:true,summary:changes.join(". ")});setW1Feedback("");
    if(session&&rows.length){for(let i=0;i<rows.length;i+=50)await supabase.from("weight_adjustments").upsert(rows.slice(i,i+50),{onConflict:"user_id,day,week,exercise_id"});}
  };

  const processRatings=async()=>{
    const dayRatings=Object.entries(ratings).filter(([k])=>k.startsWith(`${tab}_w${week}_`));
    if(dayRatings.length===0) return;
    setProcessingRatings(true);
    const day=PLAN[tab];const wi=week-1;
    const ratingLines=dayRatings.map(([k,r])=>{const exId=k.split('_').slice(3).join('_');const fe=day.groups.flatMap(g=>g.exercises).find(e=>e.id===exId);return `${fe?.name||exId}: ${getW(exId,wi)}lbs — ${r}`;}).join("\n");
    const ids=day.groups.flatMap(g=>g.exercises.map(e=>e.id)).join(",");
    const prompt=`Strength coach. Week ${week}/12, ${PHASES[wi]} phase. User rated exercises post-workout.\n\nRatings:\n${ratingLines}\n\nReturn ONLY valid JSON:\n{"analysis":"one sentence","adjustments":{/* id: new_weight for next week. Too easy=+2.5-5lbs, Too hard=-2.5-5lbs, Just right=no change. IDs: ${ids} */}}\n\nRound to 2.5lbs. Conservative.`;
    try{
      const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const text=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      if(parsed.adjustments&&Object.keys(parsed.adjustments).length>0){
        const n={...adj};const rows=[];
        for(const[id,nw] of Object.entries(parsed.adjustments)){const nextWk=week+1;if(nextWk<=12){n[`${tab}_w${nextWk}_${id}`]=nw;rows.push({user_id:session?.user.id,day:tab,week:nextWk,exercise_id:id,weight:nw,updated_at:new Date().toISOString()});}}
        setAdj(n);if(session&&rows.length)await supabase.from("weight_adjustments").upsert(rows,{onConflict:"user_id,day,week,exercise_id"});
      }
    }catch(e){console.error("Rating processing failed:",e);}
    setProcessingRatings(false);
  };

  const NEXT_TAB={chest_tri:'back_shoulder_bi',back_shoulder_bi:'legs',legs:'chest_tri'};
  const handleFinishWorkout=async()=>{
    setCompletionMsg(COMPLETE_MSGS[(week+Object.keys(done).filter(k=>done[k]).length)%COMPLETE_MSGS.length]);
    const sessionKey=`${tab}_w${week}`;
    const updated=[...new Set([...completedSessions,sessionKey])];
    setCompletedSessions(updated);
    const allDone=['chest_tri','back_shoulder_bi','legs'].every(t=>updated.includes(`${t}_w${week}`));
    const newLast=allDone?week:(userProgress?.last_completed_week||0);
    if(session) await supabase.from("user_progress").upsert({user_id:session.user.id,completed_sessions:updated,last_completed_week:newLast,updated_at:new Date().toISOString()});
    await processRatings();
    setShowComplete(true);
  };
  const handleKeepGoing=()=>{
    setShowComplete(false);
    const nextT=NEXT_TAB[tab];const nextW=nextT==='chest_tri'?Math.min(12,week+1):week;
    changeTab(nextT);if(nextW!==week)changeWeek(nextW);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleFeedback=async()=>{
    if(!feedback.trim()||loading) return;
    setLoading(true);setAiRes(null);
    const day=PLAN[tab];const wi=week-1;
    const summary=day.groups.flatMap(g=>g.exercises.map(ex=>{const w=getW(ex.id,wi);return `${ex.name}: ${ex.sets[wi]}x${ex.reps[wi]} @ ${ex.isPullup?(w===0?"bodyweight":`+${w}lbs`):`${w}lbs`}`;})).join("\n");
    const ids=day.groups.flatMap(g=>g.exercises.map(e=>e.id)).join(",");
    const prompt=`Strength coach. Week ${week}/12, ${PHASES[wi]} phase.\n\nWorkout:\n${summary}\n\nFeedback: "${feedback}"\n\nReturn ONLY valid JSON:\n{"analysis":"one sentence","adjustments":{/* id: weight. Only what needs changing. IDs: ${ids} */}}\n\nRound to 2.5lbs. Conservative.`;
    try{
      const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const text=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      setAiRes(parsed);
      if(session) await supabase.from("session_feedback").insert({user_id:session.user.id,day:tab,week,feedback,ai_response:parsed});
    }catch{setAiRes({analysis:"Could not process. Try again.",adjustments:{}});}
    setLoading(false);
  };

  const handleW1Feedback=async()=>{
    if(!w1Feedback.trim()||w1Loading) return;
    setW1Loading(true);setW1AiRes(null);
    const day=PLAN[tab];
    const summary=day.groups.flatMap(g=>g.exercises.map(ex=>{const w=getW(ex.id,0);return `${ex.name}: ${ex.sets[0]}x${ex.reps[0]} @ ${ex.isPullup?(w===0?"bodyweight":`+${w}lbs`):`${w}lbs`}`;})).join("\n");
    const ids=day.groups.flatMap(g=>g.exercises.map(e=>e.id)).join(",");
    const prompt=`Strength coach. End of Week 1, calibration complete. Athlete needs weeks 2-12 recalibrated.\n\nWeek 1 workout:\n${summary}\n\nFeedback: "${w1Feedback}"\n\nReturn ONLY valid JSON:\n{"analysis":"one sentence","adjustments":{/* id: corrected_week1_baseline. Only exercises needing adjustment. IDs: ${ids} */}}\n\nRound to 2.5lbs. Conservative.`;
    try{
      const res=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();const text=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      setW1AiRes(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch{setW1AiRes({analysis:"Could not process. Try again.",adjustments:{}});}
    setW1Loading(false);
  };

  if(!authReady) return <div style={{background:DS.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:DS.labelTert,fontSize:"14px"}}>Loading…</div>;
  if(!session) return <AuthScreen/>;
  if(userProgress===undefined) return <div style={{background:DS.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:DS.labelTert,fontSize:"14px"}}>Loading your plan…</div>;
  if(userProgress===null||!userProgress.setup_complete) return <OnboardingScreen session={session} onComplete={()=>loadProgress()}/>;
  if(screen==="settings") return <SettingsScreen session={session} userProgress={userProgress} onBack={()=>setScreen("workout")} onSave={()=>{loadProgress();setScreen("workout");}}/>;
  if(screen==="progress") return <ProgressScreen session={session} adj={adj} onBack={()=>setScreen("workout")}/>;

  const day=PLAN[tab];const wi=week-1;const phase=PHASES[wi];const pc=PHASE_COLORS[phase];
  const mobility=MOBILITY[tab];
  const motivMessages=MOTIVATIONAL[phase]||MOTIVATIONAL.Hypertrophy;
  const motiv=motivMessages[week%motivMessages.length];
  const allKeys=day.groups.flatMap(g=>g.exercises.flatMap(ex=>Array(ex.sets[wi]).fill(null).map((_,si)=>`${tab}_w${week}_${ex.id}_s${si}`)));
  const pct=allKeys.length>0?Math.round(allKeys.filter(k=>done[k]).length/allKeys.length*100):0;
  const RATING_OPTS=[{v:"too_easy",label:"Too Easy",color:DS.accentGreen},{v:"just_right",label:"Just Right",color:DS.accent},{v:"too_hard",label:"Too Hard",color:DS.accentRed}];

  return(
    <div style={{background:DS.bg,minHeight:"100vh",color:DS.label,maxWidth:"480px",margin:"0 auto",paddingBottom:timer?"180px":"100px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        html,body{background:#000;margin:0;padding:0;min-height:100vh;}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;touch-action:pan-y;}
        textarea,input{caret-color:${day.accent};}
        textarea:focus,input:focus{outline:none!important;border-color:${day.accent}!important;}
        button{transition:opacity 0.12s,transform 0.1s;}
        button:active{opacity:0.7;transform:scale(0.97);}
        .fadeIn{animation:fadeIn 0.18s ease;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {showOrientation&&<OrientationCard accent={day.accent} onDismiss={dismissOrientation}/>}
      {showGapPrompt&&<GapResumePrompt calculatedWeek={gapCalcWeek} lastCompletedWeek={gapLastWeek} onResume={handleGapResume} onAdjust={()=>{setShowGapPrompt(false);setScreen("settings");}}/>}
      {showComplete&&<CompletionOverlay day={day} week={week} message={completionMsg} onClose={handleKeepGoing}/>}

      {/* ── HEADER ── */}
      <div style={{position:"sticky",top:0,zIndex:20,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:`1px solid ${DS.borderSub}`,padding:"10px 20px 10px"}}>
        {/* Top bar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"15px",fontWeight:600,color:DS.label}}>Workout Tracker</span>
            <span style={{fontSize:"12px",color:pc,background:`${pc}20`,padding:"2px 8px",borderRadius:"12px",fontWeight:500}}>{phase}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <button onClick={()=>setScreen("progress")} style={{background:DS.surface,border:"none",color:DS.labelSec,width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>📈</button>
            <button onClick={()=>setScreen("settings")} style={{background:DS.surface,border:"none",color:DS.labelSec,width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>⚙</button>
            <button onClick={()=>supabase.auth.signOut()} style={{background:DS.surface,border:"none",color:DS.labelTert,borderRadius:"16px",padding:"0 12px",height:"32px",fontSize:"13px",cursor:"pointer"}}>Log out</button>
          </div>
        </div>

        {/* Week progression row */}
        <div style={{display:"flex",gap:"3px",marginBottom:"12px"}}>
          {Array(12).fill(null).map((_,i)=>{
            const wk=i+1;const allDone=['chest_tri','back_shoulder_bi','legs'].every(t=>completedSessions.includes(`${t}_w${wk}`));const isCurrent=wk===week;
            return(
              <button key={wk} onClick={()=>changeWeek(wk)} style={{flex:1,height:"20px",borderRadius:"4px",background:allDone?DS.accentGreen:isCurrent?`${day.accent}40`:DS.surface,border:`1px solid ${allDone?DS.accentGreen:isCurrent?day.accent:DS.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,transition:"all 0.15s"}}>
                <span style={{fontSize:"8px",color:allDone?"#000":isCurrent?day.accent:DS.labelTert,fontWeight:isCurrent||allDone?700:400}}>
                  {allDone?"✓":wk}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day tabs */}
        <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
          {Object.entries(PLAN).map(([key,d])=>{
            const sessionDone=completedSessions.includes(`${key}_w${week}`);const isActive=tab===key;
            return(
              <button key={key} onClick={()=>changeTab(key)} style={{flex:1,padding:"9px 4px",background:sessionDone?"#0A2D16":isActive?d.accent:DS.surface,border:`1px solid ${sessionDone?DS.accentGreen:isActive?d.accent:DS.border}`,borderRadius:DS.radiusSm,color:sessionDone?DS.accentGreen:isActive?"#000":DS.labelSec,fontSize:"12px",fontWeight:isActive||sessionDone?600:400,cursor:"pointer",lineHeight:1.3,textAlign:"center",position:"relative",transition:"all 0.15s"}}>
                {sessionDone&&<span style={{position:"absolute",top:"2px",right:"4px",fontSize:"8px",color:DS.accentGreen}}>✓</span>}
                <div style={{fontSize:"13px",fontWeight:600}}>{d.day}</div>
                <div style={{fontSize:"10px",opacity:0.8}}>{d.label.split(" ")[0]}</div>
              </button>
            );
          })}
        </div>

        {/* Week + progress bar */}
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button onClick={()=>changeWeek(week-1)} style={{background:DS.surface,border:"none",color:DS.labelSec,width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>‹</button>
          <div style={{background:`${day.accent}15`,border:`1px solid ${day.accent}30`,borderRadius:DS.radiusSm,padding:"3px 10px",textAlign:"center",flexShrink:0}}>
            <div style={{fontSize:"8px",color:day.accent,opacity:0.7,letterSpacing:"1px"}}>WK</div>
            <div style={{fontSize:"22px",fontWeight:700,color:day.accent,lineHeight:1}}>{week}</div>
            <div style={{fontSize:"7px",color:day.accent,opacity:0.5}}>OF 12</div>
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
              <span style={{fontSize:"12px",fontWeight:500,color:DS.labelSec}}>{day.label}</span>
              <span style={{fontSize:"12px",color:pct===100?DS.accentGreen:DS.labelTert}}>{pct}%</span>
            </div>
            <div style={{background:DS.surfaceAlt,borderRadius:"4px",height:"4px",overflow:"hidden"}}>
              <div style={{width:`${pct}%`,height:"100%",background:pct===100?DS.accentGreen:day.accent,borderRadius:"4px",transition:"width 0.4s ease"}}/>
            </div>
          </div>
          <button onClick={()=>changeWeek(week+1)} style={{background:DS.surface,border:"none",color:DS.labelSec,width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>›</button>
        </div>
      </div>

      {/* Motivational + coaching note */}
      <div style={{margin:"14px 20px 4px",padding:"14px 16px",borderLeft:`3px solid ${day.accent}`,background:`${day.accent}08`,borderRadius:`0 ${DS.radiusSm} ${DS.radiusSm} 0`}}>
        <div style={{fontSize:"14px",fontWeight:500,color:DS.label,marginBottom:"4px",lineHeight:1.4}}>{motiv}</div>
        <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.4}}>{day.notes[wi]}</div>
      </div>

      <div style={{padding:"0 20px",marginTop:"16px"}}>
        {/* Mobility */}
        <div style={{marginBottom:"24px"}}>
          <button onClick={()=>setMobOpen(p=>!p)} style={{width:"100%",background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <span style={{fontSize:"13px",fontWeight:600,color:DS.labelSec,letterSpacing:"0.5px",textTransform:"uppercase"}}>Pre-Workout Mobility</span>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontSize:"12px",color:DS.labelTert}}>~2-3 min</span>
              <span style={{fontSize:"12px",color:DS.labelTert,transition:"transform 0.2s",display:"inline-block",transform:mobOpen?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
            </div>
          </button>
          {mobOpen&&<div className="fadeIn">{mobility.map((move,mi)=>(
            <div key={mi} style={{background:DS.surface,borderRadius:DS.radiusSm,padding:"13px 14px",marginBottom:"6px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"5px"}}>
                <span style={{fontSize:"15px",fontWeight:600,color:DS.label}}>{move.name}</span>
                <span style={{fontSize:"11px",color:DS.labelTert}}>{move.timing}</span>
              </div>
              <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.6}}>{move.instructions}</div>
            </div>
          ))}</div>}
        </div>

        {/* Exercise groups */}
        {day.groups.map((group,gi)=>(
          <div key={gi} style={{marginBottom:"24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"13px",fontWeight:700,color:day.accent,letterSpacing:"0.5px",textTransform:"uppercase"}}>{group.label}</span>
                {group.supersetted&&(
                  <button onClick={()=>setSSOpen(p=>({...p,[gi]:!p[gi]}))} style={{background:ssOpen[gi]?`${day.accent}20`:DS.surface,border:`1px solid ${ssOpen[gi]?day.accent:DS.border}`,borderRadius:"12px",color:ssOpen[gi]?day.accent:DS.labelTert,fontSize:"11px",padding:"2px 9px",cursor:"pointer",transition:"all 0.15s"}}>
                    {ssOpen[gi]?"hide":"what's a superset?"}
                  </button>
                )}
              </div>
              <button onClick={()=>startTimer(group.rest,`${group.label} · ${group.rest}`)} style={{background:DS.surface,border:`1px solid ${DS.border}`,borderRadius:"14px",color:DS.labelSec,padding:"4px 11px",cursor:"pointer",fontSize:"12px",display:"flex",alignItems:"center",gap:"5px"}}>
                <span>⏱</span><span>{parseRest(group.rest)}s</span>
              </button>
            </div>
            {ssOpen[gi]&&(
              <div className="fadeIn" style={{background:DS.surface,borderRadius:DS.radiusSm,padding:"13px 14px",marginBottom:"10px",borderLeft:`3px solid ${day.accent}`}}>
                <span style={{fontSize:"13px",fontWeight:600,color:day.accent}}>Superset: </span>
                <span style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.6}}>Do one set of the first exercise, then immediately one set of the second — no rest in between. Rest after both. This alternating pattern continues until all sets are done.</span>
              </div>
            )}

            {group.exercises.map((ex)=>{
              const w=getW(ex.id,wi),prevW=getPrevW(ex.id,wi),w1base=getW1(ex.id);
              const s=ex.sets[wi],r=ex.reps[wi],bo=ex.backoff[wi];
              const wLabel=ex.isPullup?(w===0?"BW":`+${w}`):`${w}`;
              const wSuffix=(ex.isPullup&&w>0)?" lbs":(!ex.isPullup?" lbs":"");
              const isAdj=adj[`${tab}_w${week}_${ex.id}`]!==undefined;
              const cues=FORM_CUES[ex.id],isOpen=cueOpen[ex.id];
              const delta=(week>1&&prevW!==null)?Math.round((w-prevW)*10)/10:null;
              const isPR=PR_EXERCISES.includes(ex.id)&&prs[ex.id]&&w>0&&w>=prs[ex.id]&&isAdj;
              const completedCount=getCompletedCount(ex.id,s,false);
              const boCount=bo?getCompletedCount(ex.id,bo.sets,true):0;
              const currentRating=ratings[`${tab}_w${week}_${ex.id}`];
              const allSetsDone=completedCount>=s;
              const showW1Progress=week>1&&w1base>0&&w!==w1base;

              return(
                <div key={ex.id} style={{background:DS.surface,borderRadius:DS.radius,padding:"16px",marginBottom:"10px"}}>
                  {/* Name row */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"3px"}}>
                        <span style={{fontSize:"17px",fontWeight:600,color:DS.label}}>{ex.name}</span>
                        {isPR&&<span style={{fontSize:"10px",background:day.accent,color:"#000",padding:"2px 7px",borderRadius:"10px",fontWeight:700}}>PR</span>}
                      </div>
                      {ex.note&&<div style={{fontSize:"12px",color:DS.labelTert,lineHeight:1.4}}>{ex.note}</div>}
                    </div>
                    {cues&&(
                      <button onClick={()=>setCueOpen(p=>({...p,[ex.id]:!p[ex.id]}))} style={{background:isOpen?`${day.accent}20`:DS.surfaceAlt,border:"none",borderRadius:"50%",color:isOpen?day.accent:DS.labelTert,width:"28px",height:"28px",cursor:"pointer",fontSize:"13px",flexShrink:0,marginLeft:"8px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>ⓘ</button>
                    )}
                  </div>

                  {/* Cue panel */}
                  {isOpen&&cues&&(
                    <div className="fadeIn" style={{marginBottom:"12px",padding:"13px 14px",background:DS.surfaceAlt,borderRadius:DS.radiusSm,borderLeft:`3px solid ${day.accent}`}}>
                      <div style={{fontSize:"11px",fontWeight:700,color:day.accent,letterSpacing:"0.5px",marginBottom:"5px",textTransform:"uppercase"}}>Setup</div>
                      <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.6,marginBottom:"10px"}}>{cues.setup}</div>
                      <div style={{fontSize:"11px",fontWeight:700,color:day.accent,letterSpacing:"0.5px",marginBottom:"5px",textTransform:"uppercase"}}>Cues</div>
                      <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.6,marginBottom:"12px"}}>{cues.cues}</div>
                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name+' exercise form tutorial')}`} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:"5px",background:`${day.accent}15`,border:`1px solid ${day.accent}40`,borderRadius:"14px",color:day.accent,fontSize:"12px",padding:"5px 12px",textDecoration:"none",fontWeight:500}}>
                        ▶ Watch demo
                      </a>
                    </div>
                  )}

                  {/* Sets × Reps @ Weight */}
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                    <div style={{textAlign:"center",minWidth:"44px"}}>
                      <div style={{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"30px",fontWeight:700,color:day.accent,lineHeight:1}}>{s}</div>
                      <div style={{fontSize:"10px",color:DS.labelTert,marginTop:"1px"}}>SETS</div>
                    </div>
                    <div style={{color:DS.surfaceAlt,fontSize:"18px",fontWeight:300}}>×</div>
                    <div style={{textAlign:"center",minWidth:"44px"}}>
                      <div style={{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"30px",fontWeight:700,color:DS.label,lineHeight:1}}>{r}</div>
                      <div style={{fontSize:"10px",color:DS.labelTert,marginTop:"1px"}}>REPS</div>
                    </div>
                    <div style={{color:DS.border,fontSize:"13px",fontWeight:300,marginTop:"-4px"}}>@</div>
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:"8px",justifyContent:"flex-end"}}>
                      <button onClick={()=>adjustW(ex.id,wi,-2.5)} style={{background:DS.surfaceAlt,border:"none",color:DS.labelSec,width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",fontSize:"16px",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <div style={{textAlign:"center",minWidth:"64px"}}>
                        {editingW===ex.id?(
                          <input autoFocus type="number" inputMode="decimal" value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>commitWeightEdit(ex.id)} onKeyDown={e=>{if(e.key==='Enter')commitWeightEdit(ex.id);}} style={{width:"76px",background:DS.surfaceAlt,border:`1.5px solid ${day.accent}`,borderRadius:DS.radiusSm,color:day.accent,fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"20px",textAlign:"center",padding:"5px"}}/>
                        ):(
                          <div onClick={()=>{setEditingW(ex.id);setEditVal(String(w));}} style={{cursor:"pointer"}}>
                            <div style={{fontFamily:"'SF Mono','JetBrains Mono',monospace",fontSize:"26px",fontWeight:700,color:isAdj?day.accent:DS.label,lineHeight:1}}>
                              {wLabel}<span style={{fontSize:"11px",color:DS.labelTert}}>{wSuffix}</span>
                            </div>
                            <div style={{fontSize:"9px",color:DS.labelTert,marginTop:"1px"}}>tap to edit</div>
                          </div>
                        )}
                      </div>
                      <button onClick={()=>adjustW(ex.id,wi,2.5)} style={{background:DS.surfaceAlt,border:"none",color:DS.labelSec,width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",fontSize:"16px",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                  </div>

                  {/* Progress badges */}
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"}}>
                    {showW1Progress&&<div style={{fontSize:"11px",color:DS.accentGreen,background:`${DS.accentGreen}12`,padding:"3px 9px",borderRadius:"10px",fontWeight:500}}>W1 {w1base} → {w}lbs</div>}
                    {delta!==null&&delta!==0&&<div style={{fontSize:"11px",color:delta>0?DS.accentGreen:DS.accentRed,background:delta>0?`${DS.accentGreen}12`:`${DS.accentRed}12`,padding:"3px 9px",borderRadius:"10px",fontWeight:500}}>{delta>0?`+${delta}`:delta}lbs vs W{week-1}</div>}
                  </div>

                  {bo&&<div style={{marginBottom:"10px",padding:"8px 12px",background:DS.surfaceAlt,borderRadius:DS.radiusSm,fontSize:"12px",color:DS.labelSec,borderLeft:`2px dashed ${DS.border}`}}>Back-off: {bo.sets} × {bo.reps} @ {bo.w}lbs</div>}

                  {/* Set tracker */}
                  <div style={{background:DS.surfaceAlt,borderRadius:DS.radiusSm,padding:"12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"10px"}}>
                      {Array(s).fill(null).map((_,si)=>(
                        <div key={si} style={{flex:1,height:"4px",borderRadius:"2px",background:si<completedCount?day.accent:DS.border,transition:"background 0.2s"}}/>
                      ))}
                      <span style={{fontSize:"11px",color:DS.labelTert,marginLeft:"4px",flexShrink:0}}>{completedCount}/{s}</span>
                    </div>
                    <div style={{display:"flex",gap:"8px"}}>
                      {completedCount<s?(
                        <button onClick={()=>completeNextSet(ex.id,s,group.rest,group.label,false)} style={{flex:1,padding:"11px",background:day.accent,border:"none",borderRadius:DS.radiusSm,color:"#000",fontSize:"14px",fontWeight:600,cursor:"pointer",letterSpacing:"0.3px"}}>
                          Complete Set {completedCount+1}
                        </button>
                      ):(
                        <div style={{flex:1,padding:"11px",background:`${DS.accentGreen}12`,border:`1px solid ${DS.accentGreen}30`,borderRadius:DS.radiusSm,textAlign:"center",fontSize:"13px",color:DS.accentGreen,fontWeight:500}}>All Sets Done ✓</div>
                      )}
                      {completedCount>0&&<button onClick={()=>undoLastSet(ex.id,s,false)} style={{padding:"11px 14px",background:DS.surface,border:"none",borderRadius:DS.radiusSm,color:DS.labelTert,fontSize:"12px",cursor:"pointer"}}>Undo</button>}
                    </div>
                  </div>

                  {/* Quick rating */}
                  {allSetsDone&&(
                    <div style={{marginTop:"10px",padding:"10px 12px",background:DS.surfaceAlt,borderRadius:DS.radiusSm}}>
                      <div style={{fontSize:"11px",color:DS.labelTert,marginBottom:"8px",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.5px"}}>How did that feel?</div>
                      <div style={{display:"flex",gap:"6px"}}>
                        {RATING_OPTS.map(({v,label,color})=>(
                          <button key={v} onClick={()=>setRating(ex.id,v)} style={{flex:1,padding:"8px 4px",background:currentRating===v?`${color}20`:DS.surface,border:`1px solid ${currentRating===v?color:DS.border}`,borderRadius:DS.radiusSm,color:currentRating===v?color:DS.labelTert,fontSize:"11px",fontWeight:currentRating===v?600:400,cursor:"pointer",transition:"all 0.15s"}}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Back-off tracker */}
                  {bo&&(
                    <div style={{background:DS.surfaceAlt,borderRadius:DS.radiusSm,padding:"10px",marginTop:"8px",borderTop:`1px dashed ${DS.border}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"8px"}}>
                        {Array(bo.sets).fill(null).map((_,si)=>(
                          <div key={si} style={{flex:1,height:"3px",borderRadius:"2px",background:si<boCount?DS.labelSec:DS.border,transition:"background 0.2s"}}/>
                        ))}
                        <span style={{fontSize:"11px",color:DS.labelTert,marginLeft:"4px",flexShrink:0}}>{boCount}/{bo.sets}</span>
                      </div>
                      <div style={{display:"flex",gap:"8px"}}>
                        {boCount<bo.sets?(
                          <button onClick={()=>completeNextSet(ex.id,bo.sets,group.rest,`${group.label} back-off`,true)} style={{flex:1,padding:"9px",background:DS.surface,border:`1px solid ${DS.border}`,borderRadius:DS.radiusSm,color:DS.labelSec,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>
                            Back-off Set {boCount+1}
                          </button>
                        ):(
                          <div style={{flex:1,padding:"9px",background:`${DS.accentGreen}08`,border:`1px solid ${DS.accentGreen}20`,borderRadius:DS.radiusSm,textAlign:"center",fontSize:"12px",color:`${DS.accentGreen}80`}}>Back-off done ✓</div>
                        )}
                        {boCount>0&&<button onClick={()=>undoLastSet(ex.id,bo.sets,true)} style={{padding:"9px 12px",background:DS.surface,border:"none",borderRadius:DS.radiusSm,color:DS.labelTert,fontSize:"12px",cursor:"pointer"}}>Undo</button>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Core finisher */}
        <div style={{padding:"13px 16px",marginBottom:"16px",background:DS.surface,borderRadius:DS.radiusSm,fontSize:"13px",color:DS.labelSec}}>+ Core finisher — your standard routine</div>

        {/* Finish workout */}
        <button onClick={handleFinishWorkout} disabled={processingRatings} style={{width:"100%",padding:"16px",background:processingRatings?DS.surface:`${day.accent}15`,border:`1px solid ${processingRatings?DS.border:day.accent}`,borderRadius:DS.radius,color:processingRatings?DS.labelTert:day.accent,fontSize:"16px",fontWeight:600,cursor:processingRatings?"not-allowed":"pointer",marginBottom:"28px",letterSpacing:"0.3px",transition:"all 0.2s"}}>
          {processingRatings?"Processing ratings…":"Finish Workout ✓"}
        </button>

        {/* Week 1 debrief */}
        {week===1&&(
          <div style={{marginBottom:"24px"}}>
            <div style={{marginBottom:"10px",padding:"11px 14px",background:`${DS.accentGreen}08`,border:`1px solid ${DS.accentGreen}20`,borderRadius:DS.radiusSm,fontSize:"13px",color:DS.accentGreen,lineHeight:1.5}}>
              Week 1 — Submit a debrief after this workout to recalibrate weeks 2-12 for your actual strength level.
            </div>
            <div style={{background:DS.surface,borderRadius:DS.radius,padding:"16px"}}>
              <div style={{fontSize:"16px",fontWeight:600,color:DS.label,marginBottom:"4px"}}>Week 1 Debrief</div>
              <div style={{fontSize:"13px",color:DS.labelSec,marginBottom:"12px",lineHeight:1.5}}>How did this workout feel? Describe any exercises that were too heavy, too light, or that need form work.</div>
              {w1AiRes?.applied?(
                <div style={{padding:"13px 14px",background:`${DS.accentGreen}10`,border:`1px solid ${DS.accentGreen}25`,borderRadius:DS.radiusSm}}>
                  <div style={{fontSize:"12px",fontWeight:600,color:DS.accentGreen,marginBottom:"5px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Plan Recalibrated</div>
                  <div style={{fontSize:"13px",color:DS.labelSec,lineHeight:1.5}}>{w1AiRes.summary}. Weeks 2-12 updated.</div>
                </div>
              ):(
                <>
                  <textarea value={w1Feedback} onChange={e=>setW1Feedback(e.target.value)} placeholder={'How did it feel?\n\ne.g. "bench was too heavy, row was too light, curls felt perfect"'} style={{width:"100%",minHeight:"80px",background:DS.surfaceAlt,border:`1px solid ${DS.border}`,borderRadius:DS.radiusSm,color:DS.label,fontSize:"14px",padding:"12px",resize:"vertical",lineHeight:1.5}}/>
                  <button onClick={handleW1Feedback} disabled={w1Loading||!w1Feedback.trim()} style={{marginTop:"10px",width:"100%",padding:"13px",background:w1Loading||!w1Feedback.trim()?DS.surfaceAlt:DS.accentGreen,border:"none",borderRadius:DS.radiusSm,color:w1Loading||!w1Feedback.trim()?DS.labelTert:"#000",fontSize:"15px",fontWeight:600,cursor:w1Loading||!w1Feedback.trim()?"not-allowed":"pointer"}}>
                    {w1Loading?"Analyzing…":"Recalibrate Weeks 2-12"}
                  </button>
                  {w1AiRes&&!w1AiRes.applied&&(
                    <div style={{marginTop:"12px",padding:"14px",background:DS.surfaceAlt,borderRadius:DS.radiusSm}}>
                      <div style={{fontSize:"14px",color:DS.labelSec,marginBottom:"12px",lineHeight:1.5}}>{w1AiRes.analysis}</div>
                      {Object.keys(w1AiRes.adjustments||{}).length>0?(
                        <>
                          <div style={{fontSize:"12px",fontWeight:600,color:DS.labelTert,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Proposed Changes</div>
                          {Object.entries(w1AiRes.adjustments).map(([id,nw])=>{
                            const fe=day.groups.flatMap(g=>g.exercises).find(e=>e.id===id);
                            const cw=getW(id,wi);const diff=Math.round((nw-cw)*10)/10;
                            return(
                              <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${DS.borderSub}`}}>
                                <span style={{fontSize:"13px",color:DS.labelSec}}>{fe?.name??id}</span>
                                <span style={{fontSize:"14px",fontWeight:600,color:DS.accentGreen}}>{nw}lbs <span style={{fontSize:"12px",color:diff>0?DS.accentGreen:DS.accentRed,marginLeft:"6px"}}>{diff>0?`+${diff}`:diff}</span></span>
                              </div>
                            );
                          })}
                          <button onClick={()=>applyW1Recal(w1AiRes.adjustments)} style={{marginTop:"12px",width:"100%",padding:"12px",background:`${DS.accentGreen}15`,border:`1px solid ${DS.accentGreen}40`,borderRadius:DS.radiusSm,color:DS.accentGreen,fontSize:"14px",fontWeight:600,cursor:"pointer"}}>Apply to Weeks 2-12</button>
                        </>
                      ):<div style={{fontSize:"13px",color:DS.labelTert}}>Weights on target — no changes needed.</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Session feedback (weeks 2+) */}
        {week>1&&(
          <div style={{background:DS.surface,borderRadius:DS.radius,padding:"16px",marginBottom:"24px"}}>
            <div style={{fontSize:"16px",fontWeight:600,color:DS.label,marginBottom:"12px"}}>Session Feedback</div>
            <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder={'Additional notes?\n\ne.g. "bench felt heavy, shoulder was bothering me"'} style={{width:"100%",minHeight:"80px",background:DS.surfaceAlt,border:`1px solid ${DS.border}`,borderRadius:DS.radiusSm,color:DS.label,fontSize:"14px",padding:"12px",resize:"vertical",lineHeight:1.5}}/>
            <button onClick={handleFeedback} disabled={loading||!feedback.trim()} style={{marginTop:"10px",width:"100%",padding:"13px",background:loading||!feedback.trim()?DS.surfaceAlt:day.accent,border:"none",borderRadius:DS.radiusSm,color:loading||!feedback.trim()?DS.labelTert:"#000",fontSize:"15px",fontWeight:600,cursor:loading||!feedback.trim()?"not-allowed":"pointer"}}>
              {loading?"Analyzing…":"Adjust Weights"}
            </button>
            {aiRes&&(
              <div style={{marginTop:"12px",padding:"14px",background:DS.surfaceAlt,borderRadius:DS.radiusSm}}>
                <div style={{fontSize:"14px",color:DS.labelSec,marginBottom:"12px",lineHeight:1.5}}>{aiRes.analysis}</div>
                {Object.keys(aiRes.adjustments||{}).length>0?(
                  <>
                    <div style={{fontSize:"12px",fontWeight:600,color:DS.labelTert,marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.5px"}}>Suggested Changes</div>
                    {Object.entries(aiRes.adjustments).map(([id,nw])=>{
                      const fe=day.groups.flatMap(g=>g.exercises).find(e=>e.id===id);
                      const cw=getW(id,wi);const diff=Math.round((nw-cw)*10)/10;
                      return(
                        <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${DS.borderSub}`}}>
                          <span style={{fontSize:"13px",color:DS.labelSec}}>{fe?.name??id}</span>
                          <span style={{fontSize:"14px",fontWeight:600,color:day.accent}}>{nw}lbs <span style={{fontSize:"12px",color:diff>0?DS.accentGreen:DS.accentRed,marginLeft:"6px"}}>{diff>0?`+${diff}`:diff}</span></span>
                        </div>
                      );
                    })}
                    <button onClick={()=>applyAi(aiRes.adjustments)} style={{marginTop:"12px",width:"100%",padding:"12px",background:`${day.accent}15`,border:`1px solid ${day.accent}40`,borderRadius:DS.radiusSm,color:day.accent,fontSize:"14px",fontWeight:600,cursor:"pointer"}}>Apply All Changes</button>
                  </>
                ):<div style={{fontSize:"13px",color:DS.labelTert}}>Weights on target — no changes needed.</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <RestTimer timer={timer} accent={day.accent} onSkip={skipTimer}/>
    </div>
  );
}
