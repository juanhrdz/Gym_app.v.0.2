import EjercicioConPeso from '../../models/EjercicioConPeso';
import EjercicioPesoCorporal from '../../models/EjercicioPesoCorporal';

const espalda = [
  new EjercicioConPeso({ id: 'esp-01', nombre: 'Jalón al pecho', zona: 'Espalda', equipo: 'Polea', peso: 40, sets: 4, repeticiones: 12 }),
  new EjercicioConPeso({ id: 'esp-02', nombre: 'Remo con mancuerna a una mano', zona: 'Espalda', equipo: 'Mancuerna', peso: 20, nivel: 'Intermedio' }),
  new EjercicioConPeso({ id: 'esp-03', nombre: 'Remo con barra', zona: 'Espalda', equipo: 'Barra', peso: 40, nivel: 'Intermedio' }),
  new EjercicioPesoCorporal({ id: 'esp-04', nombre: 'Dominadas', zona: 'Espalda', nivel: 'Avanzado', sets: 4, repeticiones: 8, descanso: 90 }),
];

export default espalda;