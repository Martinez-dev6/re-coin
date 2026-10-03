// Íconos de la interfaz, de Lucide (lucide.dev, licencia ISC): trazo redondeado y legibles en
// tamaños pequeños. Reemplazan a los dibujados a mano del diseño, que en el teléfono se veían
// poco legibles y algunos deformes (pedido del dueño, 2026-10-03). Cada uno conserva el
// tamaño y el grosor que tenía; tamano y grosor los cambian. Los de cuentas y categorías
// (que se eligen y se guardan por nombre) están en iconosPorNombre.jsx.
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownUp,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Calendar,
  CalendarCheck,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Clock,
  Contrast,
  CreditCard,
  Download,
  Ellipsis,
  Eye,
  EyeOff,
  House,
  Info,
  Landmark,
  Layers,
  LayoutGrid,
  List,
  NotebookText,
  ListFilter,
  Moon,
  Palette,
  PanelsTopLeft,
  Pencil,
  Plus,
  ReceiptText,
  Repeat,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Tag,
  TextAlignStart,
  Trash2,
  TrendingUp,
  TriangleAlert,
  User,
  Wallet,
  X,
} from 'lucide-react';

function crear(Icono, tamanoBase = 18, grosorBase = 2) {
  return function IconoInterfaz({ tamano = tamanoBase, grosor = grosorBase, ...resto }) {
    return <Icono size={tamano} strokeWidth={grosor} aria-hidden="true" focusable="false" {...resto} />;
  };
}

// Navegación y botones
export const IconoVolver = crear(ChevronLeft, 20, 2.2);
export const IconoFlecha = crear(ChevronRight, 18, 2.2);
export const IconoAnterior = crear(ChevronLeft, 20, 2.2);
export const IconoSiguiente = crear(ChevronRight, 20, 2.2);
export const IconoAbajo = crear(ChevronDown, 18, 2.2);
export const IconoCerrar = crear(X, 28, 2.6);
export const IconoMas = crear(Plus, 22, 2.2);
export const IconoCheck = crear(Check, 24, 3);
export const IconoLapiz = crear(Pencil, 20);
export const IconoBuscar = crear(Search, 20);
export const IconoFiltros = crear(ListFilter, 20);
export const IconoPerfil = crear(User, 20);
export const IconoOjo = crear(Eye, 20);
export const IconoOjoTachado = crear(EyeOff, 20);
export const IconoBasura = crear(Trash2, 18);
export const IconoInfo = crear(Info, 15);
export const IconoTexto = crear(TextAlignStart, 18);
export const IconoNota = crear(NotebookText, 18);
export const IconoCapas = crear(Layers, 18);
export const IconoRecibo = crear(ReceiptText, 18);
export const IconoMasOpciones = crear(Ellipsis, 22);

// Barra inferior
export const IconoInicio = crear(House, 22);
export const IconoLista = crear(List, 22);
export const IconoPlanes = crear(CalendarCheck, 22);
export const IconoCategorias = crear(LayoutGrid, 18);

// Menú del "+" y movimientos
export const IconoIngresoDiagonal = crear(ArrowDownLeft, 26, 2.2);
export const IconoGastoDiagonal = crear(ArrowUpRight, 26, 2.2);
export const IconoTransferencia = crear(ArrowLeftRight, 26, 2.2);
export const IconoFlechaArriba = crear(ArrowUp, 20, 2.2);
export const IconoFlechaAbajo = crear(ArrowDown, 20, 2.2);
export const IconoRepetir = crear(Repeat, 12, 2.2);
export const IconoReloj = crear(Clock, 12, 2.4);
export const IconoCalendario = crear(Calendar, 14, 2.2);

// Estados de presupuestos
export const IconoCheckCirculo = crear(CircleCheck, 12, 2.4);
export const IconoAviso = crear(CircleAlert, 12, 2.4);
export const IconoAlerta = crear(TriangleAlert, 12, 2.4);

// Mi espacio
export const IconoPaleta = crear(Palette);
export const IconoLuna = crear(Moon);
export const IconoSol = crear(Sun);
export const IconoAutomatico = crear(Contrast);
export const IconoPantallaInicio = crear(PanelsTopLeft);
export const IconoCuentas = crear(Wallet);
export const IconoTarjeta = crear(CreditCard);
export const IconoEtiqueta = crear(Tag);
export const IconoGraficos = crear(ChartColumn);
export const IconoRendimiento = crear(TrendingUp);
export const IconoImportar = crear(ArrowDownUp);
export const IconoCampana = crear(Bell);
export const IconoAjustes = crear(Settings);
export const IconoAyuda = crear(CircleHelp);

// Cuentas, respaldo y vista previa de Apariencia
export const IconoBanco = crear(Landmark, 20);
export const IconoBilletera = crear(Wallet, 20);
export const IconoBajar = crear(Download, 20);
export const IconoEscudoCheck = crear(ShieldCheck, 20);
