// Íconos de la interfaz, de Lucide (lucide.dev, licencia ISC): trazo redondeado y legibles en
// tamaños pequeños. Reemplazan a los dibujados a mano del diseño, que en el teléfono se veían
// poco legibles y algunos deformes (pedido del dueño, 2026-10-03). Cada uno conserva el
// tamaño y el grosor que tenía; tamano y grosor los cambian. Los de cuentas y categorías
// (que se eligen y se guardan por nombre) están en iconosPorNombre.jsx.
import {
  SlidersHorizontal,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownUp,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  CircleHelp,
  Clock,
  Contrast,
  CreditCard,
  Download,
  Ellipsis,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Globe,
  GripVertical,
  Heart,
  House,
  Info,
  Landmark,
  Layers,
  LayoutGrid,
  Leaf,
  List,
  ListFilter,
  Lock,
  Minus,
  Moon,
  NotebookText,
  Palette,
  PanelsTopLeft,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Repeat,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Tag,
  TextAlignStart,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  User,
  Wallet,
  Smile,
  Frown,
  Meh,
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
// Reajustar saldo (Sesión 9): controles deslizantes, "ajustar".
export const IconoReajustar = crear(SlidersHorizontal, 18);
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
// En el menú del "+": más y menos, rectos y del mismo tamaño (pedido del dueño, 2026-10-04: las
// flechas en diagonal, una hacia arriba y otra hacia abajo, se veían dispares).
export const IconoIngreso = crear(Plus, 26, 2.4);
export const IconoGasto = crear(Minus, 26, 2.4);
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
export const IconoCamara = crear(Camera, 17);
export const IconoSincronizar = crear(RefreshCw, 20);
export const IconoMoneda = crear(CircleDollarSign);
export const IconoIdioma = crear(Globe);
export const IconoSemana = crear(CalendarDays);
export const IconoArrastrar = crear(GripVertical, 18);
export const IconoCandado = crear(Lock, 18);

// Cuentas, respaldo y vista previa de Apariencia
export const IconoBanco = crear(Landmark, 20);
export const IconoBalanza = crear(Scale, 18);
export const IconoBilletera = crear(Wallet, 20);
// Balance del mes (Sesión 13, pedido del dueño): feliz a favor, triste en contra, normal parejo.
export const IconoCaraFeliz = crear(Smile, 20);
export const IconoCaraTriste = crear(Frown, 20);
export const IconoCaraNormal = crear(Meh, 20);
export const IconoHoja = crear(Leaf, 20);
export const IconoBajada = crear(TrendingDown, 20);
export const IconoCalendarioMes = crear(CalendarDays, 24, 1.8);
export const IconoBajar = crear(Download, 20);
export const IconoEscudoCheck = crear(ShieldCheck, 20);
export const IconoCorazon = crear(Heart, 20, 2);
export const IconoExcel = crear(FileSpreadsheet, 20);
export const IconoCsv = crear(FileText, 20);
