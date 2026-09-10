import Image from "next/image";
import { BRAND } from "@/lib/brand";
export function BrandLogo({ size = 44 }: { size?: number }) { return <Image src={BRAND.logo} alt={`Logo ${BRAND.name}`} width={size} height={size} unoptimized className="shrink-0 rounded-full bg-white object-contain" />; }
