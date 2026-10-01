import { FontAwesome5 } from "@expo/vector-icons";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colores } from "../theme";

const MAX_FOTOS_VEHICULO = 6;

const TIPOS = ["Arriendo", "Porte"];
const DIAS = ["1", "2", "3", "4", "5", "6", "7"];
const PAGOS = ["Efectivo", "Transferencia"];

function obtenerFotosVehiculo(prestamo) {
    if (Array.isArray(prestamo?.fotosVehiculo) && prestamo.fotosVehiculo.length > 0) {
        return prestamo.fotosVehiculo.filter(Boolean).slice(0, MAX_FOTOS_VEHICULO);
    }

    return prestamo?.fotoVehiculo ? [prestamo.fotoVehiculo] : [];
}

async function comprimirImagen(asset) {
    const maxSize = 900;
    const { width, height, uri } = asset;

    const contexto = ImageManipulator.manipulate(uri);

    if (width && height) {
        let destinoAncho = width;
        let destinoAlto = height;

        if (width > height && width > maxSize) {
            destinoAlto = Math.round((height * maxSize) / width);
            destinoAncho = maxSize;
        } else if (height > maxSize) {
            destinoAncho = Math.round((width * maxSize) / height);
            destinoAlto = maxSize;
        }

        if (destinoAncho !== width || destinoAlto !== height) {
            contexto.resize({ width: destinoAncho, height: destinoAlto });
        }
    }

    const imagen = await contexto.renderAsync();
    const resultado = await imagen.saveAsync({
        compress: 0.65,
        format: SaveFormat.JPEG,
        base64: true,
    });

    return `data:image/jpeg;base64,${resultado.base64}`;
}

function SelectorChips({ etiqueta, opciones, valor, onChange, disabled }) {
    return (
        <View style={styles.formGroup}>
            <Text style={styles.label}>{etiqueta}</Text>
            <View style={styles.chipsRow}>
                {opciones.map((opcion) => {
                    const seleccionado = String(valor) === String(opcion);

                    return (
                        <Pressable
                            key={opcion}
                            style={[styles.chip, seleccionado && styles.chipSelected, disabled && styles.disabled]}
                            onPress={() => onChange(opcion)}
                            disabled={disabled}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    seleccionado && styles.chipTextSelected,
                                ]}
                            >
                                {opcion}
                                {etiqueta === "Días" ? (opcion === "1" ? " día" : " días") : ""}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

function ModalNuevoPrestamo({
    prestamoEditando,
    onClose,
    onGuardar,
    guardando,
    error,
}) {
    const insets = useSafeAreaInsets();
    const [formulario, setFormulario] = useState({
        id: prestamoEditando?.id || null,
        usuarioId: prestamoEditando?.usuarioId || null,
        tipo: prestamoEditando?.tipo || "Arriendo",
        dias: prestamoEditando?.dias || 1,
        pago: prestamoEditando?.pago || "Efectivo",
        observaciones: prestamoEditando?.observaciones || "",
        fotosVehiculo: obtenerFotosVehiculo(prestamoEditando),
        danioPrevio: Boolean(prestamoEditando?.danioPrevio),
        estado: prestamoEditando?.estado || "Activo",
        fechaIngreso: prestamoEditando?.fechaIngreso || new Date().toISOString(),
        fechaDevolucion: prestamoEditando?.fechaDevolucion || null,
    });
    const [errorFoto, setErrorFoto] = useState("");
    const [procesandoFotos, setProcesandoFotos] = useState(false);
    const puedeAgregarFotos =
        formulario.fotosVehiculo.length < MAX_FOTOS_VEHICULO;

    async function agregarFotosDesde(origen) {
        try {
            let resultado;

            if (origen === "camara") {
                const permiso = await ImagePicker.requestCameraPermissionsAsync();

                if (!permiso.granted) {
                    setErrorFoto("Se necesita permiso de cámara para tomar fotos.");
                    return;
                }

                resultado = await ImagePicker.launchCameraAsync({
                    mediaTypes: ["images"],
                    cameraType: ImagePicker.CameraType.back,
                    quality: 1,
                });
            } else {
                const permiso =
                    await ImagePicker.requestMediaLibraryPermissionsAsync();

                if (!permiso.granted) {
                    setErrorFoto("Se necesita permiso para acceder a tus fotos.");
                    return;
                }

                const cuposLibres =
                    MAX_FOTOS_VEHICULO - formulario.fotosVehiculo.length;

                resultado = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsMultipleSelection: true,
                    selectionLimit: Math.max(cuposLibres, 1),
                    quality: 1,
                });
            }

            if (resultado.canceled) return;

            const cuposDisponibles =
                MAX_FOTOS_VEHICULO - formulario.fotosVehiculo.length;

            if (cuposDisponibles <= 0) {
                setErrorFoto(`Puedes agregar hasta ${MAX_FOTOS_VEHICULO} fotos del vehículo.`);
                return;
            }

            const assetsPermitidos = resultado.assets.slice(0, cuposDisponibles);

            setErrorFoto(
                resultado.assets.length > cuposDisponibles
                    ? `Solo se agregaron ${cuposDisponibles} fotos. El máximo es ${MAX_FOTOS_VEHICULO}.`
                    : ""
            );

            setProcesandoFotos(true);
            const imagenesComprimidas = await Promise.all(
                assetsPermitidos.map(comprimirImagen)
            );

            setFormulario((prevFormulario) => ({
                ...prevFormulario,
                fotosVehiculo: [
                    ...prevFormulario.fotosVehiculo,
                    ...imagenesComprimidas,
                ].slice(0, MAX_FOTOS_VEHICULO),
            }));
        } catch {
            setErrorFoto("No se pudo cargar la imagen. Intenta con otra foto.");
        } finally {
            setProcesandoFotos(false);
        }
    }

    function elegirOrigen() {
        if (!puedeAgregarFotos) {
            setErrorFoto(`Puedes agregar hasta ${MAX_FOTOS_VEHICULO} fotos del vehículo.`);
            return;
        }

        Alert.alert("Agregar fotos", "Elige el origen de las fotos", [
            { text: "Tomar foto", onPress: () => agregarFotosDesde("camara") },
            { text: "Elegir de galería", onPress: () => agregarFotosDesde("galeria") },
            { text: "Cancelar", style: "cancel" },
        ]);
    }

    function eliminarFotoVehiculo(indiceFoto) {
        setFormulario((prevFormulario) => ({
            ...prevFormulario,
            fotosVehiculo: prevFormulario.fotosVehiculo.filter(
                (_, indice) => indice !== indiceFoto
            ),
        }));
    }

    function manejarSubmit() {
        onGuardar({
            ...formulario,
            id: formulario.id || Date.now(),
            dias: Number(formulario.dias),
            fotoVehiculo: formulario.fotosVehiculo[0] || "",
        });
    }

    return (
        <Modal
            transparent
            visible
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.sheet}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {prestamoEditando ? "Editar arriendo" : "Nuevo arriendo"}
                        </Text>

                        <Pressable
                            style={styles.closeButton}
                            onPress={onClose}
                            disabled={guardando}
                        >
                            <FontAwesome5 name="times" size={16} color={colores.text} solid />
                        </Pressable>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {(error || errorFoto) && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error || errorFoto}</Text>
                            </View>
                        )}

                        <View style={styles.photoSection}>
                            <View style={styles.photoSectionHeader}>
                                <Text style={styles.label}>Fotos vehículo</Text>
                                <Text style={styles.photoCounter}>
                                    {formulario.fotosVehiculo.length}/{MAX_FOTOS_VEHICULO}
                                </Text>
                            </View>

                            {formulario.fotosVehiculo.length > 0 ? (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.photoStrip}
                                >
                                    {formulario.fotosVehiculo.map((foto, indice) => (
                                        <View style={styles.photoItem} key={`foto-${indice}`}>
                                            <Image source={{ uri: foto }} style={styles.photoImage} />

                                            <Pressable
                                                style={styles.photoDelete}
                                                onPress={() => eliminarFotoVehiculo(indice)}
                                                disabled={guardando}
                                                accessibilityLabel="Eliminar foto"
                                            >
                                                <FontAwesome5 name="trash" size={13} color="#FFFFFF" solid />
                                            </Pressable>
                                        </View>
                                    ))}

                                    {puedeAgregarFotos && (
                                        <Pressable
                                            style={[styles.photoAddTile, (guardando || procesandoFotos) && styles.disabled]}
                                            onPress={elegirOrigen}
                                            disabled={guardando || procesandoFotos}
                                        >
                                            <FontAwesome5 name="plus" size={16} color={colores.primary} solid />
                                            <Text style={styles.photoAddText}>Foto</Text>
                                        </Pressable>
                                    )}
                                </ScrollView>
                            ) : (
                                <Pressable
                                    style={[styles.photoButton, (guardando || procesandoFotos) && styles.disabled]}
                                    onPress={elegirOrigen}
                                    disabled={guardando || procesandoFotos}
                                >
                                    <FontAwesome5 name="camera" size={22} color={colores.primary} solid />
                                    <Text style={styles.photoButtonText}>Foto vehículo</Text>
                                </Pressable>
                            )}
                        </View>

                        <SelectorChips
                            etiqueta="Tipo"
                            opciones={TIPOS}
                            valor={formulario.tipo}
                            onChange={(valor) =>
                                setFormulario((prev) => ({ ...prev, tipo: valor }))
                            }
                            disabled={guardando}
                        />

                        <SelectorChips
                            etiqueta="Días"
                            opciones={DIAS}
                            valor={formulario.dias}
                            onChange={(valor) =>
                                setFormulario((prev) => ({ ...prev, dias: valor }))
                            }
                            disabled={guardando}
                        />

                        <SelectorChips
                            etiqueta="Pago"
                            opciones={PAGOS}
                            valor={formulario.pago}
                            onChange={(valor) =>
                                setFormulario((prev) => ({ ...prev, pago: valor }))
                            }
                            disabled={guardando}
                        />

                        <View style={styles.damageField}>
                            <Switch
                                value={formulario.danioPrevio}
                                onValueChange={(valor) =>
                                    setFormulario((prev) => ({ ...prev, danioPrevio: valor }))
                                }
                                disabled={guardando}
                                trackColor={{ false: "#FCD34D", true: colores.warning }}
                                thumbColor="#FFFFFF"
                            />
                            <View style={styles.damageTexts}>
                                <Text style={styles.damageTitle}>Daño previo</Text>
                                <Text style={styles.damageSubtitle}>
                                    Marca si el vehículo ya presentaba un defecto.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Observaciones</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder={
                                    formulario.danioPrevio
                                        ? "Describe brevemente el daño previo"
                                        : "Opcional"
                                }
                                value={formulario.observaciones}
                                onChangeText={(valor) =>
                                    setFormulario((prev) => ({ ...prev, observaciones: valor }))
                                }
                                editable={!guardando}
                                multiline
                            />
                        </View>

                        {guardando && (
                            <View style={styles.statusBox}>
                                <Text style={styles.statusText}>
                                    Subiendo fotos y guardando datos...
                                </Text>
                            </View>
                        )}

                        <Pressable
                            style={[styles.saveButton, guardando && styles.disabled]}
                            onPress={manejarSubmit}
                            disabled={guardando}
                        >
                            <FontAwesome5 name="save" size={18} color="#FFFFFF" solid />
                            <Text style={styles.saveButtonText}>
                                {guardando
                                    ? "Guardando arriendo..."
                                    : prestamoEditando
                                      ? "Guardar cambios"
                                      : "Guardar arriendo"}
                            </Text>
                        </Pressable>

                        <View style={{ height: insets.bottom + 12 }} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: colores.surface,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        maxHeight: "92%",
        paddingHorizontal: 22,
        paddingTop: 22,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: colores.text,
    },
    closeButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    scrollContent: {
        gap: 0,
        paddingBottom: 12,
    },
    errorBox: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#FECACA",
        backgroundColor: "#FEF2F2",
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 14,
    },
    errorText: {
        color: "#991B1B",
        fontSize: 14,
        lineHeight: 19,
    },
    statusBox: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        backgroundColor: "#EFF6FF",
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 14,
    },
    statusText: {
        color: "#1D4ED8",
        fontSize: 14,
    },
    photoSection: {
        marginBottom: 18,
    },
    photoSectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    label: {
        fontWeight: "bold",
        color: colores.text,
        fontSize: 15,
    },
    photoCounter: {
        color: colores.textSecondary,
        fontSize: 14,
        fontWeight: "bold",
    },
    photoButton: {
        minHeight: 90,
        borderRadius: 14,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    photoButtonText: {
        color: colores.primary,
        fontWeight: "bold",
        fontSize: 15,
    },
    photoStrip: {
        flexDirection: "row",
        gap: 10,
        paddingBottom: 4,
    },
    photoItem: {
        width: 108,
        aspectRatio: 1,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#EEF2FF",
    },
    photoImage: {
        width: "100%",
        height: "100%",
    },
    photoDelete: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(239, 68, 68, 0.92)",
        alignItems: "center",
        justifyContent: "center",
    },
    photoAddTile: {
        width: 108,
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#BFDBFE",
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },
    photoAddText: {
        color: colores.primary,
        fontSize: 13,
        fontWeight: "bold",
    },
    formGroup: {
        marginBottom: 16,
        gap: 8,
    },
    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: colores.borde,
    },
    chipSelected: {
        backgroundColor: colores.primary,
        borderColor: colores.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: "600",
        color: colores.text,
    },
    chipTextSelected: {
        color: "#FFFFFF",
    },
    damageField: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        borderWidth: 1,
        borderColor: "#FCD34D",
        borderRadius: 12,
        backgroundColor: "#FFFBEB",
        padding: 12,
        marginBottom: 16,
    },
    damageTexts: {
        flex: 1,
        gap: 3,
    },
    damageTitle: {
        color: "#92400E",
        fontSize: 14,
        fontWeight: "bold",
    },
    damageSubtitle: {
        color: "#A16207",
        fontSize: 13,
        lineHeight: 18,
    },
    textArea: {
        borderWidth: 1,
        borderColor: colores.input,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        minHeight: 90,
        textAlignVertical: "top",
    },
    saveButton: {
        minHeight: 56,
        borderRadius: 14,
        backgroundColor: colores.success,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    disabled: {
        opacity: 0.65,
    },
});

export default ModalNuevoPrestamo;
