import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Obtener tasas de cambio
export async function GET(request: NextRequest) {
  try {
    const rates = await query('SELECT * FROM exchange_rates ORDER BY currency_code');

    // Convertir a objeto para fácil acceso
    const ratesMap: { [key: string]: number } = {};
    rates.forEach((rate: any) => {
      ratesMap[rate.currency_code] = parseFloat(rate.rate_to_pyg);
    });

    return NextResponse.json({
      success: true,
      rates: ratesMap,
      ratesDetails: rates
    });

  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Error al obtener tasas de cambio' },
      { status: 500 }
    );
  }
}

// POST - Actualizar tasas de cambio (solo superadmin)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { currency_code, rate_to_pyg } = body;

    if (!currency_code || !rate_to_pyg) {
      return NextResponse.json(
        { error: 'Código de moneda y tasa requeridos' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE exchange_rates SET rate_to_pyg = ?, updated_at = NOW() WHERE currency_code = ?',
      [rate_to_pyg, currency_code]
    );

    return NextResponse.json({
      success: true,
      message: 'Tasa de cambio actualizada'
    });

  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tasa de cambio' },
      { status: 500 }
    );
  }
}














