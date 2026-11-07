import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import EjerciciosScreen from './src/screens/EjerciciosScreen';
import TareasScreen from './src/screens/TareasScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import IniciarScreen from './src/screens/Iniciar';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#FF5722', // Naranja neón cuando está activo
          tabBarInactiveTintColor: '#6B7280', // Gris para inactivos
          tabBarStyle: {
            backgroundColor: '#181A20', // Fondo oscuro para la barra inferior
            borderTopColor: '#2A303C',   // Línea divisoria sutil
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerStyle: { backgroundColor: '#181A20' }, // Fondo oscuro para la cabecera
          headerTintColor: '#FFFFFF',                   // Texto blanco en la cabecera
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Tab.Screen name="EJERCICIOS" component={EjerciciosScreen} />
        <Tab.Screen name="TAREAS" component={TareasScreen} />
        <Tab.Screen name="AGENDA" component={AgendaScreen} />
        <Tab.Screen name="PERFIL" component={PerfilScreen} />
        <Tab.Screen name ="INICIAR" component={IniciarScreen}/>
      </Tab.Navigator>
    </NavigationContainer>
  );
}