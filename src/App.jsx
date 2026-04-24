import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CONSTANTS ──────────────────────────────────────────────────────────
const PHASES = ["Hypertrophy","Hypertrophy","Hypertrophy","Hypertrophy","Strength","Strength","Strength","Strength","Peaking","Peaking","Peaking","Deload"];
const PHASE_COLORS = { Hypertrophy:"#22C55E", Strength:"#F97316", Peaking:"#EF4444", Deload:"#6B7280" };
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const PR_EXERCISES = ["bench","row","trap_bar","leg_press","incline","rdl","pullup"];

const r25 = v => Math.round(v / 2.5) * 2.5;
function parseRest(s) { const m=s.match(/(\d+)\s*min/); if(m) return parseInt(m[1])*60; const n=s.match(/(\d+)s/); if(n) return parseInt(n[1]); return 90; }
function playBeep() { try { const c=new(window.AudioContext||window.webkitAudioContext)(); [0,.15,.3].forEach(t=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.25;o.start(c.currentTime+t);o.stop(c.currentTime+t+.12);}); } catch(e) {} }

// ── MOTIVATIONAL ───────────────────────────────────────────────────────
const MOTIVATIONAL = {
  Hypertrophy:["Every rep is a deposit. You're building something here.","Volume is the engine. Consistency is the fuel.","The discomfort today is the strength you'll have tomorrow.","Show up. Put in the work. Trust the process.","Muscle is built in the reps you almost skip.","Progress is slow until it's sudden. Keep going."],
  Strength:   ["This is where it compounds.","Heavier than last week. That's the whole game.","Your nervous system is learning. Push it.","Strength is a skill. Practice it today.","The bar doesn't care how you feel. Move it anyway."],
  Peaking:    ["This is what you built the last 8 weeks for.","Low volume, high intent. Make every set count.","You're not building anymore — you're expressing it.","Peak week. Leave it all in the gym."],
  Deload:     ["Recovery is not optional. It's where growth happens.","Trust the process. Rest is part of the plan.","Your muscles grow when you rest, not when you lift.","Earn your recovery. You've put in the work."]
};

// ── YOUTUBE VIDEO IDS (update any that don't load — IDs may change over time) ──
const VIDEOS = {
  bench:"vcBig73ojpE", pushdown:"0326dy_-CzM", incline:"8iPEnn-ltC8", skull:"l3oxjhkFjkA",
  fly:"Iwe6AmxVf7o", kickback:"6SS6K3lAwZ8", pullup:"eGo4IYlbE5g", row:"9efgcAjQe7E",
  facepull:"rep0B283ORM", db_shoulder:"qEwKCR5JCog", incline_curl:"ykJmrZ5v0Oo",
  lat_raise:"FeN2rIBGqeA", lat_pulldown:"CAwf7n6Luuc", trap_bar:"sqSo-N0pFTs",
  leg_press:"IZxyjW7MPJQ", rdl:"7prmZ3vmqhU", calf:"gwLzBvsoy_g",
  leg_ext:"YyvSfVjQeL0", leg_curl:"1Tq3QdYUuHs"
};

// ── FORM CUES ─────────────────────────────────────────────────────────
const FORM_CUES = {
  bench:        { setup:"Grip slightly wider than shoulder-width. Slight natural arch. Butt stays on bench. Feet flat — drive through heels.", cues:"Bar path: lower to mid-chest at a slight diagonal. Elbows 45-75° from torso — not flared. Touch chest lightly, brief pause, press. Think: leg drive into the floor as you press." },
  pushdown:     { setup:"Cable set high. Rope attachment. Slight hip hinge forward. Elbows pinned to your sides — they don't move.", cues:"Pull rope ends apart at the bottom for full contraction. 2s eccentric on the way up. If elbows are flaring or lifting, drop the weight." },
  incline:      { setup:"Bench at 30-45°. DBs at chest level, elbows slightly below bench line at the bottom.", cues:"Press straight up — don't let DBs travel toward each other. Feel the stretch at the bottom. Stop just short of lockout. Shoulders packed, not shrugging." },
  skull:        { setup:"Lie flat, EZ bar over forehead. Elbows shoulder-width apart, pointed at the ceiling.", cues:"Lower bar just behind your forehead. Elbows stay pointing up — flaring is the key failure point. Controlled down, press up. 10lb increments only." },
  fly:          { setup:"Cable at chest height or slightly above. Slight forward lean. Slight bend in elbows — hold that angle the entire set.", cues:"Drive with upper arms, not hands. Think 'hugging a tree.' Full stretch at start. Stop just before hands touch. Don't let the weight yank your shoulder back." },
  kickback:     { setup:"Cable set low. Hinge forward at hips, upper arm parallel to the floor and pinned to your side. Forearm hangs down at start.", cues:"Extend forearm back until arm is fully straight. Squeeze hard at the top for 1 count. Pure elbow extension — no shoulder movement." },
  pullup:       { setup:"Grip just outside shoulder-width, palms facing away. Dead hang to start. Engage lats before you pull.", cues:"Full dead hang between every rep — this is where ROM gets lost. Drive elbows down and back. Chin clears the bar every rep. Reduce reps before sacrificing range." },
  row:          { setup:"Bar below knee, slight knee bend, hinge at hips ~45°. Back neutral — not rounded. Pattern rebuild: prioritize form over load.", cues:"Drive elbows back, not up. Bar touches your lower abdomen at the top. Pause and squeeze. 2s controlled eccentric. Torso should not swing." },
  facepull:     { setup:"Cable at face height. Rope attachment. Step back until arms are extended.", cues:"Pull rope to your face, hands finishing beside your ears. Think 'show your armpits.' External rotation is the goal — shoulder health work. Light weight, high control, every week." },
  db_shoulder:  { setup:"Seated or standing. DBs at shoulder level, elbows slightly in front of your ears — not directly out to the sides.", cues:"Press overhead but stop short of lockout — keep tension on delts. Don't crane your neck forward. Controlled return. If lower back is arching, go seated." },
  incline_curl: { setup:"Bench at 45-60°. Arms hang fully behind torso — full stretch on the bicep long head. One DB per hand. Alternate arms each rep.", cues:"Supinated grip (palms up) throughout — not hammer grip. Curl from a full dead hang. Don't let elbows swing forward at the top. Slow eccentric — 2-3s down." },
  lat_raise:    { setup:"Cable low. Start with hand at hip, slight bend in elbow. 12 reps per side — complete all reps on one side before switching.", cues:"Raise to shoulder height only — not above. Lead with your elbow, not your hand. Avoid shrugging at the top. Slow and controlled beats heavy and sloppy every time." },
  lat_pulldown: { setup:"Grip just outside shoulder-width, lean back slightly. Engage lats before you pull.", cues:"Pull bar to upper chest, driving elbows down and back. Don't lean back excessively. Full arm extension at the top on every rep — ROM first, weight second." },
  trap_bar:     { setup:"Stand centered in the trap bar. Hip hinge to grip, shins nearly vertical. Neutral spine — brace hard before lifting.", cues:"Drive through the floor, not up with your back. Think 'push the ground away.' Hips and shoulders rise at the same rate. Lock out with glutes, not hyperextension." },
  leg_press:    { setup:"Feet shoulder-width, mid-plate or slightly high. Back flat against the pad. Weight shown is total load including the carriage.", cues:"Lower until knees at or past 90° — don't cut the range. Knees track over toes. Drive through the full foot. Stop just short of lockout. Both legs simultaneously." },
  rdl:          { setup:"Hip-width stance, slight knee bend that doesn't change. Bar close to legs throughout.", cues:"Hinge at hips — push them back, not down. Feel the hamstring stretch. Lower until stretch but spine stays neutral. 3s eccentric. Drive hips forward to return. Not a squat." },
  calf:         { setup:"Stand on a plate or step with heels hanging off the edge. Hold DBs at your sides. Knee stays straight throughout.", cues:"Full stretch at the bottom — heel fully below the step, hold 1s. Drive all the way to the top — hold 1s. Full ROM is more important than load." },
  leg_ext:      { setup:"Seat adjusted so knee joint aligns with machine pivot. Pad on lower shin. Both legs simultaneously.", cues:"Extend fully, squeeze at top for 1 count. Slow eccentric — 2-3s down. Avoid swinging or momentum. Keep back against the pad throughout." },
  leg_curl:     { setup:"Lie face down, pad just above the ankle. Hips stay flat on the bench. Both legs simultaneously.", cues:"Curl heels to glutes. Squeeze at the top. Slow eccentric — 2-3s. Don't let hips lift. Plantarflex feet slightly to increase hamstring recruitment." }
};

// ── MOBILITY ──────────────────────────────────────────────────────────
const MOBILITY = {
  chest_tri:[
    { name:"Thoracic Rotation", timing:"5 reps/side · ~45s", instructions:"Sit or kneel with hands behind your head. Slowly rotate your upper back as far as you can each direction. Feel your mid-back doing the work." },
    { name:"Pec Minor Stretch", timing:"30s/side · ~60s", instructions:"Place forearm against a rack upright at 90°. Step through until you feel a stretch across your chest and front shoulder. Hold steady. Switch sides." }
  ],
  back_shoulder_bi:[
    { name:"Lat Hang", timing:"2 × 20s · ~60s", instructions:"Hang from the pull-up bar with a full dead hang. Let your shoulder blades rise fully. Two short holds, not one long one." },
    { name:"Band Pull-Apart or Light Face Pull", timing:"2 × 15 reps · ~60s", instructions:"Use a light band or the face pull cable at minimal weight. Focus on squeezing the rear delts and external rotators at the end range." }
  ],
  legs:[
    { name:"Leg Swings", timing:"10 reps/direction/side · ~60s", instructions:"Hold onto a rack. Swing each leg front-to-back 10 times, then side-to-side 10 times. Keep the movement controlled but full range." },
    { name:"Deep Squat Hold", timing:"2 × 20s · ~60s", instructions:"Hold a rack and lower into the deepest squat you can maintain with a flat back. Let your hips sink, knees track over toes. Two holds, no bouncing." }
  ]
};

// ── PLAN DATA ─────────────────────────────────────────────────────────
const PLAN = {
  chest_tri: {
    label:"Chest & Tri", day:"SUN", accent:"#F97316",
    notes:["Calibration week. 2 reps in reserve every set. Build from here.","Add 5lbs to bench and incline. EZ bar holds at 50.","Another 5lbs on bench. EZ bar holds — build clean reps before jumping to 60.","Volume peak. More reps at slightly lower weight on main lifts.","Strength block. Weight jumps. Should feel hard by set 4.","All 5 sets. Controlled eccentric on bench — 2s down.","Heavier than last week. Short rest only if needed.","Last heavy week before peaking. Leave nothing.","Low volume, high intensity. Top sets matter.","Top set then back-off sets. Trust the fatigue.","Near-max bench attempt. Spotter recommended.","Deload. Light, full ROM, no strain."],
    groups:[
      { label:"Superset 1", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"bench",    name:"Flat Barbell Bench Press",     weights:[135,140,145,135,155,160,165,170,175,180,185,115], sets:[4,4,4,4,5,5,5,5,4,3,3,3], reps:["10","10","10","12","6","5","5","5","4","3","2-3","8"], backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"8",w:150},{sets:3,reps:"6",w:155},null] },
        { id:"pushdown", name:"Cable Tricep Pushdown (rope)", weights:[32.5,35,37.5,37.5,42.5,45,47.5,50,52.5,55,57.5,32.5], sets:[4,4,4,4,5,5,5,5,4,4,4,3], reps:["12","12","12","12","8","8","8","8","8","8","8","10"], backoff:Array(12).fill(null) }
      ]},
      { label:"Superset 2", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"incline",  name:"Incline DB Press",             weights:[45,50,50,45,55,60,60,65,65,70,70,40], sets:[4,4,4,4,5,5,5,5,4,3,3,3], reps:["10","10","10","12","6","6","5","5","4","3","2-3","8"], backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"6",w:55},{sets:3,reps:"6",w:55},null] },
        { id:"skull",    name:"EZ Bar Skull Crushers",        weights:[50,50,50,50,60,60,60,70,70,70,80,50], sets:[4,4,4,4,5,5,5,5,4,4,4,3], reps:["12","12","12","15","8","8","8","8","8","8","8","10"], backoff:Array(12).fill(null), note:"10lb increments only. Hold weight until form is locked before jumping." }
      ]},
      { label:"Superset 3", rest:"Rest 60s", supersetted:true, exercises:[
        { id:"fly",      name:"Cable Fly (flat angle)",       weights:[17.5,20,20,17.5,22.5,25,25,27.5,27.5,30,30,17.5], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","15","10","10","10","10","12","12","12","10"], backoff:Array(12).fill(null) },
        { id:"kickback", name:"Cable Tricep Kickback",        weights:[15,17.5,20,20,22.5,25,27.5,30,30,32.5,35,15], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","15","10","10","10","10","12","12","12","10"], backoff:Array(12).fill(null), note:"Full tricep isolation, no shoulder overhead load." }
      ]}
    ]
  },
  back_shoulder_bi: {
    label:"Back / Shoulder / Bi", day:"TUE", accent:"#3B82F6",
    notes:["Full ROM on every pull-up. Row is a pattern rebuild: form over weight.","Try to add a rep on pull-ups if ROM was full. Row adds 10lbs.","Row: elbows drive back, not up. Watch form on last shoulder set.","Volume peak. Higher reps. Curl: 4 sets for bicep development.","Belt on for pull-ups. Strength block begins.","Push rows heavy. Controlled eccentric on every rep.","Shoulder press: form over weight. No cheat reps.","Last heavy week before peaking.","Chest-to-bar attempts on weighted pull-ups.","Heavy rows. Every set deliberate.","Near-max weighted pull-ups.","Deload. Move well, recover fully."],
    groups:[
      { label:"Straight Set", rest:"Rest 90s", supersetted:false, exercises:[
        { id:"pullup", name:"Pull-ups", weights:[0,0,0,0,10,15,20,20,25,30,35,0], sets:[4,4,4,4,4,4,4,4,4,4,4,3], reps:["8","8","9","10","6","6","5","5","4","3","3","6"], backoff:Array(12).fill(null), isPullup:true, note:"Full dead hang between every rep. Reduce reps before losing ROM." }
      ]},
      { label:"Superset 1", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"row",      name:"Barbell Row",                  weights:[65,75,85,90,100,110,115,120,125,130,135,90], sets:[4,4,4,4,5,5,5,5,4,4,4,3], reps:["10","10","10","10","6","5","5","5","4","4","4","8"], backoff:Array(12).fill(null), note:"Pattern rebuild — weight climbs quickly. Form over load every set." },
        { id:"facepull", name:"Face Pull",                   weights:[40,42.5,45,47.5,50,52.5,55,57.5,57.5,60,60,40], sets:[4,4,4,4,4,4,4,4,4,4,4,3], reps:["12","12","12","12","12","12","12","12","12","12","12","12"], backoff:Array(12).fill(null) }
      ]},
      { label:"Superset 2", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"db_shoulder",  name:"DB Shoulder Press",         weights:[50,52.5,55,55,62.5,65,67.5,70,72.5,75,77.5,50], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["10","10","10","10","6","6","5","5","4","4","3","8"], backoff:Array(12).fill(null), note:"Hold starting weight through W3 until all reps are clean." },
        { id:"incline_curl", name:"Alternating Incline DB Curl", weights:[25,25,27.5,30,32.5,35,37.5,40,40,42.5,45,25], sets:[4,4,4,4,4,4,4,4,4,4,4,3], reps:["10","10","10","12","8","8","6","6","8","8","8","10"], backoff:Array(12).fill(null), note:"Supinated grip (palms up) — not hammer. Alternate one arm at a time." }
      ]},
      { label:"Superset 3", rest:"Rest 60s", supersetted:true, exercises:[
        { id:"lat_raise",    name:"Cable Lateral Raise",       weights:[10,10,10,10,12.5,12.5,15,15,17.5,17.5,20,10], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","15","12","12","12","12","12","12","12","10"], backoff:Array(12).fill(null), note:"12 reps per side — complete all reps one side before switching." },
        { id:"lat_pulldown", name:"Lat Pulldown",               weights:[100,105,110,110,120,125,130,135,140,145,150,100], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","12","8","8","6","6","8","8","8","10"], backoff:Array(12).fill(null), note:"Full arm extension at the top on every rep — ROM first, weight second." }
      ]}
    ]
  },
  legs: {
    label:"Legs", day:"THU", accent:"#22C55E",
    notes:["Trap bar: neutral back, drive through heels. Calibration week.","RDL: 3s eccentric. Feel the hamstring stretch.","Leg press depth: parallel or below every rep.","Volume peak. Slight back-off on hinges.","Strength block. Weight jumps. Brace hard.","Control on both hinge movements. No bouncing RDL.","Leg press going heavy. Full range every rep.","Final heavy week. Back stays neutral on trap bar.","Low volume, high intensity. Top sets matter.","Top sets + back-off. Legs should feel it.","Near-max trap bar. Strong brace, strong pull.","Deload. Full ROM, no strain, flush the legs."],
    groups:[
      { label:"Straight Sets", rest:"Rest 2 min", supersetted:false, exercises:[
        { id:"trap_bar",  name:"Trap Bar Deadlift",            weights:[185,195,205,215,235,245,255,265,275,285,295,185], sets:[4,4,4,4,5,5,5,5,4,3,3,3], reps:["10","10","10","10","5","5","5","5","4","3","2-3","8"], backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"6",w:225},{sets:3,reps:"5",w:230},null] },
        { id:"leg_press", name:"Leg Press (total load)",       weights:[300,340,370,360,410,440,470,500,530,560,590,300], sets:[4,4,4,4,5,5,5,5,4,3,3,3], reps:["10","10","10","10","6","5","5","5","4","3","2-3","8"], backoff:[null,null,null,null,null,null,null,null,null,{sets:2,reps:"5",w:460},{sets:3,reps:"5",w:490},null], note:"Total load including carriage. Subtract carriage, divide by 2 = plates per side." }
      ]},
      { label:"Superset 1", rest:"Rest 90s", supersetted:true, exercises:[
        { id:"rdl",  name:"Romanian Deadlift",                weights:[110,120,130,135,150,160,170,180,185,195,205,110], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","12","8","8","6","6","5","5","5","8"], backoff:Array(12).fill(null), note:"Use a loadable bar to progress freely." },
        { id:"calf", name:"Standing Calf Raise",              weights:[90,105,115,105,125,135,145,155,150,160,170,90], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["15","15","15","20","12","12","12","12","15","15","15","12"], backoff:Array(12).fill(null), note:"Stand on a plate with heels hanging off. Full ROM every rep." }
      ]},
      { label:"Superset 2", rest:"Rest 60s", supersetted:true, exercises:[
        { id:"leg_ext",  name:"Leg Extension (both legs)",    weights:[110,115,120,125,130,135,140,145,145,150,155,110], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","12","10","10","10","10","12","12","12","10"], backoff:Array(12).fill(null), note:"Both legs simultaneously. Full ROM matters more than load." },
        { id:"leg_curl", name:"Lying Leg Curl (both legs)",   weights:[70,75,80,85,90,95,100,105,110,115,120,70], sets:[3,3,3,3,4,4,4,4,3,3,3,3], reps:["12","12","12","12","10","10","10","10","12","12","12","10"], backoff:Array(12).fill(null), note:"Both legs simultaneously. Legs are heavily fatigued — keep ROM full." }
      ]}
    ]
  }
};

// ── EQUIPMENT ─────────────────────────────────────────────────────────
const EQUIPMENT_LIST = [
  { id:"barbell",          label:"Barbell + rack" },
  { id:"dumbbells",        label:"Dumbbells" },
  { id:"cables",           label:"Cable machines (dual)" },
  { id:"single_cable",     label:"Single cable machine only" },
  { id:"trap_bar",         label:"Trap bar" },
  { id:"ez_bar",           label:"EZ bar" },
  { id:"leg_press",        label:"Leg press machine" },
  { id:"pullup_bar",       label:"Pull-up bar" },
  { id:"kettlebells",      label:"Kettlebells" },
  { id:"trx",              label:"TRX / suspension straps" },
  { id:"resistance_bands", label:"Resistance bands" },
  { id:"seated_calf",      label:"Seated calf raise machine" },
  { id:"hack_squat",       label:"Hack squat machine" },
];
const defaultEquipment = () => { const e={}; EQUIPMENT_LIST.forEach(i=>e[i.id]=true); return e; };

// ── BENCHMARK FIELDS ─────────────────────────────────────────────────
const BENCH_FIELDS = {
  chest_tri:[
    { id:"bench",    label:"Flat Barbell Bench Press",           hint:"4 × 10, 2 reps in reserve",    step:5,   min:20,   default:135,  unit:"lbs" },
    { id:"incline",  label:"Incline DB Press (per hand)",        hint:"4 × 10",                        step:2.5, min:5,    default:45,   unit:"lbs" },
    { id:"pushdown", label:"Cable Tricep Pushdown",              hint:"4 × 12",                        step:2.5, min:5,    default:30,   unit:"lbs" },
    { id:"skull",    label:"EZ Bar Skull Crushers",              hint:"4 × 12",                        step:5,   min:20,   default:50,   unit:"lbs" },
    { id:"fly",      label:"Cable Fly (per side)",               hint:"3 × 12",                        step:2.5, min:2.5,  default:15,   unit:"lbs" },
    { id:"kickback", label:"Cable Kickback",                     hint:"3 × 12",                        step:2.5, min:2.5,  default:12.5, unit:"lbs" },
  ],
  back_shoulder_bi:[
    { id:"pullup_reps",  label:"Pull-up max reps (strict form)", hint:"Bodyweight, dead hang each rep", step:1,   min:0,    default:5,    unit:"reps" },
    { id:"row",          label:"Barbell Row",                    hint:"4 × 10",                         step:5,   min:20,   default:95,   unit:"lbs" },
    { id:"facepull",     label:"Face Pull",                      hint:"4 × 12",                         step:2.5, min:5,    default:35,   unit:"lbs" },
    { id:"db_shoulder",  label:"DB Shoulder Press (per hand)",   hint:"3 × 10",                         step:2.5, min:5,    default:45,   unit:"lbs" },
    { id:"incline_curl", label:"Incline DB Curl (per hand)",     hint:"4 × 10",                         step:2.5, min:5,    default:25,   unit:"lbs" },
    { id:"lat_raise",    label:"Cable Lateral Raise (per side)", hint:"3 × 12",                         step:2.5, min:2.5,  default:10,   unit:"lbs" },
    { id:"lat_pulldown", label:"Lat Pulldown",                   hint:"3 × 12",                         step:5,   min:20,   default:100,  unit:"lbs" },
  ],
  legs:[
    { id:"trap_bar",  label:"Trap Bar Deadlift",                 hint:"4 × 10",                         step:5,   min:45,   default:155,  unit:"lbs" },
    { id:"leg_press", label:"Leg Press (total load w/ carriage)",hint:"4 × 10",                         step:10,  min:50,   default:250,  unit:"lbs" },
    { id:"rdl",       label:"Romanian Deadlift",                 hint:"3 × 12",                         step:5,   min:20,   default:95,   unit:"lbs" },
    { id:"calf",      label:"Standing Calf Raise",               hint:"3 × 15",                         step:5,   min:0,    default:70,   unit:"lbs" },
    { id:"leg_ext",   label:"Leg Extension (both legs)",        hint:"3 × 12",                          step:5,   min:10,   default:100,  unit:"lbs" },
    { id:"leg_curl",  label:"Lying Leg Curl (both legs)",       hint:"3 × 12",                          step:5,   min:10,   default:80,   unit:"lbs" },
  ]
};
const defaultBenchmarks = () => { const b={}; Object.values(BENCH_FIELDS).flat().forEach(f=>b[f.id]=f.default); return b; };

// ── PLAN GENERATION ───────────────────────────────────────────────────
const PROG = {
  compound_major:[0,5,10,0,20,25,30,35,40,45,50],
  compound_minor:[0,5,5,0,15,17.5,17.5,22.5,22.5,27.5,27.5],
  isolation:[0,2.5,5,2.5,10,12.5,15,17.5,17.5,20,22.5],
  cable_light:[0,2.5,5,2.5,7.5,10,12.5,15,15,17.5,20],
};
const gW=(w1,t)=>[...PROG[t].map(d=>r25(w1+d)),r25(w1*.85)];
const gPU=r=>{const a=r>=12?15:r>=8?10:r>=5?5:0; return[0,0,0,0,a,a+5,a+10,a+10,a+15,a+20,a+25,0];};

function buildWeights(b, eq) {
  if (!b || !Object.keys(b).length) return null;
  const hp = eq?.pullup_bar !== false;
  return {
    bench: gW(b.bench||135,'compound_major'), pushdown: gW(b.pushdown||32.5,'isolation'),
    incline: gW(b.incline||45,'compound_minor'), skull: gW(b.skull||50,'isolation'),
    fly: gW(b.fly||17.5,'cable_light'), kickback: gW(b.kickback||15,'cable_light'),
    pullup: hp ? gPU(b.pullup_reps||5) : Array(12).fill(0),
    row: gW(b.row||65,'compound_major'), facepull: gW(b.facepull||40,'isolation'),
    db_shoulder: gW(b.db_shoulder||50,'compound_minor'),
    incline_curl: gW(b.incline_curl||25,'isolation'),
    lat_raise: gW(b.lat_raise||10,'cable_light'),
    lat_pulldown: gW(b.lat_pulldown||100,'compound_minor'),
    trap_bar: gW(b.trap_bar||185,'compound_major'),
    leg_press: gW(b.leg_press||300,'compound_major'),
    rdl: gW(b.rdl||110,'compound_minor'), calf: gW(b.calf||90,'isolation'),
    leg_ext: gW(b.leg_ext||110,'isolation'), leg_curl: gW(b.leg_curl||70,'isolation'),
  };
}

async function saveGeneratedWeights(userId, weights) {
  if (!weights) return;
  const dayMap = {
    chest_tri:['bench','pushdown','incline','skull','fly','kickback'],
    back_shoulder_bi:['pullup','row','facepull','db_shoulder','incline_curl','lat_raise','lat_pulldown'],
    legs:['trap_bar','leg_press','rdl','calf','leg_ext','leg_curl']
  };
  const rows = [];
  for (const [day, exIds] of Object.entries(dayMap)) {
    for (const exId of exIds) {
      if (!weights[exId]) continue;
      for (let w=1; w<=12; w++) rows.push({ user_id:userId, day, week:w, exercise_id:exId, weight:weights[exId][w-1], updated_at:new Date().toISOString() });
    }
  }
  for (let i=0; i<rows.length; i+=50) await supabase.from("weight_adjustments").upsert(rows.slice(i,i+50),{onConflict:"user_id,day,week,exercise_id"});
}

// ── DATE UTILITIES ────────────────────────────────────────────────────
function getAutoWeekAndTab(startDate, d1Dow, d2Dow, d3Dow) {
  if (!startDate) return { week:1, tab:null };
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(startDate); start.setHours(0,0,0,0);
  const days = Math.floor((today - start) / 86400000);
  if (days < 0) return { week:1, tab:null };
  const week = Math.min(12, Math.floor(days/7)+1);
  const dow = today.getDay();
  const tabMap = {[d1Dow]:'chest_tri',[d2Dow]:'back_shoulder_bi',[d3Dow]:'legs'};
  return { week, tab: tabMap[dow] || null };
}

// ── BENCHMARK INPUT COMPONENT ─────────────────────────────────────────
function BenchInput({ label, hint, value, onChange, step, min=0, unit="lbs", accent }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value));
  const commit = () => {
    const v = parseFloat(raw);
    if (!isNaN(v) && v >= min) onChange(Math.round(v/step)*step);
    else setRaw(String(value));
    setEditing(false);
  };
  return (
    <div style={{background:"#101010",border:"1px solid #1C1C1C",borderRadius:"6px",padding:"12px",marginBottom:"8px"}}>
      <div style={{fontSize:"14px",fontWeight:700,color:"#D0D0D0",marginBottom:"2px",fontFamily:"'Barlow Condensed',sans-serif"}}>{label}</div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#555",marginBottom:"10px"}}>{hint}</div>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        <button onClick={()=>onChange(Math.max(min,Math.round((value-step)/step)*step))} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",color:"#666",width:"34px",height:"34px",borderRadius:"3px",cursor:"pointer",fontSize:"16px",lineHeight:1}}>−</button>
        {editing ? (
          <input autoFocus type="number" inputMode="decimal" value={raw} onChange={e=>setRaw(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();}} style={{flex:1,background:"#0A0A0A",border:`1px solid ${accent}`,borderRadius:"4px",color:accent,fontFamily:"'JetBrains Mono',monospace",fontSize:"20px",textAlign:"center",padding:"6px"}} />
        ) : (
          <div onClick={()=>{setRaw(String(value));setEditing(true);}} style={{flex:1,textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:"22px",fontWeight:600,color:"#C0C0C0",cursor:"pointer",padding:"6px"}}>
            {value}<span style={{fontSize:"12px",color:"#555",marginLeft:"4px"}}>{unit}</span>
          </div>
        )}
        <button onClick={()=>onChange(Math.round((value+step)/step)*step)} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",color:"#666",width:"34px",height:"34px",borderRadius:"3px",cursor:"pointer",fontSize:"16px",lineHeight:1}}>+</button>
      </div>
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [name, setName] = useState("");
  const [error, setError] = useState(""), [loading, setLoading] = useState(false);
  const accent = "#F97316";
  const handle = async () => {
    setError(""); setLoading(true);
    if (mode==="signin") { const {error:e}=await supabase.auth.signInWithPassword({email,password}); if(e)setError(e.message); }
    else {
      if(!name.trim()){setError("Please enter your name.");setLoading(false);return;}
      const {error:e}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});
      if(e)setError(e.message); else setError("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  };
  const inp = {width:"100%",background:"#101010",border:"1px solid #222",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",padding:"12px",marginBottom:"10px"};
  return (
    <div style={{background:"#080808",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed','Impact',sans-serif",padding:"20px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap'); *{box-sizing:border-box;} input:focus{outline:none;border-color:${accent}!important;}`}</style>
      <div style={{width:"100%",maxWidth:"360px"}}>
        <div style={{textAlign:"center",marginBottom:"8px"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",letterSpacing:"3px",marginBottom:"8px"}}>12-WEEK STRENGTH PROGRAM</div>
          <div style={{fontSize:"34px",fontWeight:900,color:"#E0E0E0",letterSpacing:"1px",marginBottom:"8px"}}>WORKOUT TRACKER</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555",lineHeight:1.6,marginBottom:"24px"}}>
            {mode==="signup" ? "Your transformation starts here. Let's build your personalized 12-week plan in under 3 minutes." : "Welcome back. Let's get to work."}
          </div>
        </div>
        <div style={{display:"flex",marginBottom:"24px",border:"1px solid #222",borderRadius:"6px",overflow:"hidden"}}>
          {["signin","signup"].map(m => (
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",background:mode===m?accent:"transparent",border:"none",color:mode===m?"#000":"#555",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,letterSpacing:"1.5px",cursor:"pointer"}}>
              {m==="signin"?"SIGN IN":"GET STARTED"}
            </button>
          ))}
        </div>
        {mode==="signup" && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your first name" style={inp} />}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp} />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={{...inp,marginBottom:"16px"}} />
        {error && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:error.includes("Check")?"#22C55E":"#EF4444",marginBottom:"12px",lineHeight:1.5}}>{error}</div>}
        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"13px",background:loading?"#151515":accent,border:`1px solid ${loading?"#222":accent}`,borderRadius:"4px",color:loading?"#444":"#000",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"15px",fontWeight:700,letterSpacing:"2px",cursor:loading?"not-allowed":"pointer"}}>
          {loading?"...":mode==="signin"?"SIGN IN":"CREATE ACCOUNT →"}
        </button>
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────
const ONBOARDING_COPY = [
  { title:"When do you train?", sub:"Choose your 3 workout days. The app will automatically open to the right session based on today's date." },
  { title:"What's in your gym?", sub:"Check everything available to you. The plan will adapt with alternative exercises for any missing equipment." },
  { title:"How strong are you right now?", sub:"Enter your current working weights for Chest and Triceps. Use weights you can do with 2 reps left in reserve — not your max." },
  { title:"Back and shoulders.", sub:"Now your back, shoulder, and bicep movements. Same rule — challenging but controlled, not maxing out." },
  { title:"Finally, legs.", sub:"Last page. Enter your leg movement baselines. Your full personalized 12-week plan generates after this." },
];

function OnboardingScreen({ session, onComplete }) {
  const [step, setStep] = useState(0);
  const [d1Dow, setD1Dow] = useState(0), [d2Dow, setD2Dow] = useState(2), [d3Dow, setD3Dow] = useState(4);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [equipment, setEquipment] = useState(defaultEquipment);
  const [benchmarks, setBenchmarks] = useState(defaultBenchmarks);
  const [saving, setSaving] = useState(false);
  const accent = "#F97316";
  const setBench = (id, val) => setBenchmarks(p=>({...p,[id]:val}));
  const toggleEq = id => setEquipment(p=>({...p,[id]:!p[id]}));

  const handleFinish = async () => {
    setSaving(true);
    const weights = buildWeights(benchmarks, equipment);
    await supabase.from("user_progress").upsert({user_id:session.user.id,benchmarks,equipment,setup_complete:true,start_date:startDate,day1_dow:d1Dow,day2_dow:d2Dow,day3_dow:d3Dow,current_week:1,current_day:'chest_tri',updated_at:new Date().toISOString()});
    await saveGeneratedWeights(session.user.id, weights);
    setSaving(false); onComplete();
  };

  const dayBtn = (val, set, i) => (
    <button key={i} onClick={()=>set(i)} style={{flex:1,padding:"8px 2px",background:val===i?accent:"#1A1A1A",border:`1px solid ${val===i?accent:"#2A2A2A"}`,borderRadius:"3px",color:val===i?"#000":"#666",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"12px",fontWeight:val===i?700:400,cursor:"pointer"}}>
      {DAYS_SHORT[i]}
    </button>
  );

  const copy = ONBOARDING_COPY[step];
  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#E0E0E0",fontFamily:"'Barlow Condensed','Impact',sans-serif",maxWidth:"480px",margin:"0 auto",paddingBottom:"90px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap'); *{box-sizing:border-box;} input:focus{outline:none;} button:active{opacity:0.75;} input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.4);}`}</style>
      <div style={{padding:"20px 16px 12px",borderBottom:"1px solid #1A1A1A"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",letterSpacing:"2px",marginBottom:"6px"}}>SETUP · {step+1} OF {ONBOARDING_COPY.length}</div>
        <div style={{fontSize:"26px",fontWeight:900,color:"#E0E0E0",marginBottom:"4px"}}>{copy.title.toUpperCase()}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555",lineHeight:1.6,marginBottom:"12px"}}>{copy.sub}</div>
        <div style={{display:"flex",gap:"4px"}}>
          {ONBOARDING_COPY.map((_,i) => <div key={i} style={{flex:1,height:"2px",background:i<=step?accent:"#1A1A1A",borderRadius:"2px",transition:"background 0.3s"}} />)}
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {step===0 && (
          <>
            {[{label:"Chest & Tri",a:"#F97316",val:d1Dow,set:setD1Dow},{label:"Back & Shoulders",a:"#3B82F6",val:d2Dow,set:setD2Dow},{label:"Legs",a:"#22C55E",val:d3Dow,set:setD3Dow}].map(({label,a,val,set}) => (
              <div key={label} style={{marginBottom:"16px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:a,letterSpacing:"1px",marginBottom:"6px"}}>{label.toUpperCase()}</div>
                <div style={{display:"flex",gap:"3px"}}>{DAYS_SHORT.map((_,i)=>dayBtn(val,set,i))}</div>
              </div>
            ))}
            <div style={{marginTop:"8px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:"#888",letterSpacing:"1px",marginBottom:"6px"}}>PROGRAM START DATE</div>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",background:"#101010",border:"1px solid #2A2A2A",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",padding:"10px 12px"}} />
            </div>
          </>
        )}
        {step===1 && (
          <div>
            {EQUIPMENT_LIST.map(eq => (
              <button key={eq.id} onClick={()=>toggleEq(eq.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"14px",marginBottom:"8px",background:equipment[eq.id]?accent+"12":"#101010",border:`1px solid ${equipment[eq.id]?accent:"#1C1C1C"}`,borderRadius:"6px",cursor:"pointer",textAlign:"left"}}>
                <div style={{width:"20px",height:"20px",borderRadius:"4px",border:`2px solid ${equipment[eq.id]?accent:"#333"}`,background:equipment[eq.id]?accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"12px",color:"#000",fontWeight:700}}>{equipment[eq.id]?"✓":""}</div>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"16px",fontWeight:600,color:equipment[eq.id]?"#D0D0D0":"#555"}}>{eq.label}</span>
              </button>
            ))}
          </div>
        )}
        {step>=2 && step<=4 && Object.values(BENCH_FIELDS)[step-2].map(f => (
          <BenchInput key={f.id} label={f.label} hint={f.hint} value={benchmarks[f.id]} onChange={v=>setBench(f.id,v)} step={f.step} min={f.min} unit={f.unit} accent={accent} />
        ))}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",padding:"12px 16px",background:"#080808",borderTop:"1px solid #1A1A1A",display:"flex",gap:"10px"}}>
        {step>0 && <button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"12px",background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:"4px",color:"#666",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,cursor:"pointer",letterSpacing:"1.5px"}}>← BACK</button>}
        <button onClick={()=>step<ONBOARDING_COPY.length-1?setStep(s=>s+1):handleFinish()} disabled={saving} style={{flex:2,padding:"12px",background:saving?"#151515":accent,border:`1px solid ${saving?"#222":accent}`,borderRadius:"4px",color:saving?"#444":"#000",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,cursor:saving?"not-allowed":"pointer",letterSpacing:"1.5px"}}>
          {saving?"BUILDING YOUR PLAN...":step<ONBOARDING_COPY.length-1?"NEXT →":"GENERATE MY PLAN →"}
        </button>
      </div>
    </div>
  );
}

// ── SETTINGS SCREEN ───────────────────────────────────────────────────
function SettingsScreen({ session, userProgress, onBack, onSave }) {
  const [d1Dow, setD1Dow] = useState(userProgress?.day1_dow??0);
  const [d2Dow, setD2Dow] = useState(userProgress?.day2_dow??2);
  const [d3Dow, setD3Dow] = useState(userProgress?.day3_dow??4);
  const [startDate, setStartDate] = useState(userProgress?.start_date||new Date().toISOString().split('T')[0]);
  const [equipment, setEquipment] = useState(()=>{const e=defaultEquipment();if(userProgress?.equipment)Object.assign(e,userProgress.equipment);return e;});
  const [benchmarks, setBenchmarks] = useState(()=>{const b=defaultBenchmarks();if(userProgress?.benchmarks)Object.assign(b,userProgress.benchmarks);return b;});
  const [stab, setStab] = useState("schedule");
  const [saving, setSaving] = useState(false);
  const accent = "#F97316";
  const setBench = (id,val) => setBenchmarks(p=>({...p,[id]:val}));
  const toggleEq = id => setEquipment(p=>({...p,[id]:!p[id]}));

  const handleSave = async () => {
    setSaving(true);
    const weights = buildWeights(benchmarks, equipment);
    await supabase.from("user_progress").upsert({user_id:session.user.id,benchmarks,equipment,start_date:startDate,day1_dow:d1Dow,day2_dow:d2Dow,day3_dow:d3Dow,updated_at:new Date().toISOString()});
    await saveGeneratedWeights(session.user.id, weights);
    setSaving(false); onSave();
  };

  const tabs = [{id:"schedule",label:"Schedule"},{id:"equipment",label:"Equipment"},{id:"chest",label:"Chest/Tri"},{id:"back",label:"Back/Shoulder"},{id:"legs",label:"Legs"}];
  const dayBtn = (val,set,i) => <button key={i} onClick={()=>set(i)} style={{flex:1,padding:"6px 2px",background:val===i?accent:"#1A1A1A",border:`1px solid ${val===i?accent:"#2A2A2A"}`,borderRadius:"3px",color:val===i?"#000":"#666",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"11px",fontWeight:val===i?700:400,cursor:"pointer"}}>{DAYS_SHORT[i]}</button>;

  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#E0E0E0",fontFamily:"'Barlow Condensed','Impact',sans-serif",maxWidth:"480px",margin:"0 auto",paddingBottom:"90px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap'); *{box-sizing:border-box;} input:focus{outline:none;} button:active{opacity:0.75;}`}</style>
      <div style={{position:"sticky",top:0,zIndex:20,background:"#080808",borderBottom:"1px solid #1A1A1A",padding:"12px 16px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px"}}>
          <button onClick={onBack} style={{background:"none",border:"1px solid #222",color:"#666",width:"30px",height:"30px",borderRadius:"3px",cursor:"pointer",fontSize:"14px",lineHeight:1}}>←</button>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",letterSpacing:"2px"}}>SETTINGS</span>
        </div>
        <div style={{display:"flex",gap:"4px",overflowX:"auto"}}>
          {tabs.map(t => <button key={t.id} onClick={()=>setStab(t.id)} style={{padding:"6px 10px",background:stab===t.id?"#6B7280":"#111",border:`1px solid ${stab===t.id?"#6B7280":"#222"}`,borderRadius:"3px",color:stab===t.id?"#000":"#555",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"11px",fontWeight:stab===t.id?700:400,cursor:"pointer",whiteSpace:"nowrap"}}>{t.label.toUpperCase()}</button>)}
        </div>
      </div>
      <div style={{padding:"16px"}}>
        {stab==="schedule" && (
          <>
            {[{label:"Workout 1 — Chest & Tri",a:"#F97316",val:d1Dow,set:setD1Dow},{label:"Workout 2 — Back & Shoulders",a:"#3B82F6",val:d2Dow,set:setD2Dow},{label:"Workout 3 — Legs",a:"#22C55E",val:d3Dow,set:setD3Dow}].map(({label,a,val,set}) => (
              <div key={label} style={{marginBottom:"16px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:a,letterSpacing:"1px",marginBottom:"6px"}}>{label.toUpperCase()}</div>
                <div style={{display:"flex",gap:"3px"}}>{DAYS_SHORT.map((_,i)=>dayBtn(val,set,i))}</div>
              </div>
            ))}
            <div>
              <div style={{fontSize:"12px",fontWeight:700,color:"#888",letterSpacing:"1px",marginBottom:"6px"}}>START DATE</div>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",background:"#101010",border:"1px solid #2A2A2A",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",padding:"10px 12px"}} />
            </div>
          </>
        )}
        {stab==="equipment" && (
          <div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555",marginBottom:"12px",lineHeight:1.6}}>Uncheck any equipment not at your gym. Save to regenerate the plan with substitutions.</div>
            {EQUIPMENT_LIST.map(eq => (
              <button key={eq.id} onClick={()=>toggleEq(eq.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"12px",padding:"14px",marginBottom:"8px",background:equipment[eq.id]?accent+"12":"#101010",border:`1px solid ${equipment[eq.id]?accent:"#1C1C1C"}`,borderRadius:"6px",cursor:"pointer",textAlign:"left"}}>
                <div style={{width:"20px",height:"20px",borderRadius:"4px",border:`2px solid ${equipment[eq.id]?accent:"#333"}`,background:equipment[eq.id]?accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"12px",color:"#000",fontWeight:700}}>{equipment[eq.id]?"✓":""}</div>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"16px",fontWeight:600,color:equipment[eq.id]?"#D0D0D0":"#555"}}>{eq.label}</span>
              </button>
            ))}
          </div>
        )}
        {["chest","back","legs"].map((t,ti)=>stab===t && (
          <div key={t}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555",marginBottom:"12px",lineHeight:1.6}}>Update your benchmarks. Save to regenerate all 12 weeks from these new baselines.</div>
            {Object.values(BENCH_FIELDS)[ti].map(f => (
              <BenchInput key={f.id} label={f.label} hint={f.hint} value={benchmarks[f.id]} onChange={v=>setBench(f.id,v)} step={f.step} min={f.min} unit={f.unit} accent={accent} />
            ))}
          </div>
        ))}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",padding:"12px 16px",background:"#080808",borderTop:"1px solid #1A1A1A"}}>
        <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:"12px",background:saving?"#151515":accent,border:`1px solid ${saving?"#222":accent}`,borderRadius:"4px",color:saving?"#444":"#000",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,cursor:saving?"not-allowed":"pointer",letterSpacing:"2px"}}>
          {saving?"SAVING...":"SAVE CHANGES"}
        </button>
      </div>
    </div>
  );
}

// ── HISTORY SCREEN ────────────────────────────────────────────────────
function HistoryScreen({ session, adj, onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sets } = await supabase.from("completed_sets").select("day,week,updated_at").eq("user_id",session.user.id).eq("completed",true).order("updated_at",{ascending:false});
      if (sets) {
        const map = {};
        sets.forEach(s => {
          const key = `${s.day}_w${s.week}`;
          if (!map[key]) map[key] = { day:s.day, week:s.week, date:s.updated_at, count:0 };
          map[key].count++;
        });
        setSessions(Object.values(map).sort((a,b)=>new Date(b.date)-new Date(a.date)));
      }
      setLoading(false);
    }
    load();
  }, []);

  const dayLabel = d => ({ chest_tri:"Chest & Tri", back_shoulder_bi:"Back / Shoulder / Bi", legs:"Legs" }[d] || d);
  const dayAccent = d => ({ chest_tri:"#F97316", back_shoulder_bi:"#3B82F6", legs:"#22C55E" }[d] || "#888");
  const formatDate = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});

  const getKeyWeights = (day, week) => {
    const keyEx = { chest_tri:"bench", back_shoulder_bi:"row", legs:"trap_bar" };
    const exId = keyEx[day];
    const k = `${day}_w${week}_${exId}`;
    if (adj[k]) return `${exId.replace('_',' ')}: ${adj[k]}lbs`;
    const ex = PLAN[day]?.groups.flatMap(g=>g.exercises).find(e=>e.id===exId);
    return ex ? `${exId.replace(/_/g,' ')}: ${ex.weights[week-1]}lbs` : '';
  };

  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#E0E0E0",fontFamily:"'Barlow Condensed','Impact',sans-serif",maxWidth:"480px",margin:"0 auto",paddingBottom:"40px"}}>
      <div style={{position:"sticky",top:0,zIndex:20,background:"#080808",borderBottom:"1px solid #1A1A1A",padding:"12px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <button onClick={onBack} style={{background:"none",border:"1px solid #222",color:"#666",width:"30px",height:"30px",borderRadius:"3px",cursor:"pointer",fontSize:"14px",lineHeight:1}}>←</button>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",letterSpacing:"2px"}}>WORKOUT HISTORY</span>
        </div>
      </div>
      <div style={{padding:"16px"}}>
        {loading && <div style={{textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#444",padding:"40px 0"}}>Loading history...</div>}
        {!loading && sessions.length === 0 && (
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#444",lineHeight:1.8}}>No completed sessions yet.<br />Complete sets during a workout to see history here.</div>
          </div>
        )}
        {sessions.map((s,i) => (
          <div key={i} style={{background:"#101010",border:"1px solid #1C1C1C",borderRadius:"6px",padding:"14px",marginBottom:"8px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                  <div style={{width:"8px",height:"8px",borderRadius:"50%",background:dayAccent(s.day),flexShrink:0}} />
                  <span style={{fontSize:"16px",fontWeight:700,color:"#D0D0D0"}}>{dayLabel(s.day)}</span>
                </div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#555"}}>Week {s.week} · {PHASES[s.week-1]} · {s.count} sets logged</div>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444"}}>{formatDate(s.date)}</div>
            </div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:dayAccent(s.day)+"99"}}>{getKeyWeights(s.day,s.week)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REST TIMER ────────────────────────────────────────────────────────
function RestTimer({ timer, accent, onSkip }) {
  if (!timer) return null;
  const { seconds, total, label, done:td } = timer;
  const r=28, circ=2*Math.PI*r, offset=circ*(seconds/total);
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",zIndex:100,background:td?"#0D200D":"#0D0D0D",borderTop:`2px solid ${td?"#22C55E":accent}`,padding:"14px 20px",display:"flex",alignItems:"center",gap:"16px",boxShadow:"0 -4px 24px rgba(0,0,0,0.6)"}}>
      <div style={{position:"relative",width:"68px",height:"68px",flexShrink:0}}>
        <svg width="68" height="68" style={{transform:"rotate(-90deg)"}}>
          <circle cx="34" cy="34" r={r} fill="none" stroke="#222" strokeWidth="4"/>
          <circle cx="34" cy="34" r={r} fill="none" stroke={td?"#22C55E":accent} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ-offset} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
        </svg>
        <div style={{position:"absolute",top:0,left:0,width:"68px",height:"68px",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:td?"13px":"20px",fontWeight:600,color:td?"#22C55E":"#E0E0E0"}}>{td?"GO!":seconds}</div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"16px",fontWeight:700,color:"#D0D0D0"}}>{td?"Rest complete":"Resting"}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555",marginTop:"2px"}}>{label}</div>
        {!td && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",marginTop:"4px"}}>{total}s total · {total-seconds}s elapsed</div>}
      </div>
      <button onClick={onSkip} style={{background:"#1A1A1A",border:"1px solid #333",color:"#666",borderRadius:"4px",padding:"8px 14px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"13px",fontWeight:700,cursor:"pointer",flexShrink:0}}>{td?"CLOSE":"SKIP"}</button>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]           = useState(null);
  const [authReady, setAuthReady]       = useState(false);
  const [userProgress, setUserProgress] = useState(undefined);
  const [screen, setScreen]             = useState("workout");
  const [tab, setTab]                   = useState("chest_tri");
  const [week, setWeek]                 = useState(1);
  const [adj, setAdj]                   = useState({});
  const [done, setDone]                 = useState({});
  const [prs, setPRs]                   = useState({});
  const [cueOpen, setCueOpen]           = useState({});
  const [videoOpen, setVideoOpen]       = useState({});
  const [mobOpen, setMobOpen]           = useState(true);
  const [editingW, setEditingW]         = useState(null);
  const [editVal, setEditVal]           = useState("");
  const [feedback, setFeedback]         = useState("");
  const [w1Feedback, setW1Feedback]     = useState("");
  const [aiRes, setAiRes]               = useState(null);
  const [w1AiRes, setW1AiRes]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [w1Loading, setW1Loading]       = useState(false);
  const [timer, setTimer]               = useState(null);
  const timerRef                        = useRef(null);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { setSession(session); setAuthReady(true); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e,s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const loadProgress = async () => {
    if (!session) return;
    const uid = session.user.id;
    const {data:progress, error} = await supabase.from("user_progress").select("*").eq("user_id",uid).single();
    if (error && error.code === 'PGRST116') setUserProgress(null);
    else if (progress) {
      setUserProgress(progress);
      const {week:autoWeek, tab:autoTab} = getAutoWeekAndTab(progress.start_date, progress.day1_dow??0, progress.day2_dow??2, progress.day3_dow??4);
      setWeek(autoWeek || progress.current_week || 1);
      setTab(autoTab || progress.current_day || 'chest_tri');
    }
    const {data:adjs} = await supabase.from("weight_adjustments").select("*").eq("user_id",uid);
    if (adjs) {
      const aMap = {}, prMap = {};
      adjs.forEach(a => {
        aMap[`${a.day}_w${a.week}_${a.exercise_id}`] = a.weight;
        if (!prMap[a.exercise_id] || a.weight > prMap[a.exercise_id]) prMap[a.exercise_id] = a.weight;
      });
      setAdj(aMap); setPRs(prMap);
    }
    const {data:sets} = await supabase.from("completed_sets").select("*").eq("user_id",uid);
    if (sets) {
      const dMap = {};
      sets.forEach(s => { dMap[`${s.day}_w${s.week}_${s.set_key}`] = s.completed; });
      setDone(dMap);
    }
  };

  useEffect(() => { if (session) loadProgress(); }, [session]);

  // Timer tick
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (timer && !timer.done) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (!prev || prev.done) return prev;
          if (prev.seconds <= 1) { clearInterval(timerRef.current); playBeep(); return {...prev,seconds:0,done:true}; }
          return {...prev,seconds:prev.seconds-1};
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer?.done, timer?.total]);

  const startTimer = (restStr, label) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const secs = parseRest(restStr);
    setTimer({seconds:secs,total:secs,label,done:false});
  };
  const skipTimer = () => { if (timerRef.current) clearInterval(timerRef.current); setTimer(null); };

  const getW = (exId, wi) => {
    const k = `${tab}_w${week}_${exId}`;
    if (adj[k] !== undefined) return adj[k];
    const ex = PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===exId);
    return ex ? ex.weights[wi] : 0;
  };
  const getPrevW = (exId, wi) => {
    if (wi===0) return null;
    const k = `${tab}_w${week-1}_${exId}`;
    if (adj[k]!==undefined) return adj[k];
    const ex = PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===exId);
    return ex ? ex.weights[wi-1] : 0;
  };

  const saveWeight = (day, wk, exId, val) => {
    if (!session) return;
    supabase.from("weight_adjustments").upsert({user_id:session.user.id,day,week:wk,exercise_id:exId,weight:val,updated_at:new Date().toISOString()},{onConflict:"user_id,day,week,exercise_id"});
  };

  const adjustW = (exId, wi, delta) => {
    const curr = getW(exId, wi);
    const next = Math.max(0, r25(curr + delta));
    const k = `${tab}_w${week}_${exId}`;
    setAdj(p => ({...p,[k]:next}));
    if (PR_EXERCISES.includes(exId) && next > (prs[exId]||0)) setPRs(p=>({...p,[exId]:next}));
    saveWeight(tab, week, exId, next);
  };

  const commitWeightEdit = (exId, wi) => {
    const v = parseFloat(editVal);
    if (!isNaN(v) && v >= 0) {
      const next = r25(v);
      const k = `${tab}_w${week}_${exId}`;
      setAdj(p => ({...p,[k]:next}));
      if (PR_EXERCISES.includes(exId) && next > (prs[exId]||0)) setPRs(p=>({...p,[exId]:next}));
      saveWeight(tab, week, exId, next);
    }
    setEditingW(null);
  };

  const getCompletedCount = (exId, totalSets, isBackoff=false) => {
    const pre = isBackoff ? `${tab}_w${week}_${exId}_bo` : `${tab}_w${week}_${exId}_s`;
    let count = 0;
    for (let i=0; i<totalSets; i++) { if (done[`${pre}${i}`]) count++; }
    return count;
  };

  const saveSetToDb = (day, wk, setKey, completed) => {
    if (!session) return;
    supabase.from("completed_sets").upsert({user_id:session.user.id,day,week:wk,set_key:setKey,completed,updated_at:new Date().toISOString()},{onConflict:"user_id,day,week,set_key"});
  };

  const completeNextSet = (exId, totalSets, groupRest, groupLabel, isBackoff=false) => {
    const pre = isBackoff ? `${tab}_w${week}_${exId}_bo` : `${tab}_w${week}_${exId}_s`;
    const dbPre = isBackoff ? `${exId}_bo` : `${exId}_s`;
    let nextIdx = 0;
    while (nextIdx < totalSets && done[`${pre}${nextIdx}`]) nextIdx++;
    if (nextIdx >= totalSets) return;
    const fullKey = `${pre}${nextIdx}`;
    setDone(p => ({...p,[fullKey]:true}));
    startTimer(groupRest, `${groupLabel} · Set ${nextIdx+1} done`);
    saveSetToDb(tab, week, `${dbPre}${nextIdx}`, true);
  };

  const undoLastSet = (exId, totalSets, isBackoff=false) => {
    const pre = isBackoff ? `${tab}_w${week}_${exId}_bo` : `${tab}_w${week}_${exId}_s`;
    const dbPre = isBackoff ? `${exId}_bo` : `${exId}_s`;
    let lastIdx = -1;
    for (let i=0; i<totalSets; i++) { if (done[`${pre}${i}`]) lastIdx = i; }
    if (lastIdx === -1) return;
    setDone(p => ({...p,[`${pre}${lastIdx}`]:false}));
    saveSetToDb(tab, week, `${dbPre}${lastIdx}`, false);
  };

  const changeWeek = (w) => {
    const c = Math.max(1,Math.min(12,w));
    setWeek(c); setAiRes(null); setFeedback(""); setW1Feedback(""); setW1AiRes(null); setMobOpen(true); skipTimer();
    if (session) supabase.from("user_progress").upsert({user_id:session.user.id,current_week:c,updated_at:new Date().toISOString()});
  };
  const changeTab = (t) => {
    setTab(t); setAiRes(null); setFeedback(""); setW1Feedback(""); setW1AiRes(null); setMobOpen(true); skipTimer(); setEditingW(null);
    if (session) supabase.from("user_progress").upsert({user_id:session.user.id,current_day:t,updated_at:new Date().toISOString()});
  };

  const applyAi = async (aiAdj) => {
    const n = {...adj}; const rows = [];
    for (const [id,w] of Object.entries(aiAdj)) {
      n[`${tab}_w${week}_${id}`] = w;
      rows.push({user_id:session?.user.id,day:tab,week,exercise_id:id,weight:w,updated_at:new Date().toISOString()});
    }
    setAdj(n); setAiRes(null); setFeedback("");
    if (session && rows.length) await supabase.from("weight_adjustments").upsert(rows,{onConflict:"user_id,day,week,exercise_id"});
  };

  const applyW1Recal = async (adjustments) => {
    const n = {...adj}; const rows = [];
    const changes = [];
    for (const [id, newW1] of Object.entries(adjustments)) {
      const oldW1 = getW(id, 0);
      const diff = newW1 - oldW1;
      const foundEx = PLAN[tab].groups.flatMap(g=>g.exercises).find(e=>e.id===id);
      if (diff !== 0) changes.push(`${foundEx?.name||id} ${diff>0?`+${diff}lbs`:`${diff}lbs`} to ${newW1}lbs`);
      for (let wk=1; wk<=12; wk++) {
        const baseW = adj[`${tab}_w${wk}_${id}`] ?? foundEx?.weights[wk-1] ?? newW1;
        const newW = Math.max(0, r25(baseW + diff));
        n[`${tab}_w${wk}_${id}`] = newW;
        rows.push({user_id:session?.user.id,day:tab,week:wk,exercise_id:id,weight:newW,updated_at:new Date().toISOString()});
      }
    }
    setAdj(n); setW1AiRes({...w1AiRes, applied:true, summary: changes.join(". ")});
    setW1Feedback("");
    if (session && rows.length) {
      for (let i=0; i<rows.length; i+=50) await supabase.from("weight_adjustments").upsert(rows.slice(i,i+50),{onConflict:"user_id,day,week,exercise_id"});
    }
  };

  const buildFeedbackPrompt = (summary, fbText, ids, wi) =>
    `Strength coach. Week ${week}/12, ${PHASES[wi]} phase.\n\nWorkout:\n${summary}\n\nFeedback: "${fbText}"\n\nReturn ONLY valid JSON, no markdown:\n{"analysis":"one sentence","adjustments":{/* id: weight_number. Only what needs changing. IDs: ${ids} */}}\n\nRules: round to 2.5lbs. Pull-up weight=added lbs (0=bodyweight). Conservative.`;

  const handleFeedback = async () => {
    if (!feedback.trim() || loading) return;
    setLoading(true); setAiRes(null);
    const day = PLAN[tab]; const wi = week-1;
    const summary = day.groups.flatMap(g=>g.exercises.map(ex=>{const w=getW(ex.id,wi);return `${ex.name}: ${ex.sets[wi]}x${ex.reps[wi]} @ ${ex.isPullup?(w===0?"bodyweight":`+${w}lbs`):`${w}lbs`}`;})).join("\n");
    const ids = day.groups.flatMap(g=>g.exercises.map(e=>e.id)).join(",");
    try {
      const res = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:buildFeedbackPrompt(summary,feedback,ids,wi)}]})});
      const data = await res.json();
      const text = data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setAiRes(parsed);
      if (session) await supabase.from("session_feedback").insert({user_id:session.user.id,day:tab,week,feedback,ai_response:parsed});
    } catch { setAiRes({analysis:"Could not process. Try again.",adjustments:{}}); }
    setLoading(false);
  };

  const handleW1Feedback = async () => {
    if (!w1Feedback.trim() || w1Loading) return;
    setW1Loading(true); setW1AiRes(null);
    const day = PLAN[tab];
    const summary = day.groups.flatMap(g=>g.exercises.map(ex=>{const w=getW(ex.id,0);return `${ex.name}: ${ex.sets[0]}x${ex.reps[0]} @ ${ex.isPullup?(w===0?"bodyweight":`+${w}lbs`):`${w}lbs`}`;})).join("\n");
    const ids = day.groups.flatMap(g=>g.exercises.map(e=>e.id)).join(",");
    const prompt = `Strength coach. End of Week 1, calibration complete. Athlete needs weeks 2-12 recalibrated.\n\nWeek 1 workout:\n${summary}\n\nFeedback: "${w1Feedback}"\n\nReturn ONLY valid JSON, no markdown:\n{"analysis":"one sentence","adjustments":{/* id: corrected_week1_baseline_weight. Only exercises that need adjustment. IDs: ${ids} */}}\n\nRules: round to 2.5lbs. Pull-up weight=added lbs. Conservative.`;
    try {
      const res = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      const text = data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      setW1AiRes(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setW1AiRes({analysis:"Could not process. Try again.",adjustments:{}}); }
    setW1Loading(false);
  };

  if (!authReady) return <div style={{background:"#080808",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:"12px"}}>Loading...</div>;
  if (!session) return <AuthScreen />;
  if (userProgress === undefined) return <div style={{background:"#080808",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#444",fontFamily:"'JetBrains Mono',monospace",fontSize:"12px"}}>Loading your plan...</div>;
  if (userProgress === null || !userProgress.setup_complete) return <OnboardingScreen session={session} onComplete={()=>loadProgress()} />;
  if (screen==="settings") return <SettingsScreen session={session} userProgress={userProgress} onBack={()=>setScreen("workout")} onSave={()=>{loadProgress();setScreen("workout");}} />;
  if (screen==="history") return <HistoryScreen session={session} adj={adj} onBack={()=>setScreen("workout")} />;

  const day = PLAN[tab]; const wi = week-1; const phase = PHASES[wi]; const pc = PHASE_COLORS[phase];
  const mobility = MOBILITY[tab];
  const userName = session.user.user_metadata?.display_name || session.user.email.split("@")[0];
  const motivMessages = MOTIVATIONAL[phase] || MOTIVATIONAL.Hypertrophy;
  const motiv = motivMessages[week % motivMessages.length];

  const allKeys = day.groups.flatMap(g=>g.exercises.flatMap(ex=>Array(ex.sets[wi]).fill(null).map((_,si)=>`${tab}_w${week}_${ex.id}_s${si}`)));
  const pct = allKeys.length>0 ? Math.round(allKeys.filter(k=>done[k]).length/allKeys.length*100) : 0;

  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#E0E0E0",fontFamily:"'Barlow Condensed','Impact',sans-serif",maxWidth:"480px",margin:"0 auto",paddingBottom:timer?"180px":"100px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; touch-action:pan-y; }
        html, body { overscroll-behavior:none; }
        textarea { caret-color:${day.accent}; }
        textarea:focus, input:focus { outline:none; border-color:${day.accent} !important; }
        button:active { opacity:0.75; transform:scale(0.96); }
        .cuebox { animation:fadeIn 0.15s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* HEADER */}
      <div style={{position:"sticky",top:0,zIndex:20,background:"#080808",borderBottom:"1px solid #1A1A1A",padding:"12px 16px 10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",letterSpacing:"2px"}}>12-WEEK PROGRAM</span>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",letterSpacing:"1.5px",background:pc+"18",color:pc,padding:"3px 8px",borderRadius:"2px"}}>{phase.toUpperCase()}</span>
            <button onClick={()=>setScreen("history")} style={{background:"none",border:"1px solid #222",color:"#555",width:"28px",height:"28px",borderRadius:"3px",cursor:"pointer",fontSize:"13px",lineHeight:1}}>📋</button>
            <button onClick={()=>setScreen("settings")} style={{background:"none",border:"1px solid #222",color:"#555",width:"28px",height:"28px",borderRadius:"3px",cursor:"pointer",fontSize:"14px",lineHeight:1}}>⚙</button>
            <button onClick={()=>supabase.auth.signOut()} style={{background:"none",border:"none",color:"#333",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",cursor:"pointer",letterSpacing:"1px"}}>{userName} · out</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
          {Object.entries(PLAN).map(([key,d]) => (
            <button key={key} onClick={()=>changeTab(key)} style={{flex:1,padding:"8px 4px",background:tab===key?d.accent:"#111",border:`1px solid ${tab===key?d.accent:"#222"}`,borderRadius:"3px",color:tab===key?"#000":"#555",fontSize:"13px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:tab===key?"700":"400",letterSpacing:"1px",cursor:"pointer",lineHeight:1.2,textAlign:"center"}}>
              {d.day}<br /><span style={{fontSize:"10px"}}>{d.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button onClick={()=>changeWeek(week-1)} style={{background:"none",border:"1px solid #222",color:"#666",width:"30px",height:"30px",borderRadius:"3px",fontFamily:"inherit",fontSize:"16px",cursor:"pointer",lineHeight:1}}>‹</button>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#888"}}>WEEK {week} / 12</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:pct===100?day.accent:"#444"}}>{pct}%</span>
            </div>
            <div style={{background:"#1A1A1A",borderRadius:"2px",height:"3px"}}><div style={{width:`${pct}%`,height:"100%",background:day.accent,borderRadius:"2px",transition:"width 0.3s ease"}} /></div>
          </div>
          <button onClick={()=>changeWeek(week+1)} style={{background:"none",border:"1px solid #222",color:"#666",width:"30px",height:"30px",borderRadius:"3px",fontFamily:"inherit",fontSize:"16px",cursor:"pointer",lineHeight:1}}>›</button>
        </div>
      </div>

      {/* MOTIVATIONAL */}
      <div style={{margin:"12px 16px 4px",padding:"10px 14px",background:"#0A0A0A",borderRadius:"6px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"15px",fontWeight:600,color:"#6B7280",letterSpacing:"0.3px",lineHeight:1.3}}>
        {motiv}
      </div>

      {/* COACHING NOTE */}
      <div style={{margin:"6px 16px 4px",padding:"10px 12px",borderLeft:`3px solid ${day.accent}`,background:day.accent+"0D",fontSize:"13px",color:"#888",lineHeight:1.4,fontFamily:"'Barlow Condensed',sans-serif"}}>{day.notes[wi]}</div>

      <div style={{padding:"0 16px",marginTop:"12px"}}>
        {/* MOBILITY */}
        <div style={{marginBottom:"20px"}}>
          <button onClick={()=>setMobOpen(p=>!p)} style={{width:"100%",background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <span style={{fontSize:"13px",color:"#6B7280",fontWeight:700,letterSpacing:"1.5px",fontFamily:"'Barlow Condensed',sans-serif"}}>PRE-WORKOUT MOBILITY</span>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444"}}>~2-3 min</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"12px",color:"#444"}}>{mobOpen?"▲":"▼"}</span>
            </div>
          </button>
          {mobOpen && mobility.map((move,mi) => (
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
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444"}}>{group.supersetted?"alternate":"all sets each"}</span>
                <button onClick={()=>startTimer(group.rest,`${group.label} · ${group.rest}`)} style={{background:"#151515",border:"1px solid #2A2A2A",borderRadius:"4px",color:"#666",padding:"4px 10px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",display:"flex",alignItems:"center",gap:"5px"}}>
                  <span>⏱</span><span>{parseRest(group.rest)}s</span>
                </button>
              </div>
            </div>

            {group.exercises.map((ex) => {
              const w      = getW(ex.id, wi);
              const prevW  = getPrevW(ex.id, wi);
              const s      = ex.sets[wi];
              const r      = ex.reps[wi];
              const bo     = ex.backoff[wi];
              const wLabel = ex.isPullup ? (w===0?"BW":`+${w}`) : `${w}`;
              const wSuffix= (ex.isPullup && w>0)?" lbs":(!ex.isPullup?" lbs":"");
              const isAdj  = adj[`${tab}_w${week}_${ex.id}`] !== undefined;
              const cues   = FORM_CUES[ex.id];
              const isOpen = cueOpen[ex.id];
              const isVideoOpen = videoOpen[ex.id];
              const delta  = (week>1 && prevW!==null) ? Math.round((w-prevW)*10)/10 : null;
              const dColor = delta>0?"#22C55E":delta<0?"#EF4444":"#555";
              const isPR   = PR_EXERCISES.includes(ex.id) && prs[ex.id] && w>0 && w>=prs[ex.id] && isAdj;
              const completedCount = getCompletedCount(ex.id, s, false);
              const boCount = bo ? getCompletedCount(ex.id, bo.sets, true) : 0;

              return (
                <div key={ex.id} style={{background:"#101010",border:"1px solid #1C1C1C",borderRadius:"6px",padding:"12px",marginBottom:"8px"}}>
                  {/* Name row */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                        <div style={{fontSize:"16px",fontWeight:700,color:"#D0D0D0"}}>{ex.name}</div>
                        {isPR && <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",background:day.accent,color:"#000",padding:"2px 6px",borderRadius:"3px",fontWeight:700,letterSpacing:"1px"}}>PR</span>}
                      </div>
                      {ex.note && <div style={{fontSize:"10px",color:"#555",fontFamily:"'JetBrains Mono',monospace",marginTop:"4px",lineHeight:1.5}}>{ex.note}</div>}
                    </div>
                    {cues && (
                      <button onClick={()=>setCueOpen(p=>({...p,[ex.id]:!p[ex.id]}))} style={{background:isOpen?day.accent+"22":"#1A1A1A",border:`1px solid ${isOpen?day.accent:"#2A2A2A"}`,borderRadius:"4px",color:isOpen?day.accent:"#555",width:"26px",height:"26px",cursor:"pointer",fontFamily:"inherit",fontSize:"13px",flexShrink:0,marginLeft:"8px",lineHeight:1}}>ⓘ</button>
                    )}
                  </div>

                  {/* Form cue + video panel */}
                  {isOpen && cues && (
                    <div className="cuebox" style={{marginBottom:"10px",padding:"10px 12px",background:"#0A0A0A",border:`1px solid ${day.accent}33`,borderRadius:"4px",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",lineHeight:1.6,color:"#888"}}>
                      <div style={{color:day.accent,fontWeight:600,marginBottom:"4px",fontSize:"10px",letterSpacing:"1px"}}>SETUP</div>
                      <div style={{marginBottom:"8px"}}>{cues.setup}</div>
                      <div style={{color:day.accent,fontWeight:600,marginBottom:"4px",fontSize:"10px",letterSpacing:"1px"}}>CUES</div>
                      <div style={{marginBottom:"10px"}}>{cues.cues}</div>
                      {VIDEOS[ex.id] && (
                        <>
                          <button onClick={()=>setVideoOpen(p=>({...p,[ex.id]:!p[ex.id]}))} style={{background:"none",border:`1px solid ${day.accent}44`,borderRadius:"4px",color:day.accent+"99",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",padding:"4px 10px",cursor:"pointer",letterSpacing:"0.5px"}}>
                            {isVideoOpen?"▲ hide demo":"▶ watch demo"}
                          </button>
                          {isVideoOpen && (
                            <div style={{marginTop:"8px",borderRadius:"4px",overflow:"hidden",position:"relative",paddingBottom:"56.25%",height:0}}>
                              <iframe
                                src={`https://www.youtube-nocookie.com/embed/${VIDEOS[ex.id]}?rel=0&modestbranding=1`}
                                style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
                                allowFullScreen
                                loading="lazy"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Sets × Reps @ Weight */}
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
                      <button onClick={()=>adjustW(ex.id,wi,-2.5)} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",color:"#666",width:"26px",height:"26px",borderRadius:"3px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:"14px",lineHeight:1}}>−</button>
                      <div style={{textAlign:"center",minWidth:"60px"}}>
                        {editingW === ex.id ? (
                          <input autoFocus type="number" inputMode="decimal" value={editVal} onChange={e=>setEditVal(e.target.value)} onBlur={()=>commitWeightEdit(ex.id,wi)} onKeyDown={e=>{if(e.key==='Enter')commitWeightEdit(ex.id,wi);}} style={{width:"70px",background:"#0A0A0A",border:`1px solid ${day.accent}`,borderRadius:"4px",color:day.accent,fontFamily:"'JetBrains Mono',monospace",fontSize:"18px",textAlign:"center",padding:"4px"}} />
                        ) : (
                          <div onClick={()=>{setEditingW(ex.id);setEditVal(String(w));}} style={{cursor:"pointer"}}>
                            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"24px",fontWeight:600,color:isAdj?day.accent:"#C0C0C0",lineHeight:1}}>
                              {wLabel}<span style={{fontSize:"11px",color:"#555"}}>{wSuffix}</span>
                            </div>
                            <div style={{fontSize:"9px",color:"#333",marginTop:"1px"}}>tap to edit</div>
                          </div>
                        )}
                      </div>
                      <button onClick={()=>adjustW(ex.id,wi,2.5)} style={{background:"#1A1A1A",border:"1px solid #2A2A2A",color:"#666",width:"26px",height:"26px",borderRadius:"3px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:"14px",lineHeight:1}}>+</button>
                    </div>
                  </div>

                  {/* Delta */}
                  {delta!==null && (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:dColor,marginBottom:"10px",paddingBottom:"8px",borderBottom:"1px solid #1A1A1A"}}>
                      {delta===0?`same as week ${week-1}`:delta>0?`+${delta}lbs vs week ${week-1}`:`${delta}lbs vs week ${week-1}`}
                    </div>
                  )}

                  {/* Back-off info */}
                  {bo && <div style={{marginBottom:"10px",padding:"6px 10px",background:"#0C0C0C",border:"1px dashed #252525",borderRadius:"4px",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555"}}>Back-off: {bo.sets} × {bo.reps} @ {bo.w}lbs</div>}

                  {/* SET TRACKER — main sets */}
                  <div style={{background:"#0A0A0A",borderRadius:"4px",padding:"10px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"}}>
                      {Array(s).fill(null).map((_,si) => (
                        <div key={si} style={{width:"10px",height:"10px",borderRadius:"50%",background:si<completedCount?day.accent:"#2A2A2A",border:`1px solid ${si<completedCount?day.accent:"#3A3A3A"}`,transition:"background 0.2s"}} />
                      ))}
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#555",marginLeft:"4px"}}>{completedCount}/{s} sets</span>
                    </div>
                    <div style={{display:"flex",gap:"6px"}}>
                      {completedCount < s ? (
                        <button onClick={()=>completeNextSet(ex.id,s,group.rest,group.label,false)} style={{flex:1,padding:"9px",background:day.accent,border:"none",borderRadius:"4px",color:"#000",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"13px",fontWeight:700,letterSpacing:"1.5px",cursor:"pointer"}}>
                          COMPLETE SET {completedCount+1}
                        </button>
                      ) : (
                        <div style={{flex:1,padding:"9px",background:"#0D200D",border:`1px solid ${day.accent}44`,borderRadius:"4px",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:day.accent}}>
                          ALL SETS DONE ✓
                        </div>
                      )}
                      {completedCount > 0 && (
                        <button onClick={()=>undoLastSet(ex.id,s,false)} style={{padding:"9px 12px",background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:"4px",color:"#666",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",cursor:"pointer"}}>UNDO</button>
                      )}
                    </div>
                  </div>

                  {/* SET TRACKER — back-off sets */}
                  {bo && (
                    <div style={{background:"#0A0A0A",borderRadius:"4px",padding:"10px",marginTop:"6px",border:"1px dashed #1A1A1A"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"}}>
                        {Array(bo.sets).fill(null).map((_,si) => (
                          <div key={si} style={{width:"8px",height:"8px",borderRadius:"50%",background:si<boCount?"#6B7280":"#2A2A2A",border:`1px solid ${si<boCount?"#6B7280":"#3A3A3A"}`}} />
                        ))}
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",marginLeft:"4px"}}>{boCount}/{bo.sets} back-off</span>
                      </div>
                      <div style={{display:"flex",gap:"6px"}}>
                        {boCount < bo.sets ? (
                          <button onClick={()=>completeNextSet(ex.id,bo.sets,group.rest,`${group.label} back-off`,true)} style={{flex:1,padding:"8px",background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:"4px",color:"#666",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"12px",fontWeight:700,letterSpacing:"1px",cursor:"pointer"}}>
                            BACK-OFF SET {boCount+1}
                          </button>
                        ) : (
                          <div style={{flex:1,padding:"8px",background:"#0D200D",border:"1px solid #22C55E22",borderRadius:"4px",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#22C55E44"}}>back-off done ✓</div>
                        )}
                        {boCount > 0 && <button onClick={()=>undoLastSet(ex.id,bo.sets,true)} style={{padding:"8px 10px",background:"#1A1A1A",border:"1px solid #2A2A2A",borderRadius:"4px",color:"#555",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",cursor:"pointer"}}>UNDO</button>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{padding:"10px 14px",marginBottom:"20px",background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:"6px",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#444"}}>+ Core finisher — your standard routine</div>

        {/* WEEK 1 DEBRIEF */}
        {week===1 && (
          <div style={{marginBottom:"20px"}}>
            <div style={{marginBottom:"8px",padding:"10px 12px",background:"#0C1A0C",border:"1px solid #22C55E22",borderRadius:"6px",fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#22C55E55",letterSpacing:"1px"}}>
              WEEK 1 — Submit a debrief after this workout to recalibrate weeks 2-12 for your actual strength level.
            </div>
            <div style={{background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:"6px",padding:"14px"}}>
              <div style={{fontSize:"13px",fontWeight:700,color:"#666",letterSpacing:"2px",marginBottom:"6px",fontFamily:"'Barlow Condensed',sans-serif"}}>WEEK 1 DEBRIEF</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#555",marginBottom:"10px",lineHeight:1.6}}>How did this workout feel? Describe any exercises that were too heavy, too light, or that need form work. The AI will recalibrate weeks 2-12 based on your feedback.</div>
              {w1AiRes?.applied ? (
                <div style={{padding:"12px",background:"#0A0A0A",border:"1px solid #22C55E33",borderRadius:"4px"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#22C55E",marginBottom:"6px",letterSpacing:"1px"}}>PLAN RECALIBRATED</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#888",lineHeight:1.6}}>{w1AiRes.summary}. Weeks 2-12 have been updated.</div>
                </div>
              ) : (
                <>
                  <textarea value={w1Feedback} onChange={e=>setW1Feedback(e.target.value)} placeholder={"How did it feel?\n\ne.g. \"bench was too heavy, row was too light, curls felt perfect\""} style={{width:"100%",minHeight:"80px",background:"#080808",border:"1px solid #222",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"12px",padding:"10px",resize:"vertical",lineHeight:1.5}} />
                  <button onClick={handleW1Feedback} disabled={w1Loading||!w1Feedback.trim()} style={{marginTop:"8px",width:"100%",padding:"11px",background:w1Loading||!w1Feedback.trim()?"#151515":"#22C55E",border:`1px solid ${w1Loading||!w1Feedback.trim()?"#222":"#22C55E"}`,borderRadius:"4px",color:w1Loading||!w1Feedback.trim()?"#444":"#000",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,letterSpacing:"2px",cursor:w1Loading||!w1Feedback.trim()?"not-allowed":"pointer"}}>
                    {w1Loading?"ANALYZING...":"RECALIBRATE WEEKS 2-12 →"}
                  </button>
                  {w1AiRes && !w1AiRes.applied && (
                    <div style={{marginTop:"12px",padding:"12px",background:"#080808",border:"1px solid #22C55E33",borderRadius:"4px"}}>
                      <div style={{fontSize:"13px",color:"#AAA",marginBottom:"10px",lineHeight:1.5}}>{w1AiRes.analysis}</div>
                      {Object.keys(w1AiRes.adjustments||{}).length>0 ? (
                        <>
                          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",marginBottom:"8px",letterSpacing:"1px"}}>PLAN RECALIBRATION — WEEKS 1-12</div>
                          {Object.entries(w1AiRes.adjustments).map(([id,nw]) => {
                            const fe = day.groups.flatMap(g=>g.exercises).find(e=>e.id===id);
                            const cw = getW(id,wi); const diff = Math.round((nw-cw)*10)/10;
                            return (
                              <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1A1A1A",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px"}}>
                                <span style={{color:"#777"}}>{fe?.name??id}</span>
                                <span style={{color:"#22C55E"}}>{nw}lbs <span style={{color:diff>0?"#22C55E":diff<0?"#EF4444":"#555",marginLeft:"6px"}}>{diff>0?`+${diff}`:diff<0?`${diff}`:"="}</span></span>
                              </div>
                            );
                          })}
                          <button onClick={()=>applyW1Recal(w1AiRes.adjustments)} style={{marginTop:"10px",width:"100%",padding:"9px",background:"#22C55E20",border:"1px solid #22C55E66",borderRadius:"4px",color:"#22C55E",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"13px",fontWeight:700,letterSpacing:"1.5px",cursor:"pointer"}}>
                            APPLY TO WEEKS 2-12
                          </button>
                        </>
                      ) : <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555"}}>Weights on target — no changes needed.</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* SESSION FEEDBACK (weeks 2+) */}
        {week > 1 && (
          <div style={{background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:"6px",padding:"14px",marginBottom:"20px"}}>
            <div style={{fontSize:"13px",fontWeight:700,color:"#666",letterSpacing:"2px",marginBottom:"10px",fontFamily:"'Barlow Condensed',sans-serif"}}>SESSION FEEDBACK</div>
            <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder={"How did it feel?\n\ne.g. \"bench was too easy, got 12 reps each set\""} style={{width:"100%",minHeight:"80px",background:"#080808",border:"1px solid #222",borderRadius:"4px",color:"#D0D0D0",fontFamily:"'JetBrains Mono',monospace",fontSize:"12px",padding:"10px",resize:"vertical",lineHeight:1.5}} />
            <button onClick={handleFeedback} disabled={loading||!feedback.trim()} style={{marginTop:"8px",width:"100%",padding:"11px",background:loading||!feedback.trim()?"#151515":day.accent,border:`1px solid ${loading||!feedback.trim()?"#222":day.accent}`,borderRadius:"4px",color:loading||!feedback.trim()?"#444":"#000",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"14px",fontWeight:700,letterSpacing:"2px",cursor:loading||!feedback.trim()?"not-allowed":"pointer"}}>
              {loading?"ANALYZING...":"ADJUST WEIGHTS →"}
            </button>
            {aiRes && (
              <div style={{marginTop:"12px",padding:"12px",background:"#080808",border:`1px solid ${day.accent}33`,borderRadius:"4px"}}>
                <div style={{fontSize:"13px",color:"#AAA",marginBottom:"10px",lineHeight:1.5}}>{aiRes.analysis}</div>
                {Object.keys(aiRes.adjustments||{}).length>0 ? (
                  <>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#444",marginBottom:"8px",letterSpacing:"1px"}}>SUGGESTED CHANGES</div>
                    {Object.entries(aiRes.adjustments).map(([id,nw]) => {
                      const fe = day.groups.flatMap(g=>g.exercises).find(e=>e.id===id);
                      const cw = getW(id,wi); const diff = Math.round((nw-cw)*10)/10;
                      return (
                        <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1A1A1A",fontFamily:"'JetBrains Mono',monospace",fontSize:"11px"}}>
                          <span style={{color:"#777"}}>{fe?.name??id}</span>
                          <span style={{color:day.accent}}>{nw}lbs <span style={{color:diff>0?"#22C55E":diff<0?"#EF4444":"#555",marginLeft:"6px"}}>{diff>0?`+${diff}`:diff<0?`${diff}`:"="}</span></span>
                        </div>
                      );
                    })}
                    <button onClick={()=>applyAi(aiRes.adjustments)} style={{marginTop:"10px",width:"100%",padding:"9px",background:day.accent+"20",border:`1px solid ${day.accent}66`,borderRadius:"4px",color:day.accent,fontFamily:"'Barlow Condensed',sans-serif",fontSize:"13px",fontWeight:700,letterSpacing:"1.5px",cursor:"pointer"}}>APPLY ALL CHANGES</button>
                  </>
                ) : <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:"#555"}}>Weights on target — no changes needed.</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <RestTimer timer={timer} accent={day.accent} onSkip={skipTimer} />
    </div>
  );
}
