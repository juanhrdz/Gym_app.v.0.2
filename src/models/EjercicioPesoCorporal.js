// src/models/EjercicioPesoCorporal.js
import Ejercicio from './Ejercicio';
import { TIPOS } from './Constants';
 
/**
 * Ejercicios que usan el propio cuerpo: dominadas, fondos, zancadas, abdominales.
 * El peso siempre es 0 (no hay carga externa).
 */
export default class EjercicioPesoCorporal extends Ejercicio {
  constructor(datos = {}) {
    super({ met: 6, ...datos, peso: 0 });
  }
 
  get tipo() {
    return TIPOS.PESO_CORPORAL;
  }
 
  /** Progresión: más repeticiones por set. */
  progresar(reps = 1) {
    this.repeticiones += reps;
    return this;
  }
 
  resumen() {
    return `${this.sets} x ${this.repeticiones} (peso corporal)`;
  }
}
 