import { useDesktopWeb, WebHisab } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';

import { inventoryApi, organizationApi } from '@/api';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ListRow,
  LoadingBlock,
  PageHeader,
  Screen,
  StatCard,
} from '@/components/ui/primitives';
import { formatBdt, formatDate } from '@/lib/format';
import { buildHisabInvoiceHtml } from '@/lib/hisab-pdf';
import { downloadInvoicePdf } from '@/lib/print-invoice';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';

function HisabScreen() {
  const { t, locale } = useLocale();
  const { organization, user } = useAuth();
  const [printing, setPrinting] = useState(false);

  const costs = useQuery({
    queryKey: ['costs', 'hisab'],
    queryFn: () => inventoryApi.listCosts(1, 200),
  });
  const sales = useQuery({
    queryKey: ['sales', 'hisab'],
    queryFn: () => inventoryApi.listSales(1, 200),
  });
  const org = useQuery({
    queryKey: ['organization'],
    queryFn: organizationApi.get,
  });

  const costList = costs.data?.data ?? [];
  const saleList = sales.data?.data ?? [];

  const totals = useMemo(() => {
    const totalCost = costList.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
    const totalIncome = saleList.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
    const net = totalIncome - totalCost;
    return { totalCost, totalIncome, net };
  }, [costList, saleList]);

  const onDownloadPdf = async () => {
    try {
      setPrinting(true);
      const html = buildHisabInvoiceHtml({
        org: org.data ?? organization,
        orgFallbackName: organization?.name || 'Khamar Manager',
        preparedBy: user?.name,
        costs: costList,
        sales: saleList,
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
      await downloadInvoicePdf(html, t('downloadPdf'));
    } catch (err) {
      Alert.alert('PDF', err instanceof Error ? err.message : 'Failed');
    } finally {
      setPrinting(false);
    }
  };

  const loading = costs.isLoading || sales.isLoading;
  const isProfit = totals.net >= 0;

  return (
    <Screen>
      <PageHeader title={t('hisabTitle')} subtitle={t('hisabSubtitle')} />

      <Button
        title={t('downloadPdf')}
        onPress={onDownloadPdf}
        loading={printing}
        className="mb-4"
      />

      <ScrollView
        contentContainerClassName="gap-3 pb-12"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={costs.isRefetching || sales.isRefetching}
            onRefresh={() => {
              costs.refetch();
              sales.refetch();
              org.refetch();
            }}
          />
        }>
        {loading ? <LoadingBlock /> : null}

        {!loading ? (
          <View className="flex-row flex-wrap gap-3">
            <StatCard label={t('totalIncome')} value={formatBdt(totals.totalIncome)} tone="accent" />
            <StatCard label={t('totalCost')} value={formatBdt(totals.totalCost)} tone="loss" />
            <StatCard
              label={isProfit ? t('profit') : t('loss')}
              value={formatBdt(Math.abs(totals.net))}
              tone={isProfit ? 'profit' : 'loss'}
            />
          </View>
        ) : null}

        <AppText variant="subtitle" className="mt-3">
          {t('allSales')}
        </AppText>
        {saleList.length ? (
          saleList.map((sale) => (
            <Card key={sale._id} className="py-3">
              <ListRow
                title={sale.saleNumber ?? t('sales')}
                subtitle={formatDate(sale.saleDate)}
                right={<AppText variant="subtitle">{formatBdt(sale.totalAmount)}</AppText>}
              />
            </Card>
          ))
        ) : (
          <EmptyState title={t('sales')} subtitle="—" />
        )}

        <AppText variant="subtitle" className="mt-2">
          {t('allCosts')}
        </AppText>
        {costList.length ? (
          costList.map((cost) => (
            <Card key={cost._id} className="py-3">
              <ListRow
                title={cost.categoryName ?? cost.costType}
                subtitle={`${formatDate(cost.costDate)}${cost.description ? ` · ${cost.description}` : ''}`}
                right={<AppText variant="subtitle">{formatBdt(cost.totalAmount)}</AppText>}
              />
            </Card>
          ))
        ) : (
          <EmptyState title={t('noCostsYet')} subtitle={t('noCostsHint')} />
        )}
      </ScrollView>
    </Screen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebHisab /> : <HisabScreen />;
}
