import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Rutina from '../models/Rutina';
import { ejerciciosPorZona, zonas, buscarPorId } from '../data/ejercicios';
import {
  listarRutinas,
  listarRutinasGuardadas,
  guardarRutina,
  borrarRutina,
} from '../services/rutinasStorage';

export default function EjerciciosScreen() {
  const [seccion, setSeccion] = useState('ejercicios'); // 'ejercicios' | 'rutinas'
  const [zonaAbierta, setZonaAbierta] = useState(null);
  const [favoritos, setFavoritos] = useState({});

  const [rutinas, setRutinas] = useState([]);
  const [idsUsuario, setIdsUsuario] = useState([]);

  // Creación de rutina
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [seleccion, setSeleccion] = useState([]); // ids de ejercicios, en el orden en que se eligen

  const cargarRutinas = useCallback(async () => {
    const [todas, propias] = await Promise.all([listarRutinas(), listarRutinasGuardadas()]);
    setRutinas(todas);
    setIdsUsuario(propias.map((r) => r.id));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarRutinas();
    }, [cargarRutinas])
  );

  // ---------- Sección Ejercicios ----------
  const alternarZona = (zona) => setZonaAbierta(zonaAbierta === zona ? null : zona);
  const alternarFavorito = (zona) => setFavoritos((prev) => ({ ...prev, [zona]: !prev[zona] }));

  // ---------- Sección Rutinas ----------
  const confirmarBorrado = (rutina) => {
    Alert.alert('Borrar rutina', `¿Quieres borrar "${rutina.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await borrarRutina(rutina.id);
          cargarRutinas();
        },
      },
    ]);
  };

  // ---------- Crear rutina ----------
  const abrirModal = () => {
    setNombre('');
    setSeleccion([]);
    setModalVisible(true);
  };

  const alternarEjercicio = (id) =>
    setSeleccion((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]));

  const minutosSeleccion = seleccion.reduce((suma, id) => suma + (buscarPorId(id)?.tiempoEstimado ?? 0), 0);

  const guardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a tu rutina.');
      return;
    }
    if (seleccion.length === 0) {
      Alert.alert('Sin ejercicios', 'Elige al menos un ejercicio.');
      return;
    }
    try {
      const rutina = new Rutina({
        id: Rutina.generarId(),
        nombre: nombre.trim(),
        ejerciciosIds: seleccion,
      });
      await guardarRutina(rutina);
      await cargarRutinas();
      setModalVisible(false);
      setSeccion('rutinas');
    } catch (error) {
      Alert.alert('No se pudo guardar', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Selector de sección */}
      <View style={styles.tabs}>
        {[
          { valor: 'ejercicios', etiqueta: 'Ejercicios' },
          { valor: 'rutinas', etiqueta: 'Rutinas' },
        ].map((t) => (
          <TouchableOpacity
            key={t.valor}
            style={[styles.tab, seccion === t.valor && styles.tabActivo]}
            onPress={() => setSeccion(t.valor)}
          >
            <Text style={[styles.tabTexto, seccion === t.valor && styles.tabTextoActivo]}>{t.etiqueta}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        {seccion === 'ejercicios' &&
          zonas.map((zona) => (
            <View key={zona} style={styles.accordionContainer}>
              <TouchableOpacity style={styles.accordionHeader} onPress={() => alternarZona(zona)}>
                <Text style={styles.accordionTitle}>{zona}</Text>
                <TouchableOpacity onPress={() => alternarFavorito(zona)} style={styles.favButton}>
                  <Text style={styles.favText}>{favoritos[zona] ? '★ Favorito' : '☆ Favorito'}</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {zonaAbierta === zona && (
                <View style={styles.accordionBody}>
                  {ejerciciosPorZona[zona].map((ej) => (
                    <TouchableOpacity
                      key={ej.id}
                      style={styles.ejercicioItem}
                      onPress={() => Alert.alert(ej.nombre, ej.detalle())}
                    >
                      <Text style={styles.ejercicioText}>• {ej.nombre}</Text>
                      <Text style={styles.ejercicioSub}>
                        {ej.nivel} · {ej.resumen()} · ~{ej.tiempoEstimado} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

        {seccion === 'rutinas' &&
          rutinas.map((r) => {
            const esPropia = idsUsuario.includes(r.id);
            return (
              <View key={r.id} style={styles.rutinaCard}>
                <View style={styles.rutinaEncabezado}>
                  <Text style={styles.rutinaNombre}>{r.nombre}</Text>
                  <View style={[styles.badge, esPropia && styles.badgePropia]}>
                    <Text style={styles.badgeTexto}>{esPropia ? 'Mía' : 'Preestablecida'}</Text>
                  </View>
                </View>
                <Text style={styles.rutinaDetalle}>{r.resumen()}</Text>
                {r.ejercicios.map((ej, i) => (
                  <Text key={`${ej.id}-${i}`} style={styles.rutinaEjercicio}>
                    {i + 1}. {ej.nombre}
                  </Text>
                ))}
                {esPropia && (
                  <TouchableOpacity onPress={() => confirmarBorrado(r)} style={styles.borrarBoton}>
                    <Text style={styles.borrarTexto}>Borrar rutina</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
      </ScrollView>

      {/* Botón flotante + */}
      <TouchableOpacity style={styles.fab} onPress={abrirModal} activeOpacity={0.85}>
        <Text style={styles.fabTexto}>+</Text>
      </TouchableOpacity>

      {/* Crear rutina: escoger ejercicios */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cerrarBoton}>
              <Text style={styles.cerrarTexto}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Nueva rutina</Text>
          </View>

          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre de la rutina"
            placeholderTextColor="#6B7280"
            maxLength={40}
          />

          <Text style={styles.ayuda}>Toca los ejercicios en el orden en que los quieres hacer.</Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {zonas.map((zona) => (
              <View key={zona}>
                <Text style={styles.zonaTitulo}>{zona}</Text>
                {ejerciciosPorZona[zona].map((ej) => {
                  const posicion = seleccion.indexOf(ej.id);
                  const elegido = posicion !== -1;
                  return (
                    <TouchableOpacity
                      key={ej.id}
                      style={[styles.opcion, elegido && styles.opcionElegida]}
                      onPress={() => alternarEjercicio(ej.id)}
                    >
                      <View style={[styles.circulo, elegido && styles.circuloElegido]}>
                        {elegido && <Text style={styles.circuloTexto}>{posicion + 1}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.opcionNombre}>{ej.nombre}</Text>
                        <Text style={styles.ejercicioSub}>
                          {ej.nivel} · {ej.resumen()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Text style={styles.footerTexto}>
              {seleccion.length} ejercicio(s) · ~{minutosSeleccion} min
            </Text>
            <TouchableOpacity style={styles.guardarBoton} onPress={guardar}>
              <Text style={styles.guardarTexto}>Guardar rutina</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  contenido: { padding: 16, paddingBottom: 100 },

  tabs: { flexDirection: 'row', margin: 16, marginBottom: 0, backgroundColor: '#1E222B', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActivo: { backgroundColor: '#FF5722' },
  tabTexto: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 15 },
  tabTextoActivo: { color: '#FFFFFF' },

  accordionContainer: { marginBottom: 12, borderRadius: 12, backgroundColor: '#1E222B', borderWidth: 1, borderColor: '#2A303C', overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  accordionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  accordionBody: { padding: 16, backgroundColor: '#181A20', borderTopWidth: 1, borderTopColor: '#2A303C' },
  favButton: { padding: 4 },
  favText: { color: '#FF5722', fontWeight: 'bold' },
  ejercicioItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A303C' },
  ejercicioText: { fontSize: 15, color: '#D1D5DB' },
  ejercicioSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  rutinaCard: { backgroundColor: '#1E222B', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2A303C' },
  rutinaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rutinaNombre: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#FFFFFF', marginRight: 8 },
  rutinaDetalle: { color: '#9CA3AF', fontSize: 13, marginTop: 2, marginBottom: 10 },
  rutinaEjercicio: { color: '#D1D5DB', fontSize: 14, paddingVertical: 2 },
  badge: { backgroundColor: '#2A303C', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  badgePropia: { backgroundColor: '#FF5722' },
  badgeTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  borrarBoton: { alignSelf: 'flex-start', marginTop: 12 },
  borrarTexto: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  fabTexto: { color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '300' },

  modal: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  cerrarBoton: { padding: 8, marginRight: 8 },
  cerrarTexto: { color: '#FFFFFF', fontSize: 20 },
  modalTitulo: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  input: { backgroundColor: '#1E222B', borderWidth: 1, borderColor: '#2A303C', borderRadius: 10, color: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  ayuda: { color: '#9CA3AF', fontSize: 13, marginTop: 10, marginBottom: 4 },
  zonaTitulo: { color: '#FF5722', fontWeight: 'bold', fontSize: 15, marginTop: 16, marginBottom: 8 },
  opcion: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E222B', borderRadius: 12, borderWidth: 1, borderColor: '#2A303C', padding: 12, marginBottom: 8 },
  opcionElegida: { borderColor: '#FF5722' },
  opcionNombre: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  circulo: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#4B5563', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  circuloElegido: { backgroundColor: '#FF5722', borderColor: '#FF5722' },
  circuloTexto: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

  modalFooter: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2A303C' },
  footerTexto: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  guardarBoton: { backgroundColor: '#FF5722', padding: 16, borderRadius: 12, alignItems: 'center' },
  guardarTexto: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});