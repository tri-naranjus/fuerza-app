import React, { useEffect, useMemo, useState } from 'react';

const KEY_V2 = 'tn-strength-log-v2';
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

// --- Catálogo (resumen; añade los que ya tenías)
const EXERCISES = [
  { value: 'PMR1P', label: 'Peso Muerto Rumano 1 pierna', category: 'Básicos 5x5', unit: 'kg', template: [5,5,5,5,5] },
  { value: 'SB5X5', label: 'Sentadilla Búlgara', category: 'Básicos 5x5', unit: 'kg', template: [5,5,5,5,5] },
  { value: 'HT', label: 'Hip Thrust', category: 'Secundarios', unit: 'kg', template: [10,10,10] },
  { value: 'STEPUP', label: 'Step-up alto', category: 'Secundarios', unit: 'kg', template: [10,10,10] },
  { value: 'PG1P', label: 'Puente Glúteo 1 pierna', category: 'Secundarios', unit: 'kg', template: [12,12,12] },
  { value: 'PALLOF', label: 'Pallof Press', category: 'Core', unit: 'kg', template: [15,15,15] },
  { value: 'DRAGPLANK', label: 'Plancha con arrastre', category: 'Core', unit: 's', template: [40,40,40] },
  { value: 'NORDIC', label: 'Nordic Curl excéntrico', category: 'Isquios', unit: 'reps', template: [8,8,8] },
  { value: 'SOLEO', label: 'Sóleo sentado', category: 'Gemelos', unit: 'reps', template: [20,20,20] },
  { value: 'CALF_EXC', label: 'Elevaciones de gemelos excéntricos', category: 'Gemelos', unit: 'reps', template: [15,15,15] },
];

type Entry = {
  id: string;
  date: string;
  week: string;
  day: 'A'|'B';
  exercise: string;
  exerciseLabel: string;
  weight: string;
  sets: string[];
  rpe?: string;
  notes?: string;
};

const findEx = (v: string) =>
  EXERCISES.find(e => e.value === v || e.label === v) ||
  { value: v, label: v, unit: '', category: 'Otros', template: [] as any[] };

const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) =>
  <input {...p} className={'w-full rounded border px-2 py-1 ' + (p.className||'')} />;

const Select = ({ options, ...props }: { options: {value:string;label:string}[]; [k:string]:any }) =>
  <select {...props} className={'w-full rounded border px-2 py-1 ' + (props.className||'')}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;

const Button = (p: any) => <button {...p} className={'rounded bg-blue-600 px-3 py-1 text-white ' + (p.className||'')} />;

// --- API client (Serverless + fallback local)
async function apiGet(params: Record<string,string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`/api/entries${qs ? `?${qs}` : ''}`);
  if (!r.ok) throw new Error('network');
  const j = await r.json();
  if (!j.ok) throw new Error('server');
  return j.data as Entry[];
}

async function apiPost(entry: Entry) {
  const r = await fetch('/api/entries', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(entry) });
  if (!r.ok) throw new Error('network');
  const j = await r.json();
  if (!j.ok) throw new Error('server');
}

async function apiDelete(id: string) {
  const r = await fetch(`/api/entries?id=${encodeURIComponent(id)}`, { method:'DELETE' });
  if (!r.ok) throw new Error('network');
  const j = await r.json();
  if (!j.ok) throw new Error('server');
}

// Hook: carga desde cloud con fallback local
function useCloudEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet();
        setEntries(data);
        setOnline(true);
      } catch {
        const raw = localStorage.getItem(KEY_V2);
        setEntries(raw ? JSON.parse(raw) : []);
        setOnline(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!online) localStorage.setItem(KEY_V2, JSON.stringify(entries));
  }, [entries, online]);

  const addOrUpdate = async (e: Entry) => {
    setEntries(prev => [e, ...prev.filter(x => x.id !== e.id)]);
    try {
      await apiPost(e);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  };

  const remove = async (id: string) => {
    setEntries(prev => prev.filter(x => x.id !== id));
    try {
      await apiDelete(id);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  };

  return { entries, setEntries, loading, online, addOrUpdate, remove };
}

// --- Progress bar
const Progress = ({ value }: { value: number }) => (
  <div className="h-2 w-full rounded bg-gray-200">
    <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

export default function StrengthLogApp() {
  const { entries, setEntries, loading, online, addOrUpdate, remove } = useCloudEntries();

  const [q, setQ] = useState('');
  const [filterWeek, setFilterWeek] = useState<'all'|'1'|'2'|'3'|'4'>('all');
  const [filterDay, setFilterDay] = useState<'all'|'A'|'B'>('all');

  const [form, setForm] = useState<Entry>({
    id: uid(),
    date: today(),
    week: '1',
    day: 'A',
    exercise: EXERCISES[0].value,
    exerciseLabel: EXERCISES[0].label,
    weight: '',
    sets: ['', '', '', '', ''],
    rpe: '',
    notes: '',
  });

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (filterWeek !== 'all' && e.week !== filterWeek) return false;
      if (filterDay  !== 'all' && e.day  !== filterDay)  return false;
      if (q && !(`${e.exerciseLabel} ${e.notes ?? ''}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [entries, q, filterWeek, filterDay]);

  const totalVolume = useMemo(() => {
    return filtered.reduce((acc, e) => {
      const reps = (e.sets||[]).filter(Boolean).map(x => Number(x)||0).reduce((a,b)=>a+b,0);
      const w = Number(e.weight)||0;
      return acc + w*reps;
    }, 0);
  }, [filtered]);

  const completionPct = (e: Entry) => {
    const ex = findEx(e.exercise);
    const expected = Math.max(1, (ex.template?.length || 5));
    const filled = (e.sets || []).filter(x => String(x||'').trim() !== '').length;
    return (filled / expected) * 100;
  };

  const byExercise = useMemo(() => {
    type Stat = { currentWeek: number; bestWeek: number; label: string };
    const map = new Map<string, Stat>();
    for (const e of entries) {
      const key = e.exercise;
      const lab = e.exerciseLabel;
      const reps = (e.sets||[]).map(x => Number(x)||0).reduce((a,b)=>a+b,0);
      const vol = (Number(e.weight)||0) * reps;
      const cur = map.get(key) || { currentWeek: 0, bestWeek: 0, label: lab };
      const isCurrentWeek = e.week === form.week;
      if (isCurrentWeek) cur.currentWeek += vol;
      cur.bestWeek = Math.max(cur.bestWeek, vol);
      map.set(key, cur);
    }
    return Array.from(map.entries()).map(([k,v]) => ({ key:k, ...v }));
  }, [entries, form.week]);

  const onLoadTemplate = () => {
    const ex = findEx(form.exercise);
    const templ = (ex.template || []).slice(0,5).map(String);
    const sets = Array(5).fill('');
    for (let i=0;i<templ.length;i++) sets[i] = templ[i];
    setForm({ ...form, exerciseLabel: ex.label, sets });
  };

  const addEntry = async () => {
    const ex = findEx(form.exercise);
    const payload: Entry = {
      id: uid(),
      date: form.date,
      week: String(form.week || '1'),
      day: form.day,
      exercise: ex.value,
      exerciseLabel: ex.label,
      weight: form.weight,
      sets: (form.sets||[]).slice(0,5),
      rpe: form.rpe,
      notes: form.notes,
    };
    await addOrUpdate(payload);
    setForm(f => ({ ...f, weight:'', sets:['','','','',''], rpe:'', notes:'' }));
  };

  const updateEntry = async (id: string, patch: Partial<Entry>) => {
    const current = entries.find(x => x.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    setEntries(prev => prev.map(x => x.id === id ? next : x));
    try {
      await addOrUpdate(next);
    } catch {}
  };

  const removeEntry = async (id: string) => {
    await remove(id);
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Cargando registros...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-3 text-sm">
        Estado datos: {online ? <span className="text-green-700">nube ✅</span> : <span className="text-amber-700">modo offline (localStorage)</span>}
      </div>

      <section className="mb-6 rounded border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Progreso por ejercicio (volumen semanal)</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {byExercise.map(s => {
            const pct = s.bestWeek > 0 ? (100 * s.currentWeek / s.bestWeek) : 0;
            return (
              <div key={s.key} className="rounded border p-3">
                <div className="mb-1 text-sm font-medium">{s.label}</div>
                <Progress value={pct} />
                <div className="mt-1 text-xs text-gray-600">
                  Semana {form.week} · Vol.: {Math.round(s.currentWeek)} / Mejor hist.: {Math.round(s.bestWeek)}
                </div>
              </div>
            );
          })}
          {byExercise.length === 0 && <div className="text-sm text-gray-500">Sin datos todavía.</div>}
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input placeholder="Buscar por ejercicio/notas" value={q} onChange={(e)=>setQ(e.target.value)} />
        <Select value={filterWeek} onChange={(e:any)=>setFilterWeek(e.target.value)} options={[
          { value:'all', label:'Todas las semanas'}, { value:'1', label:'Semana 1'}, { value:'2', label:'Semana 2'},
          { value:'3', label:'Semana 3'}, { value:'4', label:'Semana 4'},
        ]}/>
        <Select value={filterDay} onChange={(e:any)=>setFilterDay(e.target.value)} options={[
          { value:'all', label:'Todos los días'}, { value:'A', label:'Día A'}, { value:'B', label:'Día B'},
        ]}/>
        <div className="flex items-center justify-end text-sm text-gray-600">
          Volumen aprox.: <span className="ml-1 font-semibold">{totalVolume.toLocaleString()} kg·rep</span>
        </div>
      </section>

      <section className="mb-8 rounded border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Añadir registro</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <Input type="date" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} />
          <Select value={form.week} onChange={(e:any)=>setForm({...form, week: e.target.value})} options={[
            {value:'1',label:'Semana 1'},{value:'2',label:'Semana 2'},{value:'3',label:'Semana 3'},{value:'4',label:'Semana 4'}
          ]}/>
          <Select value={form.day} onChange={(e:any)=>setForm({...form, day: e.target.value})} options={[
            {value:'A',label:'Día A'},{value:'B',label:'Día B'}
          ]}/>
          <Select value={form.exercise} onChange={(e:any)=>{const ex=findEx(e.target.value); setForm({...form, exercise:ex.value, exerciseLabel:ex.label});}}
                  options={EXERCISES.map(e=>({value:e.value,label:e.label}))} className="md:col-span-2" />
          <Input placeholder="Carga / Peso (kg, s, m)" value={form.weight} onChange={(e)=>setForm({...form, weight:e.target.value})}/>
          {[0,1,2,3,4].map(i=>(
            <Input key={i} placeholder={`Reps/Seg/Metros S${i+1}`} value={form.sets[i]}
                   onChange={(e)=>{ const sets=[...form.sets]; sets[i]=e.target.value; setForm({...form, sets}); }}/>
          ))}
          <Input placeholder="RPE" value={form.rpe} onChange={(e)=>setForm({...form, rpe:e.target.value})}/>
          <Input placeholder="Notas" className="md:col-span-6" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})}/>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button onClick={onLoadTemplate} className="bg-gray-100 text-gray-800">Cargar plantilla</Button>
          <Button onClick={addEntry}>Guardar registro</Button>
        </div>
      </section>

      <section className="rounded border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Historial</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase text-gray-600">
                <th className="p-2">Fecha</th>
                <th className="p-2">Sem</th>
                <th className="p-2">Día</th>
                <th className="p-2">Ejercicio</th>
                <th className="p-2">Carga</th>
                <th className="p-2">S1</th>
                <th className="p-2">S2</th>
                <th className="p-2">S3</th>
                <th className="p-2">S4</th>
                <th className="p-2">S5</th>
                <th className="p-2">RPE</th>
                <th className="p-2">Notas</th>
                <th className="p-2">Progreso</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={14}>Sin registros.</td></tr>
              )}
              {filtered.map(e=>(
                <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-2"><Input type="date" value={e.date} onChange={(ev)=>updateEntry(e.id,{date:(ev.target as HTMLInputElement).value})}/></td>
                  <td className="p-2"><Input value={e.week} onChange={(ev)=>updateEntry(e.id,{week:(ev.target as HTMLInputElement).value})}/></td>
                  <td className="p-2">
                    <Select value={e.day} onChange={(ev:any)=>updateEntry(e.id,{day:ev.target.value})}
                      options={[{value:'A',label:'A'},{value:'B',label:'B'}]} />
                  </td>
                  <td className="p-2">
                    <Select value={e.exercise} onChange={(ev:any)=>{const ex=findEx(ev.target.value); updateEntry(e.id,{exercise:ex.value,exerciseLabel:ex.label});}}
                      options={EXERCISES.map(x=>({value:x.value,label:x.label}))}/>
                  </td>
                  <td className="p-2"><Input value={e.weight} onChange={(ev)=>updateEntry(e.id,{weight:(ev.target as HTMLInputElement).value})}/></td>
                  {Array.from({length:5}).map((_,i)=>(
                    <td key={i} className="p-2">
                      <Input value={e.sets[i]||''} onChange={(ev)=>{
                        const sets=[...(e.sets||[])]; sets[i]=(ev.target as HTMLInputElement).value;
                        updateEntry(e.id,{sets});
                      }}/>
                    </td>
                  ))}
                  <td className="p-2"><Input value={e.rpe||''} onChange={(ev)=>updateEntry(e.id,{rpe:(ev.target as HTMLInputElement).value})}/></td>
                  <td className="p-2"><Input value={e.notes||''} onChange={(ev)=>updateEntry(e.id,{notes:(ev.target as HTMLInputElement).value})}/></td>
                  <td className="p-2" style={{minWidth:140}}>
                    <Progress value={completionPct(e)} />
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <Button className="bg-gray-100 text-gray-800 mr-2" onClick={()=>navigator.clipboard.writeText(JSON.stringify(e,null,2))}>Copiar</Button>
                    <Button className="bg-red-600" onClick={()=>removeEntry(e.id)}>Borrar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
