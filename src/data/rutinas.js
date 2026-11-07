import Rutina from '../models/Rutina';

// Rutinas que vienen con la app. Los ids deben existir en data/ejercicios.
export const rutinasPreestablecidas = [
  new Rutina({
    id: 'preset-fullbody',
    nombre: 'Full body principiante',
    ejerciciosIds: ['esp-01', 'pie-01', 'bic-02', 'cor-01'],
  }),
  new Rutina({
    id: 'preset-torso',
    nombre: 'Torso',
    ejerciciosIds: ['esp-01', 'esp-02', 'bic-01', 'tri-01'],
  }),
  new Rutina({
    id: 'preset-pierna',
    nombre: 'Pierna',
    ejerciciosIds: ['pie-01', 'pie-02', 'pie-03', 'pie-04'],
  }),
];