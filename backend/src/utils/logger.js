const formatTimestamp = () => new Date().toISOString();

const sanitize = (message) => {
  if (typeof message !== 'string') return message;
  // Mask potential API keys (e.g. sk-..., tvly-...)
  return message
    .replace(/(sk-[a-zA-Z0-9_-]{8})[a-zA-Z0-9_-]+/g, '$1***')
    .replace(/(tvly-[a-zA-Z0-9_-]{6})[a-zA-Z0-9_-]+/g, '$1***');
};

export const logger = {
  info: (tag, message, meta = null) => {
    const formattedMeta = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[${formatTimestamp()}] [INFO] [${tag}] ${sanitize(message)}${formattedMeta}`);
  },
  warn: (tag, message, meta = null) => {
    const formattedMeta = meta ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`[${formatTimestamp()}] [WARN] [${tag}] ${sanitize(message)}${formattedMeta}`);
  },
  error: (tag, message, error = null) => {
    const errorDetails = error ? (error.stack || error.message || JSON.stringify(error)) : '';
    console.error(`[${formatTimestamp()}] [ERROR] [${tag}] ${sanitize(message)} ${errorDetails}`);
  },
  debug: (tag, message, meta = null) => {
    if (process.env.NODE_ENV !== 'production') {
      const formattedMeta = meta ? ` ${JSON.stringify(meta)}` : '';
      console.debug(`[${formatTimestamp()}] [DEBUG] [${tag}] ${sanitize(message)}${formattedMeta}`);
    }
  },
};
