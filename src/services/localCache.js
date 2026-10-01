import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PRESTAMOS = "cadenero:prestamos";
const KEY_COLA = "cadenero:cola";
const KEY_META = "cadenero:meta";

async function leerJSON(clave, valorPorDefecto) {
    try {
        const texto = await AsyncStorage.getItem(clave);
        return texto ? JSON.parse(texto) : valorPorDefecto;
    } catch {
        return valorPorDefecto;
    }
}

async function escribirJSON(clave, valor) {
    await AsyncStorage.setItem(clave, JSON.stringify(valor));
}

// ─── Prestamos ─────────────────────────────────────

export async function guardarPrestamosLocal(prestamos) {
    const actuales = await leerJSON(KEY_PRESTAMOS, []);

    for (const prestamo of prestamos) {
        const indice = actuales.findIndex((p) => p.id === prestamo.id);

        if (indice >= 0) {
            actuales[indice] = prestamo;
        } else {
            actuales.push(prestamo);
        }
    }

    await escribirJSON(KEY_PRESTAMOS, actuales);
}

export async function agregarPrestamoLocal(prestamo) {
    const actuales = await leerJSON(KEY_PRESTAMOS, []);
    const indice = actuales.findIndex((p) => p.id === prestamo.id);

    if (indice >= 0) {
        actuales[indice] = prestamo;
    } else {
        actuales.push(prestamo);
    }

    await escribirJSON(KEY_PRESTAMOS, actuales);
}

export async function actualizarPrestamoLocal(prestamo) {
    await agregarPrestamoLocal(prestamo);
}

export async function obtenerPrestamoLocal(id) {
    const actuales = await leerJSON(KEY_PRESTAMOS, []);
    return actuales.find((p) => p.id === id) || null;
}

export async function eliminarPrestamoLocal(id) {
    const actuales = await leerJSON(KEY_PRESTAMOS, []);
    await escribirJSON(
        KEY_PRESTAMOS,
        actuales.filter((p) => p.id !== id)
    );
}

export async function reemplazarPrestamosLocal(prestamos) {
    await escribirJSON(KEY_PRESTAMOS, prestamos);
}

export async function cargarPrestamosLocal() {
    return leerJSON(KEY_PRESTAMOS, []);
}

// ─── Cola de operaciones ───────────────────────────

export async function encolarOperacion(operacion) {
    const id = `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entrada = {
        operacionId: id,
        ...operacion,
        timestamp: Date.now(),
        estado: "pendiente",
        intentos: 0,
    };

    const cola = await leerJSON(KEY_COLA, []);
    cola.push(entrada);
    await escribirJSON(KEY_COLA, cola);
    return entrada;
}

export async function obtenerCola() {
    const cola = await leerJSON(KEY_COLA, []);
    return cola.sort((a, b) => a.timestamp - b.timestamp);
}

export async function eliminarDeCola(operacionId) {
    const cola = await leerJSON(KEY_COLA, []);
    await escribirJSON(
        KEY_COLA,
        cola.filter((operacion) => operacion.operacionId !== operacionId)
    );
}

export async function actualizarOperacionCola(operacion) {
    const cola = await leerJSON(KEY_COLA, []);
    const indice = cola.findIndex(
        (entrada) => entrada.operacionId === operacion.operacionId
    );

    if (indice >= 0) {
        cola[indice] = operacion;
    } else {
        cola.push(operacion);
    }

    await escribirJSON(KEY_COLA, cola);
}

export async function contarPendientes() {
    const cola = await leerJSON(KEY_COLA, []);
    return cola.length;
}

// ─── Meta (perfil, config) ─────────────────────────

export async function guardarMeta(clave, valor) {
    const metas = await leerJSON(KEY_META, {});
    metas[clave] = { valor, fecha: Date.now() };
    await escribirJSON(KEY_META, metas);
}

export async function obtenerMeta(clave) {
    const metas = await leerJSON(KEY_META, {});
    return metas[clave]?.valor ?? null;
}

export async function eliminarMeta(clave) {
    const metas = await leerJSON(KEY_META, {});
    delete metas[clave];
    await escribirJSON(KEY_META, metas);
}
