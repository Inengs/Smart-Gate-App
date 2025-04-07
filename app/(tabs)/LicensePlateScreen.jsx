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
    const [operationLoading, setOperationLoading] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to view license plates");
            setLoading(false);
            return;
        }

        const licensePlatesRef = query(ref(database, 'licensePlates'), orderByChild('plateNumber'));
        const unsubscribe = onValue(licensePlatesRef, (snapshot) => {
            console.log("Listener triggered at:", new Date().toISOString());
            console.log("Snapshot exists:", snapshot.exists());
            console.log("Raw data:", snapshot.val());
            setLoading(true);
            const platesData = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    platesData.push({ id: childSnapshot.key, ...childSnapshot.val() });
                });
            }
            console.log("Processed plates:", platesData);
            setLicensePlates(platesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching license plates:", error);
            setLoading(false);
            Alert.alert("Error", `Failed to load license plates: ${error.message}`);
        });

        return () => unsubscribe();
    }, []);

    const filteredPlates = licensePlates.filter(plate =>
        plate.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plate.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log("searchQuery:", searchQuery);
    console.log("filteredPlates:", filteredPlates);

    const saveLicensePlate = async () => {
        if (operationLoading) return;
        if (!plateNumber.trim() || !ownerName.trim()) {
            Alert.alert("Error", "Plate number and owner name are required");
            return;
        }
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to save license plates");
            return;
        }

        const normalizedPlate = plateNumber.trim().toUpperCase();
        const existingPlate = licensePlates.find(p => p.plateNumber === normalizedPlate && p.id !== currentPlateId);
        if (existingPlate && !isEditing) {
            Alert.alert("Error", "This license plate number already exists");
            return;
        }

        setOperationLoading(true);
        try {
            const plateId = isEditing ? currentPlateId : normalizedPlate; // Use plate number as ID for simplicity
            console.log("Saving Plate:", { plateId, normalizedPlate, ownerName });
            const existingPlateData = licensePlates.find(p => p.id === plateId);

            await set(ref(database, `licensePlates/${plateId}`), {
                plateNumber: normalizedPlate,
                ownerName: ownerName.trim(),
                allowed: true, // Default to allowed for ANPR
                createdAt: isEditing ? (existingPlateData?.createdAt || Date.now()) : Date.now(),
                updatedAt: Date.now(),
                ownerUid: auth.currentUser.uid,
            });

            console.log("Plate Saved Successfully")
            resetForm();
            setDialogVisible(false);
            Alert.alert(isEditing ? "Plate Updated" : "Plate Added", `License plate ${normalizedPlate} has been ${isEditing ? 'updated' : 'added'}`);
        } catch (error) {
            console.error("Error saving license plate:", error);
            Alert.alert("Error", `Failed to ${isEditing ? 'update' : 'add'} license plate: ${error.message}`);
        } finally {
            setOperationLoading(false);
        }
    };

    const deleteLicensePlate = (plateId, plateNumber) => {
        if (operationLoading) return;
        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to delete license plates");
            return;
        }

        Alert.alert(
            "Delete License Plate",
            `Are you sure you want to delete ${plateNumber}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setOperationLoading(true);
                        try {
                            // Check if the user is the owner of this plate
                            const plateToDelete = licensePlates.find(p => p.id === plateId);
                            if (!plateToDelete) {
                                throw new Error("License plate not found");
                            }

                            // if (plateToDelete.ownerUid && plateToDelete.ownerUid !== auth.currentUser.uid) {
                            //     throw new Error("You can only delete license plates you've created");
                            // }

                            console.log(`Attempting to delete plate ID: ${plateId}`);
                            await remove(ref(database, `licensePlates/${plateId}`));
                            console.log("Delete operation completed");

                            setLicensePlates(prevPlates => prevPlates.filter(p => p.id !== plateId));

                            Alert.alert("Success", "License plate deleted successfully");
                        } catch (error) {
                            console.error("Error deleting license plate:", error);
                            Alert.alert("Error", `Failed to delete license plate: ${error.message}`);
                        } finally {
                            setOperationLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const editLicensePlate = (plate) => {
        setIsEditing(true);
        setCurrentPlateId(plate.id);
        setPlateNumber(plate.plateNumber);
        setOwnerName(plate.ownerName);
        setDialogVisible(true);
    };

    const resetForm = () => {
        setPlateNumber('');
        setOwnerName('');
        setIsEditing(false);
        setCurrentPlateId(null);
    };

    const renderPlateItem = ({ item }) => (
        <>
            <List.Item
                title={item.plateNumber}
                description={`${item.ownerName} ${item.allowed ? '(Allowed)' : '(Not Allowed)'}`}
                left={props => <List.Icon {...props} icon="car" />}
                right={props => (
                    <View style={styles.plateActions}>
                        <IconButton {...props} icon="pencil" onPress={() => editLicensePlate(item)} disabled={operationLoading} />
                        <IconButton {...props} icon="delete" onPress={() => deleteLicensePlate(item.id, item.plateNumber)} disabled={operationLoading} />
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
                                disabled={operationLoading}
                            />
                            <TextInput
                                label="Owner Name"
                                value={ownerName}
                                onChangeText={setOwnerName}
                                mode="outlined"
                                style={styles.dialogInput}
                                disabled={operationLoading}
                            />
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { setDialogVisible(false); resetForm(); }} disabled={operationLoading}>Cancel</Button>
                            <Button onPress={saveLicensePlate} disabled={operationLoading}>
                                {operationLoading ? "Saving..." : (isEditing ? "Update" : "Save")}
                            </Button>
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
                    disabled={operationLoading}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    container: { flex: 1, padding: 16 },
    searchBar: { marginBottom: 16, elevation: 4 },
    plateListCard: { flex: 1, marginBottom: 16 },
    plateListContent: { paddingHorizontal: 0 },
    plateActions: { flexDirection: 'row', alignItems: 'center' },
    noPlatesText: { textAlign: 'center', marginVertical: 20, color: '#757575' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    dialogInput: { marginBottom: 16 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#2196F3' },
});


