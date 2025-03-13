import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Button, Text, Card, Avatar, Divider, List, ActivityIndicator } from 'react-native-paper';
import { ref, set, onValue, query, orderByChild, limitToLast, get } from 'firebase/database';
import { database, auth } from '../../src/firebaseConfig';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';



const HomeScreen = () => {
  const [gateStatus, setGateStatus] = useState('closed');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const router = useRouter();

  const fetchRecentLogs = async () => {
    setLogsLoading(true);
    try {
      const logsRef = query(
        ref(database, 'logs'),
        orderByChild('timestamp'),
        limitToLast(10),
      );

      const snapshot = await get(logsRef);

      if (snapshot.exists()) {
        const logsData = [];
        snapshot.forEach((childSnapshot) => {
          logsData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });

        // sort logs in descending order (newest first)
        setRecentLogs(logsData.reverse());
      } else {
        setRecentLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/LoginScreen')
      } else {
        setUser(currentUser)
      }
    })
    const gateStatusRef = ref(database, 'gates/main-gate/status');
    const gateUnsubscribe = onValue(gateStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        setGateStatus(snapshot.val());
      }
    });

    // Fetch recent logs when component mounts
    fetchRecentLogs();

    return () => { unsubscribe(); gateUnsubscribe(); }
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchRecentLogs()
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const controlGate = async (command) => {
    setLoading(true);

    try {
      // Send command to the gate
      await set(ref(database, 'gates/main-gate/command'), command);
      setGateStatus(command.toLowerCase() === 'open' ? 'opening' : 'closing')

      // Log the gate operation
      const newLogRef = ref(database, `logs/${Date.now()}`);
      await set(newLogRef, {
        action: `Gate ${command.toLowerCase()}`,
        userId: user?.email || 'unknown',
        timestamp: Date.now(),
        success: true
      });

      // simulating a status change after a delay (this simulated a real app that can listen for status updates)
      setTimeout(() => {
        setGateStatus(command.toLowerCase() === 'open' ? 'open' : 'closed')
        // Refresh logs to show the new entry
        fetchRecentLogs();
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
  };

  const formatTimeStamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Gate Dashboard</Text>
        <Button mode="text" onPress={handleLogout} style={styles.logoutButton}>Logout</Button>
      </View>

      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* <View style={styles.container}> */}

        <Card style={styles.statusCard}>
          <Card.Content>
            <Text style={styles.statusTitle}>Gate Status</Text>
            <Text style={[
              styles.statusValue,
              gateStatus === 'open' ? styles.statusOpen : gateStatus === 'closed' ? styles.statusClosed : styles.statusTransitioning
            ]}>
              {gateStatus.toUpperCase()}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
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
        </View>

        <Card style={styles.logsCard}>
          <Card.Title title="Recent Activity" />
          <Card.Content>
            {logsLoading ? (
              <ActivityIndicator size={'small'} style={styles.logsLoading} />
            ) : recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <List.Item
                  key={log.id}
                  title={log.action}
                  description={formatTimeStamp(log.timestamp)}
                  left={props => (
                    <Avatar.Icon
                      {...props}
                      size={40}
                      icon={log.action.includes('open') ? "door-open" : "door-closed"}
                      style={{ backgroundColor: log.action.includes('open') ? '#4CAF50' : '#F44336' }}
                    />
                  )}
                  right={props => (
                    <Text {...props} style={styles.logUser}>
                      {log.userId?.split('@')[0] || 'unknown'}
                    </Text>
                  )}
                />
              ))
            ) : (
              <Text style={styles.noLogsText}>No recent activity</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 24,
    elevation: 4,
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
  },
  logsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  logsLoading: {
    marginVertical: 16,
  },
  noLogsText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#757575',
  },
  logUser: {
    color: '#666',
    alignSelf: 'center',
  },
});

export default HomeScreen;

