import React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AuthNavigator from "./src/components/AuthNavigator";



export default function App() {

  return (

    <SafeAreaProvider>
      <View style={styles.container}>

        <AuthNavigator />

      </View>
    </SafeAreaProvider>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#0f172a',

  },

});
