import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatearHora } from "../utils/fechas";
import { colores, radio, sombra } from "../theme";

const milisegundosPorDia = 24 * 60 * 60 * 1000;

const progresoEstilos = {
    early: { backgroundColor: "#ECFDF5", color: "#047857" },
    middle: { backgroundColor: "#EFF6FF", color: "#1D4ED8" },
    advanced: { backgroundColor: "#FEF3C7", color: "#92400E" },
    "due-today": { backgroundColor: "#FFEDD5", color: "#C2410C" },
    overdue: { backgroundColor: "#FEE2E2", color: "#B91C1C" },
    neutral: { backgroundColor: "#F3F4F6", color: "#4B5563" },
};

function obtenerFotos(prestamo) {
    const fotosVehiculo = Array.isArray(prestamo.fotosVehiculo)
        ? prestamo.fotosVehiculo.filter(Boolean)
        : [];
    const fotos = fotosVehiculo.length > 0 ? fotosVehiculo : [prestamo.fotoVehiculo];

    return fotos.filter(Boolean);
}

function normalizarInicioDia(fecha) {
    const fechaNormalizada = fecha ? new Date(fecha) : null;

    if (!fechaNormalizada || Number.isNaN(fechaNormalizada.getTime())) {
        return null;
    }

    fechaNormalizada.setHours(0, 0, 0, 0);
    return fechaNormalizada;
}

function obtenerProgresoDias(prestamo) {
    const diasTotales = Math.max(Number(prestamo.dias) || 1, 1);

    if (prestamo.estado === "Devuelto") {
        return {
            texto: `${diasTotales} día${diasTotales > 1 ? "s" : ""}`,
            clase: "neutral",
        };
    }

    const fechaIngreso = normalizarInicioDia(prestamo.fechaIngreso);
    const hoy = normalizarInicioDia(new Date());

    if (!fechaIngreso || !hoy) {
        return {
            texto: `${diasTotales} día${diasTotales > 1 ? "s" : ""}`,
            clase: "neutral",
        };
    }

    const diasTranscurridos =
        Math.floor((hoy.getTime() - fechaIngreso.getTime()) / milisegundosPorDia) +
        1;
    const diaActual = Math.min(Math.max(diasTranscurridos, 1), diasTotales);
    const estaAtrasado = diasTranscurridos > diasTotales;
    const venceHoy = diasTranscurridos === diasTotales;
    const progreso = diaActual / diasTotales;

    if (estaAtrasado) {
        return {
            texto: "Atrasado",
            clase: "overdue",
        };
    }

    if (diasTotales === 1) {
        return {
            texto: "Hoy",
            clase: "due-today",
        };
    }

    if (venceHoy) {
        return {
            texto: `${diaActual}/${diasTotales} días`,
            clase: "due-today",
        };
    }

    if (progreso >= 0.75) {
        return {
            texto: `${diaActual}/${diasTotales} días`,
            clase: "advanced",
        };
    }

    if (progreso >= 0.45) {
        return {
            texto: `${diaActual}/${diasTotales} días`,
            clase: "middle",
        };
    }

    return {
        texto: `${diaActual}/${diasTotales} días`,
        clase: "early",
    };
}

function PrestamoCard({ prestamo, onEditar, onDevolver, onEliminar, onReactivar }) {
    const insets = useSafeAreaInsets();
    const [indiceGaleria, setIndiceGaleria] = useState(null);
    const fotos = obtenerFotos(prestamo);
    const fotoPrincipal = fotos[0];
    const tieneFotos = fotos.length > 0;
    const estaDevuelto = prestamo.estado === "Devuelto";
    const horaIngreso = formatearHora(prestamo.fechaIngreso);
    const tipo = prestamo.tipo || "Arriendo";
    const progresoDias = obtenerProgresoDias(prestamo);
    const estiloProgreso = progresoEstilos[progresoDias.clase] || progresoEstilos.neutral;

    function mostrarFotoAnterior() {
        setIndiceGaleria((indiceActual) =>
            indiceActual === 0 ? fotos.length - 1 : indiceActual - 1
        );
    }

    function mostrarFotoSiguiente() {
        setIndiceGaleria((indiceActual) =>
            indiceActual === fotos.length - 1 ? 0 : indiceActual + 1
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.fila}>
                <View style={styles.imageBox}>
                    {tieneFotos ? (
                        <Pressable
                            style={styles.imageButton}
                            onPress={() => setIndiceGaleria(0)}
                            accessibilityLabel="Ver fotos del arriendo"
                        >
                            <Image source={{ uri: fotoPrincipal }} style={styles.image} />

                            {fotos.length > 1 && (
                                <View style={styles.photoCount}>
                                    <Text style={styles.photoCountText}>{fotos.length}</Text>
                                </View>
                            )}
                        </Pressable>
                    ) : (
                        <View style={styles.placeholder}>
                            <FontAwesome5 name="camera" size={26} color={colores.primary} solid />
                            <Text style={styles.placeholderText}>Sin foto</Text>
                        </View>
                    )}
                </View>

                <View style={styles.main}>
                    <View style={styles.headerRow}>
                        <View style={styles.titleBox}>
                            <Text style={styles.title}>{tipo}</Text>
                            <Text style={styles.subtitle}>
                                {horaIngreso ? `Hora ${horaIngreso}` : "Sin hora"}
                            </Text>
                        </View>

                        <View style={styles.metaActions}>
                            <View style={styles.badges}>
                                <Text
                                    style={[
                                        styles.badge,
                                        estaDevuelto ? styles.returned : styles.active,
                                    ]}
                                >
                                    {estaDevuelto ? "Devuelto" : "Activo"}
                                </Text>

                                {prestamo.danioPrevio && (
                                    <Text style={[styles.badge, styles.damage]}>
                                        Daño previo
                                    </Text>
                                )}
                            </View>

                            {onEliminar && (
                                <Pressable
                                    style={styles.deleteButton}
                                    onPress={() => onEliminar(prestamo)}
                                    accessibilityLabel="Eliminar arriendo"
                                >
                                    <FontAwesome5 name="trash" size={14} color="#FFFFFF" solid />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    <View style={styles.details}>
                        <View style={styles.detailChip}>
                            <FontAwesome5
                                name="money-bill-wave"
                                size={12}
                                color={colores.textSecondary}
                                solid
                            />
                            <Text style={styles.detailText}>{prestamo.pago}</Text>
                        </View>

                        <View
                            style={[
                                styles.detailChip,
                                { backgroundColor: estiloProgreso.backgroundColor },
                            ]}
                        >
                            <FontAwesome5
                                name="calendar-alt"
                                size={12}
                                color={estiloProgreso.color}
                                solid
                            />
                            <Text style={[styles.detailText, { color: estiloProgreso.color, fontWeight: "bold" }]}>
                                {progresoDias.texto}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.buttons}>
                {!estaDevuelto && (
                    <>
                        <Pressable
                            style={[styles.actionButton, styles.editButton]}
                            onPress={() => onEditar(prestamo)}
                        >
                            <FontAwesome5 name="pen" size={13} color="#FFFFFF" solid />
                            <Text style={styles.actionText}>Editar</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.actionButton, styles.returnButton]}
                            onPress={() => onDevolver(prestamo.id)}
                        >
                            <FontAwesome5 name="check-circle" size={13} color="#FFFFFF" solid />
                            <Text style={styles.actionText}>Devuelto</Text>
                        </Pressable>
                    </>
                )}

                {estaDevuelto && onReactivar && (
                    <Pressable
                        style={[styles.actionButton, styles.reactivateButton]}
                        onPress={() => onReactivar(prestamo)}
                    >
                        <FontAwesome5 name="redo" size={13} color="#FFFFFF" solid />
                        <Text style={styles.actionText}>Reactivar</Text>
                    </Pressable>
                )}
            </View>

            {indiceGaleria !== null && (
                <Modal
                    transparent
                    visible
                    animationType="fade"
                    statusBarTranslucent
                    onRequestClose={() => setIndiceGaleria(null)}
                >
                    <View style={styles.galleryOverlay}>
                        <Pressable
                            style={[styles.galleryButton, styles.galleryClose, { top: insets.top + 16 }]}
                            onPress={() => setIndiceGaleria(null)}
                            accessibilityLabel="Cerrar galería"
                        >
                            <FontAwesome5 name="times" size={18} color="#FFFFFF" solid />
                        </Pressable>

                        {fotos.length > 1 && (
                            <Pressable
                                style={[styles.galleryButton, styles.galleryPrev]}
                                onPress={mostrarFotoAnterior}
                                accessibilityLabel="Foto anterior"
                            >
                                <FontAwesome5 name="chevron-left" size={18} color="#FFFFFF" solid />
                            </Pressable>
                        )}

                        <Image
                            source={{ uri: fotos[indiceGaleria] }}
                            style={styles.galleryImage}
                            resizeMode="contain"
                        />

                        {fotos.length > 1 && (
                            <Pressable
                                style={[styles.galleryButton, styles.galleryNext]}
                                onPress={mostrarFotoSiguiente}
                                accessibilityLabel="Foto siguiente"
                            >
                                <FontAwesome5 name="chevron-right" size={18} color="#FFFFFF" solid />
                            </Pressable>
                        )}

                        <View style={[styles.galleryCounter, { bottom: insets.bottom + 18 }]}>
                            <Text style={styles.galleryCounterText}>
                                {indiceGaleria + 1} / {fotos.length}
                            </Text>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colores.surface,
        borderRadius: radio,
        ...sombra,
        padding: 12,
        gap: 10,
    },
    fila: {
        flexDirection: "row",
        gap: 12,
    },
    imageBox: {
        width: 96,
        height: 96,
        borderRadius: 10,
        backgroundColor: "#EEF2FF",
        overflow: "hidden",
    },
    imageButton: {
        width: "100%",
        height: "100%",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    photoCount: {
        position: "absolute",
        right: 6,
        bottom: 6,
        minWidth: 24,
        height: 24,
        paddingHorizontal: 7,
        borderRadius: 12,
        backgroundColor: "rgba(15, 23, 42, 0.82)",
        alignItems: "center",
        justifyContent: "center",
    },
    photoCountText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    placeholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    placeholderText: {
        color: colores.primary,
        fontSize: 12,
        fontWeight: "bold",
    },
    main: {
        flex: 1,
        justifyContent: "space-between",
        gap: 9,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
    },
    titleBox: {
        flexShrink: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        lineHeight: 22,
        color: colores.text,
    },
    subtitle: {
        fontSize: 12,
        color: colores.textSecondary,
        marginTop: 4,
    },
    metaActions: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 7,
    },
    badges: {
        gap: 6,
        alignItems: "stretch",
    },
    badge: {
        minWidth: 76,
        minHeight: 38,
        paddingHorizontal: 9,
        paddingVertical: 8,
        borderRadius: 10,
        fontSize: 13,
        fontWeight: "bold",
        textAlign: "center",
        overflow: "hidden",
    },
    active: {
        backgroundColor: "#DCFCE7",
        color: "#15803D",
    },
    returned: {
        backgroundColor: "#E5E7EB",
        color: "#374151",
    },
    damage: {
        minWidth: 96,
        backgroundColor: "#FEF3C7",
        color: "#92400E",
    },
    details: {
        flexDirection: "row",
        gap: 7,
    },
    detailChip: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 8,
        backgroundColor: "#F9FAFB",
        paddingVertical: 7,
        paddingHorizontal: 8,
    },
    detailText: {
        fontSize: 13,
        color: colores.textSecondary,
    },
    buttons: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        flex: 1,
        minHeight: 42,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },
    actionText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 13,
    },
    editButton: {
        backgroundColor: colores.primary,
    },
    returnButton: {
        backgroundColor: colores.success,
    },
    reactivateButton: {
        backgroundColor: colores.warning,
    },
    deleteButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: colores.danger,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 6,
    },
    galleryOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        alignItems: "center",
        justifyContent: "center",
    },
    galleryImage: {
        width: "100%",
        height: "75%",
    },
    galleryButton: {
        position: "absolute",
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255, 255, 255, 0.16)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
    },
    galleryClose: {
        right: 16,
    },
    galleryPrev: {
        left: 12,
    },
    galleryNext: {
        right: 12,
    },
    galleryCounter: {
        position: "absolute",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "rgba(255, 255, 255, 0.14)",
    },
    galleryCounterText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "bold",
    },
});

export default PrestamoCard;
