import { isSupabaseConfigured, supabase } from "../supabase";

function validarConfiguracion() {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase no está configurado.");
    }
}

export async function obtenerSesionActual() {
    validarConfiguracion();

    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
}

export function escucharCambiosSesion(callback) {
    validarConfiguracion();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session, event);
    });

    return () => data.subscription.unsubscribe();
}

export async function iniciarSesion(email, password) {
    validarConfiguracion();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;

    return data.session;
}

export async function cerrarSesion() {
    validarConfiguracion();

    const { error } = await supabase.auth.signOut();

    if (error) throw error;
}

export async function obtenerPerfilUsuario(userId) {
    validarConfiguracion();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, email, nombre, rol, activo")
        .eq("id", userId)
        .single();

    if (error) {
        throw new Error("Tu cuenta aún no está activa.");
    }

    return data;
}
