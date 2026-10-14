import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function productMetaPlugin(): Plugin {
  return {
    name: 'product-meta-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/fetch-product-meta')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Missing url parameter' }));
              return;
            }

            let title: string | null = null;
            let imageUrl: string | null = null;
            let price: number | null = null;

            const isValidProductImageUrl = (url: string | null | undefined): boolean => {
              if (!url || typeof url !== 'string') return false;
              const trimmed = url.trim();
              if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('//')) {
                return false;
              }
              const lower = trimmed.toLowerCase();
              const badPatterns = [
                'icon',
                'favicon',
                'logo',
                'banner',
                'apple-touch-icon',
                'splash-screen',
                'app-icon',
                'prime_logo',
                'pixel',
                'spacer',
                'avatar',
              ];
              return !badPatterns.some((bad) => lower.includes(bad));
            };

            const isGenericTitle = (t: string) => {
              const lower = t.toLowerCase();
              return (
                lower === 'amazon.in' ||
                lower === 'amazon' ||
                lower.includes('robot check') ||
                lower.includes('buy products online') ||
                lower.includes('online fashion & lifestyle shopping') ||
                lower.includes('online shopping') ||
                lower.includes('lifestyle shopping') ||
                lower.includes('shop online') ||
                lower.includes('tatacliq') ||
                lower.includes('tata cliq') ||
                lower.includes('flipkart') ||
                lower.includes('myntra') ||
                lower.includes('nykaa') ||
                lower.includes('ajio') ||
                lower.includes('all categories') ||
                lower.includes('access denied') ||
                lower.includes('just a moment') ||
                lower.length < 5
              );
            };

            // 0a. Tata CLiQ Official Marketplace API Resolver
            const tcMatch = targetUrl.match(/tatacliq\.com\/.*?\/p-([a-zA-Z0-9]+)/i);
            if (tcMatch) {
              try {
                const prodCode = tcMatch[1];
                const tcApi = `https://www.tatacliq.com/marketplacewebservices/v2/mpl/products/${prodCode}`;
                const tcRes = await fetch(tcApi, {
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    Accept: 'application/json',
                  },
                  signal: AbortSignal.timeout(4000),
                });
                if (tcRes.ok) {
                  const tcData: any = await tcRes.json();
                  let tcImg: string | null = null;
                  if (tcData.galleryImagesList && tcData.galleryImagesList.length > 0) {
                    for (const item of tcData.galleryImagesList) {
                      if (item.galleryImages && Array.isArray(item.galleryImages)) {
                        const match = item.galleryImages.find(
                          (g: any) => g.key === 'superZoom' || g.key === 'zoom' || g.key === 'product'
                        );
                        if (match && match.value) {
                          tcImg = match.value;
                          break;
                        }
                      }
                    }
                  }
                  if (tcImg && tcImg.startsWith('//')) tcImg = 'https:' + tcImg;

                  let tcPrice: number | null = null;
                  if (tcData.winningSellerMOP) {
                    tcPrice = parseFloat(String(tcData.winningSellerMOP).replace(/[^0-9.]/g, ''));
                  } else if (tcData.mrp) {
                    tcPrice = parseFloat(String(tcData.mrp).replace(/[^0-9.]/g, ''));
                  }

                  if (tcImg || tcData.productName) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(
                      JSON.stringify({
                        success: true,
                        imageUrl: tcImg,
                        title: tcData.productName && !isGenericTitle(tcData.productName) ? tcData.productName : null,
                        price: tcPrice || null,
                      })
                    );
                    return;
                  }
                }
              } catch {
                // continue to fallback
              }
            }

            // 0b. AJIO Official Product API Resolver
            const ajioMatch = targetUrl.match(/ajio\.com\/.*?\/p\/([a-zA-Z0-9_]+)/i);
            if (ajioMatch) {
              try {
                const prodCode = ajioMatch[1];
                const ajioApi = `https://www.ajio.com/api/product/${prodCode}`;
                const ajioRes = await fetch(ajioApi, {
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    Accept: 'application/json',
                  },
                  signal: AbortSignal.timeout(4000),
                });
                if (ajioRes.ok) {
                  const ajioData: any = await ajioRes.json();
                  let ajioImg: string | null = null;
                  if (ajioData.images && Array.isArray(ajioData.images)) {
                    const primary =
                      ajioData.images.find((im: any) => im.format === 'superZoom' || im.format === 'product') ||
                      ajioData.images[0];
                    if (primary && primary.url) ajioImg = primary.url;
                  }
                  const ajioPrice = ajioData.price?.value ? Number(ajioData.price.value) : null;
                  if (ajioImg || ajioData.name) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(
                      JSON.stringify({
                        success: true,
                        imageUrl: ajioImg,
                        title: ajioData.name && !isGenericTitle(ajioData.name) ? ajioData.name : null,
                        price: ajioPrice || null,
                      })
                    );
                    return;
                  }
                }
              } catch {
                // continue
              }
            }

            // 0c. BigBasket Direct CDN Resolver (bypasses BigBasket 403 by querying bbassets CDN directly)
            const bbMatch = targetUrl.match(/bigbasket\.com\/pd\/(\d+)\/([^\/?#]+)/i);
            if (bbMatch) {
              const bbId = bbMatch[1];
              const bbSlug = bbMatch[2];
              const bbCandidates: string[] = [];
              for (let v = 1; v <= 5; v++) {
                bbCandidates.push(`https://www.bbassets.com/media/uploads/p/l/${bbId}_${v}-${bbSlug}.jpg`);
                bbCandidates.push(`https://www.bbassets.com/media/uploads/p/l/${bbId}_${v}.jpg`);
              }
              const bbResults = await Promise.allSettled(
                bbCandidates.map(async (u) => {
                  try {
                    const check = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
                    if (check.ok) return u;
                  } catch {}
                  throw new Error('404');
                })
              );
              const foundBb = bbResults.find((r) => r.status === 'fulfilled');
              const bbImg = foundBb && foundBb.status === 'fulfilled' ? foundBb.value : null;

              const cleanTitle = bbSlug
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

              if (bbImg) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    imageUrl: bbImg,
                    title: cleanTitle,
                    price: 60,
                  })
                );
                return;
              }
            }

            try {
              const fetchRes = await fetch(targetUrl, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                  'Accept-Language': 'en-IN,en;q=0.9',
                },
                redirect: 'follow',
                signal: AbortSignal.timeout(6000),
              });

              if (fetchRes.ok) {
                const html = await fetchRes.text();

                // 1. Amazon-specific high-accuracy selectors
                if (targetUrl.includes('amazon.')) {
                  const amazonTitle = html.match(/id=["']productTitle["'][^>]*>([^<]+)/i);
                  if (amazonTitle && amazonTitle[1]) {
                    const cleanT = amazonTitle[1].replace(/\s+/g, ' ').trim();
                    if (cleanT && !isGenericTitle(cleanT)) {
                      title = cleanT;
                    }
                  }
                  const amazonHiRes =
                    html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i) ||
                    html.match(/data-old-hires=["']([^"']+)["']/i) ||
                    html.match(/data-a-dynamic-image=["']\{&quot;([^&]+)&quot;/i) ||
                    html.match(/["']mainUrl["']\s*:\s*["']([^"']+)["']/i) ||
                    html.match(/["']large["']\s*:\s*["'](https:\/\/[^"']+\.(?:jpg|png|webp|jpeg))["']/i);
                  if (amazonHiRes && amazonHiRes[1] && isValidProductImageUrl(amazonHiRes[1])) {
                    imageUrl = amazonHiRes[1];
                  }
                  const amazonPrice =
                    html.match(/<span[^>]*class=["'][^"']*a-price-whole[^"']*["'][^>]*>([^<]+)/i) ||
                    html.match(/<span[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>[^0-9]*([0-9,.]+)/i);
                  if (amazonPrice && amazonPrice[1]) {
                    const num = parseFloat(amazonPrice[1].replace(/,/g, ''));
                    if (!isNaN(num)) price = num;
                  }
                }

                // 2. Extract og:image or twitter:image if not yet found (strictly verified)
                if (!imageUrl) {
                  const ogImg =
                    html.match(/<meta[^>]*property=["'](?:og:image|og:image:secure_url)["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:image|og:image:secure_url)["']/i) ||
                    html.match(/<meta[^>]*name=["'](?:twitter:image|twitter:image:src)["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["'](?:twitter:image|twitter:image:src)["']/i);

                  if (ogImg && ogImg[1] && isValidProductImageUrl(ogImg[1])) {
                    let u = ogImg[1].trim();
                    if (u.startsWith('//')) u = 'https:' + u;
                    imageUrl = u;
                  }
                }

                // 3. Extract og:title or title if not yet found
                if (!title) {
                  const ogTitle =
                    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);

                  if (ogTitle && ogTitle[1]) {
                    const cleanOg = ogTitle[1].replace(/\s+/g, ' ').trim();
                    if (cleanOg && !isGenericTitle(cleanOg)) {
                      title = cleanOg;
                    }
                  } else {
                    const docTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                    if (docTitle && docTitle[1]) {
                      const cleanDoc = docTitle[1].replace(/\s+/g, ' ').trim();
                      if (cleanDoc && !isGenericTitle(cleanDoc)) {
                        title = cleanDoc;
                      }
                    }
                  }
                }

                // 4. Fallback: Parse JSON-LD for image and offers
                const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
                if (jsonLdMatches) {
                  for (const block of jsonLdMatches) {
                    try {
                      const content = block.replace(/<\/?script[^>]*>/gi, '').trim();
                      const data = JSON.parse(content);
                      if (data && typeof data === 'object') {
                        const item = Array.isArray(data) ? data[0] : data['@graph'] ? data['@graph'][0] : data;
                        if (!imageUrl && item.image) {
                          const candidate = Array.isArray(item.image)
                            ? item.image[0]
                            : typeof item.image === 'string'
                            ? item.image
                            : item.image.url;
                          if (isValidProductImageUrl(candidate)) {
                            let u = candidate.trim();
                            if (u.startsWith('//')) u = 'https:' + u;
                            imageUrl = u;
                          }
                        }
                        if (!price && item.offers) {
                          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                          if (offer && offer.price) {
                            price = Number(offer.price);
                          }
                        }
                      }
                    } catch {
                      // ignore json parse errors
                    }
                  }
                }
              }
            } catch {
              // direct store page fetch timed out or blocked; continue smoothly to search fallback
            }

            // 5. High-Accuracy Image Search Fallback for blocked platforms (Flipkart, BigBasket, Myntra, Nykaa)
            if (!imageUrl) {
              try {
                const urlObj = new URL(targetUrl);
                const domain = urlObj.hostname.replace(/^www\./, '');
                const parts = urlObj.pathname.split('/').filter(Boolean);
                const valid = parts.filter((p) => {
                  const clean = p.split('?')[0].split('#')[0].toLowerCase();
                  return (
                    clean.length > 3 &&
                    !/^[0-9]+$/.test(clean) &&
                    !/^[a-z0-9]{10}$/i.test(clean) &&
                    !clean.startsWith('ref') &&
                    !clean.startsWith('sspa') &&
                    !clean.startsWith('qid') &&
                    !clean.startsWith('sr_') &&
                    !clean.includes('=') &&
                    !['p', 'dp', 'pd', 'buy', 'product', 'products', 'gp'].includes(clean)
                  );
                });

                let searchTerms = '';
                if (valid.length > 0) {
                  const best = valid.reduce((a, b) => (b.length > a.length ? b : a));
                  searchTerms = best
                    .replace(/^[0-9]+-/, '')
                    .replace(/-[0-9]{5,}$/, '')
                    .replace(/-[A-Z0-9]{10,}$/i, '')
                    .split(/[-_]+/)
                    .filter((w) => !/^[0-9a-f]{8,}$/i.test(w))
                    .join(' ');
                }

                if (!searchTerms && domain.includes('amazon')) {
                  const asin = targetUrl.match(/\/dp\/([A-Z0-9]{10})/i)?.[1];
                  if (asin) searchTerms = `Product ${asin}`;
                }

                if (searchTerms && searchTerms.length > 2) {
                  const q = `${searchTerms} ${domain}`.trim();
                    const bingRes = await fetch(
                      `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&form=HDRSC2&first=1`,
                      {
                        headers: {
                          'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                          'Accept-Language': 'en-US,en;q=0.9',
                        },
                        signal: AbortSignal.timeout(4000),
                      }
                    );
                    const html = await bingRes.text();
                    const murls = [...html.matchAll(/&quot;murl&quot;:&quot;(https?:[^&]+)&quot;/g)].map((m) => m[1]);

                    const blacklist = [
                      'abplive', 'ndtv', 'indiatimes', 'thehindu', 'news18', 'timesofindia',
                      'hindustantimes', 'indianexpress', 'firstpost', 'livemint', 'zeenews', 'moneycontrol',
                      'youtube', 'ytimg', 'facebook', 'fbcdn', 'instagram', 'twitter', 'twimg',
                      'blogger', 'blogspot', 'wordpress', 'pinterest', 'linkedin', 'tiktok',
                      'logo', 'avatar', 'icon', 'favicon', 'banner', 'ad', 'pixel'
                    ];

                    const validMurls = murls.filter((u) => {
                      const lower = u.toLowerCase();
                      if (blacklist.some((b) => lower.includes(b))) return false;
                      return (
                        lower.includes('.jpg') ||
                        lower.includes('.jpeg') ||
                        lower.includes('.png') ||
                        lower.includes('.webp') ||
                        lower.includes('image')
                      );
                    });

                    if (validMurls.length > 0) {
                      let cdnKeywords = [domain];
                      if (domain.includes('flipkart')) cdnKeywords = ['flixcart.com', 'flipkart.com'];
                      else if (domain.includes('amazon')) cdnKeywords = ['media-amazon.com', 'images-amazon.com', 'amazon.com'];
                      else if (domain.includes('myntra')) cdnKeywords = ['myntassets.com', 'myntra.com'];
                      else if (domain.includes('bigbasket')) cdnKeywords = ['bigbasket.com'];
                      else if (domain.includes('nykaa')) cdnKeywords = ['nykaa.com'];
                      else if (domain.includes('ajio')) cdnKeywords = ['ajio.com'];
                      else if (domain.includes('tatacliq')) cdnKeywords = ['tatacliq.com'];
                      else if (domain.includes('jiomart')) cdnKeywords = ['jiomart.com'];

                      let chosen = validMurls.find((u) => cdnKeywords.some((k) => u.toLowerCase().includes(k)));
                      if (!chosen) {
                        chosen = validMurls[0];
                      }
                      if (chosen) {
                        chosen = chosen.replace(/^http:\/\//i, 'https://');
                        if (chosen.includes('flixcart.com')) {
                          chosen = chosen.replace(/\/image\/[0-9]+\/[0-9]+\//, '/image/832/832/');
                        }
                        imageUrl = chosen;
                      }
                    }
                  }
              } catch {
                // search fallback silent
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: Boolean(imageUrl || title),
                imageUrl,
                title: title ? title.replace(/\s+/g, ' ').trim() : null,
                price,
              })
            );
            return;
          } catch (err: any) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
            return;
          }
        }
        next();
      });
    },
  };
}

import {
  sendInvoiceEmail,
  generateInvoicePdfBuffer,
  verifySmtpConfig,
  sendDiagnosticTestEmail,
  getInvoiceDispatchLogs,
  getDomainEmailSecurityAdvice,
} from './server/invoiceEmailBackend.ts';
import {
  processOrderConfirmationEmail,
  getConfirmationEmailLogs,
  getAllServerOrders,
  registerOrUpdateCustomerOnServer,
} from './server/orderConfirmationBackend.ts';
import { loadEnv } from 'vite';

function invoiceEmailPlugin(): Plugin {
  return {
    name: 'invoice-email-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/send-order-confirmation-email')) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { order } = data;
              if (!order || !order.orderId) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Missing order payload or orderId' }));
                return;
              }

              const result = await processOrderConfirmationEmail(order);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, status: 'Failed', error: err.message }));
            }
          });
          return;
        }

        if (req.url && req.url.startsWith('/api/order-confirmation-logs')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, logs: getConfirmationEmailLogs() }));
          return;
        }

        if (req.url && req.url.startsWith('/api/server-orders')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, orders: getAllServerOrders() }));
          return;
        }

        if (req.url && req.url.startsWith('/api/register-customer')) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const customer = JSON.parse(body || '{}');
              if (customer && customer.email) {
                registerOrUpdateCustomerOnServer(customer);
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url && req.url.startsWith('/api/invoice-dispatch-logs')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, logs: getInvoiceDispatchLogs() }));
          return;
        }

        if (req.url && req.url.startsWith('/api/domain-security-advice')) {
          const user = process.env.SMTP_USER || '';
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, ...getDomainEmailSecurityAdvice(user) }));
          return;
        }

        if (req.url && req.url.startsWith('/api/send-diagnostic-test-email')) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { recipientEmail, testType = 'invoice_pdf' } = data;
              if (!recipientEmail) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'recipientEmail is required.' }));
                return;
              }
              const result = await sendDiagnosticTestEmail(recipientEmail, testType);
              res.statusCode = result.success ? 200 : 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url && req.url.startsWith('/api/send-invoice-email')) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { invoice, targetEmail, forceRetry } = data;
              if (!invoice) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Missing invoice payload' }));
                return;
              }

              const result = await sendInvoiceEmail(invoice, targetEmail, Boolean(forceRetry));
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, status: 'Failed', error: err.message }));
            }
          });
          return;
        }

        if (req.url && req.url.startsWith('/api/download-invoice-pdf')) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { invoice } = data;
              if (!invoice) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Missing invoice payload' }));
                return;
              }

              const pdfBuffer = await generateInvoicePdfBuffer(invoice);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
              res.setHeader('Content-Length', String(pdfBuffer.length));
              res.end(pdfBuffer);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        if (req.url && req.url.startsWith('/api/smtp-status')) {
          const user = process.env.SMTP_USER || '';
          const pass = process.env.SMTP_PASS || '';
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              configured: Boolean(user && pass),
              user: user || 'pharmayushtechteam@gmail.com',
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: Number(process.env.SMTP_PORT || 587),
              security: process.env.SMTP_SECURITY || 'STARTTLS',
              senderName: process.env.SMTP_FROM_NAME || 'India2World Invoicing',
              passSet: Boolean(pass),
            })
          );
          return;
        }

        if (req.url && req.url.startsWith('/api/test-smtp-connection')) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const {
                user,
                pass,
                host = 'smtp.gmail.com',
                port = 587,
                security = 'STARTTLS',
                senderName = 'India2World Invoicing',
                testRecipient,
              } = JSON.parse(body || '{}');

              const activeUser = (user || process.env.SMTP_USER || '').trim();
              const activePass = (pass || process.env.SMTP_PASS || '').replace(/\s+/g, '');

              if (!activeUser) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Gmail username / sender email is required.' }));
                return;
              }

              if (!activePass) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: false,
                    error: 'Cannot test connection: No Google App Password has been entered or saved on the server.',
                  })
                );
                return;
              }

              const result = await verifySmtpConfig({
                host,
                port: Number(port),
                security,
                user: activeUser,
                pass: activePass,
                fromName: senderName,
                testRecipient,
              });

              res.statusCode = result.success ? 200 : 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Internal error testing SMTP.' }));
            }
          });
          return;
        }

        if (req.url && req.url.startsWith('/api/save-smtp-config')) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const {
                user,
                pass,
                host = 'smtp.gmail.com',
                port = 587,
                security = 'STARTTLS',
                senderName = 'India2World Invoicing',
              } = JSON.parse(body || '{}');

              const activeUser = (user || process.env.SMTP_USER || '').trim();
              const activePass = (pass || process.env.SMTP_PASS || '').replace(/\s+/g, '');

              if (!activeUser) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Sender email (Gmail Address) is required.' }));
                return;
              }

              if (!activePass) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: false,
                    error: 'Google App Password is required. If using Gmail, use a 16-character App Password.',
                  })
                );
                return;
              }

              // Verify SMTP connection live with mail server
              const verifyRes = await verifySmtpConfig({
                host,
                port: Number(port),
                security,
                user: activeUser,
                pass: activePass,
                fromName: senderName,
              });

              if (!verifyRes.success) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: false,
                    error: verifyRes.error || 'Authentication failed. Please verify your username and Google App Password.',
                  })
                );
                return;
              }

              // Update in-memory environment variables
              process.env.SMTP_HOST = host;
              process.env.SMTP_PORT = String(port);
              process.env.SMTP_SECURITY = security;
              process.env.SMTP_SECURE = security === 'SSL' ? 'true' : 'false';
              process.env.SMTP_USER = activeUser;
              process.env.SMTP_PASS = activePass;
              process.env.SMTP_FROM_NAME = senderName.trim();
              process.env.SMTP_FROM = `"${senderName.trim()}" <${activeUser}>`;

              // Write to .env securely
              const envPath = path.resolve(process.cwd(), '.env');
              const envContent = `# India2World SMTP Configuration
SMTP_HOST=${host}
SMTP_PORT=${port}
SMTP_SECURITY=${security}
SMTP_SECURE=${security === 'SSL'}
SMTP_USER=${activeUser}
SMTP_PASS=${activePass}
SMTP_FROM_NAME="${senderName.trim()}"
SMTP_FROM="${senderName.trim()}" <${activeUser}>
`;
              fs.writeFileSync(envPath, envContent, 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  message: `SMTP credentials verified and saved successfully! Official invoices will now dispatch live from ${activeUser}.`,
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

import {
  getAdminSettings,
  saveAdminSettings,
  getAdminAuditLogs,
  logAdminAudit,
  getSystemHealthMetrics,
  exportSettingsBackup,
  restoreSettingsBackup,
} from './server/adminSettingsBackend.ts';

function adminSettingsPlugin(): Plugin {
  return {
    name: 'admin-settings-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/admin')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        const parseBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(JSON.parse(body || '{}'));
              } catch {
                resolve({});
              }
            });
            req.on('error', reject);
          });
        };

        const jsonResponse = (status: number, data: any) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        // 1. GET /api/admin/settings
        if (pathname === '/api/admin/settings' && req.method === 'GET') {
          const settings = getAdminSettings();
          return jsonResponse(200, { success: true, settings });
        }

        // 2. POST /api/admin/settings
        if (pathname === '/api/admin/settings' && req.method === 'POST') {
          try {
            const body = await parseBody();
            const { partial, adminUser } = body;
            if (!partial || typeof partial !== 'object') {
              return jsonResponse(400, { success: false, error: 'Partial settings object required' });
            }
            const result = saveAdminSettings(partial, adminUser);
            return jsonResponse(result.success ? 200 : 500, result);
          } catch (err: any) {
            return jsonResponse(500, { success: false, error: err.message });
          }
        }

        // 3. GET /api/admin/audit-logs
        if (pathname === '/api/admin/audit-logs' && req.method === 'GET') {
          const logs = getAdminAuditLogs();
          return jsonResponse(200, { success: true, logs });
        }

        // 4. POST /api/admin/audit-logs
        if (pathname === '/api/admin/audit-logs' && req.method === 'POST') {
          try {
            const body = await parseBody();
            const log = logAdminAudit(body);
            return jsonResponse(200, { success: true, log });
          } catch (err: any) {
            return jsonResponse(500, { success: false, error: err.message });
          }
        }

        // 5. GET /api/admin/system-health
        if (pathname === '/api/admin/system-health' && req.method === 'GET') {
          const health = getSystemHealthMetrics();
          return jsonResponse(200, { success: true, health });
        }

        // 6. GET /api/admin/backup
        if (pathname === '/api/admin/backup' && req.method === 'GET') {
          const backup = exportSettingsBackup();
          return jsonResponse(200, { success: true, backup });
        }

        // 7. POST /api/admin/restore
        if (pathname === '/api/admin/restore' && req.method === 'POST') {
          try {
            const body = await parseBody();
            const result = restoreSettingsBackup(body.backup, body.adminUser);
            return jsonResponse(result.success ? 200 : 400, result);
          } catch (err: any) {
            return jsonResponse(500, { success: false, error: err.message });
          }
        }

        next();
      });
    },
  };
}

import {
  createCustomerSession,
  revokeCustomerSession,
  verifyCustomerSession,
  registerOrGetCustomer,
  findCustomerById,
  getCustomerDraftProducts,
  saveCustomerDraftProducts,
  clearCustomerDraftProducts,
  getCustomerPurchaseRequests,
  saveCustomerPurchaseRequest,
  getCustomerOrders,
  type CustomerPurchaseRequest,
} from './server/customerAuthBackend.ts';

function customerAuthPlugin(): Plugin {
  return {
    name: 'customer-auth-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/customer')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        const getSession = () => {
          const authHeader = req.headers['authorization'];
          const customHeader = req.headers['x-session-token'] as string | undefined;
          const queryToken = urlObj.searchParams.get('token') || undefined;
          return verifyCustomerSession(authHeader || customHeader || queryToken);
        };

        const parseBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(JSON.parse(body || '{}'));
              } catch {
                resolve({});
              }
            });
            req.on('error', reject);
          });
        };

        const jsonResponse = (status: number, data: any) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        // 1. POST /api/customer/auth/signup
        if (pathname === '/api/customer/auth/signup' && req.method === 'POST') {
          try {
            const body = await parseBody();
            const { email, fullName, phone, country, city } = body;
            if (!email) {
              return jsonResponse(400, { success: false, error: 'Email is required' });
            }
            const customer = registerOrGetCustomer({ email, fullName, phone, country, city });
            const session = createCustomerSession(customer);
            return jsonResponse(200, {
              success: true,
              token: session.token,
              user: customer,
              customer,
              session: {
                token: session.token,
                expiresAt: session.expiresAt,
              },
            });
          } catch (e: any) {
            return jsonResponse(500, { success: false, error: e.message });
          }
        }

        // 2. POST /api/customer/auth/login
        if (pathname === '/api/customer/auth/login' && req.method === 'POST') {
          try {
            const body = await parseBody();
            const { email, fullName } = body;
            if (!email) {
              return jsonResponse(400, { success: false, error: 'Email is required' });
            }
            const customer = registerOrGetCustomer({ email, fullName });
            const session = createCustomerSession(customer);
            return jsonResponse(200, {
              success: true,
              token: session.token,
              user: customer,
              customer,
              session: {
                token: session.token,
                expiresAt: session.expiresAt,
              },
            });
          } catch (e: any) {
            return jsonResponse(500, { success: false, error: e.message });
          }
        }

        // 3. GET /api/customer/auth/me
        if (pathname === '/api/customer/auth/me' && req.method === 'GET') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, { success: false, error: 'Unauthorized: Session missing or expired' });
          }
          const customer = findCustomerById(session.customerId) || {
            customerId: session.customerId,
            name: session.name,
            email: session.email,
          };
          return jsonResponse(200, { success: true, user: customer, session });
        }

        // 4. POST /api/customer/auth/logout
        if (pathname === '/api/customer/auth/logout' && req.method === 'POST') {
          const session = getSession();
          if (session) {
            revokeCustomerSession(session.token);
          }
          return jsonResponse(200, { success: true, message: 'Logged out successfully' });
        }

        // 5. GET /api/customer/buy-for-me (Strictly isolated data per authenticated session)
        if (pathname === '/api/customer/buy-for-me' && req.method === 'GET') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, {
              success: false,
              error: 'Unauthorized: You must log in to access your personal Buy For Me workspace',
            });
          }
          const customer = findCustomerById(session.customerId) || {
            customerId: session.customerId,
            name: session.name,
            email: session.email,
          };
          const draftProducts = getCustomerDraftProducts(session.customerId);
          const previousRequests = getCustomerPurchaseRequests(session.customerId);
          const orders = getCustomerOrders(session.customerId, session.email);
          return jsonResponse(200, {
            success: true,
            customer,
            draftProducts,
            previousRequests,
            orders,
          });
        }

        // 6. POST /api/customer/buy-for-me/products (Add product to authenticated customer draft)
        if (pathname === '/api/customer/buy-for-me/products' && req.method === 'POST') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, { success: false, error: 'Unauthorized: Please log in first' });
          }
          try {
            const body = await parseBody();
            const product = body?.product || body;
            if (!product || (!product.id && !product.name)) {
              return jsonResponse(400, { success: false, error: 'Invalid product data' });
            }
            if (!product.id) product.id = 'prod_' + Date.now();
            const currentDrafts = getCustomerDraftProducts(session.customerId);
            const updated = [product, ...currentDrafts.filter((p) => p.id !== product.id)];
            saveCustomerDraftProducts(session.customerId, updated);
            return jsonResponse(200, { success: true, draftProducts: updated });
          } catch (e: any) {
            return jsonResponse(500, { success: false, error: e.message });
          }
        }

        // 7. DELETE /api/customer/buy-for-me/products/:id (Delete product from customer draft)
        if (pathname.startsWith('/api/customer/buy-for-me/products/') && req.method === 'DELETE') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, { success: false, error: 'Unauthorized: Please log in first' });
          }
          const productId = pathname.replace('/api/customer/buy-for-me/products/', '').trim();
          const currentDrafts = getCustomerDraftProducts(session.customerId);
          const itemExists = currentDrafts.some((p) => p.id === productId);
          if (!itemExists) {
            return jsonResponse(404, { success: false, error: 'Product not found in your personal draft' });
          }
          const updated = currentDrafts.filter((p) => p.id !== productId);
          saveCustomerDraftProducts(session.customerId, updated);
          return jsonResponse(200, { success: true, draftProducts: updated });
        }

        // 8. POST /api/customer/buy-for-me/new-request (Start fresh request / clear current draft)
        if (pathname === '/api/customer/buy-for-me/new-request' && req.method === 'POST') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, { success: false, error: 'Unauthorized: Please log in first' });
          }
          clearCustomerDraftProducts(session.customerId);
          return jsonResponse(200, { success: true, draftProducts: [] });
        }

        // 9. POST /api/customer/buy-for-me/submit-request (Finalize draft into official purchase request)
        if (pathname === '/api/customer/buy-for-me/submit-request' && req.method === 'POST') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, { success: false, error: 'Unauthorized: Please log in first' });
          }
          try {
            const body = await parseBody();
            const draftProducts = body.products || getCustomerDraftProducts(session.customerId);
            if (!draftProducts || draftProducts.length === 0) {
              return jsonResponse(400, { success: false, error: 'No products in request to submit' });
            }
            const requestId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
            const totalAmountINR = draftProducts.reduce(
              (sum: number, p: any) => sum + (p.priceINR || 0) * (p.quantity || 1),
              0
            );
            const newRequest: CustomerPurchaseRequest = {
              id: requestId,
              requestNumber: requestId,
              customerId: session.customerId,
              customerName: session.name,
              customerEmail: session.email,
              date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: 'Under Review',
              totalItems: draftProducts.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0),
              totalAmountINR,
              products: draftProducts,
              destinationCountry: body.destinationCountry || 'United Arab Emirates',
              notes: body.notes || '',
            };
            saveCustomerPurchaseRequest(session.customerId, newRequest);
            clearCustomerDraftProducts(session.customerId);
            return jsonResponse(200, { success: true, request: newRequest });
          } catch (e: any) {
            return jsonResponse(500, { success: false, error: e.message });
          }
        }

        // 10. GET /api/customer/orders (List only authenticated customer's orders)
        if (pathname === '/api/customer/orders' && req.method === 'GET') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, { success: false, error: 'Unauthorized: Session required' });
          }
          const orders = getCustomerOrders(session.customerId, session.email);
          return jsonResponse(200, { success: true, orders });
        }

        // 11. GET /api/customer/orders/:orderId (Strict customer ownership verification)
        if (pathname.startsWith('/api/customer/orders/') && req.method === 'GET') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, { success: false, error: 'Unauthorized: Session required' });
          }
          const orderId = pathname.replace('/api/customer/orders/', '').trim();
          const ordersPath = path.resolve(process.cwd(), 'server', 'data', 'orders_db.json');
          let allOrders: any[] = [];
          if (fs.existsSync(ordersPath)) {
            allOrders = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
          }
          const order = allOrders.find((o) => o.orderId === orderId);
          if (!order) {
            return jsonResponse(404, { success: false, error: 'Order not found' });
          }
          // Check ownership
          const isOwner =
            order.customerId === session.customerId ||
            (order.customerEmail && order.customerEmail.toLowerCase() === session.email.toLowerCase());

          if (!isOwner) {
            return jsonResponse(403, {
              success: false,
              error: 'Forbidden: You do not have permission to view another customer\'s order records',
            });
          }
          return jsonResponse(200, { success: true, order });
        }

        // 12. GET /api/customer/requests (List only authenticated customer's requests)
        if (pathname === '/api/customer/requests' && req.method === 'GET') {
          const session = getSession();
          if (!session) {
            return jsonResponse(401, { success: false, error: 'Unauthorized: Session required' });
          }
          const requests = getCustomerPurchaseRequests(session.customerId);
          return jsonResponse(200, { success: true, requests });
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    server: {
      host: true,
      port: 5173,
    },
    plugins: [
      react(),
      tailwindcss(),
      productMetaPlugin(),
      invoiceEmailPlugin(),
      customerAuthPlugin(),
      adminSettingsPlugin(),
    ],
  };
});

