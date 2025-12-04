import { NextRequest, NextResponse } from 'next/server';

// API gratuita para obtener tasas de cambio
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener tasas en tiempo real de API externa
    const response = await fetch(API_URL);
    
    if (response.ok) {
      const data = await response.json();
      
      // Calcular tasas respecto al PYG
      // 1 USD = X PYG
      const usdToPyg = data.rates.PYG || 7300;
      
      // Para calcular otras monedas a PYG:
      // 1 ARS = (1 USD / rate USD->ARS) * rate USD->PYG
      const arsToPyg = (1 / (data.rates.ARS || 1)) * usdToPyg;
      const brlToPyg = (1 / (data.rates.BRL || 1)) * usdToPyg;
      
      return NextResponse.json({
        success: true,
        rates: {
          USD: parseFloat(usdToPyg.toFixed(2)),
          ARS: parseFloat(arsToPyg.toFixed(2)),
          BRL: parseFloat(brlToPyg.toFixed(2))
        },
        source: 'live',
        timestamp: new Date().toISOString()
      });
    }
    
    // Si falla la API, usar tasas por defecto
    return NextResponse.json({
      success: true,
      rates: {
        USD: 7300,
        ARS: 7.50,
        BRL: 1450
      },
      source: 'default',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching live rates:', error);
    
    // Retornar tasas por defecto en caso de error
    return NextResponse.json({
      success: true,
      rates: {
        USD: 7300,
        ARS: 7.50,
        BRL: 1450
      },
      source: 'default',
      timestamp: new Date().toISOString()
    });
  }
}














