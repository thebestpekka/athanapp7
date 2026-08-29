import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function QuranPageview() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>This page is still in development</Text>
            <Text style={styles.subtitle}>This is the quran page.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#00383C',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'white',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
