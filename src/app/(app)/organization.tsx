import { useDesktopWeb, WebOrganization } from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { organizationApi } from '@/api';
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Screen,
} from '@/components/ui/primitives';
import { formatDate, labelize } from '@/lib/format';
import { useLocale } from '@/providers/locale-provider';

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="mb-3 flex-row items-start justify-between gap-4">
      <AppText variant="caption" className="w-28">
        {label}
      </AppText>
      <AppText variant="body" className="flex-1 text-right">
        {value}
      </AppText>
    </View>
  );
}

function OrganizationScreen() {
  const { t } = useLocale();
  const query = useQuery({
    queryKey: ['organization'],
    queryFn: organizationApi.get,
  });

  const org = query.data;

  return (
    <Screen>
      <PageHeader title="Organization" subtitle="খামার profile aligned with API fields" />

      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? (
        <EmptyState
          title="Could not load organization"
          subtitle={query.error instanceof Error ? query.error.message : undefined}
        />
      ) : null}

      {org ? (
        <Card>
          <View className="mb-4 flex-row items-center gap-3">
            <View className="min-w-0 flex-1">
              <AppText variant="subtitle">{org.name}</AppText>
              <AppText variant="caption" className="mt-1">
                Owner: {org.ownerName}
              </AppText>
            </View>
            <Badge label={labelize(org.farmType)} tone="success" />
          </View>

          <View className="mb-4 h-px bg-line" />

          <Row label="Phone" value={org.phone} />
          <Row label="Email" value={org.email} />
          <Row label="District" value={org.district} />
          <Row label="Upazila" value={org.upazila} />
          <Row label="Address" value={org.address || org.location} />
          <Row
            label="Purpose"
            value={
              org.farmType === 'cow'
                ? org.cowPurpose === 'beef'
                  ? t('logicFattenTitle')
                  : org.cowPurpose === 'mixed'
                    ? t('logicBothTitle')
                    : t('logicDairyTitle')
                : labelize(org.poultryPurpose)
            }
          />
          <Row label="Trade license" value={org.tradeLicense} />
          <Row label="TIN" value={org.tinNumber} />
          <Row label="BIN/VAT" value={org.binVatNumber} />
          <Row label="Established" value={formatDate(org.establishedDate)} />
          {org.mobileBanking?.provider ? (
            <Row
              label="Mobile banking"
              value={`${labelize(org.mobileBanking.provider)} · ${org.mobileBanking.accountNumber ?? ''}`}
            />
          ) : null}
          {org.bankInfo?.bankName ? (
            <Row
              label="Bank"
              value={`${org.bankInfo.bankName}${org.bankInfo.branch ? ` (${org.bankInfo.branch})` : ''}`}
            />
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

export default function Route() {
  return useDesktopWeb() ? <WebOrganization /> : <OrganizationScreen />;
}
