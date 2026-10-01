import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { isSupabaseConfigured } from "../supabase";
import { isOnline, onConnectivityChange } from "../services/connectivity";
import { sincronizarCola } from "../services/syncService";
import { guardarMeta, obtenerMeta } from "../services/localCache";
import {
    cerrarSesion,
    escucharCambiosSesion,
    iniciarSesion,
    obtenerPerfilUsuario,
    obtenerSesionActual,
} from "../services/authService";
import {
    eliminarPrestamo as eliminarPrestamoRemoto,
    guardarPrestamo as guardarPrestamoRemoto,
    marcarPrestamoDevuelto,
    obtenerPrestamos,
    reactivarPrestamo as reactivarPrestamoRemoto,
} from "../services/prestamosService";

const campoLegacy = "ca" + "dena";

const AppContext = createContext(null);

function normalizarPrestamo(prestamo) {
    const prestamoNormalizado = { ...prestamo };
    const fotosVehiculo = Array.isArray(prestamoNormalizado.fotosVehiculo)
        ? prestamoNormalizado.fotosVehiculo.filter(Boolean)
        : [];

    if (fotosVehiculo.length === 0 && prestamoNormalizado.fotoVehiculo) {
        fotosVehiculo.push(prestamoNormalizado.fotoVehiculo);
    }

    prestamoNormalizado.tipo = prestamoNormalizado.tipo || "Arriendo";
    prestamoNormalizado.fotosVehiculo = fotosVehiculo;
    prestamoNormalizado.fotoVehiculo = fotosVehiculo[0] || "";
    prestamoNormalizado.danioPrevio = Boolean(
        prestamoNormalizado.danioPrevio ?? prestamoNormalizado.danio_previo
    );
    delete prestamoNormalizado[campoLegacy];

    return prestamoNormalizado;
}

async function cargarPerfilCacheado() {
    try {
        return await obtenerMeta("perfil");
    } catch {
        return null;
    }
}

async function guardarPerfilCacheado(perfil) {
    try {
        await guardarMeta("perfil", perfil);
    } catch {
        // Ignorar errores de caché
    }
}

export function AppProvider({ children }) {
    const [prestamos, setPrestamos] = useState([]);
    const [sesion, setSesion] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [cargandoAuth, setCargandoAuth] = useState(isSupabaseConfigured);
    const [cargandoPrestamos, setCargandoPrestamos] = useState(false);
    const [errorCargaPrestamos, setErrorCargaPrestamos] = useState("");

    const cargarPrestamosRemotos = useCallback(
        async function cargarPrestamosRemotos(perfilUsuario) {
            setCargandoPrestamos(true);
            setErrorCargaPrestamos("");

            try {
                const prestamosRemotos = await obtenerPrestamos(perfilUsuario);
                setPrestamos(prestamosRemotos.map(normalizarPrestamo));
            } catch (error) {
                if (isOnline()) {
                    setErrorCargaPrestamos(
                        "No se pudieron cargar los arriendos. Revisa tu conexión e intenta nuevamente."
                    );
                } else {
                    setErrorCargaPrestamos(
                        "Sin conexión. Se muestran los datos guardados localmente."
                    );
                }
                console.error(error);
            } finally {
                setCargandoPrestamos(false);
            }
        },
        []
    );

    const aplicarSesion = useCallback(
        async function aplicarSesion(nuevaSesion) {
            setSesion(nuevaSesion);

            if (!nuevaSesion) {
                setPerfil(null);
                setPrestamos([]);
                return;
            }

            try {
                const perfilUsuario = await obtenerPerfilUsuario(nuevaSesion.user.id);

                if (!perfilUsuario.activo) {
                    await cerrarSesion();
                    setPerfil(null);
                    throw new Error("Tu cuenta aún no está activa.");
                }

                setPerfil(perfilUsuario);
                await guardarPerfilCacheado(perfilUsuario);
                await cargarPrestamosRemotos(perfilUsuario);
            } catch (error) {
                // Si falla la red, intentar con perfil cacheado
                if (!isOnline()) {
                    const perfilCacheado = await cargarPerfilCacheado();
                    if (perfilCacheado) {
                        setPerfil(perfilCacheado);
                        await cargarPrestamosRemotos(perfilCacheado);
                        return;
                    }
                }
                setPerfil(null);
                setPrestamos([]);
                console.error(error);
            }
        },
        [cargarPrestamosRemotos]
    );

    // ─── Cargar sesión inicial ─────────────────────
    useEffect(() => {
        if (!isSupabaseConfigured) return undefined;

        async function cargarSesionInicial() {
            try {
                const sesionActual = await obtenerSesionActual();
                await aplicarSesion(sesionActual);
            } catch (error) {
                // Si falla la red, intentar con sesión/perfil cacheado
                if (!isOnline()) {
                    const perfilCacheado = await cargarPerfilCacheado();
                    if (perfilCacheado) {
                        setPerfil(perfilCacheado);
                        await cargarPrestamosRemotos(perfilCacheado);
                    }
                }
                console.error(error);
            } finally {
                setCargandoAuth(false);
            }
        }

        const dejarDeEscuchar = escucharCambiosSesion((nuevaSesion, event) => {
            if (event === "TOKEN_REFRESHED") return;
            aplicarSesion(nuevaSesion);
        });

        cargarSesionInicial();

        return dejarDeEscuchar;
    }, [aplicarSesion, cargarPrestamosRemotos]);

    // ─── Sincronizar al reconectar ─────────────────
    useEffect(() => {
        if (!isSupabaseConfigured) return undefined;

        const unsubscribe = onConnectivityChange(async (online) => {
            if (online) {
                try {
                    await sincronizarCola();
                    // Refrescar datos desde servidor después de sync
                    if (perfil) {
                        await cargarPrestamosRemotos(perfil);
                    }
                } catch (error) {
                    console.error("Error durante sincronización:", error);
                }
            }
        });

        return unsubscribe;
    }, [perfil, cargarPrestamosRemotos]);

    // ─── Guardar localmente (modo sin Supabase) ────
    useEffect(() => {
        if (isSupabaseConfigured) return;

        AsyncStorage.setItem(
            "prestamos",
            JSON.stringify(prestamos.map(normalizarPrestamo))
        ).catch(() => {
            // Ignorar errores de almacenamiento
        });
    }, [prestamos]);

    // ─── Cargar localmente (modo sin Supabase) ─────
    useEffect(() => {
        if (isSupabaseConfigured) return;

        async function cargarLocales() {
            try {
                const texto = await AsyncStorage.getItem("prestamos");
                const guardados = texto ? JSON.parse(texto) : null;

                if (Array.isArray(guardados)) {
                    setPrestamos(guardados.map(normalizarPrestamo));
                }
            } catch {
                // Ignorar errores de lectura
            }
        }

        cargarLocales();
    }, []);

    async function manejarLogin(email, password) {
        const nuevaSesion = await iniciarSesion(email, password);
        const perfilUsuario = await obtenerPerfilUsuario(nuevaSesion.user.id);

        if (!perfilUsuario.activo) {
            await cerrarSesion();
            throw new Error("Tu cuenta aún no está activa.");
        }

        setSesion(nuevaSesion);
        setPerfil(perfilUsuario);
        await guardarPerfilCacheado(perfilUsuario);
        await cargarPrestamosRemotos(perfilUsuario);
    }

    async function manejarLogout() {
        if (isSupabaseConfigured) {
            await cerrarSesion();
        }

        setSesion(null);
        setPerfil(null);
        setPrestamos([]);
    }

    async function agregarPrestamo(nuevoPrestamo) {
        const prestamoNormalizado = normalizarPrestamo({
            ...nuevoPrestamo,
            usuarioId: perfil?.id || null,
        });

        if (isSupabaseConfigured) {
            const prestamoGuardado = await guardarPrestamoRemoto(prestamoNormalizado);
            setPrestamos((prestamosActuales) => [
                normalizarPrestamo(prestamoGuardado),
                ...prestamosActuales,
            ]);
            return;
        }

        setPrestamos((prestamosActuales) => [
            prestamoNormalizado,
            ...prestamosActuales,
        ]);
    }

    async function editarPrestamo(prestamoEditado) {
        const prestamoNormalizado = normalizarPrestamo(prestamoEditado);

        if (isSupabaseConfigured) {
            const prestamoGuardado = await guardarPrestamoRemoto(prestamoNormalizado);

            setPrestamos((prestamosActuales) =>
                prestamosActuales.map((prestamo) =>
                    prestamo.id === prestamoGuardado.id
                        ? normalizarPrestamo(prestamoGuardado)
                        : prestamo
                )
            );
            return;
        }

        setPrestamos((prestamosActuales) =>
            prestamosActuales.map((prestamo) =>
                prestamo.id === prestamoNormalizado.id ? prestamoNormalizado : prestamo
            )
        );
    }

    async function devolverPrestamo(id) {
        if (isSupabaseConfigured) {
            const prestamoDevuelto = await marcarPrestamoDevuelto(id);

            setPrestamos((prestamosActuales) =>
                prestamosActuales.map((prestamo) =>
                    prestamo.id === prestamoDevuelto.id
                        ? normalizarPrestamo(prestamoDevuelto)
                        : prestamo
                )
            );
            return;
        }

        setPrestamos((prestamosActuales) =>
            prestamosActuales.map((prestamo) =>
                prestamo.id === id
                    ? {
                          ...prestamo,
                          estado: "Devuelto",
                          fechaDevolucion: new Date().toISOString(),
                      }
                    : prestamo
            )
        );
    }

    async function reactivarPrestamo(prestamoReactivado) {
        if (isSupabaseConfigured) {
            const prestamoActivo = await reactivarPrestamoRemoto(prestamoReactivado.id);

            setPrestamos((prestamosActuales) =>
                prestamosActuales.map((prestamo) =>
                    prestamo.id === prestamoActivo.id
                        ? normalizarPrestamo(prestamoActivo)
                        : prestamo
                )
            );
            return;
        }

        setPrestamos((prestamosActuales) =>
            prestamosActuales.map((prestamo) =>
                prestamo.id === prestamoReactivado.id
                    ? {
                          ...prestamo,
                          estado: "Activo",
                          fechaDevolucion: null,
                      }
                    : prestamo
            )
        );
    }

    async function eliminarPrestamo(prestamoEliminado) {
        if (isSupabaseConfigured) {
            await eliminarPrestamoRemoto(prestamoEliminado);
        }

        setPrestamos((prestamosActuales) =>
            prestamosActuales.filter(
                (prestamo) => prestamo.id !== prestamoEliminado.id
            )
        );
    }

    const prestamosActivos = useMemo(
        () => prestamos.filter((prestamo) => prestamo.estado === "Activo"),
        [prestamos]
    );
    const prestamosDevueltos = useMemo(
        () => prestamos.filter((prestamo) => prestamo.estado === "Devuelto"),
        [prestamos]
    );

    const valor = {
        prestamos,
        prestamosActivos,
        prestamosDevueltos,
        sesion,
        perfil,
        cargandoAuth,
        cargandoPrestamos,
        errorCargaPrestamos,
        manejarLogin,
        manejarLogout,
        agregarPrestamo,
        editarPrestamo,
        devolverPrestamo,
        reactivarPrestamo,
        eliminarPrestamo,
    };

    return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp() {
    const contexto = useContext(AppContext);

    if (!contexto) {
        throw new Error("useApp debe usarse dentro de AppProvider.");
    }

    return contexto;
}
