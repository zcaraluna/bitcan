import { NextRequest, NextResponse } from 'next/server';

interface NetworkInfo {
  ip: string;
  isp?: string;
  organization?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  isp_type?: string;
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
  latitude?: number;
  longitude?: number;
}

function getClientIP(request: NextRequest): string {
  // Intentar obtener la IP real del cliente
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for puede contener múltiples IPs, tomar la primera
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback: intentar obtener desde la conexión
  return 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Si no podemos obtener la IP, retornar error
    if (clientIP === 'unknown') {
      return NextResponse.json({
        success: false,
        error: 'No se pudo detectar la IP del cliente'
      }, { status: 400 });
    }

    // Usar ip-api.com (gratuito, sin API key, hasta 45 requests/min)
    // Alternativa: ipapi.co (requiere API key para más features)
    try {
      const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query,proxy,hosting`);
      
      if (!response.ok) {
        throw new Error('Error al consultar servicio de geolocalización');
      }

      const data = await response.json();
      
      if (data.status === 'fail') {
        return NextResponse.json({
          success: true,
          data: {
            ip: clientIP,
            isp: 'No disponible',
            organization: 'No disponible',
            country: 'No disponible',
            region: 'No disponible',
            city: 'No disponible',
            timezone: 'No disponible',
            is_vpn: false,
            is_proxy: data.proxy || false,
            is_tor: false,
            latitude: null,
            longitude: null,
          }
        });
      }

      // Detectar si es VPN/Proxy basado en varios factores
      const isVPN = data.hosting === true || data.proxy === true;
      const isProxy = data.proxy === true;
      
      // El servicio no detecta Tor directamente, pero podemos inferir
      // basado en ciertos patrones (esto es una aproximación)
      const isTor = data.org?.toLowerCase().includes('tor') || false;

      return NextResponse.json({
        success: true,
        data: {
          ip: data.query || clientIP,
          isp: data.isp || 'No disponible',
          organization: data.org || 'No disponible',
          country: data.country || 'No disponible',
          region: data.regionName || data.region || 'No disponible',
          city: data.city || 'No disponible',
          timezone: data.timezone || 'No disponible',
          isp_type: data.as || 'No disponible',
          is_vpn: isVPN,
          is_proxy: isProxy,
          is_tor: isTor,
          latitude: data.lat || null,
          longitude: data.lon || null,
        } as NetworkInfo
      });

    } catch (apiError) {
      console.error('Error fetching IP info:', apiError);
      
      // Retornar al menos la IP si el servicio externo falla
      return NextResponse.json({
        success: true,
        data: {
          ip: clientIP,
          isp: 'No disponible (servicio externo no disponible)',
          organization: 'No disponible',
          country: 'No disponible',
          region: 'No disponible',
          city: 'No disponible',
          timezone: 'No disponible',
          is_vpn: false,
          is_proxy: false,
          is_tor: false,
          latitude: null,
          longitude: null,
        }
      });
    }

  } catch (error) {
    console.error('Error detecting network:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al detectar la información de red' 
      },
      { status: 500 }
    );
  }
}

