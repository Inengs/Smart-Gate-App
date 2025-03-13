import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { ref, set, onValue } from 'firebase/database';
import { database, auth } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';



const HomeScreen = () => {
  const [gateStatus, setGateStatus] = useState('closed');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/LoginScreen')
      }
    })
    const gateStatusRef = ref(database, 'gates/main-gate/status');
    const gateUnsubscribe = onValue(gateStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        setGateStatus(snapshot.val());
      }
    });

    return () => { unsubscribe(); gateUnsubscribe(); }
  }, []);

  const controlGate = async (command) => {
    setLoading(true);

    try {
      // Send command to the gate
      await set(ref(database, 'gates/main-gate/command'), command);
      setGateStatus(command.toLowerCase() === 'open' ? 'opening' : 'closing')

      // simulating a status change after a delay (this simulated a real app that can listen for status updates)
      setTimeout(() => {
        setGateStatus(command.toLowerCase() === 'open' ? 'open' : 'closed')
      }, 2000);
    } catch (error) {
      console.error("Error controlling gate: ", error);
      alert("Failed to control gate");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // No need to navigate - _layout.jsx will handle this based on auth state
    } catch (error) {
      alert("Error signing out: " + error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text>Gate Status</Text>
          <Text style={[
            styles.statusValue,
            gateStatus === 'open' ? styles.statusOpen : gateStatus === 'closed' ? styles.statusClosed : styles.statusTransitioning
          ]}>
            {gateStatus.toUpperCase()}
          </Text>
        </Card.Content>
      </Card>

      <View>
        <Button
          mode="contained"
          onPress={() => controlGate('OPEN')}
          disabled={gateStatus === 'open' || gateStatus === 'opening' || loading}
          style={[styles.button, styles.openButton]}
          loading={loading && gateStatus === 'opening'}
        >
          Open Gate
        </Button>

        <Button
          mode="contained"
          onPress={() => controlGate('CLOSE')}
          disabled={gateStatus === 'closed' || gateStatus === 'closing' || loading}
          style={[styles.button, styles.closeButton]}
          loading={loading && gateStatus === 'closing'}
        >
          Close Gate
        </Button>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusOpen: {
    color: 'green',
  },
  statusClosed: {
    color: 'red',
  },
  statusTransitioning: {
    color: 'orange',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  button: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  openButton: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    backgroundColor: '#F44336',
  },
  logoutButton: {
    marginTop: 16,
  }
});

export default HomeScreen;





































































