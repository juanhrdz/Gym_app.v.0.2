import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Usuario from '../models/Usuario';
import { cargarUsuario, guardarUsuario, borrarUsuario } from '../services/UsuarioStorage';

// Datos iniciales la primera vez que se abre la app
const crearUsuarioInicial = () =>
  new Usuario({ nombre: 'Usuario Gym', edad: 25, estatura: 175, peso: 75, sexo: 'Masculino' });

export default function PerfilScreen() {
  const [usuario, setUsuario] = useState(null);
  const [pesoTexto, setPesoTexto] = useState('');

  useEffect(() => {
    (async () => {
      let guardado = await cargarUsuario();
      if (!guardado) {
        guardado = crearUsuarioInicial();
        await guardarUsuario(guardado);
      }
      setUsuario(guardado);
      setPesoTexto(String(guardado.peso));
    })();
  }, []);

  const actualizarPeso = async () => {
    const kg = parseFloat(pesoTexto.replace(',', '.'));
    try {
      const actualizado = usuario.clonar({ peso: kg });
      setUsuario(actualizado);
      await guardarUsuario(actualizado);
      Alert.alert('Peso actualizado', `Ahora registras ${kg} kg.`);
    } catch (error) {
      Alert.alert('Dato inválido', 'Escribe un peso válido en kg.');
      setPesoTexto(String(usuario.peso));
    }
  };

  const cerrarSesion = async () => {
    await borrarUsuario();
    const nuevo = crearUsuarioInicial();
    await guardarUsuario(nuevo);
    setUsuario(nuevo);
    setPesoTexto(String(nuevo.peso));
    Alert.alert('Cerrar Sesión', 'Has salido de tu cuenta.');
  };

  if (!usuario) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.userName}>{usuario.nombre}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>🎂 Edad: <Text style={styles.infoValue}>{usuario.edad} años</Text></Text>
        <Text style={styles.infoText}>⚖️ Peso: <Text style={styles.infoValue}>{usuario.peso} kg</Text></Text>
        <Text style={styles.infoText}>📏 Estatura: <Text style={styles.infoValue}>{usuario.estatura} cm</Text></Text>
        <Text style={styles.infoText}>🚻 Sexo: <Text style={styles.infoValue}>{usuario.sexo}</Text></Text>
        <Text style={styles.infoText}>📊 IMC: <Text style={styles.infoValue}>{usuario.imc} ({usuario.categoriaImc})</Text></Text>
        <Text style={styles.infoText}>🍽️ Metabolismo basal: <Text style={styles.infoValue}>{usuario.tmb} kcal/día</Text></Text>
        {/* Estos dos siguen fijos hasta conectar el pedómetro y el historial */}
        <Text style={styles.infoText}>🔥 Calorías quemadas: <Text style={styles.infoValue}>450 kcal</Text></Text>
        <Text style={[styles.infoText, styles.ultimo]}>👟 Pasos (Pedometer): <Text style={styles.infoValue}>6,420</Text></Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Actualizar peso (kg)</Text>
        <View style={styles.filaPeso}>
          <TextInput
            style={styles.input}
            value={pesoTexto}
            onChangeText={setPesoTexto}
            keyboardType="decimal-pad"
            placeholder="75"
            placeholderTextColor="#6B7280"
          />
          <TouchableOpacity style={styles.guardarButton} onPress={actualizarPeso}>
            <Text style={styles.guardarButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  centrado: { justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginVertical: 20 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E222B',
    borderWidth: 2,
    borderColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 40 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  infoCard: { backgroundColor: '#1E222B', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#2A303C' },
  infoText: { fontSize: 16, marginBottom: 12, color: '#9CA3AF' },
  ultimo: { marginBottom: 0 },
  infoValue: { color: '#FFFFFF', fontWeight: 'bold' },
  filaPeso: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#181A20',
    borderWidth: 1,
    borderColor: '#2A303C',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  guardarButton: { backgroundColor: '#FF5722', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  guardarButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 24 },
  logoutButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});