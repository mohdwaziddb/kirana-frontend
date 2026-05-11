import React from 'react';

import { StyleSheet, View, Text } from 'react-native';

import AuthNavigator from "./src/components/AuthNavigator";



export default function App() {

  return (

    <View style={styles.container}>

      <AuthNavigator />

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: '#0f172a',

  },

});