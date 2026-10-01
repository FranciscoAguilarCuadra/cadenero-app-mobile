import { FontAwesome5 } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colores } from "../theme";

function NavItem({ icono, etiqueta, activo, onPress }) {
    return (
        <Pressable
            style={styles.navItem}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={etiqueta}
        >
            <FontAwesome5
                name={icono}
                size={20}
                color={activo ? colores.primary : colores.textSecondary}
                solid
            />
            <Text style={[styles.navLabel, activo && styles.navLabelActive]}>
                {etiqueta}
            </Text>
        </Pressable>
    );
}

function Header({ usuario, onLogout }) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.bottomNav,
                { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
        >
            <NavItem
                icono="home"
                etiqueta="Inicio"
                activo={pathname === "/"}
                onPress={() => router.push("/")}
            />
            <NavItem
                icono="history"
                etiqueta="Historial"
                activo={pathname === "/historial"}
                onPress={() => router.push("/historial")}
            />
            <NavItem
                icono="sign-out-alt"
                etiqueta="Salir"
                activo={false}
                onPress={onLogout}
                usuario={usuario}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        height: 58,
        backgroundColor: colores.surface,
        borderTopWidth: 1,
        borderTopColor: colores.borde,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
    },
    navItem: {
        flex: 1,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    navLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: colores.textSecondary,
    },
    navLabelActive: {
        color: colores.primary,
    },
});

export default Header;
