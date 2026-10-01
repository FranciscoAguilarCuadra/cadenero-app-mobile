import {
    agregarPrestamoLocal,
    actualizarPrestamoLocal,
    eliminarPrestamoLocal,
    obtenerPrestamoLocal,
    encolarOperacion,
} from "./localCache";

// ─── Encolar operaciones ───────────────────────────

export async function crearPrestamoOffline(prestamo) {
    await agregarPrestamoLocal(prestamo);
    await encolarOperacion({
        tipo: "crear",
        datos: prestamo,
    });
    return prestamo;
}

export async function editarPrestamoOffline(prestamo) {
    await actualizarPrestamoLocal(prestamo);
    await encolarOperacion({
        tipo: "editar",
        datos: prestamo,
    });
    return prestamo;
}

export async function devolverPrestamoOffline(prestamo) {
    const existente = await obtenerPrestamoLocal(prestamo.id);
    const actualizado = {
        ...(existente || {}),
        ...prestamo,
        estado: "Devuelto",
        fechaDevolucion: new Date().toISOString(),
    };
    await actualizarPrestamoLocal(actualizado);
    await encolarOperacion({
        tipo: "devolver",
        datos: { id: prestamo.id },
    });
    return actualizado;
}

export async function reactivarPrestamoOffline(prestamo) {
    const existente = await obtenerPrestamoLocal(prestamo.id);
    const actualizado = {
        ...(existente || {}),
        ...prestamo,
        estado: "Activo",
        fechaDevolucion: null,
    };
    await actualizarPrestamoLocal(actualizado);
    await encolarOperacion({
        tipo: "reactivar",
        datos: { id: prestamo.id },
    });
    return actualizado;
}

export async function eliminarPrestamoOffline(prestamo) {
    await eliminarPrestamoLocal(prestamo.id);
    await encolarOperacion({
        tipo: "eliminar",
        datos: {
            id: prestamo.id,
            fotos: prestamo.fotosVehiculo || [],
        },
    });
}
