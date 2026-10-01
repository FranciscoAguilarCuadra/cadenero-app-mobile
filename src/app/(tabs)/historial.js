import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppDialog from "../../components/AppDialog";
import OfflineBanner from "../../components/OfflineBanner";
import PrestamoCard from "../../components/PrestamoCard";
import { useApp } from "../../context/AppContext";
import { agruparPorFecha } from "../../utils/fechas";
import { colores } from "../../theme";

export default function Historial() {
    const insets = useSafeAreaInsets();
    const {
        prestamosDevueltos,
        errorCargaPrestamos,
        eliminarPrestamo,
        reactivarPrestamo,
    } = useApp();

    const [dialogo, setDialogo] = useState(null);
    const [procesandoDialogo, setProcesandoDialogo] = useState(false);
    const gruposPorFecha = agruparPorFecha(prestamosDevueltos);

    function cerrarDialogo() {
        if (procesandoDialogo) return;

        setDialogo(null);
    }

    function mostrarErrorAccion(title, message) {
        setDialogo({
            title,
            message,
            variant: "danger",
            confirmLabel: "Entendido",
            onConfirm: () => setDialogo(null),
        });
    }

    function manejarEliminacion(prestamo) {
        setDialogo({
            title: "Eliminar del historial",
            message:
                "Esta acción no se puede deshacer y eliminará las fotografías asociadas.",
            variant: "danger",
            confirmLabel: "Eliminar",
            cancelLabel: "Cancelar",
            onConfirm: async () => {
                setProcesandoDialogo(true);

                try {
                    await eliminarPrestamo(prestamo);
                    setDialogo(null);
                } catch (error) {
                    console.error(error);
                    mostrarErrorAccion(
                        "No se pudo eliminar",
                        "No se pudo eliminar el arriendo. Revisa tu conexión o las políticas de Supabase."
                    );
                } finally {
                    setProcesandoDialogo(false);
                }
            },
        });
    }

    function manejarReactivacion(prestamo) {
        setDialogo({
            title: "Reactivar arriendo",
            message: "El arriendo volverá a la pantalla principal como activo.",
            variant: "warning",
            confirmLabel: "Reactivar",
            cancelLabel: "Cancelar",
            onConfirm: async () => {
                setProcesandoDialogo(true);

                try {
                    await reactivarPrestamo(prestamo);
                    setDialogo(null);
                } catch (error) {
                    console.error(error);
                    mostrarErrorAccion(
                        "No se pudo reactivar",
                        "No se pudo reactivar el arriendo. Revisa tu conexión e intenta nuevamente."
                    );
                } finally {
                    setProcesandoDialogo(false);
                }
            },
        });
    }

    return (
        <View style={styles.pantalla}>
            <View style={{ height: insets.top, backgroundColor: colores.background }} />

            <OfflineBanner />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 100 + insets.bottom },
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Historial</Text>

                    <Text style={styles.subtitle}>
                        {prestamosDevueltos.length} arriendos devueltos
                    </Text>
                </View>

                {errorCargaPrestamos ? (
                    <View style={styles.appMessage}>
                        <Text style={styles.appMessageText}>{errorCargaPrestamos}</Text>
                    </View>
                ) : null}

                <View style={styles.cardsContainer}>
                    {prestamosDevueltos.length === 0 ? (
                        <Text style={styles.emptyState}>
                            No hay arriendos devueltos todavía.
                        </Text>
                    ) : (
                        gruposPorFecha.map((grupo) => (
                            <View style={styles.dateGroup} key={grupo.clave}>
                                <Text style={styles.dateGroupTitle}>{grupo.titulo}</Text>

                                <View style={styles.dateGroupCards}>
                                    {grupo.prestamos.map((prestamo) => (
                                        <PrestamoCard
                                            key={prestamo.id}
                                            prestamo={prestamo}
                                            onEliminar={manejarEliminacion}
                                            onReactivar={manejarReactivacion}
                                        />
                                    ))}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {dialogo && (
                <AppDialog
                    {...dialogo}
                    isProcessing={procesandoDialogo}
                    onCancel={cerrarDialogo}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    pantalla: {
        flex: 1,
        backgroundColor: colores.background,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    header: {
        marginBottom: 20,
        paddingHorizontal: 4,
        gap: 6,
    },
    title: {
        color: colores.text,
        fontSize: 26,
        fontWeight: "bold",
        lineHeight: 29,
    },
    subtitle: {
        color: colores.textSecondary,
        fontSize: 14,
    },
    appMessage: {
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#FECACA",
        borderRadius: 10,
        backgroundColor: "#FEF2F2",
        paddingVertical: 11,
        paddingHorizontal: 12,
    },
    appMessageText: {
        color: "#991B1B",
        fontSize: 14,
        lineHeight: 19,
    },
    cardsContainer: {
        gap: 14,
    },
    dateGroup: {
        gap: 10,
    },
    dateGroupTitle: {
        color: colores.text,
        fontSize: 16,
        lineHeight: 19,
        marginTop: 4,
    },
    dateGroupCards: {
        gap: 14,
    },
    emptyState: {
        color: colores.textSecondary,
        textAlign: "center",
        paddingVertical: 28,
        paddingHorizontal: 14,
    },
});
