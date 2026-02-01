import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  console.log('Seeding Stripe products...');
  
  const stripe = await getUncachableStripeClient();

  const plans = [
    {
      name: 'Starter',
      description: 'For small procurement teams getting started - 50 bids/month',
      metadata: {
        tier: 'starter',
        bidsIncluded: '50',
        documentsIncluded: '500',
        storageGb: '5',
        overagePricePerBid: '2.00',
      },
      monthlyPrice: 4900, // $49
      annualPrice: 49900, // $499
    },
    {
      name: 'Professional',
      description: 'For growing organizations with regional needs - 300 bids/month',
      metadata: {
        tier: 'professional',
        bidsIncluded: '300',
        documentsIncluded: '3000',
        storageGb: '25',
        overagePricePerBid: '1.00',
      },
      monthlyPrice: 14900, // $149
      annualPrice: 149900, // $1,499
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with complex requirements - 1500 bids/month',
      metadata: {
        tier: 'enterprise',
        bidsIncluded: '1500',
        documentsIncluded: '15000',
        storageGb: '100',
        overagePricePerBid: '0.50',
      },
      monthlyPrice: 39900, // $399
      annualPrice: 399900, // $3,999
    },
  ];

  for (const plan of plans) {
    // Check if product already exists
    const existingProducts = await stripe.products.search({ 
      query: `name:'${plan.name}'` 
    });
    
    if (existingProducts.data.length > 0) {
      console.log(`Product "${plan.name}" already exists, skipping...`);
      continue;
    }

    // Create product
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });
    console.log(`Created product: ${product.name} (${product.id})`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPrice,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { billing: 'monthly' },
    });
    console.log(`  - Monthly price: $${plan.monthlyPrice / 100}/month (${monthlyPrice.id})`);

    // Create annual price
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.annualPrice,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { billing: 'annual' },
    });
    console.log(`  - Annual price: $${plan.annualPrice / 100}/year (${annualPrice.id})`);
  }

  console.log('Done seeding Stripe products!');
}

seedProducts().catch(console.error);
