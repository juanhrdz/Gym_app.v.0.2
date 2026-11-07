// src/models/EjercicioConPeso.js
import Ejercicio from './Ejercicio';
import { TIPOS } from './Constantsonstants';

/**
 * Ejercicios con carga externa: barra, mancuernas, poleas, máquinas.
 */
export default class EjercicioConPeso extends Ejercicio {
  constructor({ equipo = 'Mancuernas', peso = 10, met = 5, ...resto } = {}) {
    super({ peso, met, ...resto });
    this.equipo = equipo;
  }

  get tipo() {
    return TIPOS.CON_PESO;
  }

  /** Sube el peso (progresión de carga). Devuelve this para encadenar. */
  progresar(kg = 2.5) {
    this.peso += kg;
    return this;
  }

  /** Baja el peso (descarga), sin dejarlo por debajo de 0. */
  reducir(kg = 2.5) {
    this.peso = Math.max(this.peso - kg, 0);
    return this;
  }

  resumen() {
    return `${super.resumen()} (${this.equipo})`;
  }

  toJSON() {
    return { ...super.toJSON(), equipo: this.equipo };
  }
}