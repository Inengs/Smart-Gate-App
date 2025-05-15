import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Button, Text, Card, Avatar, List, ActivityIndicator } from 'react-native-paper';
import { ref, set, onValue, query, orderByChild, limitToLast, get } from 'firebase/database';
import { database, auth } from '../../src/firebaseConfig';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/ui/header';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Factory function to create styles
const createStyles = (colorScheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: Colors[colorScheme].background,
    },
    statusCard: {
      marginBottom: 24,
      backgroundColor: Colors[colorScheme].card,
      elevation: 4,
    },
    statusTitle: {
      fontSize: 18,
      marginBottom: 8,
      color: Colors[colorScheme].text,
    },
    statusValue: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: Colors[colorScheme].text,
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
      backgroundColor: Colors[colorScheme].primary,
    },
    closeButton: {
      backgroundColor: '#F44336',
    },
    logsCard: {
      marginBottom: 16,
      backgroundColor: Colors[colorScheme].card,
      elevation: 4,
    },
    logsLoading: {
      marginVertical: 16,
    },
    noLogsText: {
      textAlign: 'center',
      marginVertical: 16,
      color: Colors[colorScheme].text,
      opacity: 0.7,
    },
    logUser: {
      color: Colors[colorScheme].text,
      opacity: 0.7,
      alignSelf: 'center',
    },
  });

const HomeScreen = () => {
  const colorScheme = useColorScheme();
  const styles = React.useMemo(() => createStyles(colorScheme), [colorScheme]);
  const [gateStatus, setGateStatus] = useState('closed');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  const fetchRecentLogs = async () => {
    setLogsLoading(true);
    try {
      const logsRef = query(ref(database, 'logs'), orderByChild('timestamp'), limitToLast(10));
      const snapshot = await get(logsRef);
      if (snapshot.exists()) {
        const logsData = [];
        snapshot.forEach((childSnapshot) => {
          logsData.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setRecentLogs(logsData.reverse());
      } else {
        setRecentLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    console.log('HomeScreen useEffect, auth.currentUser:', auth.currentUser);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state:", currentUser ? { email: currentUser.email, uid: currentUser.uid } : "No user");
      if (!currentUser) {
        setUser(null);
        setAuthLoading(false);
        router.replace('/login');
      } else {
        setUser(currentUser);
        setAuthLoading(false);
        const checkRole = async () => {
          try {
            const userRef = ref(database, `users/${currentUser.uid}`);
            const snapshot = await get(userRef);
            console.log("User role:", snapshot.val()?.role || "No role defined");
          } catch (error) {
            console.error("Error fetching user role:", error);
          }
        };
        checkRole();
      }
    });

    const gateStatusRef = ref(database, 'gates/main-gate/status');
    const gateUnsubscribe = onValue(
      gateStatusRef,
      (snapshot) => {
        setGateStatus(snapshot.val() || 'closed');
      },
      (error) => {
        console.error("Error listening to gate status:", error);
      }
    );

    fetchRecentLogs();
    return () => {
      unsubscribe();
      gateUnsubscribe();
    };
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchRecentLogs().then(() => setRefreshing(false));
  }, []);

  const controlGate = async (action, retries = 2) => {
    console.log("controlGate called with action:", action);
    console.log("Current user:", user ? { email: user.email, uid: user.uid } : "No user");
    if (!user || !user.uid) {
      setLoading(false);
      console.error("No authenticated user. Redirecting to login.");
      alert("You must be logged in to control the gate. Please sign in again.");
      router.replace('/login');
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
      console.error("Operation timed out for action:", action);
      alert("Operation timed out. Please check your network or Firebase configuration.");
    }, 10000);

    try {
      console.log(`Sending ${action} command for user: ${user.email} (UID: ${user.uid})`);

      const commandRef = ref(database, 'gates/main-gate/command');
      const timestamp = Date.now();
      const commandData = {
        action: action.toLowerCase(),
        timestamp,
        triggeredBy: user.uid
      };
      let commandWritten = false;
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`Attempt ${attempt} - Writing command to Firebase:`, commandData);
          await set(commandRef, commandData);
          console.log(`Successfully wrote ${action} command to Firebase`);
          commandWritten = true;
          break;
        } catch (error) {
          console.error(`Attempt ${attempt} failed for ${action}:`, error);
          if (attempt === retries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!commandWritten) {
        throw new Error("Failed to write command after all retries");
      }

      setGateStatus(action.toLowerCase() === 'open' ? 'opening' : 'closing');

      const logRef = ref(database, `logs/${timestamp}`);
      const logData = {
        plate: 'manual',
        action: `Gate ${action.toLowerCase()}`,
        timestamp,
        userId: user.email || 'unknown',
        success: true
      };
      console.log("Writing log to Firebase:", logData);
      await set(logRef, logData);
      console.log("Log written successfully");

      const gateStatusRef = ref(database, 'gates/main-gate/status');
      onValue(
        gateStatusRef,
        (snapshot) => {
          const newStatus = snapshot.val() || 'closed';
          console.log(`Received status update: ${newStatus}`);
          setGateStatus(newStatus);
          clearTimeout(timeout);
          setLoading(false);
          fetchRecentLogs();
        },
        { onlyOnce: true },
        (error) => {
          console.error("Error listening for status update:", error);
          clearTimeout(timeout);
          setLoading(false);
          alert(`Failed to receive status update: ${error.message}`);
        }
      );
    } catch (error) {
      console.error(`Error controlling gate (${action}):`, error);
      clearTimeout(timeout);
      setLoading(false);
      alert(`Failed to control gate: ${error.code ? `${error.code} - ${error.message}` : error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out: " + error.message);
    }
  };

  const testANPR = async () => {
    setLoading(true);
    try {
      console.log("Testing ANPR write");
      await set(ref(database, 'gates/main-gate/command'), {
        action: 'close',
        timestamp: Date.now(),
        triggeredBy: 'ANPR'
      });
      console.log("ANPR test write successful");
      alert("ANPR test write successful");
    } catch (error) {
      console.error("ANPR test write failed:", error);
      alert(`ANPR test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleString();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Smart Gate Dashboard" />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.statusCard} elevation={4}>
          <Card.Content>
            <Text style={styles.statusTitle}>Gate Status</Text>
            <Text
              style={[
                styles.statusValue,
                gateStatus === 'open' ? styles.statusOpen : gateStatus === 'closed' ? styles.statusClosed : styles.statusTransitioning,
              ]}
            >
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
          <Button
            mode="contained"
            onPress={testANPR}
            disabled={loading}
            style={[styles.button, { backgroundColor: '#2196F3' }]}
          >
            Test ANPR Close
          </Button>
        </View>

        <Card style={styles.logsCard} elevation={4}>
          <Card.Title title="Recent Activity" />
          <Card.Content>
            {logsLoading ? (
              <ActivityIndicator size="small" style={styles.logsLoading} />
            ) : recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <List.Item
                  key={log.id}
                  title={`${log.plate !== 'manual' ? `${log.plate} - ` : ''}${log.action}`}
                  description={formatTimestamp(log.timestamp)}
                  left={(props) => (
                    <Avatar.Icon
                      {...props}
                      size={40}
                      icon={log.action.includes('open') ? 'door-open' : 'door-closed'}
                      style={{ backgroundColor: log.action.includes('open') ? '#4CAF50' : '#F44336' }}
                    />
                  )}
                  right={(props) => <Text {...props} style={styles.logUser}>{log.userId?.split('@')[0] || log.userId || 'unknown'}</Text>}
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

export default HomeScreen;



// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
// import { Button, Text, Card, Avatar, Divider, List, ActivityIndicator } from 'react-native-paper';
// import { ref, set, onValue, query, orderByChild, limitToLast, get } from 'firebase/database';
// import { database, auth } from '../../src/firebaseConfig';
// import { useRouter } from 'expo-router';
// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { SafeAreaView } from 'react-native-safe-area-context';



// const HomeScreen = () => {
//   const [gateStatus, setGateStatus] = useState('closed');
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [user, setUser] = useState(null);
//   const [recentLogs, setRecentLogs] = useState([]);
//   const [logsLoading, setLogsLoading] = useState(true);
//   const router = useRouter();

//   const fetchRecentLogs = async () => {
//     setLogsLoading(true);
//     try {
//       const logsRef = query(ref(database, 'logs'), orderByChild('timestamp'), limitToLast(10));
//       const snapshot = await get(logsRef);
//       if (snapshot.exists()) {
//         const logsData = [];
//         snapshot.forEach((childSnapshot) => {
//           logsData.push({ id: childSnapshot.key, ...childSnapshot.val() });
//         });
//         setRecentLogs(logsData.reverse());
//       } else {
//         setRecentLogs([]);
//       }
//     } catch (error) {
//       console.error("Error fetching logs:", error);
//     } finally {
//       setLogsLoading(false);
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       if (!currentUser) router.replace('/login');
//       else setUser(currentUser);
//     });

//     const gateStatusRef = ref(database, 'gates/main-gate/status');
//     const gateUnsubscribe = onValue(gateStatusRef, (snapshot) => {
//       setGateStatus(snapshot.val() || 'closed');
//     });

//     fetchRecentLogs();
//     return () => {
//       unsubscribe();
//       gateUnsubscribe();
//     };
//   }, []);

//   const onRefresh = React.useCallback(() => {
//     setRefreshing(true);
//     fetchRecentLogs().then(() => setRefreshing(false));
//   }, []);

//   const controlGate = async (action) => {
//     setLoading(true); x
//     try {
//       const commandRef = ref(database, 'gates/main-gate/command');
//       const timestamp = Date.now();
//       await set(commandRef, {
//         action: action.toLowerCase(),
//         timestamp,
//         triggeredBy: user?.uid || 'unknown',
//       });

//       setGateStatus(action.toLowerCase() === 'open' ? 'opening' : 'closing');

//       const logRef = ref(database, `logs/${timestamp}`);
//       await set(logRef, {
//         plate: 'manual',
//         action: `Gate ${action.toLowerCase()}`,
//         timestamp,
//         userId: user?.email || 'unknown',
//         success: true,
//       });

//       // Raspberry Pi will update status; this is just for UI feedback
//       setTimeout(() => fetchRecentLogs(), 2000);
//     } catch (error) {
//       console.error("Error controlling gate:", error);
//       alert("Failed to control gate");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//     } catch (error) {
//       alert("Error signing out: " + error.message);
//     }
//   };

//   const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleString();

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Smart Gate Dashboard</Text>
//         <Button mode="text" onPress={handleLogout}>Logout</Button>
//       </View>
//       <ScrollView
//         style={styles.container}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//       >
//         <Card style={styles.statusCard}>
//           <Card.Content>
//             <Text style={styles.statusTitle}>Gate Status</Text>
//             <Text
//               style={[
//                 styles.statusValue,
//                 gateStatus === 'open' ? styles.statusOpen : gateStatus === 'closed' ? styles.statusClosed : styles.statusTransitioning,
//               ]}
//             >
//               {gateStatus.toUpperCase()}
//             </Text>
//           </Card.Content>
//         </Card>

//         <View style={styles.buttonContainer}>
//           <Button
//             mode="contained"
//             onPress={() => controlGate('OPEN')}
//             disabled={gateStatus === 'open' || gateStatus === 'opening' || loading}
//             style={[styles.button, styles.openButton]}
//             loading={loading && gateStatus === 'opening'}
//           >
//             Open Gate
//           </Button>
//           <Button
//             mode="contained"
//             onPress={() => controlGate('CLOSE')}
//             disabled={gateStatus === 'closed' || gateStatus === 'closing' || loading}
//             style={[styles.button, styles.closeButton]}
//             loading={loading && gateStatus === 'closing'}
//           >
//             Close Gate
//           </Button>
//         </View>

//         <Card style={styles.logsCard}>
//           <Card.Title title="Recent Activity" />
//           <Card.Content>
//             {logsLoading ? (
//               <ActivityIndicator size="small" style={styles.logsLoading} />
//             ) : recentLogs.length > 0 ? (
//               recentLogs.map((log) => (
//                 <List.Item
//                   key={log.id}
//                   title={`${log.plate !== 'manual' ? `${log.plate} - ` : ''}${log.action}`}
//                   description={formatTimestamp(log.timestamp)}
//                   left={(props) => (
//                     <Avatar.Icon
//                       {...props}
//                       size={40}
//                       icon={log.action.includes('open') ? 'door-open' : 'door-closed'}
//                       style={{ backgroundColor: log.action.includes('open') ? '#4CAF50' : '#F44336' }}
//                     />
//                   )}
//                   right={(props) => <Text {...props} style={styles.logUser}>{log.userId?.split('@')[0] || log.userId || 'unknown'}</Text>}
//                 />
//               ))
//             ) : (
//               <Text style={styles.noLogsText}>No recent activity</Text>
//             )}
//           </Card.Content>
//         </Card>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   statusCard: {
//     marginBottom: 24,
//     elevation: 4,
//   },
//   statusTitle: {
//     fontSize: 18,
//     marginBottom: 8,
//   },
//   statusValue: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   statusOpen: {
//     color: 'green',
//   },
//   statusClosed: {
//     color: 'red',
//   },
//   statusTransitioning: {
//     color: 'orange',
//   },
//   buttonContainer: {
//     flexDirection: 'column',
//     gap: 16,
//   },
//   button: {
//     paddingVertical: 8,
//     marginBottom: 16,
//   },
//   openButton: {
//     backgroundColor: '#4CAF50',
//   },
//   closeButton: {
//     backgroundColor: '#F44336',
//   },
//   logoutButton: {
//     marginTop: 16,
//   },
//   logsCard: {
//     marginBottom: 16,
//     elevation: 4,
//   },
//   logsLoading: {
//     marginVertical: 16,
//   },
//   noLogsText: {
//     textAlign: 'center',
//     marginVertical: 16,
//     color: '#757575',
//   },
//   logUser: {
//     color: '#666',
//     alignSelf: 'center',
//   },
// });

// export default HomeScreen;