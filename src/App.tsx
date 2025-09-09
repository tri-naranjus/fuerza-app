import React from 'react';
import StrengthLogApp from './StrengthLogApp';

// Plan de entrenamiento de 4 semanas para Día A y Día B.
// Sección estática que se muestra al principio de la aplicación.
const TrainingPlan: React.FC = () => (
  <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <h2 className="mb-4 text-xl font-bold">Plan de Entrenamiento</h2>
    <div className="mb-4">
      <h3 className="mb-2 font-semibold text-lg">Día A (cadena posterior – glúteos/isquios)</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>
          <strong>Pliometría (6–8 min):</strong> Semanas 1-2: Pogo jumps 3×20 s + Vertical Jumps 3×6; Semanas 3-4:
          Drop Jumps (20–30 cm) 3×6 + Bounding 3×20 m.
        </li>
        <li>
          <strong>Ejercicio principal:</strong> Peso Muerto Rumano 1 pierna 5×5.
        </li>
        <li>
          <strong>Secundario:</strong> Hip Thrust con barra 3×8–10.
        </li>
        <li>
          <strong>Complementarios:</strong> Nordic Curl excéntrico 3×6–8; Pallof Press 3×12–15; Elevaciones de gemelos excéntricos 3×12–15.
        </li>
      </ul>
    </div>
    <div>
      <h3 className="mb-2 font-semibold text-lg">Día B (cadena anterior – cuádriceps/estabilidad)</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        <li>
          <strong>Pliometría (6–8 min):</strong> Semanas 1-2: Box Jumps 3×5 + Skipping con resistencia 3×20 m; Semanas 3-4:
          Split Jump (zancada con salto) 3×6 por pierna + Hops laterales 3×20 s.
        </li>
        <li>
          <strong>Ejercicio principal:</strong> Sentadilla Búlgara con mancuernas/barra 5×5.
        </li>
        <li>
          <strong>Secundario:</strong> Step-up alto con mancuernas 3×8–10.
        </li>
        <li>
          <strong>Complementarios:</strong> Plancha con arrastre 3×30–40 s; Puente de glúteos a 1 pierna 3×12; Sóleo sentado 3×15–20.
        </li>
      </ul>
    </div>
  </section>
);

// Componente principal que encapsula el plan y el registro de fuerza.
const App: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <TrainingPlan />
      <StrengthLogApp />
    </div>
  );
};

export default App;
