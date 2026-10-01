import {
    obtenerCola,
    eliminarDeCola,
    actualizarOperacionCola,
} from "./localCache";
import {
    guardarPrestamo,
    marcarPrestamoDevuelto,
    reactivarPrestamo,
    eliminarPrestamo,
} from "./prestamosService";

let estaSincronizando = false;
let listenersProgreso = [];

export function onSyncProgress(callback) {
    listenersProgreso.push(callback);
    return () => {
        listenersProgreso = listenersProgreso.filter((fn) => fn !== callback);
    };
}

function notificarProgreso(pendientes, completadas, total) {
    listenersProgreso.forEach((fn) => fn({ pendientes, completadas, total }));
}

export async function sincronizarCola() {
    if (estaSincronizando) return { exito: true, sincronizadas: 0 };

    estaSincronizando = true;

    try {
        const cola = await obtenerCola();
        const total = cola.length;

        if (total === 0) {
            return { exito: true, sincronizadas: 0 };
        }

        let completadas = 0;
        let fallidas = [];

        notificarProgreso(total, 0, total);

        for (const operacion of cola) {
            try {
                await ejecutarOperacion(operacion);
                await eliminarDeCola(operacion.operacionId);
                completadas++;
                notificarProgreso(total - completadas, completadas, total);
            } catch (error) {
                console.error(
                    `Error sincronizando operación ${operacion.operacionId}:`,
                    error
                );

                operacion.intentos = (operacion.intentos || 0) + 1;
                operacion.ultimoError = error.message;

                if (operacion.intentos >= 3) {
                    await eliminarDeCola(operacion.operacionId);
                    fallidas.push(operacion);
                } else {
                    await actualizarOperacionCola(operacion);
                }
            }
        }

        return {
            exito: fallidas.length === 0,
            sincronizadas: completadas,
            fallidas,
        };
    } finally {
        estaSincronizando = false;
        notificarProgreso(0, 0, 0);
    }
}

async function ejecutarOperacion(operacion) {
    switch (operacion.tipo) {
        case "crear":
            await guardarPrestamo(operacion.datos, { esSync: true });
            break;

        case "editar":
            await guardarPrestamo(operacion.datos, { esSync: true });
            break;

        case "devolver":
            await marcarPrestamoDevuelto(operacion.datos.id, { esSync: true });
            break;

        case "reactivar":
            await reactivarPrestamo(operacion.datos.id, { esSync: true });
            break;

        case "eliminar":
            await eliminarPrestamo(
                {
                    id: operacion.datos.id,
                    fotosVehiculo: operacion.datos.fotos || [],
                },
                { esSync: true }
            );
            break;

        default:
            throw new Error(`Tipo de operación desconocido: ${operacion.tipo}`);
    }
}
