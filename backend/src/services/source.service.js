import axios from 'axios';
import { logger } from '../utils/logger.js';

export class SourceService {
  /**
   * Cleans raw HTML text, removing navigation, scripts, styling, and extraneous boilerplate
   * @param {string} html
   * @param {number} [maxLength=10000]
   * @returns {string}
   */
  static cleanHtml(html, maxLength = 10000) {
    if (!html || typeof html !== 'string') return '';

    let text = html;

    // 1. Remove script, style, noscript, iframe, svg, head, nav, footer, header tags and their inner content
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ');
    text = text.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ');
    text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');
    text = text.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, ' ');
    text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ');
    text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
    text = text.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ');
    text = text.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ');

    // 2. Convert line break elements to newlines
    text = text.replace(/<(?:br|p|div|h[1-6]|li|tr)[^>]*>/gi, '\n');

    // 3. Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // 4. Decode common HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));

    // 5. Normalize whitespace and newlines
    text = text
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();

    // 6. Truncate to maximum allowable content length for LLM cost and context control
    if (text.length > maxLength) {
      text = text.slice(0, maxLength) + '\n\n[Content truncated to prevent context overflow]';
    }

    return text;
  }

  /**
   * Safely retrieve and clean webpage content from a URL
   * @param {string} url
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean, status: string, content: string, error?: string }>}
   */
  static async fetchAndClean(url, options = {}) {
    if (!url || typeof url !== 'string') {
      return { success: false, status: 'inaccessible', content: '', error: 'Invalid URL' };
    }

    try {
      logger.debug('SOURCE_SERVICE', `Fetching content from: ${url}`);

      const response = await axios.get(url, {
        timeout: options.timeout || 10000, // 10 seconds
        maxRedirects: 5,
        maxContentLength: 5 * 1024 * 1024, // 5MB max
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (Multi-Agent Research Assistant)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
        },
        validateStatus: (status) => status === 200,
      });

      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text') && !contentType.includes('html') && !contentType.includes('json')) {
        logger.warn('SOURCE_SERVICE', `Non-text content type (${contentType}) for: ${url}`);
        return {
          success: false,
          status: 'inaccessible',
          content: '',
          error: `Unsupported content-type: ${contentType}`,
        };
      }

      const rawBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const cleaned = this.cleanHtml(rawBody, options.maxLength || 10000);

      if (cleaned.length < 50) {
        logger.warn('SOURCE_SERVICE', `Retrieved empty or insufficient content (< 50 chars) for: ${url}`);
        return {
          success: false,
          status: 'inaccessible',
          content: '',
          error: 'Page returned empty or unrenderable content',
        };
      }

      logger.debug('SOURCE_SERVICE', `Successfully cleaned ${cleaned.length} chars from: ${url}`);
      return {
        success: true,
        status: 'processed',
        content: cleaned,
      };
    } catch (error) {
      logger.warn('SOURCE_SERVICE', `Failed to fetch ${url}: ${error.message}`);
      return {
        success: false,
        status: 'inaccessible',
        content: '',
        error: error.message,
      };
    }
  }
}
