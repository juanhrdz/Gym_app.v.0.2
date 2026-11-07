import EjercicioConPeso from '../../models/EjercicioConPeso';
import EjercicioPesoCorporal from '../../models/EjercicioPesoCorporal';

const pierna = [
  new EjercicioConPeso({ id: 'pie-01', nombre: 'Sentadillas', zona: 'Pierna', equipo: 'Barra', peso: 60, sets: 5, repeticiones: 5, descanso: 120, nivel: 'Intermedio' }),
  new EjercicioConPeso({ id: 'pie-02', nombre: 'Prensa', zona: 'Pierna', equipo: 'Máquina', peso: 100 }),
  new EjercicioConPeso({ id: 'pie-03', nombre: 'Extensión de cuadríceps', zona: 'Pierna', equipo: 'Máquina', peso: 30, repeticiones: 12 }),
  new EjercicioPesoCorporal({ id: 'pie-04', nombre: 'Zancadas', zona: 'Pierna', repeticiones: 12 }),
];

export default pierna;