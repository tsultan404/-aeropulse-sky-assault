/* AeroPulse: Sky Assault V6 — Original arcade shooter. Original 20 stage bosses and battle scenes. */
(()=>{'use strict';
const asset=(key,ext)=>window.__AERO_ASSETS?.[key]||`./assets/${key}.${ext}`;
const $=id=>document.getElementById(id), TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), rnd=(a,b)=>a+Math.random()*(b-a), pad=(n,k=2)=>String(n).padStart(k,'0');
const WORLDS=[
 {name:'BLUE SKY PATROL', short:'Sky Patrol',top:'#092968',mid:'#3286d6',low:'#efa6b0',accent:'#63edff',type:'cloud'},
 {name:'THUNDER FRONT',short:'Storm Front',top:'#0c113d',mid:'#43478e',low:'#a069aa',accent:'#a2dcff',type:'storm'},
 {name:'CANYON STRIKE',short:'Canyon Strike',top:'#422448',mid:'#c25c65',low:'#fabb71',accent:'#ffcc82',type:'canyon'},
 {name:'NEON CITY DEFENSE',short:'Neon Defense',top:'#070b33',mid:'#29317c',low:'#954b8b',accent:'#5cf4ec',type:'city'},
 {name:'ORBITAL SHOWDOWN',short:'Orbital Assault',top:'#050a23',mid:'#132a5a',low:'#403069',accent:'#f0acff',type:'space'}
];
const NAMES=['First Sortie','Sky Convoy','Missile Lane','Guardian of Clouds','High Voltage','Drone Ambush','Tempest Run','Thunder Bomber','Canyon Entry','Razor Ridge','Firestorm','Rock Fortress','Midnight Rush','Laser Alley','Neon Pursuit','City Sentinel','Outer Rim','Meteor Crossing','Enemy Armada','Final Sky Carrier'];
const LEVELS=NAMES.map((name,i)=>({n:i+1,name,world:Math.floor(i/4),segment:i%4,boss:true,
 duration:105+i*2,minBossTime:76+Math.min(38,i*2),enemyInterval:clamp(1.18-i*.025,.64,1.18),scroll:315+i*18,
 targetKills:10+i+(i%4),requiredSpecial:i%4===1?2+Math.floor(i/7):i%4===2?2+Math.floor(i/8):0,
 specialLabel:i%4===1?'JETS':i%4===2?'BOMBERS':'', mission:['BREAK THE ENEMY SQUADRON','INTERCEPT HOSTILE JETS','DESTROY BOMBER ESCORT','ELIMINATE THE SKY FORTRESS'][i%4],seed:3120+i*61}));
const BOSS_NAMES=["SKY RAZOR", "CLOUD WASP", "IRON FALCON", "CLOUD GUARDIAN", "STATIC PHANTOM", "STORM STINGER", "VOLT BREAKER", "THUNDER BOMBER", "CANYON MANTA", "SAND REAPER", "FIRE TALON", "ROCK FORTRESS", "NEON RIPPER", "CYBER WRAITH", "LASER MANTIS", "CITY SENTINEL", "COMET VANGUARD", "STAR DEVOURER", "ORBITAL EMPEROR", "FINAL SKY CARRIER"];
const SHIPS=[{name:'FALCON X',unlock:1,power:1},{name:'SKY VIPER',unlock:1,power:1.08},{name:'NOVA WING',unlock:1,power:1.13}];
const SAVE_KEY='aeropulse-sky-assault-v6';
const safeSave=(v)=>({version:3,highest:clamp(Math.floor(Number(v?.highest)||1),1,20),credits:clamp(Math.floor(Number(v?.credits)||0),0,999999),best:Math.max(0,Math.floor(Number(v?.best)||0)),selected:clamp(Math.floor(Number(v?.selected)||0),0,2),sound:v?.sound!==false,stars:v?.stars&&typeof v.stars==='object'?v.stars:{},endless:!!v?.endless,checkpoint:(v?.checkpoint&&Number(v.checkpoint.stage)>=1&&Number(v.checkpoint.stage)<=20)?v.checkpoint:null});
class SDK {
 constructor(){this.sdk=(typeof window.ytgame!=='undefined'&&window.ytgame.IN_PLAYABLES_ENV)?window.ytgame:null;this.audioAllowed=true;this.loaded=false;this.onPause=()=>{};this.onResume=()=>{};this.onAudio=()=>{};}
 init(){if(!this.sdk)return;let s=this.sdk.system;try{this.audioAllowed=Boolean(s.isAudioEnabled());s.onAudioEnabledChange(on=>{this.audioAllowed=!!on;this.onAudio(this.audioAllowed)});s.onPause(()=>this.onPause());s.onResume(()=>this.onResume());}catch(e){console.warn('SDK listeners',e)}}
 firstFrame(){try{this.sdk?.game.firstFrameReady()}catch(e){console.warn('SDK first frame',e)}}
 ready(){try{this.sdk?.game.gameReady()}catch(e){console.warn('SDK game ready',e)}}
 async load(){if(this.sdk){try{let raw=await this.sdk.game.loadData();this.loaded=true;return raw?JSON.parse(raw):null;}catch(e){console.warn('Cloud load failed',e);return null;}}
 try{return JSON.parse(localStorage.getItem(SAVE_KEY)||localStorage.getItem('aeropulse-sky-assault-v5')||'null')}catch{return null}}
 async save(data){let str=JSON.stringify(data);if(this.sdk){if(!this.loaded)return false;try{await this.sdk.game.saveData(str);return true}catch(e){console.warn('Cloud save failed',e);return false}}
 try{localStorage.setItem(SAVE_KEY,str);return true}catch{return false}}
 async score(v){if(!this.sdk)return;try{await this.sdk.engagement.sendScore({value:Math.floor(v)})}catch(e){console.warn('Score rejected',e)}}
}
class AudioFX{
 constructor(sdk){this.sdk=sdk;this.ctx=null;this.muted=false;this.lastShoot=0;}
 play(type){if(this.muted||!this.sdk.audioAllowed)return;try{this.ctx ||= new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});let t=this.ctx.currentTime;if(type==='shot'&&t-this.lastShoot<.22)return;if(type==='shot')this.lastShoot=t;
 const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=['boom','hit','boss','missile','bomb'].includes(type)?'sawtooth':'sine';let f={shot:790,coin:1120,star:1400,energy:610,bomb:130,boom:180,hit:160,win:960,lose:190,missile:540,shield:770,boss:210}[type]||450;
 o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(type==='boom'?75:f*(type==='star'?1.25:.56),t+.14);let vol=type==='shot'?.013:type==='boom'?.050:.038;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.19);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+.2);}catch{}}
 suspend(){this.ctx?.suspend().catch(()=>{})}
}
class Game{
 constructor(){this.canvas=$('screen');this.ctx=this.canvas.getContext('2d',{alpha:false});this.sdk=new SDK();this.sfx=new AudioFX(this.sdk);this.data=safeSave(null);
 this.mode='boot';this.playing=false;this.frozen=false;this.sdkSuspended=false;this.wasPlayingOnSdkPause=false;this.hold=false;this.downKey=false;this.upKey=false;this.aimY=null;this.pointerId=null;this.time=0;this.backTime=0;this.last=0;this.raf=0;
 this.W=1280;this.H=720;this.scale=1;this.portrait=false;this.images={};this.enemies=[];this.bullets=[];this.enemyBullets=[];this.pickups=[];this.particles=[];this.rings=[];
 this.pilot={x:240,y:330,hp:5,maxHP:5,shield:0,inv:0,missiles:4,bombs:3,score:0,coins:0,stars:0,kills:0,special:0,combo:0,comboClock:0};
 this.level=LEVELS[0];this.progress=0;this.waveNumber=0;this.waveClock=0;this.objectiveNotice=false;this.nextPulse=0;this.spawnClock=0;this.pickClock=0;this.fireClock=0;this.boss=null;this.bossSpawned=false;this.bossDead=false;this.waveFlash=0;this.shake=0;this.hintTime=0;this.toastTime=0;this.pausedExternally=false;this.lastMilestone=0;this.bossPhase=0;this.specialCooldown=0;this.missileCooldown=0;this.bombCooldown=0;this.endless=false;this.ammoClock=0;this.bossIntro=0;this.dpr=1;this.lastHudUpdate=0;
 this.setupEvents();this.resize();}
 setupEvents(){addEventListener('resize',()=>this.resize());
 // Pointer steering is absolute: touch/drag the sky or simply move the desktop mouse.
 // Weapon buttons never consume the flight pointer, so shooting and steering work together.
 const moveAim=e=>{if(this.mode!=='play'||this.frozen)return;
   if(e.pointerId===this.pointerId){
     const r=this.canvas.getBoundingClientRect();
     this.aimY=clamp(((e.clientY-r.top)/r.height)*this.H,this.portrait?195:130,this.H-(this.portrait?185:105));
   }};
 this.canvas.addEventListener('pointerdown',e=>{if(this.mode!=='play'||this.frozen||e.button!==0&&e.pointerType==='mouse')return;
   this.pointerId=e.pointerId;moveAim(e);this.canvas.setPointerCapture?.(e.pointerId);e.preventDefault();});
 this.canvas.addEventListener('pointermove',moveAim);
 const release=e=>{if(e.pointerId===this.pointerId){this.pointerId=null}};
 this.canvas.addEventListener('pointerup',release);this.canvas.addEventListener('pointercancel',release);
 addEventListener('blur',()=>{this.downKey=false;this.upKey=false;if(!this.sdk.sdk&&this.mode==='play')this.pause(true)});
 addEventListener('keydown',e=>{let keys=['Space','ArrowUp','ArrowDown','KeyW','KeyS','KeyJ','KeyK','KeyP','Escape','KeyM','KeyB'];
   if(keys.includes(e.code)&&e.code!=='Escape')e.preventDefault();
   if(['Space','ArrowUp','KeyW'].includes(e.code)){this.upKey=true;this.aimY=null}
   if(['ArrowDown','KeyS'].includes(e.code)){this.downKey=true;this.aimY=null}
   if(e.repeat)return;
   if(e.code==='KeyJ'||e.code==='KeyM')this.missile();if(e.code==='KeyK'||e.code==='KeyB')this.bomb();
   if(e.code==='KeyP'||e.code==='Escape'){if(this.mode==='play')this.pause();else if(this.mode==='pause')this.resume();}});
 addEventListener('keyup',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code))this.upKey=false;if(['ArrowDown','KeyS'].includes(e.code))this.downKey=false});
 $('pause').onclick=()=>this.pause();
 for(let [id,fn] of [['missileBtn',()=>this.missile()],['bombBtn',()=>this.bomb()]]){const button=$(id);button.addEventListener('pointerdown',e=>{e.stopPropagation();});button.addEventListener('click',e=>{e.stopPropagation();fn();});}
 // In YouTube only SDK onPause/onResume may control suspension. No visibility API.
 }
 resize(){let oldW=this.W||1280,oldH=this.H||720;this.cw=Math.max(1,innerWidth||1);this.ch=Math.max(1,innerHeight||1);this.portrait=this.ch>this.cw*1.05;this.W=this.portrait?750:1280;this.scale=this.cw/this.W;this.H=this.ch/this.scale;let dpr=Math.min(devicePixelRatio||1,this.portrait?1.4:1.7);this.dpr=dpr;this.canvas.width=Math.round(this.cw*dpr);this.canvas.height=Math.round(this.ch*dpr);this.ctx.setTransform(dpr*this.scale,0,0,dpr*this.scale,0,0);
 if(this.pilot){this.pilot.x=this.W*(this.portrait?.27:.24);this.pilot.y=clamp(this.pilot.y*this.H/oldH,185,this.H-(this.portrait?190:100));}if(oldW!==this.W||oldH!==this.H){for(let group of [this.enemies,this.bullets,this.enemyBullets,this.pickups,this.particles,this.rings])for(let o of group||[]){o.x*=this.W/oldW;o.y*=this.H/oldH}if(this.boss){this.boss.x*=this.W/oldW;this.boss.y*=this.H/oldH;this.boss.targetX=this.W*(this.portrait?.75:.79)}}}
 async boot(){this.sdk.init();this.sdk.onPause=()=>{this.wasPlayingOnSdkPause=this.mode==='play';if(this.wasPlayingOnSdkPause)this.pause(true);this.pausedExternally=true;this.sdkSuspended=true;this.sfx.suspend();this.sdk.save(this.data);if(this.raf)cancelAnimationFrame(this.raf);this.raf=0};this.sdk.onResume=()=>{this.pausedExternally=false;this.sdkSuspended=false;this.last=performance.now();if(this.wasPlayingOnSdkPause&&this.mode==='pause')this.resume();this.wasPlayingOnSdkPause=false;if(!this.raf)this.raf=requestAnimationFrame(v=>this.frame(v))};this.sdk.onAudio=()=>{};
 let names=['hero_0','hero_1','hero_2','scout','interceptor','bomber','alien_fighter','alien_saucer','alien_hunter','alien_drone','alien_dreadnought',...Array.from({length:5},(_,i)=>'boss_world_'+i),...Array.from({length:20},(_,i)=>'boss_v6_'+pad(i+1)),...Array.from({length:20},(_,i)=>'stage_bg_'+pad(i+1))];await Promise.all(names.map(name=>new Promise(resolve=>{let img=new Image();img.onload=()=>{this.images[name]=img;resolve()};img.onerror=()=>resolve();img.src=asset(name,name.startsWith('stage_bg_')?'webp':'png')})));
 this.draw(0);this.sdk.firstFrame();this.data=safeSave(await this.sdk.load());this.sfx.muted=!this.data.sound;this.menu();this.sdk.ready();this.last=performance.now();this.raf=requestAnimationFrame(t=>this.frame(t));}
 show(html){$('overlay').classList.remove('hidden');$('panel').innerHTML=html;$('hud').classList.add('hidden');$('weaponControls').classList.add('hidden');$('flyHint').classList.add('hidden');}
 hide(){ $('overlay').classList.add('hidden');$('hud').classList.remove('hidden');$('weaponControls').classList.remove('hidden');$('flyHint').classList.remove('hidden');}
 btn(label,id,variant='',extra=''){return `<button class="btn ${variant} ${extra}" id="${id}">${label}</button>`}
 menu(){this.mode='menu';this.hold=false;this.playing=false;this.show(`<div class="topline">✦ ORIGINAL ARCADE AIR COMBAT · BOSS GAUNTLET V6</div><h1 class="brand">AERO<span class="highlight">PULSE</span><em>SKY ASSAULT</em></h1><p class="lead">Pilot a futuristic fighter. Auto-fire on enemy jets, dodge missiles, launch smart rockets and face a UNIQUE heavily armed boss at the end of EACH of the 20 escalating stages.</p><div class="stat-row"><div class="stat-chip">✦ LEVEL <b>${this.data.highest}/20</b></div><div class="stat-chip">◉ COINS <b>${this.data.credits}</b></div><div class="stat-chip">★ BEST <b>${this.data.best}</b></div></div><div class="menu-buttons">${this.btn('▶ PLAY NOW','start','primary wide')}${this.data.checkpoint?this.btn('↻ CONTINUE LAST MISSION','continue','teal wide'):''}${this.btn('20 STAGES','stages')}${this.btn('HANGAR','hangar')}${this.btn('HOW TO PLAY','help')}${this.btn('SOUND: '+(this.data.sound?'ON':'OFF'),'sound')}${this.data.endless?this.btn('∞ SURVIVAL','endless','','wide'):''}</div><p class="tiny">AUTO-FIRE ON · Tap/drag sky or use Arrow keys · AUTO-FIRE ON · J Missile · K Bomb · Arrow keys</p>`);
 $('start').onclick=()=>this.hangar(true);if($('continue'))$('continue').onclick=()=>this.continueCheckpoint();$('stages').onclick=()=>this.stageMenu();$('hangar').onclick=()=>this.hangar();$('help').onclick=()=>this.help();$('sound').onclick=()=>{this.data.sound=!this.data.sound;this.sfx.muted=!this.data.sound;this.sdk.save(this.data);this.menu()};if($('endless'))$('endless').onclick=()=>this.start(20,true);}
 help(){this.mode='help';this.show(`<div class="topline">PILOT SCHOOL</div><h2>Fly, Shoot & Survive</h2><p class="lead"><strong>AUTO-FIRE:</strong> Your jet shoots automatically. Drag the sky to steer vertically, then RELEASE to hold position. On desktop use a mouse drag/click or ↑/↓ arrows or W/S. Moving the mouse to the weapon buttons will NOT change altitude. The jet STAYS at your last chosen altitude. You can tap MISSILE and BOMB independently while steering.</p><div class="stat-row"><span class="stat-chip">J / MISSILE: homing strike</span><span class="stat-chip">K / BOMB: screen blast</span><span class="stat-chip">★ Stars: bonus score</span><span class="stat-chip">◉ Coins: rewards</span><span class="stat-chip">✦ Shield: extra protection</span><span class="stat-chip">✚ Repair: extra health</span></div><p class="lead">Every stage has attack waves and a required number of enemy takedowns. The timer alone never ends a stage. EVERY stage finishes with a different giant boss; defeat it to advance. Bombs refill via orange pickups and takedowns. On death choose CONTINUE FROM CHECKPOINT or RESTART STAGE. You keep your unlocked stages even when you lose. No payments, sign-in or external downloads.</p><div class="menu-buttons">${this.btn('START STAGE 1','start','primary wide')}${this.btn('BACK','back','','wide')}</div>`);$('start').onclick=()=>this.start(1);$('back').onclick=()=>this.menu();}
 stageMenu(){this.mode='stages';let html='<div class="topline">MISSION BOARD</div><h2>20 STAGES · 5 WORLDS</h2><p class="lead">Every mission has a target number of takedowns, escalating waves and a different boss battle; stages never auto-complete on a countdown. Replay unlocked stages to improve your rating.</p>';
 for(let w=0;w<5;w++){html+=`<div class="sectionlabel">WORLD ${w+1} — ${WORLDS[w].name}</div><div class="stages">`;for(let i=0;i<4;i++){let l=w*4+i+1,un=l<=this.data.highest;html+=`<button data-stage="${l}" class="stagebtn ${l===this.data.highest?'current':''}" ${un?'':'disabled'}>${pad(l)}${un?`<small><br>${'★'.repeat(this.data.stars[l]||0)||'○'}</small>`:''}</button>`}html+='</div>'}
 html+=`<div class="menu-buttons">${this.btn('BACK TO MENU','back','','wide')}</div>`;this.show(html);this.mode='stages';document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>this.start(+b.dataset.stage));$('back').onclick=()=>this.menu();}
 hangar(startAfter=false){this.mode='hangar';let items=SHIPS.map((s,i)=>`<button class="garage-item ${this.data.selected===i?'selected':''}" id="ship${i}" ${''}><img src="${asset('hero_'+i,'png')}" alt="${s.name}"><strong>${s.name}</strong><small>${`POWER ${(s.power*100).toFixed(0)}% · READY`}</small></button>`).join('');this.show(`<div class="topline">THE PILOT'S HANGAR</div><h2>Choose Your Fighter</h2><p class="lead">Three original vector jet designs with visible pilots. All three original pilot-operated fighters are available from the first mission. Pick the aircraft you like best.</p><div class="garage-items">${items}</div><div class="stat-row"><span class="stat-chip">✓ ALL 3 FIGHTERS AVAILABLE FROM START</span><span class="stat-chip">Change aircraft any time in the hangar</span></div><div class="menu-buttons">${this.btn('PLAY','play','primary')}${this.btn('BACK','back')}</div>`);SHIPS.forEach((s,i)=>{const b=$('ship'+i);if(b&&!b.disabled)b.onclick=()=>{this.data.selected=i;this.sdk.save(this.data);this.hangar(startAfter)}});$('play').onclick=()=>this.start(this.data.highest);$('back').onclick=()=>this.menu();}
 start(n,endless=false){if(!endless&&n>this.data.highest)n=this.data.highest;this.level=LEVELS[clamp(n-1,0,19)];this.endless=endless;this.mode='play';this.playing=true;this.frozen=false;this.hold=false;this.downKey=false;this.upKey=false;this.aimY=this.H*.50;this.enemies=[];this.bullets=[];this.enemyBullets=[];this.pickups=[];this.particles=[];this.rings=[];
 this.pilot={x:this.W*(this.portrait?.25:.22),y:this.H*.50,vy:0,hp:5,maxHP:5,shield:0,inv:2.3,missiles:5,bombs:3,score:0,coins:0,stars:0,kills:0,special:0,combo:0,comboClock:0};
 this.progress=0;this.waveNumber=0;this.waveClock=0;this.objectiveNotice=false;this.nextPulse=0;this.fireClock=0;this.spawnClock=2;this.pickClock=.6;this.boss=null;this.bossSpawned=false;this.bossDead=false;this.waveFlash=0;this.shake=0;this.hintTime=10;this.lastMilestone=0;this.bossPhase=0;this.specialCooldown=0;this.missileCooldown=0;this.bombCooldown=0;this.ammoClock=0;this.bossIntro=0;this.lastHudUpdate=0;
 this.data.checkpoint=null;this.spawnEnemy();this.enemies[this.enemies.length-1].x=this.W*.84;this.enemies[this.enemies.length-1].y=this.H*.35;this.spawnEnemy();this.enemies[this.enemies.length-1].x=this.W*1.02;this.enemies[this.enemies.length-1].y=this.H*.65;this.hide();$('lv').textContent=endless?'SURVIVAL':`LEVEL ${pad(this.level.n)}`;$('world').textContent=WORLDS[this.level.world].name;$('stageLabel').textContent=this.level.name.toUpperCase();$('bossHud').classList.add('hidden');this.toast(endless?'SURVIVAL MODE':`MISSION ${pad(this.level.n)}: ${this.level.mission} · ${this.level.targetKills} TAKEDOWNS`);this.syncHUD();}
 // A checkpoint stores exact combat progress and boss HP, not merely the unlocked stage.
 snapshot(){const p=this.pilot;return {stage:this.level.n,progress:this.progress,kills:p.kills,special:p.special,score:p.score,coins:p.coins,stars:p.stars,missiles:p.missiles,bombs:p.bombs,pilotY:p.y,selected:this.data.selected,waveNumber:this.waveNumber,waveClock:this.waveClock,spawnClock:this.spawnClock,pickClock:this.pickClock,bossSpawned:this.bossSpawned,bossHP:this.boss?.hp||0,bossMaxHP:this.boss?.maxHP||0,bossX:this.boss?.x||0,bossY:this.boss?.y||0,bossPhase:this.bossPhase,enemyState:this.enemies.slice(0,25).map(e=>({type:e.type,x:e.x,y:e.y,hp:e.hp,maxHP:e.maxHP,vx:e.vx,r:e.r,wave:e.wave,swing:e.swing,seed:e.seed,shotClock:e.shotClock})),world:this.level.world};}
 checkpoint(label='CHECKPOINT SAVED'){if(this.endless||this.mode!=='play')return;this.data.checkpoint=this.snapshot();this.sdk.save(this.data);this.toast(label);}
 continueCheckpoint(){const cp=this.data.checkpoint;if(!cp||cp.stage<1||cp.stage>20)return this.menu();const keep={...cp};this.start(keep.stage);
 this.progress=Math.max(0,Number(keep.progress)||0);this.waveNumber=Math.max(0,Number(keep.waveNumber)||0);this.waveClock=Number(keep.waveClock)||0;this.spawnClock=1.5;this.pickClock=.7;
 let p=this.pilot;p.y=clamp(Number(keep.pilotY)||this.H*.5,this.portrait?190:135,this.H-(this.portrait?185:100));this.aimY=p.y;p.kills=Number(keep.kills)||0;p.special=Number(keep.special)||0;p.score=Math.floor((Number(keep.score)||0)*.9);p.coins=Number(keep.coins)||0;p.stars=Number(keep.stars)||0;p.hp=3;p.inv=4;p.shield=3;p.missiles=Math.max(2,Number(keep.missiles)||0);p.bombs=Math.max(1,Number(keep.bombs)||0);
 this.data.selected=clamp(Number(keep.selected)||0,0,2);this.lastMilestone=p.kills>=Math.max(2,Math.floor(this.level.targetKills*.48))?1:0;
 this.bullets=[];this.enemyBullets=[];this.pickups=[];this.enemies=(Array.isArray(keep.enemyState)?keep.enemyState:[]).slice(0,24).filter(e=>e&&Number(e.hp)>0).map(e=>({...e,seed:Number(e.seed)||0,shotClock:1.8}));
 if(keep.bossSpawned){this.spawnBoss(true);this.boss.hp=clamp(Number(keep.bossHP)||this.boss.maxHP*.5,1,this.boss.maxHP);this.boss.x=clamp(Number(keep.bossX)||this.boss.targetX,this.W*.60,this.W*1.1);this.boss.y=clamp(Number(keep.bossY)||this.H*.46,this.H*.2,this.H*.82);this.bossPhase=Number(keep.bossPhase)||0;this.bossIntro=2.5;}
 this.data.checkpoint=this.snapshot();this.sdk.save(this.data);this.toast('SAME STAGE · RESUMED AT YOUR POSITION · SHIELD ON');this.syncHUD();}
 pause(external=false){if(this.mode!=='play')return;this.mode='pause';this.pointerId=null;this.upKey=false;this.downKey=false;this.sfx.suspend();this.data.checkpoint=this.snapshot();this.sdk.save(this.data);this.show(`<div class="topline">FLIGHT PAUSED</div><h2>Ready to Fly?</h2><p class="lead">Your progress in this stage is paused. Resume when ready, or restart the mission.</p><div class="menu-buttons">${this.btn('▶ RESUME','resume','primary wide')}${this.btn('RETRY','retry')}${this.btn('MAIN MENU','menu')}</div>`);$('resume').onclick=()=>this.resume();$('retry').onclick=()=>this.start(this.level.n,this.endless);$('menu').onclick=()=>this.menu();}
 resume(){if(this.mode!=='pause'||this.pausedExternally)return;this.mode='play';this.hide();this.last=performance.now();}
 toast(msg){$('toast').textContent=msg;$('toast').classList.remove('hidden');this.toastTime=2.5;}
 frame(t){this.raf=0;if(this.sdkSuspended)return;let dt=clamp((t-this.last)/1000||0,0,.034);this.last=t;this.backTime+=dt;if(this.mode==='play'&&!this.frozen)this.step(dt);this.draw(dt);this.raf=requestAnimationFrame(v=>this.frame(v));}
 step(dt){let p=this.pilot,L=this.level;this.time+=dt;this.progress+=dt;this.waveClock+=dt;this.hintTime=Math.max(0,this.hintTime-dt);this.toastTime-=dt;if(this.toastTime<=0)$('toast').classList.add('hidden');
 this.missileCooldown=Math.max(0,this.missileCooldown-dt);this.bombCooldown=Math.max(0,this.bombCooldown-dt);this.specialCooldown=Math.max(0,this.specialCooldown-dt);this.ammoClock+=dt;if(this.ammoClock>=22){this.ammoClock=0;if(p.bombs<4){p.bombs++;this.toast('BOMB RECHARGED +1')}if(p.missiles<6)p.missiles+=2;}p.inv=Math.max(0,p.inv-dt);p.comboClock=Math.max(0,p.comboClock-dt);if(p.comboClock<=0)p.combo=0;p.shield=Math.max(0,p.shield-dt);
 // Direct flight controls: no forced falling, no held mouse necessary.
 let agility=SHIPS[this.data.selected].power,lo=this.portrait?190:125,hi=this.H-(this.portrait?175:90);
 if(this.upKey||this.downKey){p.vy=(this.downKey?1:-1)*630*agility;p.y=clamp(p.y+p.vy*dt,lo,hi);this.aimY=p.y;}
 else if(this.aimY!==null){let dy=this.aimY-p.y;p.vy=clamp(dy*9,-720*agility,720*agility);p.y=clamp(p.y+p.vy*dt,lo,hi)}
 else p.vy=0;
 this.fireClock-=dt;if(this.fireClock<=0){this.fireClock=.115;for(let i=-1;i<=1;i+=2){let vy=i*5;this.bullets.push({x:p.x+96,y:p.y+i*13,vx:1250,vy,r:7,damage:15,kind:'gun'});}if(this.time%1<.2)this.sfx.play('shot')}
 // Enemy waves unlock additional formations and more pressure as the mission progresses.
 if(this.waveClock>=13){this.waveClock=0;this.waveNumber++;this.launchWave();}
 this.spawnClock-=dt;if(this.spawnClock<=0){this.spawnEnemy();this.spawnClock=(this.boss?L.enemyInterval*2:L.enemyInterval)*rnd(.76,1.11);}
 // No timer-based stage clears. Every stage has a squad goal followed by a unique boss.
 if(p.kills>=Math.max(2,Math.floor(L.targetKills*.48))&&this.lastMilestone===0){this.lastMilestone=1;this.checkpoint('HALFWAY CHECKPOINT SAVED');}
 if(p.kills<L.targetKills||p.special<L.requiredSpecial){this.spawnClock=Math.min(this.spawnClock,L.enemyInterval);}
 this.pickClock-=dt;if(this.pickClock<=0){this.spawnPickups();this.pickClock=rnd(1.7,2.5)}
 if(!this.endless&&!this.bossSpawned&&p.kills>=L.targetKills&&p.special>=L.requiredSpecial&&this.progress>=L.minBossTime){this.spawnBoss();this.checkpoint('BOSS CHECKPOINT SAVED · FULL RESUPPLY');}
 if(this.boss){this.bossIntro=Math.max(0,this.bossIntro-dt);this.boss.y=clamp(this.H*.46+Math.sin(this.time*(1.0+L.n*.02))*Math.min(115,this.H*.16),this.portrait?275:180,this.H-180);this.boss.x+=(this.boss.targetX-this.boss.x)*dt*1.65;this.boss.shotClock-=dt;
  if(this.boss.shotClock<=0&&this.bossIntro<=0){this.boss.shotClock=clamp(1.66-L.n*.045,.58,1.65);this.attackBoss();}
  if(this.boss.hp<this.boss.maxHP*.5&&this.bossPhase===0){this.bossPhase=1;this.toast('⚠ BOSS PHASE TWO · HEAVY MISSILES!');this.boss.shotClock=.2;}}
 for(let o of this.enemies){o.x+=o.vx*dt;o.y+=Math.sin(this.time*o.wave+o.seed)*o.swing*dt*2.2;o.shotClock-=dt;if(o.shotClock<=0&&o.type!=='asteroid'&&o.type!=='mine'){o.shotClock=clamp(rnd(1.15,2.5)-L.n*.035,.65,2.6);this.enemyBullet(o.x-35,o.y,0,L.world,o.type==='bomber'?'bomb':o.type==='hunter'?'missile':null)}}
 for(let b of this.enemyBullets){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.kind==='bomb')b.vy+=30*dt}
 for(let s of this.bullets){if(s.kind==='missile'){let t=this.findTarget(s.x,s.y);if(t){let a=Math.atan2(t.y-s.y,t.x-s.x);s.vx+=(Math.cos(a)*670-s.vx)*dt*2;s.vy+=(Math.sin(a)*670-s.vy)*dt*2;}s.trail=(s.trail||0)+dt; if(s.trail>.03){s.trail=0;this.particle(s.x,s.y,'#ffbc56',2)}}s.x+=s.vx*dt;s.y+=s.vy*dt}
 for(let a of this.pickups){a.x-=((this.portrait?270:325)+L.scroll*.22)*dt;a.phase+=dt*2;if(a.x<this.W*.4&&a.type==='magnet')a.y+=(p.y-a.y)*dt*.5;}
 for(let q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.gravity*dt;q.life-=dt}for(let r of this.rings){r.life-=dt;r.radius+=r.speed*dt}
 this.collision();this.enemies=this.enemies.filter(e=>e.hp>0&&e.x>-150&&e.y>-130&&e.y<this.H+130);this.enemyBullets=this.enemyBullets.filter(e=>e.x>-120&&e.x<this.W+90&&e.y>-90&&e.y<this.H+90);this.bullets=this.bullets.filter(e=>e.x<this.W+180&&e.x>-50&&e.y>-40&&e.y<this.H+40);this.pickups=this.pickups.filter(e=>e.x>-80);this.particles=this.particles.filter(e=>e.life>0);this.rings=this.rings.filter(e=>e.life>0);
 // Objective-gated: elapsed time alone can NEVER finish a stage.
 if(!this.endless&&this.bossDead&&p.kills>=L.targetKills&&p.special>=L.requiredSpecial&&this.mode==='play')this.win();this.syncHUD();}
 spawnEnemy(){const diff=this.level.n;if(this.enemies.length>=24)return;let z=Math.random();let type=z<.14?'alien':z<.26?'saucer':z<.39?'hunter':z<.50?'drone':z<.66?'scout':z<.80?'interceptor':z<.91?'bomber':z<.96?'asteroid':'mine';if(diff<=2&&type==='bomber')type='saucer';if(this.level.segment===2&&z>.71)type='bomber';if(this.level.world===4&&z<.25)type='alien';if(this.progress>=this.level.minBossTime&&this.pilot.special<this.level.requiredSpecial)type=this.level.segment===1?'interceptor':'bomber';
 let y=rnd(this.portrait?225:170,this.H-(this.portrait?255:165));let hp={alien:48,saucer:44,hunter:62,drone:35,bomber:90,asteroid:48,mine:34,interceptor:42,scout:32}[type]+diff*3;
 let e={type,x:this.W+120,y,hp,maxHP:hp,vx:-rnd(320+diff*7,480+diff*10),r:type==='bomber'?47:type==='mine'?32:type==='saucer'?42:type==='hunter'?43:34,wave:rnd(1,2.3),swing:rnd(15,39),seed:rnd(0,TAU),shotClock:rnd(.55,1.6)};this.enemies.push(e);
 if(diff>=12&&Math.random()<.10&&this.enemies.length<22)this.enemies.push({...e,x:e.x+115,y:clamp(y+110,190,this.H-160),seed:rnd(0,TAU)});
 }
 launchWave(){
 const L=this.level;const formation=['V-SQUADRON','MISSILE CROSSING','ARMORED CONVOY','INTERCEPTOR SWARM','DRONE AMBUSH'][this.waveNumber%5];
 this.toast(`WAVE ${this.waveNumber+1} · ${formation}`);
 const count=2+Math.min(3,Math.floor(L.n/6));
 for(let i=0;i<count;i++){
   this.spawnEnemy();let e=this.enemies[this.enemies.length-1];
   e.x=this.W+80+i*110;
   e.y=clamp(this.H*(.26+(i%3)*.20),this.portrait?225:145,this.H-(this.portrait?250:150));
   if(this.waveNumber%3===1&&L.n>2){e.type='alien';e.hp=e.maxHP=36+L.world*9;e.vx=-280-L.world*30;}
   if(this.waveNumber%3===2&&L.n>4){e.type='bomber';e.hp=e.maxHP=70+L.world*12;e.r=43;}
 }
 this.rings.push({x:this.W*.9,y:this.H*.48,radius:10,life:.7,maxLife:.7,speed:150,color:'#ffca69'});
 }
 spawnPickups(){let types=['coin','star','star','energy','missileAmmo','missileAmmo','bombAmmo','bombAmmo','bombAmmo','repair','shield'];let type=types[Math.floor(Math.random()*types.length)];let y=rnd(this.portrait?240:155,this.H-(this.portrait?255:180));let x=this.W+55;this.pickups.push({type,x,y,phase:rnd(0,TAU),r:type==='coin'?20:24});if(type==='coin'&&Math.random()<.65)this.pickups.push({type:'coin',x:x+62,y:y+35,phase:0,r:20});}
 enemyBullet(x,y,spread,level,kindOverride=null){let p=this.pilot,dx=p.x-x,dy=p.y-y,ang=Math.atan2(dy,dx)+spread+Math.random()*.16-.08,sp=clamp(290+this.level.n*10+level*18,310,560);if(this.enemyBullets.length>=72)return;this.enemyBullets.push({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:kindOverride==='bomb'?17:11,kind:kindOverride||(level>=1&&Math.random()<.60?'missile':'orb')});}
 spawnBoss(restored=false){let hp=1550+this.level.n*125;this.boss={x:this.W+260,targetX:this.W*(this.portrait?.75:.79),y:this.H*.46,hp,maxHP:hp,shotClock:restored?2.5:3.3,world:this.level.world,r:this.portrait?125:150,pattern:(this.level.n-1)%5};this.bossSpawned=true;this.bossIntro=restored?2:3.5;
  if(!restored){this.pilot.bombs=Math.min(5,this.pilot.bombs+1);this.pilot.missiles=Math.min(9,this.pilot.missiles+2);this.toast('⚠ '+BOSS_NAMES[this.level.n-1]+' INCOMING! · +1 BOMB · +2 MISSILES');this.sfx.play('boss');}
  $('bossHud').classList.remove('hidden');$('bossName').textContent=`STAGE ${pad(this.level.n)} · ${BOSS_NAMES[this.level.n-1]}`;this.syncHUD();}
 attackBoss(){if(!this.boss)return;const b=this.boss,L=this.level,phase=this.bossPhase;const n=1+(L.n-1)%5;
  if(n===1){for(let spread of [-.36,0,.36])this.enemyBullet(b.x-100,b.y,spread,L.world+2);}
  else if(n===2){for(let spread of [-.48,-.24,0,.24,.48])this.enemyBullet(b.x-90,b.y,spread,L.world+1);}
  else if(n===3){this.enemyBullet(b.x-95,b.y-42,-.10,L.world+3);this.enemyBullet(b.x-95,b.y+42,.10,L.world+3);this.enemyBullet(b.x-110,b.y,0,L.world+3);}
  else if(n===4){for(let spread of [-.5,-.27,.27,.5])this.enemyBullet(b.x-110,b.y,spread,L.world+2);}
  else{this.enemyBullet(b.x-110,b.y-.4*80,-.2,L.world+3,'bomb');this.enemyBullet(b.x-110,b.y+.4*80,.2,L.world+3,'bomb');this.enemyBullet(b.x-110,b.y,0,L.world+3);}
  if(phase===1){this.enemyBullet(b.x-105,b.y,-.59,L.world+4);this.enemyBullet(b.x-105,b.y,.59,L.world+4);}
  if(L.n>=3&&Math.random()<.29){this.spawnEnemy();let e=this.enemies[this.enemies.length-1];e.type='alien';e.x=b.x-90;e.y=clamp(b.y+rnd(-80,80),this.portrait?230:155,this.H-(this.portrait?235:160));e.hp=e.maxHP=38+L.world*12;}
 }
 findTarget(x,y){let targets=[...this.enemies.filter(e=>e.hp>0),...(this.boss?[this.boss]:[])];targets=targets.filter(e=>e.x>x);targets.sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));return targets[0]||null}
 missile(){if(this.mode!=='play'||this.pilot.missiles<=0||this.missileCooldown>0)return;this.missileCooldown=.3;this.pilot.missiles--;let p=this.pilot;this.bullets.push({kind:'missile',x:p.x+84,y:p.y,vx:580,vy:0,r:13,damage:100,trail:0});this.sfx.play('missile');this.rings.push({x:p.x+80,y:p.y,radius:4,life:.35,maxLife:.35,speed:135,color:'#ffd76c'});this.syncHUD();}
 bomb(){if(this.mode!=='play'||this.pilot.bombs<=0||this.bombCooldown>0)return;this.bombCooldown=.65;let p=this.pilot;p.bombs--;this.sfx.play('bomb');this.shake=16;this.waveFlash=.38;this.rings.push({x:this.W*.52,y:this.H*.5,radius:40,life:.9,maxLife:.9,speed:this.W*.9,color:'#f7bdff'});this.enemyBullets.length=0;let kills=[...this.enemies];for(let e of kills)this.damage(e,200);if(this.boss)this.damage(this.boss,90);this.syncHUD();}
 particle(x,y,color,count=12){if(this.particles.length>180)this.particles.splice(0,this.particles.length-140);for(let i=0;i<Math.min(18,count);i++){let ang=rnd(0,TAU),sp=rnd(40,230);this.particles.push({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:rnd(.28,.8),maxLife:.8,color,r:rnd(2,7),gravity:rnd(-10,25)})}}
 damage(target,amount){if(!target||target.hp<=0)return;target.hp-=amount;this.particle(target.x,target.y,'#ffc258',Math.min(5,Math.floor(amount/8)));if(target.hp<=0){this.particle(target.x,target.y,'#ff6a42',32);this.particle(target.x,target.y,'#ffdc75',14);this.shake=Math.max(this.shake,8);this.sfx.play('boom');if(target===this.boss){this.boss=null;this.bossDead=true;this.toast('BOSS DESTROYED · SECURE THE MISSION!');$('bossHud').classList.add('hidden');this.pilot.score+=5000;this.pilot.coins+=40;this.pickups.push(...Array.from({length:7},(_,i)=>({type:'star',x:this.W*.64+i*27,y:this.H*.45+Math.sin(i)*100,phase:0,r:24})));}else{this.pilot.kills++;if(this.pilot.kills%7===0){this.pilot.bombs=Math.min(5,this.pilot.bombs+1);this.toast('BOMB RESUPPLY +1');}if(this.pilot.kills%4===0){this.pilot.missiles=Math.min(9,this.pilot.missiles+1);}if((this.level.segment===1&&['scout','interceptor','alien','hunter','saucer'].includes(target.type))||(this.level.segment===2&&target.type==='bomber'))this.pilot.special++;this.pilot.combo++;this.pilot.comboClock=4;this.pilot.score+=(target.type==='asteroid'?160:250)*(1+Math.min(4,Math.floor(this.pilot.combo/4)));if(this.pilot.combo>3)this.toast(`COMBO ×${1+Math.floor(this.pilot.combo/4)}`);}}
 }
 takeHit(n=1){let p=this.pilot;if(p.inv>0||p.shield>0)return;p.hp-=n;p.inv=1.35;this.shake=14;this.waveFlash=.16;this.particle(p.x,p.y,'#f55a7f',19);this.sfx.play('hit');this.toast('HULL DAMAGE!');if(p.hp<=0)this.lose();}
 collision(){let p=this.pilot;const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 for(let b of this.bullets){if(b.dead)continue;let target=this.enemies.find(e=>e.hp>0&&dist(e,b)<(e.r+b.r+15));if(!target&&this.boss&&dist(this.boss,b)<(this.boss.r+b.r+25))target=this.boss;if(target){b.dead=true;this.damage(target,b.damage)}}this.bullets=this.bullets.filter(b=>!b.dead);
 for(let e of this.enemies)if(e.hp>0&&dist(e,p)<e.r+31){this.takeHit();e.hp=0;this.particle(e.x,e.y,'#ff9f5d',24)}
 if(this.boss&&dist(this.boss,p)<this.boss.r+25)this.takeHit(2);
 for(let b of this.enemyBullets){if(dist(b,p)<b.r+23){b.dead=true;this.takeHit()}}this.enemyBullets=this.enemyBullets.filter(b=>!b.dead);
 for(let u of this.pickups){if(dist(u,p)<u.r+39){u.dead=true;this.collect(u.type)}}this.pickups=this.pickups.filter(u=>!u.dead)}
 collect(type){let p=this.pilot;switch(type){case 'coin':p.coins+=1;p.score+=45;this.sfx.play('coin');break;case 'star':p.stars++;p.score+=140;this.sfx.play('star');break;case 'energy':p.score+=90;this.sfx.play('energy');break;case 'repair':p.hp=Math.min(p.maxHP,p.hp+2);this.toast('HULL REPAIRED');this.sfx.play('shield');break;case 'shield':p.shield=6;this.toast('SHIELD ACTIVE');this.sfx.play('shield');break;case 'missileAmmo':p.missiles=Math.min(9,p.missiles+2);this.toast('MISSILE REFILL +2');this.sfx.play('energy');break;case 'bombAmmo':p.bombs=Math.min(5,p.bombs+1);this.toast('BOMB RESUPPLY +1');this.sfx.play('energy');break;}}
 win(){if(this.mode!=='play'||(!this.endless&&!this.bossDead))return;this.mode='win';this.playing=false;let p=this.pilot,stars=p.hp>=4&&p.stars>=3?3:p.hp>=2?2:1;let reward=p.coins+Math.floor(p.kills/3)+6;this.data.credits+=reward;this.data.stars[this.level.n]=Math.max(stars,this.data.stars[this.level.n]||0);this.data.highest=Math.max(this.data.highest,Math.min(20,this.level.n+1));this.data.best=Math.max(this.data.best,p.score);this.data.checkpoint=null;if(this.level.n===20)this.data.endless=true;this.sdk.save(this.data);this.sdk.score(this.data.best);this.sfx.play('win');
 this.show(`<div class="topline">MISSION ACCOMPLISHED</div><h2>STAGE ${pad(this.level.n)} COMPLETE</h2><div style="text-align:center;font-size:44px;letter-spacing:5px;color:#ffcc5e">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><div class="stat-row"><span class="stat-chip">SCORE <b>${p.score.toLocaleString()}</b></span><span class="stat-chip">KILLS <b>${p.kills}</b></span><span class="stat-chip">COINS <b>+${reward}</b></span></div><p class="lead">Different boss destroyed. A tougher enemy squad awaits you!</p><div class="menu-buttons">${this.btn(this.level.n===20?'∞ SURVIVAL MODE':'NEXT STAGE →','next','primary wide')}${this.btn('REPLAY','replay')}${this.btn('MAIN MENU','menu')}</div>`);
 $('next').onclick=()=>this.start(Math.min(20,this.level.n+1),this.level.n===20);$('replay').onclick=()=>this.start(this.level.n);$('menu').onclick=()=>this.menu();}
 lose(){if(this.mode!=='play')return;const cp=this.snapshot();this.data.checkpoint=cp;this.sdk.save(this.data);this.mode='lost';this.playing=false;this.sfx.play('lose');this.show(`<div class="topline">JET DOWN · PILOT SAFE</div><h2>MISSION FAILED</h2><p class="lead">Continue near where you fell with a repaired jet and 15% score penalty, or restart this stage from zero. Your unlocked stages are safe.</p><div class="stat-row"><span class="stat-chip">SCORE <b>${this.pilot.score.toLocaleString()}</b></span><span class="stat-chip">DESTROYED <b>${this.pilot.kills}</b></span><span class="stat-chip">BOSS HP <b>${this.boss?Math.ceil(100*this.boss.hp/this.boss.maxHP)+'%':'NOT REACHED'}</b></span></div><div class="menu-buttons">${this.btn('▶ CONTINUE AT CHECKPOINT','continue','primary wide')}${this.btn('↻ RESTART THIS STAGE','retry','wide')}${this.btn('MAIN MENU','menu','','wide')}</div>`);$('continue').onclick=()=>this.continueCheckpoint();$('retry').onclick=()=>this.start(this.level.n,this.endless);$('menu').onclick=()=>this.menu();}
 syncHUD(){let p=this.pilot;$('hudScore').textContent=pad(p.score,6);$('hudCoins').textContent=p.coins;$('healthText').textContent=`HULL ${Math.round(p.hp/p.maxHP*100)}%`;$('healthBar').style.width=`${p.hp/p.maxHP*100}%`;$('shieldBar').style.width=`${Math.min(100,p.shield/6*100)}%`;
 $('stageBar').style.width=`${Math.min(100,(this.pilot.kills/this.level.targetKills*.55+(this.bossSpawned?(this.boss?(.45*(1-this.boss.hp/this.boss.maxHP)):.45):0))*100)}%`;$('stagePercent').textContent=this.level.requiredSpecial?`${Math.min(this.pilot.kills,this.level.targetKills)}/${this.level.targetKills} · ${this.pilot.special}/${this.level.requiredSpecial} ${this.level.specialLabel}`:`${Math.min(this.pilot.kills,this.level.targetKills)}/${this.level.targetKills} DOWN`;$('objective').textContent=this.bossSpawned?'DESTROY: '+BOSS_NAMES[this.level.n-1]:this.level.mission;
 $('missileCount').textContent=`${p.missiles} LEFT`;$('bombCount').textContent=`${p.bombs} LEFT`;$('missileBtn').disabled=p.missiles<=0;$('bombBtn').disabled=p.bombs<=0;if(this.boss)$('bossBar').style.width=`${Math.max(0,100*this.boss.hp/this.boss.maxHP)}%`;
 $('combo').textContent=`COMBO ×${Math.floor(p.combo/4)+1}`;$('combo').classList.toggle('hidden',p.combo<4);$('flyHint').classList.toggle('hidden',this.hintTime<=0);
 }
 draw(dt){let c=this.ctx,W=this.W,H=this.H; // logical coordinates, canvas transform set at resize
 c.save();this.shake=0; // Stable world camera: no random full-screen translation or tearing
 this.drawBackground(c,W,H);if(this.mode!=='boot'){
 if(this.mode==='play'||this.mode==='pause'||this.mode==='win'||this.mode==='lost'){for(let u of this.pickups)this.drawPickup(c,u);for(let e of this.enemies)this.drawEnemy(c,e);if(this.boss)this.drawBoss(c,this.boss);for(let q of this.enemyBullets)this.drawEnemyShot(c,q);for(let b of this.bullets)this.drawBullet(c,b);}
 if(this.mode==='menu'||this.mode==='help'||this.mode==='stages'||this.mode==='hangar'){this.drawShowcase(c)}else if(this.mode!=='boot'){this.drawHero(c,this.pilot.x,this.pilot.y,1,false);}}
 for(let r of this.rings){c.strokeStyle=r.color;c.lineWidth=clamp(r.life/r.maxLife*10,2,12);c.globalAlpha=clamp(r.life/r.maxLife,0,1);c.beginPath();c.arc(r.x,r.y,r.radius,0,TAU);c.stroke();c.globalAlpha=1}
 for(let q of this.particles){c.globalAlpha=clamp(q.life/q.maxLife,0,1);c.fillStyle=q.color;c.shadowBlur=14;c.shadowColor=q.color;c.beginPath();c.arc(q.x,q.y,q.r,0,TAU);c.fill()}c.globalAlpha=1;c.shadowBlur=0;
 if(this.waveFlash>0){c.fillStyle=`rgba(255,232,188,${this.waveFlash*.6})`;c.fillRect(0,0,W,H);this.waveFlash=Math.max(0,this.waveFlash-dt)}c.restore();}
 drawBackground(c,W,H){const w=WORLDS[this.level.world];
 const art=this.images['stage_bg_'+pad(this.level.n)];if(art){let imgR=art.width/art.height,viewR=W/H,cropW=art.width,cropH=art.height,sx=0,sy=0;if(imgR>viewR){cropW=art.height*viewR;sx=(art.width-cropW)*(.52+.06*Math.sin(this.backTime*.035))}else{cropH=art.width/viewR;sy=(art.height-cropH)*.5}c.drawImage(art,sx,sy,cropW,cropH,0,0,W,H);
 let shade=c.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(1,11,34,.26)');shade.addColorStop(.48,'rgba(10,17,44,.05)');shade.addColorStop(1,'rgba(2,8,28,.24)');c.fillStyle=shade;c.fillRect(0,0,W,H);
 for(let i=0;i<37;i++){let x=((i*319.77-this.backTime*52*(1+i%3))%(W+60)+(W+60))%(W+60),y=(i*157.39)%(H*.83),r=i%9===0?2.2:.7;c.globalAlpha=.15+.2*Math.sin(this.backTime*.7+i)*Math.sin(this.backTime*.7+i);c.fillStyle='#edffff';c.fillRect(x,y,r,r)}c.globalAlpha=1;
 // Foreground parallax cloud banks / meteor trails distinct from static painted sky.
 let ww=this.level.world,vel=(this.mode==='play'?this.level.scroll:40);
 for(let j=0;j<9;j++){
  let x=((j*297-this.backTime*(vel*(.64+(j%3)*.45)))%(W+440)+(W+440))%(W+440)-200;
  let yy=H*(.19+(j%5)*.155)+Math.sin(j*3.3)*17;
  let r=22+j%3*19;
  c.globalAlpha=ww===4?.20:ww===3?.16:.20;
  if(ww===4){c.strokeStyle='#afd9ff';c.lineWidth=2;c.beginPath();c.moveTo(x,yy);c.lineTo(x+80+j%2*60,yy-16);c.stroke();}
  else {c.fillStyle=ww===1?'#c5b9f9':ww===2?'#ffcea9':'#e9fcff';c.beginPath();c.ellipse(x,yy,r*2.1,r*.42,-.05,0,TAU);c.fill();c.beginPath();c.ellipse(x+34,yy-8,r*1.2,r*.36,0,0,TAU);c.fill();}
 }
 c.globalAlpha=1;
 // Every mission has a different atmosphere, without loading a new large scene.
 let atmosphere=['rgba(8,21,46,.0)','rgba(9,53,136,.20)','rgba(231,93,42,.18)','rgba(71,8,95,.23)'][this.level.segment];
 c.fillStyle=atmosphere;c.fillRect(0,0,W,H);
 if(this.level.segment===3){c.strokeStyle='rgba(255,92,92,.23)';c.lineWidth=2;for(let j=0;j<4;j++){let xx=((j*330-this.backTime*185)%(W+420)+(W+420))%(W+420);c.beginPath();c.moveTo(xx,-10);c.lineTo(xx-150,H+10);c.stroke();}}
 if(ww===1&&Math.sin(this.backTime*.36)> .97){c.strokeStyle='#dfc6ff';c.lineWidth=3;c.shadowBlur=25;c.shadowColor='#b692ff';c.beginPath();c.moveTo(W*.74,0);c.lineTo(W*.72,H*.18);c.lineTo(W*.78,H*.23);c.lineTo(W*.70,H*.44);c.stroke();c.shadowBlur=0;}
 return}
let grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,w.top);grad.addColorStop(.5,w.mid);grad.addColorStop(1,w.low);c.fillStyle=grad;c.fillRect(0,0,W,H);
 // Layered lit planet + atmospheric glow, distinct color schemes
 if(w.type==='space'||w.type==='city'||w.type==='storm'){let px=W*.78,py=H*.17,rr=Math.min(W*.15,H*.2);let aura=c.createRadialGradient(px,py,rr*.2,px,py,rr*2.9);aura.addColorStop(0,'#a2bafa67');aura.addColorStop(1,'#355dfb00');c.fillStyle=aura;c.beginPath();c.arc(px,py,rr*2.9,0,TAU);c.fill();c.beginPath();c.arc(px,py,rr,0,TAU);let pg=c.createLinearGradient(px-rr,py-rr,px+rr,py+rr);pg.addColorStop(0,w.type==='space'?'#cce5ff':'#b9c8f4');pg.addColorStop(.4,w.type==='space'?'#6085d6':'#6575b8');pg.addColorStop(1,'#141f4e');c.fillStyle=pg;c.fill();c.strokeStyle='#bceaff99';c.lineWidth=3;c.stroke()}
 let t=this.backTime,speed=(this.mode==='play'?1:.23), off=t*speed;
 // procedural twinkling stars rendered each frame. no textures or external requests.
 for(let i=0;i<100;i++){let x=((i*187.37+49-off*(11+i%5*7))% (W+65)+(W+65))%(W+65),y=(i*149.23+13)%(H*.80),r=i%11===0?2.3:.65;c.globalAlpha=(w.type==='space'||w.type==='city'||w.type==='storm'?.25:.08)+.5*Math.abs(Math.sin(t*.5+i*1.3));c.fillStyle='#e3faff';c.fillRect(x,y,r,r)}c.globalAlpha=1;
 // streaking aerial parallax clouds: ellipses and gradients
 for(let layer=0;layer<3;layer++){let count=6+layer*2;for(let i=0;i<count;i++){let px=((i*249+layer*80-off*(14+layer*21))%(W+420)+(W+420))%(W+420)-170;let py=H*(.18+layer*.22)+Math.sin(i*5.6+layer)*H*.11;let rr=65+layer*37+(i%3)*29;let alpha=w.type==='space'?.035:layer===2?.10:.08;c.fillStyle=layer===2?`rgba(255,240,237,${alpha})`:`rgba(231,248,255,${alpha})`;for(let j=0;j<4;j++){c.beginPath();c.ellipse(px+j*rr*.52,py+(j%2)*12,rr*.75,rr*.18,0,0,TAU);c.fill()}}}
 if(w.type==='cloud'||w.type==='storm'||w.type==='canyon'){let base=H*.82;for(let depth=0;depth<3;depth++){c.beginPath();c.moveTo(0,H);for(let i=0;i<=18;i++){let x=W*i/18,y=base-depth*30+Math.sin(i*1.6+depth*2+off*.05)*44-Math.sin(i*.54+depth)*80;c.lineTo(x,y)}c.lineTo(W,H);c.closePath();c.fillStyle=w.type==='canyon'?['#553456','#81465e','#b96c61'][depth]:w.type==='storm'?['#141842','#29356a','#4c5788'][depth]:['#153a6c','#246198','#537fa1'][depth];c.globalAlpha=.5+depth*.15;c.fill()}c.globalAlpha=1}
 if(w.type==='city'){let base=H*.82;for(let i=0;i<40;i++){let x=((i*91-off*12)%(W+160)+(W+160))%(W+160)-40;let ht=55+(i*73)%290;let bw=28+(i*7)%35;c.fillStyle=i%3===0?'#13204c':'#101b41';c.fillRect(x,base-ht,bw,ht+H*.3);for(let row=0;row<10;row++)for(let col=0;col<3;col++)if((i+row*3+col)%4===0){c.fillStyle=(row+col)%2?'#14d6ee94':'#ff6cba8a';c.fillRect(x+5+col*9,base-ht+10+row*20,3,7)}}c.fillStyle='#0a1130';c.fillRect(0,H*.88,W,H*.12)}
 if(w.type==='space'){for(let i=0;i<12;i++){let x=((i*167-off*15)%(W+180)+(W+180))%(W+180)-80,yy=H*.65+(i*91)%(H*.25),r=18+(i*7)%40;c.save();c.translate(x,yy);c.rotate(i*.8);c.beginPath();for(let j=0;j<8;j++){let a=j*TAU/8,rr=r*(.8+(j%3)*.12);j?c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):c.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fillStyle='#27345f';c.fill();c.strokeStyle='#8092b5';c.lineWidth=2;c.stroke();c.restore()}}
 // Horizon glow and subtle lane of battle light
 let haze=c.createLinearGradient(0,H*.64,0,H);haze.addColorStop(0,'#91d8ff00');haze.addColorStop(1,w.type==='space'?'#573c7a33':'#a0b8ff30');c.fillStyle=haze;c.fillRect(0,H*.64,W,H*.36);
 }
 drawImage(c,key,x,y,w,h,flipped=false){let im=this.images[key];if(!im)return;c.save();c.translate(x,y);if(flipped)c.scale(-1,1);c.drawImage(im,-w/2,-h/2,w,h);c.restore()}
 drawHero(c,x,y,scale=1,flicker=false){if(flicker)return;let ww=(this.portrait?160:185)*scale,hh=ww*.45;
 c.save();let aura=c.createRadialGradient(x-ww*.34,y,3,x-ww*.34,y,ww*.54);aura.addColorStop(0,'#c5fcffcc');aura.addColorStop(.42,'#2ad7ffa0');aura.addColorStop(1,'#2ad7ff00');c.fillStyle=aura;c.beginPath();c.ellipse(x-ww*.38,y,ww*.8,hh*.9,0,0,TAU);c.fill();c.globalAlpha=.8;c.fillStyle='#00d7ff';c.beginPath();c.moveTo(x-ww*.37,y-18);c.lineTo(x-ww*.72-8*Math.sin(this.backTime*12),y);c.lineTo(x-ww*.37,y+17);c.fill();c.restore();
 this.drawImage(c,'hero_'+this.data.selected,x,y,ww,hh);
 if(this.pilot.shield>0){c.save();c.strokeStyle='#82faff';c.shadowColor='#6feeff';c.shadowBlur=21;c.lineWidth=4;c.globalAlpha=.55+.22*Math.sin(this.time*7);c.beginPath();c.ellipse(x,y,ww*.52,hh*.75,0,0,TAU);c.stroke();c.restore()}}
 drawShowcase(c){let W=this.W,H=this.H;let x=this.portrait?W*.49:W*.76,y=this.portrait?H*.32:H*.49;this.drawHero(c,x,y,1.65,false);let bX=(this.portrait?W*.81:W*.96);this.drawImage(c,'interceptor',bX,H*.23,175,82);this.drawImage(c,'scout',bX-40,H*.72,160,73);for(let i=0;i<7;i++){let x=W*(.49+i*.065);let y=H*(.31+Math.sin(i*.6)*.06);this.drawPickup(c,{x,y,phase:this.backTime*2+i*.5,r:21,type:i%3?'coin':'star'})}}
 drawEnemy(c,e){if(e.type==='mine'){c.save();c.translate(e.x,e.y);c.rotate(this.time*.48);c.shadowColor='#f83e6d';c.shadowBlur=17;c.fillStyle='#ff416b';for(let i=0;i<8;i++){let a=i*TAU/8;c.save();c.rotate(a);c.fillRect(21,-5,20,10);c.restore()}c.beginPath();c.arc(0,0,27,0,TAU);c.fillStyle='#23345a';c.fill();c.strokeStyle='#f7456e';c.lineWidth=5;c.stroke();c.beginPath();c.arc(0,0,12,0,TAU);c.fillStyle='#ff685b';c.fill();c.restore();return}if(e.type==='asteroid'){c.save();c.translate(e.x,e.y);c.rotate(this.time*.65+e.seed);c.beginPath();for(let i=0;i<10;i++){let a=i*TAU/10,rad=e.r*(1+(i%4)*.13);i?c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):c.moveTo(Math.cos(a)*rad,Math.sin(a)*rad)}c.closePath();let g=c.createLinearGradient(-40,-40,40,40);g.addColorStop(0,'#a0a9c6');g.addColorStop(1,'#3b466e');c.fillStyle=g;c.fill();c.lineWidth=4;c.strokeStyle='#172644';c.stroke();for(let j=0;j<4;j++){c.beginPath();c.arc(Math.cos(j*2)*e.r*.5,Math.sin(j*3)*e.r*.5,4+j*2,0,TAU);c.fillStyle='#27375c';c.fill()}c.restore();return}
 let key=({alien:'alien_fighter',saucer:'alien_saucer',hunter:'alien_hunter',drone:'alien_drone',bomber:'bomber',interceptor:'interceptor',scout:'scout'})[e.type]||'scout';let w=e.type==='bomber'?150:e.type==='hunter'?144:e.type==='saucer'?140:e.type==='drone'?116:130;this.drawImage(c,key,e.x,e.y,w,w*.58);if(e.hp<e.maxHP){c.fillStyle='#0e2135';c.fillRect(e.x-30,e.y-48,60,5);c.fillStyle='#ff6970';c.fillRect(e.x-30,e.y-48,60*e.hp/e.maxHP,5)}}
 drawBoss(c,b){let w=this.portrait?260:380;this.drawImage(c,'boss_v6_'+pad(this.level.n),b.x,b.y,w,w*.53);c.save();c.translate(b.x-70,b.y);c.globalAlpha=.65+.3*Math.sin(this.time*6);c.fillStyle='#ff594e';c.shadowColor='#ff5965';c.shadowBlur=27;c.beginPath();c.arc(0,0,16,0,TAU);c.fill();c.restore()}
 drawBullet(c,b){c.save();if(b.kind==='gun'){c.shadowBlur=15;c.shadowColor='#ffb65c';c.fillStyle='#fff9bf';c.fillRect(b.x-24,b.y-3,45,6);c.fillStyle='#ff7d36';c.fillRect(b.x-32,b.y-2,20,4)}else{c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.shadowColor='#fbb86f';c.shadowBlur=21;c.fillStyle='#ffa536';c.beginPath();c.moveTo(-29,0);c.lineTo(-54,-10);c.lineTo(-54,10);c.fill();c.fillStyle='#c5d7ee';c.beginPath();c.moveTo(23,0);c.lineTo(0,-11);c.lineTo(-22,-9);c.lineTo(-22,9);c.lineTo(0,11);c.fill();c.strokeStyle='#ec4158';c.lineWidth=3;c.stroke()}c.restore()}
 drawEnemyShot(c,b){c.save();if(b.kind==='bomb'){c.translate(b.x,b.y);c.shadowBlur=20;c.shadowColor='#ff764c';c.fillStyle='#161a2a';c.beginPath();c.arc(0,0,17,0,TAU);c.fill();c.strokeStyle='#ff654e';c.lineWidth=4;c.stroke();c.fillStyle='#ffda73';c.fillRect(-5,-8,10,16);c.restore();return}if(b.kind==='missile'){c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.shadowColor='#ff6c3b';c.shadowBlur=17;c.fillStyle='#ffb255';c.beginPath();c.moveTo(-31,0);c.lineTo(-53,-7);c.lineTo(-53,7);c.fill();c.fillStyle='#e7effc';c.beginPath();c.moveTo(21,0);c.lineTo(2,-9);c.lineTo(-23,-8);c.lineTo(-23,8);c.lineTo(2,9);c.fill();c.strokeStyle='#e9425c';c.lineWidth=3;c.stroke();c.restore();return}c.fillStyle='#ff596b';c.shadowColor='#ff4256';c.shadowBlur=23;c.beginPath();c.arc(b.x,b.y,10,0,TAU);c.fill();c.strokeStyle='#ffdcb8';c.lineWidth=2;c.beginPath();c.arc(b.x,b.y,5,0,TAU);c.stroke();c.restore()}
 drawPickup(c,u){let {x,y,type}=u;let r=u.r||22;y+=Math.sin((u.phase||0)+this.backTime*2)*8;c.save();c.translate(x,y);if(type==='coin'||type==='star'){c.shadowColor='#ffb62a';c.shadowBlur=20;c.fillStyle='#ffdc65';c.strokeStyle='#8d4c12';c.lineWidth=4;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.stroke();c.beginPath();for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,rad=(i%2===0?r*.70:r*.32);i?c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):c.moveTo(Math.cos(a)*rad,Math.sin(a)*rad)}c.closePath();c.fillStyle='#fff5b8';c.fill();c.strokeStyle='#df8e21';c.lineWidth=1.5;c.stroke()}
 else{let col={energy:'#45ddff',repair:'#45ef9c',shield:'#7cbbff',missileAmmo:'#fba051',bombAmmo:'#ff77b1'}[type]||'#eee';c.shadowBlur=23;c.shadowColor=col;c.beginPath();for(let i=0;i<6;i++){let a=i*TAU/6;let rad=i%2?19:24;i?c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):c.moveTo(Math.cos(a)*rad,Math.sin(a)*rad)}c.closePath();c.fillStyle=col;c.fill();c.lineWidth=3;c.strokeStyle='#e9feff';c.stroke();c.fillStyle='#0b3150';c.font='bold 25px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(({energy:'ϟ',repair:'+',shield:'◆',missileAmmo:'➤',bombAmmo:'✹'})[type]||'◆',0,1)}c.restore();}
}
// Initialise only after the HTML canvas and controls exist. This also supports
// a single-file offline build, where the script may be in the <head>.
function startGame(){
  let game;
  try {
    game=new Game();
    if(!window.ytgame?.IN_PLAYABLES_ENV && (location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.search.includes('debug=1'))){
      window.__AeroPulseDebug={game,LEVELS,WORLDS,save:safeSave,
        skipStage:()=>{game.pilot.kills=game.level.targetKills;game.pilot.special=game.level.requiredSpecial;game.bossDead=true;game.boss=null;game.win()},
        hit:()=>game.takeHit(),spawnBoss:()=>game.spawnBoss()};
    }
    game.boot().catch(e=>{
      console.error('AeroPulse initialization failed:',e);
      const panel=document.getElementById('panel');
      if(panel)panel.innerHTML='<h2>Unable to start</h2><p>Reload this game or try Chrome/Edge.</p>';
    });
  } catch(e){
    console.error('AeroPulse startup failed:',e);
    const panel=document.getElementById('panel');
    if(panel)panel.innerHTML='<h2>Unable to start</h2><p>Reload this game or try Chrome/Edge.</p>';
  }
}
if(document.readyState==='complete')startGame();
else window.addEventListener('load',startGame,{once:true});
})();
