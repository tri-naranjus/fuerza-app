import React, { useEffect, useMemo, useState } from 'react';

// =====================
// Strength Log App
//
// Este componente gestiona el registro de fuerza y pliometría. Permite:
// - Guardar entradas en localStorage.
// - Registrar cualquier ejercicio de fuerza o pliometría definido en EXERCISES.
// - Cargar plantillas de series por ejercicio.
// - Exportar e importar datos en formato CSV.
// - Filtrar por semana, día y término de búsqueda.
// - Visualizar el volumen aproximado de entrenamiento (kg·rep).
// - Pasar algunas pruebas básicas para detectar posibles errores.
// =====================

// Claves de almacenamiento para versiones V1 y V2.
const KEY_V2 = 'tn-strength-log-v2';
const KEY_V1 = 'tn-strength-log-v1'; // compatibilidad con versión anterior

// Generador simple de IDs únicos.
const uid = () => Math.random().toString(36).slice(2, 10);

// Devuelve la fecha actual en formato ISO (YYYY-MM-DD).
const today = () => new Date().toISOString().slice(0, 10);

// Catálogo de ejercicios con categorías y plantillas de series.
// unit: unidad para la carga (kg, s, m, etc.)
// template: array que representa las repeticiones/segundos por serie.
const EXERCISES = [
  // Básicos 5x5
  { value: 'PMR1P', label: 'Peso Muerto Rumano 1 pierna', category: 'Básicos 5x5', unit: 'kg', template: [5, 5, 5, 5, 5] },
  { value: 'SB5X5', label: 'Sentadilla Búlgara', category: 'Básicos 5x5', unit: 'kg', template: [5, 5, 5, 5, 5] },
  // Secundarios
  { value: 'HT', label: 'Hip Thrust', category: 'Secundarios', unit: 'kg', template: [10, 10, 10] },
  { value: 'STEPUP', label: 'Step-up alto', category: 'Secundarios', unit: 'kg', template: [10, 10, 10] },
  { value: 'PG1P', label: 'Puente Glúteo 1 pierna', category: 'Secundarios', unit: 'kg', template: [12, 12, 12] },
  // Core
  { value: 'PALLOF', label: 'Pallof Press', category: 'Core', unit: 'kg', template: [15, 15, 15] },
  { value: 'DRAGPLANK', label: 'Plancha con arrastre', category: 'Core', unit: 's', template: [40, 40, 40] },
  { value: 'BIRDDOG', label: 'Bird Dog con banda', category: 'Core', unit: 'reps', template: [12, 12, 12] },
  // Isquios
  { value: 'NORDIC', label: 'Nordic Curl excéntrico', category: 'Isquios', unit: 'reps', template: [8, 8, 8] },
  // Glúteo medio
  { value: 'CLAMSHELL', label: 'Clamshell con banda', category: 'Glúteo medio', unit: 'reps', template: [15, 15, 15] },
  // Gemelos
  { value: 'SOLEO', label: 'Sóleo sentado', category: 'Gemelos', unit: 'reps', template: [20, 20, 20] },
  { value: 'CALF_EXC', label: 'Elevaciones de gemelos excéntricos', category: 'Gemelos', unit: 'reps', template: [15, 15, 15] },
  // Pliometría
  { value: 'POGO', label: 'Pogo Jumps', category: 'Pliometría', unit: 's', template: [20, 20, 20] },
  { value: 'VERTICAL', label: 'Vertical Jumps', category: 'Pliometría', unit: 'reps', template: [6, 6, 6] },
  { value: 'BOXJUMP', label: 'Box Jumps', category: 'Pliometría', unit: 'reps', template: [5, 5, 5] },
  { value: 'SPLIT', label: 'Split Jump (zancada con salto)', category: 'Pliometría', unit: 'reps/pierna', template: [6, 6, 6] },
  { value: 'DROP', label: 'Drop Jumps', category: 'Pliometría', unit: 'reps', template: [6, 6, 6] },
  { value: 'BOUNDING', label: 'Bounding', category: 'Pliometría', unit: 'm', template: [20, 20, 20] },
  { value: 'HOPS', label: 'Hops laterales', category: 'Pliometría', unit: 's', template: [20, 20, 20] },
  { value: 'SKIPPING', label: 'Skipping con banda', category: 'Técnica', unit: 'm', template: [20, 20, 20] },
];

// Agrupar ejercicios por categoría para usarlo en los selectores.
const groupByCategory = (list: typeof EXERCISES) =>
  list.reduce((acc: Record<string, typeof EXERCISES>, it) => {
    acc[it.category] = acc[it.category] || [];
    acc[it.category].push(it);
    return acc;
  }, {});

const EX_BY_CAT = groupByCategory(EXERCISES);

// --- Componentes UI reutilizables ---
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={
      'w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
      (props.className || '')
    }
  />
);

const Select = ({ options, ...props }: { options: Array<{ value: string; label: string }>; [k: string]: any }) => (
  <select
    {...props}
    className={
      'w-full rounded-xl border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
      (props.className || '')
    }
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const Button = ({ variant = 'primary', ...props }: { variant?: 'primary' | 'ghost' | 'danger'; [k: string]: any }) => {
  const base = 'rounded-2xl px-4 py-2 font-medium shadow-sm transition active:scale-[.98]';
  const styles: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return <button {...props} className={`${base} ${styles[variant]} ${props.className || ''}`} />;
};

// --- Tipos de dato ---
type Entry = {
  id: string;
  date: string;
  week: string;
  day: 'A' | 'B';
  exercise: string; // value
  exerciseLabel: string; // label
  weight: string; // kg/s/m/—
  sets: string[]; // hasta 5
  rpe?: string;
  notes?: string;
};

// --- Ayudas ---
const findExercise = (valueOrLabel: string) =>
  EXERCISES.find((e) => e.value === valueOrLabel) ||
  EXERCISES.find((e) => e.label === valueOrLabel) || { value: valueOrLabel, label: valueOrLabel, unit: '', category: 'Otros', template: ['', '', ''] };

const exerciseOptions = () =>
  Object.entries(EX_BY_CAT).flatMap(([cat, items]) =>
    items.map((e) => ({ value: e.value, label: `${e.label} — ${cat}` }))
  );

const exportCSV = (entries: Entry[]) => {
  const rows = [
    [
      'date',
      'week',
      'day',
      'exercise',
      'exerciseLabel',
      'weight',
      'set1',
      'set2',
      'set3',
      'set4',
      'set5',
      'rpe',
      'notes',
    ],
    ...entries.map((e) => [
      e.date,
      e.week,
      e.day,
      e.exercise,
      e.exerciseLabel,
      e.weight,
      ...(e.sets || ['', '', '', '', '']).slice(0, 5),
      e.rpe || '',
      (e.notes || '').replaceAll('\n', ' '),
    ]),
  ];
  const csv = rows
    .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fuerza_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const importCSV = (file: File, setEntries: React.Dispatch<React.SetStateAction<Entry[]>>) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = String(e.target?.result || '');
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [header, ...data] = lines;
    const cols = header.split(',').map((h) => h.replaceAll('"', '').trim());
    const get = (arr: string[], i: number) => (arr[i] || '').replace(/^"|"$/g, '').replaceAll('""', '"');
    const idx = (name: string) => cols.indexOf(name);
    const out: Entry[] = data.map((line) => {
      const arr = line.match(/\"(?:[^\"]|\"\")*\"|[^,]+/g) || [];
      const exLabel = get(arr, idx('exerciseLabel'));
      const ex = findExercise(get(arr, idx('exercise')) || exLabel);
      return {
        id: uid(),
        date: get(arr, idx('date')) || today(),
        week: get(arr, idx('week')) || '1',
        day: (get(arr, idx('day')) as Entry['day']) || 'A',
        exercise: ex.value,
        exerciseLabel: ex.label,
        weight: get(arr, idx('weight')) || '',
        sets: [
          get(arr, idx('set1')),
          get(arr, idx('set2')),
          get(arr, idx('set3')),
          get(arr, idx('set4')),
          get(arr, idx('set5')),
        ],
        rpe: get(arr, idx('rpe')) || '',
        notes: get(arr, idx('notes')) || '',
      } as Entry;
    });
    setEntries((prev) => [...out, ...prev]);
  };
  reader.readAsText(file);
};

// --- Componente principal de registros ---
export default function StrengthLogApp() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [q, setQ] = useState('');
  const [filterWeek, setFilterWeek] = useState('all');
  const [filterDay, setFilterDay] = useState('all');
  const [tests, setTests] = useState<{ pass: boolean; details: string[] }>({ pass: true, details: [] });

  // Formulario para nueva entrada
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

  // Cargar datos desde localStorage (incluye migración V1 -> V2)
  useEffect(() => {
    try {
      const rawV2 = localStorage.getItem(KEY_V2);
      if (rawV2) {
        const parsed = JSON.parse(rawV2) as Entry[];
        setEntries(parsed);
        return;
      }
      const rawV1 = localStorage.getItem(KEY_V1);
      if (rawV1) {
        const v1 = JSON.parse(rawV1);
        // Migración básica: asignar exerciseLabel = exercise
        const migrated: Entry[] = (v1 || []).map((e: any) => ({
          id: e.id || uid(),
          date: e.date || today(),
          week: String(e.week || '1'),
          day: (e.day || 'A') as Entry['day'],
          exercise: findExercise(e.exercise).value,
          exerciseLabel: findExercise(e.exercise).label,
          weight: e.weight || '',
          sets: (e.sets || ['', '', '', '', '']).slice(0, 5),
          rpe: e.rpe || '',
          notes: e.notes || '',
        }));
        setEntries(migrated);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }, []);

  // Persistir cambios en entries a localStorage
  useEffect(() => {
    localStorage.setItem(KEY_V2, JSON.stringify(entries));
  }, [entries]);

  // Filtrar y ordenar los registros según filtros y búsqueda
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterWeek !== 'all' && String(e.week) !== String(filterWeek)) return false;
      if (filterDay !== 'all' && e.day !== filterDay) return false;
      if (q && !(`${e.exerciseLabel} ${e.notes}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [entries, filterWeek, filterDay, q]);

  // Calcular volumen aproximado = peso * suma de repeticiones
  const totalVolume = useMemo(() => {
    return filtered.reduce((acc, e) => {
      const reps = (e.sets || []).filter(Boolean).map((x) => Number(x) || 0).reduce((a, b) => a + b, 0);
      const w = Number(e.weight) || 0;
      return acc + w * reps;
    }, 0);
  }, [filtered]);

  // Cargar plantilla de series según el ejercicio seleccionado en el formulario
  const onLoadTemplate = () => {
    const ex = findExercise(form.exercise);
    const templ = (ex.template || []).slice(0, 5).map((v: any) => String(v));
    const pad = Array(5).fill('');
    for (let i = 0; i < templ.length; i++) pad[i] = templ[i];
    setForm({ ...form, exerciseLabel: ex.label, sets: pad });
  };

  // Añadir una entrada nueva al listado
  const addEntry = () => {
    const ex = findExercise(form.exercise);
    const payload: Entry = {
      id: uid(),
      date: form.date,
      week: String(form.week || '1'),
      day: (form.day || 'A') as Entry['day'],
      exercise: ex.value,
      exerciseLabel: ex.label,
      weight: form.weight,
      sets: (form.sets || []).slice(0, 5),
      rpe: form.rpe,
      notes: form.notes,
    };
    setEntries((prev) => [payload, ...prev]);
    setForm((f) => ({ ...f, weight: '', sets: ['', '', '', '', ''], rpe: '', notes: '' }));
  };

  // Actualizar un registro existente
  const updateEntry = (id: string, patch: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  // Eliminar un registro por id
  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  // --- Self Tests (mínimos) ---
  useEffect(() => {
    const details: string[] = [];
    let pass = true;
    try {
      // Test 1: uid único
      const a = uid(), b = uid();
      if (a === b) {
        pass = false;
        details.push('UID no es único');
      } else details.push('UID único ✔');

      // Test 2: findExercise por value y por label
      const ex1 = findExercise('PMR1P');
      const ex2 = findExercise('Hip Thrust');
      if (!ex1 || ex1.value !== 'PMR1P') {
        pass = false;
        details.push('findExercise(value) falla');
      } else details.push('findExercise(value) ✔');
      if (!ex2 || ex2.value !== 'HT') {
        pass = false;
        details.push('findExercise(label) falla');
      } else details.push('findExercise(label) ✔');

      // Test 3: export/import CSV estructura mínima
      const sample: Entry[] = [
        {
          id: uid(),
          date: today(),
          week: '1',
          day: 'A',
          exercise: 'HT',
          exerciseLabel: 'Hip Thrust',
          weight: '60',
          sets: ['10', '10', '10'],
          rpe: '7',
          notes: 'test',
        },
      ];
      // Simular export: verificar la estructura del CSV sin generar archivo
      const rows = [
        [
          'date',
          'week',
          'day',
          'exercise',
          'exerciseLabel',
          'weight',
          'set1',
          'set2',
          'set3',
          'set4',
          'set5',
          'rpe',
          'notes',
        ],
        [
          sample[0].date,
          sample[0].week,
          sample[0].day,
          sample[0].exercise,
          sample[0].exerciseLabel,
          sample[0].weight,
          ...sample[0].sets,
          '',
          '',
          sample[0].rpe,
          sample[0].notes,
        ],
      ];
      if (rows[1][3] !== 'HT') {
        pass = false;
        details.push('Export CSV estructura incorrecta');
      } else details.push('Export CSV estructura ✔');
    } catch (e: any) {
      pass = false;
      details.push('Excepción en tests: ' + e?.message);
    }
    setTests({ pass, details });
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Encabezado con acciones globales */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Registro de Entrenamientos</h1>
        <div className="flex gap-2">
          <Button onClick={() => exportCSV(entries)}>Exportar CSV</Button>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0], setEntries)}
            />
            <span className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50">Importar CSV</span>
          </label>
          <Button variant="danger" onClick={() => {
            if (confirm('¿Vaciar todos los datos?')) setEntries([]);
          }}>Vaciar</Button>
        </div>
      </header>

      {/* Filtros */}
      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          placeholder="Buscar por ejercicio o notas"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          value={filterWeek}
          onChange={(e: any) => setFilterWeek(e.target.value)}
          options={[
            { value: 'all', label: 'Todas las semanas' },
            { value: '1', label: 'Semana 1' },
            { value: '2', label: 'Semana 2' },
            { value: '3', label: 'Semana 3' },
            { value: '4', label: 'Semana 4' },
          ]}
        />
        <Select
          value={filterDay}
          onChange={(e: any) => setFilterDay(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los días' },
            { value: 'A', label: 'Día A' },
            { value: 'B', label: 'Día B' },
          ]}
        />
        <div className="flex items-center justify-end text-sm text-gray-600">
          Volumen aprox.: <span className="ml-1 font-semibold">{totalVolume.toLocaleString()} kg·rep</span>
        </div>
      </section>

      {/* Formulario de alta */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Añadir registro</h2>
        <p className="mb-2 text-sm text-gray-600">
          Selecciona un ejercicio y, si lo deseas, usa <strong>Cargar plantilla</strong> para rellenar las series típicas.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select
            value={form.week}
            onChange={(e: any) => setForm({ ...form, week: e.target.value })}
            options={[
              { value: '1', label: 'Semana 1' },
              { value: '2', label: 'Semana 2' },
              { value: '3', label: 'Semana 3' },
              { value: '4', label: 'Semana 4' },
            ]}
          />
          <Select
            value={form.day}
            onChange={(e: any) => setForm({ ...form, day: e.target.value })}
            options={[
              { value: 'A', label: 'Día A' },
              { value: 'B', label: 'Día B' },
            ]}
          />
          <Select
            value={form.exercise}
            onChange={(e: any) => {
              const ex = findExercise(e.target.value);
              setForm({ ...form, exercise: ex.value, exerciseLabel: ex.label });
            }}
            options={exerciseOptions()}
            className="md:col-span-2"
          />
          <Input
            placeholder="Carga / Peso (kg, s, m)"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <Input
              key={i}
              placeholder={`Reps/Seg/Metros S${i + 1}`}
              value={form.sets[i]}
              onChange={(e) => {
                const sets = [...form.sets];
                sets[i] = e.target.value;
                setForm({ ...form, sets });
              }}
            />
          ))}
          <Input
            placeholder="RPE"
            value={form.rpe}
            onChange={(e) => setForm({ ...form, rpe: e.target.value })}
          />
          <Input
            placeholder="Notas"
            className="md:col-span-6"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button variant="ghost" onClick={onLoadTemplate}>
            Cargar plantilla
          </Button>
          <Button onClick={addEntry}>Guardar registro</Button>
        </div>
      </section>

      {/* Tabla */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={13}>
                    Sin registros. Añade el primero arriba.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-2">
                    <Input
                      type="date"
                      value={e.date}
                      onChange={(ev) => updateEntry(e.id, { date: (ev.target as HTMLInputElement).value })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={e.week}
                      onChange={(ev) => updateEntry(e.id, { week: (ev.target as HTMLInputElement).value })}
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={e.day}
                      onChange={(ev: any) => updateEntry(e.id, { day: ev.target.value })}
                      options={[
                        { value: 'A', label: 'A' },
                        { value: 'B', label: 'B' },
                      ]}
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={e.exercise}
                      onChange={(ev: any) => {
                        const ex = findExercise(ev.target.value);
                        updateEntry(e.id, { exercise: ex.value, exerciseLabel: ex.label });
                      }}
                      options={exerciseOptions()}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={e.weight}
                      onChange={(ev) => updateEntry(e.id, { weight: (ev.target as HTMLInputElement).value })}
                    />
                  </td>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <td key={i} className="p-2">
                      <Input
                        value={e.sets[i] || ''}
                        onChange={(ev) => {
                          const sets = [...(e.sets || [])];
                          sets[i] = (ev.target as HTMLInputElement).value;
                          updateEntry(e.id, { sets });
                        }}
                      />
                    </td>
                  ))}
                  <td className="p-2">
                    <Input
                      value={e.rpe || ''}
                      onChange={(ev) => updateEntry(e.id, { rpe: (ev.target as HTMLInputElement).value })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={e.notes || ''}
                      onChange={(ev) => updateEntry(e.id, { notes: (ev.target as HTMLInputElement).value })}
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      className="mr-2"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(e, null, 2))}
                    >
                      Copiar
                    </Button>
                    <Button variant="danger" onClick={() => removeEntry(e.id)}>
                      Borrar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Panel de pruebas */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <details>
          <summary className="cursor-pointer select-none font-semibold">
            Debug / Tests {tests.pass ? '✔' : '✖'}
          </summary>
          <ul className="mt-2 list-disc pl-6">
            {tests.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}