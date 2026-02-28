import { View, Text, StyleSheet, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <Text style={styles.title}>{{APP_NAME}}</Text>
        <Text style={styles.subtitle}>powered by apphouse.ai</Text>
      </View>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>get started</Text>
      </Pressable>

      <Text style={styles.footer}>ios + android + web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#111827',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    fontSize: 13,
    color: '#d1d5db',
  },
});
