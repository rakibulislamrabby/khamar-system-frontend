import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Native: HTML → PDF file → share sheet.
 * Web: do NOT use window.open (blank tab). Print invoice HTML
 * from a hidden iframe only — never the app page with tabs.
 */
export async function downloadInvoicePdf(html: string, dialogTitle: string) {
  if (Platform.OS === 'web') {
    printHtmlViaHiddenIframe(html);
    return;
  }

  const file = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert(dialogTitle, file.uri);
  }
}

function printHtmlViaHiddenIframe(html: string) {
  if (typeof document === 'undefined') {
    throw new Error('Print is only available in the browser');
  }

  const prev = document.getElementById('khamar-invoice-print-frame');
  if (prev?.parentNode) prev.parentNode.removeChild(prev);

  const iframe = document.createElement('iframe');
  iframe.id = 'khamar-invoice-print-frame';
  iframe.setAttribute('title', 'invoice-print');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    throw new Error('Could not prepare invoice for print');
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    try {
      win.removeEventListener('afterprint', cleanup);
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 300);
  };

  win.addEventListener('afterprint', cleanup);

  // Let the invoice layout paint, then open print dialog (Save as PDF)
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (err) {
      cleanup();
      throw err;
    }
    // Fallback cleanup if afterprint never fires (some browsers)
    setTimeout(cleanup, 60_000);
  }, 250);
}
