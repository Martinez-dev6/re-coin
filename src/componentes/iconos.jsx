// Íconos de línea copiados de design/html (viewBox 24×24, trazo redondeado, color = currentColor).

function Svg({ tamano = 18, grosor = 2, children }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconoVolver = (p) => (
  <Svg tamano={20} grosor={2.2} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const IconoFlecha = (p) => (
  <Svg grosor={2.2} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const IconoLapiz = (p) => (
  <Svg tamano={20} {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
  </Svg>
);

export const IconoCheck = (p) => (
  <Svg tamano={24} grosor={3} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const IconoMas = (p) => (
  <Svg tamano={22} grosor={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconoPaleta = (p) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.3-1 .4-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="10" cy="7" r="1" />
    <circle cx="15" cy="7.5" r="1" />
  </Svg>
);

export const IconoLuna = (p) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </Svg>
);

// Sin equivalente en el diseño: sol y medio círculo para el panel de modo.
export const IconoSol = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </Svg>
);

export const IconoAutomatico = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconoPantallaInicio = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M3.5 9h17M9 9v11.5" />
  </Svg>
);

export const IconoCuentas = (p) => (
  <Svg {...p}>
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </Svg>
);

export const IconoTarjeta = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3 10h18M7 15h3" />
  </Svg>
);

export const IconoCategorias = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" />
  </Svg>
);

export const IconoEtiqueta = (p) => (
  <Svg {...p}>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7.5" cy="8.5" r="1.2" />
  </Svg>
);

export const IconoGraficos = (p) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

export const IconoRendimiento = (p) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
  </Svg>
);

export const IconoImportar = (p) => (
  <Svg {...p}>
    <path d="M7 4v13M3 13l4 4 4-4M17 20V7M13 11l4-4 4 4" />
  </Svg>
);

export const IconoCampana = (p) => (
  <Svg {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />
  </Svg>
);

export const IconoAjustes = (p) => (
  <Svg {...p}>
    <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
    <circle cx="15" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="18" r="2" />
  </Svg>
);

export const IconoAyuda = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.01" />
  </Svg>
);

export const IconoBanco = (p) => (
  <Svg tamano={20} {...p}>
    <path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
  </Svg>
);

export const IconoBilletera = (p) => (
  <Svg tamano={20} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h13v4" />
    <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-1z" />
    <circle cx="16" cy="14" r="1.2" />
  </Svg>
);

// --- Navegación y banner ---

export const IconoPerfil = (p) => (
  <Svg tamano={20} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </Svg>
);

export const IconoOjo = (p) => (
  <Svg tamano={20} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconoOjoTachado = (p) => (
  <Svg tamano={20} {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.1M6.3 6.8A16.5 16.5 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.4 4.2-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const IconoAbajo = (p) => (
  <Svg tamano={18} grosor={2.2} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const IconoAnterior = (p) => (
  <Svg tamano={20} grosor={2.2} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const IconoSiguiente = (p) => (
  <Svg tamano={20} grosor={2.2} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const IconoFlechaArriba = (p) => (
  <Svg tamano={20} grosor={2.2} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Svg>
);

export const IconoFlechaAbajo = (p) => (
  <Svg tamano={20} grosor={2.2} {...p}>
    <path d="M12 5v14M5 12l7 7 7-7" />
  </Svg>
);

export const IconoBuscar = (p) => (
  <Svg tamano={20} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);

export const IconoFiltros = (p) => (
  <Svg tamano={20} {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);

export const IconoInicio = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);

export const IconoLista = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </Svg>
);

export const IconoPlanes = (p) => (
  <Svg tamano={22} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4" />
  </Svg>
);

export const IconoCalendario = (p) => (
  <Svg tamano={14} grosor={2.2} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const IconoCerrar = (p) => (
  <Svg tamano={28} grosor={2.6} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

// --- Menú del "+" ---

export const IconoIngresoDiagonal = (p) => (
  <Svg tamano={26} grosor={2.2} {...p}>
    <path d="M17 7L7 17M7 9v8h8" />
  </Svg>
);

export const IconoGastoDiagonal = (p) => (
  <Svg tamano={26} grosor={2.2} {...p}>
    <path d="M7 17L17 7M9 7h8v8" />
  </Svg>
);

export const IconoTransferencia = (p) => (
  <Svg tamano={26} grosor={2.2} {...p}>
    <path d="M4 8h14l-3-3M20 16H6l3 3" />
  </Svg>
);

// --- Estados de movimientos y presupuestos (12–13 px) ---

export const IconoRepetir = (p) => (
  <Svg tamano={12} grosor={2.2} {...p}>
    <path d="M17 2l3 3-3 3M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3M21 13v2a4 4 0 0 1-4 4H4" />
  </Svg>
);

export const IconoReloj = (p) => (
  <Svg tamano={12} grosor={2.4} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IconoCheckCirculo = (p) => (
  <Svg tamano={12} grosor={2.4} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.7 2.7L16 9.5" />
  </Svg>
);

export const IconoAviso = (p) => (
  <Svg tamano={12} grosor={2.4} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </Svg>
);

export const IconoAlerta = (p) => (
  <Svg tamano={12} grosor={2.4} {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17.5v.01" />
  </Svg>
);

// --- Íconos de categorías, cuentas y metas (22 px en listas) ---

export const IconoEfectivo = (p) => (
  <Svg tamano={20} {...p}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </Svg>
);

export const IconoCarrito = (p) => (
  <Svg tamano={22} {...p}>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6" />
  </Svg>
);

export const IconoGasolina = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h12M8 8h4M15 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-3-3" />
  </Svg>
);

export const IconoLibro = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M3 5.5C5 4 8 4 12 6c4-2 7-2 9-.5V19c-2-1.5-5-1.5-9 .5-4-2-7-2-9-.5z" />
    <path d="M12 6v13.5" />
  </Svg>
);

export const IconoRayo = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
  </Svg>
);

export const IconoPastel = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M12 3a9 9 0 1 0 9 9h-9z" />
    <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
  </Svg>
);

export const IconoDiana = (p) => (
  <Svg tamano={22} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" />
  </Svg>
);

export const IconoEscudo = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
  </Svg>
);

export const IconoPortatil = (p) => (
  <Svg tamano={22} {...p}>
    <rect x="5" y="5" width="14" height="10" rx="2" />
    <path d="M3 19h18" />
  </Svg>
);

export const IconoAvion = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M10 14L21 3M21 3l-6.5 18-3.5-8-8-3.5z" />
  </Svg>
);

// --- Categorías y cuentas (design/html/Categorias*, NuevaCategoria, NuevaCuenta) ---

export const IconoCorazon = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Svg>
);

export const IconoEstrella = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </Svg>
);

export const IconoCasa = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);

export const IconoRegalo = (p) => (
  <Svg tamano={22} {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </Svg>
);

export const IconoMaletin = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <rect x="2" y="6" width="20" height="14" rx="2" />
  </Svg>
);

export const IconoBolsa = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

export const IconoTendencia = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M22 7l-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </Svg>
);

export const IconoAlcancia = (p) => (
  <Svg tamano={22} {...p}>
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
    <path d="M2 9v1c0 1.1.9 2 2 2h1M16 11h.01" />
  </Svg>
);

export const IconoMoneda = (p) => (
  <Svg tamano={22} {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6" />
  </Svg>
);

// Líneas de texto: fila "Nombre" de los formularios.
export const IconoTexto = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Svg>
);

export const IconoBasura = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Svg>
);

export const IconoBajar = (p) => (
  <Svg tamano={20} {...p}>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </Svg>
);

export const IconoEscudoCheck = (p) => (
  <Svg tamano={20} {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);

export const IconoInfo = (p) => (
  <Svg tamano={15} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.01" />
  </Svg>
);
