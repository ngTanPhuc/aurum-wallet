import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InsightCard } from '../InsightCard';
import { Insight } from '../../types';

describe('InsightCard', () => {
  const defaultInsight: Insight = {
    id: '1',
    type: 'info',
    title: 'Info Title',
    description: 'Info Description',
  };

  it('renders info insight correctly', () => {
    const { getByText } = render(<InsightCard insight={defaultInsight} />);
    expect(getByText('Info Title')).toBeTruthy();
    expect(getByText('Info Description')).toBeTruthy();
  });

  it('renders alert insight with correct colors (implied by type)', () => {
    const insight: Insight = { ...defaultInsight, type: 'alert', icon: '⚠️' };
    const { getByText } = render(<InsightCard insight={insight} />);
    expect(getByText('⚠️')).toBeTruthy();
  });

  it('renders warning insight correctly', () => {
    const insight: Insight = { ...defaultInsight, type: 'warning' };
    const { getByText } = render(<InsightCard insight={insight} />);
    expect(getByText('Info Title')).toBeTruthy();
  });

  it('renders success insight correctly', () => {
    const insight: Insight = { ...defaultInsight, type: 'success' };
    const { getByText } = render(<InsightCard insight={insight} />);
    expect(getByText('Info Title')).toBeTruthy();
  });

  it('renders action button and triggers callback', () => {
    const mockOnActionPress = jest.fn();
    const insight: Insight = {
      ...defaultInsight,
      actionLabel: 'Click Me',
      actionRoute: 'TargetRoute',
    };
    
    const { getByText } = render(<InsightCard insight={insight} onActionPress={mockOnActionPress} />);
    
    const actionBtn = getByText('Click Me');
    expect(actionBtn).toBeTruthy();
    
    fireEvent.press(actionBtn);
    expect(mockOnActionPress).toHaveBeenCalledWith('TargetRoute');
  });

  it('does not render action button if missing route', () => {
    const insight: Insight = {
      ...defaultInsight,
      actionLabel: 'Click Me',
    };
    
    const { queryByText } = render(<InsightCard insight={insight} />);
    expect(queryByText('Click Me')).toBeNull();
  });
});
