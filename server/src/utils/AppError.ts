export class AppError extends Error {
  public fields?: Record<string, string>;

  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.fields = fields;
  }
}
