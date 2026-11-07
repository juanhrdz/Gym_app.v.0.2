import EjercicioConPeso from '../../models/EjercicioConPeso';

const biceps = [
  new EjercicioConPeso({ id: 'bic-01', nombre: 'Curl de bíceps con barra', zona: 'Bíceps', equipo: 'Barra', peso: 20 }),
  new EjercicioConPeso({ id: 'bic-02', nombre: 'Curl martillo', zona: 'Bíceps', equipo: 'Mancuernas', peso: 10 }),
  new EjercicioConPeso({ id: 'bic-03', nombre: 'Curl en banco Scott', zona: 'Bíceps', equipo: 'Barra Z', peso: 15, nivel: 'Intermedio' }),
];

export default biceps;