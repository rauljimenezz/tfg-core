import React, { useEffect } from 'react';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, View, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import App from './App';
import HomeScreenWithSwipe from './Componentes/HomeScreenWithSwipe';
import Login from './Componentes/Login';
import Register from './Componentes/Register';
import UserProfile from './Componentes/UserProfile';
import AdminPanel from './Componentes/AdminPanel';
import HelpScreen from './Componentes/HelpScreen';
import Footer from './Componentes/Footer';
import { useFocusEffect } from '@react-navigation/native';
import VehicleDetail from './Componentes/VehicleDetail'
import CreateVehicle from './Componentes/CreateVehicle';

const Stack = createStackNavigator();


const EnhancedHelpScreen = (props) => {
  const { navigation } = props;

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        navigation.navigate('Home');
      }
    });

    return unsubscribe;
  }, [navigation]);

  return <HelpScreen {...props} />;
};

const Root = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={({ navigation }) => ({
          gestureEnabled: false,
          gestureDirection: 'horizontal',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingHorizontal: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerLeftContainerStyle: { paddingLeft: 8 },
        })}
      >
        <Stack.Screen
          name="Home"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        >
          {props => (
            <ScreenWithFooter routeName="Home">
              <HomeScreenWithSwipe {...props} />
            </ScreenWithFooter>
          )}
        </Stack.Screen>

        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />

        <Stack.Screen
          name="VehicleDetail"
          options={{ title: "Detalles del vehículo" }}
        >
          {props => (
            <ScreenWithFooter routeName="VehicleDetail">
              <VehicleDetail {...props} />
            </ScreenWithFooter>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="UserProfile"
          options={{ title: "Perfil de Usuario" }}
        >
          {props => (
            <ScreenWithFooter routeName="UserProfile">
              <UserProfile {...props} />
            </ScreenWithFooter>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="AdminPanel"
          options={{
            title: 'Panel de Administración',
            gestureEnabled: true,
          }}
        >
          {props => (
            <ScreenWithFooter routeName="AdminPanel">
              <AdminPanel {...props} />
            </ScreenWithFooter>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Help"
          options={{
            title: "Ayuda",
          }}
        >
          {props => (
            <ScreenWithFooter routeName="Help">
              <EnhancedHelpScreen {...props} />
            </ScreenWithFooter>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="CreateVehicle"
          options={{ title: 'Crear Vehículo' }}
        >
          {props => (
            <ScreenWithFooter routeName="CreateVehicle">
              <CreateVehicle {...props} />
            </ScreenWithFooter>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const ScreenWithFooter = ({ children, routeName }) => {
  const hideFooter = routeName === 'Login' || routeName === 'Register';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
      {!hideFooter && <Footer />}
    </View>
  );
};

const CustomBackBehavior = ({ navigation, targetScreen = 'Home' }) => {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: targetScreen }],
          })
        );
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [navigation, targetScreen])
  );

  return null;
};

export default Root;