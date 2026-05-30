declare module "midtrans-client" {
  export class CoreApi {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
    charge(parameter: Record<string, unknown>): Promise<Record<string, unknown>>;
  }
}
