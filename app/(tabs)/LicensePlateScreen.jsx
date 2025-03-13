import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
    Button, Text, Card, TextInput, FAB,
    Dialog, Portal, Searchbar, List, ActivityIndicator,
    IconButton, Divider
} from 'react-native-paper';
import { ref, set, remove, onValue, query, orderByChild } from 'firebase/database';
import { database, auth } from '../../src/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LicensePlateScreen() {
    const [licensePlates, setLicensePlates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlateId, setCurrentPlateId] = useState(null);

    // Fetch license plates from Firebase
    useEffect(() => {
        const licensePlatesRef = query(
            ref(database, 'licensePlates'),
            orderByChild('plateNumber')
        );

        const unsubscribe = onValue(licensePlatesRef, (snapshot) => {
            setLoading(true);
            if (snapshot.exists()) {
                const platesData = [];
                snapshot.forEach((childSnapshot) => {
                    platesData.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                setLicensePlates(platesData);
            } else {
                setLicensePlates([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter license plates based on search query
    const filteredPlates = licensePlates.filter(plate =>
        plate.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plate.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Add or update a license plate
    const saveLicensePlate = async () => {
        if (!plateNumber.trim() || !ownerName.trim()) {
            Alert.alert("Error", "Plate number and owner name are required");
            return;
        }

        try {
            // Create a unique ID or use existing when editing
            const plateId = isEditing ? currentPlateId : Date.now().toString();

            await set(ref(database, `licensePlates/${plateId}`), {
                plateNumber: plateNumber.trim().toUpperCase(),
                ownerName: ownerName.trim(),
                createdAt: isEditing ? undefined : Date.now(),
                updatedAt: Date.now()
            });

            resetForm();
            setDialogVisible(false);

            Alert.alert(
                isEditing ? "Plate Updated" : "Plate Added",
                `License plate ${plateNumber.toUpperCase()} has been ${isEditing ? 'updated' : 'added'} successfully`
            );
        } catch (error) {
            console.error("Error saving license plate:", error);
            Alert.alert("Error", `Failed to ${isEditing ? 'update' : 'add'} license plate`);
        }
    };

    // Delete a license plate
    const deleteLicensePlate = (plateId, plateNumber) => {
        Alert.alert(
            "Delete License Plate",
            `Are you sure you want to delete ${plateNumber}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await remove(ref(database, `licensePlates/${plateId}`));
                            Alert.alert("Success", "License plate deleted successfully");
                        } catch (error) {
                            console.error("Error deleting license plate:", error);
                            Alert.alert("Error", "Failed to delete license plate");
                        }
                    }
                }
            ]
        );
    };

    // Edit a license plate
    const editLicensePlate = (plate) => {
        setIsEditing(true);
        setCurrentPlateId(plate.id);
        setPlateNumber(plate.plateNumber);
        setOwnerName(plate.ownerName);
        setDialogVisible(true);
    };

    // Reset form fields
    const resetForm = () => {
        setPlateNumber('');
        setOwnerName('');
        setIsEditing(false);
        setCurrentPlateId(null);
    };

    // Render a license plate item
    const renderPlateItem = ({ item }) => (
        <>
            <List.Item
                title={item.plateNumber}
                description={item.ownerName}
                left={props => <List.Icon {...props} icon="car" />}
                right={props => (
                    <View style={styles.plateActions}>
                        <IconButton
                            {...props}
                            icon="pencil"
                            onPress={() => editLicensePlate(item)}
                        />
                        <IconButton
                            {...props}
                            icon="delete"
                            onPress={() => deleteLicensePlate(item.id, item.plateNumber)}
                        />
                    </View>
                )}
            />
            <Divider />
        </>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>License Plate Management</Text>
            </View>

            <View style={styles.container}>
                <Searchbar
                    placeholder="Search plates or owners"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                {loading ? (
                    <ActivityIndicator size="large" style={styles.loading} />
                ) : (
                    <>
                        <Card style={styles.plateListCard}>
                            <Card.Title title={`License Plates (${filteredPlates.length})`} />
                            <Card.Content style={styles.plateListContent}>
                                {filteredPlates.length > 0 ? (
                                    <FlatList
                                        data={filteredPlates}
                                        renderItem={renderPlateItem}
                                        keyExtractor={item => item.id}
                                    />
                                ) : (
                                    <Text style={styles.noPlatesText}>
                                        {searchQuery ? "No matching license plates found" : "No license plates added yet"}
                                    </Text>
                                )}
                            </Card.Content>
                        </Card>
                    </>
                )}

                <Portal>
                    <Dialog visible={dialogVisible} onDismiss={() => {
                        setDialogVisible(false);
                        resetForm();
                    }}>
                        <Dialog.Title>{isEditing ? "Edit License Plate" : "Add New License Plate"}</Dialog.Title>
                        <Dialog.Content>
                            <TextInput
                                label="License Plate Number"
                                value={plateNumber}
                                onChangeText={setPlateNumber}
                                mode="outlined"
                                autoCapitalize="characters"
                                style={styles.dialogInput}
                            />
                            <TextInput
                                label="Owner Name"
                                value={ownerName}
                                onChangeText={setOwnerName}
                                mode="outlined"
                                style={styles.dialogInput}
                            />
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => {
                                setDialogVisible(false);
                                resetForm();
                            }}>Cancel</Button>
                            <Button onPress={saveLicensePlate}>{isEditing ? "Update" : "Save"}</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

                <FAB
                    icon="plus"
                    style={styles.fab}
                    onPress={() => {
                        resetForm();
                        setDialogVisible(true);
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

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
        padding: 16,
    },
    searchBar: {
        marginBottom: 16,
        elevation: 4,
    },
    plateListCard: {
        flex: 1,
        marginBottom: 16,
    },
    plateListContent: {
        paddingHorizontal: 0,
    },
    plateActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    noPlatesText: {
        textAlign: 'center',
        marginVertical: 20,
        color: '#757575',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogInput: {
        marginBottom: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#2196F3',
    },
});