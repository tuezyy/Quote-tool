import prisma from '../utils/prisma';

export async function detectTenant(req: any, res: any, next: any) {
  const slugParam = req.query.tenant as string | undefined;
  const host = req.hostname; // e.g. "cabinetsoforlando.com"

  let business = null;

  if (slugParam) {
    // Dev/staging fallback: ?tenant=cabinets-of-orlando
    business = await prisma.business.findUnique({ where: { slug: slugParam } });
  } else {
    // Try exact domain match
    business = await prisma.business.findUnique({ where: { domain: host } });

    if (!business) {
      // Try subdomain: "xyz.yourplatform.com" → slug "xyz"
      const sub = host.split('.')[0];
      if (sub && sub !== 'www') {
        business = await prisma.business.findUnique({ where: { slug: sub } }).catch(() => null);
      }
    }

    if (!business) {
      // Final fallback: use first business in DB (single-tenant deployments)
      business = await prisma.business.findFirst({ orderBy: { createdAt: 'asc' } });
    }
  }

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  req.business = business;
  req.businessId = business.id;
  next();
}
