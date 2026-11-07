import EjercicioConPeso from '../../models/EjercicioConPeso';
import EjercicioPesoCorporal from '../../models/EjercicioPesoCorporal';

const triceps = [
  new EjercicioConPeso({ id: 'tri-01', nombre: 'Extensión en polea', zona: 'Tríceps', equipo: 'Polea', peso: 25 }),
  new EjercicioConPeso({ id: 'tri-02', nombre: 'Press francés', zona: 'Tríceps', equipo: 'Barra Z', peso: 20, nivel: 'Intermedio' }),
  new EjercicioPesoCorporal({ id: 'tri-03', nombre: 'Fondos en banco', zona: 'Tríceps', repeticiones: 12 }),
];

export default triceps;