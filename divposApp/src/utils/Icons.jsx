import {
  Settings,
  Layers,
  Shuffle,
  Send,
  UserPlus,
  CreditCard,
  FileText,
  DollarSign,
  Globe,
  Tag,
  ChevronRight,
  Home,
  Server,
  Users,
  UserCheck,
  Map,
  Grid,
  Wifi,
  Box,
  LifeBuoy,
  MessageCircle,
  Circle,
  Ticket,
  Wrench,
  UserCog,
  Info,
  MapPin,
  // Tambahkan import baru di bawah ini sesuai log console
  ClipboardList,
  History,
  Database,
  BarChart2,
} from "lucide-react";

export const icons = {
  // Navigation / General
  home: Home,
  server: Server,
  users: Users,
  map: Map,
  "map-pin": MapPin,
  grid: Grid,
  layers: Layers,

  // Actions
  shuffle: Shuffle,
  send: Send,

  // Settings & Tools
  settings: Settings,
  tool: Wrench,
  "user-cog": UserCog,

  // Users
  "user-plus": UserPlus,
  "user-check": UserCheck,

  // Finance / Transaction
  "credit-card": CreditCard,
  "dollar-sign": DollarSign,
  ticket: Ticket,

  // Content / Report
  "file-text": FileText,
  info: Info,
  tag: Tag,
  globe: Globe,
  wifi: Wifi,
  box: Box,

  // UI Helpers
  chevron: ChevronRight,
  dot: Circle,
  "life-buoy": LifeBuoy,
  "message-circle": MessageCircle,

  // Fix Ikon Undefined (Sesuai Log Console Anda)
  "clipboard-list": ClipboardList, // Untuk Transaksi
  history: History, // Untuk Riwayat Transaksi
  database: Database, // Untuk Master Data
  "bar-chart-2": BarChart2, // Untuk Laporan
};
