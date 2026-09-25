import { StyleSheet, Text, View } from 'react-native';

export default function PlaceholderScreen({ title, owner }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {owner ? <Text style={styles.owner}>Pantalla a cargo de {owner}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '600' },
  owner: { marginTop: 8, color: '#666' },
});
