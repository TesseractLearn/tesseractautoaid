/**
 * Dynamic Pricing Calculation
 * 
 * Pricing model:
 *   Labor = hourlyRate × hours
 *   Subtotal = labor + partsCost
 *   GST = subtotal × 18%
 *   Platform Fee = subtotal × 15%
 *   Total = subtotal + GST + platformFee
 *   Mechanic receives = subtotal - platformFee
 */

const GST_RATE = 0.18;
const PLATFORM_FEE_RATE = 0.15;
const MINIMUM_CHARGE = 200;

export interface PricingBreakdown {
  hourlyRate: number;
  hours: number;
  laborCost: number;
  partsCost: number;
  subtotal: number;
  tax: number;
  platformFee: number;
  total: number;
  mechanicShare: number;
}

export function calculatePricing(
  hourlyRate: number,
  hours: number,
  partsCost: number = 0,
): PricingBreakdown {
  const laborCost = Math.round(hourlyRate * hours);
  const subtotal = Math.max(laborCost + partsCost, MINIMUM_CHARGE);
  const tax = Math.round(subtotal * GST_RATE);
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const total = subtotal + tax + platformFee;
  const mechanicShare = subtotal - platformFee;

  return {
    hourlyRate,
    hours,
    laborCost,
    partsCost,
    subtotal,
    tax,
    platformFee,
    total,
    mechanicShare,
  };
}

/**
 * Quick estimate from a flat mechanic quote (legacy compat)
 */
export function calculateFromQuote(mechanicQuote: number): PricingBreakdown {
  return calculatePricing(mechanicQuote, 1, 0);
}
