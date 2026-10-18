// WhatsApp ordering and contact utility

/**
 * Validates and formats a phone number for WhatsApp wa.me links
 * @param {string} rawPhone - Raw phone string (e.g. "+91 98290 12345", "9829012345")
 * @returns {{ valid: boolean, fullNumber?: string, error?: string }}
 */
export function validateWhatsAppNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
    return {
      valid: false,
      error: 'missing'
    };
  }

  // Strip all non-digit characters
  const digits = rawPhone.replace(/\D/g, '');

  // Must have at least 10 digits
  if (digits.length < 10) {
    return {
      valid: false,
      error: 'too_short'
    };
  }

  // Standard Indian 10-digit mobile number -> prefix 91 country code
  if (digits.length === 10) {
    return {
      valid: true,
      fullNumber: '91' + digits
    };
  }

  // 11 digits starting with 0 (e.g. 09829012345) -> replace 0 with 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return {
      valid: true,
      fullNumber: '91' + digits.slice(1)
    };
  }

  // 12 digits starting with 91 (e.g. 919829012345)
  if (digits.length === 12 && digits.startsWith('91')) {
    return {
      valid: true,
      fullNumber: digits
    };
  }

  // International numbers with 11-15 digits
  if (digits.length >= 11 && digits.length <= 15) {
    return {
      valid: true,
      fullNumber: digits
    };
  }

  return {
    valid: false,
    error: 'invalid_format'
  };
}

/**
 * Builds a properly formatted, URL-encoded WhatsApp contact message
 * @param {object} params
 * @param {object} params.product - Product object
 * @param {string} params.quantity - Desired quantity
 * @param {string} params.buyerName - Optional buyer name
 * @param {string} params.customNote - Custom message from buyer
 * @param {string} params.lang - 'hi' | 'en'
 * @returns {{ valid: boolean, url?: string, fullNumber?: string, messageText: string, error?: string }}
 */
export function buildWhatsAppContactUrl({
  product,
  quantity = '1',
  buyerName = '',
  customNote = '',
  lang = 'hi'
}) {
  const phoneValidation = validateWhatsAppNumber(product?.contactPhone);

  const prodName = (lang === 'hi' ? product.nameHi : product.nameEn) || product.nameEn || 'Artisan Product';
  const seller = (lang === 'hi' ? product.sellerNameHi : product.sellerNameEn) || product.sellerNameEn || 'Sakhi Artisan';
  const location = (lang === 'hi' ? product.locationHi : product.locationEn) || product.locationEn || '';

  // Construct clear, respectful message with order inquiry details
  let messageText = '';
  if (lang === 'hi') {
    messageText = `नमस्ते ${seller} जी 🙏\n\nमैंने सखी टेक (Sakhi Tech) पर आपका उत्पाद देखा है:\n• उत्पाद: ${prodName}\n• कीमत: ₹${product.price} (${product.unit || 'प्रति पीस'})\n• स्थान: ${location}\n• पूछताछ मात्रा: ${quantity}\n\n`;
    if (customNote && customNote.trim()) {
      messageText += `संदेश: ${customNote.trim()}\n\n`;
    }
    if (buyerName && buyerName.trim()) {
      messageText += `खरीदार: ${buyerName.trim()}\n\n`;
    }
    messageText += `कृपया बताएं कि क्या यह उपलब्ध है और डिलीवरी कैसे होगी? धन्यवाद!`;
  } else {
    messageText = `Hello ${seller} ji 🙏\n\nI saw your listing on Sakhi Tech:\n• Product: ${prodName}\n• Price: ₹${product.price} (${product.unit || 'per item'})\n• Location: ${location}\n• Inquired Quantity: ${quantity}\n\n`;
    if (customNote && customNote.trim()) {
      messageText += `Note: ${customNote.trim()}\n\n`;
    }
    if (buyerName && buyerName.trim()) {
      messageText += `From: ${buyerName.trim()}\n\n`;
    }
    messageText += `Could you please confirm availability and delivery details? Thank you!`;
  }

  if (!phoneValidation.valid) {
    return {
      valid: false,
      error: phoneValidation.error,
      messageText
    };
  }

  const encodedMessage = encodeURIComponent(messageText);
  const url = `https://wa.me/${phoneValidation.fullNumber}?text=${encodedMessage}`;

  return {
    valid: true,
    fullNumber: phoneValidation.fullNumber,
    url,
    messageText
  };
}
