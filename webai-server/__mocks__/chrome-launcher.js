module.exports = {
  launch: jest.fn(async () => ({
    port: 9222,
    kill: jest.fn().mockResolvedValue(undefined),
    pid: 12345,
  })),
};

