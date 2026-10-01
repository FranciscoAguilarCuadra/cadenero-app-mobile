import { isSupabaseConfigured, supabase } from "../supabase";
import { base64ToBytes } from "../utils/base64";
import { isOnline } from "./connectivity";
import {
    cargarPrestamosLocal,
    reemplazarPrestamosLocal,
    agregarPrestamoLocal,
    actualizarPrestamoLocal,
    eliminarPrestamoLocal,
} from "./localCache";
import {
    crearPrestamoOffline,
    devolverPrestamoOffline,
    reactivarPrestamoOffline,
    eliminarPrestamoOffline,
} from "./offlineQueue";

const BUCKET_PRESTAMOS = "prestamos";
const TABLA_PRESTAMOS = "prestamos";

const dataUrlMimeRegex = /data:(.*);base64/;

// ─── Helpers ───────────────────────────────────────

function esErrorDeRed(error) {
    return (
        error instanceof TypeError ||
        /fetch|network|failed to fetch|load failed|ERR_NETWORK|ERR_INTERNET|network request failed/i.test(
            error?.message || ""
        )
    );
}

async function obtenerBytesFoto(valor) {
    if (valor.startsWith("data:")) {
        return base64ToBytes(valor.split(",")[1] || "");
    }

    const respuesta = await fetch(valor);
    return new Uint8Array(await respuesta.arrayBuffer());
}

function crearNombreFoto(prestamoId, campo) {
    return `${prestamoId}/${campo}-${Date.now()}.jpg`;
}

function obtenerRutaFotoDesdeUrl(url) {
    if (!url) return null;

    const marcadorPublico = `/storage/v1/object/public/${BUCKET_PRESTAMOS}/`;
    const marcadorPrivado = `/storage/v1/object/sign/${BUCKET_PRESTAMOS}/`;

    let posicion = url.indexOf(marcadorPublico);
    if (posicion !== -1) {
        return decodeURIComponent(url.slice(posicion + marcadorPublico.length));
    }

    posicion = url.indexOf(marcadorPrivado);
    if (posicion !== -1) {
        const rutaConToken = url.slice(posicion + marcadorPrivado.length);
        return decodeURIComponent(rutaConToken.split("?")[0]);
    }

    return null;
}

function normalizarFotosVehiculo(prestamo) {
    if (Array.isArray(prestamo.fotosVehiculo) && prestamo.fotosVehiculo.length > 0) {
        return prestamo.fotosVehiculo.filter(Boolean);
    }

    if (Array.isArray(prestamo.fotos_vehiculo) && prestamo.fotos_vehiculo.length > 0) {
        return prestamo.fotos_vehiculo.filter(Boolean);
    }

    return prestamo.fotoVehiculo || prestamo.foto_vehiculo
        ? [prestamo.fotoVehiculo || prestamo.foto_vehiculo]
        : [];
}

function esFotoLocal(valor) {
    return (
        Boolean(valor) &&
        (valor.startsWith("data:image") ||
            valor.startsWith("file:") ||
            valor.startsWith("content:"))
    );
}

async function subirFotoSiCorresponde(prestamoId, campo, valor) {
    if (!valor || !esFotoLocal(valor)) {
        return valor || "";
    }

    const ruta = crearNombreFoto(prestamoId, campo);
    const bytes = await obtenerBytesFoto(valor);
    const tipoMime = dataUrlMimeRegex.exec(valor)?.[1] || "image/jpeg";
    const { error } = await supabase.storage
        .from(BUCKET_PRESTAMOS)
        .upload(ruta, bytes, {
            contentType: tipoMime,
            upsert: true,
        });

    if (error) throw error;

    const { data, error: signError } = await supabase.storage
        .from(BUCKET_PRESTAMOS)
        .createSignedUrl(ruta, 60 * 60 * 24 * 365);

    if (signError) {
        const { data: pubData } = supabase.storage
            .from(BUCKET_PRESTAMOS)
            .getPublicUrl(ruta);
        return pubData.publicUrl;
    }

    return data.signedUrl;
}

async function subirFotosVehiculo(prestamoId, fotos) {
    const fotosNormalizadas = fotos.filter(Boolean);

    return Promise.all(
        fotosNormalizadas.map((foto, index) =>
            subirFotoSiCorresponde(prestamoId, `vehiculo-${index + 1}`, foto)
        )
    );
}

function desdeSupabase(prestamo) {
    const fotosVehiculo = normalizarFotosVehiculo(prestamo);

    return {
        id: prestamo.id,
        tipo: prestamo.tipo || "Arriendo",
        dias: prestamo.dias,
        pago: prestamo.pago,
        observaciones: prestamo.observaciones || "",
        fotoVehiculo: fotosVehiculo[0] || "",
        fotosVehiculo,
        danioPrevio: Boolean(prestamo.danio_previo),
        estado: prestamo.estado,
        usuarioId: prestamo.usuario_id,
        fechaIngreso: prestamo.fecha_ingreso,
        fechaDevolucion: prestamo.fecha_devolucion,
    };
}

async function haciaSupabase(prestamo) {
    const id = String(prestamo.id || Date.now());
    const fotosVehiculo = await subirFotosVehiculo(
        id,
        normalizarFotosVehiculo(prestamo)
    );

    return {
        id,
        tipo: prestamo.tipo || "Arriendo",
        dias: Number(prestamo.dias),
        pago: prestamo.pago,
        observaciones: prestamo.observaciones || "",
        foto_vehiculo: fotosVehiculo[0] || "",
        fotos_vehiculo: fotosVehiculo,
        danio_previo: Boolean(prestamo.danioPrevio),
        estado: prestamo.estado || "Activo",
        usuario_id: prestamo.usuarioId || null,
        fecha_ingreso: prestamo.fechaIngreso || new Date().toISOString(),
        fecha_devolucion: prestamo.fechaDevolucion || null,
        fecha_actualizacion: new Date().toISOString(),
    };
}

function validarConfiguracion() {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase no esta configurado.");
    }
}

// ─── Funciones con soporte offline ─────────────────

export async function obtenerPrestamos(perfil) {
    validarConfiguracion();

    if (isOnline()) {
        try {
            let consulta = supabase
                .from(TABLA_PRESTAMOS)
                .select("*")
                .order("fecha_ingreso", { ascending: false });

            if (perfil?.rol !== "admin") {
                consulta = consulta.eq("usuario_id", perfil?.id);
            }

            const { data, error } = await consulta;

            if (error) throw error;

            const prestamos = data.map(desdeSupabase);

            // Reemplazar caché completa (elimina registros borrados del servidor)
            await reemplazarPrestamosLocal(prestamos);

            return prestamos;
        } catch (error) {
            if (!esErrorDeRed(error)) throw error;
            console.warn("Error de red consultando Supabase, usando caché local:", error);
        }
    }

    const locales = await cargarPrestamosLocal();
    return locales.length > 0 ? locales : [];
}

export async function guardarPrestamo(prestamo, { esSync = false } = {}) {
    validarConfiguracion();

    if (!isOnline()) {
        if (esSync) throw new Error("Sin conexión durante sincronización.");
        return crearPrestamoOffline(prestamo);
    }

    try {
        const prestamoSupabase = await haciaSupabase(prestamo);
        let { data, error } = await supabase
            .from(TABLA_PRESTAMOS)
            .upsert(prestamoSupabase)
            .select()
            .single();

        if (error && error.message?.includes("danio_previo")) {
            const prestamoSinDanioPrevio = { ...prestamoSupabase };
            delete prestamoSinDanioPrevio.danio_previo;

            const resultadoFallback = await supabase
                .from(TABLA_PRESTAMOS)
                .upsert(prestamoSinDanioPrevio)
                .select()
                .single();

            data = resultadoFallback.data;
            error = resultadoFallback.error;
        }

        if (error) throw error;

        const guardado = desdeSupabase(data);
        await agregarPrestamoLocal(guardado);
        return guardado;
    } catch (error) {
        if (!esErrorDeRed(error) || esSync) throw error;
        return crearPrestamoOffline(prestamo);
    }
}

export async function marcarPrestamoDevuelto(id, { esSync = false } = {}) {
    validarConfiguracion();

    if (!isOnline()) {
        if (esSync) throw new Error("Sin conexión durante sincronización.");
        return devolverPrestamoOffline({ id });
    }

    try {
        const { data, error } = await supabase
            .from(TABLA_PRESTAMOS)
            .update({
                estado: "Devuelto",
                fecha_devolucion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString(),
            })
            .eq("id", String(id))
            .select()
            .single();

        if (error) throw error;

        const devuelto = desdeSupabase(data);
        await actualizarPrestamoLocal(devuelto);
        return devuelto;
    } catch (error) {
        if (!esErrorDeRed(error) || esSync) throw error;
        return devolverPrestamoOffline({ id });
    }
}

export async function reactivarPrestamo(id, { esSync = false } = {}) {
    validarConfiguracion();

    if (!isOnline()) {
        if (esSync) throw new Error("Sin conexión durante sincronización.");
        return reactivarPrestamoOffline({ id });
    }

    try {
        const { data, error } = await supabase
            .from(TABLA_PRESTAMOS)
            .update({
                estado: "Activo",
                fecha_devolucion: null,
                fecha_actualizacion: new Date().toISOString(),
            })
            .eq("id", String(id))
            .select()
            .single();

        if (error) throw error;

        const reactivado = desdeSupabase(data);
        await actualizarPrestamoLocal(reactivado);
        return reactivado;
    } catch (error) {
        if (!esErrorDeRed(error) || esSync) throw error;
        return reactivarPrestamoOffline({ id });
    }
}

export async function eliminarPrestamo(prestamo, { esSync = false } = {}) {
    validarConfiguracion();

    if (!isOnline()) {
        if (esSync) throw new Error("Sin conexión durante sincronización.");
        return eliminarPrestamoOffline(prestamo);
    }

    try {
        const rutasFotos = [
            ...normalizarFotosVehiculo(prestamo).map(obtenerRutaFotoDesdeUrl),
        ].filter(Boolean);
        const rutasUnicas = [...new Set(rutasFotos)];

        const { data, error } = await supabase
            .from(TABLA_PRESTAMOS)
            .delete()
            .eq("id", String(prestamo.id))
            .select("id");

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error(
                "Supabase no elimino el arriendo. Revisa las politicas de eliminacion."
            );
        }

        if (rutasUnicas.length > 0) {
            const { error: errorFotos } = await supabase.storage
                .from(BUCKET_PRESTAMOS)
                .remove(rutasUnicas);

            if (errorFotos) {
                console.error("No se pudieron eliminar las fotos del arriendo.", errorFotos);
            }
        }

        await eliminarPrestamoLocal(prestamo.id);
    } catch (error) {
        if (!esErrorDeRed(error) || esSync) throw error;
        return eliminarPrestamoOffline(prestamo);
    }
}
