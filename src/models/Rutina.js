import { buscarPorId } from '../data/ejercicios';

/**
 * Una rutina es solo una lista ordenada de ejercicios con un nombre.
 * No sabe nada de días ni horas: de eso se encarga la agenda.
 */
export default class Rutina {
  constructor({ id, nombre, ejerciciosIds = [], descripcion = '' } = {}) {
    if (!id) throw new Error('La rutina necesita un "id"');
    if (!nombre) throw new Error('La rutina necesita un "nombre"');
    if (!Array.isArray(ejerciciosIds) || ejerciciosIds.length === 0) {
      throw new Error('La rutina necesita al menos un ejercicio');
    }
    this.id = id;
    this.nombre = nombre;
    this.ejerciciosIds = ejerciciosIds;
    this.descripcion = descripcion;
  }

  /** Genera un id único para rutinas creadas por el usuario. */
  static generarId() {
    return `rut-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  /** Ejercicios en el orden de la rutina (ignora ids que ya no existan). */
  get ejercicios() {
    return this.ejerciciosIds.map(buscarPorId).filter(Boolean);
  }

  /** Minutos totales estimados. */
  get tiempoEstimado() {
    return this.ejercicios.reduce((suma, ej) => suma + ej.tiempoEstimado, 0);
  }

  /** Volumen total levantado (kg). */
  get volumen() {
    return this.ejercicios.reduce((suma, ej) => suma + ej.volumen, 0);
  }

  /** Calorías estimadas si se hace en el tiempo estimado de cada ejercicio. */
  caloriasEstimadas(pesoUsuario = 70) {
    const total = this.ejercicios.reduce((suma, ej) => suma + ej.caloriasQuemadas(pesoUsuario), 0);
    return Math.round(total);
  }

  resumen() {
    return `${this.ejercicios.length} ejercicios · ~${this.tiempoEstimado} min`;
  }

  clonar(cambios = {}) {
    return new Rutina({ ...this.toJSON(), ...cambios });
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      ejerciciosIds: this.ejerciciosIds,
      descripcion: this.descripcion,
    };
  }

  static fromJSON(datos) {
    return new Rutina(datos);
  }
}