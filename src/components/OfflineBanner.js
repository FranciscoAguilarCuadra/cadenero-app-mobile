import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { isOnline, onConnectivityChange } from "../services/connectivity";
import { contarPendientes } from "../services/localCache";
import { onSyncProgress } from "../services/syncService";

export default function OfflineBanner() {
    const [online, setOnline] = useState(isOnline());
    const [pendientes, setPendientes] = useState(0);
    const [sincronizando, setSincronizando] = useState(false);
    const [sincronizadas, setSincronizadas] = useState(0);

    useEffect(() => {
        const unsub = onConnectivityChange(setOnline);
        return unsub;
    }, []);

    useEffect(() => {
        let mounted = true;

        async function cargar() {
            const count = await contarPendientes();
            if (mounted) setPendientes(count);
        }

        cargar();

        const unsubSync = onSyncProgress(({ pendientes: p, completadas: c, total }) => {
            if (!mounted) return;

            if (total === 0) {
                setSincronizando(false);
                setSincronizadas(0);
                setPendientes(0);
            } else {
                setSincronizando(true);
                setPendientes(p);
                setSincronizadas(c);
            }
        });

        return () => {
            mounted = false;
            unsubSync();
        };
    }, [online]);

    if (sincronizando) {
        return (
            <View style={[styles.banner, styles.syncing]} accessibilityRole="status">
                <View style={[styles.dot, styles.dotLight]} />
                <Text style={styles.textLight}>
                    Sincronizando… {sincronizadas} de {sincronizadas + pendientes}
                </Text>
            </View>
        );
    }

    if (!online && pendientes > 0) {
        return (
            <View style={[styles.banner, styles.pending]} accessibilityRole="status">
                <View style={[styles.dot, styles.dotLight]} />
                <Text style={styles.textLight}>
                    Sin conexión — {pendientes} cambio{pendientes !== 1 ? "s" : ""}{" "}
                    pendiente{pendientes !== 1 ? "s" : ""}
                </Text>
            </View>
        );
    }

    if (!online) {
        return (
            <View style={[styles.banner, styles.offline]} accessibilityRole="status">
                <View style={[styles.dot, styles.dotDark]} />
                <Text style={styles.textDark}>
                    Sin conexión — los cambios se guardarán localmente
                </Text>
            </View>
        );
    }

    if (pendientes > 0) {
        return (
            <View style={[styles.banner, styles.pending]} accessibilityRole="status">
                <View style={[styles.dot, styles.dotLight]} />
                <Text style={styles.textLight}>
                    {pendientes} cambio{pendientes !== 1 ? "s" : ""} pendiente
                    {pendientes !== 1 ? "s" : ""} de sincronizar
                </Text>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    offline: {
        backgroundColor: "#F59E0B",
    },
    pending: {
        backgroundColor: "#F97316",
    },
    syncing: {
        backgroundColor: "#3B82F6",
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotDark: {
        backgroundColor: "#1A1A1A",
    },
    dotLight: {
        backgroundColor: "#FFFFFF",
    },
    textDark: {
        fontSize: 13,
        fontWeight: "500",
        color: "#1A1A1A",
        textAlign: "center",
    },
    textLight: {
        fontSize: 13,
        fontWeight: "500",
        color: "#FFFFFF",
        textAlign: "center",
    },
});
