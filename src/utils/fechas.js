const formatoFecha = new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
});

const formatoHora = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
});

function normalizarFecha(fecha) {
    const fechaNormalizada = fecha ? new Date(fecha) : null;

    if (!fechaNormalizada || Number.isNaN(fechaNormalizada.getTime())) {
        return null;
    }

    return fechaNormalizada;
}

function claveFecha(fecha) {
    return [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, "0"),
        String(fecha.getDate()).padStart(2, "0"),
    ].join("-");
}

function esMismaFecha(primeraFecha, segundaFecha) {
    return claveFecha(primeraFecha) === claveFecha(segundaFecha);
}

export function formatearHora(fecha) {
    const fechaNormalizada = normalizarFecha(fecha);

    if (!fechaNormalizada) return "";

    return formatoHora.format(fechaNormalizada);
}

export function formatearFechaGrupo(fecha) {
    const fechaNormalizada = normalizarFecha(fecha);

    if (!fechaNormalizada) return "Sin fecha";

    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (esMismaFecha(fechaNormalizada, hoy)) {
        return `Hoy, ${formatoFecha.format(fechaNormalizada)}`;
    }

    if (esMismaFecha(fechaNormalizada, ayer)) {
        return `Ayer, ${formatoFecha.format(fechaNormalizada)}`;
    }

    return formatoFecha.format(fechaNormalizada);
}

export function agruparPorFecha(prestamos) {
    const grupos = new Map();

    [...prestamos]
        .sort((primerPrestamo, segundoPrestamo) => {
            const primeraFecha = normalizarFecha(primerPrestamo.fechaIngreso);
            const segundaFecha = normalizarFecha(segundoPrestamo.fechaIngreso);

            return (
                (segundaFecha?.getTime() || 0) - (primeraFecha?.getTime() || 0)
            );
        })
        .forEach((prestamo) => {
            const fecha = normalizarFecha(prestamo.fechaIngreso);
            const clave = fecha ? claveFecha(fecha) : "sin-fecha";

            if (!grupos.has(clave)) {
                grupos.set(clave, {
                    clave,
                    titulo: formatearFechaGrupo(fecha),
                    prestamos: [],
                });
            }

            grupos.get(clave).prestamos.push(prestamo);
        });

    return Array.from(grupos.values());
}
