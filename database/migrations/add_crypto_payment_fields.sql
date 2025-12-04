-- Agregar campos para pagos con billetera cripto
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS payment_crypto_wallet VARCHAR(255) NULL COMMENT 'Dirección de billetera cripto',
ADD COLUMN IF NOT EXISTS payment_crypto_network VARCHAR(50) NULL COMMENT 'Red de la criptomoneda (TRC20, ERC20, BEP20, etc.)',
ADD COLUMN IF NOT EXISTS payment_crypto_currency VARCHAR(20) NULL COMMENT 'Tipo de criptomoneda (USDT, BTC, ETH, etc.)';

