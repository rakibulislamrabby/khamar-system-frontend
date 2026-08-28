import { PropsWithChildren, ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocale } from '@/providers/locale-provider';

type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label' | 'money';

const textVariants: Record<TextVariant, string> = {
  display: 'text-3xl font-bold tracking-tight text-ink',
  title: 'text-2xl font-bold tracking-tight text-ink',
  subtitle: 'text-base font-semibold text-ink',
  body: 'text-[15px] leading-6 text-ink',
  caption: 'text-sm leading-5 text-muted',
  label: 'text-2xs font-semibold uppercase tracking-wide text-muted',
  money: 'text-xl font-bold tabular-nums text-ink',
};

export function Screen({
  children,
  padded = true,
  className = '',
  scroll = false,
}: PropsWithChildren<{ padded?: boolean; className?: string; scroll?: boolean }>) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 bg-rice ${padded ? 'px-4' : ''} ${className}`}
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + (scroll ? 8 : 16),
      }}>
      {children}
    </View>
  );
}

export function AppText({
  children,
  variant = 'body',
  className = '',
  numberOfLines,
}: PropsWithChildren<{
  variant?: TextVariant;
  className?: string;
  numberOfLines?: number;
}>) {
  return (
    <Text numberOfLines={numberOfLines} className={`${textVariants[variant]} ${className}`}>
      {children}
    </Text>
  );
}

export function Card({
  children,
  className = '',
  onPress,
}: PropsWithChildren<{ className?: string; onPress?: () => void }>) {
  const content = (
    <View className={`rounded-2xl border border-line bg-white p-4 ${className}`}>{children}</View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} className="active:opacity-90">
      {content}
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const isDisabled = disabled || loading;

  const variants = {
    primary: 'bg-padma border-padma',
    secondary: 'bg-padma-soft border-padma-soft',
    ghost: 'bg-transparent border-line',
    danger: 'bg-danger border-danger',
  };

  const textVariantsMap = {
    primary: 'text-white',
    secondary: 'text-padma',
    ghost: 'text-ink',
    danger: 'text-white',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`min-h-[52px] items-center justify-center rounded-xl border px-5 ${variants[variant]} ${
        isDisabled ? 'opacity-55' : 'active:opacity-90'
      } ${className}`}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#006A4E' : '#fff'} />
      ) : (
        <Text className={`text-base font-bold ${textVariantsMap[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  secureTextEntry,
  compact = false,
  className = '',
  ...props
}: TextInputProps & { label: string; error?: string; compact?: boolean; className?: string }) {
  const [visible, setVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View className={`${compact ? 'gap-1' : 'gap-1.5'} ${className}`}>
      <AppText variant="label">{label}</AppText>
      <View className="relative">
        <TextInput
          placeholderTextColor="#5C7266"
          secureTextEntry={isPassword && !visible}
          className={`${compact ? 'min-h-[44px] text-[14px]' : 'min-h-[52px] text-[15px]'} rounded-xl border bg-white px-4 text-ink ${
            error ? 'border-danger' : 'border-line'
          } ${isPassword ? 'pr-12' : ''}`}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={10}
            className="absolute right-3 top-0 bottom-0 w-10 items-center justify-center">
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#5C7266"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
    </View>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'profit' | 'loss' | 'accent';
}) {
  const bar =
    tone === 'profit'
      ? 'bg-paddy'
      : tone === 'loss'
        ? 'bg-danger'
        : tone === 'accent'
          ? 'bg-jute'
          : 'bg-padma';

  return (
    <Card className="relative min-w-[46%] flex-1 overflow-hidden pl-5">
      <View className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl ${bar}`} />
      <AppText variant="caption">{label}</AppText>
      <AppText variant="money" className="mt-1">
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" className="mt-1">
          {hint}
        </AppText>
      ) : null}
    </Card>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between">
      <AppText variant="subtitle">{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} className="py-1">
          <AppText variant="caption" className="font-semibold text-padma">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Card className="items-start">
      <AppText variant="subtitle">{title}</AppText>
      {subtitle ? <AppText variant="caption" className="mt-1.5">{subtitle}</AppText> : null}
    </Card>
  );
}

export function LoadingBlock() {
  const { t } = useLocale();

  return (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color="#006A4E" />
      <AppText variant="caption" className="mt-3">
        {t('loadingKhamar')}
      </AppText>
    </View>
  );
}

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    neutral: 'bg-mist',
    success: 'bg-padma-soft',
    warning: 'bg-amber-50',
    danger: 'bg-red-50',
  };
  const text = {
    neutral: 'text-muted',
    success: 'text-paddy',
    warning: 'text-warning',
    danger: 'text-danger',
  };

  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${tones[tone]}`}>
      <Text className={`text-2xs font-bold ${text[tone]}`}>{label}</Text>
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="mb-5">
      <AppText variant="title">{title}</AppText>
      {subtitle ? <AppText variant="caption" className="mt-1.5">{subtitle}</AppText> : null}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ key: T; label: string }>;
  onChange: (key: T) => void;
}) {
  return (
    <View className="mb-4 flex-row gap-2">
      {options.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`flex-1 items-center rounded-xl border py-3 ${
              active ? 'border-padma bg-padma' : 'border-line bg-white'
            }`}>
            <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-ink'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="min-w-0 flex-1">
        <AppText variant="subtitle" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" className="mt-1" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function OptionChips({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <View className="gap-1.5">
      <AppText variant="label">{label}</AppText>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`rounded-full border px-3.5 py-2 ${
                active ? 'border-padma bg-padma' : 'border-line bg-white'
              }`}>
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
    </View>
  );
}

export function FormBackHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View className="mb-5 flex-row items-center gap-3">
      <Pressable
        onPress={onBack}
        hitSlop={10}
        className="h-10 w-10 items-center justify-center rounded-xl border border-line bg-white">
        <Ionicons name="arrow-back" size={20} color="#1A2E24" />
      </Pressable>
      <AppText variant="title" className="flex-1">
        {title}
      </AppText>
    </View>
  );
}
