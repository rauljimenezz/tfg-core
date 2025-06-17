import React, { useEffect } from 'react';
import { View, PanResponder, BackHandler, Alert, StyleSheet, Dimensions } from 'react-native';
import App from '../App';

const SwipeDetector = ({ children, onSwipeBack, navigation }) => {
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const currentRoute = navigation.getState().routes[navigation.getState().index].name;
        const excludedRoutes = ['Login', 'Register'];
        
        if (!excludedRoutes.includes(currentRoute)) {
          const isBottomArea = evt.nativeEvent.pageY > Dimensions.get('window').height * 0.5;
          return (
            gestureState.dx > 20 && 
            gestureState.dx > Math.abs(gestureState.dy) * 2 && 
            gestureState.moveX < 50
          );
        }
        return false;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          );
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const HomeScreenWithSwipe = (props) => {
  const { navigation } = props;
  
  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused() && navigation.getState().index === 0) {
        showExitAlert();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  const showExitAlert = () => {
    Alert.alert('Cerrar aplicación', '¿Estás seguro que deseas salir?', [
      {
        text: 'Cancelar',
        onPress: () => null,
        style: 'cancel',
      },
      { text: 'Sí', onPress: () => BackHandler.exitApp() },
    ]);
  };

  return (
    <SwipeDetector 
      onSwipeBack={showExitAlert} 
      navigation={navigation}
    >
      <App {...props} />
    </SwipeDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreenWithSwipe;