// src/models/Usuario.js

const SEXOS = ['Masculino', 'Femenino'];

function numeroPositivo(valor, campo) {
  if (typeof valor !== 'number' || Number.isNaN(valor) || valor <= 0) {
    throw new Error(`"${campo}" debe ser un número mayor a 0 (recibido: ${valor})`);
  }
  return valor;
}

export default class Usuario {
  constructor({
    nombre = 'Usuario Gym',
    edad,
    estatura,          // cm
    peso,              // kg
    sexo = 'Masculino',
  } = {}) {
    if (!SEXOS.includes(sexo)) {
      throw new Error(`Sexo inválido "${sexo}". Usa: ${SEXOS.join(', ')}`);
    }
    this.nombre = nombre;
    this.edad = numeroPositivo(edad, 'edad');
    this.estatura = numeroPositivo(estatura, 'estatura');
    this.peso = numeroPositivo(peso, 'peso');
    this.sexo = sexo;
  }

  /** Índice de masa corporal. */
  get imc() {
    const metros = this.estatura / 100;
    return Math.round((this.peso / (metros * metros)) * 10) / 10;
  }

  get categoriaImc() {
    const imc = this.imc;
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  /** Tasa metabólica basal (kcal/día), fórmula Mifflin-St Jeor. */
  get tmb() {
    const base = 10 * this.peso + 6.25 * this.estatura - 5 * this.edad;
    return Math.round(this.sexo === 'Masculino' ? base + 5 : base - 161);
  }

  /** Copia con cambios (útil para el estado de React). */
  clonar(cambios = {}) {
    return new Usuario({ ...this.toJSON(), ...cambios });
  }

  toJSON() {
    return {
      nombre: this.nombre,
      edad: this.edad,
      estatura: this.estatura,
      peso: this.peso,
      sexo: this.sexo,
    };
  }

  static fromJSON(datos) {
    return new Usuario(datos);
  }
}