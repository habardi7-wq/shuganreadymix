"use client";
import { useMemo, useState } from "react";

type Order={id:number;customer:string;area:string;grade:string;qty:number;status:string};
const sample:Order[]=[
{id:101,customer:"عميل تجريبي 1",area:"الرمال",grade:"C30",qty:40,status:"مؤكد"},
{id:102,customer:"عميل تجريبي 2",area:"اليرموك",grade:"C35",qty:25,status:"جديد"},
{id:103,customer:"عميل تجريبي 3",area:"المونسية",grade:"C25",qty:60,status:"تم التسليم"}];
const tabs=[["dashboard","نظرة عامة","▦"],["orders","الطلبات","▤"],["factories","المصانع","▣"],["suppliers","الموردون","◈"],["inventory","المخزون","▥"],["pricing","التسعير","◉"],["reports","التقارير","▧"],["settings","الإعدادات","⚙"]] as const;
type Page=typeof tabs[number][0];
const stock=[{name:"أسمنت",amount:"85 طن",status:"متوفر"},{name:"رمل",amount:"120 طن",status:"متوفر"},{name:"بحص",amount:"18 طن",status:"يحتاج متابعة"},{name:"إضافات",amount:"900 لتر",status:"متوفر"}];
const suppliers=[{name:"مورد الأسمنت التجريبي",type:"أسمنت",status:"مؤهل"},{name:"مورد الركام التجريبي",type:"بحص ورمل",status:"تحت المراجعة"},{name:"مورد الإضافات التجريبي",type:"كيماويات",status:"مؤهل"}];
const money=(n:number)=>new Intl.NumberFormat("ar-SA",{maximumFractionDigits:2}).format(n);
export default function DemoPage(){
const [page,setPage]=useState<Page>("dashboard");
const [orders,setOrders]=useState<Order[]>(sample);
const [draft,setDraft]=useState({customer:"",area:"",grade:"C30",qty:""});
const [message,setMessage]=useState("");
const [cost,setCost]=useState("170"),[price,setPrice]=useState("210"),[volume,setVolume]=useState("40");
const total=useMemo(()=>orders.reduce((n,o)=>n+o.qty,0),[orders]);
function addOrder(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const q=Number(draft.qty);
if(!draft.customer.trim()||!draft.area.trim()||!Number.isFinite(q)||q<=0||q>10000){setMessage("راجع بيانات الطلب والكمية");return}
setOrders(old=>[{id:Math.max(...old.map(o=>o.id),100)+1,customer:draft.customer.trim(),area:draft.area.trim(),grade:draft.grade,qty:q,status:"جديد"},...old]);
setDraft({customer:"",area:"",grade:"C30",qty:""});setMessage("تمت إضافة الطلب داخل التجربة فقط، دون حفظه في الخادم.");}
const btn="rounded-xl border border-ink-200 px-4 py-3 text-sm font-semibold";
return <main dir="rtl" className="mx-auto max-w-7xl px-3 py-6 text-ink-900 sm:px-6">
<section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950" role="note">
<strong>وضع استكشاف خرسانة برو — بدون تسجيل أو OTP</strong>
<p>جميع الأسماء والكميات والأسعار هنا افتراضية للتجربة. لا توجد طلبات حقيقية أو وصول لقاعدة البيانات. التغييرات مؤقتة وتختفي بعد تحديث الصفحة.</p>
</section>
<div className="mt-6 flex flex-col gap-5 md:flex-row">
<nav aria-label="أقسام البرنامج" className="flex shrink-0 gap-2 overflow-x-auto rounded-2xl border border-ink-100 bg-white p-3 md:w-56 md:flex-col">
{tabs.map(([id,label,icon])=><button type="button" key={id} aria-current={page===id?"page":undefined} onClick={()=>{setPage(id);setMessage("");}}
className={`min-w-max rounded-xl px-4 py-3 text-right text-sm font-bold transition ${page===id?"bg-brand-500 text-white":"text-ink-700 hover:bg-ink-50"}`}>{icon} {label}</button>)}
</nav>
<div className="min-w-0 flex-1">
<header className="mb-5 flex flex-wrap items-center justify-between gap-3">
<div><p className="text-xs text-ink-500">خرسانة برو / وضع تجريبي شامل</p><h1 className="text-2xl font-extrabold">{tabs.find(x=>x[0]===page)?.[1]}</h1></div>
<button className={btn} onClick={()=>{setPage("dashboard");setOrders(sample);setMessage("تمت إعادة البيانات الافتراضية الأصلية");}}>إعادة ضبط التجربة</button>
</header>
{message&&<p role="status" className="mb-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">{message}</p>}
{page==="dashboard"&&<div className="space-y-5">
<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["الطلبات",String(orders.length)],["إجمالي الكميات",money(total)+" م³"],["الموردون","3"],["المواد المسجلة","4"]].map(([a,b])=><article key={a} className="rounded-2xl border border-ink-100 bg-white p-4"><p className="text-sm text-ink-500">{a}</p><p className="mt-2 text-2xl font-bold">{b}</p></article>)}</div>
<div className="rounded-2xl border border-ink-100 bg-white p-5"><h2 className="font-bold">الوصول السريع</h2><div className="mt-4 flex flex-wrap gap-2">{[["orders","سجل طلب جديد"],["inventory","راجع المخزون"],["pricing","احسب السعر"],["reports","استعرض التقارير"]].map(([id,label])=><button className={btn} key={id} onClick={()=>setPage(id as Page)}>{label}</button>)}</div></div>
<div className="rounded-2xl border border-ink-100 bg-white p-5"><h2 className="font-bold">آخر الطلبات الافتراضية</h2><div className="mt-3 space-y-2">{orders.slice(0,4).map(o=><div key={o.id} className="flex flex-wrap justify-between gap-2 border-b border-ink-100 py-2 text-sm"><span>{o.customer} — {o.area}</span><span>{o.grade} · {o.qty} م³ · {o.status}</span></div>)}</div></div></div>}
{page==="orders"&&<div className="space-y-5">
<form onSubmit={addOrder} className="rounded-2xl border border-ink-100 bg-white p-5"><h2 className="mb-4 text-lg font-bold">إضافة طلب تجريبي</h2><div className="grid gap-3 sm:grid-cols-2">
<label className="grid gap-1 text-sm">اسم العميل الوهمي<input required maxLength={80} className="rounded-lg border border-ink-200 p-3" value={draft.customer} onChange={e=>setDraft({...draft,customer:e.target.value})}/></label>
<label className="grid gap-1 text-sm">الحي<input required maxLength={80} className="rounded-lg border border-ink-200 p-3" value={draft.area} onChange={e=>setDraft({...draft,area:e.target.value})}/></label>
<label className="grid gap-1 text-sm">الخلطة<select className="rounded-lg border border-ink-200 p-3" value={draft.grade} onChange={e=>setDraft({...draft,grade:e.target.value})}>{["C25","C30","C35","C40"].map(g=><option key={g}>{g}</option>)}</select></label>
<label className="grid gap-1 text-sm">الكمية م³<input required type="number" min="0.1" max="10000" step="0.1" inputMode="decimal" className="rounded-lg border border-ink-200 p-3" value={draft.qty} onChange={e=>setDraft({...draft,qty:e.target.value})}/></label></div>
<button type="submit" className="mt-4 rounded-xl bg-brand-500 px-6 py-3 font-bold text-white">إضافة الطلب</button></form>
<div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white p-4"><table className="w-full min-w-[520px] text-right text-sm"><thead><tr>{["الرقم","العميل","الحي","الخلطة","الكمية","الحالة"].map(h=><th className="border-b p-3" key={h}>{h}</th>)}</tr></thead><tbody>{orders.map(o=><tr key={o.id}><td className="border-b p-3">{o.id}</td><td className="border-b p-3">{o.customer}</td><td className="border-b p-3">{o.area}</td><td className="border-b p-3">{o.grade}</td><td className="border-b p-3">{o.qty}</td><td className="border-b p-3">{o.status}</td></tr>)}</tbody></table></div></div>}
{page==="factories"&&<div className="grid gap-4 md:grid-cols-2">{[{name:"مصنع الشرق التجريبي",area:"شرق الرياض",capacity:"120 م³/ساعة"},{name:"مصنع الرمال التجريبي",area:"الرياض",capacity:"90 م³/ساعة"}].map(f=><article key={f.name} className="rounded-2xl border border-ink-100 bg-white p-5"><h2 className="text-lg font-bold">{f.name}</h2><p className="mt-2 text-sm text-ink-600">{f.area}</p><p className="mt-2 text-sm">الطاقة الافتراضية: {f.capacity}</p><span className="mt-3 inline-block rounded-lg bg-ink-50 px-3 py-1 text-xs">بيانات توضيحية فقط</span></article>)}</div>}
{page==="suppliers"&&<div className="space-y-3">{suppliers.map(s=><article key={s.name} className="flex flex-wrap justify-between gap-2 rounded-2xl border border-ink-100 bg-white p-5"><div><h2 className="font-bold">{s.name}</h2><p className="text-sm text-ink-500">{s.type}</p></div><span className="text-sm">{s.status}</span></article>)}<p className="text-sm text-ink-500">طلبات عروض الأسعار والموردون هنا للعرض فقط؛ لا تُرسل رسائل حقيقية.</p></div>}
{page==="inventory"&&<div className="space-y-3">{stock.map(s=><article key={s.name} className="flex flex-wrap justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-5"><strong>{s.name}</strong><span>{s.amount}</span><span className="text-sm text-ink-600">{s.status}</span></article>)}<p className="text-sm text-ink-500">المخزون افتراضي وغير مرتبط بحركات شراء أو إنتاج.</p></div>}
{page==="pricing"&&<div className="rounded-2xl border border-ink-100 bg-white p-5"><h2 className="font-bold">محاكاة تسعير صبة</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["تكلفة المتر",cost,setCost],["سعر بيع المتر",price,setPrice],["الكمية م³",volume,setVolume]].map(([label,value,setter])=><label key={label as string} className="grid gap-2 text-sm">{label as string}<input type="number" min="0" step="0.1" className="rounded-lg border border-ink-200 p-3" value={value as string} onChange={e=>(setter as (s:string)=>void)(e.target.value)}/></label>)}</div>
{[cost,price,volume].every(v=>v.trim()!==""&&Number.isFinite(Number(v))&&Number(v)>=0)?<div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-ink-50 p-4">إيراد تقديري: <strong>{money(Number(price)*Number(volume))} ريال</strong></div><div className="rounded-xl bg-ink-50 p-4">هامش مساهمة تقديري: <strong>{money((Number(price)-Number(cost))*Number(volume))} ريال</strong></div></div>:<p className="mt-4 text-sm text-red-600">أدخل أرقامًا صحيحة لحساب التقدير.</p>}<p className="mt-4 text-xs text-ink-500">حساب توضيحي قبل الضريبة ولا يمثل عرض سعر معتمدًا.</p></div>}
{page==="reports"&&<div className="rounded-2xl border border-ink-100 bg-white p-5"><h2 className="font-bold">تقرير حجم الصبات الافتراضي حسب الحي</h2><div className="mt-4 space-y-4">{Array.from(new Set(orders.map(o=>o.area))).map(a=>{const q=orders.filter(o=>o.area===a).reduce((n,o)=>n+o.qty,0);return <div key={a}><div className="flex justify-between text-sm"><span>{a}</span><span>{money(q)} م³</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500" style={{width:`${total>0?q/total*100:0}%`}}/></div></div>})}</div><p className="mt-4 text-xs text-ink-500">هذه بيانات محاكاة وليست مؤشرات للسوق الحقيقي.</p></div>}
{page==="settings"&&<div className="rounded-2xl border border-ink-100 bg-white p-5"><h2 className="font-bold">إعدادات العرض التجريبي</h2><p className="mt-3 text-sm leading-7 text-ink-600">لا توجد حسابات فعلية أو مفاتيح API أو بيانات خاصة. لا يسمح هذا الوضع بالدخول إلى لوحات الإدارة أو تعديل معلومات المصنع الحقيقي.</p><button className={btn+" mt-5"} onClick={()=>{setOrders(sample);setMessage("أعدنا البيانات الافتراضية");}}>إعادة ضبط بيانات المحاكاة</button></div>}
</div></div></main>;
}
