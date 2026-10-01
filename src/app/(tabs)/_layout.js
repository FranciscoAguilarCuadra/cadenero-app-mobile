import { Redirect, Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Header from "../../components/Header";
import { useApp } from "../../context/AppContext";
import { isSupabaseConfigured } from "../../supabase";
import { colores } from "../../theme";

export default function TabsLayout() {
    const { cargandoAuth, sesion, perfil, manejarLogout } = useApp();

    if (cargandoAuth) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingText}>Cargando sesión...</Text>
            </View>
        );
    }

    if (isSupabaseConfigured && (!sesion || !perfil?.activo)) {
        return <Redirect href="/login" />;
    }

    return (
        <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={() => <Header usuario={perfil} onLogout={manejarLogout} />}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="historial" />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colores.background,
    },
    loadingText: {
        color: colores.textSecondary,
    },
});
