import {
  AlertCircle,
  Droplets,
  Flame,
  HardHat,
  Megaphone,
  PawPrint,
  ShoppingCart,
  Trash2,
  Truck,
  Waves,
  Wine,
  Wrench,
  Zap,
} from "lucide-react-native";

// ─── Category Icon ────────────────────────────────────────────────────────────

interface CategoryIconProps {
  categoryKey: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function CategoryIcon({
  categoryKey,
  size = 18,
  color = "#2563eb",
  strokeWidth = 2,
}: CategoryIconProps) {
  const props = { size, color, strokeWidth };

  switch (categoryKey) {
    case "noise_disturbance":    return <Megaphone {...props} />;
    case "illegal_dumping":      return <Trash2 {...props} />;
    case "road_damage":          return <Wrench {...props} />;
    case "street_light_outage":  return <Zap {...props} />;
    case "flooding":             return <Waves {...props} />;
    case "illegal_construction": return <HardHat {...props} />;
    case "stray_animals":        return <PawPrint {...props} />;
    case "public_intoxication":  return <Wine {...props} />;
    case "illegal_vending":      return <ShoppingCart {...props} />;
    case "water_supply_issue":   return <Droplets {...props} />;
    case "garbage_collection":   return <Truck {...props} />;
    case "vandalism":            return <Flame {...props} />;
    default:                     return <AlertCircle {...props} />;
  }
}