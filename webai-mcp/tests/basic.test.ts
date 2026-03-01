describe('Basic Test Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to Jest globals', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('should be able to create mocks', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should handle async operations', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success');
    const result = await asyncFn();
    expect(result).toBe('success');
  });

  it('should handle promises', () => {
    return Promise.resolve('test').then(result => {
      expect(result).toBe('test');
    });
  });
});
