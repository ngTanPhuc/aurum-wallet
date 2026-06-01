import React from 'react';
import { render } from '@testing-library/react-native';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  it('renders basic props correctly', () => {
    const { getByText } = render(
      <MetricCard title="Total Balance" value="$1,000" icon="💰" />
    );
    expect(getByText('Total Balance')).toBeTruthy();
    expect(getByText('$1,000')).toBeTruthy();
    expect(getByText('💰')).toBeTruthy();
  });

  it('renders subtitle without trend', () => {
    const { getByText } = render(
      <MetricCard title="Total" value="100" icon="i" subtitle="Subtitle here" />
    );
    expect(getByText('Subtitle here')).toBeTruthy();
  });

  it('renders up trend icon', () => {
    const { getByText } = render(
      <MetricCard title="Total" value="100" icon="i" subtitle="Up" trend="up" />
    );
    expect(getByText('▲')).toBeTruthy();
    expect(getByText('Up')).toBeTruthy();
  });

  it('renders down trend icon', () => {
    const { getByText } = render(
      <MetricCard title="Total" value="100" icon="i" subtitle="Down" trend="down" />
    );
    expect(getByText('▼')).toBeTruthy();
    expect(getByText('Down')).toBeTruthy();
  });
});
