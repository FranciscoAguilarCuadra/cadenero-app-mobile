import { FontAwesome5 } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colores } from "../theme";

function FloatingButton({ onClick }) {
    const insets = useSafeAreaInsets();

    return (
        <Pressable
            style={({ pressed }) => [
                styles.floatingButton,
                { bottom: 76 + insets.bottom },
                pressed && styles.pressed,
            ]}
            onPress={onClick}
            accessibilityLabel="Nuevo arriendo"
            accessibilityRole="button"
        >
            <FontAwesome5 name="plus" size={24} color="#FFFFFF" solid />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    floatingButton: {
        position: "absolute",
        right: 20,
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: colores.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 90,
    },
    pressed: {
        transform: [{ scale: 0.96 }],
    },
});

export default FloatingButton;
