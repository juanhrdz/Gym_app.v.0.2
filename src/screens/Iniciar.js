import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerSesionesDeHoy } from '../services/agendaService';
import { listarRutinas } from '../services/rutinasStorage';
import { cargarUsuario } from '../services/UsuarioStorage';

const PESO_POR_DEFECTO = 75;

const formatear = (total) => {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const formatearHora = (fecha) =>
  `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;

export default function IniciarScreen() {
  // 'cargando' | 'seleccion' | 'listo' | 'entrenando' | 'felicidades' | 'resumen'
  const [fase, setFase] = useState('cargando');
  const [sesionesHoy, setSesionesHoy] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [errorAgenda, setErrorAgenda] = useState('');
  const [rutinaSel, setRutinaSel] = useState(null);

  const [indice, setIndice] = useState(0);
  const [segundos, setSegundos] = useState(0);               // reloj total de la rutina
  const [inicioEjercicio, setInicioEjercicio] = useState(0); // segundo en que empezó el ejercicio actual
  const [resumen, setResumen] = useState(null);

  const inicioRef = useRef(null);
  const tiemposRef = useRef([]); // segundos reales invertidos en cada ejercicio
  const faseRef = useRef(fase);
  faseRef.current = fase;

  const ejercicios = rutinaSel ? rutinaSel.ejercicios : [];

  // ---------- Cargar sesiones de hoy y todas las rutinas ----------
  const cargarDatos = useCallback(async () => {
    setRutinas(await listarRutinas());
    try {
      setSesionesHoy(await obtenerSesionesDeHoy());
      setErrorAgenda('');
    } catch (error) {
      setSesionesHoy([]);
      setErrorAgenda(error.message);
    }
  }, []);

  // Cada vez que se entra a la pestaña (solo si no hay una rutina elegida o en curso)
  useFocusEffect(
    useCallback(() => {
      if (['cargando', 'seleccion'].includes(faseRef.current)) {
        cargarDatos().then(() => setFase((f) => (f === 'cargando' ? 'seleccion' : f)));
      }
    }, [cargarDatos])
  );

  // ---------- Reloj: no se detiene hasta finalizar ----------
  useEffect(() => {
    if (fase !== 'entrenando') return;
    const id = setInterval(() => {
      // Se calcula con la hora real, así no se desfasa si la app queda en segundo plano
      setSegundos(Math.floor((Date.now() - inicioRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [fase]);

  // ---------- Pantalla de felicitaciones: 5 segundos ----------
  useEffect(() => {
    if (fase !== 'felicidades') return;
    const t = setTimeout(() => setFase('resumen'), 5000);
    return () => clearTimeout(t);
  }, [fase]);

  // ---------- Acciones ----------
  const elegirRutina = (rutina) => {
    setRutinaSel(rutina);
    setFase('listo');
  };

  const comenzar = () => {
    inicioRef.current = Date.now();
    tiemposRef.current = [];
    setSegundos(0);
    setInicioEjercicio(0);
    setIndice(0);
    setFase('entrenando');
  };

  const finalizar = async () => {
    const total = Math.floor((Date.now() - inicioRef.current) / 1000);
    tiemposRef.current[indice] = total - inicioEjercicio;

    const usuario = await cargarUsuario();
    const peso = usuario?.peso ?? PESO_POR_DEFECTO;

    // Cada ejercicio calcula sus calorías con su propio MET y el tiempo real invertido
    const calorias = Math.round(
      ejercicios.reduce((suma, ej, i) => suma + ej.caloriasQuemadas(peso, tiemposRef.current[i]), 0)
    );
    const volumen = Math.round(ejercicios.reduce((suma, ej) => suma + ej.volumen, 0));

    setSegundos(total);
    setResumen({ tiempo: total, calorias, ejercicios: ejercicios.length, volumen });
    setFase('felicidades');
  };

  const avanzar = () => {
    if (indice === ejercicios.length - 1) {
      finalizar();
    } else {
      tiemposRef.current[indice] = segundos - inicioEjercicio;
      setIndice(indice + 1);
      setInicioEjercicio(segundos);
    }
  };

  const volverASeleccion = () => {
    setRutinaSel(null);
    cargarDatos();
    setFase('seleccion');
  };

  // ---------- Vistas ----------
  if (fase === 'cargando') {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (fase === 'seleccion') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.titulo}>Agendadas para hoy</Text>
        {errorAgenda ? <Text style={styles.error}>{errorAgenda}</Text> : null}
        {!errorAgenda && sesionesHoy.length === 0 && (
          <Text style={styles.vacio}>No tienes rutinas agendadas para hoy.</Text>
        )}
        {sesionesHoy.map((s) => (
          <TouchableOpacity key={s.clave} style={styles.rutinaCard} onPress={() => elegirRutina(s.rutina)}>
            <Text style={styles.horaSesion}>{formatearHora(s.hora)}</Text>
            <Text style={styles.rutinaNombre}>{s.rutina.nombre}</Text>
            <Text style={styles.rutinaDetalle}>{s.rutina.resumen()}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.titulo, { marginTop: 24 }]}>Todas mis rutinas</Text>
        {rutinas.map((r) => (
          <TouchableOpacity key={r.id} style={styles.rutinaCard} onPress={() => elegirRutina(r)}>
            <Text style={styles.rutinaNombre}>{r.nombre}</Text>
            <Text style={styles.rutinaDetalle}>{r.resumen()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  if (fase === 'listo') {
    return (
      <View style={[styles.container, styles.centrado]}>
        <Text style={styles.titulo}>{rutinaSel.nombre}</Text>
        <Text style={styles.mensaje}>{rutinaSel.resumen()}</Text>
        <View style={styles.listaPrevia}>
          {ejercicios.map((ej, i) => (
            <Text key={`${ej.id}-${i}`} style={styles.itemPrevio}>
              {i + 1}. {ej.nombre}
            </Text>
          ))}
        </View>
        <TouchableOpacity style={styles.botonPrincipal} onPress={comenzar}>
          <Text style={styles.botonTexto}>Comenzar rutina</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonSecundario} onPress={volverASeleccion}>
          <Text style={styles.botonTexto}>Cambiar rutina</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (fase === 'felicidades') {
    return (
      <View style={[styles.container, styles.centrado]}>
        <Text style={styles.emojiGrande}>🎉</Text>
        <Text style={styles.felicidades}>¡Felicidades!</Text>
        <Text style={styles.mensaje}>Completaste {rutinaSel.nombre}</Text>
      </View>
    );
  }

  if (fase === 'resumen') {
    const tarjetas = [
      { icono: '⏱️', valor: formatear(resumen.tiempo), etiqueta: 'Tiempo total' },
      { icono: '🔥', valor: `${resumen.calorias} kcal`, etiqueta: 'Calorías quemadas' },
      { icono: '🏋️', valor: String(resumen.ejercicios), etiqueta: 'Ejercicios' },
      { icono: '📦', valor: `${resumen.volumen} kg`, etiqueta: 'Volumen levantado' },
    ];
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centrado2}>
        <Text style={styles.titulo}>Resumen del entrenamiento</Text>
        <View style={styles.grid}>
          {tarjetas.map((t) => (
            <View key={t.etiqueta} style={styles.cuadro}>
              <Text style={styles.cuadroIcono}>{t.icono}</Text>
              <Text style={styles.cuadroValor}>{t.valor}</Text>
              <Text style={styles.cuadroEtiqueta}>{t.etiqueta}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.botonPrincipal} onPress={volverASeleccion}>
          <Text style={styles.botonTexto}>Cerrar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ---------- fase === 'entrenando' ----------
  const ejercicio = ejercicios[indice];
  const esUltimo = indice === ejercicios.length - 1;
  const esperado = ejercicio.tiempoEstimado * 60;
  const enEjercicio = segundos - inicioEjercicio;
  const puedeAvanzar = enEjercicio >= esperado;

  return (
    <View style={[styles.container, styles.centrado]}>
      <Text style={styles.progreso}>
        {rutinaSel.nombre} · Ejercicio {indice + 1} de {ejercicios.length}
      </Text>

      <Text style={styles.reloj}>{formatear(segundos)}</Text>

      <Text style={styles.ejercicioNombre}>{ejercicio.nombre}</Text>
      <Text style={styles.ejercicioDetalle}>
        {ejercicio.zona} · {ejercicio.resumen()}
      </Text>
      <Text style={styles.ejercicioDetalle}>Tiempo esperado: {formatear(esperado)}</Text>

      <TouchableOpacity
        style={[styles.botonPrincipal, !puedeAvanzar && styles.botonDeshabilitado]}
        onPress={avanzar}
        disabled={!puedeAvanzar}
      >
        <Text style={styles.botonTexto}>{esUltimo ? 'Finalizar' : 'Avanzar'}</Text>
      </TouchableOpacity>

      {!puedeAvanzar && (
        <Text style={styles.ayuda}>
          Podrás {esUltimo ? 'finalizar' : 'avanzar'} en {formatear(esperado - enEjercicio)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  centrado: { justifyContent: 'center', alignItems: 'center' },
  centrado2: { alignItems: 'center', paddingVertical: 24 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' },
  mensaje: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  vacio: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  error: { color: '#EF4444', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  emojiGrande: { fontSize: 90, marginBottom: 12 },
  felicidades: { fontSize: 36, fontWeight: 'bold', color: '#FF5722', marginBottom: 8 },

  rutinaCard: { backgroundColor: '#1E222B', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2A303C' },
  horaSesion: { color: '#FF5722', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  rutinaNombre: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  rutinaDetalle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },

  listaPrevia: { alignSelf: 'stretch', backgroundColor: '#1E222B', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2A303C' },
  itemPrevio: { color: '#D1D5DB', fontSize: 15, paddingVertical: 4 },

  progreso: { fontSize: 14, color: '#9CA3AF', marginBottom: 8, textAlign: 'center' },
  reloj: { fontSize: 72, fontWeight: 'bold', color: '#FFFFFF', fontVariant: ['tabular-nums'], marginBottom: 16 },
  ejercicioNombre: { fontSize: 26, fontWeight: 'bold', color: '#FF5722', textAlign: 'center', marginBottom: 6 },
  ejercicioDetalle: { fontSize: 15, color: '#9CA3AF', marginBottom: 4, textAlign: 'center' },
  ayuda: { marginTop: 12, color: '#6B7280', fontSize: 13 },

  botonPrincipal: { backgroundColor: '#FF5722', paddingVertical: 16, borderRadius: 12, alignSelf: 'stretch', alignItems: 'center', marginTop: 24 },
  botonSecundario: { backgroundColor: '#2A303C', paddingVertical: 14, borderRadius: 12, alignSelf: 'stretch', alignItems: 'center', marginTop: 12 },
  botonDeshabilitado: { opacity: 0.35 },
  botonTexto: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignSelf: 'stretch' },
  cuadro: { width: '48%', backgroundColor: '#1E222B', borderRadius: 12, borderWidth: 1, borderColor: '#2A303C', paddingVertical: 24, paddingHorizontal: 8, alignItems: 'center', marginBottom: 14 },
  cuadroIcono: { fontSize: 30, marginBottom: 8 },
  cuadroValor: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  cuadroEtiqueta: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});