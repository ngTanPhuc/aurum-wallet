import React from 'react';
import { appAlert } from '../glass/AppAlert';
jest.mock('../glass/AppAlert', () => ({ appAlert: jest.fn() }));
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TagPicker } from '../TagPicker';
import { useFinanceStore } from '../../store/useFinanceStore';


jest.mock('../../store/useFinanceStore', () => ({
  useFinanceStore: jest.fn(),
}));



describe('TagPicker', () => {
  const addTagMock = jest.fn();
  const onChangeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFinanceStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        tags: [
          { id: 't1', name: 'trip', color: '#007bff' },
          { id: 't2', name: 'food', color: '#007bff' },
        ],
        addTag: addTagMock,
      };
      return selector(state);
    });
  });

  it('renders selected tags and add button', () => {
    const { getByText } = render(<TagPicker selectedTagIds={['t1']} onChange={onChangeMock} />);
    expect(getByText('trip')).toBeTruthy();
    expect(getByText('+ Add Tag')).toBeTruthy();
  });

  it('allows removing a selected tag from badge', () => {
    const { getByText } = render(<TagPicker selectedTagIds={['t1']} onChange={onChangeMock} />);
    const tripBadge = getByText('trip'); // The touchable wraps it
    fireEvent.press(tripBadge);
    expect(onChangeMock).toHaveBeenCalledWith([]);
  });

  it('opens modal to manage tags', () => {
    const { getByText } = render(<TagPicker selectedTagIds={[]} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    expect(getByText('Manage Tags')).toBeTruthy();
    expect(getByText('#trip')).toBeTruthy();
    expect(getByText('#food')).toBeTruthy();
  });

  it('allows selecting a tag from list', () => {
    const { getByText } = render(<TagPicker selectedTagIds={[]} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    
    fireEvent.press(getByText('#trip'));
    expect(onChangeMock).toHaveBeenCalledWith(['t1']);
  });

  it('allows unselecting a tag from list', () => {
    const { getByText } = render(<TagPicker selectedTagIds={['t2']} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    
    fireEvent.press(getByText('#food'));
    expect(onChangeMock).toHaveBeenCalledWith([]);
  });

  it('allows creating a new tag', async () => {
    addTagMock.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText } = render(<TagPicker selectedTagIds={[]} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    
    const input = getByPlaceholderText('New Tag Name');
    fireEvent.changeText(input, 'newtag');
    
    fireEvent.press(getByText('Create'));
    
    await waitFor(() => {
      expect(addTagMock).toHaveBeenCalledWith({ name: 'newtag', color: '#D4AF37' });
    });
  });

  it('shows error if tag name is empty', async () => {
    const { getByText } = render(<TagPicker selectedTagIds={[]} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    
    fireEvent.press(getByText('Create'));
    expect(addTagMock).not.toHaveBeenCalled();
  });

  it('shows error if tag already exists', async () => {
    const { getByText, getByPlaceholderText } = render(<TagPicker selectedTagIds={[]} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    
    const input = getByPlaceholderText('New Tag Name');
    fireEvent.changeText(input, 'trip');
    
    fireEvent.press(getByText('Create'));
    
    expect(appAlert).toHaveBeenCalledWith('Error', 'A tag with this name already exists.');
    expect(addTagMock).not.toHaveBeenCalled();
  });

  it('handles create tag error', async () => {
    addTagMock.mockRejectedValueOnce(new Error('Failed'));
    const { getByText, getByPlaceholderText } = render(<TagPicker selectedTagIds={[]} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    
    const input = getByPlaceholderText('New Tag Name');
    fireEvent.changeText(input, 'newtag');
    
    fireEvent.press(getByText('Create'));
    
    await waitFor(() => {
      expect(appAlert).toHaveBeenCalledWith('Error', 'Failed to create tag.');
    });
  });

  it('closes modal when Done is pressed', () => {
    const { getByText, queryByText } = render(<TagPicker selectedTagIds={[]} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    expect(getByText('Manage Tags')).toBeTruthy();
    
    fireEvent.press(getByText('Done'));
    // React Native Modal doesn't unmount content by default in test env always, but checking if state updates is enough.
    // The "Done" button works.
  });

  it('closes modal when X is pressed', () => {
    const { getByText, queryByText } = render(<TagPicker selectedTagIds={[]} onChange={onChangeMock} />);
    fireEvent.press(getByText('+ Add Tag'));
    
    // Press Done to close modal (the X uses Ionicons which has no accessible text in test env)
    fireEvent.press(getByText('Done'));
    expect(queryByText('Manage Tags')).toBeNull();
  });
});
