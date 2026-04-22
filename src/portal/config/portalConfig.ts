export interface PortalConfig {
  projectName: string;
  baseUrl: string;
  timeoutMs: number;
}

export const portalConfig: PortalConfig = {
  projectName: "PharmaNova",
  baseUrl: "https://dev.nexus.shipperform.devlop.systems/#/login",
  timeoutMs: 10000,
};
