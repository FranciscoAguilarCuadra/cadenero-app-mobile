import { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppDialog from "../../components/AppDialog";
import FloatingButton from "../../components/FloatingButton";
import ModalNuevoPrestamo from "../../components/ModalNuevoPrestamo";
import OfflineBanner from "../../components/OfflineBanner";
import PrestamoCard from "../../components/PrestamoCard";
import { useApp } from "../../context/AppContext";
import { agruparPorFecha } from "../../utils/fechas";
import { colores } from "../../theme";

function esDeHoy(prestamo) {
    const fechaIngreso = prestamo.fechaIngreso
        ? new Date(prestamo.fechaIngreso)
        : null;

    if (!fechaIngreso || Number.isNaN(fechaIngreso.getTime())) return false;

    const hoy = new Date();

    return (
        fechaIngreso.getFullYear() === hoy.getFullYear() &&
        fechaIngreso.getMonth() === hoy.getMonth() &&
        fechaIngreso.getDate() === hoy.getDate()
    );
}

export default function Dashboard() {
    const insets = useSafeAreaInsets();
    const {
        prestamosActivos,
        cargandoPrestamos,
        errorCargaPrestamos,
        perfil,
        agregarPrestamo,
        editarPrestamo,
        devolverPrestamo,
        eliminarPrestamo,
    } = useApp();

    const [modalAbierto, setModalAbierto] = useState(false);
    const [prestamoEditando, setPrestamoEditando] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState("");
    const [dialogo, setDialogo] = useState(null);
    const [procesandoDialogo, setProcesandoDialogo] = useState(false);
    const gruposPorFecha = useMemo(
        () => agruparPorFecha(prestamosActivos),
        [prestamosActivos]
    );
    const nombreUsuario = perfil?.nombre || perfil?.email || "usuario";
    const prestamosDeHoy = useMemo(
        () => prestamosActivos.filter(esDeHoy).length,
        [prestamosActivos]
    );

    function limpiarMensajes() {
        setErrorModal("");
        setDialogo(null);
    }

    function abrirNuevoPrestamo() {
        limpiarMensajes();
        setPrestamoEditando(null);
        setModalAbierto(true);
    }

    function abrirEditarPrestamo(prestamo) {
        limpiarMensajes();
        setPrestamoEditando(prestamo);
        setModalAbierto(true);
    }

    function cerrarModal() {
        setModalAbierto(false);
        setPrestamoEditando(null);
        setErrorModal("");
    }

    async function guardarPrestamo(prestamo) {
        setGuardando(true);
        setErrorModal("");

        try {
            if (prestamoEditando) {
                await editarPrestamo(prestamo);
            } else {
                await agregarPrestamo(prestamo);
            }

            cerrarModal();
        } catch (error) {
            setErrorModal(
                "No se pudo guardar el arriendo. Revisa tu conexión e intenta nuevamente."
            );
            console.error(error);
        } finally {
            setGuardando(false);
        }
    }

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

    function manejarDevolucion(id) {
        setDialogo({
            title: "Marcar como devuelto",
            message:
                "El arriendo pasará al historial. Si fue un error, podrás reactivarlo desde ahí.",
            variant: "warning",
            confirmLabel: "Devolver",
            cancelLabel: "Cancelar",
            onConfirm: async () => {
                setProcesandoDialogo(true);

                try {
                    await devolverPrestamo(id);
                    setDialogo(null);
                } catch (error) {
                    console.error(error);
                    mostrarErrorAccion(
                        "No se pudo devolver",
                        "No se pudo marcar el arriendo como devuelto. Revisa tu conexión e intenta nuevamente."
                    );
                } finally {
                    setProcesandoDialogo(false);
                }
            },
        });
    }

    function manejarEliminacion(prestamo) {
        setDialogo({
            title: "Eliminar arriendo",
            message:
                "Esta acción no se puede deshacer y eliminará sus fotografías asociadas.",
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

    return (
        <View style={styles.pantalla}>
            <View style={{ height: insets.top, backgroundColor: colores.background }} />

            <OfflineBanner />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 230 + insets.bottom },
                ]}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.label}>Cadenero</Text>
                        <Text style={styles.title}>Hola, {nombreUsuario}</Text>
                    </View>

                    <View style={styles.summary} accessibilityLabel="Resumen de arriendos">
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>
                                {prestamosActivos.length}
                            </Text>
                            <Text style={styles.summaryLabel}>Activos</Text>
                        </View>

                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{prestamosDeHoy}</Text>
                            <Text style={styles.summaryLabel}>Hoy</Text>
                        </View>
                    </View>
                </View>

                {errorCargaPrestamos ? (
                    <View style={styles.appMessage}>
                        <Text style={styles.appMessageText}>{errorCargaPrestamos}</Text>
                    </View>
                ) : null}

                <View style={styles.cardsContainer}>
                    {cargandoPrestamos ? (
                        <Text style={styles.emptyState}>Cargando arriendos...</Text>
                    ) : prestamosActivos.length === 0 ? (
                        <Text style={styles.emptyState}>No hay arriendos activos.</Text>
                    ) : (
                        gruposPorFecha.map((grupo) => (
                            <View style={styles.dateGroup} key={grupo.clave}>
                                <Text style={styles.dateGroupTitle}>{grupo.titulo}</Text>

                                <View style={styles.dateGroupCards}>
                                    {grupo.prestamos.map((prestamo) => (
                                        <PrestamoCard
                                            key={prestamo.id}
                                            prestamo={prestamo}
                                            onEditar={abrirEditarPrestamo}
                                            onDevolver={manejarDevolucion}
                                            onEliminar={manejarEliminacion}
                                        />
                                    ))}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <FloatingButton onClick={abrirNuevoPrestamo} />

            {modalAbierto && (
                <ModalNuevoPrestamo
                    prestamoEditando={prestamoEditando}
                    onClose={cerrarModal}
                    onGuardar={guardarPrestamo}
                    guardando={guardando}
                    error={errorModal}
                />
            )}

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
    },
    label: {
        color: colores.textSecondary,
        fontSize: 13,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    title: {
        color: colores.text,
        fontSize: 26,
        fontWeight: "bold",
        lineHeight: 29,
        marginTop: 3,
    },
    summary: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    summaryItem: {
        flex: 1,
        minHeight: 58,
        borderWidth: 1,
        borderColor: colores.borde,
        borderRadius: 10,
        backgroundColor: colores.surface,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    summaryValue: {
        color: colores.text,
        fontSize: 23,
        fontWeight: "bold",
        lineHeight: 23,
    },
    summaryLabel: {
        color: colores.textSecondary,
        fontSize: 13,
        marginTop: 6,
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
