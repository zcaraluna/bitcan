import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Obtener todas las categorías
    const categories = await query(`
      SELECT id, name
      FROM course_categories
      ORDER BY name ASC
    `);

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

