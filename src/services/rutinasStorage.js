// src/services/rutinasStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import Rutina from '../models/Rutina';
import { rutinasPreestablecidas } from '../data/rutinas';

const CLAVE = '@gymapp/rutinas';

/** Rutinas creadas por el usuario (guardadas en el teléfono). */
export async function listarRutinasGuardadas() {
  const texto = await AsyncStorage.getItem(CLAVE);
  if (!texto) return [];
  try {
    return JSON.parse(texto)
      .map((datos) => {
        try {
          return Rutina.fromJSON(datos);
        } catch {
          return null; // rutina corrupta: se ignora
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Preestablecidas + las del usuario. */
export async function listarRutinas() {
  const guardadas = await listarRutinasGuardadas();
  return [...rutinasPreestablecidas, ...guardadas];
}

export async function buscarRutina(id) {
  const todas = await listarRutinas();
  return todas.find((r) => r.id === id) ?? null;
}

/** Crea o actualiza una rutina del usuario. */
export async function guardarRutina(rutina) {
  const guardadas = await listarRutinasGuardadas();
  const resto = guardadas.filter((r) => r.id !== rutina.id);
  await AsyncStorage.setItem(CLAVE, JSON.stringify([...resto, rutina]));
}

export async function borrarRutina(id) {
  const guardadas = await listarRutinasGuardadas();
  await AsyncStorage.setItem(CLAVE, JSON.stringify(guardadas.filter((r) => r.id !== id)));
}