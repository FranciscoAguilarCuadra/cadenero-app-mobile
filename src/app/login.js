import { FontAwesome5 } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import {
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useApp } from "../context/AppContext";
import { isOnline, onConnectivityChange } from "../services/connectivity";
import { isSupabaseConfigured } from "../supabase";
import { colores, radio, sombra } from "../theme";

const FONDO_LOGIN =
    "https://www.chileestuyo.cl/wp-content/uploads/2020/02/Nevados-de-Chillan-1.jpg";

export default function Login() {
    const { cargandoAuth, sesion, manejarLogin } = useApp();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [online, setOnline] = useState(isOnline());

    useEffect(() => onConnectivityChange(setOnline), []);

    if (!isSupabaseConfigured || sesion) {
        return <Redirect href="/" />;
    }

    if (cargandoAuth) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingText}>Cargando sesión...</Text>
            </View>
        );
    }

    async function manejarSubmit() {
        setError("");
        setCargando(true);

        try {
            await manejarLogin(email.trim(), password);
        } catch (loginError) {
            if (!isOnline()) {
                setError("Sin conexión a internet. Conéctate para iniciar sesión.");
            } else {
                setError(
                    loginError.message || "No se pudo iniciar sesión. Revisa tus datos."
                );
            }
        } finally {
            setCargando(false);
        }
    }

    return (
        <ImageBackground
            source={{ uri: FONDO_LOGIN }}
            style={styles.page}
            imageStyle={styles.fondo}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.card}>
                            <View style={styles.header}>
                                <Text style={styles.titulo}>Cadenero</Text>
                                <Text style={styles.subtitulo}>
                                    Ingreso exclusivo para cadeneros autorizados.
                                </Text>
                            </View>

                            {!online && (
                                <View style={styles.offlineNotice}>
                                    <FontAwesome5 name="wifi" size={14} color="#92400E" solid />
                                    <Text style={styles.offlineText}>
                                        Sin conexión — necesitas internet para iniciar sesión
                                    </Text>
                                </View>
                            )}

                            <View style={styles.field}>
                                <Text style={styles.label}>Correo</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    placeholder="correo@ejemplo.com"
                                    editable={!cargando && online}
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Contraseña</Text>
                                <View style={styles.passwordRow}>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput]}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!mostrarPassword}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        editable={!cargando && online}
                                    />

                                    <Pressable
                                        style={styles.passwordToggle}
                                        onPress={() => setMostrarPassword((actual) => !actual)}
                                        disabled={!online}
                                        accessibilityLabel={
                                            mostrarPassword
                                                ? "Ocultar contraseña"
                                                : "Mostrar contraseña"
                                        }
                                    >
                                        <FontAwesome5
                                            name={mostrarPassword ? "eye-slash" : "eye"}
                                            size={18}
                                            color={colores.textSecondary}
                                            solid
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <Pressable
                                style={[
                                    styles.button,
                                    (cargando || !online) && styles.buttonDisabled,
                                ]}
                                onPress={manejarSubmit}
                                disabled={cargando || !online}
                            >
                                <Text style={styles.buttonText}>
                                    {cargando
                                        ? "Ingresando..."
                                        : online
                                          ? "Ingresar"
                                          : "Sin conexión"}
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    page: {
        flex: 1,
    },
    fondo: {
        opacity: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 18,
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        borderRadius: radio,
        ...sombra,
        padding: 22,
    },
    header: {
        marginBottom: 24,
        gap: 8,
    },
    titulo: {
        fontSize: 30,
        fontWeight: "bold",
        lineHeight: 33,
        color: colores.text,
    },
    subtitulo: {
        color: colores.textSecondary,
        lineHeight: 19,
    },
    offlineNotice: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 16,
        backgroundColor: "#FEF3C7",
        borderWidth: 1,
        borderColor: "#F59E0B",
        borderRadius: radio,
    },
    offlineText: {
        color: "#92400E",
        fontSize: 13,
        fontWeight: "500",
        flex: 1,
    },
    field: {
        gap: 8,
        marginBottom: 16,
    },
    label: {
        fontWeight: "bold",
        color: colores.text,
        fontSize: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: colores.input,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        backgroundColor: colores.surface,
    },
    passwordRow: {
        position: "relative",
    },
    passwordInput: {
        paddingRight: 52,
    },
    passwordToggle: {
        position: "absolute",
        right: 4,
        top: 4,
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    error: {
        color: colores.danger,
        fontSize: 14,
        lineHeight: 19,
        marginBottom: 16,
    },
    button: {
        width: "100%",
        minHeight: 52,
        borderRadius: 10,
        backgroundColor: colores.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonDisabled: {
        opacity: 0.65,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16,
    },
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
