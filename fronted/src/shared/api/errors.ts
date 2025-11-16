export class UnauthorizedError extends Error {
  constructor(message = '401 Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}










