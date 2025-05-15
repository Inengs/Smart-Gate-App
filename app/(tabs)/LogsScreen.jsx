import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, List, ActivityIndicator, Avatar, Chip, Searchbar, Menu, Button } from 'react-native-paper';
import { ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import { database } from '../../src/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/ui/header';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';



export default function LogsScreen() {
    const colorScheme = useColorScheme();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [dateMenuVisible, setDateMenuVisible] = useState(false);
    const [dateFilter, setDateFilter] = useState('all');

    const styles = StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: Colors[colorScheme].background,
        },
        container: {
            flex: 1,
            padding: 16,
            backgroundColor: Colors[colorScheme].background,
        },
        searchBar: {
            marginBottom: 10,
            backgroundColor: '#FFFFFF',
            borderRadius: 10,
            elevation: 2,
        },
        filterRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        chipContainer: {
            flexDirection: 'row',
        },
        chip: {
            marginRight: 8,
            backgroundColor: '#E0E0E0',
        },
        dateButton: {
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#6200EE',
            paddingHorizontal: 10,
        },
        logsCard: {
            flex: 1,
            backgroundColor: Colors[colorScheme].card,
            borderRadius: 12,
            padding: 10,
            elevation: 3,
        },
        logsContent: {
            padding: 10,
        },
        logUser: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#555',
        },
        loading: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        noLogsText: {
            textAlign: 'center',
            fontSize: 16,
            color: Colors[colorScheme].text,
            marginTop: 20,
        },
    })

    const fetchLogs = async () => {
        setLoading(true);
        console.log("Starting to fetch logs")
        try {
            const logsRef = query(
                ref(database, 'logs'),
                orderByChild('timestamp'),
                limitToLast(100)
            );

            console.log("Logs reference created: ", logsRef)
            const snapshot = await get(logsRef);
            console.log("Got snapshot, exists:", snapshot.exists());

            if (snapshot.exists()) {
                const logsData = [];
                snapshot.forEach((childSnapshot) => {
                    logsData.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });

                console.log("Logs data before sort:", logsData)
                // Sort logs in descending order (newest first)
                setLogs(logsData.reverse());
            } else {
                setLogs([]);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchLogs().finally(() => {
            setRefreshing(false);
        });
    }, []);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const applyDateFilter = (logs) => {
        if (dateFilter === 'all') return logs;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000; // 24 hours in milliseconds
        const thisWeek = today - 604800000; // 7 days in milliseconds

        return logs.filter(log => {
            if (dateFilter === 'today') {
                return log.timestamp >= today;
            } else if (dateFilter === 'yesterday') {
                return log.timestamp >= yesterday && log.timestamp < today;
            } else if (dateFilter === 'thisWeek') {
                return log.timestamp >= thisWeek;
            }
            return true;
        });
    };

    const applyActionFilter = (logs) => {
        if (activeFilter === 'all') return logs;

        return logs.filter(log => {
            if (activeFilter === 'open') {
                return log.action.toLowerCase().includes('open');
            } else if (activeFilter === 'close') {
                return log.action.toLowerCase().includes('close');
            }
            return true;
        });
    };

    const applySearchFilter = (logs) => {
        if (!searchQuery) return logs;

        return logs.filter(log =>
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.userId.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filteredLogs = applySearchFilter(applyActionFilter(applyDateFilter(logs)));

    const renderLogItem = ({ item }) => (
        <List.Item
            title={item.action}
            description={formatTimestamp(item.timestamp)}
            left={props => (
                <Avatar.Icon
                    {...props}
                    size={40}
                    icon={item.action.toLowerCase().includes('open') ? "door-open" : "door-closed"}
                    style={{
                        backgroundColor: item.action.toLowerCase().includes('open') ? '#4CAF50' : '#F44336'
                    }}
                />
            )}
            right={props => (
                <Text {...props} style={styles.logUser}>
                    {item.userId?.split('@')[0] || 'unknown'}
                </Text>
            )}
        />
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header title="Activity Logs" />

            <View style={styles.container}>
                <Searchbar
                    placeholder="Search logs"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                <View style={styles.filterRow}>
                    <View style={styles.chipContainer}>
                        <Chip
                            selected={activeFilter === 'all'}
                            onPress={() => setActiveFilter('all')}
                            style={styles.chip}
                        >
                            All
                        </Chip>
                        <Chip
                            selected={activeFilter === 'open'}
                            onPress={() => setActiveFilter('open')}
                            style={styles.chip}
                        >
                            Open
                        </Chip>
                        <Chip
                            selected={activeFilter === 'close'}
                            onPress={() => setActiveFilter('close')}
                            style={styles.chip}
                        >
                            Close
                        </Chip>
                    </View>

                    <Menu
                        visible={dateMenuVisible}
                        onDismiss={() => setDateMenuVisible(false)}
                        anchor={
                            <Button
                                mode="outlined"
                                onPress={() => setDateMenuVisible(true)}
                                icon="calendar"
                                style={styles.dateButton}
                            >
                                {dateFilter === 'all' ? 'All Time' :
                                    dateFilter === 'today' ? 'Today' :
                                        dateFilter === 'yesterday' ? 'Yesterday' : 'This Week'}
                            </Button>
                        }
                    >
                        <Menu.Item onPress={() => {
                            setDateFilter('all');
                            setDateMenuVisible(false);
                        }} title="All Time" />
                        <Menu.Item onPress={() => {
                            setDateFilter('today');
                            setDateMenuVisible(false);
                        }} title="Today" />
                        <Menu.Item onPress={() => {
                            setDateFilter('yesterday');
                            setDateMenuVisible(false);
                        }} title="Yesterday" />
                        <Menu.Item onPress={() => {
                            setDateFilter('thisWeek');
                            setDateMenuVisible(false);
                        }} title="This Week" />
                    </Menu>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" style={styles.loading} />
                ) : (
                    <Card style={styles.logsCard}>
                        <Card.Title title={`Activity Logs (${filteredLogs.length})`} />
                        <Card.Content style={styles.logsContent}>
                            {filteredLogs.length > 0 ? (
                                <FlatList
                                    data={filteredLogs}
                                    renderItem={renderLogItem}
                                    keyExtractor={item => item.id}
                                    refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                                    }
                                />
                            ) : (
                                <Text style={styles.noLogsText}>
                                    {searchQuery || activeFilter !== 'all' || dateFilter !== 'all'
                                        ? "No logs match your filters"
                                        : "No activity logs available"}
                                </Text>
                            )}
                        </Card.Content>
                    </Card>
                )}
            </View>
        </SafeAreaView>
    );
}



