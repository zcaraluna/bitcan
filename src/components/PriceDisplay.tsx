'use client';

import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface PriceDisplayProps {
  priceInPYG: number;
  showSecondary?: boolean;
  className?: string;
}

export default function PriceDisplay({ priceInPYG, showSecondary = true, className = '' }: PriceDisplayProps) {
  const [rates, setRates] = useState<{ [key: string]: number }>({
    USD: 7300,
    ARS: 7.50,
    BRL: 1450
  });

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates');
      if (response.ok) {
        const data = await response.json();
        setRates(data.rates);
      }
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    }
  };

  const formatPYG = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USD' || currency === 'BRL') {
      return new Intl.NumberFormat('es-PY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } else {
      return new Intl.NumberFormat('es-PY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(amount));
    }
  };

  const convertToUSD = () => rates.USD ? priceInPYG / rates.USD : 0;
  const convertToARS = () => rates.ARS ? priceInPYG / rates.ARS : 0;
  const convertToBRL = () => rates.BRL ? priceInPYG / rates.BRL : 0;

  return (
    <div className={className}>
      {/* Precio principal en PYG */}
      <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
        <DollarSign className="w-5 h-5" />
        <span>{formatPYG(priceInPYG)}</span>
        <span className="text-sm font-normal text-gray-600">PYG</span>
      </div>

      {/* Precios secundarios */}
      {showSecondary && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
          <span>USD {formatCurrency(convertToUSD(), 'USD')}</span>
          <span>•</span>
          <span>ARS {formatCurrency(convertToARS(), 'ARS')}</span>
          <span>•</span>
          <span>BRL {formatCurrency(convertToBRL(), 'BRL')}</span>
        </div>
      )}
    </div>
  );
}
