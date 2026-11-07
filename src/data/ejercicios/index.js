import espalda from './espalda';
import pierna from './pierna';
import biceps from './biceps';
import triceps from './triceps';
import antebrazo from './antebrazos';
import core from './core';

// Todas las zonas, por nombre
export const ejerciciosPorZona = {
  Espalda: espalda,
  Pierna: pierna,
  Bíceps: biceps,
  Tríceps: triceps,
  Antebrazo: antebrazo,
  Core: core,
};

// Lista plana con todos los ejercicios
export const todosLosEjercicios = Object.values(ejerciciosPorZona).flat();

// Funciones de ayuda
export const buscarPorId = (id) =>
  todosLosEjercicios.find((e) => e.id === id);

export const filtrarPorZona = (zona) =>
  ejerciciosPorZona[zona] ?? [];

export const filtrarPorNivel = (nivel) =>
  todosLosEjercicios.filter((e) => e.nivel === nivel);

export const buscarPorNombre = (texto) =>
  todosLosEjercicios.filter((e) =>
    e.nombre.toLowerCase().includes(texto.toLowerCase())
  );

export const zonas = Object.keys(ejerciciosPorZona);