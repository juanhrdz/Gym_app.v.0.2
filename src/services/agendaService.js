// src/services/agendaService.js
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import { buscarRutina } from './rutinasStorage';

export const TITULO_CALENDARIO = 'Entrenamientos';
const PREFIJO = 'RUTINA:';

/** Notas del evento: enlazan la sesión con una rutina por su id. */
export const armarNotas = (rutinaId) =>
  `Sesión programada desde gymApp.\n${PREFIJO}${rutinaId}`;

const zonaHoraria = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'GMT';
  } catch {
    return 'GMT';
  }
};

async function pedirPermiso() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Se necesita permiso del calendario para usar la agenda.');
  }
}

async function obtenerOCrearCalendario() {
  const calendarios = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existente = calendarios.find((c) => c.title === TITULO_CALENDARIO);
  if (existente) return existente.id;

  let source;
  if (Platform.OS === 'ios') {
    const porDefecto = await Calendar.getDefaultCalendarAsync();
    source = porDefecto.source;
  } else {
    source = { isLocalAccount: true, name: 'gymApp Calendar' };
  }

  return Calendar.createCalendarAsync({
    title: TITULO_CALENDARIO,
    color: '#FF5722',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: source.id,
    source,
    name: 'gymAppInternal',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

// ---------- Cálculo de fechas ----------

function conHora(fecha, hora, minuto) {
  const d = new Date(fecha);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

/** Próxima fecha para un día de la semana (0 = domingo ... 6 = sábado). */
function proximaFechaSemana(diaSemana, hora, minuto) {
  const ahora = new Date();
  const d = conHora(ahora, hora, minuto);
  d.setDate(d.getDate() + ((diaSemana - d.getDay() + 7) % 7));
  if (d <= ahora) d.setDate(d.getDate() + 7);
  return d;
}

/** Próxima fecha para un día del mes (1-31). Salta meses que no tengan ese día. */
function proximaFechaMes(diaMes, hora, minuto) {
  const ahora = new Date();
  for (let i = 0; i < 14; i++) {
    const mesEsperado = (ahora.getMonth() + i) % 12;
    const candidata = new Date(ahora.getFullYear(), ahora.getMonth() + i, diaMes, hora, minuto, 0, 0);
    // Si el mes no tiene ese día (ej. 31 de abril), JS se pasa al mes siguiente: se descarta
    if (candidata.getMonth() === mesEsperado && candidata > ahora) return candidata;
  }
  throw new Error(`No se pudo calcular una fecha para el día ${diaMes}.`);
}

// ---------- Agendar ----------

/**
 * Agenda una rutina en el calendario nativo.
 *
 * modo 'unaVez'  → usa `fecha` (un solo evento)
 * modo 'semana'  → `diasSemana` (0 = domingo ... 6 = sábado), se repite cada semana
 * modo 'mes'     → `diasMes` (1-31), se repite cada mes
 *
 * Devuelve cuántas sesiones (eventos) se crearon.
 */
export async function agendarRutina({
  rutina,
  modo,
  fecha,
  diasSemana = [],
  diasMes = [],
  hora,
  minuto,
}) {
  await pedirPermiso();

  const sesiones = [];

  if (modo === 'unaVez') {
    const inicio = conHora(fecha, hora, minuto);
    if (inicio <= new Date()) throw new Error('Esa hora ya pasó. Elige otra hora u otro día.');
    sesiones.push({ inicio });
  } else if (modo === 'semana') {
    if (diasSemana.length === 0) throw new Error('Elige al menos un día de la semana.');
    diasSemana.forEach((dia) =>
      sesiones.push({
        inicio: proximaFechaSemana(dia, hora, minuto),
        regla: { frequency: Calendar.Frequency.WEEKLY, interval: 1 },
      })
    );
  } else if (modo === 'mes') {
    if (diasMes.length === 0) throw new Error('Elige al menos un día del mes.');
    diasMes.forEach((dia) =>
      sesiones.push({
        inicio: proximaFechaMes(dia, hora, minuto),
        regla: { frequency: Calendar.Frequency.MONTHLY, interval: 1 },
      })
    );
  } else {
    throw new Error(`Modo de agenda desconocido: ${modo}`);
  }

  const calendarId = await obtenerOCrearCalendario();
  const duracionMin = Math.max(rutina.tiempoEstimado, 30);

  for (const { inicio, regla } of sesiones) {
    const detalles = {
      title: `🏋️ ${rutina.nombre}`,
      startDate: inicio,
      endDate: new Date(inicio.getTime() + duracionMin * 60000),
      timeZone: zonaHoraria(),
      notes: armarNotas(rutina.id),
      alarms: [{ relativeOffset: -60 }],
    };
    if (regla) detalles.recurrenceRule = regla;
    await Calendar.createEventAsync(calendarId, detalles);
  }

  return sesiones.length;
}

// ---------- Leer ----------

/**
 * Sesiones agendadas para HOY (puede haber varias), ordenadas por hora.
 * Cada una: { clave, hora: Date, rutina: Rutina }
 */
export async function obtenerSesionesDeHoy() {
  await pedirPermiso();

  const calendarios = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const calendario = calendarios.find((c) => c.title === TITULO_CALENDARIO);
  if (!calendario) return [];

  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);

  const eventos = await Calendar.getEventsAsync([calendario.id], inicio, fin);
  eventos.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const sesiones = [];
  for (const evento of eventos) {
    const linea = (evento.notes || '').split('\n').find((l) => l.startsWith(PREFIJO));
    if (!linea) continue;

    const rutina = await buscarRutina(linea.slice(PREFIJO.length).trim());
    if (rutina) {
      sesiones.push({
        clave: `${evento.id}-${evento.startDate}`,
        hora: new Date(evento.startDate),
        rutina,
      });
    }
  }
  return sesiones;
}