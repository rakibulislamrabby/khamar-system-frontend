import { useCallback, useState } from 'react';

import { useOrg } from '@/components/dashboard/data';
import { buildHisabInvoiceHtml } from '@/lib/hisab-pdf';
import { downloadInvoicePdf } from '@/lib/print-invoice';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import type { Cost, Sale } from '@/types/api';

/** Same invoice template as the Android app's Hisab PDF, reused for single sales and periods. */
export function useInvoicePdf() {
  const { t, locale } = useLocale();
  const { user, organization } = useAuth();
  const org = useOrg();
  const [busy, setBusy] = useState(false);

  const download = useCallback(
    async (title: string, sales: Sale[], costs: Cost[] = []) => {
      setBusy(true);
      try {
        const html = buildHisabInvoiceHtml({
          org: org.data ?? organization,
          orgFallbackName: organization?.name || 'Khamar Manager',
          preparedBy: user?.name,
          costs,
          sales,
          locale,
          labels: {
            appName: t('appName'),
            invoiceNo: t('invoiceNoLabel'),
            phone: t('phoneShort'),
            product: t('pdfProduct'),
            qtyUnit: t('pdfQtyUnit'),
            rate: t('pdfRate'),
            amount: t('amount'),
            sl: t('slNo'),
            salesSection: t('allSales'),
            costsSection: t('allCosts'),
            totalIncome: t('totalIncomeShort'),
            totalCost: t('totalCostShort'),
            netResult: t('netResult'),
            profit: t('profit'),
            loss: t('loss'),
            comments: t('pdfComments'),
            authorizedSign: t('authorizedSign'),
            softwareBy: t('softwareBy'),
            logoSoon: t('logoSoon'),
            hisabParty: t('hisabParty'),
            owner: t('ownerName'),
          },
        });
        await downloadInvoicePdf(html, title);
      } finally {
        setBusy(false);
      }
    },
    [org.data, organization, user?.name, locale, t]
  );

  return { download, busy };
}
