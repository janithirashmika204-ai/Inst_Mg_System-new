// @ts-nocheck
import { useState, useRef, useEffect, createContext, useContext } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";
import { loadInstituteStore, syncCollectionDelta, rememberInstituteSnapshots, loadMembership, loadUserProfile, loadInstituteSettings, saveInstituteSettings, uiRole } from "./lib/edupeakRepository";
import {
  Banknote, Bell, BookOpen, Building2, CalendarDays, CalendarPlus,
  ChartNoAxesCombined, Check, CheckCircle2, ChevronRight, ClipboardCheck,
  Clock3, CreditCard, FileText, Globe2, GraduationCap, LayoutDashboard,
  LockKeyhole, Menu, Pencil, Printer, ReceiptText, Search, Settings,
  ShieldCheck, Smartphone, Star, TriangleAlert, UserRoundCheck, UsersRound,
  WalletCards, X, Plus, TrendingUp, BarChart3, Users, BookMarked, Trash2,
  Save, RefreshCw, Database, MessageSquare, CreditCard as PayIcon, Map,
  AlertCircle, Languages, ChevronDown, Eye, DollarSign, Calendar,
  CircleCheck, CircleX, AlarmClock, Clock, PenLine, QrCode, Nfc, School,
  PanelLeftClose, PanelLeftOpen, ArrowRight, ScanLine, Hourglass, IdCard, Timer,
  Download, Upload, RotateCcw, Sun, Moon, LogOut,
} from "lucide-react";

/* ─── Semantic design tokens ──────────────────────────────────────────── */
const C = {
  bg: "var(--ep-bg)", surface: "var(--ep-surface)", card: "var(--ep-card)",
  border: "var(--ep-border)", accent: "var(--ep-accent)", accent2: "var(--ep-accent-2)",
  gold: "var(--ep-warning)",
  col01: "var(--ep-chart-1)", col02: "var(--ep-chart-2)", col03: "var(--ep-chart-3)",
  col04: "var(--ep-chart-4)", col05: "var(--ep-chart-5)", col06: "var(--ep-chart-6)",
  emerald: "var(--ep-success)", rose: "var(--ep-danger)", amber: "var(--ep-warning)",
  text: "var(--ep-text)", muted: "var(--ep-muted)", subtle: "var(--ep-subtle)",
  ink: "var(--ep-on-accent)", borderStrong: "var(--ep-border-strong)",
};

// Use CSS color-mix rather than appending hex alpha bytes: tokens can then
// change safely with the active theme and work with both hex and CSS variables.
const alphaColor = (color, percentage) =>
  `color-mix(in srgb, ${color} ${percentage}%, transparent)`;

/* ─── Helpers ─────────────────────────────────────────────── */
const fmt = (n) => n?.toLocaleString("en-LK");
const StatusIcon = ({s,size=13}) => {
  const I = s==="Present"?CircleCheck:s==="Late"?AlarmClock:s==="Early"?Clock:CircleX;
  return <I size={size} strokeWidth={2} aria-hidden="true" style={{flexShrink:0}}/>;
};
const AppIcon = ({ icon:Icon, size=18, strokeWidth=1.8 }) => <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true"/>;
let _idCount = 7;
const genId = () => { const id=`EP-${new Date().getFullYear()}-${String(_idCount).padStart(3,"0")}`; _idCount++; return id; };

const amountWords = (n) => {
  const one=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const ten=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if(n===0) return "Zero";
  if(n<20) return one[n];
  if(n<100) return ten[Math.floor(n/10)]+(n%10?" "+one[n%10]:"");
  if(n<1000) return one[Math.floor(n/100)]+" Hundred"+(n%100?" "+amountWords(n%100):"");
  if(n<100000) return amountWords(Math.floor(n/1000))+" Thousand"+(n%1000?" "+amountWords(n%1000):"");
  return amountWords(Math.floor(n/100000))+" Lakh"+(n%100000?" "+amountWords(n%100000):"");
};

/* ─── Empty initial data (no demo records) ───────────────── */
/* ① Students now have subjects[] array */
const _STUDENTS_RAW = [];

const INIT_STUDENTS = _STUDENTS_RAW.map(s=>({regDate:"",gender:"",address:"",city:"",concession:"None",...s}));

const INIT_TEACHERS = [];

const INIT_CLASSES = [];

const INIT_FEES = [];

const INIT_EXAMS = [];

const EXAM_RESULTS = [];

const NOTIFICATIONS = [];

const MONTHS  = [];
const REVENUE = [];
const ENROLL  = [];
const ALL_SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","Science","English","History","Commerce","ICT","Art"];

/* ─── Print Helpers ───────────────────────────────────────── */
const printThermalReceipt = (rec) => {
  const w = window.open("","_blank","width=350,height=700");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt</title>
  <style>
    @page{size:80mm auto;margin:0}*{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Courier New',monospace;font-size:12px;color:#000;background:#fff;width:80mm;padding:4mm}
    .center{text-align:center}.bold{font-weight:bold}.big{font-size:15px}.small{font-size:10px}
    .divider{border-top:1px dashed #000;margin:5px 0}
    .row{display:flex;justify-content:space-between;padding:2px 0}
    .logo{font-size:20px;font-weight:900;letter-spacing:2px}
    .amount{font-size:18px;font-weight:900;text-align:center;padding:6px 0}
    .slogan{font-style:italic;font-size:10px}
  </style></head><body>
  <div class="center" style="padding-bottom:6px">
    <div class="logo">EDUPEAK</div>
    <div class="small">Institute Management System</div>
    
  </div>
  <div class="divider"></div>
  <div class="center bold big" style="padding:4px 0">PAYMENT RECEIPT</div>
  <div class="divider"></div>
  <div class="row"><span>Receipt No.</span><span class="bold">${rec.id}</span></div>
  <div class="row"><span>Date</span><span>${rec.date}</span></div>
  <div class="row"><span>Time</span><span>${rec.time||"—"}</span></div>
  <div class="divider"></div>
  <div class="row"><span>Student</span><span class="bold">${rec.student}</span></div>
  <div class="row"><span>Teacher</span><span>${rec.teacher||"—"}</span></div>
  <div class="row"><span>Subject</span><span>${rec.subject||"—"}</span></div>
  <div class="row"><span>Month</span><span>${rec.month||"—"}</span></div>
  <div class="divider"></div>
  <div class="row"><span>Payment Method</span><span class="bold">${rec.method}</span></div>
  ${rec.notes?`<div class="row"><span>Notes</span><span style="max-width:120px;text-align:right">${rec.notes}</span></div>`:""}
  <div class="divider"></div>
  <div class="amount">Rs. ${Number(rec.amount).toLocaleString("en-LK")}</div>
  <div class="center small" style="padding:2px 0">In Words: ${amountWords(rec.amount)} Rupees Only</div>
  <div class="divider"></div>
  <div class="center" style="padding:4px 0">
    <div class="slogan">"Empowering Futures, One Student at a Time"</div>
    
  </div>
  <div class="divider"></div>
  <div class="center small" style="padding-top:4px">Thank you.</div>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
  </body></html>`);
  w.document.close();
};

const printAnalyticsReport = (report) => {
  const w = window.open("","_blank","width=900,height=700");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${report.title}</title>
  <style>
    @font-face{font-family:'Anthropic Sans';src:url('/fonts/AnthropicSans-Romans.woff2') format('woff2');font-style:normal;font-weight:300 800;font-display:swap}
    @page{size:A4;margin:20mm}*{box-sizing:border-box}
    body{font-family:'Anthropic Sans',sans-serif;font-size:13px;color:#111}
    h1{font-size:22px;margin-bottom:4px}.sub{color:#555;font-size:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#1a2540;color:#fff;padding:10px 14px;text-align:left;font-size:12px}
    td{padding:10px 14px;border-bottom:1px solid #dde;font-size:12px}
    tr:nth-child(even) td{background:#f5f8ff}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:3px solid #2563EB;padding-bottom:12px}
    .logo{font-size:22px;font-weight:900;color:#2563EB}
    .kpi{display:flex;gap:16px;margin:16px 0;flex-wrap:wrap}
    .kpi-box{border:1px solid #dde;border-radius:8px;padding:14px 20px;flex:1;min-width:140px}
    .kpi-val{font-size:22px;font-weight:800;color:#1a2540}.kpi-lbl{font-size:11px;color:#777;margin-top:4px}
  </style></head><body>
  <div class="header">
    <div><div class="logo">EDUPEAK</div><div style="font-size:11px;color:#555">Institute Management System</div></div>
    <div style="text-align:right"><div style="font-size:16px;font-weight:700">${report.title}</div>
    <div style="font-size:11px;color:#555">Generated: ${new Date().toLocaleString("en-LK")}</div></div>
  </div>
  ${report.kpis?`<div class="kpi">${report.kpis.map(k=>`<div class="kpi-box"><div class="kpi-val">${k.v}</div><div class="kpi-lbl">${k.l}</div></div>`).join("")}</div>`:""}
  <table><thead><tr>${report.cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead>
  <tbody>${report.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <div style="margin-top:30px;font-size:10px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:10px">
    EduPeak Institute Management System
  </div>
  <script>window.onload=()=>{window.print()}<\/script></body></html>`);
  w.document.close();
};

/* ─── Micro-Components ────────────────────────────────────── */
const Avatar = ({initials,color=C.accent2,size=36}) => (
  <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:`${alphaColor(color, 12)}`,border:`1px solid ${alphaColor(color, 25)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.max(10,Math.round(size*0.34)),fontWeight:600,letterSpacing:"0.02em",color}}>{initials}</div>
);

const Badge = ({label,color=C.emerald}) => (
  <span className="ui-badge" style={{background:`${alphaColor(color, 11)}`,color,border:`1px solid ${alphaColor(color, 20)}`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",justifyContent:"center",textAlign:"center",lineHeight:1.5,whiteSpace:"nowrap"}}>{label}</span>
);

const Pill = ({value,total,color=C.accent}) => {
  const pct = Math.round((value/total)*100);
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:5,background:C.subtle,borderRadius:99,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.6s cubic-bezier(.4,0,.2,1)"}}/>
      </div>
      <span style={{fontSize:11,color:C.muted,minWidth:30,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{pct}%</span>
    </div>
  );
};

const StatCard = ({icon,label,value,sub,color=C.accent,trend}) => (
  <div className="stat-card" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px",display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div className="stat-icon" style={{width:34,height:34,borderRadius:8,background:`${alphaColor(color, 10)}`,color,display:"grid",placeItems:"center"}}>{icon}</div>
      {trend!==undefined&&trend!==null&&<span style={{fontSize:11,color:trend>0?C.emerald:C.rose,fontWeight:600,background:`${alphaColor(trend>0?C.emerald:C.rose, 10)}`,borderRadius:6,padding:"2px 7px",fontVariantNumeric:"tabular-nums"}}>{trend>0?"+":"−"}{Math.abs(trend)}%</span>}
    </div>
    <div>
      <div style={{fontSize:12.5,color:C.muted,fontWeight:500,marginBottom:6}}>{label}</div>
      <div style={{fontSize:24,fontWeight:700,color:C.text,lineHeight:1.1,letterSpacing:"-0.02em",fontVariantNumeric:"tabular-nums"}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:C.muted,marginTop:6}}>{sub}</div>}
    </div>
  </div>
);

const MiniBarChart = ({data=[],labels=[],color=C.accent}) => {
  const values = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...values.map(v=>Number(v)||0));
  if (!values.length) return <div style={{height:70,display:"grid",placeItems:"center",color:C.muted,fontSize:12}}>No enrollment data yet</div>;
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:70,padding:"0 4px"}}>
      {values.map((v,i)=>(
        <div key={i} style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",height:`${Math.max(2,((Number(v)||0)/max)*60)}px`,background:i===values.length-1?color:`${alphaColor(color, 27)}`,borderRadius:"4px 4px 0 0",transition:"height 0.5s ease"}}/>
          <span style={{fontSize:9,color:C.muted}}>{labels[i]||""}</span>
        </div>
      ))}
    </div>
  );
};

const LineChart = ({data=[],color=C.accent}) => {
  const values = Array.isArray(data) ? data.map(v=>Number(v)||0) : [];
  const W=340,H=80;
  if (!values.length) return <div style={{height:80,display:"grid",placeItems:"center",color:C.muted,fontSize:12}}>No revenue data yet</div>;
  const max=Math.max(...values),min=Math.min(...values),range=max-min||1;
  const pts=values.map((v,i)=>({x:values.length===1?W/2:(i/(values.length-1))*(W-20)+10,y:H-((v-min)/range)*(H-20)-10}));
  const pathD=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const areaD=pts.length>1?`${pathD} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`:"";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible",width:"100%",height:"auto",display:"block"}} role="img" aria-label="Revenue trend">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {areaD&&<path d={areaD} fill="url(#lg)"/>}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="4" fill={C.card} stroke={color} strokeWidth="2"/>)}
    </svg>
  );
};

/* ─── Shared UI ───────────────────────────────────────────── */
const Modal = ({title,onClose,children,wide,noPad}) => (
  <div className="modal-backdrop" style={{position:"fixed",inset:0,background:"var(--ep-overlay)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div className="modal-panel" role="dialog" aria-modal="true" aria-label={title} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,maxWidth:wide?760:560,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"var(--ep-shadow-overlay)"}} onClick={e=>e.stopPropagation()}>
      <div style={{padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:1}}>
        <h3 style={{color:C.text,fontSize:16,fontWeight:600,margin:0,letterSpacing:"-0.01em"}}>{title}</h3>
        <button onClick={onClose} className="icon-btn" style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,width:30,height:30,cursor:"pointer",display:"grid",placeItems:"center"}} aria-label="Close"><X size={15}/></button>
      </div>
      <div style={{padding:"22px 24px 24px"}}>{children}</div>
    </div>
  </div>
);

const Field = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  optional,
  disabled,
}) => (
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        display: "flex",
        gap: 6,
        fontSize: 12.5,
        color: C.muted,
        marginBottom: 6,
        fontWeight: 500,
      }}
    >
      {label}
      {optional && (
        <span
          style={{
            color: C.muted,
            fontWeight: 400,
            fontSize: 11,
            opacity: 0.8,
          }}
        >
          (optional)
        </span>
      )}
    </label>

    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete="off"
      style={{
        width: "100%",
        height: 40,
        background: disabled ? C.subtle : C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "0 12px",
        color: disabled ? C.muted : C.text,
        fontFamily: '"Anthropic Sans", sans-serif' ,
        fontSize: 14,
        fontWeight: 400,
        lineHeight: "normal",
        outline: "none",
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "text",
        WebkitAppearance: "none",
        appearance: "none",
      }}
    />
  </div>
);

const SelectField = ({label,value,onChange,options}) => (
  <div style={{marginBottom:16}}>
    <label style={{display:"block",fontSize:12.5,color:C.muted,marginBottom:6,fontWeight:500}}>{label}</label>
    <select value={value} onChange={onChange} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box"}}>
      {options.map(o=><option key={o}>{o}</option>)}
    </select>
  </div>
);

const Btn = ({label,icon,onClick,color=C.accent,outline,small,disabled}) => {
  // One primary colour for the app; green/red stay reserved for meaning.
  const fill = (color===C.gold||color===C.accent2) ? C.accent : color;
  const plus = typeof label==="string" && label.startsWith("+ ");
  const text = plus ? label.slice(2) : label;
  const Ico = icon || (plus ? Plus : null);
  const bg = outline ? "transparent" : disabled ? C.subtle : fill;
  const fg = outline ? C.text : disabled ? C.muted : C.ink;
  const bd = outline ? C.borderStrong : disabled ? C.border : fill;
  return (
    <button className={outline?"ui-button ui-button--outline":"ui-button"} onClick={onClick} disabled={disabled} style={{background:bg,color:fg,border:`1px solid ${bd}`,borderRadius:8,padding:small?"5px 12px":"9px 16px",fontSize:small?12:13.5,fontWeight:600,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,opacity:disabled?0.7:1,whiteSpace:"nowrap"}}>
      {Ico&&<AppIcon icon={Ico} size={small?13:15}/>}{text}
    </button>
  );
};

const InfoRow = ({label,value,color}) => (
  <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
    <span style={{color:C.muted,fontSize:13}}>{label}</span>
    <span style={{color:color||C.text,fontWeight:600,fontSize:13}}>{value}</span>
  </div>
);

const SectionCard = ({title,children}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:16}}>
    {title&&<div style={{color:C.text,fontWeight:600,fontSize:14,marginBottom:14}}>{title}</div>}
    {children}
  </div>
);



/* ─── Local data store (saved on this device) ─────────────── */
const STORE_KEY = "edupeak.local.v3";
const loadStore = () => {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (d && Array.isArray(d.students)) return {
      students:d.students, teachers:Array.isArray(d.teachers)?d.teachers:[], classes:Array.isArray(d.classes)?d.classes:[],
      fees:Array.isArray(d.fees)?d.fees:[], attendance:Array.isArray(d.attendance)?d.attendance:[], exams:Array.isArray(d.exams)?d.exams:[]
    };
    // Legacy v2 data is intentionally not auto-imported. Existing records can be
    // brought into this clean store through the explicit Data Import workflow.
  } catch {}
  return null;
};
const StoreCtx = createContext(null);
const useStore = () => useContext(StoreCtx);

// React-compatible store setter that keeps the existing page components intact
// while synchronizing only changed records to the active Supabase institute.
const useCloudCollection = (initialValue, collectionName, cloudScopeRef, onSyncError) => {
  const [records, setRecords] = useState(initialValue);
  const recordsRef = useRef(records);
  const hydrate = (nextRecords) => {
    const safeRecords = Array.isArray(nextRecords) ? nextRecords : [];
    recordsRef.current = safeRecords;
    setRecords(safeRecords);
  };
  const setCollection = (updater) => {
    const previous = recordsRef.current;
    const next = typeof updater === "function" ? updater(previous) : updater;
    if (!Array.isArray(next)) return;
    recordsRef.current = next;
    setRecords(next);
    const scope = cloudScopeRef.current;
    if (scope?.instituteId) {
      syncCollectionDelta(collectionName, scope.instituteId, previous, next)
        .catch((error) => onSyncError?.(error?.message || `Could not save ${collectionName}.`));
    }
  };
  return [records, setCollection, hydrate];
};

/* ─── Registry helpers ────────────────────────────────────── */
const REG_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pad2 = (n) => String(n).padStart(2,"0");
const isoDate = (d=new Date()) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const subjectsOf = (s) => (s.subjects && s.subjects.length ? s.subjects : ["General"]);
const feeFor = (stu, subject, classes=[]) => {
  const assignments=(Array.isArray(stu?.classAssignments)?stu.classAssignments:[]).filter(a=>a?.classId);
  if(assignments.length){
    return assignments.reduce((sum,a)=>{
      const cls=classes.find(c=>String(c.id)===String(a.classId));
      if(!cls)return sum;
      const clsSubject=String(cls.subject||cls.name||"").toLowerCase();
      if(subject && clsSubject!==String(subject).toLowerCase())return sum;
      const raw=Number(cls.monthlyFee??cls.fee);
      const base=Number.isFinite(raw)?Math.max(0,raw):0;
      return sum+(a.free?0:a.half?Math.round(base*0.5):base);
    },0);
  }
  const subjects=subjectsOf(stu);
  const total=Number(stu?.fee);
  return subjects.length===1&&Number.isFinite(total)?Math.max(0,total):0;
};
const studentMonthlyFee = (student, classes=[]) => {
  const assignments=(Array.isArray(student?.classAssignments)?student.classAssignments:[]).filter(a=>a?.classId);
  if(!assignments.length){const n=Number(student?.fee);return Number.isFinite(n)?Math.max(0,n):0;}
  return assignments.reduce((sum,a)=>{
    const cls=classes.find(c=>String(c.id)===String(a.classId));
    if(!cls)return sum;
    const raw=Number(cls.monthlyFee??cls.fee);
    const base=Number.isFinite(raw)?Math.max(0,raw):0;
    return sum+(a.free?0:a.half?Math.round(base*0.5):base);
  },0);
};
const teacherFor = (subject, teachers=[]) => teachers.find(t => t.subject === subject)?.name || "—";
const isPaid = (fees, stu, subject, monthLabel) =>
  fees.some(f => (f.studentId ? f.studentId === stu.id : f.student === stu.name) && f.subject === subject && f.month === monthLabel && f.status === "Paid");
const studentGradeCode = (grade) => {
  const raw = String(grade ?? "").trim();
  if (!raw || /^\d{4}$/.test(raw)) return "";
  const matches = [...raw.matchAll(/\d{1,2}/g)].map(m => Number(m[0]));
  const value = matches.find(n => n >= 0 && n <= 99);
  return value === undefined ? "" : String(value).padStart(2, "0");
};
const enrollmentYearCode = (value) => {
  const raw = String(value ?? "").trim();
  const year = raw.match(/^(?:19|20|21)\d{2}/)?.[0];
  if (year) return year.slice(-2);
  const parsed = raw ? new Date(raw) : new Date();
  const fullYear = Number.isNaN(parsed.getTime()) ? new Date().getFullYear() : parsed.getFullYear();
  return String(fullYear).slice(-2);
};
// Format: EP + two-digit enrollment year + two-digit first-enrolled grade + four-digit cohort position.
// The position is counted within the same enrollment-year/grade cohort; assigned IDs are never recalculated on edit.
const nextStudentId = (list, grade, enrollmentDate = isoDate()) => {
  const gradeCode = studentGradeCode(grade);
  if (!gradeCode) return "";
  const prefix = `EP${enrollmentYearCode(enrollmentDate)}${gradeCode}`;
  const pattern = new RegExp(`^${prefix}(\\d{4,})$`, "i");
  const max = (list || []).reduce((highest, student) => {
    const match = String(student?.id ?? "").trim().match(pattern);
    return match ? Math.max(highest, Number(match[1]) || 0) : highest;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
};

const CODE39_PATTERNS = {
  "0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn",
  "A":"wnnnnwnnw","B":"nnwnnwnnw","C":"wnwnnwnnn","D":"nnnnwwnnw","E":"wnnnwwnnn","F":"nnwnwwnnn","G":"nnnnnwwnw","H":"wnnnnwwnn","I":"nnwnnwwnn","J":"nnnnwwwnn",
  "K":"wnnnnnnww","L":"nnwnnnnww","M":"wnwnnnnwn","N":"nnnnwnnww","O":"wnnnwnnwn","P":"nnwnwnnwn","Q":"nnnnnnwww","R":"wnnnnnwwn","S":"nnwnnnwwn","T":"nnnnwnwwn",
  "U":"wwnnnnnnw","V":"nwwnnnnnw","W":"wwwnnnnnn","X":"nwnnwnnnw","Y":"wwnnwnnnn","Z":"nwwnwnnnn","-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn","$":"nwnwnwnnn","/":"nwnwnnnwn","+":"nwnnnwnwn","%":"nnnwnwnwn","*":"nwnnwnwnn"
};
const code39BarcodeLayout = (value) => {
  const text = `*${String(value || "").toUpperCase()}*`.split("").filter(ch => CODE39_PATTERNS[ch]);
  const bars = []; let x = 0;
  text.forEach((character, characterIndex) => {
    const pattern = CODE39_PATTERNS[character];
    pattern.split("").forEach((widthCode, i) => {
      const width = widthCode === "w" ? 3 : 1;
      if (i % 2 === 0) bars.push({ x, width, key: `${characterIndex}-${i}` });
      x += width;
    });
    if (characterIndex < text.length - 1) x += 1;
  });
  return { width: Math.max(x, 1), bars };
};
const Code39Barcode = ({ value }) => {
  const layout = code39BarcodeLayout(value);
  return <svg viewBox={`0 0 ${layout.width} 40`} preserveAspectRatio="none" style={{width:"100%",height:40,display:"block"}} aria-label={`Barcode for ${value}`} role="img" fill="#000">{layout.bars.map(bar=><rect key={bar.key} x={bar.x} y="0" width={bar.width} height="40"/>)}</svg>;
};
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const printStudentIdCard = (student) => {
  const id = String(student?.id || "");
  const name = String(student?.name || "Student");
  const layout = code39BarcodeLayout(id);
  const barcode = layout.bars.map(bar => `<rect x="${bar.x}" y="0" width="${bar.width}" height="40"/>`).join("");
  const w = window.open("", "_blank", "width=500,height=820");
  if (!w) { window.alert("Allow pop-ups to print the student ID card."); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Student ID - EduPeak</title><style>@font-face{font-family:'Anthropic Sans';src:url('/fonts/AnthropicSans-Romans.woff2') format('woff2');font-style:normal;font-weight:300 800;font-display:swap}*{box-sizing:border-box}body{margin:0;background:#eaeff4;display:flex;justify-content:center;align-items:flex-start;min-height:100vh;padding:24px;font-family:'Anthropic Sans',Arial,sans-serif}.id-card{width:380px;height:640px;flex:0 0 380px;background:#17813a;border-radius:28px;box-shadow:0 12px 30px rgba(0,0,0,.12);display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;color:#fff;padding:24px 24px 135px}.card-header{display:flex;align-items:center;gap:12px;margin-top:4px}.logo-badge{width:36px;height:36px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center}.company-name{font-size:1.05rem;font-weight:500;color:#fff}.header-line{width:calc(100% + 48px);height:1px;background:rgba(255,255,255,.2);margin:18px -24px 0}.card-main-info{padding-top:0}.main-title{font-size:2.1rem;font-weight:700;letter-spacing:-.02em;margin:0 0 24px;color:#fff}.info-grid{display:flex;justify-content:space-between;align-items:flex-end;gap:8px}.info-col{min-width:0}.info-col label{display:block;font-size:.75rem;color:#a3d4b2;margin-bottom:4px;font-weight:500}.info-value{font-size:1.05rem;font-weight:600;letter-spacing:-.01em;color:#fff;overflow-wrap:anywhere}.info-col.right{text-align:right}.avatar-section{display:flex;flex-direction:column;align-items:center;margin:10px 0}.avatar-wrapper{background:#fff;padding:8px;border-radius:50%;width:140px;height:140px;flex:0 0 140px;box-shadow:0 8px 20px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;overflow:hidden}.avatar-img{width:100%;height:100%;border-radius:50%;object-fit:cover;background:#cbd5e1}.barcode-section{background:#fff;padding:10px 16px;border-radius:12px;width:100%;display:flex;flex-direction:column;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:2}.barcode-svg{width:100%;height:40px}.barcode-text{font-size:.85rem;font-weight:700;letter-spacing:.2em;color:#0f172a;margin-top:4px;overflow-wrap:anywhere}.card-footer-graphics{position:absolute;bottom:0;left:0;width:100%;height:170px;pointer-events:none;overflow:hidden;z-index:1}.card-footer-graphics svg{width:100%;height:100%;display:block}@page{size:portrait;margin:0}@media print{body{background:#fff;padding:0;min-height:auto}.id-card{box-shadow:none;print-color-adjust:exact;-webkit-print-color-adjust:exact}}@media(max-width:430px){body{padding:8px;overflow:auto;justify-content:flex-start}.id-card{transform-origin:top left;transform:scale(calc((100vw - 16px)/380));margin-bottom:calc(640px * ((100vw - 16px)/380 - 1));}}</style></head><body><div class="id-card"><div><div class="card-header"><div class="logo-badge"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="3" width="20" height="18" rx="3" fill="#17813a"/><path d="M7 8h10M7 12h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="15" r="2" fill="#fff"/></svg></div><span class="company-name">EduPeak</span></div><div class="header-line"></div></div><div class="card-main-info"><h1 class="main-title">Student ID</h1><div class="info-grid"><div class="info-col"><label>Name</label><div class="info-value">${escapeHtml(name)}</div></div><div class="info-col right"><label>ID number</label><div class="info-value">${escapeHtml(id)}</div></div></div></div><div class="avatar-section"><div class="avatar-wrapper"><svg class="avatar-img" viewBox="0 0 100 100" fill="#94a3b8" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="40" r="22" fill="#64748b"/><path d="M15 85c0-18.2 14.8-33 33-33h4c18.2 0 33 14.8 33 33v5H15v-5z" fill="#64748b"/></svg></div></div><div class="barcode-section"><svg class="barcode-svg" viewBox="0 0 ${layout.width} 40" preserveAspectRatio="none" fill="#000">${barcode}</svg><div class="barcode-text">*${escapeHtml(id)}*</div></div><div class="card-footer-graphics"><svg viewBox="0 0 380 170" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="230" y="50" width="130" height="90" rx="10" fill="#136930" opacity=".6"/><rect x="250" y="70" width="36" height="42" rx="4" fill="#0d4d21" opacity=".7"/><rect x="296" y="72" width="50" height="6" rx="3" fill="#0d4d21" opacity=".7"/><rect x="296" y="86" width="35" height="6" rx="3" fill="#0d4d21" opacity=".7"/><circle cx="160" cy="90" r="45" fill="#115e2a" opacity=".7"/><path d="M160 72c7 0 12 5 12 12s-5 12-12 12-12-5-12-12 5-12 12-12z" fill="#0d4d21" opacity=".8"/><path d="M142 120c0-10 8-15 18-15s18 5 18 15v5H142v-5z" fill="#0d4d21" opacity=".8"/><g transform="translate(90 80) rotate(-4)"><rect x="0" y="0" width="180" height="110" rx="12" fill="#0b421d" stroke="#167937" stroke-width="2"/><circle cx="50" cy="55" r="22" stroke="#147333" stroke-width="2"/><path d="M28 55h44M50 33v44M35 41c10 5 20 5 30 0M35 69c10-5 20-5 30 0" stroke="#147333" stroke-width="1.5"/><rect x="85" y="38" width="22" height="16" rx="3" fill="#147333"/><rect x="85" y="66" width="60" height="8" rx="4" fill="#147333"/><rect x="85" y="82" width="35" height="8" rx="4" fill="#147333"/></g><rect x="-20" y="115" width="110" height="75" rx="8" fill="#115e2a" opacity=".5" transform="rotate(-10 -20 115)"/></svg></div></div><script>window.onload=()=>{setTimeout(()=>window.print(),300)};<\/script></body></html>`);
  w.document.close();
};
const nextFeeId = (list) => `F${String(list.reduce((m,f) => Math.max(m, parseInt(String(f.id).slice(1),10) || 0), 0) + 1).padStart(3,"0")}`;

const parseClassTime = (str) => {
  const m = String(str).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null;
  let h = parseInt(m[1],10); const min = parseInt(m[2],10); const p = m[3].toUpperCase();
  if (p==="PM" && h!==12) h += 12; if (p==="AM" && h===12) h = 0;
  return h*60+min;
};
const classStatus = (cls, now) => {
  const m = parseClassTime(cls.time); if (m === null) return "Present";
  const diff = now.getHours()*60+now.getMinutes()-m;
  return diff < -5 ? "Early" : diff <= 20 ? "Present" : "Late";
};
const studentClassesOf = (student, classes=[]) => {
  const subs = (student.subjects||[]).map(s => s.toLowerCase());
  return classes.filter(cls => { const n = String(cls.name||"").replace(/A\/L |O\/L /gi,"").toLowerCase(); return subs.some(sub => n.includes(sub) || sub.includes(n)); });
};
const pickClass = (student, now, classes=[]) => {
  const list = studentClassesOf(student, classes);
  const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][now.getDay()];
  const nm = now.getHours()*60+now.getMinutes();
  return list.find(cls => {
    const scheduledDay = String(cls.time||"").match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\\b/i)?.[1];
    const start = parseClassTime(cls.time);
    if (!scheduledDay || scheduledDay.toLowerCase() !== day.toLowerCase() || start === null) return false;
    return nm >= start && nm < start + 120;
  }) || null;
};
const statusColor = (s) => s==="Present" ? C.emerald : s==="Late" ? C.amber : s==="Early" ? C.accent : C.rose;
const beep = (ok=true) => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = ok ? 880 : 220; g.gain.value = 0.05; o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + (ok ? 0.12 : 0.28));
  } catch {}
};

/* ─── Student editor (used by Students page and the Registry) ─ */
const StudentEditor = ({student,onSave,onClose,onDelete}) => {
  const [f,setF] = useState({...student,subjects:[...(student.subjects||[])]});
  const [confirmDel,setConfirmDel] = useState(false);
  const up = k => e => setF(x => ({...x,[k]:e.target.value}));
  const toggle = sub => setF(x => ({...x,subjects:x.subjects.includes(sub)?x.subjects.filter(s=>s!==sub):[...x.subjects,sub]}));
  const monthly = Math.max(0,Number(f.fee)||0);
  const Label = ({children}) => <div style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",margin:"4px 0 12px"}}>{children}</div>;
  const save = () => {
    if (!f.name.trim()) return;
    const initials = f.name.trim().split(/\s+/).map(n=>n[0]).join("").toUpperCase().slice(0,2);
    onSave({...f,name:f.name.trim(),avatar:initials||f.avatar,fee:monthly});
  };
  return (
    <Modal title={`Edit student — ${student.name}`} onClose={onClose} wide>
      <Label>Student information</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <Field label="Student ID" value={f.id} disabled/>
        <Field label="Full name" value={f.name} onChange={up("name")} placeholder="Full name"/>
        <Field label="NIC / ID number" value={f.nic||""} onChange={up("nic")} placeholder="Optional" optional/>
        <Field label="Date of birth" type="date" value={f.dob||""} onChange={up("dob")} optional/>
        <SelectField label="Gender" value={f.gender||""} onChange={up("gender")} options={["","Male","Female"]}/>
        <Field label="Grade" value={f.grade} onChange={up("grade")} placeholder="Grade 11"/>
        <Field label="School" value={f.school||""} onChange={up("school")} placeholder="School name"/>
        <Field label="Branch" value={f.branch||""} onChange={up("branch")} placeholder="Branch name"/>
      </div>
      <Label>Contact</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <Field label="Parent / guardian" value={f.parent||""} onChange={up("parent")} placeholder="Name"/>
        <Field label="Parent mobile" type="tel" value={f.phone||""} onChange={up("phone")} placeholder="07X-XXXXXXX"/>
        <Field label="Address" value={f.address||""} onChange={up("address")} placeholder="Street address" optional/>
        <Field label="City" value={f.city||""} onChange={up("city")} placeholder="City / town" optional/>
      </div>
      <Label>Classes &amp; fees</Label>
      <Field label="Agreed Monthly Fee (Rs.)" type="number" value={f.fee??""} onChange={up("fee")} placeholder="Enter agreed amount" optional/>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
        {ALL_SUBJECTS.map(sub => { const sel = f.subjects.includes(sub); return (
          <button key={sub} onClick={()=>toggle(sub)} style={{background:sel?`${alphaColor(C.accent, 12)}`:"transparent",border:`1px solid ${sel?C.accent:C.border}`,borderRadius:8,padding:"6px 12px",color:sel?C.accent:C.muted,fontSize:12.5,cursor:"pointer",fontWeight:sel?600:500,display:"inline-flex",alignItems:"center",gap:6}}>
            {sel&&<Check size={12}/>}{sub}
          </button>); })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px",alignItems:"end"}}>
        <SelectField label="Fee concession" value={f.concession||"None"} onChange={up("concession")} options={["None","Half","Free"]}/>
        <div style={{marginBottom:16,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.muted}}>Monthly total <strong style={{color:C.text,fontSize:15,marginLeft:6}}>Rs. {fmt(monthly)}</strong></div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:8,alignItems:"center"}}>
        {onDelete&&(confirmDel
          ? <><Btn label="Confirm delete" icon={Trash2} color={C.rose} onClick={onDelete}/><Btn label="Keep" outline onClick={()=>setConfirmDel(false)}/></>
          : <Btn label="Delete" icon={Trash2} outline onClick={()=>setConfirmDel(true)}/>)}
        <div style={{flex:1}}/>
        <Btn label="Cancel" outline onClick={onClose}/>
        <Btn label="Save changes" icon={Save} onClick={save} disabled={!f.name.trim()}/>
      </div>
    </Modal>
  );
};


/* ─── Dashboard ───────────────────────────────────────────── */
const DashboardPage = ({setPage}) => {
  const {students,teachers,classes,fees,attendance,exams} = useStore();
  const now = new Date();
  const today = isoDate(now);
  const monthKey = today.slice(0,7);
  const monthLabel = now.toLocaleDateString("en-LK",{month:"long",year:"numeric"});
  const monthFees = fees.filter(f=>String(f.date||"").startsWith(monthKey)&&String(f.status||"Paid").toLowerCase()==="paid");
  const revenue = monthFees.reduce((sum,f)=>sum+(Number(f.amount)||0),0);
  const monthlyBalances=students.map(st=>{
    const due=studentMonthlyFee(st,classes);
    const paidForMonth=fees.filter(f=>(f.studentId?String(f.studentId)===String(st.id):f.student===st.name)&&f.month===monthLabel&&String(f.status||"").toLowerCase()==="paid").reduce((sum,f)=>sum+(Number(f.amount)||0),0);
    return {student:st,balance:Math.max(0,due-paidForMonth)};
  });
  const unpaid=monthlyBalances.filter(x=>x.balance>0);
  const outstanding=unpaid.reduce((sum,x)=>sum+x.balance,0);
  const todayLog = attendance.filter(a=>a.date===today);
  const presentToday = todayLog.filter(a=>a.status==="Present"||a.status==="Early").length;
  const attPct = todayLog.length?Math.round(presentToday/todayLog.length*100):0;
  const monthLabels = Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return {key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleDateString("en-LK",{month:"short"})};});
  const revenueSeries = monthLabels.map(m=>fees.filter(f=>String(f.date||"").startsWith(m.key)&&String(f.status||"Paid").toLowerCase()==="paid").reduce((sum,f)=>sum+(Number(f.amount)||0),0));
  const enrollmentSeries = monthLabels.map(m=>students.filter(st=>String(st.regDate||"").startsWith(m.key)).length);
  const recentFees = [...fees].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,4);
  const stat = (icon,label,value,sub,color)=> <StatCard icon={icon} label={label} value={value} sub={sub} color={color}/>;
  return (
    <div className="dashboard-page" style={{display:"flex",flexDirection:"column",gap:24,minWidth:0}}>
      <div className="dashboard-page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{color:C.text,fontSize:24,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Institute overview</h1>
          <p style={{color:C.muted,fontSize:14,margin:"4px 0 0"}}>{now.toLocaleDateString("en-LK",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn label="Import records" icon={Upload} outline onClick={()=>setPage("import")}/><Btn label="+ Add Student" onClick={()=>setPage("students")}/></div>
      </div>
      <div className="dashboard-kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:16,minWidth:0}}>
        {stat(<GraduationCap size={26}/>,"Total Students",fmt(students.length),students.length?"Enrolled records":"No student records yet",C.col01)}
        {stat(<BookOpen size={26}/>,"Active Classes",fmt(classes.length),classes.length?"Configured classes":"No classes configured",C.col02)}
        {stat(<Banknote size={26}/>,"Monthly Revenue",`Rs. ${fmt(revenue)}`,monthLabel,C.col03)}
        {stat(<TriangleAlert size={26}/>,"Unpaid Student Fees",`Rs. ${fmt(outstanding)}`,`${unpaid.length} unpaid student record${unpaid.length===1?"":"s"}`,C.col04)}
        {stat(<CheckCircle2 size={26}/>,"Attendance Today",todayLog.length?`${attPct}%`:"—",todayLog.length?`${presentToday} present of ${todayLog.length} records`:"No attendance recorded today",C.col05)}
        {stat(<UsersRound size={26}/>,"Teachers",fmt(teachers.length),teachers.length?"Teacher records":"No teachers added yet",C.col06)}
      </div>
      <div className="grid-2 dashboard-analytics-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div><div style={{color:C.text,fontWeight:700,fontSize:15}}>Revenue Trend</div><div style={{color:C.muted,fontSize:12}}>Based on saved payment records · Last 6 months</div></div><Badge label={fees.length?"Recorded payments":"No data yet"} color={fees.length?C.accent:C.muted}/></div>
          <LineChart data={revenueSeries.some(v=>v>0)?revenueSeries:[]} color={C.accent}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>{monthLabels.map((m,i)=><div key={m.key} style={{textAlign:"center"}}><div style={{fontSize:10,color:C.muted}}>{m.label}</div><div style={{fontSize:11,color:C.text,fontWeight:600}}>{revenueSeries[i]?`${(revenueSeries[i]/1000).toFixed(1)}k`:"—"}</div></div>)}</div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div><div style={{color:C.text,fontWeight:700,fontSize:15}}>Enrollment</div><div style={{color:C.muted,fontSize:12}}>Registration dates from saved student records</div></div><Badge label={`${students.length} total`} color={C.accent2}/></div>
          <MiniBarChart data={enrollmentSeries} labels={monthLabels.map(m=>m.label)} color={C.col02}/>
          <div style={{marginTop:16,display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn label="Student Registry" icon={GraduationCap} outline small onClick={()=>setPage("students")}/>
            <Btn label="Classes & Timetable" icon={CalendarDays} outline small onClick={()=>setPage("classes")}/>
            <Btn label="Attendance" icon={ClipboardCheck} outline small onClick={()=>setPage("attendance")}/>
          </div>
        </div>
      </div>
      <div className="grid-2 dashboard-lower-grid" style={{display:"grid",gridTemplateColumns:"1.2fr .8fr",gap:16}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{color:C.text,fontWeight:700,fontSize:15}}>Recent Payments</div><Btn label="Open fees" outline small onClick={()=>setPage("fees")}/></div>
          {recentFees.length===0?<div style={{padding:"24px 8px",textAlign:"center",color:C.muted,fontSize:13}}>No payment records yet. Recorded payments will appear here.</div>:recentFees.map(f=><div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:12}}><Avatar initials={String(f.student||"Student").split(" ").map(n=>n[0]).join("").slice(0,2)} size={34} color={String(f.status).toLowerCase()==="paid"?C.emerald:C.rose}/><div><div style={{color:C.text,fontSize:14,fontWeight:600}}>{f.student||"Student"}</div><div style={{color:C.muted,fontSize:12}}>{f.date||"—"} · {f.method||"—"}</div></div></div><div style={{textAlign:"right"}}><div style={{color:C.text,fontSize:14,fontWeight:700}}>Rs. {fmt(Number(f.amount)||0)}</div><Badge label={f.status||"Recorded"} color={String(f.status).toLowerCase()==="paid"?C.emerald:C.amber}/></div></div>)}
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div className="dashboard-setup-heading">
            <div>
              <div style={{color:C.text,fontWeight:750,fontSize:15}}>Setup checklist</div>
              <div style={{color:C.muted,fontSize:11.5,marginTop:4}}>Complete the essentials for a smoother workflow.</div>
            </div>
            <Badge label={`${[["Add students",students.length],["Add teachers",teachers.length],["Create classes",classes.length],["Record payments",fees.length],["Schedule exams",exams.length]].filter(([,count])=>count>0).length}/5 ready`} color={C.accent}/>
          </div>
          {[["Add students",students.length,"students","students"],["Add teachers",teachers.length,"teachers","teachers"],["Create classes",classes.length,"classes","classes"],["Record payments",fees.length,"payments","fees"],["Schedule exams",exams.length,"exams","exams"]].map(([label,count,item,target])=><button type="button" key={label} className="dashboard-setup-item" onClick={()=>setPage(target)}><span className="dashboard-setup-status" style={{color:count?C.emerald:C.muted}}>{count?<CircleCheck size={17}/>:<CircleX size={17}/>}</span><span className="dashboard-setup-copy"><strong>{label}</strong><small>{count?`${count} ${item} recorded`:`No ${item} yet`}</small></span><ArrowRight size={15} className="dashboard-setup-arrow"/></button>)}
          <div style={{marginTop:12,color:C.muted,fontSize:11.5,lineHeight:1.55}}>Only records entered or imported into EduPeak are included in these totals.</div>
        </div>
      </div>
    </div>
  );
};

const StudentEditProfilePage = ({student,onBack,onSave}) => {
  const {classes=[],teachers=[]} = useStore();
  const [f,setF] = useState({...student,subjects:[...(student.subjects||[])]});
  const [saved,setSaved] = useState(false);
  const [showIdCard,setShowIdCard] = useState(false);
  useEffect(()=>{setF({...student,subjects:[...(student.subjects||[])]});setSaved(false);},[student.id]);
  const update = k => e => {setF(v=>({...v,[k]:e.target.value}));setSaved(false);};
  const field = (label,key,opts={}) => (
    <label style={{display:"grid",gridTemplateColumns:"112px minmax(0,1fr)",alignItems:"center",gap:8,margin:"0 0 14px",fontSize:13,color:C.muted}}>
      <span>{label}</span>
      <input type={opts.type||"text"} value={f[key]??""} onChange={update(key)} placeholder={opts.placeholder||""} disabled={!!opts.disabled}
        style={{width:"100%",height:40,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",font:"inherit",background:C.bg,color:C.text,boxSizing:"border-box",minWidth:0}}/>
    </label>
  );
  const panel = {background:C.card,border:`1px solid ${C.border}`,borderRadius:12,margin:"8px 0",padding:20,boxShadow:"0 5px 18px rgba(23,40,58,.06)",color:C.text,minWidth:0};
  const heading = {fontSize:14,fontWeight:700,color:C.text,margin:"0 0 18px",paddingBottom:10,borderBottom:`1px solid ${C.border}`};
  const button = (label,action,color=C.accent) => <button onClick={action} style={{border:0,borderRadius:5,color:C.ink,background:color,padding:"8px 14px",fontSize:13,cursor:"pointer"}}>{label}</button>;
  return (
    <div style={{color:C.text,fontFamily:'"Anthropic Sans", sans-serif',maxWidth:1500,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
        <div><div style={{fontSize:22,fontWeight:700,color:C.text}}>Edit Student Profile</div><div style={{fontSize:13,color:C.muted,marginTop:5}}>Update student record · {f.id}</div></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{button("← Back to students",onBack,C.accent2)}{button("Save changes",()=>{onSave({...f,fee:studentMonthlyFee(f,classes),avatar:f.name.trim().split(/\s+/).map(n=>n[0]).join("").toUpperCase().slice(0,2)});setSaved(true);},C.accent)}</div>
      </div>
      <div className="student-profile-layout" style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 445px) minmax(0, 1fr)",
              gap: 12,
              alignItems: "start",
              width: "100%",
              minWidth: 0,
            }}
          >
        <section>
          <div style={panel}>
            <div style={heading}>Student Information</div>
            {field("ID Number","id",{disabled:true})}
            {field("Student Name","name")}
            {field("Name on ID","name")}
            {field("E-Mail","email")}
            {field("Phone Number","phone")}
            {field("Address","address")}
            {field("City","city")}
             <label style={{display:"grid",gridTemplateColumns:"112px 1fr",alignItems:"center",gap:8,marginBottom:14,fontSize:13}}>
               <span>Gender</span>
               <select value={f.gender||""} onChange={update("gender")} style={{height:34,border:`1px solid ${C.border}`,borderRadius:4,padding:6,background:C.bg,color:C.muted}}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                </select>   
             </label>
            {field("Date of Birth","dob",{type:"date"})}
            {field("Grade","grade")}
            {field("School","school")}
            {field("Branch","branch")}
            <label style={{display:"grid",gridTemplateColumns:"112px 1fr",gap:8,alignItems:"start",fontSize:13,color:C.muted,marginBottom:16}}><span>Notes</span><textarea value={f.notes||""} onChange={update("notes")} rows={3} style={{border:`1px solid ${C.border}`,borderRadius:4,padding:8,resize:"vertical",font:"14px 'Anthropic Sans', sans-serif",background:C.bg,color:C.text}}/>
             </label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {button("Attendance",()=>{}, C.accent)}
              {button("Payments",()=>{}, C.amber)}
              {button("Results",()=>{}, C.accent2)}
              {button("Tute",()=>{}, C.col02)}
              {button("View / Print ID",()=>setShowIdCard(true), C.emerald)}
            </div>
            {saved&&<div style={{color:C.emerald,fontSize:12,marginTop:12}}>Student changes saved.</div>}
          </div>
          <div style={panel}>
            <div style={heading}>Other Informations</div>
            {field("Parent / Guardian","parent")}
            {field("Parent Mobile","phone")}
            {field("Registration Date","regDate",{type:"date"})}
            
          </div>
        </section>
        <section>
          <div
             className="student-profile-summary-layout"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.8fr)",
                gap: 12,
                minWidth: 0,
              }}>

            <div style={panel}>
              <div style={heading}>Photo</div>
              <div style={{height:120,display:"grid",placeItems:"center",color:C.text,fontSize:42,fontWeight:700,background:C.subtle,borderRadius:6}}>{(f.avatar||f.name||"ST").slice(0,2).toUpperCase()}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:10}}>Student photo</div></div>
            <div style={panel}><div style={heading}>Student Summary</div><div style={{fontSize:13,lineHeight:2.1}}><div><b>Student ID:</b> {f.id}</div><div><b>Monthly fee:</b> Rs. {fmt(studentMonthlyFee(f,classes))}</div><div><b>Attendance:</b> {f.attendance??0}%</div><div><b>Fee status:</b> {f.paid===true?"Paid":f.paid===false?"Unpaid":"Not recorded"}</div></div></div>
          </div>
          <div style={{...panel,padding:"24px 16px 18px"}}>
            <div style={{position:"absolute",top:-10,left:12,color:C.text,background:C.subtle,borderRadius:14,padding:"3px 22px",minWidth:150,textAlign:"center",fontSize:14}}>Class Informations</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:18}}>
              <input aria-label="Grade" value={f.grade||""} onChange={update("grade")} placeholder="Grade" style={{height:34,border:`1px solid ${C.border}`,borderRadius:4,padding:"5px 8px",font:"14px 'Anthropic Sans', sans-serif",minWidth:0,background:C.bg,color:C.text}}/>
              <input aria-label="School" value={f.school||""} onChange={update("school")} placeholder="School / Institution" style={{background:C.bg,color:C.text,height:34,border:`1px solid ${C.border}`,borderRadius:4,padding:"5px 8px",font:"14px 'Anthropic Sans', sans-serif",minWidth:0}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 54px 54px",gap:8,alignItems:"end",padding:"10px 10px 10px",borderBottom:`2px solid ${C.border}`,fontSize:12,color:C.muted,marginBottom:8}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}><span>Teacher:</span><span>Class:</span><span>Subject:</span><span>Fees Amount:</span></div><span style={{textAlign:"center"}}>Free</span><span style={{textAlign:"center"}}>Half Card</span>
            </div>
            {Array.from({length:14},(_,i)=>{
              const assignments = Array.isArray(f.classAssignments)?f.classAssignments:[];
              const assignment = assignments[i]||{classId:"",free:false,half:false};
              const selectedClass = classes.find(c=>String(c.id)===String(assignment.classId));
              const classLabel = c => `${c.teacher||"—"} - ${c.grade||f.grade||"—"} - ${c.subject||c.name||"Class"} - ${c.fee??c.monthlyFee??"—"}${c.time?` (${c.time})`:""}`;
              const setAssignment = patch => setF(v=>{const rows=Array.from({length:14},(_,j)=>({...((v.classAssignments||[])[j]||{classId:"",free:false,half:false})}));rows[i]={...rows[i],...patch};const subjects=Array.from(new Set([...((v.subjects)||[]),...(patch.classId&&selectedClass?[selectedClass.subject||selectedClass.name].filter(Boolean):[])]));return {...v,classAssignments:rows,subjects};});
              return <div key={i} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 54px 54px",gap:8,alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                <select aria-label={`Enrolled class ${i+1}`} value={assignment.classId||""} onChange={e=>{const c=classes.find(c=>String(c.id)===e.target.value);setF(v=>{const rows=Array.from({length:14},(_,j)=>({...((v.classAssignments||[])[j]||{classId:"",free:false,half:false})}));rows[i]={...rows[i],classId:e.target.value};const subjects=c?Array.from(new Set([...(v.subjects||[]),c.subject||c.name].filter(Boolean))):v.subjects||[];return {...v,classAssignments:rows,subjects};});}} style={{width:"100%",height:38,border:`1px solid ${C.border}`,borderRadius:4,background:C.bg,padding:"6px 8px",font:"13px 'Anthropic Sans', sans-serif",color:C.muted,minWidth:0}}>
                  <option value="">Select an Class</option>{classes.map(c=><option key={c.id} value={String(c.id)}>{classLabel(c)}</option>)}
                </select>
                <input aria-label={`Free card for class ${i+1}`} type="checkbox" checked={!!assignment.free} onChange={e=>setAssignment({free:e.target.checked,half:e.target.checked?false:assignment.half})} style={{justifySelf:"center",width:16,height:16}}/>
                <input aria-label={`Half card for class ${i+1}`} type="checkbox" checked={!!assignment.half} onChange={e=>setAssignment({half:e.target.checked,free:e.target.checked?false:assignment.free})} style={{justifySelf:"center",width:16,height:16}}/>
              </div>;
            })}
            {classes.length===0&&<div style={{fontSize:12,color:C.muted,marginTop:12}}>No classes configured yet. Add classes in Classes & Timetable to populate these selectors.</div>}
            <div style={{marginTop:18,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><span style={{fontSize:13,color:C.muted}}>Monthly total: <b style={{color:C.accent}}>Rs. {fmt(studentMonthlyFee(f,classes))}</b></span>{button("Save profile",()=>{onSave({...f,fee:studentMonthlyFee(f,classes)});setSaved(true)},C.emerald)}</div>
          </div>
        </section>
      </div>
      {showIdCard&&<Modal title="Student ID Card" onClose={()=>setShowIdCard(false)} wide>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div className="edupeak-id-card" style={{width:"min(380px,100%)",height:640,boxSizing:"border-box",background:"#17813a",borderRadius:28,boxShadow:"0 12px 30px rgba(0,0,0,.2)",display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative",overflow:"hidden",color:"#fff",padding:"24px 24px 135px",fontFamily:"'Anthropic Sans',sans-serif"}}>
            <div style={{position:"relative",zIndex:2}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginTop:4}}><div style={{width:36,height:36,background:"#fff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 5px rgba(0,0,0,.1)"}}><svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="3" width="20" height="18" rx="3" fill="#17813a"/><path d="M7 8h10M7 12h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="15" cy="15" r="2" fill="#fff"/></svg></div><span style={{fontSize:"1.05rem",fontWeight:500,letterSpacing:"-.01em"}}>EduPeak</span></div>
              <div style={{width:"calc(100% + 48px)",height:1,background:"rgba(255,255,255,.2)",margin:"18px -24px 0"}}/>
            </div>
            <div style={{position:"relative",zIndex:2}}>
              <h1 style={{fontSize:"2.1rem",fontWeight:700,letterSpacing:"-.02em",margin:"0 0 24px",color:"#fff"}}>Student ID</h1>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:10}}>
                <div style={{minWidth:0}}><label style={{display:"block",fontSize:".75rem",color:"#a3d4b2",marginBottom:4,fontWeight:500}}>Name</label><div style={{fontSize:"1.05rem",fontWeight:600,overflowWrap:"anywhere"}}>{f.name||"Student name"}</div></div>
                <div style={{textAlign:"right",minWidth:0}}><label style={{display:"block",fontSize:".75rem",color:"#a3d4b2",marginBottom:4,fontWeight:500}}>ID number</label><div style={{fontSize:"1.05rem",fontWeight:600,overflowWrap:"anywhere"}}>{f.id}</div></div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",margin:"10px 0",position:"relative",zIndex:2}}><div style={{background:"#fff",padding:8,borderRadius:"50%",width:140,height:140,boxShadow:"0 8px 20px rgba(0,0,0,.15)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>{f.photoUrl||f.photo||f.avatarUrl?<img src={f.photoUrl||f.photo||f.avatarUrl} alt={`${f.name} profile`} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",background:"#cbd5e1"}}/>:<svg viewBox="0 0 100 100" style={{width:"100%",height:"100%",borderRadius:"50%",background:"#cbd5e1"}}><circle cx="50" cy="40" r="22" fill="#64748b"/><path d="M15 85c0-18.2 14.8-33 33-33h4c18.2 0 33 14.8 33 33v5H15v-5z" fill="#64748b"/></svg>}</div></div>
            <div style={{background:"#fff",padding:"10px 16px",borderRadius:12,width:"100%",display:"flex",flexDirection:"column",alignItems:"center",boxShadow:"0 4px 12px rgba(0,0,0,.1)",position:"relative",zIndex:2}}><Code39Barcode value={f.id}/><div style={{fontSize:".85rem",fontWeight:700,letterSpacing:".2em",color:"#0f172a",marginTop:4,overflowWrap:"anywhere",textAlign:"center"}}>*{f.id}*</div></div>
            <div style={{position:"absolute",bottom:0,left:0,width:"100%",height:170,pointerEvents:"none",overflow:"hidden",zIndex:1}}><svg viewBox="0 0 380 170" fill="none" style={{width:"100%",height:"100%",display:"block"}}><rect x="230" y="50" width="130" height="90" rx="10" fill="#136930" opacity=".6"/><rect x="250" y="70" width="36" height="42" rx="4" fill="#0d4d21" opacity=".7"/><rect x="296" y="72" width="50" height="6" rx="3" fill="#0d4d21" opacity=".7"/><rect x="296" y="86" width="35" height="6" rx="3" fill="#0d4d21" opacity=".7"/><circle cx="160" cy="90" r="45" fill="#115e2a" opacity=".7"/><path d="M160 72c7 0 12 5 12 12s-5 12-12 12-12-5-12-12 5-12 12-12z" fill="#0d4d21" opacity=".8"/><path d="M142 120c0-10 8-15 18-15s18 5 18 15v5H142v-5z" fill="#0d4d21" opacity=".8"/><g transform="translate(90 80) rotate(-4)"><rect x="0" y="0" width="180" height="110" rx="12" fill="#0b421d" stroke="#167937" strokeWidth="2"/><circle cx="50" cy="55" r="22" stroke="#147333" strokeWidth="2"/><path d="M28 55h44M50 33v44M35 41c10 5 20 5 30 0M35 69c10-5 20-5 30 0" stroke="#147333" strokeWidth="1.5"/><rect x="85" y="38" width="22" height="16" rx="3" fill="#147333"/><rect x="85" y="66" width="60" height="8" rx="4" fill="#147333"/><rect x="85" y="82" width="35" height="8" rx="4" fill="#147333"/></g><rect x="-20" y="115" width="110" height="75" rx="8" fill="#115e2a" opacity=".5" transform="rotate(-10 -20 115)"/></svg></div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}><Btn label="Print ID card" icon={Printer} onClick={()=>printStudentIdCard(f)}/><Btn label="Close" outline onClick={()=>setShowIdCard(false)}/></div>
          <div style={{fontSize:12,color:C.muted,textAlign:"center",maxWidth:380}}>The ID is generated from enrollment year, first-enrolled grade, and that cohort's registration position. IDs remain unchanged when a student's current grade is edited.</div>
        </div>
      </Modal>}
    </div>
  );
};

const StudentProfilePage = ({ student, onBack, onEdit }) => {
  const {
    classes = [],
    fees = [],
    attendance = [],
    teachers = [],
    setFees,
    setStudents,
  } = useStore();

  const initials = (student.avatar || student.name || "ST")
    .slice(0, 2)
    .toUpperCase();

  const assignments = (
    Array.isArray(student.classAssignments)
      ? student.classAssignments
      : []
  )
    .filter((a) => a?.classId)
    .map((a) => ({
      a,
      c: classes.find(
        (c) => String(c.id) === String(a.classId)
      ),
    }))
    .filter((x) => x.c);

  const studentFees = fees.filter(
    (f) =>
      (f.studentId &&
        String(f.studentId) === String(student.id)) ||
      (!f.studentId && f.student === student.name)
  );

  const logs = attendance
    .filter(
      (a) =>
        String(a.studentId || a.student || "") ===
          String(student.id) ||
        a.student === student.name
    )
    .slice(-8)
    .reverse();

  const panel = {
    background: C.card,
    backdropFilter: "blur(12px)",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 18,
    boxShadow: "0 5px 18px rgba(23,40,58,.06)",
    color: C.text,
    minWidth: 0,
  };

  const row = (k, v) => (
    <div
      key={k}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "9px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span style={{ color: C.muted, fontSize: 12 }}>
        {k}
      </span>

      <span
        style={{
          fontSize: 13,
          color: C.text,
          fontWeight: 500,
          textAlign: "right",
          overflowWrap: "anywhere",
        }}
      >
        {v || "—"}
      </span>
    </div>
  );

  const tableHead = (headers) => (
    <thead>
      <tr>
        {headers.map((h) => (
          <th
            key={h}
            scope="col"
            style={{
              textAlign: "left",
              padding: 9,
              color: C.muted,
              borderBottom: `1px solid ${C.border}`,
              whiteSpace: "nowrap",
            }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );

  // -------------------------------------------------------
  // QUICK PAYMENT STATE
  // -------------------------------------------------------

  const currentMonth = new Date().toLocaleDateString("en-LK", {
    month: "long",
    year: "numeric",
  });

  const [quickPaymentSelection, setQuickPaymentSelection] =
    useState("");

  const [quickPaymentMonth, setQuickPaymentMonth] =
    useState(currentMonth);

  const [quickPaymentStatus, setQuickPaymentStatus] =
    useState(null);

  const [quickPaymentReceipt, setQuickPaymentReceipt] =
    useState(null);

  // Build payment options from the student's enrolled classes.
  const quickPaymentOptions = assignments.length
    ? assignments.map(({ a, c }) => {
        const base = Math.max(
          0,
          Number(c.monthlyFee ?? c.fee) || 0
        );

        const amount = a.free
          ? 0
          : a.half
            ? base / 2
            : base;

        const subject = String(
          c.subject || c.name || "General"
        );

        const teacher =
          c.teacher || teacherFor(subject, teachers);

        return {
          value: `class:${c.id}`,
          classId: c.id,
          className: c.name || subject,
          subject,
          teacher,
          amount,
          free: Boolean(a.free),
          half: Boolean(a.half),
          grade: c.grade || student.grade || "—",
          label: `${teacher || "—"} - ${
            c.grade || student.grade || "—"
          } - ${subject} - ${fmt(amount)}`,
        };
      })
    : subjectsOf(student).map((subject) => {
        const teacher = teacherFor(subject, teachers);
        const amount = Math.max(
          0,
          Number(feeFor(student, subject, classes)) || 0
        );

        return {
          value: `subject:${subject}`,
          classId: null,
          className: subject,
          subject,
          teacher,
          amount,
          free: false,
          half: false,
          grade: student.grade || "—",
          label: `${teacher || "—"} - ${
            student.grade || "—"
          } - ${subject} - ${fmt(amount)}`,
        };
      });

  const selectedQuickOption =
    quickPaymentOptions.find(
      (option) => option.value === quickPaymentSelection
    ) ||
    quickPaymentOptions[0] ||
    null;

  // Previous months, current month, and upcoming months.
  const quickPaymentMonthOptions = Array.from(
    new Set([
      ...Array.from({ length: 16 }, (_, i) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() + i - 12);

        return date.toLocaleDateString("en-LK", {
          month: "long",
          year: "numeric",
        });
      }),
      ...fees.map((fee) => fee.month).filter(Boolean),
    ])
  );

  // Prevent duplicate payments for the same student,
  // class/subject, and month.
  const alreadyPaidQuick =
    Boolean(selectedQuickOption) &&
    fees.some((fee) => {
      const belongs = fee.studentId
        ? String(fee.studentId) === String(student.id)
        : fee.student === student.name;

      const sameClass = selectedQuickOption.classId
        ? fee.classId
          ? String(fee.classId) ===
            String(selectedQuickOption.classId)
          : fee.subject === selectedQuickOption.subject
        : fee.subject === selectedQuickOption.subject;

      return (
        belongs &&
        sameClass &&
        fee.month === quickPaymentMonth &&
        String(fee.status || "").toLowerCase() === "paid"
      );
    });

  useEffect(() => {
    setQuickPaymentStatus(null);
    setQuickPaymentReceipt(null);
    setQuickPaymentSelection("");
    setQuickPaymentMonth(currentMonth);
  }, [student.id]);

  const recordQuickPayment = (event) => {
    event.preventDefault();

    if (!selectedQuickOption) {
      setQuickPaymentStatus({
        kind: "error",
        text: "Please select an enrolled subject.",
      });
      return;
    }

    if (
      !Number.isFinite(Number(selectedQuickOption.amount)) ||
      Number(selectedQuickOption.amount) <= 0
    ) {
      setQuickPaymentStatus({
        kind: "error",
        text: "There is no payable fee for this selection.",
      });
      return;
    }

    if (alreadyPaidQuick) {
      setQuickPaymentStatus({
        kind: "error",
        text: `A payment is already recorded for ${
          selectedQuickOption.subject
        } in ${quickPaymentMonth}.`,
      });
      return;
    }

    const now = new Date();

    const receipt = {
      id: nextFeeId(fees),
      studentId: student.id,
      student: student.name,
      classId: selectedQuickOption.classId || undefined,
      className: selectedQuickOption.className,
      teacher: selectedQuickOption.teacher || "—",
      subject: selectedQuickOption.subject,
      amount: Number(selectedQuickOption.amount),
      date: isoDate(now),
      time: now.toLocaleTimeString("en-LK", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Paid",
      method: "Cash",
      month: quickPaymentMonth,
      notes: [
        "Quick payment from student profile",
        selectedQuickOption.free
          ? "Free enrollment"
          : selectedQuickOption.half
            ? "Half Card concession"
            : "",
      ]
        .filter(Boolean)
        .join("; "),
    };

    setFees((previousFees) => [receipt, ...previousFees]);

    // Update the student's overall paid flag for the current month.
    if (quickPaymentMonth === currentMonth) {
      const existingPaid = fees
        .filter((fee) => {
          const belongs = fee.studentId
            ? String(fee.studentId) === String(student.id)
            : fee.student === student.name;

          return (
            belongs &&
            fee.month === quickPaymentMonth &&
            String(fee.status || "").toLowerCase() === "paid"
          );
        })
        .reduce(
          (sum, fee) => sum + (Number(fee.amount) || 0),
          0
        );

      const totalDue = studentMonthlyFee(student, classes);

      if (existingPaid + receipt.amount >= totalDue) {
        setStudents((previousStudents) =>
          previousStudents.map((item) =>
            String(item.id) === String(student.id)
              ? { ...item, paid: true }
              : item
          )
        );
      }
    }

    setQuickPaymentReceipt(receipt);

    setQuickPaymentStatus({
      kind: "success",
      text: `Payment of Rs. ${fmt(
        receipt.amount
      )} recorded for ${receipt.subject} · ${quickPaymentMonth}. Receipt ${
        receipt.id
      }.`,
    });
  };

  // -------------------------------------------------------
  // STUDENT PROFILE
  // -------------------------------------------------------

  return (
    <div
      style={{
        position: "relative",
        isolation: "isolate",
        color: C.text,
        maxWidth: 1500,
        margin: "0 auto",
        paddingBottom: 30,
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at top left, var(--ep-accent-soft), transparent 42%), var(--ep-bg)",
        }}
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient
            id="profileGlow"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--ep-border)" stopOpacity=".4" />
            <stop offset="40%" stopColor="var(--ep-border-strong)" stopOpacity=".5" />
            <stop offset="80%" stopColor="var(--ep-card-raised)" stopOpacity=".3" />
            <stop offset="100%" stopColor="var(--ep-bg)" stopOpacity=".1" />
          </linearGradient>
        </defs>

        <g opacity=".6">
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d={`M ${350 - i * 20},-50 Q ${
                550 - i * 20
              },160 ${750 - i * 20},60 T ${
                1150 - i * 20
              },340 T 1500,${450 - i * 10}`}
              fill="none"
              stroke="url(#profileGlow)"
              strokeWidth="1.2"
            />
          ))}
        </g>

        <g opacity=".65">
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M -50,${450 + i * 20} Q ${
                120 + i * 20
              },${480 + i * 10} ${70 + i * 20},${
                630 + i * 10
              } T ${220 + i * 20},${
                770 + i * 10
              } T ${550 + i * 20},950`}
              fill="none"
              stroke="url(#profileGlow)"
              strokeWidth="1.2"
            />
          ))}
        </g>
      </svg>

      {/* PROFILE HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
          paddingBottom: 16,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            Student Profile
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.muted,
              marginTop: 5,
            }}
          >
            Full student record · {student.id}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.text,
              background: C.subtle,
              padding: "9px 14px",
              cursor: "pointer",
            }}
          >
            ← Back to students
          </button>

          <button
            onClick={onEdit}
            style={{
              border: 0,
              borderRadius: 6,
              color: C.ink,
              background: C.accent,
              fontWeight: 700,
              padding: "9px 16px",
              cursor: "pointer",
            }}
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div
        className="student-profile-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px,1fr) minmax(0,1.8fr)",
          gap: 12,
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: "grid", gap: 12 }}>
          {/* STUDENT INFORMATION */}
          <section style={panel}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              Student Information
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  flexShrink: 0,
                  borderRadius: 12,
                  background:
                    "linear-gradient(145deg,var(--ep-card-raised),var(--ep-bg))",
                  border: `1px solid ${C.border}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  overflow: "hidden",
                }}
              >
                {student.photoUrl ||
                student.photo ||
                student.avatarUrl ? (
                  <img
                    src={
                      student.photoUrl ||
                      student.photo ||
                      student.avatarUrl
                    }
                    alt={student.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                  />
                ) : (
                  initials
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>
                  {student.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    marginTop: 3,
                  }}
                >
                  {student.id}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    marginTop: 5,
                  }}
                >
                  {student.grade || "Grade not set"}
                </div>
              </div>
            </div>

            {[
              ["Email", student.email],
              ["Phone", student.phone],
              ["Address", student.address],
              ["City", student.city],
              ["Gender", student.gender],
              ["Date of birth", student.dob],
              ["School", student.school],
              ["Branch", student.branch],
              ["Parent / Guardian", student.parent],
              [
                "Parent mobile",
                student.parentPhone ||
                  student.parentMobile ||
                  student.phone,
              ],
              ["Registration date", student.regDate],
              ["Notes", student.notes],
            ].map(([k, v]) => row(k, v))}
          </section>

          {/* STUDENT SUMMARY */}
          <section style={panel}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 10,
              }}
            >
              Student Summary
            </div>

            {row(
              "Monthly fee",
              `Rs. ${fmt(studentMonthlyFee(student, classes))}`
            )}
            {row(
              "Attendance",
              `${student.attendance ?? 0}%`
            )}
            {row(
              "Fee status",
              studentFees.some((f) => f.status === "Paid")
                ? "Paid"
                : studentFees.length
                  ? "Unpaid"
                  : "Not recorded"
            )}
            {row("Class enrollments", assignments.length)}
            {row("Concession", student.concession || "None")}
          </section>
        </div>

        {/* RIGHT COLUMN: KEEP ALL SECTIONS INSIDE THIS DIV */}
        <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
          {/* CLASS INFORMATION */}
          <section style={panel}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              Class Information
            </div>

            {assignments.length ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                  }}
                >
                  {tableHead([
                    "Teacher",
                    "Class",
                    "Subject",
                    "Fees Amount",
                    "Free",
                    "Half Card",
                  ])}

                  <tbody>
                    {assignments.map(({ a, c }, i) => (
                      <tr
                        key={c.id || i}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <td style={{ padding: 9 }}>
                          {c.teacher || "—"}
                        </td>
                        <td style={{ padding: 9 }}>
                          {c.grade || student.grade || "—"}
                        </td>
                        <td style={{ padding: 9 }}>
                          {c.subject || c.name || "—"}
                        </td>
                        <td style={{ padding: 9, whiteSpace: "nowrap" }}>
                          Rs.{" "}
                          {fmt(
                            a.free
                              ? 0
                              : a.half
                                ? (Number(c.monthlyFee ?? c.fee) || 0) / 2
                                : Number(c.monthlyFee ?? c.fee) || 0
                          )}
                        </td>
                        <td style={{ padding: 9 }}>
                          {a.free ? "✓" : "—"}
                        </td>
                        <td style={{ padding: 9 }}>
                          {a.half ? "✓" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  color: C.muted,
                  fontSize: 13,
                  padding: "12px 0",
                }}
              >
                No classes enrolled yet.
              </div>
            )}
          </section>

          {/* RECENT ATTENDANCE */}
          <section style={panel}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              Recent Attendance
            </div>

            {logs.length ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                  }}
                >
                  {tableHead([
                    "Class",
                    "Date",
                    "Time",
                    "Status",
                  ])}

                  <tbody>
                    {logs.map((a, i) => (
                      <tr
                        key={a.id || i}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <td style={{ padding: 9 }}>
                          {a.className || a.class || "—"}
                        </td>
                        <td style={{ padding: 9 }}>
                          {a.date || "—"}
                        </td>
                        <td style={{ padding: 9 }}>
                          {a.time || "—"}
                        </td>
                        <td style={{ padding: 9 }}>
                          {a.status || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: C.muted, fontSize: 13 }}>
                No attendance recorded yet.
              </div>
            )}
          </section>

          {/* PAYMENT HISTORY */}
          <section style={panel}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              Payment History
            </div>

            {studentFees.length ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                  }}
                >
                  {tableHead([
                    "Date",
                    "Subject",
                    "Month",
                    "Amount",
                    "Status",
                  ])}

                  <tbody>
                    {studentFees.map((f, i) => (
                      <tr
                        key={f.id || i}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <td style={{ padding: 9 }}>
                          {f.date || "—"}
                        </td>
                        <td style={{ padding: 9 }}>
                          {f.subject || "—"}
                        </td>
                        <td style={{ padding: 9 }}>
                          {f.month || "—"}
                        </td>
                        <td style={{ padding: 9, whiteSpace: "nowrap" }}>
                          Rs. {fmt(Number(f.amount) || 0)}
                        </td>
                        <td style={{ padding: 9 }}>
                          {f.status || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: C.muted, fontSize: 13 }}>
                No payment records yet.
              </div>
            )}
          </section>

          {/* =================================================
              QUICK PAYMENT
              Correctly placed inside the right column,
              immediately after Payment History.
             ================================================= */}
          <section
            style={{
              ...panel,
              padding: 0,
              overflow: "hidden",
            }}
          >
            {/* TITLE */}
            <div
              style={{
                padding: "16px 18px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Quick Payment
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 4,
                }}
              >
                Record a payment directly from this student profile.
              </div>
            </div>

            {/* FOUR-COLUMN TABLE */}
            <div
              style={{
                width: "100%",
                maxWidth: "100%",
                overflowX: "auto",
              }}
            >
              <form
                onSubmit={recordQuickPayment}
                style={{ margin: 0 }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: 700,
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <colgroup>
                    <col style={{ width: "42%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "24%" }} />
                    <col style={{ width: "18%" }} />
                  </colgroup>

                  <thead>
                    <tr>
                      {[
                        "Subject",
                        "Paying",
                        "Month",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          style={{
                            padding: "13px 10px",
                            background: C.accent,
                            color: C.ink,
                            textAlign: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: ".03em",
                            whiteSpace: "nowrap",
                            border: "none",
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <tr style={{ background: C.bg }}>
                      {/* SUBJECT */}
                      <td
                        style={{
                          padding: 10,
                          verticalAlign: "middle",
                        }}
                      >
                        <select
                          aria-label="Payment subject"
                          value={
                            selectedQuickOption?.value || ""
                          }
                          onChange={(event) => {
                            setQuickPaymentSelection(
                              event.target.value
                            );
                            setQuickPaymentStatus(null);
                            setQuickPaymentReceipt(null);
                          }}
                          disabled={!quickPaymentOptions.length}
                          style={{
                            display: "block",
                            width: "100%",
                            minWidth: 0,
                            boxSizing: "border-box",
                            background: C.bg,
                            color: C.text,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: "11px 8px",
                            fontSize: 12,
                            fontFamily: "inherit",
                          }}
                        >
                          {!quickPaymentOptions.length ? (
                            <option value="">
                              No enrolled subjects
                            </option>
                          ) : (
                            quickPaymentOptions.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))
                          )}
                        </select>
                      </td>

                      {/* PAYING */}
                      <td
                        style={{
                          padding: 10,
                          verticalAlign: "middle",
                        }}
                      >
                        <div
                          style={{
                            minHeight: 42,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: "8px 4px",
                          }}
                        >
                          <span
                            style={{
                              color: C.accent,
                              fontSize: 17,
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmt(
                              Number(selectedQuickOption?.amount) ||
                                0
                            )}
                          </span>
                        </div>
                      </td>

                      {/* MONTH */}
                      <td
                        style={{
                          padding: 10,
                          verticalAlign: "middle",
                        }}
                      >
                        <select
                          aria-label="Payment month"
                          value={quickPaymentMonth}
                          onChange={(event) => {
                            setQuickPaymentMonth(event.target.value);
                            setQuickPaymentStatus(null);
                            setQuickPaymentReceipt(null);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            minWidth: 0,
                            boxSizing: "border-box",
                            background: C.bg,
                            color: C.text,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: "11px 7px",
                            fontSize: 12,
                            fontFamily: "inherit",
                          }}
                        >
                          {quickPaymentMonthOptions.map((month) => (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* ACTION */}
                      <td
                        style={{
                          padding: 10,
                          verticalAlign: "middle",
                        }}
                      >
                        <button
                          type="submit"
                          disabled={
                            !selectedQuickOption ||
                            Number(selectedQuickOption.amount) <=
                              0 ||
                            alreadyPaidQuick
                          }
                          style={{
                            display: "block",
                            width: "100%",
                            boxSizing: "border-box",
                            border: "none",
                            borderRadius: 12,
                            padding: "12px 5px",
                            background: C.accent,
                            color: C.ink,
                            fontSize: 13,
                            fontWeight: 800,
                            letterSpacing: ".02em",
                            cursor: "pointer",
                            opacity: alreadyPaidQuick ? 0.5 : 1,
                            boxShadow:
                              `0 0 16px ${alphaColor(C.accent, 25)}`,
                          }}
                        >
                          {alreadyPaidQuick ? "PAID" : "PAY NOW"}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </form>
            </div>

            {/* PAYMENT NOTES AND RECEIPT */}
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                {selectedQuickOption?.free
                  ? "Free enrollment"
                  : selectedQuickOption?.half
                    ? "Half Card concession applied"
                    : "Payment method: Cash"}
              </span>

              {quickPaymentReceipt && (
                <button
                  type="button"
                  onClick={() =>
                    printThermalReceipt(quickPaymentReceipt)
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    background: C.subtle,
                    color: C.text,
                    cursor: "pointer",
                  }}
                >
                  <Printer size={14} />
                  Print receipt
                </button>
              )}
            </div>

            {/* FEEDBACK */}
            {quickPaymentStatus && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  margin: "0 16px 16px",
                  padding: 12,
                  borderRadius: 8,
                  background:
                    quickPaymentStatus.kind === "success"
                      ? "rgba(0,176,116,.1)"
                      : "rgba(248,113,113,.1)",
                  color:
                    quickPaymentStatus.kind === "success"
                      ? C.emerald
                      : C.rose,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {quickPaymentStatus.text}
              </div>
            )}
          </section>
        </div>
        {/* END RIGHT COLUMN */}
      </div>
      {/* END MAIN PROFILE GRID */}

    </div>
  );
};

const StudentsPage = ({openStudentId,clearOpen}) => {
  const {students,setStudents} = useStore();
  const [search,setSearch]     = useState("");
  const [showAdd,setShowAdd]   = useState(false);
  const [selected,setSelected] = useState(null);
  const [editingProfile,setEditingProfile] = useState(false);
  const [editing,setEditing]   = useState(null);
  const [form,setForm]         = useState({name:"",nic:"",dob:"",school:"",grade:"",subjects:[],parent:"",phone:"",branch:"",fee:""});
  const upd  = k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const updE = k=>e=>setEditing(ed=>({...ed,[k]:e.target.value}));

  // open from global search
  useEffect(()=>{
    if(openStudentId){
      const s=students.find(x=>x.id===openStudentId);
      if(s) { setSelected(s); setEditingProfile(false); }
      clearOpen();
    }
  },[openStudentId]);

  const toggleSubject = (sub) => setForm(f=>({...f,subjects:f.subjects.includes(sub)?f.subjects.filter(s=>s!==sub):[...f.subjects,sub]}));
  const toggleSubjectEdit=(sub)=>setEditing(ed=>({...ed,subjects:ed.subjects.includes(sub)?ed.subjects.filter(s=>s!==sub):[...ed.subjects,sub]}));

  const register = () => {
    if(!form.name.trim() || !studentGradeCode(form.grade)) return;
    const enrollmentDate=isoDate();
    const initials=form.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"ST";
    setStudents(prev=>{
      const id=nextStudentId(prev,form.grade,enrollmentDate);
      if(!id)return prev;
      return [...prev,{id,firstEnrolledGrade:form.grade,regDate:enrollmentDate,concession:"None",name:form.name.trim(),nic:form.nic,dob:form.dob,grade:form.grade,subjects:form.subjects.length?form.subjects:["General"],fee:Math.max(0,Number(form.fee)||0),paid:false,attendance:0,avatar:initials,branch:form.branch||"",parent:form.parent,phone:form.phone,school:form.school,month:new Date().toLocaleDateString("en-LK",{month:"long",year:"numeric"})}];
    });
    setShowAdd(false);
    setForm({name:"",nic:"",dob:"",school:"",grade:"",subjects:[],parent:"",phone:"",branch:"",fee:""});
  };
  const idPreview=nextStudentId(students,form.grade,isoDate());
  const saveEdit=()=>{setStudents(prev=>prev.map(s=>s.id===editing.id?{...s,...editing}:s));setEditing(null);};

  const filtered=students.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.grade.toLowerCase().includes(search.toLowerCase()));

  if(selected) { const current=students.find(s=>s.id===selected.id)||selected; return editingProfile ? <StudentEditProfilePage student={current} onBack={()=>setEditingProfile(false)} onSave={updated=>{setStudents(prev=>prev.map(s=>s.id===updated.id?{...s,...updated}:s));setSelected(updated);setEditingProfile(false);}}/> : <StudentProfilePage student={current} onBack={()=>{setSelected(null);setEditingProfile(false);}} onEdit={()=>setEditingProfile(true)}/>; }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{color:C.text,fontSize:22,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Student Management</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>{students.length} student records · {new Set(students.map(s=>s.branch).filter(Boolean)).size} branches represented</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students…"
            style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 16px",color:C.text,fontSize:14,outline:"none",minWidth:200}}/>
          <Btn label="+ Add Student" onClick={()=>setShowAdd(true)}/>
        </div>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[["All",students.length,C.col01],["Paid",students.filter(s=>s.paid).length,C.col04],["Unpaid",students.filter(s=>s.paid===false).length,C.col05],["Low Attendance",students.filter(s=>s.attendance<80).length,C.col06]].map(([l,n,c])=>(
          <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 18px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
            <span style={{color:C.muted,fontSize:13}}>{l}</span>
            <span style={{color:C.text,fontWeight:700,fontSize:14}}>{n}</span>
          </div>
        ))}
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.subtle}}>
              {["Student","ID","Grade","Subjects","Branch","Attendance","Fee","Actions"].map(h=>(
                <th key={h} style={{padding:"14px 16px",textAlign:"left",color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s=>(
              <tr key={s.id} style={{borderBottom:`1px solid ${C.border}`,transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.subtle}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar initials={s.avatar} size={34} color={C.accent2}/>
                    <span style={{color:C.text,fontSize:14,fontWeight:600}}>{s.name}</span>
                  </div>
                </td>
                <td style={{padding:"14px 16px",whiteSpace:"nowrap",color:C.muted,fontSize:12,fontFamily:"monospace"}}>{s.id}</td>
                <td style={{padding:"14px 16px",whiteSpace:"nowrap",color:C.text,fontSize:13}}>{s.grade}</td>
                {/* ① subjects as tags */}
                <td style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {(s.subjects||[s.subject]).map(sub=><Badge key={sub} label={sub} color={C.accent2}/>)}
                  </div>
                </td>
                <td style={{padding:"14px 16px"}}><Badge label={s.branch} color={C.accent}/></td>
                <td style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:50,height:4,background:C.border,borderRadius:99}}>
                      <div style={{width:`${s.attendance}%`,height:"100%",background:s.attendance>90?C.emerald:s.attendance>75?C.amber:C.rose,borderRadius:99}}/>
                    </div>
                    <span style={{fontSize:12,color:C.muted}}>{s.attendance}%</span>
                  </div>
                </td>
                <td style={{padding:"14px 16px"}}><Badge label={s.paid===true?"Paid":s.paid===false?"Unpaid":"Not recorded"} color={s.paid===true?C.col04:s.paid===false?C.col05:C.muted}/></td>
                <td style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={e=>{e.stopPropagation();setSelected(s);}} style={{background:`${alphaColor(C.accent, 13)}`,border:`1px solid ${alphaColor(C.accent, 27)}`,borderRadius:8,padding:"4px 10px",color:C.accent,fontSize:12,cursor:"pointer"}}>View</button>
                    <button onClick={e=>{e.stopPropagation();setSelected(s);}} style={{background:`${alphaColor(C.accent2, 13)}`,border:`1px solid ${alphaColor(C.accent2, 27)}`,borderRadius:8,padding:"4px 10px",color:C.accent2,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:3}}><Pencil size={11}/>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showAdd && (
            <Modal
              title="Register New Student"
              onClose={() => setShowAdd(false)}
            >
              <Field
                label="Full Name"
                placeholder="e.g. Amal Perera"
                value={form.name}
                onChange={upd("name")}
              />

              <Field
                label="NIC / ID Number"
                placeholder="e.g. 200012345678"
                value={form.nic}
                onChange={upd("nic")}
                optional
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12
                }}
              >
                <Field
                  label="Date of Birth"
                  type="date"
                  value={form.dob}
                  onChange={upd("dob")}
                />

                <Field
                  label="Grade"
                  placeholder="Grade 11"
                  value={form.grade}
                  onChange={upd("grade")}
                />
              </div>

              <Field
                label="School Name"
                placeholder="e.g. Nalanda College"
                value={form.school}
                onChange={upd("school")}
              />

              {/* Multi-subject selector */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: C.muted,
                    marginBottom: 8,
                    fontWeight: 600
                  }}
                >
                  Subjects Enrolled
                </label>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8
                  }}
                >
                  {ALL_SUBJECTS.map((sub) => {
                    const sel = form.subjects.includes(sub);

                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        style={{
                          background: sel
                            ? `${alphaColor(C.accent, 13)}`
                            : "transparent",
                          border: `1.5px solid ${
                            sel ? C.accent : C.border
                          }`,
                          borderRadius: 6,
                          padding: "5px 14px",
                          color: sel ? C.accent : C.muted,
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: sel ? 700 : 400,
                          transition: "all 0.15s"
                        }}
                      >
                        {sel && (
                          <Check
                            size={11}
                            style={{
                              marginRight: 4,
                              display: "inline"
                            }}
                          />
                        )}
                        {sub}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: C.muted
                  }}
                >
                  No default tuition rates are assumed. Configure
                  class fees or enter this student's agreed monthly fee.
                </div>
              </div>

              <Field
                label="Parent / Guardian Name"
                placeholder="Parent / guardian name"
                value={form.parent}
                onChange={upd("parent")}
              />

              <Field
                label="Contact Number"
                placeholder="07X-XXXXXXX"
                type="tel"
                value={form.phone}
                onChange={upd("phone")}
              />

              <Field
                label="Branch"
                placeholder="Branch name"
                value={form.branch}
                onChange={upd("branch")}
              />

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 8
                }}
              >
                <Btn
                  label="Register Student"
                  onClick={register}
                  disabled={
                    !form.name.trim() ||
                    !studentGradeCode(form.grade)
                  }
                />

                <Btn
                  label="Cancel"
                  onClick={() => setShowAdd(false)}
                  outline
                />
              </div>
            </Modal>
      )}

      {editing&&(
        <StudentEditor student={editing} onClose={()=>setEditing(null)}
          onSave={u=>{setStudents(prev=>prev.map(x=>x.id===u.id?u:x));setEditing(null);}}
          onDelete={()=>{setStudents(prev=>prev.filter(x=>x.id!==editing.id));setEditing(null);}}/>
      )}

      {/* View Student Modal */}
      {selected&&(
        <Modal title="Student Profile" onClose={()=>setSelected(null)}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,padding:20,background:C.bg,borderRadius:12}}>
            <Avatar initials={selected.avatar} size={60} color={C.accent2}/>
            <div>
              <div style={{color:C.text,fontSize:18,fontWeight:700}}>{selected.name}</div>
              <div style={{color:C.muted,fontSize:12,marginTop:4,fontFamily:"monospace"}}>{selected.id} · {selected.grade}</div>
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                <Badge label={selected.branch} color={C.accent}/>
                <Badge label={selected.paid===true?"Fee Paid":selected.paid===false?"Fee Unpaid":"Fee status not recorded"} color={selected.paid===true?C.emerald:selected.paid===false?C.rose:C.muted}/>
              </div>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:8,fontWeight:600}}>ENROLLED SUBJECTS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(selected.subjects||[selected.subject]).map(s=><Badge key={s} label={s} color={C.accent2}/>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Attendance",`${selected.attendance}%`],["Monthly Fee",`Rs. ${fmt(selected.fee)}`],["Parent",selected.parent||"—"],["Phone",selected.phone||"—"],["School",selected.school||"—"],["Status","Active"]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:10,padding:14}}>
                <div style={{color:C.muted,fontSize:11,marginBottom:4}}>{k}</div>
                <div style={{color:C.text,fontWeight:600,fontSize:13}}>{v}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};


/* ─── Teachers ⑦ schedule/edit/salary ─────────────────────── */
const TeachersPage = ({openTeacherId,clearOpen}) => {
  const {teachers,setTeachers,classes,setClasses} = useStore();
  const [showAdd,setShowAdd]   = useState(false);
  const [viewing,setViewing]   = useState(null);
  const [editing,setEditing]   = useState(null);
  const [schedule,setSchedule] = useState(null);
  const [salary,setSalary]     = useState(null);
  const [teacherForm,setTeacherForm] = useState({name:"",nic:"",subject:"",phone:"",email:"",branch:""});
  const [scheduleForm,setScheduleForm] = useState({name:"",day:"Saturday",startTime:"09:00",room:"",capacity:"",monthlyFee:"",type:"Physical"});

  const openSchedule=(teacher)=>{setSchedule(teacher);setScheduleForm({name:"",day:"Saturday",startTime:"09:00",room:"",capacity:"",monthlyFee:"",type:"Physical"});};
  const upTeacher=k=>e=>setTeacherForm(v=>({...v,[k]:e.target.value}));
  const upSchedule=k=>e=>setScheduleForm(v=>({...v,[k]:e.target.value}));
  const calculateTeacherSalary = (teacherName) => {
    return classes
      .filter((c) => c.teacher === teacherName)
      .reduce((total, c) => {
        const classFee = Number(c.monthlyFee ?? c.fee) || 0;
        const enrolledStudents = Number(c.enrolled) || 0;
        return total + classFee * 0.75 * enrolledStudents;
      }, 0);
  };
  const addTeacher=()=>{
    if(!teacherForm.name.trim())return;
    const name=teacherForm.name.trim();
    const teacher={...teacherForm,id:`TEA-${Date.now()}`,name,avatar:name.split(/\s+/).map(n=>n[0]).join("").toUpperCase().slice(0,2),joined:isoDate(),classes:0,students:0,rating:null};
    setTeachers(prev=>[...prev,teacher]);setTeacherForm({name:"",nic:"",subject:"",phone:"",email:"",branch:""});setShowAdd(false);
  };
  const createTeacherClass=()=>{
    if(!scheduleForm.name.trim())return;
    const dayMap={Monday:"Mon",Tuesday:"Tue",Wednesday:"Wed",Thursday:"Thu",Friday:"Fri",Saturday:"Sat",Sunday:"Sun"};
    const [hour,minute]=scheduleForm.startTime.split(":").map(Number);const suffix=hour>=12?"PM":"AM";const time=`${dayMap[scheduleForm.day]} ${(hour%12)||12}:${String(minute||0).padStart(2,"0")} ${suffix}`;
    const next={id:`CL-${Date.now()}`,name:scheduleForm.name.trim(),teacher:schedule.name,subject:schedule.subject||"",day:scheduleForm.day,time,room:scheduleForm.room,capacity:Math.max(1,Number(scheduleForm.capacity)||1),enrolled:0,fee:Number(scheduleForm.monthlyFee)||0,monthlyFee:Number(scheduleForm.monthlyFee)||0,type:scheduleForm.type};
    setClasses(prev=>[...prev,next]);setSchedule(null);
  };

  useEffect(()=>{
    if(openTeacherId){
      const t=teachers.find(x=>x.id===openTeacherId);
      if(t) setViewing(t);
      clearOpen();
    }
  },[openTeacherId]);

  const upEdit=k=>e=>setEditing(ed=>({...ed,[k]:e.target.value}));
  const saveEdit=()=>{setTeachers(prev=>prev.map(t=>t.id===editing.id?{...t,...editing}:t));setViewing(editing);setEditing(null);};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{color:C.text,fontSize:22,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Teacher Management</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>{teachers.length} active teachers across all branches</p>
        </div>
        <Btn label="+ Add Teacher" onClick={()=>setShowAdd(true)}/>
      </div>

      {teachers.length===0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:34,textAlign:"center",color:C.muted,fontSize:13,marginBottom:18}}><UsersRound size={28} style={{margin:"0 auto 10px",opacity:.6}}/><div style={{color:C.text,fontWeight:600,marginBottom:5}}>No teacher records yet</div><div>Import historical teacher records or add the first teacher.</div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:18}}>
        {teachers.map(t=>{const assigned=classes.filter(c=>c.teacher===t.name);return (
          <div key={t.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14}}>
              <Avatar initials={t.avatar} size={48} color={C.accent}/>
              <div style={{flex:1}}>
                <div style={{color:C.text,fontWeight:700,fontSize:15,lineHeight:1.3}}>{t.name}</div>
                <div style={{color:C.muted,fontSize:12,marginTop:4}}>{t.subject}</div>
                <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}>
                  {[1,2,3,4,5].map(i=><Star key={i} size={12} fill={i<=Math.round(t.rating)?C.gold:"none"} stroke={C.gold}/>)}
                  <span style={{fontSize:12,color:C.gold,fontWeight:700,marginLeft:4}}>{t.rating==null?"Not rated":t.rating}</span>
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[
  ["Classes", assigned.length, C.accent],
  [
    "Students",
    assigned.reduce((sum, c) => sum + (Number(c.enrolled) || 0), 0),
    C.accent2
  ],
  [
    "Salary",
    `Rs. ${calculateTeacherSalary(t.name).toLocaleString("en-LK", {
      maximumFractionDigits: 2
    })}`,
    C.gold
  ]
].map(([l, v, c]) => (
                <div key={l} style={{background:C.bg,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{color:c,fontSize:16,fontWeight:700}}>{v}</div>
                  <div style={{color:C.muted,fontSize:10,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Btn label="View Profile" color={C.accent} small onClick={()=>setViewing(t)}/>
              <Btn label="Schedule" color={C.accent2} outline small onClick={()=>openSchedule(t)}/>
              <Btn label="Salary" color={C.gold} outline small onClick={()=>{setViewing(t);setSalary(t);}}/>
            </div>
          </div>
        );})}
      </div>

      {/* ⑦ Teacher Profile Modal */}
      {viewing&&!salary&&(
        <Modal title="Teacher Profile" onClose={()=>setViewing(null)} wide>
          <div style={{display:"flex",alignItems:"center",gap:18,padding:20,background:C.bg,borderRadius:12,marginBottom:22}}>
            <Avatar initials={viewing.avatar} size={64} color={C.accent}/>
            <div style={{flex:1}}>
              <div style={{color:C.text,fontSize:20,fontWeight:700}}>{viewing.name}</div>
              <div style={{color:C.muted,fontSize:13,marginTop:4}}>{viewing.subject} · {viewing.branch}</div>
              <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8}}>
                {[1,2,3,4,5].map(i=><Star key={i} size={14} fill={i<=Math.round(viewing.rating)?C.gold:"none"} stroke={C.gold}/>)}
                <span style={{color:C.gold,fontWeight:700,fontSize:13,marginLeft:4}}>{viewing.rating==null?"Not rated":`${viewing.rating} / 5.0`}</span>
              </div>
            </div>
            <Btn label="Edit Profile" icon={Pencil} color={C.accent2} small onClick={()=>setEditing({...viewing})}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            {[["Teacher ID",viewing.id],["NIC",viewing.nic||"—"],["Phone",viewing.phone||"—"],["Email",viewing.email||"—"],["Joined",viewing.joined||"—"],["Branch",viewing.branch||"—"],["Active Classes",classes.filter(c=>c.teacher===viewing.name).length],["Total Students",classes.filter(c=>c.teacher===viewing.name).reduce((sum,c)=>sum+(Number(c.enrolled)||0),0)],[
  "Calculated Monthly Salary",
  `Rs. ${calculateTeacherSalary(viewing.name).toLocaleString("en-LK", {
    maximumFractionDigits: 2
  })}`
],["Rating",viewing.rating==null?"Not rated":`${viewing.rating}/5.0`]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:10,padding:14}}>
                <div style={{color:C.muted,fontSize:11,marginBottom:4}}>{k}</div>
                <div style={{color:C.text,fontWeight:600,fontSize:13}}>{v}</div>
              </div>
            ))}
          </div>
          <SectionCard title="Classes Assigned">
            {classes.filter(c=>c.teacher===viewing.name).length===0
              ?<div style={{color:C.muted,fontSize:13}}>No classes currently assigned.</div>
              :classes.filter(c=>c.teacher===viewing.name).map(c=>(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{color:C.text,fontSize:13}}>{c.name}</span>
                <div style={{display:"flex",gap:8}}><Badge label={c.time} color={C.accent}/><Badge label={`${c.enrolled}/${c.capacity}`} color={C.accent2}/></div>
              </div>
            ))}
          </SectionCard>
          <div style={{display:"flex",gap:10}}>
            <Btn label="Salary Report" icon={WalletCards} color={C.gold} onClick={()=>setSalary(viewing)}/>
            <Btn label="Schedule Class" icon={CalendarPlus} color={C.accent2} onClick={()=>openSchedule(viewing)}/>
            <Btn label="Close" onClick={()=>setViewing(null)} outline/>
          </div>
        </Modal>
      )}

      {/* ⑦ Edit Teacher Modal */}
      {editing&&(
        <Modal title="Edit Teacher Profile" onClose={()=>setEditing(null)}>
          <Field label="Full Name" value={editing.name} onChange={upEdit("name")} placeholder="Full name"/>
          <Field label="Subject" value={editing.subject} onChange={upEdit("subject")} placeholder="Subject"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Phone" value={editing.phone} onChange={upEdit("phone")} placeholder="077-XXXXXXX" type="tel"/>
            <Field label="Email" value={editing.email} onChange={upEdit("email")} placeholder="Email address" type="email"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Branch" value={editing.branch} onChange={upEdit("branch")} placeholder="Branch name"/>
          </div>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <Btn label="Save Changes" icon={Save} color={C.accent} onClick={saveEdit}/>
            <Btn label="Cancel" onClick={()=>setEditing(null)} outline/>
          </div>
        </Modal>
      )}

      {/* Salary information: calculated from assigned classes */}
      {salary && (
        <Modal
          title={`Salary Information — ${salary.name}`}
          onClose={() => setSalary(null)}
          wide
        >
          <div style={{
            background: C.bg,
            borderRadius: 10,
            padding: 18,
            marginBottom: 16
          }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>
              Calculated Monthly Salary
            </div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 24 }}>
              Rs. {calculateTeacherSalary(salary.name).toLocaleString("en-LK", {
                maximumFractionDigits: 2
              })}
            </div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
              Formula: Class Fee × 75% × Enrolled Students
            </div>
          </div>
          <div style={{
            padding: 24,
            textAlign: "center",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            color: C.muted,
            fontSize: 13,
            lineHeight: 1.6
          }}>
            No salary payment transactions have been recorded or imported for this teacher.
            Payroll totals and payment statuses will appear after actual payroll records are added.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn label="Close" onClick={() => setSalary(null)} outline />
          </div>
        </Modal>
      )}

      {/* Schedule Class Modal */}
      {schedule&& (
        <Modal title={`Schedule Class — ${schedule.name}`} onClose={()=>setSchedule(null)}>
          <Field label="Class Title" placeholder="Enter class / batch name" value={scheduleForm.name} onChange={upSchedule("name")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Teacher" value={schedule.name} disabled/><Field label="Subject" value={schedule.subject||""} disabled/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><SelectField label="Day" value={scheduleForm.day} onChange={upSchedule("day")} options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}/><Field label="Start Time" type="time" value={scheduleForm.startTime} onChange={upSchedule("startTime")}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Room / Platform" placeholder="Room or platform" value={scheduleForm.room} onChange={upSchedule("room")}/><Field label="Capacity" placeholder="Maximum students" value={scheduleForm.capacity} onChange={upSchedule("capacity")} type="number"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Monthly Fee (Rs.)" placeholder="Monthly fee" value={scheduleForm.monthlyFee} onChange={upSchedule("monthlyFee")} type="number"/><SelectField label="Type" value={scheduleForm.type} onChange={upSchedule("type")} options={["Physical","Online","Hybrid"]}/></div>
          <div style={{display:"flex",gap:12,marginTop:8}}><Btn label="Create Class" icon={CalendarPlus} color={C.accent2} onClick={createTeacherClass} disabled={!scheduleForm.name.trim()}/><Btn label="Cancel" onClick={()=>setSchedule(null)} outline/></div>
        </Modal>
      )}

      {/* Add Teacher Modal */}
      {showAdd&&(
        <Modal title="Register New Teacher" onClose={()=>setShowAdd(false)}>
          <Field label="Full Name" placeholder="Teacher full name" value={teacherForm.name} onChange={upTeacher("name")}/>
          <Field label="NIC Number" placeholder="National ID / NIC" value={teacherForm.nic} onChange={upTeacher("nic")}/>
          <Field label="Subject Specialization" placeholder="Primary subject" value={teacherForm.subject} onChange={upTeacher("subject")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Contact Number" placeholder="Contact number" type="tel" value={teacherForm.phone} onChange={upTeacher("phone")}/><Field label="Email Address" placeholder="Email address" type="email" value={teacherForm.email} onChange={upTeacher("email")}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Branch" placeholder="Branch name" value={teacherForm.branch} onChange={upTeacher("branch")}/></div>
          <div style={{display:"flex",gap:12,marginTop:8}}><Btn label="Add Teacher" onClick={addTeacher} disabled={!teacherForm.name.trim()}/><Btn label="Cancel" onClick={()=>setShowAdd(false)} outline/></div>
        </Modal>
      )}
    </div>
  );
};






/* ─── Classes ⑥ take-attendance + edit ────────────────────── */
const ClassesPage = () => {
  const {students,classes,setClasses,attendance,setAttendance} = useStore();
  const [showAdd,setShowAdd] = useState(false);
  const [editClass,setEditClass] = useState(null);
  const [attendClass,setAttendClass] = useState(null);
  const [classAttend,setClassAttend] = useState({});
  const [classForm,setClassForm] = useState({name:"",grade:"",subject:"",teacher:"",day:"Saturday",startTime:"09:00",room:"",capacity:"50",monthlyFee:"",type:"Physical"});
  const upClass=k=>e=>setClassForm(f=>({...f,[k]:e.target.value}));
  const upEdit=k=>e=>setEditClass(ec=>({...ec,[k]:e.target.value}));
  const saveEdit=()=>{setClasses(prev=>prev.map(c=>c.id===editClass.id?{...c,...editClass}:c));setEditClass(null);};
  const to12Hour = value => { const [h,m]=String(value||"09:00").split(":").map(Number); const ap=h>=12?"PM":"AM"; return `${(h%12)||12}:${String(m||0).padStart(2,"0")} ${ap}`; };
  const addClass=()=>{
    if(!classForm.name.trim()) return;
    const dayMap={Monday:"Mon",Tuesday:"Tue",Wednesday:"Wed",Thursday:"Thu",Friday:"Fri",Saturday:"Sat",Sunday:"Sun"};
    const next={...classForm,id:`CL-${Date.now()}`,time:`${dayMap[classForm.day]} ${to12Hour(classForm.startTime)}`,enrolled:0,capacity:Math.max(1,Number(classForm.capacity)||1),fee:Number(classForm.monthlyFee)||0,monthlyFee:Number(classForm.monthlyFee)||0};
    setClasses(prev=>[...prev,next]);setShowAdd(false);setClassForm({name:"",grade:"",subject:"",teacher:"",day:"Saturday",startTime:"09:00",room:"",capacity:"50",monthlyFee:"",type:"Physical"});
  };

  // ② fixed attendance logic for classes
  const initClassAttend=(cls)=>{
    const init={};
    students.forEach(s=>{init[s.id]=false;});
    setClassAttend(init);
    setAttendClass(cls);
  };
  const toggleAtt=id=>setClassAttend(a=>({...a,[id]:!a[id]}));
  const presentCount=Object.values(classAttend).filter(Boolean).length;

  const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const TIME_SLOTS=["9:00 AM","11:00 AM","2:00 PM","4:00 PM"];
  const dayOf = cls => String(cls.time||"").match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/i)?.[1] || "";
  const slotOf = cls => { const m=parseClassTime(cls.time); return m===null?-1:TIME_SLOTS.reduce((best,t,i)=>Math.abs((parseClassTime(t)||0)-m)<Math.abs((parseClassTime(TIME_SLOTS[best])||0)-m)?i:best,0); };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{color:C.text,fontSize:22,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Classes & Timetable</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>{classes.length} configured class{classes.length===1?"":"es"} · Schedules shown from your saved class records</p>
        </div>
        <Btn label="+ New Class" onClick={()=>setShowAdd(true)}/>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22,marginBottom:20}}>
        <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:16}}>Weekly Schedule</div>
        {classes.length===0 ? (
          <div style={{minHeight:120,display:"grid",placeItems:"center",textAlign:"center",color:C.muted,fontSize:13}}>
            <div><CalendarDays size={28} style={{margin:"0 auto 10px",opacity:.65}}/><div style={{color:C.text,fontWeight:600,marginBottom:4}}>No schedule records yet</div><div>Create your first class to populate the weekly timetable.</div></div>
          </div>
        ) : (
          <div style={{overflowX:"auto"}}><div style={{display:"grid",gridTemplateColumns:"80px repeat(7,minmax(90px,1fr))",gap:6,minWidth:760}}>
            {["",...DAYS].map((d,i)=><div key={i} style={{color:C.muted,fontSize:12,fontWeight:600,textAlign:"center",padding:"6px 0"}}>{d}</div>)}
            {TIME_SLOTS.flatMap((t,ti)=>[
              <div key={`time-${ti}`} style={{color:C.muted,fontSize:11,display:"flex",alignItems:"center"}}>{t}</div>,
              ...DAYS.map(day=>{const match=classes.filter(c=>dayOf(c).toLowerCase()===day.toLowerCase()&&slotOf(c)===ti);return <div key={`${day}-${ti}`} style={{background:C.bg,border:`1px solid ${match.length?alphaColor(C.accent, 40):C.border}`,borderRadius:8,padding:6,minHeight:45,fontSize:10}}>{match.map(c=><div key={c.id} title={c.name} style={{background:`${alphaColor(C.accent, 13)}`,color:C.accent,borderRadius:5,padding:"5px 6px",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis"}}>{c.subject||c.name}</div>)}</div>;})
            ])}
          </div></div>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {classes.map(c=>(
          <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <div style={{color:C.text,fontWeight:700,fontSize:15}}>{c.name}</div>
                <div style={{color:C.muted,fontSize:12,marginTop:4}}>{c.teacher}</div>
              </div>
              <Badge label={c.type} color={c.type==="Online"?C.accent2:C.accent}/>
            </div>
            <div style={{display:"flex",gap:14,marginBottom:14}}>
              {[[Clock3,c.time],[Building2,c.room],[UsersRound,`${c.enrolled}/${c.capacity}`]].map(([Icon,v])=>(
                <div key={v} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.muted}}><AppIcon icon={Icon} size={13}/>{v}</div>
              ))}
            </div>
            <Pill value={c.enrolled} total={c.capacity} color={c.enrolled/c.capacity>0.9?C.rose:C.emerald}/>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <Btn label="Take Attendance" color={C.emerald} small onClick={()=>initClassAttend(c)}/>
              <Btn label="Edit" color={C.accent} outline small onClick={()=>setEditClass({...c})}/>
            </div>
          </div>
        ))}
      </div>

      {/* ⑥ Take Attendance Modal — fixed logic */}
      {attendClass&&(
        <Modal title={`Attendance — ${attendClass.name}`} onClose={()=>setAttendClass(null)} wide>
          <div style={{display:"flex",gap:12,marginBottom:20}}>
            {[["Present",presentCount,C.emerald],["Absent",students.length-presentCount,C.rose],["Total",students.length,C.accent]].map(([l,n,c])=>(
              <div key={l} style={{background:C.bg,borderRadius:10,padding:"12px 20px",flex:1,textAlign:"center"}}>
                <div style={{color:c,fontWeight:700,fontSize:22}}>{n}</div>
                <div style={{color:C.muted,fontSize:12,marginTop:4}}>{l}</div>
              </div>
            ))}
            <div style={{flex:2,background:C.bg,borderRadius:10,padding:"12px 20px"}}>
              <div style={{color:C.text,fontWeight:600,fontSize:13,marginBottom:6}}>Attendance Rate</div>
              <Pill value={presentCount} total={students.length} color={presentCount/students.length>0.8?C.emerald:C.amber}/>
            </div>
          </div>
          <div style={{background:C.card,borderRadius:10,overflow:"hidden",marginBottom:16}}>
            {students.map(s=>{
              const isP=classAttend[s.id]!==false;
              return(
                <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",borderBottom:`1px solid ${C.border}`,background:isP?`${alphaColor(C.emerald, 3)}`:`${alphaColor(C.rose, 2)}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <Avatar initials={s.avatar} size={34} color={isP?C.emerald:C.rose}/>
                    <div>
                      <div style={{color:C.text,fontSize:14,fontWeight:600}}>{s.name}</div>
                      <div style={{color:C.muted,fontSize:11}}>{s.id} · {s.grade}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.muted}}>History: {s.attendance}%</span>
                    <button onClick={()=>toggleAtt(s.id)} style={{background:isP?C.emerald:C.rose,border:"none",borderRadius:6,padding:"5px 14px",color:C.ink,fontWeight:700,cursor:"pointer",fontSize:12,display:"inline-flex",alignItems:"center",gap:5,transition:"background 0.2s"}}>
                      {isP?<Check size={12}/>:<X size={12}/>}{isP?"Present":"Absent"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn label="Save Attendance" icon={Save} color={C.accent} onClick={()=>{const now=new Date();const date=isoDate(now);const rows=students.map(s=>({id:`A-${now.getTime()}-${s.id}`,studentId:s.id,name:s.name,grade:s.grade,classId:attendClass.id,className:attendClass.name,teacher:attendClass.teacher||"—",date,time:now.toLocaleTimeString("en-LK",{hour:"2-digit",minute:"2-digit"}),status:classAttend[s.id]!==false?"Present":"Absent",ts:now.getTime()}));setAttendance(prev=>[...rows,...prev.filter(a=>!(a.classId===attendClass.id&&a.date===date))]);setAttendClass(null);}}/>
            <Btn label="Cancel" onClick={()=>setAttendClass(null)} outline/>
          </div>
        </Modal>
      )}

      {/* ⑥ Edit Class Modal */}
      {editClass&&(
        <Modal title="Edit Class" onClose={()=>setEditClass(null)}>
          <Field label="Class Name" value={editClass.name} onChange={upEdit("name")} placeholder="Class name"/>
          <Field label="Teacher" value={editClass.teacher} onChange={upEdit("teacher")} placeholder="Teacher name"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Day & Time" value={editClass.time} onChange={upEdit("time")} placeholder="Sat 9:00 AM"/>
            <Field label="Room / Platform" value={editClass.room} onChange={upEdit("room")} placeholder="Room"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Capacity" value={editClass.capacity} onChange={upEdit("capacity")} placeholder="50" type="number"/>
            <SelectField label="Type" value={editClass.type} onChange={upEdit("type")} options={["Physical","Online","Hybrid"]}/>
          </div>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <Btn label="Save Changes" icon={Save} color={C.accent} onClick={saveEdit}/>
            <Btn label="Cancel" onClick={()=>setEditClass(null)} outline/>
          </div>
        </Modal>
      )}

      {/* Add Class Modal */}
      {showAdd&&(
        <Modal title="Create New Class" onClose={()=>setShowAdd(false)}>
          <Field label="Class Name" placeholder="e.g. A/L Mathematics — Batch 2026" value={classForm.name} onChange={upClass("name")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Grade" placeholder="A/L" value={classForm.grade} onChange={upClass("grade")}/><Field label="Subject" placeholder="Mathematics" value={classForm.subject} onChange={upClass("subject")}/>
          </div>
          <Field label="Teacher" placeholder="Teacher name" value={classForm.teacher} onChange={upClass("teacher")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <SelectField label="Day" value={classForm.day} onChange={upClass("day")} options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}/>
            <Field label="Start Time" type="time" value={classForm.startTime} onChange={upClass("startTime")}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Room / Platform" placeholder="Hall A or Zoom" value={classForm.room} onChange={upClass("room")}/>
            <SelectField label="Type" value={classForm.type} onChange={upClass("type")} options={["Physical","Online","Hybrid"]}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Capacity" placeholder="50" type="number" value={classForm.capacity} onChange={upClass("capacity")}/>
            <Field label="Monthly Fee (Rs.)" placeholder="Enter monthly class fee" type="number" value={classForm.monthlyFee} onChange={upClass("monthlyFee")}/>
          </div>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <Btn label="Create Class" onClick={addClass} disabled={!classForm.name.trim()}/><Btn label="Cancel" onClick={()=>setShowAdd(false)} outline/>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ─── Attendance Registry — scan / search → profile → fees → edit ─── */
const AttendancePage = () => {
  const {students,setStudents,teachers=[],fees,setFees,attendance,setAttendance,classes=[]} = useStore();
  const [query,setQuery]           = useState("");
  const [showSug,setShowSug]       = useState(false);
  const [selectedId,setSelectedId] = useState(null);
  const [notice,setNotice]         = useState(null);   // {kind:"ok"|"dup"|"warn"|"error", text, status?}
  const [scanMode,setScanMode]     = useState("keyboard"); // keyboard | qr | nfc
  const [scanning,setScanning]     = useState(false);
  const [stream,setStream]         = useState(null);
  const [clock,setClock]           = useState(new Date());
  const [editing,setEditing]       = useState(false);
  const [paySubject,setPaySubject] = useState("");
  const [payMonth,setPayMonth]     = useState(REG_MONTHS[new Date().getMonth()]);
  const [payMethod,setPayMethod]   = useState("Cash");
  const [lastPay,setLastPay]       = useState(null);
  const videoRef=useRef(null), inputRef=useRef(null), detRef=useRef(null), timerRef=useRef(null);
  const registerRef=useRef(null), lastScanRef=useRef({code:"",t:0});

  const student = students.find(s=>s.id===selectedId)||null;
  const today   = isoDate(clock);
  const year    = clock.getFullYear();
  const todayLog = attendance.filter(a=>a.date===today).sort((a,b)=>b.ts-a.ts);
  const present = todayLog.filter(a=>a.status!=="Late").length;
  const late    = todayLog.filter(a=>a.status==="Late").length;

  useEffect(()=>{const t=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(videoRef.current&&stream)videoRef.current.srcObject=stream;},[stream]);
  useEffect(()=>()=>{if(stream)stream.getTracks().forEach(t=>t.stop());if(timerRef.current)clearTimeout(timerRef.current);},[stream]);
  useEffect(()=>{
    if(!student)return;
    setPaySubject(subjectsOf(student)[0]);setPayMonth(REG_MONTHS[new Date().getMonth()]);setPayMethod("Cash");
  },[selectedId]);

  // Barcode scanners behave like a keyboard: send stray keystrokes to the scan box.
  useEffect(()=>{
    const h=(e)=>{
      if(e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1||e.key===" ")return;
      const t=e.target,tag=t?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT"||t?.isContentEditable)return;
      if(document.querySelector('[role="dialog"]'))return;
      inputRef.current?.focus();
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  const findStudent=(raw)=>{
    const q=raw.trim().toLowerCase();if(!q)return null;
    const byId=students.find(s=>s.id.toLowerCase()===q);if(byId)return byId;
    if(/^\d{1,6}$/.test(q)){const n=students.filter(s=>parseInt(s.id.split("-").pop(),10)===parseInt(q,10));if(n.length===1)return n[0];}
    const byPhone=students.find(s=>(s.phone||"").replace(/\D/g,"")===q.replace(/\D/g,"")&&q.replace(/\D/g,"").length>=7);if(byPhone)return byPhone;
    const exact=students.find(s=>s.name.toLowerCase()===q);if(exact)return exact;
    const part=students.filter(s=>s.name.toLowerCase().includes(q));
    return part.length===1?part[0]:null;
  };

  const register=(stu)=>{
    const now=new Date();
    const cls=pickClass(stu,now,classes);
    const date=isoDate(now);
    const time=now.toLocaleTimeString("en-LK",{hour:"2-digit",minute:"2-digit"});
    const classId=cls?.id||null;
    setSelectedId(stu.id);setLastPay(null);setQuery("");setShowSug(false);
    if(!cls){
      setNotice({kind:"warn",text:"No class enrolled now"});
      beep(false);
      // Keep the notice visible briefly, then always open the full student profile.
      window.setTimeout(()=>window.dispatchEvent(new CustomEvent("edupeak-open-student",{detail:{id:stu.id}})),900);
      return;
    }
    const existing=attendance.find(a=>a.studentId===stu.id&&a.classId===classId&&a.date===date);
    if(existing){
      setNotice({kind:"dup",status:existing.status,text:`Already registered at ${existing.time} to ${existing.className}`});beep(false);
    } else {
      const status=cls?classStatus(cls,now):"Present";
      setAttendance(p=>[{id:`A${now.getTime()}`,studentId:stu.id,name:stu.name,grade:stu.grade,classId,className:cls?.name||"General",teacher:cls?.teacher||"—",date,time,status,ts:now.getTime()},...p]);
      setNotice({kind:"ok",status,text:`${status} · ${time} · ${cls?.name||"General"}`});beep(true);
    }
    window.setTimeout(()=>window.dispatchEvent(new CustomEvent("edupeak-open-student",{detail:{id:stu.id}})),900);
  };
  registerRef.current=(stu,code)=>{
    const l=lastScanRef.current,n=Date.now();
    if(code&&l.code===code&&n-l.t<3000)return;   // ignore the camera re-reading the same card
    lastScanRef.current={code:code||"",t:n};register(stu);
  };

  const submit=()=>{
    const q=query.trim();if(!q)return;
    const hit=findStudent(q);
    if(hit){register(hit);return;}
    const many=students.filter(s=>s.name.toLowerCase().includes(q.toLowerCase()));
    if(many.length>1){setNotice({kind:"warn",text:`${many.length} students match “${q}”. Pick one from the list.`});setShowSug(true);return;}
    setNotice({kind:"error",text:`No student found for “${q}”`});beep(false);
    setTimeout(()=>setNotice(n=>n&&n.kind==="error"?null:n),4000);
  };

  const reassign=(recId,classId)=>{
    const cls=classes.find(c=>c.id===classId);if(!cls)return;
    setAttendance(p=>p.map(a=>a.id===recId?{...a,classId:cls.id,className:cls.name,teacher:cls.teacher,status:classStatus(cls,new Date(a.ts))}:a));
  };

  // ── Camera QR / barcode ──
  const startQR=async()=>{
    setNotice(null);setScanMode("qr");
    try{
      const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      setStream(s);setScanning(true);
      const loop=async()=>{
        if(!videoRef.current||!s.active)return;
        if("BarcodeDetector" in window){
          if(!detRef.current)detRef.current=new window.BarcodeDetector({formats:["qr_code","code_128","code_39","ean_13"]});
          try{
            const codes=await detRef.current.detect(videoRef.current);
            if(codes.length>0){const val=codes[0].rawValue.trim();const st=findStudent(val);if(st)registerRef.current(st,val);}
          }catch{}
        }
        timerRef.current=setTimeout(loop,500);
      };
      loop();
    }catch(err){
      setNotice({kind:"error",text:"Camera not available: "+err.message+". Type or scan the ID instead."});setScanMode("keyboard");
    }
  };
  const stopQR=()=>{
    if(stream)stream.getTracks().forEach(t=>t.stop());
    setStream(null);setScanning(false);setScanMode("keyboard");
    if(timerRef.current)clearTimeout(timerRef.current);
    setTimeout(()=>inputRef.current?.focus(),50);
  };

  // ── NFC ──
  const startNFC=async()=>{
    setScanMode("nfc");
    if(!("NDEFReader" in window)){
      setNotice({kind:"warn",text:"NFC is not supported in this browser (Chrome on Android only). Use the keyboard scanner instead."});setScanMode("keyboard");return;
    }
    try{
      const reader=new window.NDEFReader();await reader.scan();setScanning(true);
      reader.onreading=({message})=>{for(const rec of message.records){const val=new TextDecoder().decode(rec.data).trim();const st=findStudent(val);if(st)registerRef.current(st,val);}};
    }catch(err){setNotice({kind:"error",text:"NFC error: "+err.message});setScanMode("keyboard");}
  };

  const switchMode=(m)=>{
    if(m==="qr")startQR();
    else if(m==="nfc")startNFC();
    else{if(stream)stopQR();else{setScanMode("keyboard");setScanning(false);}setTimeout(()=>inputRef.current?.focus(),50);}
  };

  // ── Fees ──
  const subjects  = student?subjectsOf(student):[];
  const subj      = subjects.includes(paySubject)?paySubject:subjects[0];
  const amount    = student?feeFor(student,subj,classes):0;
  const monthLabel= `${payMonth} ${year}`;
  const paidThis  = student?isPaid(fees,student,subj,monthLabel):false;
  const regIdx    = (()=>{if(!student?.regDate)return 0;const d=new Date(student.regDate+"T00:00:00");return d.getFullYear()<year?0:d.getFullYear()>year?12:d.getMonth();})();
  const history   = student?fees.filter(f=>(f.studentId?f.studentId===student.id:f.student===student.name)&&f.subject===subj&&f.status==="Paid"):[];
  const myLog     = student?attendance.filter(a=>a.studentId===student.id).sort((a,b)=>b.ts-a.ts):[];
  const todayRec  = student?todayLog.find(a=>a.studentId===student.id):null;
  const myClasses = student?studentClassesOf(student,classes):[];

  const pay=()=>{
    if(!student||paidThis||amount<=0)return;
    const now=new Date();
    const rec={id:nextFeeId(fees),studentId:student.id,student:student.name,teacher:teacherFor(subj,teachers),subject:subj,amount,date:isoDate(now),time:now.toLocaleTimeString("en-LK",{hour:"2-digit",minute:"2-digit"}),status:"Paid",method:payMethod,month:monthLabel,notes:student.concession&&student.concession!=="None"?`${student.concession} card applied`:""};
    setFees(p=>[rec,...p]);setLastPay(rec);beep(true);
    if(payMonth===REG_MONTHS[now.getMonth()])setStudents(p=>p.map(s=>s.id===student.id?{...s,paid:true}:s));
  };

  const sug = showSug&&query.trim().length>=2
    ? students.filter(s=>{const q=query.trim().toLowerCase();return s.name.toLowerCase().includes(q)||s.id.toLowerCase().includes(q)||(s.phone||"").includes(q);}).slice(0,6):[];
  const dateDisplay=clock.toLocaleDateString("en-LK",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const clockDisplay=clock.toLocaleTimeString("en-LK",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const card={background:C.card,border:`1px solid ${C.border}`,borderRadius:12};
  const noticeColor=!notice?C.muted:notice.kind==="ok"?statusColor(notice.status):notice.kind==="dup"||notice.kind==="warn"?C.amber:C.rose;

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{color:C.text,fontSize:22,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Attendance Registry</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>{dateDisplay}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          {[["Present",present,C.emerald],["Late",late,C.amber],["Total today",todayLog.length,C.accent]].map(([l,n,c])=>(
            <div key={l} style={{...card,padding:"7px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:c}}/><span style={{color:C.muted,fontSize:12.5}}>{l}</span><span style={{color:C.text,fontWeight:700,fontSize:14,fontVariantNumeric:"tabular-nums"}}>{n}</span>
            </div>
          ))}
          <div style={{...card,padding:"7px 14px",display:"flex",alignItems:"center",gap:8,color:C.text,fontWeight:600,fontSize:15,fontVariantNumeric:"tabular-nums"}}><Clock size={15} color={C.accent}/>{clockDisplay}</div>
        </div>
      </div>

      {/* Scan card */}
      <div style={{...card,padding:18,position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginBottom:14}}>
          <div style={{color:C.text,fontWeight:600,fontSize:14}}>Find / scan student</div>
          <div style={{display:"inline-flex",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:3,gap:2}}>
            {[["keyboard","Scanner / keyboard",ScanLine],["qr","Camera",QrCode],["nfc","NFC",Nfc]].map(([m,l,Icon])=>(
              <button key={m} onClick={()=>switchMode(m)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12.5,fontWeight:600,background:scanMode===m?`${alphaColor(C.accent, 15)}`:"transparent",color:scanMode===m?C.accent:C.muted}}><Icon size={14}/>{l}</button>
            ))}
          </div>
        </div>

        {scanMode==="qr"&&(
          <div style={{background:"#000",borderRadius:10,overflow:"hidden",position:"relative",aspectRatio:"16/7",border:`1px solid ${scanning?C.emerald:C.border}`,marginBottom:14}}>
            <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
              <div style={{width:150,height:150,position:"relative"}}>
                {[[0,0,"borderTop","borderLeft"],[0,1,"borderTop","borderRight"],[1,0,"borderBottom","borderLeft"],[1,1,"borderBottom","borderRight"]].map(([r,c,bt,bl],i)=>(
                  <div key={i} style={{position:"absolute",width:22,height:22,[bt]:`3px solid ${C.accent}`,[bl]:`3px solid ${C.accent}`,top:r===0?0:"auto",bottom:r===1?0:"auto",left:c===0?0:"auto",right:c===1?0:"auto"}}/>
                ))}
                <div className="att-scan-line"/>
              </div>
            </div>
            <button onClick={stopQR} style={{position:"absolute",top:10,right:10,background:"#000000b3",border:"1px solid #ffffff22",borderRadius:8,padding:"5px 12px",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:600,display:"inline-flex",alignItems:"center",gap:5}}><X size={13}/> Stop</button>
            {scanning&&!("BarcodeDetector" in window)&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"#000000aa",padding:"8px 14px",fontSize:11,color:"#fff",textAlign:"center"}}>Barcode detection is not available in this browser. Type the ID below instead.</div>}
          </div>
        )}
        {scanMode==="nfc"&&(
          <div style={{background:C.bg,border:`1px solid ${alphaColor(C.emerald, 33)}`,borderRadius:10,padding:22,textAlign:"center",marginBottom:14}}>
            <div style={{color:C.emerald,display:"flex",justifyContent:"center",marginBottom:8,animation:"nfcPulse 1.5s ease-in-out infinite"}}><Nfc size={36} strokeWidth={1.5}/></div>
            <div style={{color:C.text,fontWeight:600,fontSize:14}}>NFC reader active</div>
            <div style={{color:C.muted,fontSize:12.5,marginTop:4}}>Tap a student card or phone on the reader.</div>
            <div style={{marginTop:12}}><Btn label="Stop NFC" outline small onClick={()=>switchMode("keyboard")}/></div>
          </div>
        )}

        <div style={{position:"relative"}}>
          <div style={{background:C.bg,border:`1px solid ${notice?.kind==="ok"?noticeColor:C.border}`,borderRadius:10,padding:"8px 8px 8px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:notice?.kind==="ok"?`0 0 0 3px ${alphaColor(noticeColor, 15)}`:"none",transition:"all 0.25s"}}>
            <Search size={18} color={C.muted}/>
            <input ref={inputRef} autoFocus value={query} autoComplete="off" spellCheck={false}
              onChange={e=>{setQuery(e.target.value);setShowSug(true);}}
              onFocus={()=>setShowSug(true)} onBlur={()=>setTimeout(()=>setShowSug(false),150)}
              onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();submit();}if(e.key==="Escape"){setQuery("");setShowSug(false);}}}
              placeholder="Scan barcode, or type student ID, name or phone — then press Enter"
              style={{flex:1,minWidth:0,background:"none",border:"none",color:C.text,fontSize:15,outline:"none",fontFamily:'"Anthropic Sans", sans-serif'}}/>
            {query&&<button onClick={()=>setQuery("")} aria-label="Clear" style={{background:"none",border:"none",color:C.muted,cursor:"pointer",display:"flex"}}><X size={16}/></button>}
            <Btn label="Register" icon={ArrowRight} onClick={submit}/>
          </div>
          {sug.length>0&&(
            <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"var(--ep-shadow-lg)",zIndex:20,overflow:"hidden"}}>
              {sug.map(s=>(
                <div key={s.id} onMouseDown={e=>{e.preventDefault();register(s);}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.card} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Avatar initials={s.avatar} size={30} color={C.accent2}/>
                  <div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontSize:13.5,fontWeight:600}}>{s.name}</div><div style={{color:C.muted,fontSize:11.5}}>{s.id} · {s.grade} · {s.phone||"—"}</div></div>
                  <Badge label={s.branch} color={C.accent}/>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{color:C.muted,fontSize:12,marginTop:8}}>USB barcode scanners work automatically: just scan, no need to click the box first.</div>

        {notice&&(
          <div style={{marginTop:12,background:`${alphaColor(noticeColor, 8)}`,border:`1px solid ${alphaColor(noticeColor, 27)}`,borderRadius:10,padding:"10px 14px",color:noticeColor,fontSize:13.5,fontWeight:600,display:"flex",alignItems:"center",gap:9}}>
            {notice.kind==="ok"?<StatusIcon s={notice.status} size={16}/>:<TriangleAlert size={16}/>}
            <span>{notice.kind==="ok"&&student?`${student.name} · `:""}{notice.text}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="grid-reg" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 300px",gap:16,alignItems:"start",marginTop:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:16,minWidth:0}}>
          {!student&&(
            <div style={{...card,padding:"36px 24px",textAlign:"center"}}>
              <div style={{color:C.muted,opacity:0.6,display:"flex",justifyContent:"center",marginBottom:12}}><ScanLine size={38} strokeWidth={1.4}/></div>
              <div style={{color:C.text,fontWeight:600,fontSize:15,marginBottom:4}}>Ready to register attendance</div>
              <div style={{color:C.muted,fontSize:13,lineHeight:1.6,maxWidth:460,margin:"0 auto"}}>Scan a student's ID card or type their ID, name or phone number. Their profile, recent attendance and fee status will appear here.</div>
              <div style={{marginTop:18,display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                {students.slice(0,8).map(s=>(
                  <button key={s.id} onClick={()=>register(s)} title={`Scan ${s.id}`} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.text,fontSize:12.5,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
                    <Avatar initials={s.avatar} size={20} color={C.accent2}/>{s.name.split(" ")[0]}
                  </button>
                ))}
              </div>
              <div style={{color:C.muted,fontSize:11,marginTop:8,letterSpacing:"0.04em",textTransform:"uppercase"}}>Quick select (simulates a scan)</div>
            </div>
          )}

          {student&&(<>
            <div className="grid-reg-top" style={{display:"grid",gridTemplateColumns:"340px minmax(0,1fr)",gap:16,alignItems:"stretch"}}>
              {/* Profile */}
              <div style={{...card,padding:20}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                  <Avatar initials={student.avatar} size={56} color={todayRec?statusColor(todayRec.status):C.accent2}/>
                  <div style={{minWidth:0}}>
                    <div style={{color:C.text,fontWeight:700,fontSize:17,letterSpacing:"-0.01em"}}>{student.name}</div>
                    <div style={{color:C.muted,fontSize:12,fontFamily:"monospace",marginTop:3}}>{student.id}</div>
                    <div style={{display:"flex",gap:6,marginTop:7,flexWrap:"wrap"}}>
                      <Badge label={student.grade} color={C.accent2}/>
                      {student.concession&&student.concession!=="None"&&<Badge label={`${student.concession} card`} color={C.gold}/>}
                    </div>
                  </div>
                </div>
                {[["Registered",student.regDate||"—"],["Parent",student.parent||"—"],["Parent mobile",student.phone||"—"],["School",student.school||"—"],["Branch",student.branch||"—"]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"7px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><span style={{color:C.muted}}>{k}</span><span style={{color:C.text,fontWeight:500,textAlign:"right"}}>{v}</span></div>
                ))}
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:6}}><span>Overall attendance</span></div>
                  <Pill value={student.attendance} total={100} color={student.attendance>85?C.emerald:student.attendance>70?C.amber:C.rose}/>
                </div>
                {todayRec&&myClasses.length>1&&(
                  <div style={{marginTop:14}}>
                    <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:5}}>Registered to class (change if wrong)</label>
                    <select value={todayRec.classId||""} onChange={e=>reassign(todayRec.id,e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,outline:"none"}}>
                      {myClasses.map(c=><option key={c.id} value={c.id}>{c.name} · {c.time}</option>)}
                    </select>
                  </div>
                )}
                <div style={{display:"flex",gap:8,marginTop:16}}>
                  <Btn label="Edit profile" icon={Pencil} onClick={()=>setEditing(true)}/>
                  <Btn label="Close" outline onClick={()=>{setSelectedId(null);setNotice(null);setTimeout(()=>inputRef.current?.focus(),50);}}/>
                </div>
              </div>

              {/* Recent attendance */}
              <div style={{...card,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{color:C.text,fontWeight:600,fontSize:14}}>Recent attendance</div><Badge label={`${myLog.length} record${myLog.length===1?"":"s"}`} color={C.accent}/>
                </div>
                {myLog.length===0?<div style={{padding:28,textAlign:"center",color:C.muted,fontSize:13}}>No attendance recorded yet.</div>:(
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr style={{background:C.subtle}}>{["Class","Teacher","Date","Time","Status"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                      <tbody>{myLog.slice(0,6).map(a=>(
                        <tr key={a.id} style={{borderBottom:`1px solid ${C.border}`}}>
                          <td style={{padding:"10px 14px",color:C.text,fontSize:13,fontWeight:500}}>{a.className}</td>
                          <td style={{padding:"10px 14px",color:C.muted,fontSize:13}}>{a.teacher}</td>
                          <td style={{padding:"10px 14px",color:C.muted,fontSize:13,whiteSpace:"nowrap"}}>{a.date}</td>
                          <td style={{padding:"10px 14px",color:C.muted,fontSize:13,whiteSpace:"nowrap"}}>{a.time}</td>
                          <td style={{padding:"10px 14px"}}><Badge label={a.status} color={statusColor(a.status)}/></td>
                        </tr>))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Fees */}
            <div style={{...card,padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <div style={{color:C.text,fontWeight:600,fontSize:14}}>Class fees</div>
                <div style={{color:C.muted,fontSize:12.5}}>{history.length===0?"No payments recorded for this subject":`Last paid: ${history[0].month} · Rs. ${fmt(history[0].amount)}`}</div>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
                <div style={{flex:"2 1 220px"}}>
                  <label style={{display:"block",fontSize:12.5,color:C.muted,marginBottom:6,fontWeight:500}}>Subject / class</label>
                  <select value={subj} onChange={e=>setPaySubject(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:14,outline:"none"}}>
                    {subjects.map(s=><option key={s} value={s}>{s} · {teacherFor(s,teachers)}</option>)}
                  </select>
                </div>
                <div style={{flex:"1 1 130px"}}>
                  <label style={{display:"block",fontSize:12.5,color:C.muted,marginBottom:6,fontWeight:500}}>Paying (Rs.)</label>
                  <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:20,fontWeight:700,color:amount>0?C.text:C.emerald,fontVariantNumeric:"tabular-nums"}}>{amount>0?fmt(amount):"Free"}</div>
                </div>
                <div style={{flex:"1 1 140px"}}>
                  <label style={{display:"block",fontSize:12.5,color:C.muted,marginBottom:6,fontWeight:500}}>Month</label>
                  <select value={payMonth} onChange={e=>setPayMonth(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:14,outline:"none"}}>
                    {REG_MONTHS.map(m=><option key={m} value={m}>{m} {year}</option>)}
                  </select>
                </div>
                <div style={{flex:"0 1 110px"}}>
                  <label style={{display:"block",fontSize:12.5,color:C.muted,marginBottom:6,fontWeight:500}}>Method</label>
                  <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:14,outline:"none"}}>
                    {["Cash","Card","Bank","Online"].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <Btn label={paidThis?"Already paid":"Pay now"} icon={paidThis?CheckCircle2:Banknote} color={C.emerald} onClick={pay} disabled={paidThis||amount<=0}/>
              </div>

              {lastPay&&(
                <div style={{marginTop:14,background:`${alphaColor(C.emerald, 8)}`,border:`1px solid ${alphaColor(C.emerald, 27)}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <CheckCircle2 size={16} color={C.emerald}/>
                  <span style={{color:C.emerald,fontWeight:600,fontSize:13.5,flex:1}}>Payment recorded · {lastPay.subject} · {lastPay.month} · Rs. {fmt(lastPay.amount)} · Receipt {lastPay.id}</span>
                  <Btn label="Print receipt" icon={Printer} outline small onClick={()=>printThermalReceipt(lastPay)}/>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(112px,1fr))",gap:8,marginTop:16}}>
                {REG_MONTHS.map((m,i)=>{
                  const paid=isPaid(fees,student,subj,`${m} ${year}`),before=i<regIdx,cur=clock.getMonth();
                  const col=paid?C.emerald:before?C.muted:i<cur?C.rose:i===cur?C.amber:C.muted;
                  const sel=payMonth===m;
                  return(
                    <button key={m} disabled={before} onClick={()=>setPayMonth(m)} title={paid?"Paid":before?"Before registration":i<cur?"Unpaid":i===cur?"Due this month":"Upcoming"}
                      style={{padding:"9px 6px",borderRadius:8,cursor:before?"default":"pointer",background:before?"transparent":alphaColor(col, paid||i<=cur?9:5),border:`1px solid ${sel?C.accent:before?C.border:alphaColor(col, 33)}`,boxShadow:sel?`0 0 0 2px ${alphaColor(C.accent, 27)}`:"none",color:before?C.muted:col,opacity:before?0.45:1,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                      {paid&&<Check size={12}/>}{m.slice(0,3)} {year}
                    </button>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:12,fontSize:11.5,color:C.muted}}>
                {[["Paid",C.emerald],["Due this month",C.amber],["Unpaid",C.rose]].map(([l,c])=><span key={l} style={{display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:2,background:c}}/>{l}</span>)}
              </div>
            </div>
          </>)}
        </div>

        {/* Today's log */}
        <div style={{...card,overflow:"hidden",display:"flex",flexDirection:"column",maxHeight:720}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div style={{color:C.text,fontWeight:600,fontSize:14}}>Today's check-ins</div><Badge label={`${todayLog.length}`} color={C.accent}/>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {todayLog.length===0?<div style={{padding:28,textAlign:"center",color:C.muted,fontSize:13,lineHeight:1.6}}>Nobody has checked in yet today.</div>:todayLog.map((a,i)=>(
              <div key={a.id} onClick={()=>{const st=students.find(s=>s.id===a.studentId);if(st){setSelectedId(st.id);setLastPay(null);setNotice(null);}}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:a.studentId===selectedId?C.subtle:"transparent"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.subtle} onMouseLeave={e=>e.currentTarget.style.background=a.studentId===selectedId?C.subtle:"transparent"}>
                <div style={{width:22,color:C.muted,fontSize:11,fontWeight:600,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{todayLog.length-i}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:C.text,fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.className}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{color:statusColor(a.status),fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}><StatusIcon s={a.status} size={11}/>{a.status}</div>
                  <div style={{color:C.muted,fontSize:10.5,marginTop:2}}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
          {todayLog.length>0&&(
            <div style={{padding:12,borderTop:`1px solid ${C.border}`,flexShrink:0,display:"flex",gap:8}}>
              <Btn label="Save & print" icon={Printer} small onClick={()=>printAnalyticsReport({title:"Attendance — "+dateDisplay,cols:["#","Student","ID","Class","Status","Time"],rows:todayLog.slice().reverse().map((a,i)=>[i+1,a.name,a.studentId,a.className,a.status,a.time])})}/>
              <Btn label="Clear today" outline small onClick={()=>{if(window.confirm("Remove all of today's attendance records?"))setAttendance(p=>p.filter(a=>a.date!==today));}}/>
            </div>
          )}
        </div>
      </div>

      {editing&&student&&(
        <StudentEditor student={student} onClose={()=>setEditing(false)}
          onSave={u=>{setStudents(p=>p.map(s=>s.id===u.id?u:s));setEditing(false);}}
          onDelete={()=>{setStudents(p=>p.filter(s=>s.id!==student.id));setEditing(false);setSelectedId(null);setNotice(null);}}/>
      )}
    </div>
  );
};


/* ─── Fees ④ print + ⑤ record payment ─────────────────────── */
const FeesPage = () => {
  const {fees,setFees,students,setStudents,teachers=[],classes=[]} = useStore();
  const [showRec,setShowRec] = useState(null);
  const [showRecord,setShowRecord] = useState(false);
  const [recForm,setRecForm] = useState({student:"",teacher:"",subject:"",amount:"",method:"Cash",month:new Date().toLocaleDateString("en-LK",{month:"long",year:"numeric"}),notes:"",date:new Date().toISOString().slice(0,10),time:""});
  const upRec=k=>e=>setRecForm(f=>({...f,[k]:e.target.value}));
  const openPaymentForm=()=>{setRecForm(f=>({...f,student:f.student||students[0]?.name||"",teacher:f.teacher||teachers[0]?.name||"",subject:f.subject||(students[0]?.subjects?.[0]||ALL_SUBJECTS[0]),month:f.month||new Date().toLocaleDateString("en-LK",{month:"long",year:"numeric"})}));setShowRecord(true);};

  const currentMonthLabel = new Date().toLocaleDateString("en-LK",{month:"long",year:"numeric"});
  const collected = fees.filter(f=>f.status==="Paid"&&f.month===currentMonthLabel).reduce((sum,f)=>sum+(Number(f.amount)||0),0);
  const outstanding = students.reduce((sum,st)=>{
    const due=studentMonthlyFee(st,classes);
    const paidForMonth=fees.filter(f=>(f.studentId?String(f.studentId)===String(st.id):f.student===st.name)&&f.month===currentMonthLabel&&String(f.status||"").toLowerCase()==="paid").reduce((n,f)=>n+(Number(f.amount)||0),0);
    return sum+Math.max(0,due-paidForMonth);
  },0);
  const total = collected + outstanding;
  const collectionRate = total ? Math.min(100,Math.round(collected/total*100)) : 0;

  const savePayment=(shouldPrint=false)=>{
    const now=new Date();
    const timeStr=now.toLocaleTimeString("en-LK",{hour:"2-digit",minute:"2-digit"});
    const linkedStudent=students.find(s=>s.name===recForm.student);
    const newFee={
      id:nextFeeId(fees),studentId:linkedStudent?.id,
      student:recForm.student,teacher:recForm.teacher,subject:recForm.subject,
      amount:parseFloat(recForm.amount)||0,date:recForm.date,time:timeStr,
      status:"Paid",method:recForm.method,month:recForm.month,notes:recForm.notes,
    };
    setFees(prev=>[newFee,...prev]);
    if(linkedStudent&&(Number(recForm.amount)||0)>=(Number(linkedStudent.fee)||0))setStudents(prev=>prev.map(s=>s.id===linkedStudent.id?{...s,paid:true}:s));
    setShowRecord(false);
    if(shouldPrint)setShowRec(newFee);
    setRecForm({student:"",teacher:"",subject:"",amount:"",method:"Cash",month:new Date().toLocaleDateString("en-LK",{month:"long",year:"numeric"}),notes:"",date:new Date().toISOString().slice(0,10),time:""});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{color:C.text,fontSize:22,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Fee Management</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>{new Date().toLocaleDateString("en-LK",{month:"long",year:"numeric"})} · Collection status</p>
        </div>
        {/* ⑤ Record Payment button */}
        <Btn label="Record Payment" icon={Plus} onClick={openPaymentForm} disabled={students.length===0}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:24}}>
        <StatCard icon={<WalletCards size={26}/>}         label="Total Billed"    value={`Rs. ${fmt(total)}`}           color={C.subtle}/>
        <StatCard icon={<CheckCircle2 size={26}/>}        label="Collected"       value={`Rs. ${fmt(collected)}`}        color={C.col04} />
        <StatCard icon={<TriangleAlert size={26}/>}       label="Outstanding"     value={`Rs. ${fmt(outstanding)}`}  color={C.col05}/>
        <StatCard icon={<ChartNoAxesCombined size={26}/>} label="Collection Rate" value={`${collectionRate}%`} color={C.col01}/>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:C.text,fontWeight:700,fontSize:15}}>Fee Records</span>
          {/* ④ "Print" instead of "Export PDF" */}
          <Btn label="Print Report" icon={Printer} color={C.accent2} outline small
            onClick={()=>printAnalyticsReport({title:"Fee Records",kpis:[],cols:["Student","Subject","Amount","Date","Method","Status","Month"],rows:fees.map(f=>[f.student,f.subject||"—",`Rs. ${fmt(f.amount)}`,f.date||"—",f.method||"—",f.status||"—",f.month||"—"])})}/>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.subtle}}>
              {["Student","Subject","Amount","Date","Method","Status","Receipt"].map(h=>(
                <th key={h} style={{padding:"12px 16px",textAlign:"left",color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fees.length===0&&<tr><td colSpan={7} style={{padding:32,textAlign:"center",color:C.muted,fontSize:13}}>No payment records yet. Import historical payments or record the first payment.</td></tr>}
            {fees.map(f=>(
              <tr key={f.id} style={{borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar initials={f.student.split(" ").map(n=>n[0]).join("")} size={30} color={f.status==="Paid"?C.emerald:f.status==="Overdue"?C.rose:C.amber}/>
                    <div>
                      <div style={{color:C.text,fontSize:13,fontWeight:600}}>{f.student}</div>
                      <div style={{color:C.muted,fontSize:11}}>{f.teacher}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding:"14px 16px",color:C.muted,fontSize:13}}>{f.subject||"—"}</td>
                <td style={{padding:"14px 16px",color:C.text,fontWeight:600}}>Rs. {fmt(f.amount)}</td>
                <td style={{padding:"14px 16px",color:C.muted,fontSize:13}}>{f.date}</td>
                <td style={{padding:"14px 16px",color:C.muted,fontSize:13}}>{f.method}</td>
                <td style={{padding:"14px 16px"}}><Badge label={f.status} color={f.status==="Paid"?C.emerald:f.status==="Overdue"?C.rose:C.amber}/></td>
                <td style={{padding:"14px 16px"}}>
                  {f.status==="Paid"&&(
                    <button onClick={()=>setShowRec(f)} style={{background:`${alphaColor(C.accent, 13)}`,border:`1px solid ${alphaColor(C.accent, 27)}`,borderRadius:8,padding:"4px 10px",color:C.accent,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>
                      <ReceiptText size={12}/> View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ⑤ Record Payment Modal */}
      {showRecord&&(
        <Modal title="Record Payment" onClose={()=>setShowRecord(false)}>
          {students.length===0?<div style={{padding:18,color:C.muted,fontSize:13}}>Add or import student records before recording payments.</div>:<>
          <SelectField label="Student" value={recForm.student} onChange={upRec("student")} options={students.map(s=>s.name)}/>
          <SelectField label="Teacher" value={recForm.teacher} onChange={upRec("teacher")} options={teachers.map(t=>t.name)}/>
          <SelectField label="Subject" value={recForm.subject||ALL_SUBJECTS[0]} onChange={upRec("subject")} options={ALL_SUBJECTS}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Amount (Rs.)" placeholder="Enter amount" type="number" value={recForm.amount} onChange={upRec("amount")}/>
            <SelectField label="Payment Method" value={recForm.method} onChange={upRec("method")} options={["Cash","Card","Bank Transfer","Online","Cheque"]}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Payment Date" type="date" value={recForm.date} onChange={upRec("date")}/>
            <SelectField label="Month" value={recForm.month} onChange={upRec("month")} options={Array.from(new Set([recForm.month,...fees.map(f=>f.month).filter(Boolean)]))}/>
          </div>
          <Field label="Notes" placeholder="e.g. Scholarship discount applied" value={recForm.notes} onChange={upRec("notes")} optional/>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
            <div style={{color:C.text,fontSize:14,fontWeight:600}}>Amount: Rs. {fmt(parseFloat(recForm.amount)||0)}</div>
            <div style={{color:C.muted,fontSize:12,marginTop:4}}>{amountWords(parseFloat(recForm.amount)||0)} Rupees Only</div>
          </div>
          <div style={{display:"flex",gap:12}}>
            <Btn label="Save Payment" icon={Save} color={C.accent} onClick={savePayment} disabled={!recForm.amount}/>
            <Btn label="Save & Print Receipt" icon={Printer} outline onClick={()=>savePayment(true)}/>
            <Btn label="Cancel" onClick={()=>setShowRecord(false)} outline/>
          </div></>}
        </Modal>
      )}

      {/* Receipt Modal with thermal print */}
      {showRec&&(
        <Modal title="Payment Receipt" onClose={()=>setShowRec(null)}>
          <div style={{background:"#fff",color:"#000",borderRadius:10,padding:"24px 28px",fontFamily:"'Courier New',monospace",fontSize:13,maxWidth:320,margin:"0 auto",border:"1px solid #ddd"}}>
            <div style={{textAlign:"center",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:18,letterSpacing:2}}>EDUPEAK</div>
              <div style={{fontSize:10}}>Institute Management System</div>
              
            </div>
            <div style={{borderTop:"1px dashed #000",margin:"8px 0"}}/>
            <div style={{textAlign:"center",fontWeight:700,fontSize:15,marginBottom:8}}>PAYMENT RECEIPT</div>
            <div style={{borderTop:"1px dashed #000",margin:"8px 0"}}/>
            {[["Receipt No.",showRec.id],["Date",showRec.date],["Time",showRec.time||"—"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:12}}><span style={{color:C.muted}}>{k}</span><span style={{fontWeight:700}}>{v}</span></div>
            ))}
            <div style={{borderTop:"1px dashed #000",margin:"8px 0"}}/>
            {[["Student",showRec.student],["Teacher",showRec.teacher||"—"],["Subject",showRec.subject||"—"],["Month",showRec.month||"—"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:12}}><span style={{color:C.muted}}>{k}</span><span style={{fontWeight:700}}>{v}</span></div>
            ))}
            <div style={{borderTop:"1px dashed #000",margin:"8px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:12}}><span style={{color:C.muted}}>Payment Method</span><span style={{fontWeight:700}}>{showRec.method}</span></div>
            {showRec.notes&&<div style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:12}}><span style={{color:C.muted}}>Notes</span><span style={{fontWeight:700,textAlign:"right",maxWidth:150}}>{showRec.notes}</span></div>}
            <div style={{borderTop:"1px dashed #000",margin:"8px 0"}}/>
            <div style={{textAlign:"center",fontWeight:700,fontSize:20,padding:"6px 0"}}>Rs. {fmt(showRec.amount)}</div>
            <div style={{textAlign:"center",fontSize:10,marginTop:2}}>In Words: {amountWords(showRec.amount)} Rupees Only</div>
            <div style={{borderTop:"1px dashed #000",margin:"8px 0"}}/>
            
            
            <div style={{borderTop:"1px dashed #000",margin:"8px 0"}}/>
            <div style={{textAlign:"center",fontSize:10}}>Thank you.</div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"center"}}>
            <Btn label="Print 80mm Thermal" icon={Printer} color={C.accent} onClick={()=>printThermalReceipt(showRec)}/>
            <Btn label="Close" onClick={()=>setShowRec(null)} outline/>
          </div>
        </Modal>
      )}
    </div>
  );
};


/* ─── Exams ③ clickable cards with edit ────────────────────── */
const ExamsPage = () => {
  const {exams,setExams,students} = useStore();
  const [showSchedule,setShowSchedule] = useState(false);
  const [viewExam,setViewExam] = useState(null);
  const [editExam,setEditExam] = useState(null);
  const upSched=k=>e=>setShowSchedule(f=>typeof f==="object"?{...f,[k]:e.target.value}:f);
  const [schedForm,setSchedForm]=useState({name:"",class:"",teacher:"",date:"",time:"",type:"Paper",duration:"",marks:"100",venue:"",notes:""});
  const upSF=k=>e=>setSchedForm(f=>({...f,[k]:e.target.value}));
  const upEE=k=>e=>setEditExam(ex=>({...ex,[k]:e.target.value}));
  const saveExamEdit=()=>{setExams(prev=>prev.map(e=>e.id===editExam.id?{...e,...editExam}:e));setViewExam({...editExam});setEditExam(null);};
  const addExam=()=>{
    setExams(prev=>[...prev,{id:`E${String(prev.length+1).padStart(3,"0")}`,name:schedForm.name,class:schedForm.class,teacher:schedForm.teacher,date:schedForm.date,time:schedForm.time,type:schedForm.type,duration:schedForm.duration,marks:schedForm.marks,venue:schedForm.venue,status:"Scheduled",notes:schedForm.notes}]);
    setShowSchedule(false);
    setSchedForm({name:"",class:"",teacher:"",date:"",time:"",type:"Paper",duration:"",marks:"100",venue:"",notes:""});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{color:C.text,fontSize:22,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Examinations & Results</h2>
          <p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>{exams.length} exams scheduled · Click an exam to view details</p>
        </div>
        <Btn label="Schedule Exam" icon={CalendarPlus} onClick={()=>setShowSchedule(true)}/>
      </div>

      {/* ③ Clickable exam cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:24}}>
        {exams.map(e=>(
          <div key={e.id} onClick={()=>setViewExam(e)} className="stat-card"
            style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,cursor:"pointer",transition:"all 0.2s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{color:C.accent,display:"flex"}}><FileText size={20}/></div>
              <Badge label={e.status} color={e.status==="Upcoming"?C.amber:C.emerald}/>
            </div>
            <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:6}}>{e.name}</div>
            <div style={{color:C.muted,fontSize:12,display:"flex",alignItems:"center",gap:5,marginBottom:4}}><CalendarDays size={12}/>{e.date} · {e.time}</div>
            <div style={{color:C.muted,fontSize:12,marginBottom:10}}>{e.class}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Badge label={e.type} color={C.accent}/>
              <Badge label={e.duration} color={C.accent2}/>
            </div>
            <div style={{marginTop:12,fontSize:12,color:C.accent,display:"flex",alignItems:"center",gap:4}}>View details <ArrowRight size={12}/></div>
          </div>
        ))}
      </div>

      {/* Results table */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.border}`}}>
          <span style={{color:C.text,fontWeight:700,fontSize:15}}>Exam Results</span>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.subtle}}>
              {["Rank","Student","Mathematics","Science","English","Average","Grade"].map(h=>(
                <th key={h} style={{padding:"12px 16px",textAlign:"left",color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXAM_RESULTS.length===0&&<tr><td colSpan={7} style={{padding:30,textAlign:"center",color:C.muted,fontSize:13}}>No exam results have been recorded yet.</td></tr>}
            {EXAM_RESULTS.sort((a,b)=>a.rank-b.rank).map(r=>{
              const avg=Math.round((r.math+r.science+r.english)/3);
              return(
                <tr key={r.student} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"14px 16px"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:r.rank===1?`${alphaColor(C.gold, 20)}`:r.rank===2?`${alphaColor(C.muted, 13)}`:`${alphaColor(C.accent, 7)}`,color:r.rank===1?C.gold:r.rank===2?"var(--ep-muted-soft)":C.muted,border:`1.5px solid ${r.rank===1?C.gold:C.border}`}}>#{r.rank}</div>
                  </td>
                  <td style={{padding:"14px 16px",color:C.text,fontSize:14,fontWeight:600}}>{r.student}</td>
                  {[r.math,r.science,r.english].map((s,i)=>(
                    <td key={i} style={{padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{color:s>=85?C.emerald:s>=70?C.amber:C.rose,fontWeight:700}}>{s}</span>
                        <div style={{width:40,height:4,background:C.border,borderRadius:99}}><div style={{width:`${s}%`,height:"100%",borderRadius:99,background:s>=85?C.emerald:s>=70?C.amber:C.rose}}/></div>
                      </div>
                    </td>
                  ))}
                  <td style={{padding:"14px 16px",color:C.text,fontWeight:700}}>{avg}%</td>
                  <td style={{padding:"14px 16px"}}><Badge label={r.grade} color={r.grade.includes("+")?C.gold:r.grade==="A"?C.emerald:C.amber}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ③ View Exam Detail Modal */}
      {viewExam&&!editExam&&(
        <Modal title="Exam Details" onClose={()=>setViewExam(null)}>
          <div style={{background:C.bg,borderRadius:12,padding:20,marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{color:C.text,fontSize:18,fontWeight:700}}>{viewExam.name}</div>
                <div style={{color:C.muted,fontSize:13,marginTop:4}}>{viewExam.class}</div>
              </div>
              <Badge label={viewExam.status} color={viewExam.status==="Upcoming"?C.amber:C.emerald}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[["Date",viewExam.date],["Time",viewExam.time],["Type",viewExam.type],["Duration",viewExam.duration],["Total Marks",viewExam.marks],["Venue",viewExam.venue],["Teacher",viewExam.teacher],["Status",viewExam.status]].map(([k,v])=>(
                <div key={k} style={{background:C.card,borderRadius:8,padding:12}}>
                  <div style={{color:C.muted,fontSize:11,marginBottom:3}}>{k}</div>
                  <div style={{color:C.text,fontWeight:600,fontSize:13}}>{v||"—"}</div>
                </div>
              ))}
            </div>
            {viewExam.notes&&<div style={{marginTop:12,background:C.card,borderRadius:8,padding:12}}><div style={{color:C.muted,fontSize:11,marginBottom:3}}>Notes / Instructions</div><div style={{color:C.text,fontSize:13}}>{viewExam.notes}</div></div>}
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn label="Edit Exam" icon={Pencil} color={C.accent2} onClick={()=>setEditExam({...viewExam})}/>
            <Btn label="Close" onClick={()=>setViewExam(null)} outline/>
          </div>
        </Modal>
      )}

      {/* ③ Edit Exam Modal — date, time, type */}
      {editExam&&(
        <Modal title="Edit Exam" onClose={()=>setEditExam(null)}>
          <Field label="Exam Title" value={editExam.name} onChange={upEE("name")} placeholder="Exam title"/>
          <Field label="Class / Batch" value={editExam.class} onChange={upEE("class")} placeholder="Class"/>
          <Field label="Teacher / Invigilator" value={editExam.teacher} onChange={upEE("teacher")} placeholder="Teacher"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Date" type="date" value={editExam.date} onChange={upEE("date")}/>
            <Field label="Time" type="time" value={editExam.time?.replace(" AM","").replace(" PM","")||""} onChange={upEE("time")}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {/* ③ type: mcq/seq/essay changeable */}
            <SelectField label="Exam Type" value={editExam.type} onChange={upEE("type")} options={["MCQ","SEQ","Essay","Paper","Online","Practical","Mixed"]}/>
            <Field label="Duration" value={editExam.duration} onChange={upEE("duration")} placeholder="3 hours"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Total Marks" value={editExam.marks} onChange={upEE("marks")} placeholder="100" type="number"/>
            <Field label="Venue" value={editExam.venue} onChange={upEE("venue")} placeholder="Hall A"/>
          </div>
          <SelectField label="Status" value={editExam.status} onChange={upEE("status")} options={["Scheduled","Upcoming","Completed","Cancelled"]}/>
          <Field label="Notes / Instructions" value={editExam.notes} onChange={upEE("notes")} placeholder="Instructions for students" optional/>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <Btn label="Save Changes" icon={Save} color={C.accent} onClick={saveExamEdit}/>
            <Btn label="Cancel" onClick={()=>setEditExam(null)} outline/>
          </div>
        </Modal>
      )}

      {/* Schedule Exam Modal */}
      {showSchedule===true&&(
        <Modal title="Schedule New Exam" onClose={()=>setShowSchedule(false)}>
          <Field label="Exam Title" placeholder="e.g. A/L Mathematics Mid-Term 2026" value={schedForm.name} onChange={upSF("name")}/>
          <Field label="Class / Batch" placeholder="A/L Mathematics" value={schedForm.class} onChange={upSF("class")}/>
          <Field label="Teacher / Invigilator" placeholder="Select teacher" value={schedForm.teacher} onChange={upSF("teacher")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Date" type="date" value={schedForm.date} onChange={upSF("date")}/>
            <Field label="Time" type="time" value={schedForm.time} onChange={upSF("time")}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <SelectField label="Exam Type" value={schedForm.type} onChange={upSF("type")} options={["MCQ","SEQ","Essay","Paper","Online","Practical","Mixed"]}/>
            <Field label="Duration" placeholder="3 hours" value={schedForm.duration} onChange={upSF("duration")}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Total Marks" placeholder="Total marks" type="number" value={schedForm.marks} onChange={upSF("marks")}/>
            <Field label="Venue" placeholder="Hall A" value={schedForm.venue} onChange={upSF("venue")}/>
          </div>
          <Field label="Notes / Instructions" placeholder="e.g. Open book allowed" value={schedForm.notes} onChange={upSF("notes")} optional/>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <Btn label="Schedule Exam" icon={CalendarPlus} color={C.accent2} onClick={addExam}/>
            <Btn label="Cancel" onClick={()=>setShowSchedule(false)} outline/>
          </div>
        </Modal>
      )}
    </div>
  );
};


/* ─── Analytics ───────────────────────────────────────────── */
const AnalyticsPage = () => {
  const [activeReport,setActiveReport] = useState(null);
  const {students,teachers,classes,fees,attendance,exams} = useStore();
  const revenue=fees.filter(f=>String(f.status||"Paid").toLowerCase()==="paid").reduce((sum,f)=>sum+(Number(f.amount)||0),0);
  const avgAttendance=students.length?Math.round(students.reduce((sum,st)=>sum+(Number(st.attendance)||0),0)/students.length):null;
  const reports={
    financial:{title:"Financial Report",cols:["Student","Subject","Amount","Date","Method","Status","Month"],rows:fees.map(f=>[f.student||"—",f.subject||"—",`Rs. ${fmt(Number(f.amount)||0)}`,f.date||"—",f.method||"—",f.status||"Recorded",f.month||"—"])},
    attendance:{title:"Attendance Report",cols:["Student","ID","Grade","Branch","Attendance %","Status"],rows:students.map(s=>[s.name,s.id,s.grade||"—",s.branch||"—",`${Number(s.attendance)||0}%`,(Number(s.attendance)||0)>=85?"Good":(Number(s.attendance)||0)>=75?"Average":"Low"])},
    exams:{title:"Exam Schedule Report",cols:["Exam","Class","Date","Time","Type","Status"],rows:exams.map(e=>[e.name,e.class||"—",e.date||"—",e.time||"—",e.type||"—",e.status||"Scheduled"])},
    enrollment:{title:"Student Enrollment Report",cols:["Student ID","Name","Grade","Subjects","Branch","Fee Status"],rows:students.map(s=>[s.id,s.name,s.grade||"—",(s.subjects||[]).join(", ")||"—",s.branch||"—",s.paid?"Paid":s.dueDate&&s.dueDate<isoDate()?"Overdue":"Pending"])},
    teachers:{title:"Teacher Directory Report",cols:["ID","Teacher","Subject","Classes","Students","Salary","Branch"],rows:teachers.map(t=>[t.id,t.name,t.subject||"—",classes.filter(c=>c.teacher===t.name).length,t.students??classes.filter(c=>c.teacher===t.name).reduce((n,c)=>n+(Number(c.enrolled)||0),0),`Rs. ${fmt(Number(t.salary)||0)}`,t.branch||"—"])},
    branch:{title:"Branch Summary Report",cols:["Branch","Students","Teachers","Classes","Recorded Revenue"],rows:Array.from(new Set([...students.map(s=>s.branch),...teachers.map(t=>t.branch),...classes.map(c=>c.branch)].filter(Boolean))).map(branch=>[branch,students.filter(s=>s.branch===branch).length,teachers.filter(t=>t.branch===branch).length,classes.filter(c=>c.branch===branch).length,`Rs. ${fmt(fees.filter(f=>f.branch===branch&&String(f.status||"Paid").toLowerCase()==="paid").reduce((sum,f)=>sum+(Number(f.amount)||0),0))}`])}
  };
  const REP_META=[
    {key:"financial", title:"Financial Report",    icon:WalletCards,    color:C.gold,    desc:"Recorded payments, collection totals and fee status"},
    {key:"attendance",title:"Attendance Report",   icon:ClipboardCheck, color:C.emerald, desc:"Student attendance rates and current attendance records"},
    {key:"exams",     title:"Exam Schedule",       icon:FileText,       color:C.accent2, desc:"Scheduled exams and their current status"},
    {key:"enrollment",title:"Student Enrollment",  icon:GraduationCap,  color:C.accent,  desc:"Student records, grade distribution and payment status"},
    {key:"teachers",  title:"Teacher Directory",   icon:UserRoundCheck, color:C.rose,    desc:"Current teacher records and linked classes"},
    {key:"branch",    title:"Branch Summary",      icon:Building2,      color:C.amber,   desc:"Branch totals derived from actual saved records"},
  ];
  const rep=activeReport?reports[activeReport]:null;
  const printReport=key=>printAnalyticsReport(reports[key]);
  return (
    <div>
      <div style={{marginBottom:24}}><h2 style={{color:C.text,fontSize:22,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Analytics</h2><p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>Reports are calculated from records currently saved in EduPeak.</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        <StatCard icon={<Banknote size={24}/>} label="Recorded Revenue" value={`Rs. ${fmt(revenue)}`} sub="Payments marked as paid" color={C.col03}/>
        <StatCard icon={<Users size={24}/>} label="Total Students" value={fmt(students.length)} sub="Imported and registered" color={C.col01}/>
        <StatCard icon={<ClipboardCheck size={24}/>} label="Average Attendance" value={avgAttendance===null?"—":`${avgAttendance}%`} sub={students.length?"Across student profiles":"No attendance history yet"} color={C.col04}/>
        <StatCard icon={<BookMarked size={24}/>} label="Scheduled Exams" value={fmt(exams.filter(e=>e.status!=="Completed"&&e.status!=="Cancelled").length)} sub="Saved exam schedule records" color={C.col02}/>
      </div>
      <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {REP_META.map(r=><div key={r.key} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,display:"flex",gap:18,alignItems:"flex-start"}}><div style={{color:r.color,display:"flex",flexShrink:0}}><AppIcon icon={r.icon} size={32}/></div><div style={{flex:1}}><div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:6}}>{r.title}</div><div style={{color:C.muted,fontSize:13,lineHeight:1.5,marginBottom:14}}>{r.desc}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn label="View Report" color={r.color} small onClick={()=>setActiveReport(r.key)}/><Btn label="Print / PDF" color={r.color} outline small icon={Printer} onClick={()=>printReport(r.key)}/></div></div></div>)}
      </div>
      {activeReport&&rep&&<Modal title={rep.title} onClose={()=>setActiveReport(null)} wide>
        <div style={{color:C.muted,fontSize:12,marginBottom:14}}>{rep.rows.length} record{rep.rows.length===1?"":"s"} · Generated {new Date().toLocaleString("en-LK")}</div>
        {rep.rows.length===0?<div style={{textAlign:"center",padding:32,color:C.muted,fontSize:13}}>No records available for this report yet.</div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{background:C.subtle}}>{rep.cols.map(c=><th key={c} style={{padding:"10px 14px",textAlign:"left",color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{c}</th>)}</tr></thead><tbody>{rep.rows.map((row,ri)=><tr key={ri} style={{borderBottom:`1px solid ${C.border}`}}>{row.map((cell,ci)=><td key={ci} style={{padding:"11px 14px",color:C.text,fontSize:13}}>{cell}</td>)}</tr>)}</tbody></table></div>}
        <div style={{display:"flex",gap:10,marginTop:20}}><Btn label="Print / Export PDF" icon={Printer} color={C.accent} onClick={()=>printAnalyticsReport(rep)}/><Btn label="Close" onClick={()=>setActiveReport(null)} outline/></div>
      </Modal>}
    </div>
  );
};


/* ─── Bulk record import + trilingual form capture ───────── */
const parseCsvText = (text) => {
  const rows=[]; let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;continue;}
    if(ch==='"'){quoted=!quoted;continue;}
    if(ch===','&&!quoted){row.push(cell);cell="";continue;}
    if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);cell="";if(row.some(v=>String(v).trim()!==""))rows.push(row);row=[];continue;}
    cell+=ch;
  }
  row.push(cell); if(row.some(v=>String(v).trim()!==""))rows.push(row);
  if(!rows.length)return [];
  const headers=rows.shift().map(h=>String(h).trim());
  return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??""])));
};
const csvValue = (row, names) => {
  const entries=Object.entries(row||{});
  const hit=entries.find(([k,v])=>names.includes(String(k).trim().toLowerCase().replace(/[ _-]+/g," "))&&String(v??"").trim()!=="");
  return hit?hit[1]:"";
};
const normaliseImportedStudent = (row, existingStudents) => {
  const rawName=String(csvValue(row,["name","student name","full name","student full name"])||"").trim();
  const rawSubjects=csvValue(row,["subjects","subject","enrolled subjects"]);
  const subjects=Array.isArray(rawSubjects)?rawSubjects.map(String).filter(Boolean):String(rawSubjects||"").split(/[;,|]/).map(s=>s.trim()).filter(Boolean);
  const paidRaw=String(csvValue(row,["paid","fee status","payment status","fees paid"])||"").trim().toLowerCase();
  const attendanceRaw=Number(csvValue(row,["attendance","attendance percent","attendance %"]));
  const rawId=String(csvValue(row,["id","student id","registration id","registration number","reg no"])||"").trim();
  const date=String(csvValue(row,["registration date","reg date","regdate","enrollment date","date enrolled","year enrolled","enrollment year"])||"").trim() || isoDate();
  const grade=String(csvValue(row,["grade","class","student grade"])||"").trim();
  const firstEnrolledGrade=String(csvValue(row,["first enrolled grade","first_enrolled_grade","enrollment grade","entry grade"])||grade).trim();
  const feeRaw=csvValue(row,["fee","monthly fee","monthly amount"]);
  const phone=String(csvValue(row,["phone","phone number","contact","contact number","mobile","parent mobile"])||"").trim();
  const initials=rawName.split(/\s+/).map(n=>n[0]).join("").toUpperCase().slice(0,2)||"ST";
  const id=rawId||nextStudentId(existingStudents,firstEnrolledGrade||grade,date);
  const errors=[];
  if(!rawName)errors.push("Student name is required");
  if(!rawId&&!id)errors.push("A numeric grade is required to generate the student ID");
  return {
    id, firstEnrolledGrade:firstEnrolledGrade||grade, name:rawName, nic:String(csvValue(row,["nic","nic number","national id"])||"").trim(),
    grade, school:String(csvValue(row,["school","school name","institution"])||"").trim(),
    subjects:subjects.length?subjects:["General"], fee:String(feeRaw??"").trim()!==""&&Number.isFinite(Number(feeRaw))?Math.max(0,Number(feeRaw)):0,
    paid:paidRaw===""?null:["paid","yes","true","1","complete","completed"].includes(paidRaw),
    attendance:Number.isFinite(attendanceRaw)?Math.max(0,Math.min(100,attendanceRaw)):0,
    avatar:initials, branch:String(csvValue(row,["branch","campus","location"])||"").trim(),
    parent:String(csvValue(row,["parent","parent name","guardian","guardian name"])||"").trim(), phone,
    email:String(csvValue(row,["email","email address"])||"").trim(), dob:String(csvValue(row,["dob","date of birth","birth date"])||"").trim(),
    address:String(csvValue(row,["address","home address"])||"").trim(), city:String(csvValue(row,["city","town"])||"").trim(),
    concession:String(csvValue(row,["concession","fee concession"])||"None").trim(), regDate:date,
    dueDate:String(csvValue(row,["due date","payment due date"])||"").trim(), month:String(csvValue(row,["month","fee month"])||"").trim(),
    _valid:errors.length===0, _errors:errors, _sourceId:rawId
  };
};

const DataImportPage = () => {
  const store=useStore();
  const [mode,setMode]=useState("bulk");
  const [preview,setPreview]=useState([]);
  const [sourceName,setSourceName]=useState("");
  const [bundle,setBundle]=useState(null);
  const [importMessage,setImportMessage]=useState("");
  const [importError,setImportError]=useState("");
  const [busy,setBusy]=useState(false);
  const fileRef=useRef(null);
  const scanRef=useRef(null);
  const [scans,setScans]=useState([]);
  const [captureDraft,setCaptureDraft]=useState({name:"",nic:"",dob:"",grade:"",school:"",phone:"",parent:"",address:"",language:"Trilingual",freeCard:false,halfCard:false});
  const [captureSaved,setCaptureSaved]=useState("");
  const upCapture=k=>e=>setCaptureDraft(v=>({...v,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));

  const processFile=async(file)=>{
    if(!file)return;setImportError("");setImportMessage("");setBusy(true);setSourceName(file.name);
    try{
      const name=file.name.toLowerCase(); let rawRows=[],dataBundle=null;
      if(name.endsWith(".json")){
        const json=JSON.parse(await file.text());
        if(Array.isArray(json))rawRows=json;
        else if(Array.isArray(json.students)){rawRows=json.students;dataBundle=json;}
        else throw new Error("JSON must be a student array or an EduPeak backup containing a students array.");
      }else if(name.endsWith(".csv")||name.endsWith(".txt")) rawRows=parseCsvText(await file.text());
      else throw new Error("Use CSV or JSON for bulk import. Export Excel files as CSV first.");
      if(!rawRows.length)throw new Error("No student rows were found in this file.");
      let generatedList=[...store.students];
      const normalised=rawRows.map(row=>{const st=normaliseImportedStudent(row,generatedList);const preserved=dataBundle&&row&&typeof row==="object"?{...row,...st}:st;if(preserved._valid)generatedList.push(preserved);return preserved;});
      const knownIds=new Set(store.students.map(st=>String(st.id||"").trim().toLowerCase()));
      const knownNames=new Set(store.students.map(st=>`${String(st.name||"").trim().toLowerCase()}|${String(st.phone||"").replace(/\D/g,"")}`));
      const seenIds=new Set(knownIds),seenNames=new Set(knownNames);
      const withFlags=normalised.map(st=>{
        const id=String(st.id||"").trim().toLowerCase();
        const pair=`${String(st.name||"").trim().toLowerCase()}|${String(st.phone||"").replace(/\D/g,"")}`;
        const dupe=(id&&seenIds.has(id))||(st.phone&&seenNames.has(pair));
        if(id)seenIds.add(id);if(st.phone)seenNames.add(pair);
        return {...st,_duplicate:!!dupe};
      });
      setPreview(withFlags);setBundle(dataBundle);setImportMessage(`Read ${withFlags.length} student row${withFlags.length===1?"":"s"}. Review invalid rows and duplicates before importing.`);
    }catch(e){setPreview([]);setBundle(null);setImportError(e?.message||"Could not read this file.");}
    finally{setBusy(false);if(fileRef.current)fileRef.current.value="";}
  };
  const importRows=()=>{
    const rows=preview.filter(r=>r._valid&&!r._duplicate).map(({_valid,_errors,_duplicate,_sourceId,...r})=>r);
    if(!rows.length){setImportError("There are no new valid rows to import.");return;}
    store.setStudents(prev=>[...prev,...rows]);
    let details=`Imported ${rows.length} student record${rows.length===1?"":"s"}.`;
    if(bundle){
      const appendUnique=(existing,incoming)=>{const have=new Set((existing||[]).map(x=>String(x.id||"")));return [...(existing||[]),...(Array.isArray(incoming)?incoming.filter(x=>!have.has(String(x.id||""))):[])];};
      if(Array.isArray(bundle.teachers))store.setTeachers(prev=>appendUnique(prev,bundle.teachers));
      if(Array.isArray(bundle.classes))store.setClasses(prev=>appendUnique(prev,bundle.classes));
      if(Array.isArray(bundle.fees))store.setFees(prev=>appendUnique(prev,bundle.fees));
      if(Array.isArray(bundle.attendance))store.setAttendance(prev=>appendUnique(prev,bundle.attendance));
      if(Array.isArray(bundle.exams))store.setExams(prev=>appendUnique(prev,bundle.exams));
      details+=" Historical fees, attendance and other available backup records were also merged, skipping matching IDs.";
    }
    setImportMessage(details);setImportError("");setPreview([]);setBundle(null);setSourceName("");
  };
  const downloadTemplate=()=>{
    const csv="student_id,name,nic,dob,grade,first_enrolled_grade,school,subjects,parent,phone,email,address,city,branch,attendance,fee,paid,concession,registration_date,due_date\n";
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="edupeak-student-import-template.csv";a.click();URL.revokeObjectURL(url);
  };
  const addScans=files=>{
    const added=Array.from(files||[]).map(file=>({id:`SCAN-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,file,name:file.name,type:file.type||"application/octet-stream",size:file.size,previewUrl:file.type.startsWith("image/")?URL.createObjectURL(file):null,status:"Needs OCR processing"}));
    setScans(prev=>[...added,...prev]);setCaptureSaved("");
  };
  const saveCaptureDraft=()=>{
    if(!captureDraft.name.trim()){setCaptureSaved("Enter a recognised student name before adding this record.");return;}
    if(!studentGradeCode(captureDraft.grade)){setCaptureSaved("Enter a numeric grade (for example Grade 12) so EduPeak can generate the student ID.");return;}
    const subjects=[];const enrollmentDate=isoDate();
    const st={id:nextStudentId(store.students,captureDraft.grade,enrollmentDate),firstEnrolledGrade:captureDraft.grade,regDate:enrollmentDate,name:captureDraft.name.trim(),nic:captureDraft.nic,dob:captureDraft.dob,grade:captureDraft.grade,school:captureDraft.school,subjects:subjects.length?subjects:["General"],fee:0,paid:false,attendance:0,avatar:captureDraft.name.trim().split(/\s+/).map(n=>n[0]).join("").toUpperCase().slice(0,2),branch:"",parent:captureDraft.parent,phone:captureDraft.phone,address:captureDraft.address,concession:captureDraft.freeCard?"Free":captureDraft.halfCard?"Half":"None"};
    if(!st.id){setCaptureSaved("Could not generate an ID. Enter a numeric grade such as Grade 12.");return;}
    store.setStudents(prev=>[...prev,st]);
    setCaptureSaved(`Saved ${st.name} as ${st.id}. This form draft was entered/reviewed manually; automatic handwriting recognition is not connected yet.`);
    setCaptureDraft({name:"",nic:"",dob:"",grade:"",school:"",phone:"",parent:"",address:"",language:"Trilingual",freeCard:false,halfCard:false});
  };
  const panel={background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:22};
  const inputStyle={width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:22}}>
      <div><h2 style={{color:C.text,fontSize:22,fontWeight:700,margin:0}}>Data Import & Form Capture</h2><p style={{color:C.muted,fontSize:13,margin:"5px 0 0"}}>Bring historical records in batches or prepare scanned student applications for recognition and review.</p></div>
      <Badge label="Frontend workflow" color={C.amber}/>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
      <button onClick={()=>setMode("bulk")} style={{background:mode==="bulk"?`${alphaColor(C.col01, 13)}`:C.card,border:`1px solid ${mode==="bulk"?C.col01:C.border}`,color:mode==="bulk"?C.col01:C.muted,borderRadius:8,padding:"10px 15px",cursor:"pointer",fontWeight:600,fontSize:13,display:"inline-flex",alignItems:"center",gap:8}}><Database size={16}/>Bulk historical import</button>
      <button onClick={()=>setMode("capture")} style={{background:mode==="capture"?`${alphaColor(C.col01, 13)}`:C.card,border:`1px solid ${mode==="capture"?C.col01:C.border}`,color:mode==="capture"?C.col01:C.muted,borderRadius:8,padding:"10px 15px",cursor:"pointer",fontWeight:600,fontSize:13,display:"inline-flex",alignItems:"center",gap:8}}><ScanLine size={16}/>Scanned form capture</button>
    </div>
    {mode==="bulk"&&<div style={{display:"grid",gridTemplateColumns:"minmax(280px,.85fr) minmax(0,1.15fr)",gap:16,alignItems:"start"}}>
      <div style={panel}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><Upload size={20} color={C.accent}/><div style={{color:C.text,fontWeight:700,fontSize:15}}>Import existing records in one go</div></div>
        <div style={{color:C.muted,fontSize:13,lineHeight:1.6,marginBottom:16}}>Upload CSV exported from Excel, or an EduPeak JSON backup. Existing records are not deleted. Matching student IDs and duplicate name/phone pairs are flagged and skipped.</div>
        <div onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();processFile(e.dataTransfer.files?.[0]);}} style={{border:`1px dashed ${alphaColor(C.accent, 53)}`,background:`${alphaColor(C.accent, 4)}`,borderRadius:12,padding:24,textAlign:"center",cursor:"pointer",marginBottom:14}}>
          <Upload size={28} color={C.accent} style={{marginBottom:10}}/><div style={{color:C.text,fontWeight:600,fontSize:14}}>Choose a CSV or JSON file</div><div style={{color:C.muted,fontSize:12,marginTop:5}}>or drag and drop it here</div><div style={{color:C.muted,fontSize:11,marginTop:8}}>Excel .xlsx files should first be exported as CSV</div>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.txt,.json,application/json,text/csv" onChange={e=>processFile(e.target.files?.[0])} style={{display:"none"}}/>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn label="Download CSV template" icon={Download} outline small onClick={downloadTemplate}/><Btn label="Browse file" icon={Upload} small onClick={()=>fileRef.current?.click()} disabled={busy}/></div>
        {sourceName&&<div style={{marginTop:12,color:C.text,fontSize:12}}>Selected: {sourceName}</div>}
        {busy&&<div style={{marginTop:12,color:C.accent,fontSize:12}}>Reading file…</div>}
        {importError&&<div role="alert" style={{marginTop:12,padding:10,borderRadius:8,background:`${alphaColor(C.rose, 8)}`,color:C.rose,fontSize:12}}>{importError}</div>}
        {importMessage&&<div role="status" style={{marginTop:12,padding:10,borderRadius:8,background:`${alphaColor(C.emerald, 8)}`,color:C.emerald,fontSize:12,lineHeight:1.5}}>{importMessage}</div>}
        <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}`}}><div style={{color:C.text,fontWeight:600,fontSize:13,marginBottom:8}}>Import safeguards</div>{["Preview before changes are applied","Reject records without a student name","Skip duplicate student IDs","Append records; do not overwrite the current database"].map(t=><div key={t} style={{display:"flex",alignItems:"center",gap:8,color:C.muted,fontSize:12,padding:"4px 0"}}><Check size={14} color={C.emerald}/>{t}</div>)}</div>
      </div>
      <div style={panel}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:14}}><div style={{color:C.text,fontWeight:700,fontSize:15}}>Review import preview</div>{preview.length>0&&<Badge label={`${preview.length} rows`} color={C.accent}/>}</div>
        {preview.length===0?<div style={{minHeight:220,display:"grid",placeItems:"center",textAlign:"center",color:C.muted,fontSize:13}}><div><FileText size={30} style={{margin:"0 auto 12px",opacity:.6}}/><div style={{color:C.text,fontWeight:600,marginBottom:5}}>No file loaded</div><div>Rows and duplicate warnings will appear here before import.</div></div></div>:<>
          <div style={{maxHeight:420,overflow:"auto",border:`1px solid ${C.border}`,borderRadius:8}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead style={{position:"sticky",top:0,background:C.subtle}}><tr>{["Status","Student ID","Name","Grade","Phone"].map(h=><th key={h} style={{padding:"10px 9px",textAlign:"left",color:C.muted,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{preview.map((r,i)=><tr key={`${r.id}-${i}`} style={{borderBottom:`1px solid ${C.border}`}}><td style={{padding:"9px",whiteSpace:"nowrap"}}><Badge label={!r._valid?"Invalid":r._duplicate?"Duplicate":"Ready"} color={!r._valid?C.rose:r._duplicate?C.amber:C.emerald}/></td><td style={{padding:"9px",color:C.muted}}>{r.id||"—"}</td><td style={{padding:"9px",color:C.text}}>{r.name||"Name missing"}</td><td style={{padding:"9px",color:C.muted}}>{r.grade||"—"}</td><td style={{padding:"9px",color:C.muted}}>{r.phone||"—"}</td></tr>)}</tbody></table></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginTop:14}}><div style={{fontSize:12,color:C.muted}}>{preview.filter(r=>r._valid&&!r._duplicate).length} ready · {preview.filter(r=>!r._valid).length} invalid · {preview.filter(r=>r._duplicate).length} duplicate</div><Btn label="Import valid records" icon={CheckCircle2} onClick={importRows} disabled={!preview.some(r=>r._valid&&!r._duplicate)}/></div>
        </>}
      </div>
    </div>}
    {mode==="capture"&&<div style={{display:"grid",gridTemplateColumns:"minmax(280px,.9fr) minmax(0,1.1fr)",gap:16,alignItems:"start"}}>
      <div style={panel}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><ScanLine size={20} color={C.accent}/><div style={{color:C.text,fontWeight:700,fontSize:15}}>Upload scanned application forms</div></div>
        <div style={{color:C.muted,fontSize:13,lineHeight:1.6,marginBottom:16}}>Accepts scanned images or PDFs of the trilingual, box-grid student application form. Documents are queued for alignment, handwriting ICR and checkbox OMR processing.</div>
        <div onClick={()=>scanRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addScans(e.dataTransfer.files);}} style={{border:`1px dashed ${alphaColor(C.accent, 53)}`,borderRadius:12,padding:22,textAlign:"center",cursor:"pointer",background:`${alphaColor(C.accent, 4)}`}}><Upload size={28} color={C.accent} style={{marginBottom:10}}/><div style={{color:C.text,fontWeight:600,fontSize:14}}>Select scanned forms</div><div style={{color:C.muted,fontSize:12,marginTop:5}}>PDF · PNG · JPG · WEBP · multiple files supported</div></div>
        <input ref={scanRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" multiple onChange={e=>addScans(e.target.files)} style={{display:"none"}}/>
        <div style={{marginTop:16,padding:14,borderRadius:9,background:`${alphaColor(C.amber, 7)}`,border:`1px solid ${alphaColor(C.amber, 27)}`,color:C.amber,fontSize:12,lineHeight:1.6}}><strong>Recognition service not connected yet.</strong><br/>This frontend builds the review workflow. Automatic deskew/alignment, box-by-box handwriting ICR and OMR checkbox detection require the OCR processing service to be implemented and connected.</div>
        <div style={{marginTop:18,color:C.text,fontWeight:600,fontSize:13,marginBottom:8}}>Planned capture pipeline</div>
        {["1. Upload and validate scan/PDF","2. Detect page boundaries, rotate and deskew","3. Map printed grid boxes and language zones","4. Recognize handwritten characters in English / Sinhala / Tamil","5. Detect checkbox marks (OMR)","6. Review uncertain fields and import records"].map(t=><div key={t} style={{color:C.muted,fontSize:12,padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>{t}</div>)}
      </div>
      <div style={panel}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:14}}><div style={{color:C.text,fontWeight:700,fontSize:15}}>Capture queue</div><Badge label={`${scans.length} files`} color={C.accent}/></div>
        {scans.length===0?<div style={{padding:"22px 10px",textAlign:"center",color:C.muted,fontSize:13}}>Uploaded files will appear here for preview and review.</div>:scans.map(scan=><div key={scan.id} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>{scan.previewUrl?<img src={scan.previewUrl} alt="Uploaded form preview" style={{width:62,height:76,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`}}/>:<div style={{width:62,height:76,display:"grid",placeItems:"center",background:C.bg,borderRadius:6,border:`1px solid ${C.border}`}}><FileText color={C.accent} size={25}/></div>}<div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontSize:13,fontWeight:600,overflowWrap:"anywhere"}}>{scan.name}</div><div style={{color:C.muted,fontSize:11,marginTop:3}}>{(scan.size/1024).toFixed(0)} KB · {scan.type.includes("pdf")?"PDF document":"Image scan"}</div><div style={{color:C.amber,fontSize:11,marginTop:5}}>{scan.status}</div></div><button aria-label="Remove scanned file" onClick={()=>{if(scan.previewUrl)URL.revokeObjectURL(scan.previewUrl);setScans(prev=>prev.filter(x=>x.id!==scan.id));}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:7,padding:7,cursor:"pointer"}}><X size={14}/></button></div>)}
        <div style={{marginTop:20,paddingTop:18,borderTop:`1px solid ${C.border}`}}><div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:5}}>Review / manual fallback draft</div><div style={{color:C.muted,fontSize:12,lineHeight:1.5,marginBottom:14}}>Until the ICR service is connected, enter verified values here. The checkbox choices populate the student's fee concession.</div>
          <SelectField label="Form language" value={captureDraft.language} onChange={e=>setCaptureDraft(v=>({...v,language:e.target.value}))} options={["Trilingual","English","සිංහල","தமிழ்"]}/>
          <Field label="Student Full Name" value={captureDraft.name} onChange={upCapture("name")} placeholder="Verified student name"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="NIC / ID" value={captureDraft.nic} onChange={upCapture("nic")} placeholder="NIC or document ID"/><Field label="Date of Birth" type="date" value={captureDraft.dob} onChange={upCapture("dob")}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Grade" value={captureDraft.grade} onChange={upCapture("grade")} placeholder="Grade / A/L"/><Field label="School" value={captureDraft.school} onChange={upCapture("school")} placeholder="School name"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Field label="Parent / Guardian" value={captureDraft.parent} onChange={upCapture("parent")} placeholder="Guardian name"/><Field label="Contact number" value={captureDraft.phone} onChange={upCapture("phone")} placeholder="07X XXX XXXX"/></div>
          <Field label="Address" value={captureDraft.address} onChange={upCapture("address")} placeholder="Residential address"/>
          <div style={{display:"flex",gap:18,flexWrap:"wrap",marginBottom:16}}><label style={{display:"flex",alignItems:"center",gap:8,color:C.text,fontSize:13}}><input type="checkbox" checked={captureDraft.freeCard} onChange={e=>setCaptureDraft(v=>({...v,freeCard:e.target.checked,halfCard:e.target.checked?false:v.halfCard}))}/>Free Card (OMR field)</label><label style={{display:"flex",alignItems:"center",gap:8,color:C.text,fontSize:13}}><input type="checkbox" checked={captureDraft.halfCard} onChange={e=>setCaptureDraft(v=>({...v,halfCard:e.target.checked,freeCard:e.target.checked?false:v.freeCard}))}/>Half Card (OMR field)</label></div>
          <Btn label="Save reviewed student draft" icon={Save} onClick={saveCaptureDraft} disabled={!captureDraft.name.trim()}/>
          {captureSaved&&<div role="status" style={{color:captureSaved.startsWith("Saved")?C.emerald:C.amber,fontSize:12,marginTop:12,lineHeight:1.5}}>{captureSaved}</div>}
        </div>
      </div>
    </div>}
  </div>;
};

const ADVANCED_SETTINGS_KEY = "edupeak.advanced-settings.v1";
const ROLE_MODULES = ["Dashboard","Students","Teachers","Classes & Timetable","Attendance","Fees","Exams","Analytics","Data Import & Capture"];
const DEFAULT_ROLE_PERMISSIONS = {
  "Super Administrator":ROLE_MODULES,
  "Administrator":["Dashboard","Students","Teachers","Classes & Timetable","Attendance","Fees","Exams","Analytics","Data Import & Capture"],
  "Manager":["Dashboard","Students","Teachers","Classes & Timetable","Attendance","Fees","Exams"],
  "Teacher":["Dashboard","Classes & Timetable","Attendance","Exams"],
  "Registrar":["Dashboard","Students","Classes & Timetable","Attendance","Data Import & Capture"],
  "Accountant":["Dashboard","Students","Fees","Analytics"],
  "Attendance Staff":["Dashboard","Students","Classes & Timetable","Attendance"],
  "Viewer":["Dashboard","Analytics"],
  "Student":[],"Parent":[]
};
const DEFAULT_SMS_TEMPLATES = {
  fee:"Dear parent of {student}, the tuition fee of Rs. {amount} for {month} is due. Please contact {branch} to arrange payment. Thank you.",
  attendance:"Dear parent, {student} was marked {status} for {class} on {date}. Please contact the institute if you have any questions.",
  exam:"Reminder: {student}'s {exam} is scheduled for {date} at {time}. Venue: {venue}."
};
const loadAdvancedSettings = () => {
  try { const stored=JSON.parse(localStorage.getItem(ADVANCED_SETTINGS_KEY)||"null"); if(stored)return {...stored,rolePermissions:{...DEFAULT_ROLE_PERMISSIONS,...(stored.rolePermissions||{})},smsTemplates:{...DEFAULT_SMS_TEMPLATES,...(stored.smsTemplates||{})},branches:Array.isArray(stored.branches)?stored.branches:[]}; } catch {}
  return {institute:{name:"",registrationNumber:"",address:"",phone:"",email:""},rolePermissions:DEFAULT_ROLE_PERMISSIONS,smsTemplates:DEFAULT_SMS_TEMPLATES,branches:[],language:"English"};
};

/* ─── Settings ⑨ individual windows ──────────────────────── */
const SettingsPage = ({currentUser,initialSettings}) => {
  const [section,setSection] = useState(null);
  const store = useStore();
  const restoreRef = useRef(null);
  const upgradeRef = useRef(null);
  const [backupMsg,setBackupMsg] = useState("");
  const [profileMsg,setProfileMsg] = useState("");
  const [smsMsg,setSmsMsg] = useState("");
  const [gatewayMsg,setGatewayMsg] = useState("");
  const [upgradeMsg,setUpgradeMsg] = useState("");
  const [branchForm,setBranchForm] = useState({name:"",address:"",phone:"",status:"Active"});
  const [showBranchForm,setShowBranchForm] = useState(false);
  const [rolesDraft,setRolesDraft] = useState(()=>({...DEFAULT_ROLE_PERMISSIONS,...(initialSettings?.rolePermissions || loadAdvancedSettings().rolePermissions)}));
  const [profileDraft,setProfileDraft] = useState(()=>initialSettings?.institute || loadAdvancedSettings().institute);
  const [settings,setSettings] = useState(()=>({
    ...loadAdvancedSettings(),
    ...(initialSettings || {}),
    rolePermissions: {...DEFAULT_ROLE_PERMISSIONS,...(initialSettings?.rolePermissions || {})},
    smsTemplates: {...DEFAULT_SMS_TEMPLATES,...(initialSettings?.smsTemplates || {})},
  }));
  const [smsDraft,setSmsDraft] = useState(()=>({...DEFAULT_SMS_TEMPLATES,...(initialSettings?.smsTemplates || loadAdvancedSettings().smsTemplates)}));
  const [smsGatewayDraft,setSmsGatewayDraft] = useState({provider:"Dialog",senderId:"",apiKey:"",whatsappPhoneId:"",whatsappToken:""});
  const [gatewayDraft,setGatewayDraft] = useState({});
  const role = currentUser?.role || "Manager";
  const isSuper = role === "Super Administrator";
  const canAdmin = isSuper || role === "Administrator";
  const initialSettingsSnapshot = useRef(JSON.stringify(settings));
  useEffect(()=>{
    try{localStorage.setItem(ADVANCED_SETTINGS_KEY,JSON.stringify(settings));}catch{}
    const canManageSettings = currentUser?.role === "Super Administrator" || currentUser?.role === "Administrator";
    store.setInitialSettings?.(settings);
    if(store.instituteId && canManageSettings && JSON.stringify(settings) !== initialSettingsSnapshot.current){
      saveInstituteSettings(store.instituteId,settings)
        .catch(error=>store.onSyncError?.(error?.message || "Could not save institute settings."));
    }
  },[settings,store.instituteId,currentUser?.role]);
  const updateProfile=k=>e=>setProfileDraft(v=>({...v,[k]:e.target.value}));
  const updateSms=k=>e=>setSmsDraft(v=>({...v,[k]:e.target.value}));
  const updateBranch=k=>e=>setBranchForm(v=>({...v,[k]:e.target.value}));
  const downloadBackup = () => {
    const data = {app:"edupeak",version:3,exportedAt:new Date().toISOString(),students:store.students,teachers:store.teachers,classes:store.classes,fees:store.fees,attendance:store.attendance,exams:store.exams,settings:settings,readNotificationIds:JSON.parse(localStorage.getItem("edupeak.notifications.read.v1")||"[]")};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    const a = document.createElement("a"); a.href = url; a.download = `edupeak-backup-${isoDate()}.json`; a.click(); URL.revokeObjectURL(url);
    setBackupMsg("Backup file created from the current records.");
  };
  const restoreBackup = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result));
        if (!Array.isArray(d.students)) throw new Error("not a backup");
        store.setStudents(d.students); store.setTeachers(Array.isArray(d.teachers)?d.teachers:[]); store.setClasses(Array.isArray(d.classes)?d.classes:[]);
        store.setFees(Array.isArray(d.fees)?d.fees:[]); store.setAttendance(Array.isArray(d.attendance)?d.attendance:[]); store.setExams(Array.isArray(d.exams)?d.exams:[]);
        if(d.settings&&typeof d.settings==="object"){localStorage.setItem(ADVANCED_SETTINGS_KEY,JSON.stringify(d.settings));window.dispatchEvent(new Event("edupeak-settings-updated"));setSettings(loadAdvancedSettings());setRolesDraft(loadAdvancedSettings().rolePermissions);setSmsDraft(loadAdvancedSettings().smsTemplates);setProfileDraft(loadAdvancedSettings().institute);}
        if(Array.isArray(d.readNotificationIds))localStorage.setItem("edupeak.notifications.read.v1",JSON.stringify(d.readNotificationIds));
        setBackupMsg(`Restored ${d.students.length} students, ${(d.classes||[]).length} classes and ${(d.fees||[]).length} payment records from file.`);
      } catch { setBackupMsg("That file is not a valid EduPeak backup."); }
    };
    r.readAsText(file); e.target.value = "";
  };
  const addBranch=()=>{
    if(!branchForm.name.trim())return;
    const branch={...branchForm,id:`BR-${Date.now()}`,students:store.students.filter(s=>s.branch===branchForm.name.trim()).length};
    setSettings(v=>({...v,branches:[...(v.branches||[]),branch]}));setBranchForm({name:"",address:"",phone:"",status:"Active"});setShowBranchForm(false);
  };
  const saveTemplates=()=>{setSettings(v=>({...v,smsTemplates:smsDraft}));setSmsMsg("SMS / WhatsApp templates saved on this device. Sending requires a configured messaging service.");};
  const SECTIONS=[
    {id:"roles",title:"User Roles & Permissions",icon:LockKeyhole,color:C.accent2,desc:"Configure page-level access for each role",superOnly:true},
    {id:"sms",title:"SMS / WhatsApp Alerts",icon:Smartphone,color:C.emerald,desc:"Message templates and gateway setup"},
    {id:"payments",title:"Payment Gateways",icon:CreditCard,color:C.gold,desc:"Payment provider setup and credentials",adminOnly:true},
    {id:"branches",title:"Branches",icon:Building2,color:C.accent,desc:"Manage real branch records",adminOnly:true},
    {id:"security",title:"Backup & Security",icon:ShieldCheck,color:C.rose,desc:"Backup, restore and security planning",adminOnly:true},
    {id:"language",title:"Language Settings",icon:Languages,color:C.amber,desc:"English / සිංහල / Tamil"},
    {id:"upgrade",title:"System Upgrade & Maintenance",icon:RefreshCw,color:C.accent2,desc:"Review and prepare an authorized update",superOnly:true},
  ];
  const visibleSections=SECTIONS.filter(s=>s.superOnly?isSuper:s.adminOnly?canAdmin:true);
  const allowedSectionIds=visibleSections.map(s=>s.id);
  useEffect(()=>{if(section&&!allowedSectionIds.includes(section))setSection(null);},[role,section]);
  const renderSection=()=>{
    if(!section||!allowedSectionIds.includes(section))return null;
    switch(section){
      case "roles": return <Modal title="User Roles & Permissions" onClose={()=>setSection(null)} wide>
        <div style={{padding:12,borderRadius:8,background:`${alphaColor(C.amber, 7)}`,color:C.amber,fontSize:12,lineHeight:1.6,marginBottom:16}}>These controls define the frontend access experience. They are not a security boundary until the API enforces the same permissions on the server.</div>
        {Object.keys(DEFAULT_ROLE_PERMISSIONS).map(roleName=><div key={roleName} style={{background:C.bg,borderRadius:10,padding:16,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>{roleName}</div><Badge label={roleName==="Super Administrator"?"Full access":"Role policy"} color={roleName==="Super Administrator"?C.emerald:C.accent}/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8}}>{ROLE_MODULES.map(module=><label key={module} style={{display:"flex",alignItems:"center",gap:8,color:C.muted,fontSize:12,padding:"7px 8px",border:`1px solid ${C.border}`,borderRadius:7}}><input type="checkbox" checked={(rolesDraft[roleName]||[]).includes(module)} disabled={roleName==="Super Administrator"} onChange={e=>setRolesDraft(prev=>({...prev,[roleName]:e.target.checked?Array.from(new Set([...(prev[roleName]||[]),module])):(prev[roleName]||[]).filter(x=>x!==module)}))}/>{module}</label>)}</div>
          {roleName==="Administrator"&&<div style={{color:C.muted,fontSize:11,marginTop:8}}>Administrator cannot change role policies or run system upgrades; these controls remain Super Administrator only.</div>}
        </div>)}
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Btn label="Save role policies" icon={Save} onClick={()=>{const next={...settings,rolePermissions:rolesDraft};setSettings(next);try{localStorage.setItem(ADVANCED_SETTINGS_KEY,JSON.stringify(next));}catch{}window.dispatchEvent(new Event("edupeak-settings-updated"));setSection(null);}}/></div>
      </Modal>;
      case "sms": return <Modal title="SMS / WhatsApp Alerts" onClose={()=>setSection(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16}}>
          <SectionCard title="SMS Gateway">
            <SelectField label="Provider" value={smsGatewayDraft.provider} onChange={e=>setSmsGatewayDraft(v=>({...v,provider:e.target.value}))} options={["Dialog","Mobitel","Hutch","Airtel","Other"]}/>
            <Field label="Sender ID" placeholder="EDUPEAK" value={smsGatewayDraft.senderId} onChange={e=>setSmsGatewayDraft(v=>({...v,senderId:e.target.value}))}/>
            <Field label="API Key" type="password" placeholder="Enter gateway API key" value={smsGatewayDraft.apiKey} onChange={e=>setSmsGatewayDraft(v=>({...v,apiKey:e.target.value}))}/>
            <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>Provider credentials are held only in this open form; they are not saved in browser storage. Secure server-side credential storage will be connected in the backend phase.</div>
          </SectionCard>
          <SectionCard title="WhatsApp Business">
            <Field label="Phone Number ID" placeholder="WhatsApp Business Phone ID" value={smsGatewayDraft.whatsappPhoneId} onChange={e=>setSmsGatewayDraft(v=>({...v,whatsappPhoneId:e.target.value}))}/>
            <Field label="Access Token" type="password" placeholder="Meta API access token" value={smsGatewayDraft.whatsappToken} onChange={e=>setSmsGatewayDraft(v=>({...v,whatsappToken:e.target.value}))}/>
            <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>No message is sent by this frontend screen. Gateway connection and delivery status require a server integration.</div>
          </SectionCard>
        </div>
        <SectionCard title="Editable message templates">
          {[{key:"fee",label:"Fee payment reminder",tokens:"{student}, {amount}, {month}, {branch}"},{key:"attendance",label:"Attendance alert",tokens:"{student}, {status}, {class}, {date}"},{key:"exam",label:"Exam reminder",tokens:"{student}, {exam}, {date}, {time}, {venue}"}].map(t=><div key={t.key} style={{marginBottom:15}}><div style={{color:C.text,fontSize:13,fontWeight:600,marginBottom:6}}>{t.label}</div><textarea value={smsDraft[t.key]||""} onChange={updateSms(t.key)} rows={3} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:12,outline:"none",resize:"vertical",boxSizing:"border-box"}}/><div style={{fontSize:11,color:C.muted,marginTop:4}}>Available fields: {t.tokens}</div></div>)}
        </SectionCard>
        <Btn label="Save message templates" icon={Save} onClick={saveTemplates}/>{smsMsg&&<div style={{color:C.emerald,fontSize:12,marginTop:12}}>{smsMsg}</div>}
      </Modal>;
      case "payments": return <Modal title="Payment Gateways" onClose={()=>setSection(null)} wide>
        <div style={{color:C.muted,fontSize:12,lineHeight:1.6,marginBottom:16}}>No gateway is assumed to be connected. Store provider secrets on the server when the payment API is integrated; do not put live secrets in frontend code or browser storage.</div>
        {[{name:"PayHere",fields:[["Merchant ID","merchantId"],["Merchant Secret","merchantSecret"],["Mode","mode"]]},{name:"Genie by HNB",fields:[["Merchant ID","merchantId"],["API Key","apiKey"],["Secret","secret"]]},{name:"BOC eGate",fields:[["Merchant Code","merchantCode"],["Secret Key","secretKey"]]}].map(gw=><div key={gw.name} style={{background:C.bg,borderRadius:10,padding:18,marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{color:C.text,fontWeight:700,fontSize:15}}>{gw.name}</div><Badge label="Not configured" color={C.muted}/></div>{gw.fields.map(([label,key])=><Field key={key} label={label} type={key.toLowerCase().includes("secret")||key.toLowerCase().includes("key")?"password":"text"} placeholder={label} value={(gatewayDraft[gw.name]||{})[key]||""} onChange={e=>setGatewayDraft(v=>({...v,[gw.name]:{...(v[gw.name]||{}),[key]:e.target.value}}))}/>)}<Btn label="Validate configuration" outline small onClick={()=>setGatewayMsg(`${gw.name}: configuration is only a draft. Server-side validation is not connected yet.`)}/></div>)}
        {gatewayMsg&&<div style={{color:C.amber,fontSize:12,marginTop:8}}>{gatewayMsg}</div>}
      </Modal>;
      case "branches": return <Modal title="Branch Management" onClose={()=>setSection(null)} wide>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:16}}><div style={{color:C.muted,fontSize:13}}>Manage branches that are actually used by the institute.</div><Btn label={showBranchForm?"Cancel":"+ Add Branch"} onClick={()=>setShowBranchForm(v=>!v)} small/></div>
        {showBranchForm&&<div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:16}}><Field label="Branch name" value={branchForm.name} onChange={updateBranch("name")} placeholder="e.g. Kandy Branch"/><Field label="Address" value={branchForm.address} onChange={updateBranch("address")} placeholder="Street, town"/><Field label="Phone" value={branchForm.phone} onChange={updateBranch("phone")} placeholder="Contact number"/><SelectField label="Status" value={branchForm.status} onChange={updateBranch("status")} options={["Active","Inactive"]}/><Btn label="Save branch" icon={Save} onClick={addBranch} disabled={!branchForm.name.trim()}/></div>}
        {(settings.branches||[]).length===0&&!showBranchForm?<div style={{padding:32,textAlign:"center",color:C.muted,fontSize:13}}>No branches have been configured yet. Add the first real branch above.</div>:(settings.branches||[]).map(b=><div key={b.id||b.name} style={{background:C.bg,borderRadius:10,padding:18,marginBottom:12,display:"flex",gap:12,alignItems:"center"}}><div style={{flex:1}}><div style={{color:C.text,fontWeight:700,fontSize:15}}>{b.name}</div><div style={{color:C.muted,fontSize:12,marginTop:4}}>{b.address||"No address entered"}</div><div style={{color:C.muted,fontSize:12}}>{b.phone||"No phone entered"}</div></div><Badge label={b.status||"Active"} color={b.status==="Inactive"?C.muted:C.emerald}/><button onClick={()=>setSettings(v=>({...v,branches:v.branches.filter(x=>x.id!==b.id||!b.id&&x.name!==b.name)}))} title="Delete branch" style={{border:`1px solid ${C.border}`,background:"transparent",color:C.rose,borderRadius:7,padding:8,cursor:"pointer"}}><Trash2 size={14}/></button></div>)}
      </Modal>;
      case "security": return <Modal title="Backup & Security" onClose={()=>setSection(null)} wide>
        <SectionCard title="Local data backup">
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",fontSize:12.5,color:C.muted,marginBottom:14,lineHeight:1.6}}>Export includes records currently saved in this browser: {store.students.length} students · {store.teachers.length} teachers · {store.classes.length} classes · {store.fees.length} payments · {store.attendance.length} attendance records · {store.exams.length} exams. This is a frontend/local backup, not yet an automated server backup.</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn label="Download full backup" icon={Download} small onClick={downloadBackup}/><Btn label="Restore from file" icon={Upload} outline small onClick={()=>restoreRef.current?.click()}/><input ref={restoreRef} type="file" accept="application/json,.json" onChange={restoreBackup} style={{display:"none"}}/></div>
          {backupMsg&&<div style={{marginTop:12,fontSize:12.5,color:C.emerald}}>{backupMsg}</div>}
        </SectionCard>
        <SectionCard title="Security readiness">
          {["Use server-side authentication and authorization before production","Store API keys and payment secrets on the server, never in frontend code","Restrict the LAN service to the institute network","Enable HTTPS where feasible","Schedule backup copies to a separate disk or computer","Test restoring a backup before importing client data"].map(t=><div key={t} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",color:C.muted,fontSize:12,borderBottom:`1px solid ${C.border}`}}><ShieldCheck size={15} color={C.accent} style={{flexShrink:0,marginTop:1}}/>{t}</div>)}
        </SectionCard>
        <SectionCard title="Activity log"><div style={{padding:"14px 0",color:C.muted,fontSize:13}}>No audit events are recorded by this frontend yet. Login, edits, imports and exports need to be logged by the server for a production audit trail.</div></SectionCard>
      </Modal>;
      case "language": return <Modal title="Language Settings" onClose={()=>setSection(null)}>
        <div style={{marginBottom:20,color:C.muted,fontSize:13}}>Choose a preferred interface language. The setting is saved; full translation of every page is a separate implementation step.</div>
        {[{native:"English",english:"English"},{native:"සිංහල",english:"Sinhala"},{native:"தமிழ்",english:"Tamil"}].map(l=><button key={l.english} onClick={()=>setSettings(v=>({...v,language:l.english}))} style={{width:"100%",textAlign:"left",background:settings.language===l.english?`${alphaColor(C.accent, 7)}`:C.bg,border:`1.5px solid ${settings.language===l.english?C.accent:C.border}`,borderRadius:10,padding:18,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",color:C.text}}><div><div style={{fontWeight:700,fontSize:18}}>{l.native}</div><div style={{color:C.muted,fontSize:12,marginTop:3}}>{l.english}</div></div>{settings.language===l.english&&<CheckCircle2 color={C.emerald}/>}</button>)}
      </Modal>;
      case "upgrade": return <Modal title="System Upgrade & Maintenance" onClose={()=>setSection(null)}>
        <div style={{background:C.bg,borderRadius:10,padding:18,marginBottom:16}}><div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:6}}>Current frontend build</div><div style={{color:C.muted,fontSize:12,lineHeight:1.6}}>Build metadata and signed release verification will be supplied by the installer/update service. No upgrade is available from this frontend yet.</div></div>
        <div onClick={()=>upgradeRef.current?.click()} style={{border:`1px dashed ${C.borderStrong}`,borderRadius:10,padding:22,textAlign:"center",cursor:"pointer",marginBottom:12}}><RefreshCw size={25} color={C.accent} style={{marginBottom:8}}/><div style={{color:C.text,fontWeight:600,fontSize:13}}>Select an update package</div><div style={{color:C.muted,fontSize:11,marginTop:4}}>UI placeholder only — package verification and database-safe upgrade are not connected</div></div><input ref={upgradeRef} type="file" accept=".zip,.edupeak,.exe" onChange={e=>setUpgradeMsg(e.target.files?.[0]?`${e.target.files[0].name} selected. It has not been installed.`:"")} style={{display:"none"}}/>{upgradeMsg&&<div style={{color:C.amber,fontSize:12,marginBottom:12}}>{upgradeMsg}</div>}
      </Modal>;
      default:return null;
    }
  };
  return <div>
    <div style={{marginBottom:24}}><h2 style={{color:C.text,fontSize:22,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Advanced Settings</h2><p style={{color:C.muted,fontSize:13,margin:"4px 0 0"}}>Settings shown for your signed-in role: {role}. Higher-privilege actions are visible only to authorized roles.</p></div>
    <div className="grid-2" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:20}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
        <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:18}}>Institute Profile</div>
        <Field label="Institute Name" placeholder="Institute name" value={profileDraft.name||""} onChange={updateProfile("name")}/>
        <Field label="Registration Number" placeholder="Official registration number" value={profileDraft.registrationNumber||""} onChange={updateProfile("registrationNumber")}/>
        <Field label="Address" placeholder="Institute address" value={profileDraft.address||""} onChange={updateProfile("address")}/>
        <Field label="Contact Number" placeholder="Contact number" type="tel" value={profileDraft.phone||""} onChange={updateProfile("phone")}/>
        <Field  label="Email"  placeholder="Email address"  type="email"  value={profileDraft.email || ""} onChange={updateProfile("email")}/>
        <Btn label="Save institute profile" icon={Save} onClick={()=>{setSettings(v=>({...v,institute:profileDraft}));setProfileMsg("Institute profile saved locally.");}}/>
        {profileMsg&&<div style={{color:C.emerald,fontSize:12,marginTop:10}}>{profileMsg}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>{visibleSections.map(sec=><button key={sec.id} onClick={()=>setSection(sec.id)} style={{width:"100%",textAlign:"left",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all .2s",color:C.text}} onMouseEnter={e=>{e.currentTarget.style.borderColor=sec.color;e.currentTarget.style.background=`${alphaColor(sec.color, 4)}`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}><span style={{color:sec.color,display:"flex"}}><AppIcon icon={sec.icon} size={22}/></span><span style={{flex:1}}><span style={{display:"block",fontWeight:600,fontSize:14}}>{sec.title}</span><span style={{display:"block",color:C.muted,fontSize:12,marginTop:3}}>{sec.desc}</span></span><ChevronRight size={16} color={C.muted}/></button>)}</div>
    </div>
    {renderSection()}
  </div>;
};


/* ─── NAV ─────────────────────────────────────────────────── */
const NAV=[
  {id:"dashboard", label:"Dashboard",  icon:LayoutDashboard},
  {id:"students",  label:"Students",   icon:GraduationCap},
  {id:"teachers",  label:"Teachers",   icon:UsersRound},
  {id:"classes",   label:"Classes",    icon:BookOpen},
  {id:"attendance",label:"Attendance", icon:ClipboardCheck},
  {id:"fees",      label:"Fees",       icon:WalletCards},
  {id:"exams",     label:"Exams",      icon:FileText},
  {id:"analytics", label:"Analytics",  icon:ChartNoAxesCombined},
  {id:"import",    label:"Data Import & Capture", icon:ScanLine, permission:"Data Import & Capture"},
  {id:"settings",  label:"Advanced Settings", icon:Settings},
];

/* ─── Root App ⑧ search nav ───────────────────────────────── */
export default function App() {
  const _saved = useRef(loadStore()).current;
  const cloudScopeRef = useRef(null);
  const [cloudSyncError,setCloudSyncError] = useState("");
  const [students,setStudents,hydrateStudents] = useCloudCollection(_saved?.students??INIT_STUDENTS,"students",cloudScopeRef,setCloudSyncError);
  const [teachers,setTeachers,hydrateTeachers] = useCloudCollection(_saved?.teachers??INIT_TEACHERS,"teachers",cloudScopeRef,setCloudSyncError);
  const [classes,setClasses,hydrateClasses] = useCloudCollection(_saved?.classes??INIT_CLASSES,"classes",cloudScopeRef,setCloudSyncError);
  const [fees,setFees,hydrateFees] = useCloudCollection(_saved?.fees??INIT_FEES,"fees",cloudScopeRef,setCloudSyncError);
  const [attendance,setAttendance,hydrateAttendance] = useCloudCollection(_saved?.attendance??[],"attendance",cloudScopeRef,setCloudSyncError);
  const [exams,setExams,hydrateExams] = useCloudCollection(_saved?.exams??INIT_EXAMS,"exams",cloudScopeRef,setCloudSyncError);
  useEffect(()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify({students,teachers,classes,fees,attendance,exams}));}catch{}},[students,teachers,classes,fees,attendance,exams]);
  const [page,setPage]         = useState("dashboard");
  const [theme,setTheme] = useState(() => {
    try {
      return localStorage.getItem("edupeak.theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem("edupeak.theme", theme); } catch {}
  }, [theme]);
  const [notifOpen,setNotifOpen] = useState(false);
  const [profileMenuOpen,setProfileMenuOpen] = useState(false);
  const [headerSearchOpen,setHeaderSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const navItemsRef = useRef(null);
  const navItemRefs = useRef({});
  const [navPillMetrics,setNavPillMetrics] = useState({left:0,width:0,ready:false});
  const [searchQ,setSearchQ]   = useState("");
  const [searchResults,setSearchResults] = useState([]);
  const [showSearch,setShowSearch] = useState(false);
  const [openStudentId,setOpenStudentId] = useState(null);
  const [openTeacherId,setOpenTeacherId] = useState(null);
  const [authenticated,setAuthenticated] = useState(false);
  const [currentUser,setCurrentUser] = useState(null);
  const [loginError,setLoginError] = useState("");
  const [loginBusy,setLoginBusy] = useState(false);
  const [authLoading,setAuthLoading] = useState(isSupabaseConfigured);
  const [cloudSettings,setCloudSettings] = useState(null);
  const [accessRevision,setAccessRevision] = useState(0);

  const hydrateWorkspace = async (authUser) => {
    if (!authUser?.id) throw new Error("The authenticated Supabase user is missing an ID.");
    const membership = await loadMembership(authUser.id);
    const [workspace, profile, remoteSettings] = await Promise.all([
      loadInstituteStore(membership.institute_id, membership.role),
      loadUserProfile(authUser.id),
      loadInstituteSettings(membership.institute_id),
    ]);
    rememberInstituteSnapshots(membership.institute_id, workspace);
    cloudScopeRef.current = { instituteId: membership.institute_id, userId: authUser.id };
    hydrateStudents(workspace.students || []);
    hydrateTeachers(workspace.teachers || []);
    hydrateClasses(workspace.classes || []);
    hydrateFees(workspace.fees || []);
    hydrateAttendance(workspace.attendance || []);
    hydrateExams(workspace.exams || []);
    setCloudSettings(remoteSettings || {
      institute: { name: "", registrationNumber: "", address: "", phone: "", email: "" },
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      smsTemplates: DEFAULT_SMS_TEMPLATES,
      branches: [],
      language: "English",
    });
    setCloudSyncError("");
    setCurrentUser({
      id: authUser.id,
      email: authUser.email || profile?.email || "",
      username: profile?.username || authUser.email || "user",
      fullName: profile?.full_name || "",
      role: uiRole(membership.role),
      roleKey: membership.role,
      instituteId: membership.institute_id,
    });
    setAuthenticated(true);
  };

  const resetWorkspace = () => {
    cloudScopeRef.current = null;
    setAuthenticated(false);
    setCurrentUser(null);
    setCloudSettings(null);
    setStudents([]); setTeachers([]); setClasses([]); setFees([]); setAttendance([]); setExams([]);
    setCloudSyncError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    if (!isSupabaseConfigured || !supabase) {
      setLoginError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env.local file, then restart EduPeak.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("login") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    if (!email || !password) {
      setLoginError("Enter your email address and password.");
      return;
    }
    setLoginBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Supabase did not return an authenticated user.");
      await hydrateWorkspace(data.user);
      setLoginError("");
    } catch (error) {
      cloudScopeRef.current = null;
      await supabase.auth.signOut().catch(() => undefined);
      setLoginError(error?.message || "Sign in failed. Check your credentials and institute access.");
    } finally {
      setLoginBusy(false);
    }
  };
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }
    let active = true;
    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active && data.session?.user) await hydrateWorkspace(data.session.user);
      } catch (error) {
        if (active) setLoginError(error?.message || "Could not restore your secure session.");
        await supabase.auth.signOut().catch(() => undefined);
      } finally {
        if (active) setAuthLoading(false);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") resetWorkspace();
    });
    restoreSession();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const [readNotificationIds,setReadNotificationIds] = useState(()=>{try{return JSON.parse(localStorage.getItem("edupeak.notifications.read.v1")||"[]");}catch{return []}});
  const [smsTarget,setSmsTarget] = useState(null);
  const [smsMessage,setSmsMessage] = useState("");
  const [smsActionStatus,setSmsActionStatus] = useState("");
  const store = {
    students,setStudents,teachers,setTeachers,classes,setClasses,fees,setFees,attendance,setAttendance,exams,setExams,
    instituteId: currentUser?.instituteId || null,
    initialSettings: cloudSettings,
    setInitialSettings: setCloudSettings,
    onSyncError: setCloudSyncError,
  };
  useEffect(()=>{try{localStorage.setItem("edupeak.notifications.read.v1",JSON.stringify(readNotificationIds));}catch{}},[readNotificationIds]);
  useEffect(()=>{
    if(!profileMenuOpen)return;
    profileMenuRef.current?.querySelector('[role="menuitem"]')?.focus({preventScroll:true});
    const closeOutside=(event)=>{
      if(profileMenuRef.current&&!profileMenuRef.current.contains(event.target))setProfileMenuOpen(false);
    };
    const closeOnEscape=(event)=>{
      if(event.key==="Escape"){
        setProfileMenuOpen(false);
        profileTriggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown",closeOutside);
    document.addEventListener("keydown",closeOnEscape);
    return()=>{
      document.removeEventListener("pointerdown",closeOutside);
      document.removeEventListener("keydown",closeOnEscape);
    };
  },[profileMenuOpen]);
  useEffect(()=>{
    if(headerSearchOpen) searchInputRef.current?.focus();
  },[headerSearchOpen]);
  useEffect(()=>{
    if(!headerSearchOpen) return;
    const closeOutside=(event)=>{
      if(!searchContainerRef.current?.contains(event.target)){
        setHeaderSearchOpen(false);
        setShowSearch(false);
      }
    };
    const closeOnEscape=(event)=>{
      if(event.key==="Escape"){
        setHeaderSearchOpen(false);
        setShowSearch(false);
        setSearchQ("");
        setSearchResults([]);
      }
    };
    document.addEventListener("pointerdown",closeOutside);
    document.addEventListener("keydown",closeOnEscape);
    return()=>{
      document.removeEventListener("pointerdown",closeOutside);
      document.removeEventListener("keydown",closeOnEscape);
    };
  },[headerSearchOpen]);
  useEffect(()=>{const h=()=>setAccessRevision(v=>v+1);window.addEventListener("edupeak-settings-updated",h);return()=>window.removeEventListener("edupeak-settings-updated",h);},[]);
  const permissionConfig = cloudSettings?.rolePermissions
    ? {...DEFAULT_ROLE_PERMISSIONS,...cloudSettings.rolePermissions}
    : (loadAdvancedSettings().rolePermissions || DEFAULT_ROLE_PERMISSIONS);
  const allowedModules = currentUser?(permissionConfig[currentUser.role]||DEFAULT_ROLE_PERMISSIONS[currentUser.role]||[]):ROLE_MODULES;
  const visibleNav = NAV.filter(n=>n.id==="settings"||!currentUser||allowedModules.includes(n.permission||(n.id==="classes"?"Classes & Timetable":n.label)));
  const navSignature = visibleNav.map(n=>n.id).join("|");
  const currentPagePermission = page==="classes"?"Classes & Timetable":(NAV.find(n=>n.id===page)?.permission||NAV.find(n=>n.id===page)?.label);
  useEffect(()=>{
    const updatePill = () => {
      const activeItem = navItemRefs.current[page];
      if (activeItem && navItemsRef.current) {
        setNavPillMetrics({left:activeItem.offsetLeft,width:activeItem.offsetWidth,ready:true});
      } else {
        setNavPillMetrics(v=>({...v,ready:false}));
      }
    };
    updatePill();
    window.addEventListener("resize",updatePill);
    return ()=>window.removeEventListener("resize",updatePill);
  },[page,navSignature]);
  const pageAllowed = page==="settings"||!currentUser||!currentPagePermission||allowedModules.includes(currentPagePermission);
  const notificationToday = isoDate();
  const notificationMonth = new Date().toLocaleDateString("en-LK",{month:"long",year:"numeric"});
  const paymentNotifications = students.filter(st=>{
    const dueAmount=studentMonthlyFee(st,classes);
    if(dueAmount<=0) return false;
    if(st.dueDate&&st.dueDate>notificationToday) return false;
    const studentPayments=fees.filter(f=>(f.studentId?String(f.studentId)===String(st.id):f.student===st.name)&&f.month===notificationMonth&&String(f.status||"").toLowerCase()==="paid");
    const paidThisMonth=studentPayments.reduce((sum,f)=>sum+(Number(f.amount)||0),0);
    return paidThisMonth<dueAmount;
  }).map(st=>({id:`fee:${st.id}:${notificationMonth}`,studentId:st.id,student:st,icon:TriangleAlert,kind:st.dueDate&&st.dueDate<notificationToday?"overdue":"pending",msg:st.dueDate&&st.dueDate<notificationToday?`Payment overdue for ${st.name}`:`Fee payment pending for ${st.name}`,detail:st.dueDate?`Due date: ${st.dueDate}`:`No complete payment recorded for ${notificationMonth}`,time:st.dueDate||notificationMonth}));
  const unreadNotifications=paymentNotifications.filter(n=>!readNotificationIds.includes(n.id));
  const openNotification=n=>{setReadNotificationIds(prev=>prev.includes(n.id)?prev:[...prev,n.id]);setNotifOpen(false);if(n.studentId){setPage("students");setOpenStudentId(n.studentId);}};
  const prepareSms=(st,notificationId)=>{
    if(notificationId)setReadNotificationIds(prev=>prev.includes(notificationId)?prev:[...prev,notificationId]);
    setNotifOpen(false);
    const templ=cloudSettings?.smsTemplates?.fee||loadAdvancedSettings().smsTemplates?.fee||DEFAULT_SMS_TEMPLATES.fee;
    const month=notificationMonth;
    const message=templ.replace(/\{student\}/g,st.name||"").replace(/\{amount\}/g,String(studentMonthlyFee(st,classes))).replace(/\{month\}/g,month).replace(/\{branch\}/g,st.branch||"");
    setSmsTarget(st);setSmsMessage(message);setSmsActionStatus("");
  };
  const launchSms=()=>{
    if(!smsTarget?.phone){setSmsActionStatus("This student has no contact number. Add a phone number to the student profile first.");return;}
    window.location.href=`sms:${String(smsTarget.phone).replace(/[^+0-9]/g,"")}?body=${encodeURIComponent(smsMessage)}`;
    setSmsActionStatus("SMS draft passed to the device's configured messaging app. EduPeak has not sent the message through a gateway.");
  };
  useEffect(()=>{
    const onOpen=(e)=>{const id=e.detail?.id;if(!id)return;setPage("students");setTimeout(()=>setOpenStudentId(id),100);};
    window.addEventListener("edupeak-open-student",onOpen);
    return ()=>window.removeEventListener("edupeak-open-student",onOpen);
  },[]);

  // ⑧ Global search across students + teachers
  useEffect(()=>{
    if(searchQ.trim().length<2){setSearchResults([]);return;}
    const q=searchQ.toLowerCase();
    const studs=students.filter(s=>s.name.toLowerCase().includes(q)||s.id.toLowerCase().includes(q)).map(s=>({type:"student",id:s.id,name:s.name,sub:s.grade+" · "+s.branch,avatar:s.avatar}));
    const tchs=teachers.filter(t=>String(t.name||"").toLowerCase().includes(q)||String(t.subject||"").toLowerCase().includes(q)).map(t=>({type:"teacher",id:t.id,name:t.name,sub:(t.subject||"Teacher")+" · "+(t.branch||"No branch"),avatar:t.avatar}));
    setSearchResults([...studs,...tchs].slice(0,8));
  },[searchQ,students,teachers]);

  const handleSearchSelect=(result)=>{
    setSearchQ("");setSearchResults([]);setShowSearch(false);setHeaderSearchOpen(false);
    if(result.type==="student"){
      setPage("students");
      setTimeout(()=>setOpenStudentId(result.id),100);
    } else {
      setPage("teachers");
      setTimeout(()=>setOpenTeacherId(result.id),100);
    }
  };

  const pages={
    dashboard:  <DashboardPage setPage={setPage}/>,
    students:   <StudentsPage openStudentId={openStudentId} clearOpen={()=>setOpenStudentId(null)}/>,
    teachers:   <TeachersPage openTeacherId={openTeacherId} clearOpen={()=>setOpenTeacherId(null)}/>,
    classes:    <ClassesPage/>,
    attendance: <AttendancePage/>,
    fees:       <FeesPage/>,
    exams:      <ExamsPage/>,
    analytics:  <AnalyticsPage/>,
    import:     <DataImportPage/>,
    settings:   <SettingsPage currentUser={currentUser} initialSettings={cloudSettings}/>,
  };

  if (!authenticated) {
return (
  <div className="ep-login-page">
    

    <div className="ep-login-layout">
      {/* LEFT: LOGIN FORM */}
      <section className="ep-login-left">
        <div className="ep-login-brand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
            <path d="M22 10v6" />
            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
          </svg>

          EduPeak<span className="ep-login-brand-dot">.</span>
        </div>

        <div className="ep-login-content">
          <h1 className="ep-login-title">Welcome back</h1>

          <p className="ep-login-subtitle">
            Sign in with your credentials to access the institute
            management system.
          </p>

          <form method="post" onSubmit={handleLogin}>
            {authLoading && <div className="ep-login-error" role="status">Checking your secure Supabase session…</div>}
            {loginError && (
              <div className="ep-login-error" role="alert">
                {loginError}
              </div>
            )}

            {/* USERNAME */}
            <div className="ep-login-input-block">
              <label
                className="ep-login-label"
                htmlFor="edupeak-login"
              >
                Email address
              </label>

              <div className="ep-login-input-wrap">
                <span
                  className="ep-login-input-icon"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </span>

                <input
                  id="edupeak-login"
                  required
                  className="ep-login-control"
                  name="login"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="ep-login-input-block">
              <label
                className="ep-login-label"
                htmlFor="edupeak-password"
              >
                Password
              </label>

              <div className="ep-login-input-wrap">
                <span
                  className="ep-login-input-icon"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                </span>

                <input
                  id="edupeak-password"
                  required
                  className="ep-login-control"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </div>
            </div>

               <button class="ep-login-submit" type="submit" name="action_login" disabled={loginBusy || authLoading}>{loginBusy ? "Signing in…" : "Log In"}
                 <svg class="ep-login-submit__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                 <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                 <path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>
              </button>
            
          </form>
        </div>

        <div className="ep-login-footer-note">
          Authorized access only · EduPeak Institute Management
          <br />
          Secure sign-in powered by IMS Architecture.
        </div>
      </section>

      {/* RIGHT: FEATURE SHOWCASE */}
      <aside className="ep-login-right">
        <div>
          <div className="ep-login-showcase-tag">
            Institute Management, Reimagined
          </div>

          <h2 className="ep-login-showcase-title">
            Every detail.
            <br />
            <span>One platform.</span>
          </h2>

          <p className="ep-login-showcase-desc">
            Manage students, classes, attendance, fees and performance
            from one clear workspace.
          </p>

          <div className="ep-login-features">
            <div className="ep-login-feature">
              <div className="ep-login-feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>

              <div className="ep-login-feature-title">
                Student records
              </div>
              <div className="ep-login-feature-subtitle">
                Profiles and enrollment
              </div>
            </div>

            <div className="ep-login-feature">
              <div className="ep-login-feature-icon">
                <svg viewBox="0 0 24 24">
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    ry="2"
                  />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <div className="ep-login-feature-title">
                Attendance
              </div>
              <div className="ep-login-feature-subtitle">
                Daily tracking
              </div>
            </div>

            <div className="ep-login-feature">
              <div className="ep-login-feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>

              <div className="ep-login-feature-title">
                Fee management
              </div>
              <div className="ep-login-feature-subtitle">
                Payments and receipts
              </div>
            </div>

            <div className="ep-login-feature">
              <div className="ep-login-feature-icon">
                <svg viewBox="0 0 24 24">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>

              <div className="ep-login-feature-title">
                Performance
              </div>
              <div className="ep-login-feature-subtitle">
                Reports and insights
              </div>
            </div>
          </div>
        </div>

        <div className="ep-login-showcase-footer">
          IMS Architecture · IMS v1 PRO EDITION
        </div>
      </aside>
    </div>
  </div>
);


  }

  return (
    <StoreCtx.Provider value={store}>
    <div className="app-shell" data-theme={theme}>

      {/* Horizontal navigation */}
      <header className="app-sidebar ep-horizontal-nav-shell">
        <div className="ep-horizontal-nav-brand">
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"inset 0 1px 0 rgba(255,255,255,.22),0 4px 12px rgba(0,0,0,.18)"}}>
            <GraduationCap size={20} color={C.ink}/>
          </div>
          <div>
            <div style={{color:C.text,fontWeight:750,fontSize:15,lineHeight:1,letterSpacing:"-0.02em"}}>EduPeak</div>
            <div style={{color:C.muted,fontSize:10.5,marginTop:4}}>Institute Management</div>
          </div>
        </div>

        <div className="ep-horizontal-nav-scroll" aria-label="Navigation menu">
          <nav className="ep-sidebar-nav" aria-label="Main navigation">
            <div className="ep-sidebar-nav-items" ref={navItemsRef}>
              <span
                className="ep-sidebar-nav-pill"
                aria-hidden="true"
                style={{
                  width:navPillMetrics.width,
                  transform:`translateX(${navPillMetrics.left}px)`,
                  opacity:navPillMetrics.ready?1:0,
                }}
              />
              {visibleNav.map(n=>{
                const active=page===n.id;
                return (
                  <button
                    ref={el=>{navItemRefs.current[n.id]=el;}}
                    className={`nav-item ep-sidebar-nav-item${active?" is-active":""}`}
                    key={n.id}
                    onClick={()=>setPage(n.id)}
                    aria-current={active?"page":undefined}
                    aria-label={n.label}
                    title={n.label}
                    style={{
                      display:"inline-flex",
                      alignItems:"center",
                      justifyContent:"center",
                      gap:8,
                      height:44,
                      minHeight:44,
                      flex:"0 0 auto",
                      padding:"0 15px",
                      margin:0,
                      background:"transparent",
                      border:"1px solid transparent",
                      borderRadius:999,
                      color:active?C.text:C.muted,
                      cursor:"pointer",
                      fontSize:12.5,
                      fontWeight:active?700:550,
                      textAlign:"center",
                      whiteSpace:"nowrap",
                      position:"relative",
                      zIndex:1,
                    }}
                  >
                    <span style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",width:18}}>
                      <AppIcon icon={n.icon} size={17}/>
                    </span>
                    <span>{n.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="ep-horizontal-nav-account">
          <div className="ep-header-search" ref={searchContainerRef}>
            <button
              type="button"
              className="ep-header-search-trigger"
              aria-label={headerSearchOpen ? "Close search" : "Open search"}
              aria-expanded={headerSearchOpen}
              title={headerSearchOpen ? "Close search" : "Search students and teachers"}
              onClick={()=>{
                if(headerSearchOpen){setHeaderSearchOpen(false);setShowSearch(false);}
                else {setHeaderSearchOpen(true);setShowSearch(true);}
              }}
            >
              <Search size={18} strokeWidth={2} aria-hidden="true"/>
            </button>
            {headerSearchOpen&&(
              <div className="ep-header-search-expanded">
                <Search size={17} aria-hidden="true"/>
                <input
                  ref={searchInputRef}
                  value={searchQ}
                  onChange={e=>{setSearchQ(e.target.value);setShowSearch(true);}}
                  onFocus={()=>setShowSearch(true)}
                  onKeyDown={event=>{
                    if(event.key==="Enter"&&searchResults.length>0) handleSearchSelect(searchResults[0]);
                    if(event.key==="Escape"){setHeaderSearchOpen(false);setShowSearch(false);setSearchQ("");setSearchResults([]);}
                  }}
                  placeholder="Search students or teachers…"
                  aria-label="Search students or teachers"
                />
                {searchQ&&<button type="button" className="ep-header-search-clear" onClick={()=>{setSearchQ("");setSearchResults([]);searchInputRef.current?.focus();}} aria-label="Clear search"><X size={14}/></button>}
                <button type="button" className="ep-header-search-close" onClick={()=>{setHeaderSearchOpen(false);setShowSearch(false);setSearchQ("");setSearchResults([]);}} aria-label="Close search"><X size={15}/></button>
                {showSearch&&searchResults.length>0&&(
                  <div className="ep-global-search-results">
                    {searchResults.map(r=>(
                      <button type="button" key={r.id} onMouseDown={event=>event.preventDefault()} onClick={()=>handleSearchSelect(r)} className="ep-global-search-result">
                        <Avatar initials={r.avatar} size={34} color={r.type==="student"?C.accent2:C.accent}/>
                        <span className="ep-global-search-result-copy">
                          <strong>{r.name}</strong>
                          <small>{r.sub}</small>
                        </span>
                        <Badge label={r.type==="student"?"Student":"Teacher"} color={r.type==="student"?C.accent2:C.accent}/>
                      </button>
                    ))}
                  </div>
                )}
                {showSearch&&searchQ.length>=2&&searchResults.length===0&&(
                  <div className="ep-global-search-empty">No results for “{searchQ}”</div>
                )}
              </div>
            )}
          </div>
          <div className={`ep-profile-dropdown${profileMenuOpen?" is-open":""}`} ref={profileMenuRef}>
            <button
              ref={profileTriggerRef}
              type="button"
              className="ep-profile-trigger"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              aria-label={`Account menu for ${currentUser?.role||"User"}`}
              onClick={()=>setProfileMenuOpen(value=>!value)}
              onKeyDown={event=>{
                if(event.key==="ArrowDown"){
                  event.preventDefault();
                  setProfileMenuOpen(true);
                }
              }}
            >
              <span className="ep-profile-avatar" aria-hidden="true">
                {String(currentUser?.role||"User").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
              </span>
              <span className="ep-profile-trigger-copy">
                <strong>{currentUser?.role||"User"}</strong>
                <small>{currentUser?.username||""}</small>
              </span>
              {unreadNotifications.length>0&&<span className="ep-profile-unread-dot" aria-label={`${unreadNotifications.length} unread notifications`}>{unreadNotifications.length>9?"9+":unreadNotifications.length}</span>}
              <ChevronDown className="ep-profile-chevron" size={15} aria-hidden="true"/>
            </button>

            <div
              className="ep-profile-menu"
              role="menu"
              aria-label="User profile menu"
              aria-hidden={!profileMenuOpen}
              onKeyDown={event=>{
                const items=Array.from(event.currentTarget.querySelectorAll('[role="menuitem"]'));
                const index=items.indexOf(document.activeElement);
                if(event.key==="ArrowDown"||event.key==="ArrowUp"){
                  event.preventDefault();
                  const next=event.key==="ArrowDown"?(index+1)%items.length:(index-1+items.length)%items.length;
                  items[next]?.focus();
                } else if(event.key==="Home"){
                  event.preventDefault();items[0]?.focus();
                } else if(event.key==="End"){
                  event.preventDefault();items[items.length-1]?.focus();
                }
              }}
            >
              <div className="ep-profile-menu-head">
                <span className="ep-profile-avatar ep-profile-avatar-lg" aria-hidden="true">
                  {String(currentUser?.role||"User").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
                </span>
                <span className="ep-profile-menu-identity">
                  <strong>{currentUser?.role||"User"}</strong>
                  <small>{currentUser?.username||""}</small>
                </span>
              </div>
              <div className="cs-05__sep_01" aria-hidden="true"/>
              <button
                type="button"
                role="menuitem"
                className="ep-profile-menu-item"
                onClick={()=>{setProfileMenuOpen(false);setNotifOpen(true);}}
              >
                <Bell size={17} aria-hidden="true"/>
                <span>Notifications</span>
                {unreadNotifications.length>0&&<span className="ep-profile-menu-count">{unreadNotifications.length>99?"99+":unreadNotifications.length}</span>}
              </button>
              <div className="cs-05__sep_02" aria-hidden="true"/>
              <button
                type="button"
                role="menuitem"
                className="ep-profile-menu-item is-danger"
                onClick={()=>{
                  setProfileMenuOpen(false);
                  setPage("dashboard");
                  if (supabase) supabase.auth.signOut().catch((error) => setLoginError(error?.message || "Sign out failed."));
                  else resetWorkspace();
                }}
              >
                <LogOut size={17} aria-hidden="true"/>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="app-content-shell">
        {cloudSyncError && <div role="alert" className="ep-cloud-sync-error">Database sync issue: {cloudSyncError}. Your current screen remains available; resolve the connection before continuing with critical records.</div>}
        {/* Page content */}
        <main key={page} className="page-enter app-main">
          {pageAllowed?pages[page]:<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:28,textAlign:"center",maxWidth:650,margin:"40px auto"}}><LockKeyhole size={30} color={C.amber} style={{margin:"0 auto 12px"}}/><h2 style={{fontSize:18,color:C.text,margin:"0 0 8px"}}>Access restricted</h2><p style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Your current role is not permitted to open this module. Contact a Super Administrator if this access is required.</p><Btn label="Return to Dashboard" onClick={()=>setPage("dashboard")}/></div>}
        </main>
      </div>

      {/* Notifications modal */}
      {notifOpen&&(
        <Modal title="Notifications" onClose={()=>setNotifOpen(false)} wide>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}><div style={{color:C.muted,fontSize:12}}>{unreadNotifications.length} unread · {paymentNotifications.length} actionable payment notice{paymentNotifications.length===1?"":"s"}</div><Btn label="Mark all as read" outline small onClick={()=>setReadNotificationIds(prev=>Array.from(new Set([...prev,...paymentNotifications.map(n=>n.id)])))}/></div>
          {paymentNotifications.length===0?<div style={{padding:28,textAlign:"center",color:C.muted,fontSize:13}}><Bell size={26} style={{margin:"0 auto 10px",opacity:.6}}/><div style={{color:C.text,fontWeight:600,marginBottom:4}}>You're all caught up</div><div>Actionable fee notices will appear when saved student records need review.</div></div>:paymentNotifications.map(n=><div key={n.id} style={{display:"flex",gap:12,padding:14,marginBottom:8,border:`1px solid ${readNotificationIds.includes(n.id)?C.border:alphaColor(C.accent, 40)}`,background:readNotificationIds.includes(n.id)?C.card:`${alphaColor(C.accent, 4)}`,borderRadius:10,alignItems:"flex-start"}}><div style={{color:n.kind==="overdue"?C.rose:C.amber,display:"flex",flexShrink:0,paddingTop:2}}><AppIcon icon={n.icon} size={20}/></div><div role="button" tabIndex={0} onClick={()=>openNotification(n)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")openNotification(n);}} style={{flex:1,cursor:"pointer",minWidth:0}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><div style={{color:C.text,fontSize:14,fontWeight:600}}>{n.msg}</div>{!readNotificationIds.includes(n.id)&&<Badge label="Unread" color={C.accent}/>}</div><div style={{color:C.muted,fontSize:12,marginTop:4}}>{n.detail}</div><div style={{color:C.muted,fontSize:11,marginTop:5}}>{n.student.phone||"No contact number on file"} · Click to open student profile</div></div><div style={{display:"flex",flexDirection:"column",gap:6}}><Btn label="Open profile" outline small onClick={()=>openNotification(n)}/><Btn label="Prepare SMS" small icon={MessageSquare} onClick={()=>prepareSms(n.student,n.id)}/></div></div>)}
        </Modal>
      )}
      {smsTarget&&<Modal title={`SMS Fee Reminder — ${smsTarget.name}`} onClose={()=>{setSmsTarget(null);setSmsActionStatus("");}}><div style={{color:C.muted,fontSize:12,marginBottom:12}}>To: {smsTarget.phone||"No phone number on file"}</div><textarea value={smsMessage} onChange={e=>setSmsMessage(e.target.value)} rows={5} style={{width:"100%",boxSizing:"border-box",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:12,color:C.text,fontSize:13,resize:"vertical"}}/><div style={{color:C.muted,fontSize:11,lineHeight:1.5,marginTop:8}}>Uses your saved Fee Reminder template. Opening the device's SMS app creates a draft; it does not send automatically through Dialog, Mobitel or WhatsApp.</div><div style={{display:"flex",gap:8,marginTop:16}}><Btn label="Open device SMS app" icon={MessageSquare} onClick={launchSms} disabled={!smsTarget.phone}/><Btn label="Close" outline onClick={()=>setSmsTarget(null)}/></div>{smsActionStatus&&<div style={{color:C.amber,fontSize:12,marginTop:10}}>{smsActionStatus}</div>}</Modal>}
      {/* Persistent light / dark theme switch */}
      <button
        type="button"
        className={`ep-theme-toggle${theme === "dark" ? " is-dark" : ""}`}
        role="switch"
        aria-checked={theme === "dark"}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        onClick={() => setTheme(current => {
          const next = current === "dark" ? "light" : "dark";
          document.documentElement.dataset.theme = next;
          document.documentElement.style.colorScheme = next;
          try { localStorage.setItem("edupeak.theme", next); } catch {}
          return next;
        })}
      >
        <span className="ep-theme-toggle-track" aria-hidden="true">
          <span className="ep-theme-toggle-sun"><Sun size={15} strokeWidth={2}/></span>
          <span className="ep-theme-toggle-moon"><Moon size={15} strokeWidth={2}/></span>
          <span className="ep-theme-toggle-thumb" />
        </span>
        <span className="ep-theme-toggle-text">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
      </button>
    </div>
    </StoreCtx.Provider>
  );
}
