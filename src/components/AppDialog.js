import { FontAwesome5 } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colores } from "../theme";

const variantes = {
    danger: { icono: "trash", color: "#DC2626", fondoIcono: "#FEE2E2", boton: colores.danger, textoBoton: "#FFFFFF" },
    warning: {
        icono: "exclamation-triangle",
        color: "#B45309",
        fondoIcono: "#FEF3C7",
        boton: colores.warning,
        textoBoton: colores.text,
    },
    success: { icono: "check-circle", color: "#15803D", fondoIcono: "#DCFCE7", boton: colores.success, textoBoton: "#FFFFFF" },
    info: { icono: "info-circle", color: colores.primary, fondoIcono: "#DBEAFE", boton: colores.primary, textoBoton: "#FFFFFF" },
};

function AppDialog({
    title,
    message,
    variant = "info",
    confirmLabel = "Aceptar",
    cancelLabel,
    isProcessing = false,
    onConfirm,
    onCancel,
}) {
    const estilo = variantes[variant] || variantes.info;

    return (
        <Modal
            transparent
            visible
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.dialogo}>
                    <View style={[styles.icono, { backgroundColor: estilo.fondoIcono }]}>
                        <FontAwesome5 name={estilo.icono} size={19} color={estilo.color} solid />
                    </View>

                    <View style={styles.contenido}>
                        <Text style={styles.titulo}>{title}</Text>
                        <Text style={styles.mensaje}>{message}</Text>
                    </View>

                    <View style={styles.acciones}>
                        {cancelLabel && (
                            <Pressable
                                style={[styles.boton, styles.botonSecundario]}
                                onPress={onCancel}
                                disabled={isProcessing}
                            >
                                <Text style={styles.textoSecundario}>{cancelLabel}</Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={[
                                styles.boton,
                                { backgroundColor: estilo.boton },
                                cancelLabel && styles.botonConCancel,
                            ]}
                            onPress={onConfirm}
                            disabled={isProcessing}
                        >
                            <Text style={[styles.textoPrimario, { color: estilo.textoBoton }]}>
                                {isProcessing ? "Procesando..." : confirmLabel}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.58)",
        justifyContent: "flex-end",
        padding: 16,
    },
    dialogo: {
        backgroundColor: colores.surface,
        borderRadius: 22,
        padding: 20,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 45,
        elevation: 16,
    },
    icono: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    contenido: {
        gap: 8,
    },
    titulo: {
        fontSize: 21,
        fontWeight: "bold",
        lineHeight: 24,
        color: colores.text,
    },
    mensaje: {
        fontSize: 15,
        lineHeight: 21,
        color: colores.textSecondary,
    },
    acciones: {
        flexDirection: "row",
        gap: 10,
        marginTop: 20,
    },
    boton: {
        flex: 1,
        minHeight: 52,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    botonConCancel: {
        flex: 1,
    },
    botonSecundario: {
        backgroundColor: "#F3F4F6",
    },
    textoPrimario: {
        fontSize: 16,
        fontWeight: "bold",
    },
    textoSecundario: {
        fontSize: 16,
        fontWeight: "bold",
        color: colores.text,
    },
});

export default AppDialog;
