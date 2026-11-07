// src/models/Ejercicio.js
import { NIVELES, TIPOS } from './Constants';

// ---------- Validaciones internas ----------
function numeroPositivo(valor, campo) {
  if (typeof valor !== 'number' || Number.isNaN(valor) || valor <= 0) {
    throw new Error(`"${campo}" debe ser un número mayor a 0 (recibido: ${valor})`);
  }
  return valor;
}

function numeroNoNegativo(valor, campo) {
  if (typeof valor !== 'number' || Number.isNaN(valor) || valor < 0) {
    throw new Error(`"${campo}" debe ser un número igual o mayor a 0 (recibido: ${valor})`);
  }
  return valor;
}

/**
 * Clase padre de todos los ejercicios.
 * Guarda lo que comparten: nivel, repeticiones, sets, peso, tiempo estimado y zona.
 * Las hijas sobreescriben getters/métodos (tiempoEstimado, resumen, toJSON...).
 */
export default class Ejercicio {
  constructor({
    id,
    nombre,
    zona,
    nivel = 'Principiante',
    repeticiones = 10,
    sets = 3,
    peso = 0,              // kg
    descanso = 60,         // segundos entre sets
    segundosPorRep = 4,    // duración promedio de una repetición
    met = 5,               // intensidad (MET): kcal por kg de peso por hora
    descripcion = '',
  } = {}) {
    if (!id) throw new Error('El ejercicio necesita un "id"');
    if (!nombre) throw new Error('El ejercicio necesita un "nombre"');
    if (!zona) throw new Error('El ejercicio necesita una "zona"');
    if (!NIVELES.includes(nivel)) {
      throw new Error(`Nivel inválido "${nivel}". Usa: ${NIVELES.join(', ')}`);
    }

    this.id = id;
    this.nombre = nombre;
    this.zona = zona;
    this.nivel = nivel;
    this.repeticiones = numeroPositivo(repeticiones, 'repeticiones');
    this.sets = numeroPositivo(sets, 'sets');
    this.peso = numeroNoNegativo(peso, 'peso');
    this.descanso = numeroNoNegativo(descanso, 'descanso');
    this.segundosPorRep = numeroPositivo(segundosPorRep, 'segundosPorRep');
    this.met = numeroPositivo(met, 'met');
    this.descripcion = descripcion;
  }

  // ---------- Tipo ----------
  get tipo() {
    return TIPOS.BASE;
  }

  // ---------- Cálculos ----------

  /** Tiempo estimado total en minutos (redondeado hacia arriba). */
  get tiempoEstimado() {
    const trabajo = this.sets * this.repeticiones * this.segundosPorRep;
    const descansos = Math.max(this.sets - 1, 0) * this.descanso;
    return Math.ceil((trabajo + descansos) / 60);
  }

  /** Volumen total levantado en kg (sets x reps x peso). */
  get volumen() {
    return this.sets * this.repeticiones * this.peso;
  }

  /** Total de repeticiones de la sesión. */
  get repeticionesTotales() {
    return this.sets * this.repeticiones;
  }

  /**
   * Calorías quemadas estimadas (kcal) con la fórmula MET:
   *   kcal = MET x peso del usuario (kg) x horas
   *
   * @param {number} pesoUsuario  peso del usuario en kg
   * @param {number} segundos     tiempo real invertido; si no se indica,
   *                              se usa el tiempo estimado del ejercicio
   */
  caloriasQuemadas(pesoUsuario = 70, segundos = this.tiempoEstimado * 60) {
    const kcal = this.met * pesoUsuario * (segundos / 3600);
    return Math.round(kcal * 10) / 10;
  }

  // ---------- Texto para mostrar en pantalla ----------

  resumen() {
    const peso = this.peso ? ` · ${this.peso} kg` : '';
    return `${this.sets} x ${this.repeticiones}${peso}`;
  }

  detalle() {
    const lineas = [
      `${this.nivel} · ${this.zona}`,
      this.resumen(),
      `Descanso: ${this.descanso}s`,
      `~${this.tiempoEstimado} min`,
    ];
    if (this.descripcion) lineas.push('', this.descripcion);
    return lineas.join('\n');
  }

  // ---------- Copias y persistencia ----------

  /**
   * Devuelve una COPIA del ejercicio, opcionalmente con cambios.
   * Útil para no modificar la plantilla preestablecida:
   *   const mia = buscarPorId('pie-01').clonar({ peso: 80 });
   */
  clonar(cambios = {}) {
    return new this.constructor({ ...this.toJSON(), ...cambios });
  }

  /** Objeto simple, listo para AsyncStorage / JSON.stringify. */
  toJSON() {
    return {
      tipo: this.tipo,
      id: this.id,
      nombre: this.nombre,
      zona: this.zona,
      nivel: this.nivel,
      repeticiones: this.repeticiones,
      sets: this.sets,
      peso: this.peso,
      descanso: this.descanso,
      segundosPorRep: this.segundosPorRep,
      met: this.met,
      descripcion: this.descripcion,
    };
  }
}