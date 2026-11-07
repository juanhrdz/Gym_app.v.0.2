import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listarRutinas } from '../services/rutinasStorage';
import { agendarRutina } from '../services/agendaService';

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Orden visual: lunes a domingo. El número es el valor de Date.getDay()
const DIAS_SEMANA = [
  { valor: 1, etiqueta: 'Lun' },
  { valor: 2, etiqueta: 'Mar' },
  { valor: 3, etiqueta: 'Mié' },
  { valor: 4, etiqueta: 'Jue' },
  { valor: 5, etiqueta: 'Vie' },
  { valor: 6, etiqueta: 'Sáb' },
  { valor: 0, etiqueta: 'Dom' },
];
const DIAS_MES = Array.from({ length: 31 }, (_, i) => i + 1);
const MODOS = [
  { valor: 'unaVez', etiqueta: 'Una vez' },
  { valor: 'semana', etiqueta: 'Cada semana' },
  { valor: 'mes', etiqueta: 'Cada mes' },
];

const dos = (n) => String(n).padStart(2, '0');

function Stepper({ valor, onMenos, onMas }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepperBoton} onPress={onMenos}>
        <Text style={styles.stepperBotonTexto}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValor}>{dos(valor)}</Text>
      <TouchableOpacity style={styles.stepperBoton} onPress={onMas}>
        <Text style={styles.stepperBotonTexto}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function Chip({ activo, etiqueta, onPress, pequeno }) {
  return (
    <TouchableOpacity
      style={[styles.chip, pequeno && styles.chipPequeno, activo && styles.chipActivo]}
      onPress={onPress}
    >
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{etiqueta}</Text>
    </TouchableOpacity>
  );
}

export default function AgendaScreen() {
  const [rutinas, setRutinas] = useState([]);
  const [rutinaId, setRutinaId] = useState(null);
  const [modo, setModo] = useState('unaVez');
  const [diaIndex, setDiaIndex] = useState(0); // para "una vez": 0 = hoy ... 13
  const [diasSemana, setDiasSemana] = useState([]);
  const [diasMes, setDiasMes] = useState([]);
  const [hora, setHora] = useState(18);
  const [minuto, setMinuto] = useState(0);
  const [guardando, setGuardando] = useState(false);

  // Próximos 14 días para el modo "una vez"
  const proximosDias = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + i);
        const etiqueta =
          i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${DIAS_CORTOS[fecha.getDay()]} ${fecha.getDate()}`;
        return { fecha, etiqueta };
      }),
    []
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const lista = await listarRutinas();
        setRutinas(lista);
        setRutinaId((actual) => (lista.some((r) => r.id === actual) ? actual : lista[0]?.id ?? null));
      })();
    }, [])
  );

  const alternar = (lista, setLista, valor) =>
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);

  const cambiarHora = (delta) => setHora((h) => (h + delta + 24) % 24);
  const cambiarMinuto = (delta) => setMinuto((m) => (m + delta + 60) % 60);

  const agendar = async () => {
    const rutina = rutinas.find((r) => r.id === rutinaId);
    if (!rutina) {
      Alert.alert('Falta la rutina', 'Elige una rutina para agendar.');
      return;
    }
    setGuardando(true);
    try {
      const total = await agendarRutina({
        rutina,
        modo,
        fecha: proximosDias[diaIndex].fecha,
        diasSemana,
        diasMes,
        hora,
        minuto,
      });
      const repite = modo !== 'unaVez';
      Alert.alert(
        '¡Rutina agendada!',
        repite
          ? `Se crearon ${total} evento(s) recurrente(s) en tu calendario. Para quitarlos, elimínalos desde tu app de Calendario.`
          : 'Se guardó en tu calendario con recordatorio 1 hora antes.'
      );
    } catch (error) {
      Alert.alert('No se pudo agendar', error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.headerTitle}>Agenda tu Entrenamiento</Text>

      {/* 1. Rutina */}
      <Text style={styles.seccion}>1. Rutina</Text>
      {rutinas.map((r) => (
        <TouchableOpacity
          key={r.id}
          style={[styles.rutinaCard, r.id === rutinaId && styles.rutinaCardActiva]}
          onPress={() => setRutinaId(r.id)}
        >
          <Text style={styles.rutinaNombre}>{r.nombre}</Text>
          <Text style={styles.rutinaDetalle}>{r.resumen()}</Text>
        </TouchableOpacity>
      ))}

      {/* 2. Frecuencia */}
      <Text style={styles.seccion}>2. ¿Cuándo?</Text>
      <View style={styles.fila}>
        {MODOS.map((m) => (
          <Chip key={m.valor} activo={modo === m.valor} etiqueta={m.etiqueta} onPress={() => setModo(m.valor)} />
        ))}
      </View>

      {modo === 'unaVez' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollHorizontal}>
          {proximosDias.map((d, i) => (
            <Chip key={i} activo={diaIndex === i} etiqueta={d.etiqueta} onPress={() => setDiaIndex(i)} />
          ))}
        </ScrollView>
      )}

      {modo === 'semana' && (
        <>
          <Text style={styles.ayuda}>Se repetirá todas las semanas en los días que elijas.</Text>
          <View style={styles.fila}>
            {DIAS_SEMANA.map((d) => (
              <Chip
                key={d.valor}
                pequeno
                activo={diasSemana.includes(d.valor)}
                etiqueta={d.etiqueta}
                onPress={() => alternar(diasSemana, setDiasSemana, d.valor)}
              />
            ))}
          </View>
        </>
      )}

      {modo === 'mes' && (
        <>
          <Text style={styles.ayuda}>
            Se repetirá cada mes en los días que elijas. Los días 29 a 31 se omiten en los meses que no los tengan.
          </Text>
          <View style={styles.fila}>
            {DIAS_MES.map((d) => (
              <Chip
                key={d}
                pequeno
                activo={diasMes.includes(d)}
                etiqueta={String(d)}
                onPress={() => alternar(diasMes, setDiasMes, d)}
              />
            ))}
          </View>
        </>
      )}

      {/* 3. Hora */}
      <Text style={styles.seccion}>3. Hora de inicio</Text>
      <View style={styles.horaFila}>
        <Stepper valor={hora} onMenos={() => cambiarHora(-1)} onMas={() => cambiarHora(1)} />
        <Text style={styles.dosPuntos}>:</Text>
        <Stepper valor={minuto} onMenos={() => cambiarMinuto(-5)} onMas={() => cambiarMinuto(5)} />
      </View>
      <Text style={styles.ayuda}>Formato de 24 horas. Los minutos cambian de 5 en 5.</Text>

      <TouchableOpacity
        style={[styles.primaryButton, guardando && { opacity: 0.5 }]}
        onPress={agendar}
        disabled={guardando}
      >
        <Text style={styles.primaryButtonText}>
          {guardando ? 'Agendando...' : `Agendar a las ${dos(hora)}:${dos(minuto)}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#FFFFFF' },
  seccion: { fontSize: 16, fontWeight: 'bold', color: '#FF5722', marginTop: 20, marginBottom: 10 },
  ayuda: { color: '#9CA3AF', fontSize: 13, marginTop: 8, marginBottom: 8 },

  rutinaCard: { backgroundColor: '#1E222B', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2A303C' },
  rutinaCardActiva: { borderColor: '#FF5722', borderWidth: 2 },
  rutinaNombre: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  rutinaDetalle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },

  fila: { flexDirection: 'row', flexWrap: 'wrap' },
  scrollHorizontal: { marginTop: 12 },
  chip: { backgroundColor: '#1E222B', borderWidth: 1, borderColor: '#2A303C', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  chipPequeno: { paddingHorizontal: 0, width: 46, alignItems: 'center' },
  chipActivo: { backgroundColor: '#FF5722', borderColor: '#FF5722' },
  chipTexto: { color: '#D1D5DB', fontSize: 14 },
  chipTextoActivo: { color: '#FFFFFF', fontWeight: 'bold' },

  horaFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dosPuntos: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginHorizontal: 12 },
  stepper: { alignItems: 'center' },
  stepperBoton: { backgroundColor: '#2A303C', width: 52, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepperBotonTexto: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  stepperValor: { color: '#FFFFFF', fontSize: 40, fontWeight: 'bold', marginVertical: 6, fontVariant: ['tabular-nums'] },

  primaryButton: {
    backgroundColor: '#FF5722',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});